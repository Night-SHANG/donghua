import unittest, pathlib, hashlib, json
import numpy as np
from scipy.io import wavfile
ROOT=pathlib.Path(__file__).parent
class AudioTests(unittest.TestCase):
 def test_master_exists(self): self.assertTrue((ROOT/'master.wav').exists(), '12-second master not generated')
 def setUp(self):
  p=ROOT/'master.wav'
  if p.exists():
   self.sr,self.x=wavfile.read(p); self.x=self.x.astype(float)/32768
 def test_duration_stereo(self):
  if not hasattr(self,'x'): self.skipTest('master not yet generated')
  self.assertEqual(self.sr,48000); self.assertEqual(self.x.shape,(576000,2))
 def test_peak_headroom(self):
  if not hasattr(self,'x'): self.skipTest('master not yet generated')
  self.assertLess(np.max(np.abs(self.x)),.9); self.assertGreater(np.max(np.abs(self.x)),.2)
 def test_silent_edges(self):
  if not hasattr(self,'x'): self.skipTest('master not yet generated')
  self.assertLess(np.max(np.abs(self.x[:240])),.001); self.assertLess(np.max(np.abs(self.x[-240:])),.001)
 def test_not_repeated_half(self):
  if not hasattr(self,'x'): self.skipTest('master not yet generated')
  self.assertGreater(np.sqrt(np.mean((self.x[:288000]-self.x[288000:])**2)),.01)
 def test_true_stereo(self):
  if not hasattr(self,'x'): self.skipTest('master not yet generated')
  self.assertGreater(np.sqrt(np.mean((self.x[:,0]-self.x[:,1])**2)),.002)
 def test_frame_locked_cues(self):
  p=ROOT/'cues.json'
  if not p.exists(): self.skipTest('cue timeline pending director')
  q=json.loads(p.read_text()); self.assertEqual(q['fps'],60); self.assertEqual(q['duration'],12)
  for e in q['events']:
   self.assertGreaterEqual(e['frame'],0); self.assertLess(e['frame'],720); self.assertAlmostEqual(e['time'],e['frame']/60,places=8)
 def test_foley_variation(self):
  p=ROOT/'foley.wav'
  if not p.exists(): self.skipTest('foley not yet generated')
  _,a=wavfile.read(p); a=a.astype(float)/32768
  self.assertGreater(np.max(np.abs(a)),.15)
  self.assertGreater(np.std(np.sqrt(np.mean(a.reshape(120,4800,2)**2,axis=(1,2)))),.01)
if __name__=='__main__': unittest.main(verbosity=2)
