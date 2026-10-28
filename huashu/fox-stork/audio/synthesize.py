#!/usr/bin/env python3
"""Original Fox and Stork chamber miniature + restrained synthetic Foley.

No sample files, external APIs, synthesis servers, voices or copied score.
Deterministic numpy/scipy synthesis; ffmpeg only packs/encodes the result.
Usage: python audio/synthesize.py
"""
from pathlib import Path
import hashlib
import json
import math
import subprocess
import sys
import numpy as np
import scipy
from scipy import signal as ss
from scipy.io import wavfile

OUT = Path(__file__).resolve().parent
SR, DURATION, SEED = 48000, 65, 20261028
N = SR * DURATION
RNG = np.random.default_rng(SEED)
MUSIC = np.zeros((N, 2), np.float64)
FOLEY = np.zeros_like(MUSIC)
NOTES, CUES = [], []
SHOTS = [
 (0,5,'serve'),(5,10,'fox_lap'),(10,15,'stork_peck'),
 (15,19,'polite_reaction'),(19,24,'angled_fail'),(24,28,'fox_finish'),
 (28,33,'invitation'),(33,38,'jars'),(38,43,'stork_drink'),
 (43,48,'fox_blocked'),(48,53,'fox_lick'),(53,57,'deadpan'),
 (57,61,'fox_realizes'),(61,65,'final')]
QUIET_HOLDS = [(12.18,12.70),(17.00,17.80),(45.20,45.80),(50.30,51.00),(60.10,61.00),(63.50,65.00)]

def tvec(dur):
    return np.arange(round(dur * SR), dtype=np.float64) / SR

def fade(x, attack=.006, release=.03):
    x = np.array(x, dtype=np.float64, copy=True)
    a, r = min(len(x),round(attack*SR)), min(len(x),round(release*SR))
    if a: x[:a] *= np.sin(np.linspace(0,np.pi/2,a)) ** 2
    if r: x[-r:] *= np.sin(np.linspace(np.pi/2,0,r)) ** 2
    return x

def filt(x, cutoff, mode='lowpass', order=2):
    return ss.sosfilt(ss.butter(order,cutoff,btype=mode,fs=SR,output='sos'),x)

def noise(d):
    return RNG.standard_normal(round(d*SR))

def unit(x):
    return np.asarray(x) / max(1e-9,float(np.max(np.abs(x))))

def hz(note):
    key={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}[note[0]]
    acc=note[1:-1]
    key += acc.count('#')-acc.count('b')
    return 440*2**((12*(int(note[-1])+1)+key-69)/12)

def plucked(note,dur=.82,kind='pizz'):
    """Damped string modes plus soft pick/wood body; no electronic blip."""
    t=tvec(dur); f=hz(note)
    # Warm high partials and unequal decay emulate a plucked acoustic body.
    if kind=='harp':
        amps=[1,.49,.26,.11,.075,.047,.035,.023,.017,.013]
        decay,bright=3.0,.45
    elif kind=='bass':
        amps=[1,.53,.21,.13,.067,.034,.021,.014]
        decay,bright=4.4,.40
    else:
        amps=[1,.78,.34,.25,.15,.088,.06,.04,.025,.016,.010]
        decay,bright=6.8,.34
    phase=2*np.pi*np.cumsum(f*(1+.0018*np.exp(-t/.026)))/SR
    x=np.zeros_like(t)
    for k,a in enumerate(amps,1):
        if f*k>12500: break
        angle=.21*k + RNG.uniform(-.025,.025)
        envelope=np.exp(-t*decay*(1+bright*(k-1)))
        x += a * envelope * np.sin(phase*k+angle)
    body = filt(noise(dur),[160,1900],'bandpass') * np.exp(-t/.014)
    x += .13*body
    x=filt(x,7200)
    return unit(fade(x,.006,.065))

