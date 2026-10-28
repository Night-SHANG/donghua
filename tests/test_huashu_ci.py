"""Offline tests: planning, provenance, limits and actual ffmpeg verification."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('huashu_ci', ROOT / 'huashu/tools/ci.py')
ci = importlib.util.module_from_spec(spec); spec.loader.exec_module(ci)
BASE = {'mode': 'smoke', 'film': 'fox_stork', 'duration': 65, 'fps': 30,
        'width': 1920, 'height': 1080, 'chunkSeconds': 5, 'representativeStart': 39}


class ConfigAndFrames(unittest.TestCase):
    def config(self, changes=None):
        with tempfile.TemporaryDirectory() as d:
            value = copy.deepcopy(BASE); value.update(changes or {})
            Path(d, 'render-config.json').write_text(json.dumps(value))
            return ci.load_config(d)

    def test_exact_65s_30fps_13_chunks(self):
        c = self.config(); ranges = ci.chunks(c)
        self.assertEqual(len(ranges), 13)
        self.assertEqual(ranges[0], {'part': '000', 'startFrame': 0, 'endFrame': 150})
        self.assertEqual(ranges[-1]['endFrame'], 1950)
        self.assertEqual([p['endFrame'] for p in ranges[:-1]], [p['startFrame'] for p in ranges[1:]])
        self.assertEqual(sum(p['endFrame'] - p['startFrame'] for p in ranges), 1950)

    def test_short_last_chunk_is_exact(self):
        r = ci.chunks(self.config({'duration': 65.1, 'chunkSeconds': 6}))
        self.assertEqual(r[-1], {'part': '010', 'startFrame': 1800, 'endFrame': 1953})

    def test_invalid_configs(self):
        invalid = [{'film': '../bad'}, {'fps': True}, {'width': 1919}, {'duration': 65.001},
                   {'representativeStart': 64}, {'representativeStart': 1.01}, {'stills': [65]},
                   {'artifactLimitBytes': 15_000_000}, {'audio': '../secret'}, {'mode': 'unknown'},
                   {'reviewWidth': 2000}, {'smokeIds': ['../../bad']}, {'audioBuild': ['python a.py']},
                   {'qaFps': 0}, {'crf': -1}, {'mode': 'final'}, {'mode': 'final', 'reviewedSmokeRun': '123'}]
        for changes in invalid:
            with self.subTest(changes=changes), self.assertRaises((ValueError, KeyError)):
                self.config(changes)

    def test_final_requires_reviewed_smoke_and_audio(self):
        self.config({'mode': 'final', 'reviewedSmokeRun': '123', 'audio': 'audio/output.m4a'})

    def test_cannot_escape(self):
        with self.assertRaises(ValueError): ci.safe_path('/tmp/root', '../x')
        with self.assertRaises(ValueError): ci.safe_path('/tmp/root', '/etc/passwd')
        self.assertEqual(ci.safe_path('/tmp/root', 'audio/mix.m4a'), Path('/tmp/root/audio/mix.m4a'))

    def test_reject_symlink_source(self):
        with tempfile.TemporaryDirectory() as d:
            Path(d, 'link').symlink_to('/etc/passwd')
            with self.assertRaises(ValueError): ci.file_manifest(d)


class Provenance(unittest.TestCase):
    def write_part(self, folder, part, start, end, **override):
        root = folder / ('artifact-' + part); root.mkdir()
        video = root / f'part-{part}.mp4'; video.write_bytes(b'known fake bytes')
        p = {'stage': 'chunk', 'commit': 'source-commit', 'source': {'digestSha256': 'source-digest'},
             'upstream': {'commit': ci.UPSTREAM_SHA}, 'part': part, 'startFrame': start, 'endFrame': end,
             'artifacts': {video.name: {'sha256': ci.sha(video)}}}
        p.update(override); ci.write_json(root / 'provenance.json', p)
        return video

    def test_valid_part_order(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); self.write_part(root, '001', 150, 300); self.write_part(root, '000', 0, 150)
            expected = [{'part': '000', 'startFrame': 0, 'endFrame': 150}, {'part': '001', 'startFrame': 150, 'endFrame': 300}]
            got = ci.collect_parts(root, expected, 'source-commit', 'source-digest')
            self.assertEqual([p['part'] for _, p in got], ['000', '001'])

    def test_tamper_and_mismatch_fail(self):
        expected = [{'part': '000', 'startFrame': 0, 'endFrame': 150}]
        for reason in ('bytes', 'commit', 'digest', 'range', 'missing'):
            with self.subTest(reason=reason), tempfile.TemporaryDirectory() as d:
                root = Path(d)
                video = self.write_part(root, '000', 0, 151 if reason == 'range' else 150)
                if reason == 'bytes': video.write_bytes(b'tampered')
                if reason == 'missing': (video.parent / 'provenance.json').unlink()
                with self.assertRaises(RuntimeError):
                    ci.collect_parts(root, expected, 'wrong' if reason == 'commit' else 'source-commit',
                                     'wrong' if reason == 'digest' else 'source-digest')

    def test_bundle_limits_include_metadata(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); work = root / 'work'; out = root / 'out'; work.mkdir(); out.mkdir()
            ci.write_json(work / 'provenance.json', {'source': 'fake'})
            (out / 'large').write_bytes(b'x' * 1000)
            class Args: pass
            args = Args(); args.work = str(work)
            with self.assertRaises(RuntimeError): ci.bundle(args, {'artifactLimitBytes': 1001}, out)
            self.assertTrue((out / 'provenance.json').exists())
            self.assertTrue((out / 'SHA256SUMS').exists())


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'ffmpeg not installed')
class RealEncoderVerification(unittest.TestCase):
    def test_probe_decodes_exact_frames_and_rejects_wrong_count(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / 'test.mp4'
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30',
                            '-frames:v', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(path)], check=True)
            c = {**BASE, 'width': 640, 'height': 360}
            ci.verify_video(path, c, 30)
            with self.assertRaises(RuntimeError): ci.verify_video(path, c, 31)
            with self.assertRaises(RuntimeError): ci.verify_video(path, c, 30, audio=True)

    def test_bounded_two_pass_encode_with_audio(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); source = root / 'source.mp4'; audio = root / 'sound.wav'; out = root / 'review.mp4'
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30',
                            '-frames:v', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(source)], check=True)
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000',
                            '-t', '2', str(audio)], check=True)
            c = {**BASE, 'width': 640, 'height': 360, 'artifactLimitBytes': 2_000_000}
            ci.bounded_encode(source, out, c, 1, audio=audio, start=.5, width=640)
            ci.verify_video(out, c, 30, audio=True)
            self.assertLess(out.stat().st_size, 1_500_000)
            self.assertFalse(list(root.glob('*.passlog*')))


if __name__ == '__main__': unittest.main()
