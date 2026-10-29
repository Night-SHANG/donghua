import unittest, json, pathlib, wave
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parent
class AudioTests(unittest.TestCase):
 def test_format(self):
  with wave.open(str(ROOT.parent/'public/audio/master-safe.wav')) as w:
   self.assertEqual((w.getframerate(),w.getnchannels(),w.getnframes(),w.getsampwidth()),(48000,2,1152000,2))
 def test_levels(self):
  m=json.loads((ROOT/'measurements.json').read_text())['master-safe']
  self.assertTrue(-21 <= float(m['input_i']) <= -19)
  self.assertLess(float(m['input_tp']),-2.7)
 def test_copy(self):
  self.assertEqual((ROOT/'master-safe.wav').read_bytes(),(ROOT.parent/'public/audio/master-safe.wav').read_bytes())
 def test_edges(self):
  with wave.open(str(ROOT/'master-safe.wav')) as w:x=np.frombuffer(w.readframes(w.getnframes()),np.int16).reshape(-1,2)
  self.assertLessEqual(np.max(np.abs(x[[0,-1]])),1)
  self.assertLess(np.max(np.abs(x.astype(float))),32767)
 def test_cues(self):
  d=json.loads((ROOT/'cues.json').read_text())
  self.assertEqual(d['duration_seconds'],24)
  for c in d['cues']:
   self.assertEqual(c['sample'],round(c['seconds']*48000))
   self.assertTrue(0 <= c['sample'] < 1152000)
  self.assertEqual([c['seconds'] for c in d['cues'] if c['kind']=='transition'],[4,8,12,16,20])
if __name__=='__main__':unittest.main()