def woodwind(note,dur=.55,kind='reed'):
    """Breath-led, gently vibrating chamber reed / flute, not a pure sine."""
    t=tvec(dur+.18); f=hz(note)
    vib=.0027*np.sin(2*np.pi*4.6*t)*np.clip((t-.12)/.2,0,1)
    phase=2*np.pi*np.cumsum(f*(1+vib+.001*np.exp(-t/.04)))/SR
    amps=([1,.13,.31,.06,.12,.025,.05,.013,.018] if kind=='reed'
          else [1,.22,.10,.038,.018,.01])
    x=sum(a*np.sin(phase*k+.12*k) for k,a in enumerate(amps,1))
    air=filt(noise(len(t)/SR),[500,4200],'bandpass')
    x += air*(.055 if kind=='flute' else .032)
    env=np.minimum(1,t/.035)*(.9+.1*np.exp(-t/.12))
    tail=t>dur
    env[tail]*=np.cos(np.minimum(1,(t[tail]-dur)/.18)*np.pi/2)**2
    return unit(fade(x*env,.014,.02))

def mix(bus,x,time,gain,pan=0):
    start=round(time*SR)
    if start<0: x=x[-start:]; start=0
    if start>=N:return
    x=np.asarray(x)[:N-start]*gain
    angle=(pan+1)*np.pi/4
    bus[start:start+len(x),0] += x*np.cos(angle)
    bus[start:start+len(x),1] += x*np.sin(angle)

def note(time,pitch,instrument='pizz',gain=.09,dur=.76,pan=-.16):
    if instrument in ('reed','flute'):
        x=woodwind(pitch,dur,instrument)
    else:
        x=plucked(pitch,dur,instrument)
    mix(MUSIC,x,time,gain,pan)
    NOTES.append(dict(time=time,pitch=pitch,instrument=instrument,duration=round(len(x)/SR,4),gain=gain,pan=pan))

def chord(time,pitches,gain=.035,spacing=.026,instrument='harp',dur=1.1):
    for i,p in enumerate(pitches):
        note(time+i*spacing,p,instrument,gain,dur,(-.3+.16*i))

def melody(start,events,instrument='pizz',gain=.1):
    # A relaxed 96-BPM phrase grid; action beats override it deliberately.
    for beat,pitch,hold in events:
        note(start+beat*.625,pitch,instrument,gain,hold, .18 if instrument in ('flute','reed') else -.14)

def modal(dur,modes):
    t=tvec(dur)
    x=sum(a*np.sin(2*np.pi*f*t+.1)*np.exp(-t/tau) for f,a,tau in modes)
    return fade(x,.0015,.02)

def ceramic(small=False):
    if small:
        return unit(modal(.18,[(1540,1,.025),(2397,.44,.019),(3299,.18,.014)])
                    +filt(noise(.18),[1200,4500],'bandpass')*.11*np.exp(-tvec(.18)/.008))
    t=tvec(.47)
    modes=[(690,1,.09),(1126,.45,.095),(1819,.24,.061),(2670,.12,.03)]
    x=modal(.47,modes)+.5*np.sin(2*np.pi*132*t)*np.exp(-t/.028)
    return unit(x)

def vessel():
    t=tvec(.5)
    x=modal(.5,[(410,1,.11),(807,.37,.09),(1372,.15,.055),(2076,.08,.025)])
    x+=filt(noise(.5),900)*.55*np.exp(-t/.022)
    return unit(x)

def bubble(dur=.12,freq=740,fall=.3):
    t=tvec(dur)
    f=freq*(1-fall*(1-np.exp(-t/.035)))
    x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/.035)
    return fade(x,.004,.02)

def liquid(kind='lap',dur=.24):
    t=tvec(dur); x=np.zeros_like(t)
    # Filtered air/water friction with short inharmonic water cavities.
    flow=filt(noise(dur),[520,3100],'bandpass')
    env=np.sin(np.pi*t/dur)**1.7
    if kind=='sip':
        x=.24*flow*env*(.72+.28*np.sin(2*np.pi*8*t))
        bursts=[(.035,670,.22),(.12,940,.16),(.24,520,.12)]
    elif kind=='drop':
        x=.11*flow*env*np.exp(-t/.07)
        bursts=[(.002,1120,.37),(.035,720,.22)]
    elif kind=='dry_lick':
        x=.30*flow*env
        bursts=[(.01,470,.09)]
    else:
        x=.30*flow*env*np.exp(-t/.18)
        bursts=[(.012,950,.23),(.075,630,.18)]
    for start,f,g in bursts:
        i=round(start*SR)
        if i>=len(x):continue
        b=bubble(min(.12,(len(x)-i)/SR),f)
        x[i:i+len(b)]+=b*g
    return unit(fade(x,.006,.035))

