"""Artifact-level acceptance tests for the original 65-second soundtrack."""
import json
import subprocess
import unittest
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent

class SoundtrackAcceptance(unittest.TestCase):
    def test_master_exists(self):
        self.assertTrue((ROOT / 'master.wav').is_file(), '65s master must be synthesized')

    @unittest.skipUnless((ROOT / 'master.wav').exists(), 'master not created yet')
    def test_master_format_and_headroom(self):
        sr, y = wavfile.read(ROOT / 'master.wav')
        self.assertEqual(sr, 48000)
        self.assertEqual(y.shape, (3120000, 2))
        y = y.astype(np.float64) / 2147483648.0
        self.assertTrue(np.isfinite(y).all())
        self.assertLess(np.max(np.abs(y)), 0.80)
        peak = np.max(np.abs(resample_poly(y, 4, 1, axis=0)))
        self.assertLess(20*np.log10(peak), -1.9)
        self.assertLess(np.max(np.abs(y[-4800:])), 1e-4)
        self.assertGreater(float(np.std(y[:,0]-y[:,1])), 1e-3)

    @unittest.skipUnless((ROOT / 'music.m4a').exists(), 'AAC not created yet')
    def test_aac_duration_channels_and_size(self):
        p = subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(ROOT/'music.m4a')],check=True,capture_output=True,text=True)
        j=json.loads(p.stdout)
        self.assertEqual(j['streams'][0]['channels'], 2)
        self.assertEqual(j['streams'][0]['sample_rate'], '48000')
        self.assertAlmostEqual(float(j['format']['duration']),65.0,places=3)
        self.assertLess((ROOT/'music.m4a').stat().st_size,1100000)

    @unittest.skipUnless((ROOT / 'audio-cues.json').exists(), 'cue sheet not created yet')
    def test_action_cues_and_silences(self):
        j=json.loads((ROOT/'audio-cues.json').read_text())
        self.assertEqual(j['duration'],65)
        self.assertEqual(j['sample_rate'],48000)
        sounds={round(c['time'],2) for c in j['foley']}
        for s in [2,6.2,6.65,7.1,12.1,21,21.35,24.8,28.8,34.2,34.55,36.2,39.35,40.2,44,45.1,49.4,55.5,58.7,62.1,63]:
            self.assertIn(s,sounds)
        for onset,end in [(12.18,12.7),(17,17.8),(45.2,45.8),(50.3,51),(60.1,61),(63.5,65)]:
            self.assertFalse(any(onset<c['time']<end for c in j['music_notes']))
        self.assertEqual(next(c['kind'] for c in j['foley'] if c['time']==39.35),'cloth')
        self.assertTrue(any(c['time']==41.8 and c['kind']=='swallow' for c in j['foley']))
        self.assertFalse(any(50.3<=c['time']<51 for c in j['foley']))

if __name__ == '__main__':
    unittest.main(verbosity=2)
