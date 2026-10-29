import unittest
from verify_media import validate
class VerifyTest(unittest.TestCase):
 def base(self): return {'streams':[{'codec_type':'video','width':1280,'height':720,'r_frame_rate':'30/1','nb_frames':'900','duration':'30.000000','start_time':'0.000000'}],'format':{'duration':'30.000000'}}
 def test_valid_silent(self): self.assertIsNone(validate(self.base(),False))
 def test_reject_wrong_frame_count(self):
  p=self.base();p['streams'][0]['nb_frames']='899'
  with self.assertRaises(AssertionError):validate(p,False)
 def test_reject_public_audio(self):
  p=self.base();p['streams'].append({'codec_type':'audio'})
  with self.assertRaises(AssertionError):validate(p,False)
 def test_reject_wrong_dimensions(self):
  p=self.base();p['streams'][0]['width']=1920
  with self.assertRaises(AssertionError):validate(p,False)
 def test_reject_missing_private_audio(self):
  with self.assertRaises(AssertionError):validate(self.base(),True)
if __name__=='__main__':unittest.main()
