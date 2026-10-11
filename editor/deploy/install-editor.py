#!/usr/bin/env python3
"""Install the editor from this checkout/archive, independently of the cwd.

Builds run without root privileges. Privileged templates are captured before
building, and app/config backups remain available after installation.
"""
import argparse
import fcntl
import fnmatch
import grp
import json
import os
from pathlib import Path
import pwd
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
import urllib.error
import base64


class InstallError(RuntimeError):
    pass


class Installer:
    APP = '/opt/bbb-recording-editor'
    ENV = '/etc/bbb-recording-editor.env'
    AUTH = '/etc/nginx/bbb-recording-editor.htpasswd'
    NGINX = '/etc/bigbluebutton/nginx/recording-editor.nginx'
    UNIT = '/etc/systemd/system/bbb-recording-editor.service'
    HELPER = '/usr/local/sbin/bbb-recording-editor-rebuild'
    SUDOERS = '/etc/sudoers.d/bbb-recording-editor'
    DROPIN = '/etc/systemd/system/bbb-recording-editor.service.d/rebuild.conf'

    def __init__(self, source, options, root=Path('/')):
        self.source, self.options, self.root = Path(source).resolve(), options, Path(root)
        self.stage = self.backup = self.old_app = None
        self.switched = self.config_started = False
        self.saved_files = {}
        self.state_attributes = None
        self.state_created = False

    def path(self, absolute):
        return self.root / absolute.lstrip('/')

    def run(self, args, *, check=True, capture=False, **kwargs):
        result = subprocess.run(args, text=True, stdout=subprocess.PIPE if capture else None,
                                stderr=subprocess.PIPE if capture else None, **kwargs)
        if check and result.returncode:
            raise InstallError(f"Command failed ({result.returncode}): {shlex.join(args)}\n{result.stderr or ''}")
        return result

    def available(self, command):
        return bool(shutil.which(command))

    def account(self, name):
        return pwd.getpwnam(name)

    def nginx_group(self):
        return grp.getgrnam('www-data').gr_gid

    def dependencies(self):
        packages = []
        if not self.available('/usr/bin/ruby') or self.run(
                ['runuser', '-u', 'bigbluebutton', '--', '/usr/bin/ruby', '-e',
                 'abort "Ruby 3.0+ required" if RUBY_VERSION.to_f < 3; require "nokogiri"; require "webrick"'],
                check=False, capture=True).returncode:
            packages += ['ruby', 'ruby-nokogiri', 'ruby-webrick']
        if not all(self.available(x) for x in ['ffmpeg', 'ffprobe']):
            packages.append('ffmpeg')
        if not self.available('htpasswd'):
            packages.append('apache2-utils')
        if not self.available('/usr/bin/sudo'):
            packages.append('sudo')
        if packages:
            if self.options.skip_dependencies:
                raise InstallError('Missing dependencies: ' + ', '.join(packages))
            self.run(['apt-get', 'install', '--yes', *packages])
        for command in ['/usr/bin/ruby', '/usr/bin/python3', '/usr/bin/sudo', '/usr/sbin/visudo',
                        '/usr/bin/bbb-record', 'ffmpeg', 'ffprobe', 'htpasswd', 'nginx', 'systemctl', 'runuser']:
            if not self.available(command):
                raise InstallError(f'Required executable is missing: {command}')
        self.run(['runuser', '-u', 'bigbluebutton', '--', '/usr/bin/ruby', '-e',
                  'abort "Ruby 3.0+ required" if RUBY_VERSION.to_f < 3; require "nokogiri"; require "webrick"'])

    def settings(self, templates):
        env_path = self.path(self.ENV)
        self.env_text = env_path.read_text() if env_path.exists() else templates['bbb-recording-editor.env.example']
        self.env = {}
        for number, line in enumerate(self.env_text.splitlines(), 1):
            if not line.strip() or line.lstrip().startswith('#'):
                continue
            match = re.fullmatch(r'\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)', line)
            if not match:
                raise InstallError(f'Unsupported environment-file syntax on line {number}; configure it manually.')
            try:
                self.env[match[1]] = ' '.join(shlex.split(match[2]))
            except ValueError as error:
                raise InstallError(f'Unsupported environment-file quoting on line {number}.') from error
        self.prefix = self.env.get('BBB_EDITOR_PREFIX', '/recording-editor').rstrip('/')
        if not re.fullmatch(r'/[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)*', self.prefix):
            raise InstallError('BBB_EDITOR_PREFIX must be a simple absolute URL path.')
        try:
            self.port = int(self.env.get('BBB_EDITOR_PORT', '8099'))
        except ValueError as error:
            raise InstallError('Invalid BBB_EDITOR_PORT.') from error
        if not 1024 <= self.port <= 65535:
            raise InstallError('BBB_EDITOR_PORT must be between 1024 and 65535.')
        self.raw = self.env.get('BBB_EDITOR_RAW_ROOT', '/var/bigbluebutton/recording/raw')
        self.state = self.env.get('BBB_EDITOR_STATE_ROOT', '/var/lib/bbb-recording-editor')
        for value in [self.raw, self.state]:
            if not Path(value).is_absolute() or '\n' in value or '\r' in value:
                raise InstallError('Raw/state directories must be absolute paths.')
            target = self.path(self.APP).resolve()
            directory = self.path(value).resolve()
            if directory == target or target in directory.parents:
                raise InstallError('Raw/state directories must be outside the application directory.')
        protected = ['/', '/opt', '/etc', '/usr', '/usr/local', '/var', '/var/lib',
                     '/var/backups', '/home', '/root', '/srv', '/tmp', '/run', '/var/tmp']
        state = self.path(self.state).resolve()
        if state in [self.path(name).resolve() for name in protected]:
            raise InstallError('Use a dedicated state directory, not a shared system directory.')
        self.env_text = re.sub(r'^[ \t]*BBB_EDITOR_BUILD_ROOT=.*$', 'BBB_EDITOR_BUILD_ROOT=' + self.APP + '/build-editor',
                               self.env_text, flags=re.MULTILINE)
        if 'BBB_EDITOR_BUILD_ROOT' not in self.env:
            self.env_text += '\nBBB_EDITOR_BUILD_ROOT=' + self.APP + '/build-editor\n'
        if bool(self.env.get('BBB_EDITOR_USERNAME')) != bool(self.env.get('BBB_EDITOR_PASSWORD')):
            raise InstallError('Set both BBB_EDITOR_USERNAME and BBB_EDITOR_PASSWORD, or neither.')

    def check_nginx_include(self):
        text = self.run(['nginx', '-T'], capture=True).stdout
        includes = re.findall(r'^\s*include\s+["\']?([^;"\'\s]+)["\']?\s*;', text, re.MULTILINE)
        if not any(fnmatch.fnmatch(self.NGINX, pattern) for pattern in includes):
            raise InstallError('The existing BBB HTTPS server must include /etc/bigbluebutton/nginx/*.nginx. '
                               'See editor/README.md for custom Nginx layouts.')

    def copy_and_build(self):
        target = self.path(self.APP)
        target.parent.mkdir(parents=True, exist_ok=True)
        self.stage = Path(tempfile.mkdtemp(prefix='.bbb-recording-editor.stage-', dir=target.parent))
        excluded = ['node_modules', 'build', 'build-editor', '.npm-cache', '.env*']
        # A download directly in /opt must not recursively copy its own stage.
        excluded += [self.stage.name, target.name] if self.source == target.parent else []
        shutil.copytree(self.source, self.stage, dirs_exist_ok=True, symlinks=True,
                        ignore=shutil.ignore_patterns(*excluded))
        if self.options.skip_build:
            shutil.copytree(self.source / 'build-editor', self.stage / 'build-editor', symlinks=True)
        else:
            for directory, dirs, files in os.walk(self.stage):
                for entry in [Path(directory), *[Path(directory) / n for n in dirs + files]]:
                    os.chown(entry, self.builder.pw_uid, self.builder.pw_gid, follow_symlinks=False)
            environment = {'PATH': os.environ.get('PATH', os.defpath), 'LANG': 'C.UTF-8',
                           'npm_config_cache': str(self.stage / '.npm-cache'), 'CI': 'true',
                           'BUILD_PATH': 'build-editor', 'PUBLIC_URL': self.prefix,
                           'REACT_APP_RECORDING_EDITOR': '1', 'REACT_APP_EDITOR_PREFIX': self.prefix}
            self.run(['runuser', '-u', self.builder.pw_name, '--', 'npm', 'ci', '--no-audit', '--no-fund'],
                     cwd=self.stage, env=environment)
            self.run(['runuser', '-u', self.builder.pw_name, '--', 'node',
                      'node_modules/react-scripts/scripts/build.js'], cwd=self.stage, env=environment)
        build = self.stage / 'build-editor'
        manifest = json.loads((build / 'asset-manifest.json').read_text())
        if not (build / 'index.html').is_file() or 'main.js' not in manifest.get('files', {}):
            raise InstallError('Editor build is incomplete.')
        for url in manifest['files'].values():
            if not url.startswith(self.prefix + '/'):
                raise InstallError('Build uses a different URL prefix. Rebuild without --skip-build.')
            asset = (build / url[len(self.prefix) + 1:]).resolve()
            if build.resolve() not in asset.parents or not asset.is_file():
                raise InstallError('Editor build contains a missing or invalid asset.')
        for name in ['node_modules', '.npm-cache']:
            shutil.rmtree(self.stage / name, ignore_errors=True)
        for directory, dirs, files in os.walk(self.stage):
            for entry in [Path(directory), *[Path(directory) / n for n in dirs + files]]:
                os.chown(entry, 0, 0, follow_symlinks=False)
                if not entry.is_symlink():
                    entry.chmod(0o755 if entry.is_dir() or entry.stat().st_mode & 0o111 else 0o644)
        if (self.stage / '.git').is_file():
            (self.stage / '.git').unlink()  # A downloaded worktree's link is not a standalone checkout.
        elif (self.stage / '.git').is_dir():
            (self.stage / '.git').chmod(0o700)

    def write(self, absolute, content, mode):
        path = self.path(absolute)
        path.parent.mkdir(parents=True, exist_ok=True)
        descriptor, name = tempfile.mkstemp(prefix=path.name + '.', dir=path.parent)
        temporary = Path(name)
        try:
            with os.fdopen(descriptor, 'w') as file:
                file.write(content)
            temporary.chmod(mode)
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)

    def snapshot(self):
        folder = self.path('/var/backups/bbb-recording-editor')
        folder.mkdir(parents=True, exist_ok=True)
        self.backup = Path(tempfile.mkdtemp(prefix=time.strftime('%Y%m%dT%H%M%S-'), dir=folder))
        self.backup.chmod(0o700)
        for name in [self.ENV, self.AUTH, self.NGINX, self.UNIT, self.HELPER, self.SUDOERS, self.DROPIN]:
            path = self.path(name)
            self.saved_files[name] = None
            if path.exists():
                stat = path.stat()
                self.saved_files[name] = {'uid': stat.st_uid, 'gid': stat.st_gid}
                saved = self.backup / name.lstrip('/')
                saved.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, saved)
        self.active = self.run(['systemctl', 'is-active', '--quiet', 'bbb-recording-editor'], check=False).returncode == 0
        self.enabled = self.run(['systemctl', 'is-enabled', '--quiet', 'bbb-recording-editor'], check=False).returncode == 0
        self.journal('prepared')

    def journal(self, status):
        (self.backup / 'installation.json').write_text(json.dumps(
            {'status': status, 'source': str(self.source), 'old_app': str(self.old_app) if self.old_app else None,
             'files': self.saved_files, 'was_active': self.active, 'was_enabled': self.enabled}, indent=2))

    def configure(self, templates):
        self.config_started = True
        self.write(self.ENV, self.env_text, 0o600)
        self.write(self.UNIT, templates['bbb-recording-editor.service'], 0o644)
        auth = self.path(self.AUTH)
        if not auth.exists():
            auth.parent.mkdir(parents=True, exist_ok=True)
            command = ['htpasswd', '-B', '-c', str(auth), self.options.admin_user]
            if self.options.password_file:
                command.insert(1, '-i')
                with self.options.password_file.open() as password:
                    self.run(command, stdin=password)
            else:
                self.run(command)
        os.chown(auth, 0, self.nginx_group())
        auth.chmod(0o640)
        nginx = self.path(self.NGINX)
        if not nginx.exists():
            self.write(self.NGINX, templates['nginx.conf'].replace('/recording-editor', self.prefix)
                       .replace('127.0.0.1:8099', f'127.0.0.1:{self.port}'), 0o644)
        else:
            text = nginx.read_text()
            text = '\n'.join(line.split('#', 1)[0] for line in text.splitlines())
            expected = [r'location\s+\^~\s+' + re.escape(self.prefix + '/') + r'\s*\{',
                        r'proxy_pass\s+http://127\.0\.0\.1:' + str(self.port) + r'\s*;',
                        r'auth_basic_user_file\s+' + re.escape(self.AUTH) + r'\s*;',
                        r'auth_basic\s+(?!off\s*;)[^;]+;']
            if not all(re.search(pattern, text) for pattern in expected):
                raise InstallError('Existing editor Nginx settings do not match the environment file; '
                                   'adjust the existing snippet manually. It has not been replaced.')
        helper = templates['bbb-recording-editor-rebuild']
        expected = "RAW_ROOT = Path('/var/bigbluebutton/recording/raw')"
        if expected not in helper:
            raise InstallError('Unexpected rebuild helper template.')
        self.write(self.HELPER, helper.replace(expected, f'RAW_ROOT = Path({self.raw!r})'), 0o755)
        self.write(self.SUDOERS, templates['bbb-recording-editor.sudoers'], 0o440)
        self.write(self.DROPIN, templates['rebuild.conf'], 0o644)
        state = self.path(self.state)
        if state.exists():
            stat = state.stat()
            self.state_attributes = (stat.st_uid, stat.st_gid, stat.st_mode & 0o7777)
        else:
            self.state_created = True
        state.mkdir(parents=True, exist_ok=True)
        os.chown(state, self.service_user.pw_uid, self.service_user.pw_gid)
        state.chmod(0o700)
        self.run(['/usr/sbin/visudo', '-cf', str(self.path('/etc/sudoers'))])
        self.run(['nginx', '-t'])
        loaded = self.run(['nginx', '-T'], capture=True).stdout
        if '# configuration file ' + self.NGINX + ':' not in loaded:
            raise InstallError('The editor Nginx snippet is not loaded by the existing configuration.')

    def wait_for_service(self):
        headers = {}
        if self.env.get('BBB_EDITOR_USERNAME'):
            token = base64.b64encode((self.env['BBB_EDITOR_USERNAME'] + ':' + self.env['BBB_EDITOR_PASSWORD']).encode())
            headers['Authorization'] = 'Basic ' + token.decode()
        for _ in range(30):
            try:
                request = urllib.request.Request(f'http://127.0.0.1:{self.port}{self.prefix}/', headers=headers)
                with urllib.request.urlopen(request, timeout=1) as response:
                    if response.status == 200:
                        return
            except (OSError, urllib.error.URLError):
                pass
            time.sleep(0.2)
        raise InstallError('Editor did not respond after restart. Check its journalctl logs.')

    def rollback(self):
        failures = []
        def attempt(action):
            try:
                action()
            except (OSError, InstallError) as error:
                failures.append(str(error))

        def restore_app():
            if self.switched or (self.old_app and self.old_app.exists()):
                self.run(['systemctl', 'stop', 'bbb-recording-editor'], check=False)
                if self.switched and self.path(self.APP).exists():
                    shutil.rmtree(self.path(self.APP))
                if self.old_app and self.old_app.exists():
                    self.old_app.rename(self.path(self.APP))
        attempt(restore_app)
        for name, attributes in self.saved_files.items():
            def restore_file(name=name, attributes=attributes):
                path = self.path(name)
                if attributes:
                    descriptor, temporary_name = tempfile.mkstemp(prefix=path.name + '.', dir=path.parent)
                    os.close(descriptor)
                    temporary = Path(temporary_name)
                    try:
                        shutil.copy2(self.backup / name.lstrip('/'), temporary)
                        os.chown(temporary, attributes['uid'], attributes['gid'])
                        os.replace(temporary, path)
                    finally:
                        temporary.unlink(missing_ok=True)
                else:
                    path.unlink(missing_ok=True)
            attempt(restore_file)
        if self.state_attributes:
            def restore_state():
                uid, gid, mode = self.state_attributes
                os.chown(self.path(self.state), uid, gid)
                self.path(self.state).chmod(mode)
            attempt(restore_state)
        elif self.state_created and self.path(self.state).exists():
            # Never remove media/history created by a service that briefly ran.
            if not any(self.path(self.state).iterdir()):
                attempt(lambda: self.path(self.state).rmdir())
        attempt(lambda: self.run(['systemctl', 'daemon-reload']))
        if not self.enabled:
            attempt(lambda: self.run(['systemctl', 'disable', 'bbb-recording-editor'], check=False))
        if self.active:
            attempt(lambda: self.run(['systemctl', 'restart', 'bbb-recording-editor']))
        else:
            attempt(lambda: self.run(['systemctl', 'stop', 'bbb-recording-editor'], check=False))
        attempt(lambda: self.run(['nginx', '-t']))
        attempt(lambda: self.run(['systemctl', 'reload', 'nginx']))
        self.journal('rollback_failed' if failures else 'rolled_back')
        if failures:
            print('Rollback needs administrator attention: ' + '; '.join(failures), file=sys.stderr)

    def install(self):
        for name in ['package.json', 'package-lock.json', 'editor/server.rb', 'src/index.js']:
            if not (self.source / name).is_file():
                raise InstallError(f'Source tree is incomplete: {name}')
        target = self.path(self.APP)
        for name in [self.APP, self.ENV, self.AUTH, self.NGINX, self.UNIT, self.HELPER, self.SUDOERS, self.DROPIN]:
            if self.path(name).is_symlink():
                raise InstallError(f'Managed path must not be a symbolic link: {name}')
        self.service_user = self.account('bigbluebutton')
        self.nginx_group()
        builder = os.environ.get('SUDO_USER', 'bigbluebutton')
        self.builder = self.account('bigbluebutton' if builder == 'root' else builder)
        templates = {name: (self.source / 'editor/deploy' / name).read_text() for name in [
            'bbb-recording-editor.env.example', 'bbb-recording-editor.service', 'nginx.conf',
            'bbb-recording-editor-rebuild', 'bbb-recording-editor.sudoers', 'rebuild.conf']}
        self.settings(templates)
        if not self.path(self.AUTH).exists() and not self.options.password_file and not sys.stdin.isatty():
            raise InstallError('First install needs an interactive password prompt or --password-file PATH.')
        if not self.options.skip_build:
            for command in ['runuser', 'node', 'npm']:
                if not self.available(command):
                    raise InstallError(f'{command} must be available in the sudo PATH before installation.')
            version = self.run(['runuser', '-u', self.builder.pw_name, '--', 'node', '-e',
                                'if (Number(process.versions.node.split(".")[0]) < 20) process.exit(1)'],
                               check=False, capture=True)
            if version.returncode:
                raise InstallError('Node.js 20+ must be available to the build user in the sudo PATH.')
        self.dependencies()
        self.check_nginx_include()
        try:
            self.copy_and_build()
            self.snapshot()
            self.configure(templates)
            self.run(['systemctl', 'stop', 'bbb-recording-editor'], check=self.active)
            if target.exists():
                self.old_app = target.with_name(target.name + '.previous-' + self.backup.name)
                target.rename(self.old_app)
            self.journal('switching')
            self.stage.rename(target)
            self.stage = None
            self.switched = True
            self.run(['systemctl', 'daemon-reload'])
            self.run(['systemctl', 'enable', 'bbb-recording-editor'])
            self.run(['systemctl', 'restart', 'bbb-recording-editor'])
            self.wait_for_service()
            self.run(['systemctl', 'reload', 'nginx'])
            self.journal('completed')
            print(f'Installed: {self.APP}\nURL: https://<BBB-host>{self.prefix}/\nBackups: {self.backup}')
            if self.old_app:
                print(f'Previous app: {self.old_app}')
        except BaseException:
            if self.config_started:
                self.rollback()
            raise
        finally:
            if self.stage:
                shutil.rmtree(self.stage, ignore_errors=True)


