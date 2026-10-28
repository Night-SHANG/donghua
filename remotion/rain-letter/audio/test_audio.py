#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,subprocess,sys,unittest
import numpy as np
from scipy.io import wavfile
P=Path(__file__).resolve().parent
class AudioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sr, data=wavfile.read(P/'master.wav');cls.x=data.astype(np.float64)/2147483648
        cls.qa=json.loads((P/'qa.json').read_text())
        cls.cues=json.loads((P/'cues.json').read_text())['cues']
    def test_format_and_exact_length(self):
        p=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(P/'master.wav')]))['streams'][0]
        self.assertEqual((p['codec_name'],p['sample_rate'],p['channels']),('pcm_s24le','48000',2));self.assertEqual(self.x.shape,(1440000,2))
    def test_measured_loudness_and_true_peak(self):
        self.assertLess(abs(self.qa['integrated_lufs']+20),.25);self.assertLess(self.qa['true_peak_dbtp'],-2)
    def test_no_clipping_nan_or_dc(self):
        self.assertTrue(np.isfinite(self.x).all());self.assertLess(np.max(abs(self.x)),.8);self.assertLess(abs(self.x.mean()),.001)
    def test_original_30s_not_15s_loop(self):
        self.assertGreater(np.sqrt(np.mean((self.x[:720000]-self.x[720000:])**2)),.015)
        self.assertLess(abs(np.corrcoef(self.x[:720000,0],self.x[720000:,0])[0,1]),.8)
    def test_stereo(self):self.assertGreater(np.sqrt(np.mean((self.x[:,0]-self.x[:,1])**2)),.002)
    def test_quiet_tail_and_clean_endpoints(self):
        rms=lambda a:np.sqrt(np.mean(a*a))
        self.assertLess(rms(self.x[-24000:]),rms(self.x[26*48000:27*48000])*.12)
        self.assertLess(np.max(abs(self.x[-48:])),1e-5);self.assertLess(np.max(abs(self.x[:48])),.001)
    def test_locked_cue_sheet(self):
        by={c['name']:c for c in self.cues}
        for name,time in [('drop_touches_paper',3.6),('ink_river',5.3),('stamp_lifts',8.8),('umbrella_folds',10.4),('drop_touches_envelope',16.8),('sunny_window_unfolds',17.2),('sun_watermark',27.5),('quiet_tail',28)]:self.assertEqual(by[name]['time'],time)
        for c in self.cues:self.assertTrue(0<=c['time']<=c.get('end',c['time'])<=30)
    def test_regeneration_determinism(self):
        digest=lambda:hashlib.sha256((P/'master.wav').read_bytes()).hexdigest()
        before=digest();subprocess.run([sys.executable,str(P/'synthesize.py')],check=True,stdout=subprocess.DEVNULL);self.assertEqual(before,digest())
if __name__=='__main__':unittest.main(verbosity=2)