def cloth(dur=.28):
    t=tvec(dur)
    x=filt(noise(dur),[250,2200],'bandpass')
    return unit(x*np.sin(np.pi*t/dur)**2)

def sniff(dur=.32):
    t=tvec(dur)
    x=filt(noise(dur),[450,2600],'bandpass')
    env=np.sin(np.pi*t/dur)**2*(.75+.25*np.cos(2*np.pi*13*t))
    return unit(x*env)

def muzzle_bump():
    t=tvec(.25)
    x=.8*np.sin(2*np.pi*175*t)*np.exp(-t/.031)
    x+=.23*modal(.25,[(730,1,.048),(1467,.22,.031)])
    x+=.17*filt(noise(.25),800)*np.exp(-t/.014)
    return unit(fade(x,.003,.025))

def step():
    t=tvec(.16)
    x=filt(noise(.16),[140,1700],'bandpass')*np.exp(-t/.025)
    return unit(fade(x,.004,.015))

def tummy():
    t=tvec(.46)
    f=106+22*np.sin(2*np.pi*2.2*t)*np.exp(-t/.3)
    ph=2*np.pi*np.cumsum(f)/SR
    x=(np.sin(ph)+.35*np.sin(ph*2.03))*(.65+.35*np.sin(2*np.pi*10*t))
    x+=filt(noise(.46),[90,330],'bandpass')*.33
    return unit(fade(x*np.exp(-t/.24),.035,.09))

def foley(time,kind,description,gain=.07,pan=0,dur=None):
    makers={
      'plate_place':lambda:ceramic(False),'beak_tap':lambda:ceramic(True),
      'vessel_set':vessel,'plate_slide':lambda:cloth(.66),
      'lap':lambda:liquid('lap',dur or .22),
      'sip':lambda:liquid('sip',dur or .46),
      'drop':lambda:liquid('drop',.15),
      'dry_lick':lambda:liquid('dry_lick',.18),
      'cloth':lambda:cloth(dur or .28),'sniff':lambda:sniff(dur or .3),
      'muzzle_bump':muzzle_bump,'step':step,'tummy':tummy,
      'swallow':lambda:liquid('sip',.18)}
    x=makers[kind]()
    mix(FOLEY,x,time,gain,pan)
    CUES.append(dict(time=time,end=round(time+len(x)/SR,4),kind=kind,description=description,gain=gain,pan=pan))

