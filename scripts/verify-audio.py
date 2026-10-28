"""Technical audio gate; original detailed cue QA remains a separate optional gate."""
import json, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools/audio'))
import mix
p = 'film/audio/mix-aac.m4a'
meta = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',p]))
a = meta['streams'][0]
assert a['codec_name'] == 'aac'
assert int(a['sample_rate']) == 48000 and a['channels'] == 2
assert abs(float(meta['format']['duration'])-12) < 0.01
x = mix.load(p)
tp = mix.true_peak(x)
assert tp <= -1.5, f'AAC true peak {tp} exceeds -1.5 dBTP'
report = dict(duration=float(meta['format']['duration']), sample_rate=48000, channels=2, true_peak_dbtp=tp, codec='aac')
Path('film/audio/technical-qa.json').write_text(json.dumps(report,indent=2)+'\n')
print(report)
