import importlib.util
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('official', ROOT / 'huashu/tools/official_examples.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)


class Contracts(unittest.TestCase):
    def test_original_ranges(self):
        self.assertEqual(m.EXAMPLES['gallery']['film'], 'gallery')
        self.assertEqual(m.EXAMPLES['long-scroll']['film'], 'demos/long_scroll')
        self.assertEqual((m.EXAMPLES['gallery']['start'], m.EXAMPLES['gallery']['end']), (9, 21))
        self.assertEqual((m.EXAMPLES['long-scroll']['start'], m.EXAMPLES['long-scroll']['end']), (3, 15))
        for ex in m.EXAMPLES.values():
            self.assertEqual((ex['end'] - ex['start']) * 60, 720)
            self.assertTrue(all(ex['start'] <= x < ex['end'] for x in ex['stills']))

    def test_pin_and_dirty_rejection(self):
        with patch.object(m, 'text_command', side_effect=[m.SHA, '']):
            self.assertEqual(m.verify_upstream(Path('/fake'))['commit'], m.SHA)
        for responses in ([m.SHA, 'M scripts/engine/render.py'], ['wrong-sha', '']):
            with patch.object(m, 'text_command', side_effect=responses), self.assertRaises(RuntimeError):
                m.verify_upstream(Path('/fake'))

    def test_upload_limit(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            with self.assertRaises(RuntimeError): m.check_size(root)
            (root / 'data').write_bytes(b'x' * 100)
            self.assertEqual(m.check_size(root), 100)
            with patch.object(m, 'CAP', 100), self.assertRaises(RuntimeError): m.check_size(root)

    def test_digest_changes(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / 'x'; path.write_bytes(b'original'); before = m.digest(path)
            path.write_bytes(b'changed'); self.assertNotEqual(m.digest(path), before)

    @unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'encoder not installed')
    def test_actual_ffprobe_decode_contract(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'test.mp4'
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=60',
                            '-frames:v', '60', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(p)], check=True)
            m.verify_video(p, 320, 180, frames=60)
            with self.assertRaises(RuntimeError): m.verify_video(p, 320, 180, frames=61)
            with self.assertRaises(RuntimeError): m.verify_video(p, 640, 360, frames=60)


if __name__ == '__main__': unittest.main()