def score():
    # I. Fox's invitation: an asymmetric 5-note motif, gentle F6 chamber lilt.
    chord(.20,['F3','A3','D4'],.030)
    melody(.25,[(0,'A4',.72),(1,'C5',.54),(2,'D5',.76),(3.5,'C5',.63),(5,'A4',.90)],gain=.100)
    note(2.75,'C3','bass',.060,1.0)
    chord(3.43,['G3','Bb3','E4'],.023)
    # Fox enjoys the soup: motif confidently returns, not a continuous loop.
    chord(5.08,['F3','A3','C4'],.033)
    melody(5.15,[(0,'A4',.6),(1,'C5',.54),(2,'D5',.72),(3.5,'A4',.7),(5,'G4',.61),(6,'F4',.8)],gain=.082)
    note(7.60,'C3','bass',.043,.9)
    note(8.20,'A3','pizz',.033,.48,-.14)
    note(8.85,'A3','harp',.029,.9,.15)
    # Stork approaches the plate; the unfinished phrase leaves the joke space.
    chord(10.04,['D3','A3','F4'],.023)
    note(10.40,'A4','reed',.055,.53,.19)
    note(11.10,'C5','reed',.051,.47,.19)
    note(13.13,'B4','reed',.038,.32,.19) # gentle unresolved question
    note(14.00,'A4','harp',.035,.62,.03)
    # The polite look is almost empty: musical eyebrow, then wait.
    note(15.12,'G3','bass',.032,.8)
    note(15.65,'G4','reed',.042,.43,.15)
    note(16.40,'F4','reed',.034,.43,.15)
    # Tilt and try again; do not punctuate the failure as violence.
    chord(19.12,['G3','Bb3','D4'],.021)
    note(19.62,'Bb4','pizz',.053,.5)
    note(20.25,'A4','pizz',.049,.46)
    note(22.53,'G4','reed',.033,.44,.14)
    note(23.22,'E4','harp',.028,.62)
    # Last fox lick and stork's quiet decision; dominant suspension.
    chord(24.05,['C3','G3','Bb3'],.022)
    note(24.32,'G4','pizz',.054,.5)
    note(25.62,'E4','pizz',.040,.52)
    note(26.80,'D4','harp',.042,.55,.16)
    note(27.38,'G4','harp',.046,.50,.16)
    # II. Reciprocal invitation. Same identity, swapped instrumentation.
    chord(28.05,['F3','A3','D4'],.027)
    melody(28.25,[(0,'A4',.48),(1,'C5',.46),(2,'D5',.66),(3.5,'C5',.60),(5,'A4',.62)],'flute',.052)
    for t,p in [(30.6,'F3'),(31.225,'A3'),(31.85,'C4'),(32.475,'F4')]:
        note(t,p,'pizz',.045,.43,-.18)
    # Matched jars; warmer B-flat harmony, light supporting pulse.
    chord(33.10,['Bb2','F3','D4'],.028)
    melody(33.38,[(0,'D5',.54),(1,'C5',.46),(2.5,'A4',.65),(4,'F4',.73),(6,'G4',.62)],'flute',.050)
    note(35.60,'F3','bass',.036,1)
    # Stork drinks easily, a lyrical answer rather than triumphal fanfare.
    chord(38.06,['F3','A3','C4'],.026)
    melody(38.30,[(0,'A4',.70),(1.5,'C5',.80),(3.5,'F5',.62),(5,'E5',.55),(6,'D5',.78)],'flute',.047)
    note(40.70,'D3','harp',.035,1.1)
    # Fox's muzzle cannot fit. Music is cut away ahead of the contact.
    note(43.08,'G3','bass',.033,.62)
    note(43.39,'A4','pizz',.053,.48)
    note(44.04,'Bb4','pizz',.047,.44)
    note(46.18,'A4','reed',.031,.48,.15)
    note(47.10,'F4','harp',.025,.69)
    # A single outside lick, then a full awkward beat without score.
    note(48.12,'D3','bass',.029,.67)
    note(48.50,'A4','pizz',.039,.48)
    note(49.12,'G4','pizz',.035,.45)
    # Deadpan: one low, almost dry musical breath, no laugh-track flourish.
    note(53.11,'F3','bass',.026,.58)
    note(54.08,'E4','reed',.030,.48,.13)
    # Realization: the same motif folded down in a soft, yielding cadence.
    chord(57.04,['Bb2','F3','D4'],.018)
    note(57.15,'C5','reed',.036,.63,.18)
    note(58.70,'A4','reed',.036,.46,.18)
    note(59.35,'F4','reed',.032,.52,.18)
    note(58.70,'D3','harp',.028,.88)
    chord(59.62,['C3','E3','Bb3'],.018,dur=.65)
    # Final answer, not a moral title-card sting; stop for the face at 63.5.
    chord(61.07,['F3','A3','C4'],.023,dur=1.3)
    note(61.18,'A4','flute',.038,.67,.15)
    note(62.01,'F4','harp',.045,1.08,.03)
    note(62.58,'F3','bass',.028,.75)

