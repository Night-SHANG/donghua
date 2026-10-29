"""Objective score/Foley contract: python audio/test_audio.py."""
import json,unittest
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from generate import source_events
ROOT=Path(__file__).resolve().parent.parent
class AudioContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cues=json.loads((ROOT/'audio/cues.json').read_text())
        cls.report=json.loads((ROOT/'audio/measurements.json').read_text())
        cls.sr,cls.master=wavfile.read(ROOT/'public/audio/master.wav')
    def test_duration_and_format(self):
        self.assertEqual(self.sr,48000);self.assertEqual(self.master.shape,(960000,2))
        self.assertEqual(self.master.dtype,np.dtype('int16'))
        spec=json.loads((ROOT/'film-spec.json').read_text())
        self.assertEqual(spec['durationInFrames']/spec['fps'],20)
    def test_loudness(self):
        self.assertLess(np.max(np.abs(self.master.astype(float))),32767)
        self.assertEqual(self.report['clippedSamples'],0)
        self.assertLessEqual(self.report['truePeakDbTP'],-2)
        self.assertTrue(-20<=self.report['integratedLufs']<=-17)
    def test_fades(self):
        self.assertEqual(np.max(np.abs(self.master[0])),0)
        self.assertEqual(np.max(np.abs(self.master[-1])),0)
        self.assertLess(np.sqrt(np.mean(self.master[-480:].astype(float)**2)),15)
    def test_all_source_events(self):
        self.assertEqual(self.cues['storyAnchors'],source_events())
        actual={(c['frame'],c['sourceKind']) for c in self.cues['cues']}
        for event in source_events():self.assertIn((event['frame'],event['name']),actual)
        self.assertEqual(self.report['sourceEventCount'],len(source_events()))
        for c in self.cues['cues']:
            self.assertAlmostEqual(c['seconds'],c['frame']/30)
            self.assertTrue(0<=c['frame']<600);self.assertTrue(c['synthetic'])
            if c['sourceKind'] in ['whoosh','sweep']:self.assertTrue(c['name'].startswith('miss_air'))
        self.assertEqual(next(c['frame'] for c in self.cues['cues'] if c['name']=='bell_ring'),480)
    def test_stems(self):
        _,music=wavfile.read(ROOT/'public/audio/music.wav');_,sfx=wavfile.read(ROOT/'public/audio/sfx.wav')
        self.assertEqual(music.shape,self.master.shape);self.assertEqual(sfx.shape,self.master.shape)
        self.assertLessEqual(np.max(np.abs(self.master.astype(float)-music.astype(float)-sfx.astype(float))),1)
        # Musical pause at post strike; bell alone occupies the surprise beat.
        self.assertLess(np.sqrt(np.mean(music[16*48000:17*48000].astype(float)**2)),2)
        self.assertGreater(np.sqrt(np.mean(sfx[16*48000:17*48000].astype(float)**2)),100)
if __name__=='__main__':unittest.main(verbosity=2)
