"""Original synthetic score / physical Foley for Hat Borrowed (no samples or services).
Adapted concepts: stickman-video gen_audio.py envelopes/modal plucks; animated-video
parts/audio/designed.py filtered air, stereo panning and event-aligned sound design.
Run from any directory: python audio/generate.py. All authored sounds are synthetic.
"""
from pathlib import Path
import json, subprocess, re
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public/audio'
SR=48000; FPS=30; DURATION=24; N=SR*DURATION
rng=np.random.default_rng(20261029)

def filt(x,lo=80,hi=3000):
    return sosfilt(butter(2,[lo,hi],btype='bandpass',fs=SR,output='sos'),x)
def fade(x,a=.004,b=.04):
    x=x.copy(); na=min(len(x),int(a*SR)); nb=min(len(x),int(b*SR))
    if na:x[:na]*=np.linspace(0,1,na)
    if nb:x[-nb:]*=np.linspace(1,0,nb)
    return x
def tone(note,d=.7,soft=False):
    t=np.arange(round(d*SR))/SR; f=440*2**((note-69)/12)
    # String-like modal excitation, inharmonic upper partials decay faster.
    y=sum((1/k**1.7)*np.sin(2*np.pi*f*k*(1+.00008*k*k)*t+.12*k)*np.exp(-t*(2.7+k*1.8)/(1.6 if soft else 1)) for k in range(1,7))
    y+=filt(rng.normal(0,1,len(t)),600,2500)*np.exp(-t*75)*.08
    return fade(y,.012 if soft else .003,.12)
def air(d=.35,lo=450,hi=3500):
    t=np.arange(round(d*SR))/SR
    y=filt(rng.normal(0,1,len(t)),lo,hi)
    return fade(y*np.sin(np.pi*t/d)**2,.015,.04)
def thud(d=.2,f=105):
    t=np.arange(round(d*SR))/SR
    phase=2*np.pi*(f*t+f*.6*(1-np.exp(-t*30))/30)
    return fade(np.sin(phase)*np.exp(-t*26)+filt(rng.normal(0,1,len(t)),150,1700)*np.exp(-t*45)*.35,.002,.04)
def chirp(d=.15):
    t=np.arange(round(d*SR))/SR
    f=2100+1450*np.sin(np.pi*t/d)+100*np.sin(t*100)
    return fade(np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*t/d)**1.3,.008,.015)
def put(buf,x,sec,gain=1,pan=0):
    i=round(sec*SR); m=min(len(x),len(buf)-i)
    if m<=0:return
    angle=(pan+1)*np.pi/4
    buf[i:i+m,0]+=x[:m]*gain*np.cos(angle)
    buf[i:i+m,1]+=x[:m]*gain*np.sin(angle)
def write(path,x):
    wavfile.write(path,SR,np.round(np.clip(x,-1,1)*32767).astype(np.int16))

EVENTS=[(0,'walk_hat_bob'),(60,'gust'),(76,'hat_detach_pop'),(96,'missed_reach'),(110,'run'),(195,'duck_anticipation'),(218,'branch_pass'),(255,'stand_run'),(282,'jump_crouch'),(294,'takeoff'),(325,'apex'),(358,'landing'),(375,'skid'),(405,'hat_settles'),(430,'slow_reach'),(456,'lift_brim'),(465,'bird_reveal_shiver'),(505,'hand_relax'),(530,'lower_tuck'),(557,'withdraw'),(590,'step_back'),(625,'leaf_enters'),(663,'leaf_lands'),(678,'happy_tilt'),(719,'stable_end')]