def effects():
    foley(1.2,'plate_slide','浅盘沿木桌轻滑',.026,-.12)
    foley(2.0,'plate_place','浅盘落定：闷底、短陶瓷尾',.087,-.10)
    for t,g in [(6.2,.060),(6.65,.052),(7.1,.054)]:
        foley(t,'lap','狐狸轻舔浅汤',g,-.16)
    foley(8.2,'cloth','得意抬头的微小毛发摩擦',.011,-.15,.20)
    foley(12.1,'beak_tap','鹳喙触浅盘：短干 tik 后留白',.065,.17)
    foley(13.2,'drop','湿喙尖带起一小滴',.019,.16)
    # No literal cartoon blink sound; facial acting remains silent.
    foley(21.0,'beak_tap','侧向喙轻触盘沿',.048,.16)
    foley(21.35,'drop','一点汤滴回浅盘',.036,.10)
    foley(24.8,'lap','狐狸舔完最后一口',.051,-.14)
    foley(25.5,'plate_slide','空盘的一点干摩擦',.013,-.10,.2)
    foley(28.8,'cloth','鹳翼礼貌发出回请姿态',.019,.16,.32)
    for t,p in [(31.20,-.2),(31.58,.15),(31.96,-.15),(32.34,.14),(32.72,-.08)]:
        foley(t,'step','过场轻步，非节拍鼓',.020,p)
    foley(34.2,'vessel_set','第一只长颈瓶落桌',.082,.18)
    foley(34.55,'vessel_set','第二只长颈瓶落桌',.073,-.16)
    foley(36.2,'sniff','狐狸闻香的轻鼻息',.026,-.16)
    foley(39.35,'cloth','细喙擦入瓶口：轻干擦，不提前出现取食水声',.016,.19,.18)
    foley(40.2,'sip','鹳顺畅取食，细水声',.044,.19,.50)
    foley(41.8,'swallow','41.5抬头后很轻的吞咽',.023,.17)
    foley(44.0,'sniff','狐狸试探瓶口香气',.032,-.17)
    foley(45.1,'muzzle_bump','口鼻止于窄瓶口，软碰不是受伤',.055,-.17)
    # 45.65 tiny retreat is intentionally silent to preserve the comic hold.
    foley(49.4,'dry_lick','瓶外一次短干舔：没有汤',.041,-.17)
    # 50.3 empty-tongue withdrawal is entirely silent, not a second joke sound.
    foley(55.5,'swallow','鹳平静的一小口吞咽',.022,.17)
    foley(57.5,'sniff','狐狸吸气欲抗议，但不发声',.020,-.17,.24)
    foley(58.7,'cloth','耳朵垂下，只留极小柔软摩擦',.011,-.18,.24)
    foley(60.1,'cloth','礼貌的一手，轻毛发摩擦',.012,-.16,.26)
    foley(62.1,'sip','鹳最后轻抿一口',.026,.18,.34)
    foley(63.0,'tummy','狐狸小肚咕，温和低声、不滑稽炸响',.039,-.15)

def room(x,amount=.065):
    # Fixed short early reflections and soft diffuse tail, never a big hall.
    result=x.copy()
    for delay,gain,cross in [(.019,.38,True),(.031,.25,False),(.049,.18,True),(.073,.12,False)]:
        d=round(delay*SR)
        src=x[:,::-1] if cross else x
        result[d:]+=src[:-d]*(gain*amount)
    ir_t=tvec(.28)
    ir=RNG.standard_normal(len(ir_t))*np.exp(-ir_t/.047)
    ir=filt(ir,4500); ir[:round(.012*SR)]=0
    ir/=np.sqrt(np.sum(ir**2))
    for channel in range(2):
        result[:,channel]+=amount*.60*ss.fftconvolve(x[:,channel],ir)[:N]
    return result

def kweight(x):
    # BS.1770 coefficients at 48 kHz, independently checked against ffmpeg.
    b1=[1.53512485958697,-2.69169618940638,1.19839281085285]
    a1=[1,-1.69065929318241,.73248077421585]
    b2=[1,-2,1]; a2=[1,-1.99004745483398,.99007225036621]
    return ss.lfilter(b2,a2,ss.lfilter(b1,a1,x,axis=0),axis=0)

def lufs(x):
    k=kweight(x); block,hop=19200,4800
    energies=np.array([np.mean(np.sum(k[i:i+block]**2,axis=1)) for i in range(0,len(k)-block+1,hop)])
    ls=-.691+10*np.log10(energies+1e-20)
    z=energies[ls>-70]
    if not len(z):return -120.
    relative=-.691+10*np.log10(np.mean(z))-10
    z=z[(-.691+10*np.log10(z))>relative]
    return float(-.691+10*np.log10(np.mean(z)))

def db(v):return float(20*np.log10(max(1e-12,float(v))))

