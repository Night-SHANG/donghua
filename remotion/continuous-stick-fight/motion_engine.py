"""Native ACCAD motion composition. No IK or per-limb Cartesian interpolation.
Coordinates: native BVH units (not independently calibrated), Y up. Rotations are local matrices; FK is authoritative.
Transitions maintain complete body poses. This is kinematic, NOT a dynamics solver.
"""
from dataclasses import dataclass, field
import importlib.util
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation, Slerp
_spec=importlib.util.spec_from_file_location('validated_native',str(Path(__file__).resolve().parent/'native_bvh.py'))
_native=importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_native)
fk=_native.fk

@dataclass
class Clip:
    nodes:list
    translations:np.ndarray
    rotations:np.ndarray
    fps:float=60.
    label:str=''
    transitions:list=field(default_factory=list)
    @property
    def positions(self): return fk(self.nodes,self.translations,self.rotations)
    def copy(self): return Clip(self.nodes,self.translations.copy(),self.rotations.copy(),self.fps,self.label,list(self.transitions))
    def __len__(self): return len(self.translations)

def load_clip(name,start=0,end=999999,duration=None,fps=60):
    nodes,t,r,dt=_native.load(name,start,end)
    if len(t)<2: raise ValueError('Clip must contain at least two source frames')
    seconds=(len(t)-1)*dt if duration is None else duration
    n=int(round(seconds*fps))+1
    old=np.arange(len(t),dtype=float); new=np.linspace(0,len(t)-1,n)
    tt=np.empty((n,)+t.shape[1:]); rr=np.empty((n,)+r.shape[1:])
    for j in range(len(nodes)):
        for k in range(3): tt[:,j,k]=np.interp(new,old,t[:,j,k])
        rr[:,j]=Slerp(old,Rotation.from_matrix(r[:,j]))(new).as_matrix()
    return Clip(nodes,tt,rr,fps,f'{name}:{start}-{start+len(t)-1}')

def rigid_transform(clip,yaw_deg=0,translation=(0,0,0)):
    c=clip.copy(); R=Rotation.from_euler('y',yaw_deg,degrees=True).as_matrix()
    c.translations[:,0]=c.translations[:,0]@R.T+np.asarray(translation)
    c.rotations[:,0]=R@c.rotations[:,0]
    return c

def _quintic(x): return x*x*x*(10+x*(-15+6*x))

def _blend_rot(a,b,w):
    """Shortest-arc SO(3) blend, including near pi; no quaternion sign ambiguity."""
    shape=a.shape
    rel=np.swapaxes(a,-1,-2)@b
    rv=Rotation.from_matrix(rel.reshape(-1,3,3)).as_rotvec().reshape(shape[:-2]+(3,))
    # Choose a temporally continuous logarithm branch. Independent shortest arcs
    # can flip at relative pi as two moving poses cross the180deg boundary.
    for j in range(rv.shape[1]):
        for i in range(1,len(rv)):
            angle=np.linalg.norm(rv[i,j])
            if angle<1e-9:continue
            axis=rv[i,j]/angle
            candidates=np.array([rv[i,j]+k*2*np.pi*axis for k in (-1,0,1)])
            rv[i,j]=candidates[np.argmin(np.linalg.norm(candidates-rv[i-1,j],axis=1))]
    delta=Rotation.from_rotvec((rv*w[:,None,None]).reshape(-1,3)).as_matrix().reshape(shape)
    return a@delta

def splice(a,b,overlap_frames=18,match_heading=False):
    """Overlap tails, not guard-reset clips. Source windows must omit idle recovery.
    Align B root horizontally at overlap entry; preserve its Y and own displacement.
    Heading matching optional: do not erase intentional source turning by default.
    Quintic blend has zero first/second weight derivatives at transition boundaries.
    This does not guarantee compatible supports: inspect support metrics afterwards.
    """
    if a.fps!=b.fps or [n['name'] for n in a.nodes]!=[n['name'] for n in b.nodes]:
        raise ValueError('Only same skeleton/fps can be spliced')
    k=int(overlap_frames)
    if not 3<=k<min(len(a),len(b)): raise ValueError('Overlap must be 3..min_length-1')
    b=b.copy(); entry=len(a)-k
    if match_heading:
        # Project root forward onto horizontal plane; robust away from vertical.
        va=a.rotations[entry,0,:,2]; vb=b.rotations[0,0,:,2]
        yaw=np.degrees(np.arctan2(va[0],va[2])-np.arctan2(vb[0],vb[2]))
        b=rigid_transform(b,yaw)
    shift=a.translations[entry,0]-b.translations[0,0]; shift[1]=0
    b.translations[:,0]+=shift
    w=_quintic(np.linspace(0,1,k))
    t=(1-w[:,None,None])*a.translations[-k:]+w[:,None,None]*b.translations[:k]
    r=_blend_rot(a.rotations[-k:],b.rotations[:k],w)
    tr=np.concatenate([a.translations[:-k],t,b.translations[k:]])
    ro=np.concatenate([a.rotations[:-k],r,b.rotations[k:]])
    spans=a.transitions+[{'start':entry,'end':len(a)-1,'incoming':b.label,'root_alignment_cm':shift.tolist()}]
    return Clip(a.nodes,tr,ro,a.fps,a.label+' > '+b.label,spans)