def main():
    parser = argparse.ArgumentParser(description='Build and install the recording editor in /opt/bbb-recording-editor.')
    parser.add_argument('--admin-user', default='admin', help='Initial Nginx administrator username; existing users are preserved.')
    parser.add_argument('--password-file', type=Path, help='First-install password file (read from stdin by htpasswd, never passed as an argument).')
    parser.add_argument('--skip-dependencies', action='store_true', help='Check dependencies without installing missing apt packages.')
    parser.add_argument('--skip-build', action='store_true', help='Use a prebuilt build-editor directory with a matching URL prefix.')
    options = parser.parse_args()
    if os.geteuid() != 0:
        parser.error('Run with sudo: sudo bash /path/to/source/deploy.sh --editor')
    if not re.fullmatch(r'[A-Za-z0-9_.-]+', options.admin_user) or options.admin_user.startswith('-'):
        parser.error('Invalid administrator username.')
    try:
        if options.password_file:
            options.password_file = options.password_file.resolve(strict=True)
        with open('/run/bbb-recording-editor-install.lock', 'a') as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as error:
                raise InstallError('Another editor installation is running.') from error
            Installer(Path(__file__).resolve().parents[2], options).install()
    except (InstallError, OSError, ValueError, KeyError) as error:
        print(f'Installation failed: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