def generate():
    global rng
    rng=np.random.default_rng(20261029); OUT.mkdir(parents=True,exist_ok=True)
    music=np.zeros((N,2)); sfx=np.zeros((N,2)); cues=[]
    # A small F-major / D-minor acoustic ensemble. No drum machine or harsh oscillators.
    for j,note in enumerate([65,69,72,69,67,65,72]):
        put(music,tone(note),j*.5,.105,(-1)**j*.25)
    # Chase: a hand-played eight-note figure, warm low plucks underneath.
    progression=[[62,65,69,74],[58,62,65,70],[60,64,67,72],[65,69,72,77]]
    for j,tm in enumerate(np.arange(3.5,12.5,.25)):
        chord=progression[(j//8)%4]; note=chord[[0,2,1,3,2,1,3,1][j%8]]
        gain=.10 if j%2==0 else .073
        if 9.8<=tm<11.85: gain*=.6  # leave air in the jump
        put(music,tone(note,.55),tm,gain,(-1)**j*.3)
        if j%4==0:put(music,tone(chord[0]-12,.7),tm,.12,-.12)
    for tm,note in [(12.55,65),(13.15,64),(13.85,62),(14.55,60)]:
        put(music,tone(note,1.1,True),tm,.075,.1)
    # Reveal: longer voiced strings in F6, with a sparse reply to the opening motif.
    for tm,chord in [(15.5,[53,60,65,69]),(17,[58,65,69,72]),(18.6,[60,65,67,72]),(20,[53,60,65,69])]:
        for k,note in enumerate(chord):put(music,tone(note,2.7,True),tm+k*.065,.085,(k-1.5)*.18)
    for tm,note in [(16.25,72),(17.8,74),(19.15,69),(20.6,67),(21.3,69),(22.1,65)]:
        put(music,tone(note,1.5,True),tm,.09,.25)
    for k,note in enumerate([53,60,65,69]):put(music,tone(note,2.1,True),22.5+k*.04,.085,(k-1.5)*.15)
    # Short, filtered room reflections keep plucks organic without washing out Foley.
    dry=music.copy()
    for delay,g in [(.041,.10),(.073,.065),(.117,.035)]:
        shift=round(delay*SR); music[shift:]+=dry[:-shift,::-1]*g
    def fx(frame,name,x,g=.1,p=0):
        put(sfx,x,frame/FPS,g,p)
        cues.append({'frame':frame,'seconds':frame/FPS,'name':name,'durationSeconds':len(x)/SR,'gain':g,'pan':p,'synthetic':True})
    for frame in [7,23,39,55]:fx(frame,'walking_leaf_step',thud(.16,125)+air(.16,700,2500)*.35,.062,-.2)
    fx(60,'wind_gust',air(1.25,180,2300),.19,.3)
    fx(76,'hat_detaches',thud(.11,250),.12,.15)
    fx(96,'missed_grab_swish',air(.24),.09,.25)
    for j,frame in enumerate(list(range(110,192,9))+list(range(255,282,9))):
        fx(frame,'running_step',thud(.14,140+10*(j%2)),.095,(-1)**j*.12)
    fx(195,'duck_cloth',air(.23,500,2200),.10)
    fx(218,'branch_near_miss',air(.33,800,3800),.135,.4)
    fx(282,'crouch_scuff',air(.28,350,1800),.115)
    fx(294,'jump_push_off',thud(.23,120),.13)
    fx(296,'jump_air',air(.56,450,1800),.075,.15)
    fx(358,'landing_weight',thud(.32,95),.24)
    fx(358,'puddle_splash',air(.37,1100,5700),.20,.1)
    fx(375,'shoe_skid',air(.45,550,2900),.14,.2)
    fx(405,'hat_settles_on_leaves',air(.30,650,3200),.08,.15)
    fx(430,'sleeve_reach',air(.35,500,1800),.035)
    fx(456,'brim_lift',air(.21,800,2700),.06,.1)
    fx(465,'bird_chirp_reveal',chirp(),.10,.28)
    fx(472,'bird_chirp_reply',chirp(.12),.075,.28)
    fx(478,'bird_feather_shiver',air(.36,1400,4500),.04,.28)
    fx(530,'hat_tuck',air(.4,600,2200),.062,.18)
    fx(557,'sleeve_withdraw',air(.25,500,1800),.03)
    fx(590,'step_back',thud(.18,110),.055,-.1)
    fx(601,'bird_comfort_chirp',chirp(.12),.05,.3)
    fx(625,'leaf_drift',air(1.1,650,2700),.07,.05)
    fx(663,'leaf_soft_landing',air(.2,800,3000),.052)
    # Tiny woody musical answer, not a UI notification.
    fx(678,'happy_tilt_wood_note',tone(77,.5,True),.035,.1)
    # Atmosphere kept well below foreground events.
    put(sfx,air(24,170,800),0,.009,-.4)
    fadein=np.minimum(1,np.arange(N)/(SR*.08))
    fadeout=np.minimum(1,(N-1-np.arange(N))/(SR*.8))
    envelope=(fadein*fadeout)[:,None]
    music*=envelope;sfx*=envelope
    master=music+sfx
    # One linear gain shared by stems. No limiting, pumping, or clipping.
    gain=min(2.6,10**(-3/20)/np.max(np.abs(master)))
    music*=gain;sfx*=gain;master*=gain
    for name,arr in [('master',master),('music',music),('sfx',sfx)]:write(OUT/f'{name}.wav',arr)
    metadata={'fps':FPS,'durationFrames':720,'durationSeconds':24,'sampleRate':SR,'master':'audio/master.wav','masterVolume':1,'provenance':'All original deterministic synthesis; no samples, voices, external APIs or copyrighted recordings.','storyAnchors':[{'frame':f,'name':n} for f,n in EVENTS],'sections':[{'start':s,'end':e,'name':n} for s,e,n in [(0,3.5,'light_pizzicato'),(3.5,12.5,'chase'),(12.5,15.5,'soften'),(15.5,20,'warm_reveal'),(20,24,'resolve')]],'cues':cues}
    (ROOT/'audio/cues.json').write_text(json.dumps(metadata,indent=2)+'\n')
    proc=subprocess.run(['ffmpeg','-hide_banner','-i',str(OUT/'master.wav'),'-af','loudnorm=I=-18:TP=-2:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    measured=json.loads(re.findall(r'\{[^{}]*\}',proc.stderr)[-1])
    report={'durationSeconds':len(master)/SR,'samplePeakDbFS':float(20*np.log10(np.max(np.abs(master)))),'clippedSamples':int(np.sum(np.abs(master)>=1)),'integratedLufs':float(measured['input_i']),'truePeakDbTP':float(measured['input_tp']),'loudnessRangeLu':float(measured['input_lra']),'listeningVerified':False,'check':'Measured only; final subjective listening in context still required.'}
    (ROOT/'audio/measurements.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':generate()
