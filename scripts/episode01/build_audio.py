"""EP01: deterministic original synthesis, no third-party audio samples.
Run from any directory; optional --out overrides generated audio directory.
Timing source is CUES below: edit once to match final picture.
"""
import argparse, json, math, re, shutil, subprocess, wave
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[2]
SR, D = 48000, 32.0
N = round(SR * D)
CUES = [
 ('paper_straighten', .65, -.55), ('relief', 1.15, -.55),
 ('ball_1', 2., .50), ('ball_2', 3., .50), ('catch', 5.5, -.38),
 ('box', 6.8, -.48), ('belly_test', 9.25, .48),
 ('body_bounce_1', 12.2, .45), ('body_bounce_2', 14.4, .40),
 ('chair_roll', 16.3, .12), ('soft_landing', 18., .25),
 ('happy_breath', 19.5, .3), ('yawn', 20.7, .3),
 ('small_snore', 24.8, .3), ('inhale', 26.3, .3),
 ('big_snore', 27.5, .3), ('paper_flap', 27.8, -.4),
 ('paper_smooth', 30.5, -.4), ('ending', 31.2, 0.)
]
rng = np.random.default_rng(20261028)
music, sfx = np.zeros((N, 2)), np.zeros((N, 2))
def grid(d): return np.arange(round(d * SR)) / SR
def env(t, d): return np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2

def noise(d, width=24):
 x = rng.normal(0, 1, round(d * SR))
 return np.convolve(x, np.ones(width) / math.sqrt(width), mode='same')

def put(bus, sec, signal, gain=1., pan=0.):
 i = round(sec * SR); a, b = max(0, i), min(N, i + len(signal))
 if b <= a: return
 p = np.clip(pan, -1, 1)
 bus[a:b] += signal[a-i:b-i, None] * gain * np.array([math.sqrt((1-p)/2), math.sqrt((1+p)/2)])

def pluck(freq, d=.48):
 t = grid(d)
 return (np.sin(2*np.pi*freq*t) + .24*np.sin(2*np.pi*freq*2*t) + .08*np.sin(2*np.pi*freq*3*t)) * (1-np.exp(-t*750)) * np.exp(-t*11) * np.minimum(1, (d-t)/.035)

def impact(freq, d, drop=.24, decay=18, grain=.04):
 t = grid(d)
 phase = freq*t - .5*freq*drop*t*t/d
 return (np.sin(2*np.pi*phase) + .15*np.sin(2*np.pi*phase*2.1) + grain*noise(d, 5)) * (1-np.exp(-t*1000)) * np.exp(-decay*t) * np.minimum(1, (d-t)/.025)

def breath(d, gain=.1, pitch=0):
 t = grid(d); sig = noise(d, 65) * gain
 if pitch: sig += .045*np.sin(2*np.pi*(pitch*t + 8*t*t/d))
 return sig*env(t, d)

def snore(d, strength):
 t = grid(d); phase = 2*np.pi*(58*t + 13*t*t/d)
 rasp = np.sin(phase) + .32*np.sin(phase*2) + .16*np.sin(phase*3)
 modulation = .55 + .45*np.sin(2*np.pi*19*t)**2
 return (rasp*.32 + noise(d, 100)*.15)*modulation*env(t, d)*strength

# Sparse pizzicato phrases. Deliberate holes give acting and impacts room.
# No music at 21.5–28.65; in particular no anticipation sting before the reversal.
for sec, freq, gain in [(.12,261.63,.10),(.48,329.63,.085),(1.12,392,.065),
 (4.15,293.66,.065),(7.65,392,.09),(8.05,523.25,.065),
 (9.5,440,.055),(10.25,261.63,.065),(11.1,329.63,.055),
 (13.1,392,.065),(15.35,293.66,.055),(16.0,349.23,.06),
 (18.8,329.63,.06),(19.3,392,.05),(20.,523.25,.045),
 (28.7,196,.065),(30.05,261.63,.075),(31.2,392,.085),(31.38,523.25,.07)]:
 put(music, sec, pluck(freq), gain, -.1 if sec<10 else .08)

