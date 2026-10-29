"""Blocking assembly; contact/foot-support report is NOT artistic approval."""
import sys,json
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from motion_engine import *
g=json.loads((ROOT/'action_graph.json').read_text()); fps=g['fps'];ov=g['overlap_frames']
fix={'opening-parry':{'a':(28,44),'b':(13,36)},'body-counter':{'a':(22,49)},'push-to-wall':{'b':(56,105)},'kick-break':{'a':(6,49)}}
for beat in g['beats']:
 for who,(s,e) in fix.get(beat['id'],{}).items():beat[who]['start']=s;beat[who]['end']=e
(ROOT/'action_graph.json').write_text(json.dumps(g,indent=2))

# Same lead stance cluster: jab R -> cross L, push R. Source world orientation
# is calibrated by intended reach radial vector, NOT angular velocity or rootZ.
for x in g['beats']:
 if x['id']=='opening-parry':x['a']={'file':'Male2_E2_JabRight.bvh','start':16,'end':36}
 if x['id']=='pressure-cross':x['b']={'file':'Male2_E3_CrossLeft.bvh','start':13,'end':35}
 if x['id']=='push-to-wall':x['b']={'file':'Male2_G18_PushKickRight.bvh','start':0,'end':45}
calibration={
'Male2_E2_JabRight.bvh':(25,'RightHand'),
'Male2_E3_CrossLeft.bvh':(24,'LeftHand'),
'Male2_E9_BodyHookLeft.bvh':(35,'LeftHand'),
'Male2_E6_HookRight.bvh':(33,'RightHand'),
'Male2_G18_PushKickRight.bvh':(23,'RightToeBase'),
'Male2_G14_RoundhouseBodyLeft.bvh':(19,'LeftToeBase'),
'Male2_G4_SpinningBackKick.bvh':(38,'LeftToeBase'),
'Male2_G2_FrontKick.bvh':(23,'RightToeBase')}
yaw_by_file={}
for file,(source_frame,joint) in calibration.items():
 source=load_clip(file,fps=30);names0=[n['name'] for n in source.nodes];world=source.positions
 radial=world[source_frame,names0.index(joint)]-world[source_frame,0]
 yaw_by_file[file]=-float(np.degrees(np.arctan2(radial[0],radial[2])))

# Tighten the bodycounter sentence, no padded guard tail.
for beat in g["beats"]:
 if beat["id"]=="body-counter":beat["duration"]=.9
 if beat["id"]=="pressure-cross":beat["duration"]=1.0

windows=json.loads((ROOT/'active_windows.json').read_text()); byfile={w['filename']:w for w in windows.values()}
(ROOT/'action_graph.json').write_text(json.dumps(g,indent=2))
clips=[[],[]];beats=[];cursor=0
base_starts=[];base_ends=[]
for i,b in enumerate(g['beats']):
 n=round(b['duration']*fps)+1;start=cursor if i==0 else cursor-ov
 base_starts.append(start);base_ends.append(start+n-1);cursor=start+n
TOTAL=cursor
# Independent actor edit points: counter begins during opponent recovery.
edit_offsets={'a':{'body-counter':-8,'kick-break':-5,'pursuit-hook':-5},'b':{'cross-duck':-5,'body-counter':4,'pressure-cross':-4,'push-to-wall':-5,'pursuit-hook':-18,'final-pressure':-6}}
actor_starts={who:[start+edit_offsets[who].get(b['id'],0) for start,b in zip(base_starts,g['beats'])] for who in ('a','b')}
tracks={'a':[],'b':[]}
# source hit phases; these are geometric threat phases, not automatic impact claims.
phase={'opening-parry':('a',25),'cross-duck':('b',24),'body-counter':('a',35),'pressure-cross':('b',24),'kick-break':('a',19),'push-to-wall':('b',23),'rail-break':('a',38),'pursuit-hook':('b',33),'uppercut-exit':('a',26),'final-pressure':('a',23)}
for i,beat in enumerate(g['beats']):
 clocks={}
 for actor,who in enumerate(('a','b')):
  c=beat[who]
  actor_start=actor_starts[who][i];actor_end=(actor_starts[who][i+1]+ov-1) if i+1<len(g['beats']) else TOTAL-1
  actor_duration=(actor_end-actor_start)/fps
  tracks[who].append(dict(beat=beat['id'],start=actor_start,end=actor_end,source=c))
  if c['file'] in byfile and any(x in c['file'] for x in ('Jab','Cross','Hook','Uppercut')):
   w=byfile[c['file']];native,clocks[who]=retime_native_phase(c['file'],c['start'],c['end'],actor_duration,w['active_start'],w['active_end'],fps)
  else:
   native=load_clip(c['file'],c['start'],c['end'],actor_duration,fps);clocks[who]=np.linspace(c['start'],c['end'],len(native))
  # Normalize capture facing from full source frame0, NOT current cropped attack pose.
  native=rigid_transform(native,yaw_deg=yaw_by_file.get(c['file'],0.))
  # Per-source constant floor offset only, never frame-wise body/foot translation.
  nn=[n['name'] for n in native.nodes];feet=[nn.index(j) for j in ['LeftToeBase','RightToeBase','LeftFoot','RightFoot']]
  source_floor=float(np.percentile(native.positions[:,feet,1],1));native.translations[:,0,1]-=source_floor
  clips[actor].append(native)
 start=base_starts[i];end=base_ends[i]
 contact=None
 if beat['id'] in phase:
  who,fr=phase[beat['id']];spec=beat[who];contact=actor_starts[who][i]+int(np.abs(clocks[who]-fr).argmin())
 beats.append(dict(id=beat['id'],start=start,end=end,contactFrame=contact,cause=beat['cause']))

