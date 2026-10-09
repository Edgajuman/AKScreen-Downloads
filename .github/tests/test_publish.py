"""Offline checks for binary-only publication; never contact GitHub."""
import hashlib
import json
import os
from pathlib import Path
import runpy
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/publish.py'

class PublicationTests(unittest.TestCase):
    def stage(self, corrupt=False):
        Path('metadata').mkdir()
        Path('metadata/release.json').write_text(json.dumps({'version':'2.1.0','tag':'ak-v2.1.0','notes':'Example','sourceRevision':'a'*40}))
        Path('versions.json').write_text(json.dumps({'schema':1,'releases':[{'version':'2.0.0','tag':'ak-v2.0.0'}]}))
        names = {'windows-x64':'AK Screen Setup.exe','linux-x64':'AKScreen-Linux-x64.tar.gz','macos-arm64':'AKScreen-macOS-arm64.dmg','macos-x64':'AKScreen-macOS-x64.dmg'}
        for platform, name in names.items():
            folder = Path('packages') / ('AKScreen-' + platform)
            folder.mkdir(parents=True)
            payload = ('Example binary fixture: ' + platform).encode()
            (folder/name).write_bytes(payload)
            digest = '0'*64 if corrupt else hashlib.sha256(payload).hexdigest()
            (folder/'SHA256SUMS.txt').write_text(f'{digest}  {name}\n')

    def invoke(self):
        with mock.patch.dict(os.environ, {'GITHUB_REPOSITORY':'example/downloads'}), mock.patch('subprocess.run', return_value=SimpleNamespace(returncode=0)) as commands:
            runpy.run_path(str(SCRIPT), run_name='__main__')
            return commands

    def test_rename_checksum_and_history(self):
        previous = Path.cwd()
        with tempfile.TemporaryDirectory() as folder:
            try:
                os.chdir(folder)
                self.stage()
                commands = self.invoke()
                catalogue = json.loads(Path('versions.json').read_text())
                self.assertEqual([r['version'] for r in catalogue['releases']], ['2.1.0','2.0.0'])
                assets = catalogue['releases'][0]['assets']
                self.assertEqual(len(assets), 4)
                self.assertTrue(next(a for a in assets if a['platform']=='windows-x64')['url'].endswith('/AKScreen-Windows-x64-Setup.exe'))
                self.assertTrue(Path('release-assets/AKScreen-Windows-x64-Setup.exe').exists())
                self.assertIn('AKScreen-Windows-x64-Setup.exe', Path('release-assets/AKScreen-windows-x64-SHA256SUMS.txt').read_text())
                self.assertGreater(commands.call_count, 0)
            finally:
                os.chdir(previous)

    def test_corrupt_binary_refused_before_github(self):
        previous = Path.cwd()
        with tempfile.TemporaryDirectory() as folder:
            try:
                os.chdir(folder)
                self.stage(corrupt=True)
                with self.assertRaisesRegex(SystemExit, 'Checksum mismatch'):
                    self.invoke()
            finally:
                os.chdir(previous)

if __name__ == '__main__':
    unittest.main()