def run(args):
    p=subprocess.run(args,check=True,capture_output=True,text=True)
    return p.stdout,p.stderr

def pack_pcm(path,y):
    tmp=path.with_suffix('.float.wav')
    wavfile.write(tmp,SR,y.astype(np.float32))
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(tmp),'-c:a','pcm_s24le',str(path)])
    tmp.unlink()

def main():
    score(); effects()
    m=room(MUSIC,.09); f=room(FOLEY,.035)
    # Music moves out of the way of visual reaction holds. Foley tails remain
    # natural but no new musical hit intrudes on the designated silence.
    for a,b in QUIET_HOLDS:
        lo,hi=round(a*SR),round(b*SR)
        shoulder=round(.065*SR)
        m[max(0,lo-shoulder):lo]*=np.linspace(1,0,min(shoulder,lo))[:,None]
        m[lo:hi]=0
        if hi<N:m[hi:min(N,hi+shoulder)]*=np.linspace(0,1,min(shoulder,N-hi))[:,None]
    m[round(63.5*SR):]=0
    f[round(63.50*SR):]=0
    # Gentle DC removal and inaudible infrasonic filtering, not brightening.
    for a in (m,f):
        for c in range(2):a[:,c]=filt(a[:,c],40,'highpass',2)
        # Fade to mathematical silence. The last 100 ms are zero samples.
        start,end=round(63.46*SR),round(63.56*SR)
        a[start:end]*=np.linspace(1,0,end-start)[:,None]
        a[end:]=0
    y=m+f
    target=-20.0
    gain=10**((target-lufs(y))/20)
    peak=np.max(np.abs(ss.resample_poly(y*gain,4,1,axis=0)))
    if peak>10**(-2.3/20):
        gain *= 10**(-2.3/20)/peak
    # A single linear gain preserves the intentionally quiet pauses.
    y*=gain; m*=gain; f*=gain
    pack_pcm(OUT/'master.wav',y)
    pack_pcm(OUT/'music-only.wav',m)
    pack_pcm(OUT/'foley-only.wav',f)
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(OUT/'master.wav'),'-c:a','aac','-b:a','96k','-ar',str(SR),'-ac','2','-t','65','-movflags','+faststart','-metadata','title=Fox and Stork — Original Chamber Score and Foley','-metadata','comment=Original procedural composition; no external samples; 2026-10-28',str(OUT/'music.m4a')])
    probe,_=run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(OUT/'music.m4a')])
    (OUT/'ffprobe-aac.json').write_text(probe)
    meters={}
    for name in ['master.wav','music.m4a']:
        _,report=run(['ffmpeg','-hide_banner','-i',str(OUT/name),'-af','ebur128=peak=true','-f','null','-'])
        (OUT/(name+'.ebur128.txt')).write_text(report)
        meters[name]=report[report.rfind('Summary:'):].strip()
    # AAC decode is measured separately: lossy reconstruction can overshoot.
    p=subprocess.run(['ffmpeg','-v','error','-i',str(OUT/'music.m4a'),'-f','f32le','-acodec','pcm_f32le','-'],check=True,capture_output=True)
    decoded=np.frombuffer(p.stdout,dtype='<f4').reshape(-1,2).astype(np.float64)
    manifest={
      'title':'Fox and Stork — a miniature in F','duration':65,'sample_rate':SR,'channels':2,
      'seed':SEED,'beat_grid':{'bpm':96,'quarter_seconds':.625,'note':'Phrases restart at narrative beats; Foley uses locked absolute visual action times.'},
      'provenance':'Original composition and procedural instrument/Foley synthesis. No external samples, no narration or dialogue, no media APIs.',
      'source':'synthesize.py','mix_file':'master.wav','compressed_mix_file':'music.m4a',
      'important':'music.m4a contains the full music + Foley mix; do not layer it on top of master.wav.',
      'stems':['music-only.wav','foley-only.wav'],'shots':[dict(start=a,end=b,id=id) for a,b,id in SHOTS],
      'quiet_holds':[dict(start=a,end=b,note='No new music onset; tiny natural contact tails may decay at the boundary.') for a,b in QUIET_HOLDS],
      'music_notes':sorted(NOTES,key=lambda c:c['time']),'foley':sorted(CUES,key=lambda c:c['time']),
      'mix':{'linear_gain':gain,'limiter':'None. Peak-safe linear normalization preserves pauses.','integrated_lufs':lufs(y),'sample_peak_dbfs':db(np.max(np.abs(y))),'true_peak_dbtp_4x':db(np.max(np.abs(ss.resample_poly(y,4,1,axis=0))))},
      'aac_decoded':{'samples':len(decoded),'integrated_lufs':lufs(decoded),'sample_peak_dbfs':db(np.max(np.abs(decoded))),'true_peak_dbtp_4x':db(np.max(np.abs(ss.resample_poly(decoded,4,1,axis=0))))},
      'environment':{'python':sys.version.split()[0],'numpy':np.__version__,'scipy':scipy.__version__},
      'hold_measurements':[dict(start=a,end=b,rms_dbfs=db(np.sqrt(np.mean(y[round(a*SR):round(b*SR)]**2))),peak_dbfs=db(np.max(np.abs(y[round(a*SR):round(b*SR)])))) for a,b in QUIET_HOLDS],
      'boundary_max_adjacent_sample_delta':[dict(time=a,max_delta=float(np.max(np.abs(y[a*SR]-y[a*SR-1])))) for a,b,id in SHOTS[1:]],
      'shot_rms_dbfs':[dict(id=id,start=a,end=b,rms_dbfs=db(np.sqrt(np.mean(y[a*SR:b*SR]**2)))) for a,b,id in SHOTS]
    }
    for filename in ['master.wav','music.m4a','music-only.wav','foley-only.wav']:
        manifest.setdefault('files',{})[filename]={'bytes':(OUT/filename).stat().st_size,'sha256':hashlib.sha256((OUT/filename).read_bytes()).hexdigest()}
    (OUT/'audio-cues.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    qa=[
      'FOX / STORK — AUDIO QA (actual measured outputs)',
      '65.000 s exactly; 3,120,000 frames; 48,000 Hz; stereo; master PCM 24-bit.',
      'Full mix: master.wav (lossless), music.m4a (AAC 96 kbit/s target).',
      'Do not layer those two files: both contain music and Foley.',
      'Optional separated stems: music-only.wav and foley-only.wav; same normalization gain, sample aligned.',
      f'Finite samples: {bool(np.isfinite(y).all())}; clipped samples >=1.0: {np.count_nonzero(np.abs(y)>=1)}',
      f'Master measured: {manifest["mix"]}',
      f'AAC decoded measured: {manifest["aac_decoded"]}',
      f'AAC bytes: {(OUT/"music.m4a").stat().st_size}',
      f'Last 100ms maximum amplitude: {np.max(np.abs(y[-4800:]))}',
      f'Environment: {manifest["environment"]}',
      'Quiet holds: 12.18–12.70, 17.00–17.80, 45.20–45.80, 50.30–51.00, 60.10–61.00, 63.50–65.00; no new music onsets.',
      'Measured hold RMS / peaks and adjacent-sample deltas at every shot boundary: audio-cues.json.',
      'Reaction gesture 45.65 is intentionally silent; final tail reaches zero by 63.56.',
      'AAC container duration is65.000s; raw AAC decode includes128padding samples (65.002667s). Mux from WAV or trim to65s.',
      'No speech, voice impressions, external samples, paid APIs, or copied musical phrases.',
      'Texture: original damped string modes / warm plucked bass / breath-led reed + flute / short small-room reflection.',
      'Timing based on locked 65s 14-shot planner handoff (2026-10-28). Full cue and note lists: audio-cues.json.',
      'This is technical QA, not a claim that real-time human listening or final audiovisual sync has been completed.',
      'Rebuild with python synthesize.py; run python test_audio.py. Needs Python, numpy, scipy and ffmpeg/ffprobe.',
      '\nFFmpeg independent meters:\n'+ '\n\n'.join(k+'\n'+v for k,v in meters.items()),
    ]
    (OUT/'QA.txt').write_text('\n'.join(qa)+'\n')
    print(json.dumps({k:manifest[k] for k in ['duration','mix','aac_decoded','files']},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