A=chain_clips(clips[0],ov);B=chain_clips(clips[1],ov,heading_deg=180,origin=(37.0709695,0,146.0588147))
# Controlled horizontal staging: vertical source body motion is NEVER replaced to
# force a hit. Native foot Y and root bounce remain intact. Contact y mismatch is
# honestly retained as threat/near miss rather than fabricated contact.
names=[n['name'] for n in A.nodes];p=A.positions;q=B.positions
# Pair joint targets preserve close dialogue and travel; separation is stylized gap.
targets={
'opening-parry':('RightHand','RightHand',7.5),
'cross-duck':('Head','LeftHand',30),
'body-counter':('LeftHand','Spine1',14),
'pressure-cross':('RightHand','LeftHand',6.3),
'kick-break':('LeftFoot','Spine1',28),
'push-to-wall':('Hips','RightToeBase',40),
'rail-break':('LeftFoot','Spine1',40),
'pursuit-hook':('Head','RightHand',32),
'uppercut-exit':('LeftHand','Head',30),
# Final native kick/retreat deliberately has no forced contact anchor.
'final-pressure':('RightToeBase','Spine1',7.1)
}
events=[]
for beat in beats:
 if beat['id'] not in targets:continue
 ja,jb,gap=targets[beat['id']];f=beat['contactFrame'];delta=q[f,names.index(jb)]-p[f,names.index(ja)]
 # Fixed facing direction supports action readability; fullbody source shifts persist.
 sep=np.array([0.,delta[1],gap])
 # Whole preceding interval available; no untruthful planted-support guarantee.
 ramp_start=beat['start']-24 if beat['id']=='push-to-wall' else (events[-1]['frame'] if events else 0)
 event=dict(frame=f,ramp_start=ramp_start,a_joint=ja,b_joint=jb,separation=sep.tolist(),share_a=.67 if beat['id']=='cross-duck' else .5)
 if beat['id']=='final-pressure':
  # Exact torso centerline height, never vertical body snapping.
  hip=q[f,names.index('Hips')];neck=q[f,names.index('Neck')];alpha=float(np.clip((p[f,names.index(ja),1]-hip[1])/(neck[1]-hip[1]),0,1));target=(1-alpha)*hip+alpha*neck
  event.update(b_joint='Hips',b_joint2='Neck',b_mix=alpha);event['separation'][1]=float(target[1]-p[f,names.index(ja),1])
 if ja in ('LeftHand','RightHand'):event.update(a_joint2=ja+'_end',a_mix=.4)
 if jb in ('LeftHand','RightHand'):event.update(b_joint2=jb+'_end',b_mix=.4)
 if ja=='Head':event.update(a_joint2='Head_end',a_mix=.5)
 if jb=='Head':event.update(b_joint2='Head_end',b_mix=.5)
 av=p[f,names.index(event['a_joint'])];bv=q[f,names.index(event['b_joint'])]
 if 'a_joint2' in event:av=(1-event['a_mix'])*av+event['a_mix']*p[f,names.index(event['a_joint2'])]
 if beat['id']=='opening-parry':
  elbow=q[f,names.index('RightForeArm')];wrist=q[f,names.index('RightHand')];alpha=float(np.clip((av[1]-elbow[1])/(wrist[1]-elbow[1]),0,1));event.update(b_joint='RightForeArm',b_joint2='RightHand',b_mix=alpha);bv=elbow
 if 'b_joint2' in event:bv=(1-event['b_mix'])*bv+event['b_mix']*q[f,names.index(event['b_joint2'])]
 event['separation'][1]=float(bv[1]-av[1])
 events.append(event)
