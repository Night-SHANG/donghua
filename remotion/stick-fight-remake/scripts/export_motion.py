"""Whole-local-rotation assembly for EXIT. No inverse kinematics / Cartesian limb targets."""
import sys,json,zipfile,hashlib,urllib.request
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation,Slerp
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent
sys.path.insert(0,str(HERE));import motion
ZIP=Path(motion.ZIP)
if not ZIP.exists():
 ZIP=ROOT/'cache/Male2_bvh.zip';ZIP.parent.mkdir(exist_ok=True)
 if not ZIP.exists():urllib.request.urlretrieve('https://accad.ohio-state.edu/sites/accad.osu.edu/files/Male2_bvh.zip',ZIP)
 motion.ZIP=str(ZIP)
assert hashlib.sha256(ZIP.read_bytes()).hexdigest()=='f30dc56f8557d4b9f1bd6b8b0c4218c076471de0a9c1a20f3bc4a8b776cc14b1'
FPS=60;N=900;provenance=[]
def native(filename,start=0,end=9999,yaw=0,offset=(0,0,0)):
 nodes,t,r,dt=motion.load(filename,0,9999);p=motion.fk(nodes,t,r);origin=np.array([p[0,0,0],p[:,:,1].min(),p[0,0,2]])
 end=min(end,len(t)-1);t=t[start:end+1].copy();r=r[start:end+1].copy();world=Rotation.from_euler('y',yaw,degrees=True).as_matrix()
 t[:,0]=(t[:,0]-origin)@world.T+offset;r[:,0]=world@r[:,0]
 t,r=motion.resample(t,r,2)
 return nodes,t,r,{'file':filename,'native_frames':[start,end],'yaw_degrees':yaw,'offset':list(offset),'origin':origin.tolist(),'fps':1/dt}
def assemble(segments):
 nt=[];nr=[];meta=[];nodes=None
 for start,item in segments:
  nodes,t,r,info=item;end=start+len(t);nt.append((start,end,t));nr.append((start,end,r));info.update(output_start=start,output_end=end-1);meta.append(info)
 outt=np.empty((N,)+nt[0][2].shape[1:]);outr=np.empty((N,)+nr[0][2].shape[1:]);source=np.full(N,-1)
 outt[:nt[0][0]]=nt[0][2][0];outr[:nr[0][0]]=nr[0][2][0]
 for k,((start,end,t),(_,_,r)) in enumerate(zip(nt,nr)):
  lim=min(N,end);outt[start:lim]=t[:lim-start];outr[start:lim]=r[:lim-start];source[start:lim]=k
  if k+1<len(nt):
   ns,ne,t1=nt[k+1];r1=nr[k+1][2];gap=ns-end
   if gap<0:raise ValueError('Overlapping authored clips')
   if gap:
    alpha=np.arange(1,gap+1)/(gap+1);alpha=alpha*alpha*(3-2*alpha)
    outt[end:ns]=(1-alpha[:,None,None])*t[-1]+alpha[:,None,None]*t1[0]
    for j in range(r.shape[1]):outr[end:ns,j]=Slerp([0,1],Rotation.from_matrix(np.array([r[-1,j],r1[0,j]])))(alpha).as_matrix()
  else:outt[end:]=t[-1];outr[end:]=r[-1]
 return nodes,outt,outr,source,meta

def export(config):
 actors=[]
 for segments in config['actors']:
  built=[]
  for seg in segments:
   kw={k:v for k,v in seg.items() if k!='at'};built.append((seg['at'],native(**kw)))
  nodes,t,r,source,meta=assemble(built);p=motion.fk(nodes,t,r);actors.append((p,t,r,source));provenance.append(meta)
 positions=np.stack([a[0] for a in actors],1);trans=np.stack([a[1] for a in actors],1);rot=np.stack([a[2] for a in actors],1)
 names=[n['name'] for n in nodes]
 (ROOT/'out').mkdir(exist_ok=True)
 np.savez_compressed(ROOT/'out/full-motion.npz',positions=positions,translations=trans,rotations=rot,names=names,parents=[n['parent'] for n in nodes],source=np.stack([a[3] for a in actors],1))
 data={'names':names,'frames':np.round(positions,5).tolist(),**{k:v for k,v in config.items() if k!='actors'}}
 def project(p,f):
  k=f>=config['kickStart'];a=np.radians(config['kickAzimuth'] if k else config['azimuth']);c=config['kickCenter'] if k else config['center'];return [640+(np.cos(a)*p[0]+np.sin(a)*p[2]-c)*2.25,594-p[1]*2.25]
 data['contacts']=[{'frame':74,'xy':project(positions[74,0,names.index('LeftHand')],74),'kind':'forearm_block'},{'frame':192,'xy':project(positions[192,1,names.index('LeftHand')],192),'kind':'forearm_block'},{'frame':config['cabinetFrame'],'xy':project(config['impactWorld'],config['cabinetFrame']),'kind':'cabinet'}]

 (ROOT/'src/poses.json').write_text(json.dumps(data,separators=(',',':')))
 (ROOT/'docs/motion-provenance.json').write_text(json.dumps({'fps':FPS,'frames':N,'actors':provenance,'changes':'Native whole-body captures, quaternion SLERP resampling, whole-local-rotation transitions, rigid scene placement, projected and stylized. No IK or hand/foot target solving.'},indent=2))
 print('Exported',positions.shape,'frames')
if __name__=='__main__':export(json.loads((ROOT/'choreography.json').read_text()))
