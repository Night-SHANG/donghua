"""Reusable audio/cue contract checks. Run: python audio/test_audio.py."""
import json, unittest
from pathlib import Path
import numpy as np
from scipy.io import wavfile
ROOT=Path(__file__).resolve().parent.parent
class AudioContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cues=json.loads((ROOT/'audio/cues.json').read_text())
        cls.report=json.loads((ROOT/'audio/measurements.json').read_text())
        cls.sr,cls.master=wavfile.read(ROOT/'public/audio/master.wav')
    def test_duration_and_format(self):
        self.assertEqual(self.sr,48000)
        self.assertEqual(self.master.shape,(1152000,2))
        self.assertEqual(self.master.dtype,np.dtype('int16'))
        spec=json.loads((ROOT/'film-spec.json').read_text())
        self.assertEqual(spec['durationInFrames']/spec['fps'],len(self.master)/self.sr)
    def test_loudness_and_no_clips(self):
        self.assertLess(np.max(np.abs(self.master.astype(float))),32767)
        self.assertEqual(self.report['clippedSamples'],0)
        self.assertLessEqual(self.report['truePeakDbTP'],-2)
        self.assertTrue(-22<=self.report['integratedLufs']<=-16)
        self.assertFalse(self.report['listeningVerified'])
    def test_fades(self):
        self.assertEqual(np.max(np.abs(self.master[0])),0)
        self.assertEqual(np.max(np.abs(self.master[-1])),0)
        self.assertLess(np.sqrt(np.mean(self.master[-480:].astype(float)**2)),15)
    def test_cue_alignment(self):
        required={'gust':60,'hat_detach_pop':76,'takeoff':294,'landing':358,'skid':375,'bird_reveal_shiver':465,'leaf_lands':663,'stable_end':719}
        anchors={e['name']:e['frame'] for e in self.cues['storyAnchors']}
        for name,frame in required.items():self.assertEqual(anchors[name],frame)
        for cue in self.cues['cues']:
            self.assertAlmostEqual(cue['seconds'],cue['frame']/30)
            self.assertTrue(0<=cue['frame']<720)
            self.assertTrue(cue['synthetic'])
        actual={c['name']:c['frame'] for c in self.cues['cues']}
        self.assertEqual(actual['landing_weight'],358)
        self.assertEqual(actual['puddle_splash'],358)
        self.assertEqual(actual['bird_chirp_reveal'],465)
    def test_stems(self):
        _,music=wavfile.read(ROOT/'public/audio/music.wav')
        _,sfx=wavfile.read(ROOT/'public/audio/sfx.wav')
        self.assertEqual(music.shape,self.master.shape)
        self.assertEqual(sfx.shape,self.master.shape)
        error=self.master.astype(float)-music.astype(float)-sfx.astype(float)
        self.assertLessEqual(np.max(np.abs(error)),1)
if __name__=='__main__':unittest.main(verbosity=2)
