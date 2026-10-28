#!/usr/bin/env python3
"""Objective audio checks, not a claim of listening or artistic approval."""
import json,subprocess,unittest
from pathlib import Path
import numpy as np
from scipy.io import wavfile
P=Path(__file__).resolve().parent
class AudioTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.sr,cls.pcm=wavfile.read(P/'master.wav');cls.x=cls.pcm.astype(float)/2147483648
  cls.c=json.loads((P/'audio-cues.json').read_text());cls.r=json.loads((P/'build-result.json').read_text())
 def test_duration_and_pcm(self):
  self.assertEqual(self.sr,48000);self.assertEqual(self.x.shape,(720000,2));self.assertEqual(self.pcm.dtype,np.int32)
 def test_peaks_and_endpoints(self):
  self.assertLess(np.abs(self.x).max(),10**(-2/20));self.assertEqual(np.abs(self.x[[0,-1]]).max(),0)
  self.assertLess(abs(self.x.mean()),.001)
 def test_loudness(self):
  d=self.r['final_loudnorm'];self.assertTrue(-21<=float(d['input_i'])<=-19,d);self.assertLess(float(d['input_tp']),-2)
 def test_cues_exact(self):
  self.assertEqual([c['time'] for c in self.c['cues']],[.28,.6,2.1,3.6,4.7,6.6,7.2,8.8,11.0,12.4,14.2])
  self.assertEqual(self.c['shots'][-1]['end'],15)
 def test_no_silent_middle_or_phase_cancellation(self):
  rms=np.sqrt(np.mean(self.x.reshape(30,24000,2)**2,axis=(1,2)))
  self.assertGreater(rms[1:-2].min(),.002)
  self.assertGreater(np.corrcoef(self.x.T)[0,1],.5)
 def test_no_boundary_gap(self):
  # RMS in 100 ms blocks around transitions; no hard-muted scene boundaries.
  for time in [3.6,7.2,11.0]:
   i=round(time*self.sr)
   blocks=self.x[i-9600:i+9600].reshape(4,4800,2)
   rms=np.sqrt(np.mean(blocks**2,axis=(1,2)))
   self.assertGreater(rms.min(),.008)
   self.assertLess(rms.max()/rms.min(),8)
 def test_gust_and_suspension_are_different(self):
  sr,x=wavfile.read(P/'foley-only.wav');x=x.astype(float)/2147483648
  def rms(a,b):return float(np.sqrt(np.mean(x[round(a*sr):round(b*sr)]**2)))
  self.assertGreater(rms(.7,1.15),rms(1.5,1.9)*2)
  self.assertGreater(rms(7.4,8.1),rms(9.4,10.2)*2)
 def test_decode_and_aac_duration(self):
  for name in ['master.wav','music.m4a']:
   p=subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(P/name),'-f','null','-'],capture_output=True)
   self.assertEqual(p.returncode,0,p.stderr)
  p=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(P/'music.m4a')],text=True)
  self.assertAlmostEqual(float(json.loads(p)['format']['duration']),15,places=2)
if __name__=='__main__':unittest.main(verbosity=2)