def chain_clips(clips,overlap_frames=18,heading_deg=0,origin=(0,0,0),match_heading=False):
    if not clips: raise ValueError('Empty sequence')
    c=clips[0].copy()
    overlaps=[overlap_frames]*(len(clips)-1) if np.isscalar(overlap_frames) else overlap_frames
    if len(overlaps)!=len(clips)-1: raise ValueError('One overlap per transition')
    for b,k in zip(clips[1:],overlaps): c=splice(c,b,k,match_heading)
    return rigid_transform(c,heading_deg,origin)

def pose_match(a,b,a_frames=None,b_frames=None,top=10):
    """Rank compatible transition phases by angular pose AND angular velocity.
    Root world heading excluded: rigid staging should handle it. No automatic cuts.
    """
    ai=list(range(max(1,len(a)-60),len(a)-1)) if a_frames is None else list(a_frames)
    bi=list(range(1,min(len(b)-1,60))) if b_frames is None else list(b_frames)
    out=[]
    for i in ai:
        for j in bi:
            aa=a.rotations[i,1:];bb=b.rotations[j,1:]
            pose=np.linalg.norm(Rotation.from_matrix(aa.transpose(0,2,1)@bb).as_rotvec(),axis=1)
            va=Rotation.from_matrix(a.rotations[i-1,1:].transpose(0,2,1)@aa).as_rotvec()*a.fps
            vb=Rotation.from_matrix(b.rotations[j-1,1:].transpose(0,2,1)@bb).as_rotvec()*b.fps
            score=np.mean(pose)+.03*np.mean(np.linalg.norm(va-vb,axis=1))
            out.append({'a_frame':i,'b_frame':j,'score':float(score),'pose_mean_deg':float(np.degrees(pose.mean()))})
    return sorted(out,key=lambda x:x['score'])[:top]

def metrics(c,ground_tolerance=3.):
    p=c.positions; r=c.rotations
    angles=np.degrees(Rotation.from_matrix((r[:-1].transpose(0,1,3,2)@r[1:]).reshape(-1,3,3)).magnitude()).reshape(len(c)-1,-1)
    rootv=np.diff(p[:,0],axis=0)*c.fps
    names=[n['name'] for n in c.nodes]; feet=[i for i,n in enumerate(names) if n in ('LeftFoot','RightFoot','LeftToeBase','RightToeBase')]
    support={}
    for j in feet:
        height=p[:,j,1]; floor=float(np.percentile(height,3))
        speed=np.linalg.norm(np.diff(p[:,j][:,[0,2]],axis=0),axis=1)*c.fps
        low=(height[:-1]<floor+ground_tolerance)&(height[1:]<floor+ground_tolerance)
        support[names[j]]={'estimated_floor_cm':floor,'low_frames':int(low.sum()),'low_horizontal_speed_p95_cm_s':float(np.percentile(speed[low],95)) if low.any() else None}
    return {'frames':len(c),'fps':c.fps,'duration':(len(c)-1)/c.fps,'finite':bool(np.isfinite(p).all()),'max_local_step_deg':float(angles.max()),'max_local_step_frame':int(np.unravel_index(angles.argmax(),angles.shape)[0]),'root_speed_max_cm_s':float(np.linalg.norm(rootv,axis=1).max()),'root_acceleration_max_cm_s2':float(np.linalg.norm(np.diff(rootv,axis=0)*c.fps,axis=1).max()),'support_observations':support,'transitions':c.transitions,'warning':'Near-floor speed is observation, not a stance label; sources can legitimately pivot or skid.'}

