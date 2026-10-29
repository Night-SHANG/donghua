import unittest, pathlib, json
import numpy as np
from scipy.io import wavfile
ROOT=pathlib.Path(__file__).parent
class AudioTests(unittest.TestCase):
 def test_master_exists(self): self.assertTrue((ROOT/'master.wav').exists(), 'New full-fight master not generated')
 def setUp(self):
  self.cues=json.loads((ROOT/'cues.json').read_text()) if (ROOT/'cues.json').exists() else None
  if (ROOT/'master.wav').exists():
   self.sr,self.x=wavfile.read(ROOT/'master.wav');self.x=self.x.astype(float)/32768
 def test_duration_and_stereo(self):
  if not hasattr(self,'x'):self.skipTest('master pending')
  self.assertEqual(self.sr,48000);self.assertEqual(self.x.shape,(round(self.cues['duration']*48000),2))
 def test_peak_headroom(self):
  if not hasattr(self,'x'):self.skipTest('master pending')
  self.assertLess(np.max(np.abs(self.x)),.89);self.assertGreater(np.max(np.abs(self.x)),.15)
 def test_edges_quiet(self):
  if not hasattr(self,'x'):self.skipTest('master pending')
  self.assertLess(np.max(np.abs(self.x[:240])),.001);self.assertLess(np.max(np.abs(self.x[-240:])),.001)
 def test_true_stereo(self):
  if not hasattr(self,'x'):self.skipTest('master pending')
  self.assertGreater(np.sqrt(np.mean((self.x[:,0]-self.x[:,1])**2)),.002)
 def test_cue_frames(self):
  if not self.cues:self.skipTest('timeline pending')
  for e in self.cues['events']:
   self.assertGreaterEqual(e['frame'],0);self.assertLess(e['frame'],self.cues['duration']*self.cues['fps'])
   self.assertAlmostEqual(e['time'],e['frame']/self.cues['fps'],places=8)
 def test_score_has_arc(self):
  if not hasattr(self,'x'):self.skipTest('master pending')
  n=self.sr
  self.assertGreater(np.sqrt(np.mean(self.x[n:-n]**2)),.015)
  self.assertLess(np.sqrt(np.mean(self.x[-n:]**2)),np.sqrt(np.mean(self.x[3*n:8*n]**2)))
 def test_foley_is_nonuniform(self):
  if not (ROOT/'foley.wav').exists():self.skipTest('foley pending')
  _,a=wavfile.read(ROOT/'foley.wav');a=a.astype(float)/32768
  n=len(a)//4800;blocks=a[:n*4800].reshape(n,4800,2)
  self.assertGreater(np.std(np.sqrt(np.mean(blocks**2,axis=(1,2)))),.01)
if __name__=='__main__':unittest.main(verbosity=2)
