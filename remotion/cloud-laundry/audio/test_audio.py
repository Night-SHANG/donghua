import unittest, pathlib, hashlib
import numpy as np
from scipy.io import wavfile
ROOT=pathlib.Path(__file__).parent
class AudioTests(unittest.TestCase):
 def test_master_exists(self): self.assertTrue((ROOT/'master.wav').exists(), '30-second master not generated')
 def setUp(self):
  p=ROOT/'master.wav'
  if p.exists():
   self.sr,self.x=wavfile.read(p); self.x=self.x.astype(float)/32768
 def test_duration_and_stereo(self):
  if not hasattr(self,'x'): self.skipTest('master not yet generated')
  self.assertEqual(self.sr,48000); self.assertEqual(self.x.shape,(1440000,2))
 def test_peak_headroom(self):
  if not hasattr(self,'x'): self.skipTest('master not yet generated')
  self.assertLess(np.max(np.abs(self.x)),.71); self.assertGreater(np.max(np.abs(self.x)),.1)
 def test_silent_edges(self):
  if not hasattr(self,'x'): self.skipTest('master not yet generated')
  self.assertLess(np.max(np.abs(self.x[:240])),.001); self.assertLess(np.max(np.abs(self.x[-240:])),.001)
 def test_not_repeated_half(self):
  if not hasattr(self,'x'): self.skipTest('master not yet generated')
  self.assertGreater(np.sqrt(np.mean((self.x[:720000]-self.x[720000:])**2)),.01)
 def test_no_interior_silence(self):
  if not hasattr(self,'x'): self.skipTest('master not yet generated')
  for i in range(1,29): self.assertGreater(np.sqrt(np.mean(self.x[i*self.sr:(i+1)*self.sr]**2)),.001)
 def test_true_stereo(self):
  if not hasattr(self,'x'): self.skipTest('master not yet generated')
  self.assertGreater(np.sqrt(np.mean((self.x[:,0]-self.x[:,1])**2)),.002)
if __name__=='__main__': unittest.main(verbosity=2)