def save(c,path):
    np.savez_compressed(path,positions=c.positions,translations=c.translations,rotations=c.rotations,names=np.array([n['name'] for n in c.nodes]),parents=np.array([n['parent'] for n in c.nodes]),fps=c.fps)

def warp_root(c,frames,offsets,max_offset_cm=80.,max_speed_cm_s=160.):
    """C2 common-body translational warp through persistent event offsets.
    Never resets to zero between beats. Does not change local joint rotations.
    Planting is NOT automatic: moving whole body can slide support, report metrics.
    All endpoint displacements are retained after the final event.
    """
    frames=np.asarray(frames,int); offsets=np.asarray(offsets,float)
    if offsets.shape!=(len(frames),3) or np.any(np.diff(frames)<=0) or frames[0]<0 or frames[-1]>=len(c): raise ValueError('Invalid ordered warp anchors')
    if np.linalg.norm(offsets,axis=1).max()>max_offset_cm: raise ValueError('Root warp exceeds displacement bound')
    path=np.empty((len(c),3));path[:frames[0]+1]=offsets[0]
    for i in range(len(frames)-1):
        lo,hi=frames[i:i+2];w=_quintic(np.linspace(0,1,hi-lo+1))[:,None]
        path[lo:hi+1]=(1-w)*offsets[i]+w*offsets[i+1]
    path[frames[-1]:]=offsets[-1]
    speed=np.linalg.norm(np.diff(path,axis=0),axis=1)*c.fps
    if speed.max(initial=0)>max_speed_cm_s: raise ValueError(f'Root warp too fast: {speed.max():.1f} native units/s at frame {speed.argmax()}')
    out=c.copy();out.translations[:,0]+=path
    return out,path

def paired_contact_warp(a,b,events,max_offset_cm=80.,max_speed_cm_s=160.):
    """Couple two actors' ROOTS at declared events, not independent hand IK.
    Each event {frame,a_joint,b_joint,separation:[x,y,z]} means
    B joint - A joint = separation (e.g. exterior stroke-radius clearance).
    Actors split correction equally, preserving pair center and native root travel.
    Anchors persist until next event. No intentional-contact claim outside events.
    Use only SAME length/fps. Inspect all-frame support and silhouette separately.
    """
    if len(a)!=len(b) or a.fps!=b.fps:raise ValueError('Paired timelines must match')
    names=[n['name'] for n in a.nodes]; pa=a.positions;pb=b.positions
    frames=[0];oa=[np.zeros(3)];ob=[np.zeros(3)]
    for e in events:
        f=int(e['frame']); ia=names.index(e['a_joint']);ib=names.index(e['b_joint'])
        delta=pb[f,ib]-pa[f,ia]-np.asarray(e.get('separation',[0,0,0]))
        if f<=frames[-1]:raise ValueError('Contact events must be strictly ordered after frame 0')
        frames.append(f);oa.append(delta/2);ob.append(-delta/2)
    aa,wa=warp_root(a,frames,oa,max_offset_cm,max_speed_cm_s)
    bb,wb=warp_root(b,frames,ob,max_offset_cm,max_speed_cm_s)
    residual=[]
    for e in events:
        f=e['frame'];d=bb.positions[f,names.index(e['b_joint'])]-aa.positions[f,names.index(e['a_joint'])]-np.asarray(e.get('separation',[0,0,0]))
        residual.append(float(np.linalg.norm(d)))
    return aa,bb,{'anchors':frames,'a_root_warp':wa,'b_root_warp':wb,'event_residual_cm':residual}

def support_anchor(c,joint,start,end,blend=8,max_correction_cm=12.):
    """Bounded whole-body support stabilization, NO IK or pose change.
    Holds chosen source foot point through middle of declared stance. Fade edges.
    Moves entire body: use BEFORE contact staging and recheck both feet/contact.
    Rejects large correction rather than hiding synthetic skating.
    """
    j=[n['name'] for n in c.nodes].index(joint)
    if not 0<=start<end<len(c) or end-start<2*blend:raise ValueError('Invalid stance interval')
    p=c.positions;d=p[start+blend,j]-p[start:end+1,j];d[:,1]=0
    w=np.ones(end-start+1);w[:blend+1]=_quintic(np.linspace(0,1,blend+1));w[-blend-1:]=_quintic(np.linspace(1,0,blend+1))
    d*=w[:,None]
    if np.linalg.norm(d,axis=1).max()>max_correction_cm:raise ValueError('Support correction too large; likely a swing or pivot, not plant')
    out=c.copy();out.translations[start:end+1,0]+=d
    return out

