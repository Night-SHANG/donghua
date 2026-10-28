import importlib.util
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('garden', ROOT / 'huashu/tools/render_garden.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)


class Contracts(unittest.TestCase):
    def test_900_frames_and_scene_continuity(self):
        self.assertEqual(m.DURATION * m.FPS, m.FRAME_COUNT)
        self.assertEqual(m.FRAME_COUNT, 900)
        self.assertEqual([s['range'][1] for s in m.SCENES[:-1]], [s['range'][0] for s in m.SCENES[1:]])
        self.assertEqual(m.SCENES[0]['range'][0], 0); self.assertEqual(m.SCENES[-1]['range'][1], 15)
        for s in m.SCENES: self.assertTrue(s['range'][0] <= s['still'] < s['range'][1])

    def test_dense_windows_have_no_missing_frames(self):
        expected = [(165, 258, 94), (414, 444, 31), (654, 678, 25)]
        for w, (start, end, n) in zip(m.WINDOWS, expected):
            frames = m.frame_range(w)
            self.assertEqual(frames, list(range(start, end + 1)))
            self.assertEqual(len(frames), n)
            self.assertIn(round(w['transition'] * 60), frames)
        self.assertEqual(sum(len(m.frame_range(w)) for w in m.WINDOWS), 150)
        with self.assertRaises(ValueError): m.frame_range({'start': -1, 'end': 0})
        with self.assertRaises(ValueError): m.frame_range({'start': 14, 'end': 15})

    def test_pin_rejects_dirty_or_wrong_source(self):
        with patch.object(m, 'output', side_effect=[m.UPSTREAM_SHA, '']): self.assertEqual(m.verify_upstream(Path('/fake')), m.UPSTREAM_SHA)
        for values in ([m.UPSTREAM_SHA, 'M render.py'], ['wrong', '']):
            with patch.object(m, 'output', side_effect=values), self.assertRaises(RuntimeError): m.verify_upstream(Path('/fake'))

    def test_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); (root / 'outside').symlink_to('/etc/passwd')
            with self.assertRaises(RuntimeError): m.manifest(root)

    def test_cap_includes_all_files(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            with self.assertRaises(RuntimeError): m.check_size(root)
            (root / 'x').write_bytes(b'abc'); self.assertEqual(m.check_size(root), 3)
            with patch.object(m, 'CAP', 3), self.assertRaises(RuntimeError): m.check_size(root)

    def test_additive_overlay_keeps_native_renderer_and_rejects_collision(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); upstream = root / 'upstream'; project = root / 'project'; work = root / 'work'
            (upstream / 'scripts/engine').mkdir(parents=True); (project / 'engine').mkdir(parents=True)
            (upstream / 'scripts/engine/render.py').write_text('native renderer')
            (project / 'engine/eras_rain_garden.js').write_text('new film')
            with patch.object(m, 'verify_upstream'): m.overlay_engine(upstream, project, work)
            self.assertEqual((work / 'scripts/engine/render.py').read_text(), 'native renderer')
            (project / 'engine/render.py').write_text('modified')
            with patch.object(m, 'verify_upstream'), self.assertRaises(RuntimeError): m.overlay_engine(upstream, project, root / 'bad-work')

    @unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'encoder unavailable')
    def test_actual_video_and_dense_frame_evidence(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); source = root / 'test.mp4'; out = root / 'out'; out.mkdir(); work = root / 'work'; work.mkdir()
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=60',
                            '-frames:v', '60', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', str(source)], check=True)
            m.verify_video(source, 1280, 720, frames=60)
            with self.assertRaises(RuntimeError): m.verify_video(source, 1280, 720, frames=61)
            with self.assertRaises(RuntimeError): m.verify_video(source, 1280, 720, frames=60, audio=True)
            with patch.object(m, 'SCENES', [{'id': 'test', 'range': [0, 1], 'still': .3}]), patch.object(m, 'WINDOWS', [{'id': 'test-window', 'start': .1, 'end': .2, 'transition': .15}]):
                report = m.extract_evidence(source, source, out, work)
            self.assertEqual(report['denseWindows'][0]['frames'], list(range(6, 13)))
            self.assertTrue((out / 'dense-test-window-01.jpg').is_file())
            m.verify_video(out / 'window-test-window-60fps.mp4', 1280, 720, frames=7)
            audio = root / 'music.wav'
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '1', '-ac', '2', str(audio)], check=True)
            target = root / 'review.mp4'
            with patch.object(m, 'DURATION', 1): m.encode_review(source, audio, target, work, out)
            m.verify_video(target, 1280, 720, frames=60, audio=True)


if __name__ == '__main__': unittest.main()
