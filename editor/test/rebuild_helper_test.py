import importlib.machinery
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import hashlib

loader = importlib.machinery.SourceFileLoader('helper', str(Path(__file__).parents[1] / 'deploy/bbb-recording-editor-rebuild'))
spec = importlib.util.spec_from_loader(loader.name, loader)
helper = importlib.util.module_from_spec(spec)
loader.exec_module(helper)


class HelperTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.id = 'a' * 40 + '-1700000000000'
        self.meeting = self.root / self.id
        self.meeting.mkdir()
        self.events = self.meeting / 'events.xml'
        self.events.write_bytes(b'<recording/>')
        self.revision = hashlib.sha256(self.events.read_bytes()).hexdigest()
        self.raw_patch = patch.object(helper, 'RAW_ROOT', self.root)
        self.raw_patch.start()
        self.addCleanup(self.raw_patch.stop)
        self.addCleanup(self.temp.cleanup)

    def test_rejects_options_shell_metacharacters_and_extra_arguments(self):
        for args in [[], ['--rebuildall', self.revision], [self.id + ';id', self.revision],
                     ['../' + self.id, self.revision], [self.id, 'wrong'], [self.id, self.revision, '--delete']]:
            with self.assertRaises(ValueError):
                helper.validate_arguments(args)

    @patch.object(helper.os, 'geteuid', return_value=0)
    @patch.object(helper.subprocess, 'run')
    def test_only_single_recording_rebuild_runs_with_clean_environment(self, run, _):
        run.return_value.returncode = 0
        self.assertEqual(0, helper.rebuild([self.id, self.revision]))
        self.assertEqual(['/usr/bin/bbb-record', '--rebuild', self.id], run.call_args.args[0])
        self.assertEqual('/', run.call_args.kwargs['cwd'])
        self.assertEqual({'PATH', 'LANG'}, set(run.call_args.kwargs['env']))

    @patch.object(helper.os, 'geteuid', return_value=0)
    @patch.object(helper.subprocess, 'run')
    def test_changed_xml_and_symlink_never_run_rebuild(self, run, _):
        self.events.write_bytes(b'changed')
        with self.assertRaises(ValueError):
            helper.rebuild([self.id, self.revision])
        self.events.unlink()
        other = self.root / 'other.xml'
        other.write_bytes(b'<recording/>')
        self.events.symlink_to(other)
        with self.assertRaises(ValueError):
            helper.rebuild([self.id, self.revision])
        run.assert_not_called()

    @patch.object(helper.os, 'geteuid', return_value=1000)
    def test_requires_root(self, _):
        with self.assertRaises(ValueError):
            helper.rebuild([self.id, self.revision])


if __name__ == '__main__':
    unittest.main()