def stage_pair(a,b,events,max_offset=80.,max_warp_speed=160.):
    """Contact staging with director-declared unweighted/footwork ramp windows.
    ALL distances/speeds are native BVH units, not independently calibrated cm.
    event: frame, ramp_start, a_joint, b_joint, separation, share_a (default .5).
    Optional a_joint2/a_mix, b_joint2/b_mix target an actual limb centerline point.
    Root corrections stay constant outside ramps; no planted-foot drift there.
    No inferred foot locks: report added foot velocity and support-window violation.
    Optional support_a/support_b lists of [start,end] reject any correction during
    explicitly planted spans, unless allow_support_drift is true for that event.
    """
    if len(a)!=len(b) or a.fps!=b.fps:raise ValueError('Paired timeline mismatch')
    na=[n['name'] for n in a.nodes];nb=[n['name'] for n in b.nodes]
    pa=a.positions;pb=b.positions;anchors=[0];oa=[np.zeros(3)];ob=[np.zeros(3)];details=[]
    def point(p,n,e,prefix):
        q=p[e['frame'],n.index(e[prefix+'_joint'])]
        if prefix+'_joint2' in e:
            w=e.get(prefix+'_mix',.5);q=(1-w)*q+w*p[e['frame'],n.index(e[prefix+'_joint2'])]
        return q
    for e in events:
        f=int(e['frame']);start=int(e.get('ramp_start',anchors[-1]));share=float(e.get('share_a',.5))
        if not 0<=share<=1 or start<anchors[-1] or f<=start:raise ValueError('Invalid event ramp/share')
        delta=point(pb,nb,e,'b')-point(pa,na,e,'a')-np.asarray(e.get('separation',[0,0,0]))
        # Preserve any prior pair-center displacement while updating separation.
        center=(oa[-1]+ob[-1])/2
        targeta=center+delta*share;targetb=center-delta*(1-share)
        violations=[]
        for who in ('a','b'):
            for lo,hi in e.get('support_'+who,[]):
                if min(f,hi)>max(start,lo):violations.append({'actor':who,'span':[lo,hi]})
        if violations and not e.get('allow_support_drift',False):raise ValueError(f'Contact warp overlaps declared planted support: {violations}')
        if start>anchors[-1]:anchors.append(start);oa.append(oa[-1]);ob.append(ob[-1])
        anchors.append(f);oa.append(targeta);ob.append(targetb)
        details.append({'frame':f,'ramp_start':start,'a_correction':targeta.tolist(),'b_correction':targetb.tolist(),'declared_support_overlap':violations})
    aa,wa=warp_root(a,anchors,oa,max_offset,max_warp_speed);bb,wb=warp_root(b,anchors,ob,max_offset,max_warp_speed)
    for d,e in zip(details,events):
        d['residual']=float(np.linalg.norm(point(bb.positions,nb,e,'b')-point(aa.positions,na,e,'a')-e.get('separation',[0,0,0])))
    report={'events':details,'units':'native BVH units (not independently calibrated)','a_max_correction':float(np.linalg.norm(wa,axis=1).max()),'b_max_correction':float(np.linalg.norm(wb,axis=1).max()),'a_max_added_foot_speed':float(np.linalg.norm(np.diff(wa,axis=0),axis=1).max()*a.fps),'b_max_added_foot_speed':float(np.linalg.norm(np.diff(wb,axis=0),axis=1).max()*b.fps),'a_support_before':metrics(a)['support_observations'],'a_support_after':metrics(aa)['support_observations'],'b_support_before':metrics(b)['support_observations'],'b_support_after':metrics(bb)['support_observations']}
    return aa,bb,report

