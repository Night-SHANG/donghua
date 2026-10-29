import unittest,json,pathlib,hashlib,wave
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parent
class AudioTests(unittest.TestCase):
 def test_format(self):
  for name in ['master','master-safe','music','sfx']:
   with wave.open(str(ROOT/(name+'.wav'))) as w:
    self.assertEqual((w.getframerate(),w.getnchannels(),w.getnframes(),w.getsampwidth()),(48000,2,336000,2))
 def test_cues(self):
  data=json.loads((ROOT/'cues.json').read_text()); cues=data['cues']
  for c in cues:self.assertEqual(c['sample'],c['frame']*1600)
  self.assertEqual([(c['frame'],c['kind']) for c in cues if c['event']=='low_kick_evaded'],[(105,'whoosh')])
  for f,e in [(26,'body_counter'),(50,'hand_brace'),(135,'finish_guard'),(143,'shoulder_body'),(164,'hand_support'),(177,'seated_ground')]:
   self.assertIn((f,e),[(c['frame'],c['event']) for c in cues])
 def test_levels(self):
  d=json.loads((ROOT/'measurements.json').read_text())['master']
  self.assertGreaterEqual(float(d['input_i']),-20)
  self.assertLessEqual(float(d['input_i']),-18)
  self.assertLess(float(d['input_tp']),-2)
 def test_safe_levels(self):
  d=json.loads((ROOT/'measurements.json').read_text())['master-safe']
  self.assertLess(float(d['input_tp']),-2.7)
  self.assertGreater(float(d['input_i']),-21)
 def test_copy(self):self.assertEqual((ROOT/'master.wav').read_bytes(),(ROOT.parent/'public/audio/master.wav').read_bytes())
 def test_edges(self):
  with wave.open(str(ROOT/'master.wav')) as w:x=np.frombuffer(w.readframes(w.getnframes()),np.int16).reshape(-1,2)
  self.assertLessEqual(np.max(np.abs(x[[0,-1]])),1)
  self.assertLess(np.max(np.abs(x.astype(float))),32767)
if __name__=='__main__':unittest.main()
