#!/usr/bin/env python3
"""Signal/format/cue verification, not subjective listening or artistic approval."""
import hashlib,json,subprocess,unittest
from pathlib import Path
import numpy as np
from scipy.io import wavfile
P=Path(__file__).resolve().parent
VARIANT=P.name
EXPECTED={'two-d':([3.6,7.2,11.2],[.8,1.5,3.6,5.5,7.2,9.4,11.2,12.6,14.2]),'three-d':([3.4,7.0,11.0],[.15,1.1,3.4,5.6,7.0,8.3,9.1,11.0,12.8,14.3])}
class AudioTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.sr,cls.pcm=wavfile.read(P/'master.wav');cls.x=cls.pcm.astype(float)/2147483648
  cls.c=json.loads((P/'audio-cues.json').read_text())
 def test_exact_pcm_format(self):
  self.assertEqual(self.sr,48000);self.assertEqual(self.x.shape,(720000,2));self.assertEqual(self.pcm.dtype,np.int32)
  d=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(P/'master.wav')],text=True))['streams'][0]
  self.assertEqual(d['codec_name'],'pcm_s24le')
 def test_peaks_endpoints_dc(self):
  self.assertLess(np.abs(self.x).max(),10**(-2/20));self.assertEqual(np.abs(self.x[[0,-1]]).max(),0)
  self.assertLess(abs(self.x.mean()),.001)
 def test_measured_loudness(self):
  from synthesize import measure
  d=measure(P/'master.wav');self.assertTrue(-20.2<=float(d['input_i'])<=-19.8,d);self.assertLess(float(d['input_tp']),-2)
 def test_story_cues(self):
  cuts,cues=EXPECTED[VARIANT]
  self.assertEqual([s['end'] for s in self.c['shots'][:-1]],cuts)
  self.assertEqual([c['time'] for c in self.c['cues']],cues)
  self.assertEqual(self.c['shots'][-1]['end'],15)
 def test_continuity_and_mono_compatibility(self):
  rms=np.sqrt(np.mean(self.x.reshape(30,24000,2)**2,axis=(1,2)))
  self.assertGreater(rms[1:-2].min(),.002)
  self.assertGreater(np.corrcoef(self.x.T)[0,1],.5)
  for t in EXPECTED[VARIANT][0]:
   i=round(t*self.sr);block=self.x[i-4800:i+4800]
   self.assertGreater(np.sqrt(np.mean(block**2)),.008)
 def test_gestural_foley_not_uniform_loop(self):
  sr,x=wavfile.read(P/'foley-only.wav');x=x.astype(float)/2147483648
  rms=np.sqrt(np.mean(x.reshape(30,24000,2)**2,axis=(1,2)))
  self.assertGreater(rms.max(),max(rms.min()*5,.005))
  times=np.array([n['time'] for n in self.c['notes'] if n['kind']=='piano'])
  self.assertGreater(np.std(np.diff(times)),.15)
 def test_decode(self):
  for name in ['master.wav','music.m4a','music-only.wav','foley-only.wav']:
   p=subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(P/name),'-f','null','-'],capture_output=True)
   self.assertEqual(p.returncode,0,p.stderr)
 def test_reproducible_master_and_stems(self):
  names=['master.wav','music-only.wav','foley-only.wav']
  before={n:hashlib.sha256((P/n).read_bytes()).hexdigest() for n in names}
  subprocess.run(['python',str(P/'synthesize.py')],check=True,stdout=subprocess.DEVNULL)
  after={n:hashlib.sha256((P/n).read_bytes()).hexdigest() for n in names}
  self.assertEqual(before,after)
if __name__=='__main__':unittest.main(verbosity=2)
