"""Packaging checks use synthetic media, never certify the animation itself."""
import importlib.util,tempfile,unittest
from pathlib import Path
s=importlib.util.spec_from_file_location('pack',Path(__file__).parents[1]/'scripts/package_review.py');p=importlib.util.module_from_spec(s);s.loader.exec_module(p)
class Packaging(unittest.TestCase):
 def test_empty_evidence_blocked(self):
  with tempfile.TemporaryDirectory() as d:
   with self.assertRaises(RuntimeError):p.finalize(Path(d))
 def test_cap_is_strict(self):
  with tempfile.TemporaryDirectory() as d:
   f=Path(d)/'payload';f.write_bytes(b'x');self.assertEqual(p.check_size(Path(d)),1)
   with f.open('wb') as h:h.truncate(p.CAP)
   with self.assertRaises(RuntimeError):p.check_size(Path(d))
 def test_synthetic_video_roundtrip_dense_global_indices(self):
  with tempfile.TemporaryDirectory() as d:
   w=Path(d);out=w/'out';out.mkdir();master=w/'fixture.mp4';target=out/'review.mp4'
   p.run(['ffmpeg','-y','-v','error','-f','lavfi','-i','color=c=teal:s=1920x1080:r=60','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','0.2','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-ac','2',master])
   p.verify_video(master,1920,1080,12,True);p.encode_review(master,target,w,12);p.verify_video(target,1280,720,12,True)
   result=p.dense(master,{'id':'fixture','start':612,'endExclusive':624},612,out,w)
   self.assertEqual(result['frames'],list(range(612,624)));self.assertTrue((out/result['sheets'][0]).exists())
if __name__=='__main__':unittest.main()
