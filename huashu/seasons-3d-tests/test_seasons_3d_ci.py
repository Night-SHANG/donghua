import importlib.util
import json
import copy
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
assert (ROOT / 'huashu/tools/render_seasons_3d.py').exists(), 'Missing independent true-3D renderer orchestration'
spec = importlib.util.spec_from_file_location('seasons', ROOT / 'huashu/tools/render_seasons_3d.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)


class Contracts(unittest.TestCase):
    def test_900_frames_and_scene_continuity(self):
        self.assertEqual(m.DURATION * m.FPS, m.FRAME_COUNT)
        self.assertEqual(m.FRAME_COUNT, 900)
        self.assertEqual([s['range'][1] for s in m.SCENES[:-1]], [s['range'][0] for s in m.SCENES[1:]])
        self.assertEqual(m.SCENES[0]['range'][0], 0); self.assertEqual(m.SCENES[-1]['range'][1], 15)
        for s in m.SCENES: self.assertTrue(s['range'][0] <= s['still'] < s['range'][1])

    def test_dense_windows_have_no_missing_frames(self):
        expected = [(186, 264, 79), (411, 489, 79), (636, 714, 79)]
        for w, (start, end, n) in zip(m.WINDOWS, expected):
            frames = m.frame_range(w)
            self.assertEqual(frames, list(range(start, end + 1)))
            self.assertEqual(len(frames), n)
            self.assertIn(round(w['transition'] * 60), frames)
        self.assertEqual(sum(len(m.frame_range(w)) for w in m.WINDOWS), 237)
        with self.assertRaises(ValueError): m.frame_range({'start': -1, 'end': 0})
        with self.assertRaises(ValueError): m.frame_range({'start': 14, 'end': 15})

    def test_full_trajectory_sample_map(self):
        self.assertEqual(len(m.TRAJECTORY_FRAMES), 61)
        self.assertEqual(m.TRAJECTORY_FRAMES[:-1], list(range(0, 900, 15)))
        self.assertEqual(m.TRAJECTORY_FRAMES[-1], 899)

    def test_3d_motion_rejects_wrong_coordinates_limits_or_unchanging_material(self):
        data={'schema':1,'fps':60,'duration':15,'passed':True,'limits':{'maxPositionStep':.04,'maxRotationStep':.02,'maxCameraStep':.09},'samples':[]}
        for f in range(901):
            u=f/900
            data['samples'].append({'frame':f,'t':f/60,'position':[0,2,-f*.02],'rotation':[u*.3,0,0],
                'camera':[3,5,8-f*.02],'target':[0,2,-f*.02], 'seasonWeights':[1-u,0,0,u],
                'leafColor':[.55-.27*u,.8-.64*u,.16-.09*u], 'curl':.12+.53*u,'frost':.83*u})
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'state.json';p.write_text(json.dumps(data))
            result=m.validate_motion_report(p)
            self.assertEqual(result['samples'],901)
            self.assertAlmostEqual(result['recomputed']['maxPositionStep'],.02)
            for kind in ['missing','time','position','rotation','camera','nan','weights','flat_material','flat_shape','limit','failed']:
                bad=copy.deepcopy(data)
                if kind=='missing': bad['samples'][5].pop('position')
                if kind=='time': bad['samples'][5]['t']+=.1
                if kind in ['position','rotation','camera']: bad['samples'][30][kind][0]+=1
                if kind=='nan': bad['samples'][30]['frost']=float('nan')
                if kind=='weights': bad['samples'][30]['seasonWeights']=[1,1,0,0]
                if kind=='flat_material':
                    for a in bad['samples']: a['leafColor']=[.2,.3,.1]
                if kind=='flat_shape':
                    for a in bad['samples']: a['curl']=.12
                if kind=='limit': bad['limits']['maxPositionStep']=5
                if kind=='failed': bad['passed']=False
                p.write_text(json.dumps(bad))
                with self.subTest(kind=kind),self.assertRaises(RuntimeError): m.validate_motion_report(p)

    def test_webgl_report_rejects_2d_blank_or_lost_context(self):
        report = {'threeRevision': '160', 'webgl': [{'type':'webgl2','version':'WebGL 2.0','renderer':'ANGLE SwiftShader',
            'contextLost':False,'width':1280,'height':720,'preserveDrawingBuffer':True,'drawCalls':200}],
            'compositeCalls':1, 'diagnostics':{'cameraType':'PerspectiveCamera','triangles':1000},
            'canvasSize':[1920,1080], 'pixelStddev':[20,30,40]}
        m.validate_webgl_capture(report)
        for field, value in [('threeRevision','159'),('webgl',[]),('compositeCalls',0),('pixelStddev',[0,0,0])]:
            bad = copy.deepcopy(report); bad[field] = value
            with self.subTest(field=field), self.assertRaises(RuntimeError): m.validate_webgl_capture(bad)
        for field, value in [('contextLost',True),('drawCalls',0),('preserveDrawingBuffer',False),('width',640)]:
            bad=copy.deepcopy(report);bad['webgl'][0][field]=value
            with self.subTest(field=field), self.assertRaises(RuntimeError): m.validate_webgl_capture(bad)
        bad=copy.deepcopy(report);bad['diagnostics']['cameraType']='OrthographicCamera'
        with self.assertRaises(RuntimeError): m.validate_webgl_capture(bad)

    def test_runtime_adapter_keeps_native_file_and_records_flags(self):
        import sys
        sys.path.insert(0, str(ROOT / 'huashu/tools'))
        import webgl_runtime as runtime
        args=runtime.merge_launch_args(['--disable-web-security','--use-angle=gl'])
        self.assertIn('--disable-web-security',args)
        self.assertNotIn('--use-angle=gl',args)
        self.assertIn('--use-gl=angle',args)
        self.assertIn('--use-angle=swiftshader',args)
        self.assertIn('--enable-unsafe-swiftshader',args)
        self.assertEqual(args, runtime.merge_launch_args(args))

    def test_adapter_runs_unchanged_script_and_only_amends_browser_launch(self):
        import sys
        from types import SimpleNamespace
        from playwright.sync_api import BrowserType
        sys.path.insert(0, str(ROOT / 'huashu/tools'))
        import webgl_runtime as runtime
        with tempfile.TemporaryDirectory() as d:
            script=Path(d)/'native.py'
            script.write_text("from playwright.sync_api import BrowserType\nfrom types import SimpleNamespace\nBrowserType.launch(SimpleNamespace(name='chromium'), args=['--ignore-gpu-blocklist'], headless=True)\n")
            before=m.sha(script);calls=[];old_argv=sys.argv
            with patch.object(BrowserType,'launch',side_effect=lambda *a,**kw:calls.append(kw)):
                runtime.run_native(script, ['--film','seasons_leaf_3d'])
            self.assertEqual(m.sha(script),before)
            self.assertIs(sys.argv,old_argv)
            self.assertEqual(calls,[{'args':['--ignore-gpu-blocklist',*runtime.FLAGS], 'headless':True}])

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
            (project / 'engine/eras_seasons_leaf_3d.js').write_text('new film')
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
            with patch.object(m, 'SCENES', [{'id': 'test', 'range': [0, 1], 'still': .3}]), patch.object(m, 'WINDOWS', [{'id': 'test-window', 'start': .1, 'end': .2, 'transition': .15}]), patch.object(m, 'TRAJECTORY_FRAMES', [0, 15, 30, 45, 59]):
                report = m.extract_evidence(source, source, out, work)
            self.assertEqual(report['denseWindows'][0]['frames'], list(range(6, 13)))
            self.assertTrue((out / 'dense-test-window-01.jpg').is_file())
            self.assertEqual(report['trajectory']['frames'], [0, 15, 30, 45, 59])
            self.assertTrue((out / 'trajectory-01.jpg').is_file())
            m.verify_video(out / 'window-test-window-60fps.mp4', 1280, 720, frames=7)
            audio = root / 'music.wav'
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '1', '-ac', '2', str(audio)], check=True)
            target = root / 'review.mp4'
            with patch.object(m, 'DURATION', 1): m.encode_review(source, audio, target, work, out)
            m.verify_video(target, 1280, 720, frames=60, audio=True)


if __name__ == '__main__': unittest.main()
