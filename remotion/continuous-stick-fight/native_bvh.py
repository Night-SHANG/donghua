"""Native ACCAD BVH hierarchy + quaternion resampling. No inverse kinematics."""
import zipfile,re
import numpy as np
from scipy.spatial.transform import Rotation,Slerp
from pathlib import Path
ZIP=str(Path(__file__).resolve().parent/'assets'/'Male2_bvh.zip')
def load(name,start,end):
 with zipfile.ZipFile(ZIP) as z:s=z.read(name).decode()
 h,m=s.split('MOTION');tokens=re.findall(r'[^\s{}]+|[{}]',h);i=1;nodes=[];channels=0
 def node(parent):
  nonlocal i,channels
  typ=tokens[i];name=tokens[i+1];i+=2
  if typ=='End':name=nodes[parent]['name']+'_end'
  assert tokens[i]=='{';i+=1;j=len(nodes)
  d={'name':name,'parent':parent,'offset':None,'channels':[],'start':channels};nodes.append(d)
  while tokens[i]!='}':
   if tokens[i]=='OFFSET':d['offset']=np.array(list(map(float,tokens[i+1:i+4])));i+=4
   elif tokens[i]=='CHANNELS':
    n=int(tokens[i+1]);d['channels']=tokens[i+2:i+2+n];d['start']=channels;channels+=n;i+=n+2
   elif tokens[i] in ('JOINT','End'):node(j)
   else:raise ValueError(tokens[i])
  i+=1
 node(-1);lines=m.strip().splitlines();dt=float(lines[1].split(':')[1]);a=np.loadtxt(lines[2:])[start:end+1];n=len(a)
 tr=np.zeros((n,len(nodes),3));rot=np.zeros((n,len(nodes),3,3))
 for j,d in enumerate(nodes):
  tr[:,j]=d['offset'];rot[:,j]=np.eye(3)
  for k,c in enumerate(d['channels']):
   v=a[:,d['start']+k]
   if c.endswith('position'):tr[:,j,'XYZ'.index(c[0])]+=v
   else:rot[:,j]=rot[:,j]@Rotation.from_euler(c[0],v[:,None],degrees=True).as_matrix()
 return nodes,tr,rot,dt

def resample(trans,rot,factor):
 old=np.arange(len(trans));new=np.arange((len(trans)-1)*factor+1)/factor
 out_t=np.empty((len(new),)+trans.shape[1:]);out_r=np.empty((len(new),)+rot.shape[1:])
 for j in range(trans.shape[1]):
  for a in range(3):out_t[:,j,a]=np.interp(new,old,trans[:,j,a])
  out_r[:,j]=Slerp(old,Rotation.from_matrix(rot[:,j]))(new).as_matrix()
 return out_t,out_r

def fk(nodes,trans,rot):
 p=np.empty_like(trans);r=np.empty_like(rot)
 for j,d in enumerate(nodes):
  parent=d['parent']
  if parent<0:p[:,j]=trans[:,j];r[:,j]=rot[:,j]
  else:p[:,j]=p[:,parent]+np.einsum('nij,nj->ni',r[:,parent],trans[:,j]);r[:,j]=r[:,parent]@rot[:,j]
 return p