for name, sec, pan in CUES:
 if name.startswith('ball_'):
  sig = impact(350 if name.endswith('1') else 310, .23, .5, 25, .03) * (.24 if name.endswith('1') else .30)
 elif name == 'catch': sig = impact(145, .18, .15, 32, .3)*.15
 elif name == 'box': sig = impact(720,.2,.04,35,.35)*.16 + impact(280,.2,.02,28,.0)*.07
 elif name == 'belly_test': sig = impact(210,.27,.48,16,.01)*.15
 elif name.startswith('body_bounce'):
  sig = impact(105 if name.endswith('1') else 83,.55,.35,11,.13) * (.31 if name.endswith('1') else .4)
 elif name == 'chair_roll':
  d=1.2;t=grid(d)
  sig=noise(d,90)*(.026+.018*np.sin(2*np.pi*14*t)**2)*env(t,d)
  sig+=.012*np.sin(2*np.pi*(180*t+15*t*t))*env(t,d)
 elif name == 'soft_landing':
  d=.8;t=grid(d);sig=breath(d,.115)+impact(67,d,.3,10,.04)*.09
 elif name == 'happy_breath': sig=breath(.6,.048)
 elif name == 'yawn':
  d=1.1;t=grid(d);phase=2*np.pi*(155*t+45*t*t/d-35*t*t*t/d**2)
  sig=(.045*np.sin(phase)+.013*np.sin(2*phase)+noise(d,110)*.027)*env(t,d)
 elif name == 'small_snore': sig=snore(.62,.35)
 elif name == 'inhale': sig=breath(.98,.11)
 elif name == 'big_snore': sig=snore(.72,.95)+breath(.72,.12)
 elif name in ('paper_straighten','paper_flap','paper_smooth'):
  d=.45 if name!='paper_flap' else .5;t=grid(d)
  n=noise(d,3); n-=np.convolve(n,np.ones(55)/55,mode='same')
  amp=.035 if name!='paper_flap' else .16
  sig=n*amp*env(t,d)*(.25+.75*np.sin(2*np.pi*13*t)**2)
  if name=='paper_flap':sig+=impact(160,d,.05,28,.12)*.15
 elif name=='relief':sig=breath(.35,.025)
 elif name=='ending': continue  # Score resolves this event; no redundant sound logo.
 else: raise ValueError(name)
 put(sfx,sec,sig,pan=pan)

# Two seconds of literal silence are intentional storytelling, not an export bug.
for bus in (music,sfx):
 bus[round(21.95*SR):round(24.0*SR)] = 0
 bus[:round(.025*SR)] *= np.linspace(0,1,round(.025*SR))[:,None]
 bus[-round(.06*SR):] *= np.linspace(1,0,round(.06*SR))[:,None]
mix = music + sfx
# Preserve cue dynamics; common gain only, peak ceiling with no compression.
gain = min(2., .75/max(float(np.max(np.abs(mix))),1e-9))
music*=gain;sfx*=gain;mix*=gain
parser=argparse.ArgumentParser()
parser.add_argument('--out', type=Path, default=ROOT/'film/house-comedy/episode-01/audio')
out=parser.parse_args().out
out.mkdir(parents=True,exist_ok=True)
def wav(path,arr):
 with wave.open(str(path),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
  w.writeframes(np.rint(np.clip(arr,-1,1)*32767).astype('<i2').tobytes())
for name,arr in [('mix',mix),('music',music),('sfx',sfx)]: wav(out/f'{name}.wav',arr)
report={'duration':D,'sample_rate':SR,'channels':2,'sample_frames':N,
 'sample_peak':float(np.max(np.abs(mix))),'sample_peak_dbfs':float(20*np.log10(np.max(np.abs(mix)))),
 'rms_dbfs':float(20*np.log10(np.sqrt(np.mean(mix**2)))),'clipped_samples':int(np.count_nonzero(np.abs(mix)>=1)),
 'silence_22_to_24_peak':float(np.max(np.abs(mix[22*SR:24*SR]))),
 'source':'Original deterministic synthesis; no external samples','human_audition':False,
 'events':[{'id':n,'t':t,'pan':p} for n,t,p in CUES]}
if shutil.which('ffmpeg'):
 r=subprocess.run(['ffmpeg','-hide_banner','-i',str(out/'mix.wav'),'-af','loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True)
 blocks=re.findall(r'\{\s*"input_i".*?\}',r.stderr,re.S)
 report['loudness_measurement']=json.loads(blocks[-1]) if blocks else {'error':r.stderr[-1500:]}
 report['ffmpeg_analysis_exit_code']=r.returncode
 report['loudnorm_output_fields_are_analysis_only']=True
 report['normalization_applied']=False
(out/'audio-build.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