# Static initial staging uses first actual target, not another source clip's origin.
e0=events[0];f0=e0['frame'];a0=p[f0,names.index(e0['a_joint'])];b0=q[f0,names.index(e0['b_joint'])]
if 'a_joint2' in e0:a0=(1-e0['a_mix'])*a0+e0['a_mix']*p[f0,names.index(e0['a_joint2'])]
if 'b_joint2' in e0:b0=(1-e0['b_mix'])*b0+e0['b_mix']*q[f0,names.index(e0['b_joint2'])]
d0=(b0-a0-e0['separation'])/2
A=rigid_transform(A,translation=d0);B=rigid_transform(B,translation=-d0)
try:
 A,B,report=stage_pair(A,B,events,max_offset=160,max_warp_speed=180)
except ValueError as exc:
 # Fail explicitly; no silent increase of limits or teleport fallback.
 (ROOT/'out/staging-blocker.txt').write_text(str(exc));raise
# One common world basis: fight direction lies along unchanged camera horizontal.
A=rigid_transform(A,60);B=rigid_transform(B,60)
# Terminal reaction begins AFTER verified contact, never before.
final_event=events[-1];hitframe=final_event['frame']
hitdata=np.load(ROOT/'assets/hit/hit_knockback.npz')
hit=Clip(B.nodes,hitdata['translations'][8:].copy(),hitdata['rotations'][8:].copy(),fps,'Quaternius CC0 post-hit phase8 onward')
away=B.positions[hitframe,0]-A.positions[hitframe,0];away[1]=0;away/=np.linalg.norm(away)
reaction_yaw=float(np.degrees(np.arctan2(-away[0],-away[2])))
# Source rendered-skin minimum overselectedphase is-3.38896; oneconstantcalibration.
hit=rigid_transform(hit,yaw_deg=reaction_yaw,translation=(0,3.38896062735989,0))
# Reaction start is contact+1, complete body blended over8frames into native fall.
from global_pose_entry import static_pose_entry
# Static target entry: do not blend two simultaneously fast-changing legs.
shift=B.translations[hitframe,0]-hit.translations[0,0];shift[1]=0
hit.translations[:,0]+=shift
entry_t,entry_r=static_pose_entry(B.nodes,B.translations[hitframe],B.rotations[hitframe],hit.translations[0],hit.rotations[0],frames=16)
B=Clip(B.nodes,np.concatenate([B.translations[:hitframe+1],entry_t[1:],hit.translations[1:]]),np.concatenate([B.rotations[:hitframe+1],entry_r[1:],hit.rotations[1:]]),fps,B.label+' static global-entry + CC0 knockdown',B.transitions)
source_start=hitframe+15;source_end=source_start+len(hit)-1
# Continue source attacker only through landing; hold terminal result0.3s.
N=max(len(A),len(B))+18
def extend(c,n):
 if len(c)>=n:return Clip(c.nodes,c.translations[:n],c.rotations[:n],c.fps,c.label,c.transitions)
 return Clip(c.nodes,np.concatenate([c.translations,np.repeat(c.translations[-1:],n-len(c),axis=0)]),np.concatenate([c.rotations,np.repeat(c.rotations[-1:],n-len(c),axis=0)]),c.fps,c.label,c.transitions)
A=extend(A,N);B=extend(B,N)
# Before terminal hit: no head/torso overlap. Airborne fall may pass behind A, so
# subsequent silhouette audit must inspect the fallen body, not force upright order.
preA=Clip(A.nodes,A.translations[:hitframe+1],A.rotations[:hitframe+1],fps)
preB=Clip(B.nodes,B.translations[:hitframe+1],B.rotations[:hitframe+1],fps)
preA,preB,clearance=silhouette_separate(preA,preB,max_extra=45)
for c,pre in ((A,preA),(B,preB)):
 delta=pre.translations[:,0]-c.translations[:hitframe+1,0]
 c.translations[:hitframe+1,0]+=delta;c.translations[hitframe+1:,0]+=delta[-1]
