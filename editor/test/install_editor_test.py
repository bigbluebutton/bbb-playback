"""Exercise the installer against an isolated filesystem and mocked OS tools."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

REPO = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('install_editor', REPO / 'editor/deploy/install-editor.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FakeInstaller(module.Installer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.commands = []
        self.missing = set()
        self.fail_build = self.fail_health = self.fail_nginx = self.fail_stop = False
        self.include = True
        self.was_active = self.was_enabled = False

    def account(self, name):
        return SimpleNamespace(pw_name=name, pw_uid=os.getuid(), pw_gid=os.getgid())

    def nginx_group(self):
        return os.getgid()

    def available(self, command):
        return command not in self.missing

    def run(self, args, *, check=True, capture=False, **kwargs):
        self.commands.append((args, kwargs))
        status, output = 0, ''
        if args[:2] == ['systemctl', 'is-active']:
            status = 0 if self.was_active else 3
        elif args[:2] == ['systemctl', 'is-enabled']:
            status = 0 if self.was_enabled else 1
        elif args[:2] == ['systemctl', 'stop'] and self.fail_stop:
            self.fail_stop = False
            status = 1
        elif args[:2] == ['apt-get', 'install']:
            self.missing.clear()
        elif args[0] == 'runuser' and args[-1] == 'node_modules/react-scripts/scripts/build.js':
            if self.fail_build:
                raise module.InstallError('mock build failed')
            make_build(Path(kwargs['cwd']), kwargs['env']['PUBLIC_URL'])
        elif args[0] == 'htpasswd':
            Path(args[-2]).write_text(args[-1] + ':mock-password-hash\n')
        elif args == ['nginx', '-T']:
            output = 'include /etc/bigbluebutton/nginx/*.nginx;\n' if self.include else ''
            if self.path(self.NGINX).exists():
                output += '# configuration file ' + self.NGINX + ':\n'
        elif args == ['nginx', '-t'] and self.fail_nginx:
            self.fail_nginx = False
            raise module.InstallError('mock Nginx validation failed')
        if status and check:
            raise module.InstallError('mock command failed')
        return subprocess.CompletedProcess(args, status, output, '')

    def wait_for_service(self):
        if self.fail_health:
            raise module.InstallError('mock health check failed')


def make_build(source, prefix='/recording-editor'):
    build = source / 'build-editor'
    build.mkdir(exist_ok=True)
    (build / 'main.js').write_text('app')
    (build / 'index.html').write_text('editor')
    (build / 'asset-manifest.json').write_text(json.dumps({'files': {
        'main.js': prefix + '/main.js', 'index.html': prefix + '/index.html'}}))


class InstallEditorTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='editor-install-test-')
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        self.source = self.folder / 'download folder with spaces' / 'bbb-source'
        (self.source / 'editor').mkdir(parents=True)
        shutil.copytree(REPO / 'editor/deploy', self.source / 'editor/deploy',
                        ignore=shutil.ignore_patterns('__pycache__'))
        for name in ['package.json', 'package-lock.json', 'editor/server.rb', 'src/index.js']:
            file = self.source / name
            file.parent.mkdir(exist_ok=True)
            file.write_text('source-v1')
        self.password = self.folder / 'password'
        self.password.write_text('private-test-password\n')
        self.options = SimpleNamespace(admin_user='admin', password_file=self.password,
                                       skip_build=False, skip_dependencies=False)
        self.root = self.folder / 'isolated-server'
        self.root.mkdir()
        self.installer = FakeInstaller(self.source, self.options, root=self.root)
        self.raw = self.installer.path('/var/bigbluebutton/recording/raw')
        self.raw.mkdir(parents=True)
        (self.raw / 'events.xml').write_text('raw must stay unchanged')

    def install(self, installer=None):
        with contextlib.redirect_stdout(io.StringIO()), patch.dict(os.environ, {'SUDO_USER': 'builder'}):
            (installer or self.installer).install()

    def update_installer(self):
        installer = FakeInstaller(self.source, self.options, root=self.root)
        installer.was_active = installer.was_enabled = True
        return installer

    def journal(self, installer=None):
        return json.loads(((installer or self.installer).backup / 'installation.json').read_text())

    def test_first_install_builds_without_root_and_configures_everything(self):
        self.install()
        i = self.installer
        self.assertEqual((i.path(i.APP) / 'editor/server.rb').read_text(), 'source-v1')
        self.assertEqual((self.raw / 'events.xml').read_text(), 'raw must stay unchanged')
        self.assertFalse((self.source / 'build-editor').exists())
        self.assertIn('BBB_EDITOR_BUILD_ROOT=/opt/bbb-recording-editor/build-editor', i.path(i.ENV).read_text())
        for name in [i.UNIT, i.AUTH, i.NGINX, i.HELPER, i.SUDOERS, i.DROPIN]:
            self.assertTrue(i.path(name).is_file(), name)
        self.assertEqual(i.path(i.ENV).stat().st_mode & 0o777, 0o600)
        self.assertEqual(i.path(i.AUTH).stat().st_mode & 0o777, 0o640)
        self.assertEqual(i.path(i.SUDOERS).stat().st_mode & 0o777, 0o440)
        self.assertEqual(self.journal()['status'], 'completed')
        build_calls = [(args, kw) for args, kw in i.commands if args[0] == 'runuser' and ('npm' in args or args[-1].endswith('build.js'))]
        self.assertEqual(len(build_calls), 2)
        self.assertTrue(all(args[:4] == ['runuser', '-u', 'builder', '--'] for args, _ in build_calls))
        self.assertTrue(all(str(kw['cwd']).startswith(str(i.path('/opt'))) for _, kw in build_calls))
        self.assertNotIn('private-test-password', repr(i.commands))

    def test_update_preserves_custom_settings_credentials_and_history(self):
        self.install()
        i = self.installer
        env = i.path(i.ENV).read_text().replace('BBB_EDITOR_PORT=8099', 'BBB_EDITOR_PORT=8199')
        env = env.replace('/var/bigbluebutton/recording/raw', '/srv/raw')
        env += '\nBBB_EDITOR_PREFIX=/custom/editor\nBBB_EDITOR_USERNAME=internal\nBBB_EDITOR_PASSWORD=secret\n'
        i.path(i.ENV).write_text(env)
        nginx = i.path(i.NGINX).read_text().replace('8099', '8199').replace('/recording-editor', '/custom/editor')
        i.path(i.NGINX).write_text(nginx)
        auth = i.path(i.AUTH).read_bytes()
        history = i.path('/var/lib/bbb-recording-editor') / 'saved.json'
        history.write_text('saved-history')
        (self.source / 'editor/server.rb').write_text('source-v2')
        update = self.update_installer()
        self.install(update)
        self.assertEqual(update.path(update.ENV).read_text(), env)
        self.assertEqual(update.path(update.AUTH).read_bytes(), auth)
        self.assertEqual(update.path(update.NGINX).read_text(), nginx)
        self.assertEqual(history.read_text(), 'saved-history')
        self.assertIn("RAW_ROOT = Path('/srv/raw')", update.path(update.HELPER).read_text())
        self.assertEqual((update.old_app / 'editor/server.rb').read_text(), 'source-v1')
        self.assertEqual((update.path(update.APP) / 'editor/server.rb').read_text(), 'source-v2')
        self.assertFalse(any(args[0] == 'htpasswd' for args, _ in update.commands))

    def test_build_failure_does_not_touch_installed_app_or_configuration(self):
        self.install()
        update = self.update_installer()
        update.fail_build = True
        before = update.path(update.ENV).read_bytes()
        with self.assertRaisesRegex(module.InstallError, 'build failed'):
            self.install(update)
        self.assertEqual(update.path(update.ENV).read_bytes(), before)
        self.assertEqual((update.path(update.APP) / 'editor/server.rb').read_text(), 'source-v1')
        self.assertIsNone(update.backup)
        self.assertFalse(list(update.path('/opt').glob('.bbb-recording-editor.stage-*')))

    def test_nginx_validation_failure_restores_configs_before_activation(self):
        self.install()
        update = self.update_installer()
        before = {name: update.path(name).read_bytes() for name in [update.ENV, update.UNIT, update.AUTH, update.NGINX]}
        update.fail_nginx = True
        with self.assertRaisesRegex(module.InstallError, 'Nginx validation'):
            self.install(update)
        for name, content in before.items():
            self.assertEqual(update.path(name).read_bytes(), content)
        self.assertFalse(update.switched)
        self.assertEqual(self.journal(update)['status'], 'rolled_back')

    def test_health_failure_restores_previous_app_and_state_permissions(self):
        self.install()
        update = self.update_installer()
        state = update.path('/var/lib/bbb-recording-editor')
        state.chmod(0o750)
        (state / 'history').write_text('retain history')
        (self.source / 'editor/server.rb').write_text('source-v2')
        update.fail_health = True
        with self.assertRaisesRegex(module.InstallError, 'health check'):
            self.install(update)
        self.assertEqual((update.path(update.APP) / 'editor/server.rb').read_text(), 'source-v1')
        self.assertEqual((state / 'history').read_text(), 'retain history')
        self.assertEqual(state.stat().st_mode & 0o777, 0o750)
        self.assertEqual(self.journal(update)['status'], 'rolled_back')
        self.assertIn(['systemctl', 'restart', 'bbb-recording-editor'], [args for args, _ in update.commands])

    def test_failed_activation_after_moving_old_app_restores_it(self):
        self.install()
        update = self.update_installer()
        rename = Path.rename
        def fail_stage(path, target):
            if path.name.startswith('.bbb-recording-editor.stage-'):
                raise OSError('activation failed')
            return rename(path, target)
        with patch.object(Path, 'rename', fail_stage), self.assertRaisesRegex(OSError, 'activation failed'):
            self.install(update)
        self.assertEqual((update.path(update.APP) / 'editor/server.rb').read_text(), 'source-v1')
        self.assertEqual(self.journal(update)['status'], 'rolled_back')

    def test_failed_first_install_removes_new_config_and_disables_service(self):
        self.installer.fail_health = True
        with self.assertRaises(module.InstallError):
            self.install()
        i = self.installer
        for name in [i.APP, i.ENV, i.AUTH, i.NGINX, i.UNIT, i.SUDOERS, i.HELPER, i.DROPIN]:
            self.assertFalse(i.path(name).exists(), name)
        self.assertIn(['systemctl', 'disable', 'bbb-recording-editor'], [args for args, _ in i.commands])
        self.assertEqual((self.raw / 'events.xml').read_text(), 'raw must stay unchanged')

    def test_failed_stop_does_not_replace_running_application(self):
        self.install()
        update = self.update_installer()
        update.fail_stop = True
        with self.assertRaises(module.InstallError):
            self.install(update)
        self.assertFalse(update.switched)
        self.assertEqual((update.path(update.APP) / 'editor/server.rb').read_text(), 'source-v1')
        self.assertEqual(self.journal(update)['status'], 'rolled_back')

    def test_missing_packages_are_installed_only_when_needed(self):
        self.installer.missing = {'htpasswd'}
        self.install()
        apt = [args for args, _ in self.installer.commands if args[0] == 'apt-get']
        self.assertEqual(apt, [['apt-get', 'install', '--yes', 'apache2-utils']])

    def test_skip_dependencies_reports_missing_without_changes(self):
        self.options.skip_dependencies = True
        self.installer.missing = {'htpasswd'}
        with self.assertRaisesRegex(module.InstallError, 'apache2-utils'):
            self.install()
        self.assertFalse(self.installer.path(self.installer.APP).exists())
        self.assertFalse(any(args[0] == 'apt-get' for args, _ in self.installer.commands))

    def test_missing_node_fails_before_installing_packages(self):
        self.installer.missing = {'node', 'htpasswd'}
        with self.assertRaisesRegex(module.InstallError, 'sudo PATH'):
            self.install()
        self.assertFalse(any(args[0] == 'apt-get' for args, _ in self.installer.commands))
        self.assertIsNone(self.installer.stage)

    def test_skip_build_uses_matching_prebuilt_assets(self):
        self.options.skip_build = True
        make_build(self.source)
        self.install()
        self.assertFalse(any('npm' in args for args, _ in self.installer.commands))

    def test_skip_build_rejects_wrong_prefix_and_missing_assets(self):
        self.options.skip_build = True
        for prefix, missing in [('/wrong', False), ('/recording-editor', True)]:
            with self.subTest(prefix=prefix):
                make_build(self.source, prefix)
                if missing:
                    (self.source / 'build-editor/main.js').unlink()
                with self.assertRaises(module.InstallError):
                    self.install()
                self.assertFalse(self.installer.path(self.installer.ENV).exists())

    def test_custom_nginx_without_include_fails_before_configuration(self):
        self.installer.include = False
        with self.assertRaisesRegex(module.InstallError, 'HTTPS server'):
            self.install()
        self.assertFalse(self.installer.path(self.installer.ENV).exists())
        self.assertIsNone(self.installer.stage)

    def test_existing_unauthenticated_nginx_is_not_silently_accepted(self):
        self.install()
        update = self.update_installer()
        nginx = update.path(update.NGINX)
        unsafe = nginx.read_text().replace('auth_basic "BBB Recording Editor (Administrator)";', 'auth_basic off;')
        nginx.write_text(unsafe)
        with self.assertRaisesRegex(module.InstallError, 'do not match'):
            self.install(update)
        self.assertEqual(nginx.read_text(), unsafe)

    def test_data_directory_cannot_be_inside_application(self):
        env = self.installer.path(self.installer.ENV)
        env.parent.mkdir(parents=True)
        env.write_text('BBB_EDITOR_STATE_ROOT=/opt/other/../bbb-recording-editor/state\n')
        with self.assertRaisesRegex(module.InstallError, 'outside the application'):
            self.install()

    def test_managed_symlink_is_rejected(self):
        env = self.installer.path(self.installer.ENV)
        env.parent.mkdir(parents=True)
        env.symlink_to(self.password)
        with self.assertRaisesRegex(module.InstallError, 'symbolic link'):
            self.install()
        self.assertEqual(self.password.read_text(), 'private-test-password\n')

    def test_shared_system_directory_is_not_chowned_as_state(self):
        env = self.installer.path(self.installer.ENV)
        env.parent.mkdir(parents=True)
        env.write_text('BBB_EDITOR_STATE_ROOT=/var/lib\n')
        shared = self.installer.path('/var/lib')
        shared.mkdir(parents=True)
        shared.chmod(0o755)
        with self.assertRaisesRegex(module.InstallError, 'dedicated state directory'):
            self.install()
        self.assertEqual(shared.stat().st_mode & 0o777, 0o755)

    def test_shell_entrypoint_finds_source_from_unrelated_working_directory(self):
        for name in ['deploy.sh', 'deploy-editor.sh']:
            shutil.copy2(REPO / name, self.source / name)
        result = subprocess.run(['bash', str(self.source / 'deploy.sh'), '--editor', '--help'],
                                cwd=self.folder, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('/opt/bbb-recording-editor', result.stdout)
        self.assertIn('--skip-build', result.stdout)


if __name__ == '__main__':
    unittest.main()