def retime_native_phase(name,start,end,duration,active_start,active_end,fps=60):
    """Keep energetic source core approximately native speed; put spare duration
    into anticipation/follow-through. Monotone PCHIP gives C1 source clock, not
    independently eased limbs. This is intentionally NOT uniform slow-motion.
    """
    from scipy.interpolate import PchipInterpolator
    nodes,t,r,dt=_native.load(name,start,end);last=start+len(t)-1
    lo=max(start+1,min(active_start,last-2));hi=max(lo+1,min(active_end,last-1))
    core=(hi-lo)*dt
    if core>=duration*.8:return load_clip(name,start,end,duration,fps)
    remaining=duration-core;pre=(lo-start)/max(1,(lo-start)+(last-hi))*remaining
    pre=max(.04,min(remaining-.04,pre));times=[0,pre,pre+core,duration]
    source=[0,lo-start,hi-start,last-start]
    clock=PchipInterpolator(times,source)(np.linspace(0,duration,round(duration*fps)+1))
    clock=np.clip(clock,0,len(t)-1);old=np.arange(len(t));tt=np.empty((len(clock),)+t.shape[1:]);rr=np.empty((len(clock),)+r.shape[1:])
    for j in range(len(nodes)):
        for k in range(3):tt[:,j,k]=np.interp(clock,old,t[:,j,k])
        rr[:,j]=Slerp(old,Rotation.from_matrix(r[:,j]))(clock).as_matrix()
    return Clip(nodes,tt,rr,fps,f'{name}:{start}-{last} phase-retimed'),clock+start

def silhouette_separate(a,b,azimuth_deg=30,head_radius=15.61,stroke_radius=3.91,max_extra=45.):
    """Camera-space head/head and head/torso exclusion. Whole-body ROOT only.
    A stays screen-left, B screen-right. Not suitable for deliberate grappling.
    Smooth clearance envelope can modify contact gaps: MUST re-audit afterwards.
    Emits measured added displacement/speed; not a planted-support guarantee.
    """
    from scipy.ndimage import gaussian_filter1d,maximum_filter1d
    p=a.positions;q=b.positions;ns=[n['name'] for n in a.nodes]
    h=ns.index('Head');he=ns.index('Head_end');sh=[ns.index('LeftArm'),ns.index('RightArm')]
    ph=(p[:,h]+p[:,he])/2;qh=(q[:,h]+q[:,he])/2
    axis=np.array([np.cos(np.radians(azimuth_deg)),0,np.sin(np.radians(azimuth_deg))])
    required=np.zeros(len(a))
    def constraint(pa,pb,radius):
        dy=pb[:,1]-pa[:,1];gap=(pb-pa)@axis
        return np.where(np.abs(dy)<radius,np.sqrt(np.maximum(0,radius**2-dy**2))-gap,0)
    required=np.maximum(required,constraint(ph,qh,head_radius*2+2))
    # Dense points on body centerline: shoulders to hip, excluding neck->ownhead.
    for w in np.linspace(0,1,12):
        ta=(1-w)*p[:,0]+w*p[:,sh].mean(axis=1);tb=(1-w)*q[:,0]+w*q[:,sh].mean(axis=1)
        required=np.maximum(required,constraint(ph,tb,head_radius+stroke_radius+2))
        required=np.maximum(required,constraint(ta,qh,head_radius+stroke_radius+2))
    # Actual classic skin includes wrist->virtual hand endpoint, not finger branches.
    # Avoid accidental face strikes from non-attacking arms as bodies turn.
    for who,other,headleft in ((p,q,True),(q,p,False)):
        ownhead=(who[:,h]+who[:,he])/2
        shoulder=other[:,sh].mean(axis=1)
        for side in ('Left','Right'):
            elbow=other[:,ns.index(side+'ForeArm')]
            wrist=other[:,ns.index(side+'Hand')]
            fist=.6*wrist+.4*other[:,ns.index(side+'Hand_end')]
            for v0,v1 in ((shoulder,elbow),(elbow,wrist),(wrist,fist)):
                for w in np.linspace(0,1,11):
                    target=(1-w)*v0+w*v1
                    r=constraint(ownhead,target,head_radius+stroke_radius+2) if headleft else constraint(target,ownhead,head_radius+stroke_radius+2)
                    required=np.maximum(required,r)
    envelope=gaussian_filter1d(maximum_filter1d(required,size=25,mode='nearest'),4,mode='nearest')
    envelope=np.maximum(envelope,required)
    if envelope.max()/2>max_extra:raise ValueError(f'Incompatible paired silhouette: {envelope.max()/2:.1f} extra root units each')
    wa=-envelope[:,None]*axis/2;wb=-wa
    aa=a.copy();bb=b.copy();aa.translations[:,0]+=wa;bb.translations[:,0]+=wb
    return aa,bb,{'max_added_per_actor':float(envelope.max()/2),'max_added_speed':float(np.abs(np.diff(envelope)).max()*a.fps/2),'active_frames':int((envelope>.01).sum()),'warning':'Camera silhouette root correction, can slide feet; contacts must be measured again.'}