# Small causal post-hit separation prevents the native flailing hand crossing A's
# face. Six native units total, C2, only after impact; not long fabricated flight.
# Authored causal horizontal impulse; source native vertical fall is unchanged.
# No precontact displacement. Velocity ramps over25ms, then ground friction only
# after source's first actual rendered-skin landing (originalsourceframe24).
landing_frame=source_start+(24-8);tt=np.maximum(0,(np.arange(N)-hitframe)/fps);land_t=(landing_frame-hitframe)/fps
v0=160.;tau=.025;friction=8.
def flight(t):return v0*(t-tau*(1-np.exp(-t/tau)))
v_land=v0*(1-np.exp(-land_t/tau));distance=np.where(tt<=land_t,flight(tt),flight(land_t)+v_land/friction*(1-np.exp(-friction*(tt-land_t))))
post=distance[:,None]*away;B.translations[:,0]+=post
# Authored terminal settle only after native reaction ends; never lift wholefilm.
render_joint_names=['Hips','Spine','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand','LeftLeg','RightLeg','LeftFoot','RightFoot','LeftToeBase','RightToeBase']
settle_amount=max(0,float(B.positions[-1,[names.index(j) for j in render_joint_names],1].min()-8/2.05))
settle_t=np.clip((np.arange(N)-(source_end))/12,0,1);settle_w=settle_t**3*(10+settle_t*(-15+6*settle_t));B.translations[:,0,1]-=settle_amount*settle_w
report['terminal_settle']={'downward_native_units':settle_amount,'start':source_end,'end':source_end+12,'scope':'authored tail cleanup after native fall, no globalshift'}
report['post_hit_root_addition']={'model':'authored impact impulse, NOT source horizontal motion','velocity':v0,'ramp_seconds':tau,'friction_after_landing':friction,'landing_frame':landing_frame,'direction':away.tolist(),'total_distance':float(distance[-1])}
report['terminal_reaction']={'contact_frame':hitframe,'reaction_start':hitframe+1,'static_entry_frames':16,'native_start':source_start,'native_end':source_end,'native_source_frames':len(hit),'native_source_start_index':8,'hold_frames':18}

report['silhouette_clearance']=clearance
p=A.positions;q=B.positions
# One constant floor normalization for entire timeline, not per-frame fake footlock.
foot=[names.index(n) for n in ('LeftToeBase','RightToeBase','LeftFoot','RightFoot')]
floor=float(min(np.percentile(p[:,foot,1],1),np.percentile(q[:,foot,1],1)))
p[:,:,1]-=floor;q[:,:,1]-=floor
contacts=[]
for beat,e in zip([b for b in beats if b['id'] in targets],events):
 f=e['frame'];v=p[f,names.index(e['a_joint'])];w=q[f,names.index(e['b_joint'])]
 if 'a_joint2' in e:v=(1-e['a_mix'])*v+e['a_mix']*p[f,names.index(e['a_joint2'])]
 if 'b_joint2' in e:w=(1-e['b_mix'])*w+e['b_mix']*q[f,names.index(e['b_joint2'])]
 projected_gap=float(np.hypot((w-v)@np.array([np.cos(np.pi/6),0,np.sin(np.pi/6)]),w[1]-v[1]))
 kind='impact' if beat['id']=='final-pressure' and projected_gap<=16/2.05 else 'block' if beat['id'] in ('opening-parry','pressure-cross') and projected_gap<=16/2.05 else 'threat-phase'
 contacts.append(dict(frame=f,beat=beat['id'],kind=kind,world=((v+w)/2).tolist(),centerlineGap=float(np.linalg.norm(v-w)),projectedGap=projected_gap,verticalGap=float(abs(v[1]-w[1]))))
railframe=next(b['contactFrame'] for b in beats if b['id']=='rail-break');railworld=p[railframe,names.index('LeftToeBase')].tolist()
contacts.append(dict(frame=railframe,beat='rail-break',kind='rail',world=railworld))
frames=np.stack([p,q],axis=1)
(ROOT/'src').mkdir(exist_ok=True);(ROOT/'out').mkdir(exist_ok=True)
(ROOT/'src/poses.json').write_text(json.dumps(dict(names=names,frames=np.round(frames,5).tolist(),beats=beats,contacts=contacts,railWorld=railworld,fps=fps,headCenterMode='midpoint',handCenterFraction=.4,headRadiusPixels=32,renderScale=2.05,actorTracks=tracks,terminalReaction=dict(source='Quaternius UAL2 Hit_Knockback',sourceStartIndex=8,landingFrame=landing_frame,impulse=report['post_hit_root_addition'],license='CC0',startFrame=hitframe+1,endFrame=source_end,nativeStartFrame=source_start,contactFrame=hitframe),fightAxis=[float(np.cos(np.pi/6)),0,float(np.sin(np.pi/6))],captureBasis='same-lead target-radial alignment then common worldyaw60',schemaVersion=8,buildId=g['release_build_id']),separators=(',',':')))
np.savez_compressed(ROOT/'out/full-motion.npz',positions=frames,a_rotations=A.rotations,b_rotations=B.rotations,a_translations=A.translations,b_translations=B.translations,names=np.array(names),fps=fps)
report.update({'a_metrics':metrics(A),'b_metrics':metrics(B),'floor_offset':floor,'contacts':contacts,'status':'BLOCKING: rendered silhouette / planted foot / actual impact review required'})
(ROOT/'out/motion-report.json').write_text(json.dumps(report,indent=2));print('Frames',len(A),'duration',len(A)/fps,'max corrections',report['a_max_correction'],report['b_max_correction']);print([(c['beat'],round(c.get('verticalGap',0),1),c['kind']) for c in contacts])
