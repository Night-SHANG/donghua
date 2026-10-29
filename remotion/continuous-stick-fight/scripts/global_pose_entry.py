"""Bounded whole-body entry: global orientation SLERP, reconstructed native locals.
No Cartesian joint targets or IK. Static endpoint poses prevent changing-target
rotation-log branch problems and parent/child angular-speed accumulation.
"""
import numpy as np
from scipy.spatial.transform import Rotation,Slerp

def global_rotations(nodes,local):
 g=np.empty_like(local)
 for j,n in enumerate(nodes):g[j]=local[j] if n['parent']<0 else g[n['parent']]@local[j]
 return g

def static_pose_entry(nodes,ta,ra,tb,rb,frames=16):
 if frames<3:raise ValueError('Need finite nonzero transition')
 x=np.linspace(0,1,frames);w=x*x*x*(10+x*(-15+6*x))
 ga=global_rotations(nodes,ra);gb=global_rotations(nodes,rb)
 g=np.empty((frames,len(nodes),3,3))
 for j in range(len(nodes)):g[:,j]=Slerp([0,1],Rotation.from_matrix(np.stack([ga[j],gb[j]])))(w).as_matrix()
 r=np.empty_like(g)
 for j,n in enumerate(nodes):r[:,j]=g[:,j] if n['parent']<0 else g[:,n['parent']].transpose(0,2,1)@g[:,j]
 t=np.broadcast_to(ta,(frames,*ta.shape)).copy();t[:,0]=(1-w[:,None])*ta[0]+w[:,None]*tb[0]
 # Same rig offsets are invariant; only root translations may differ.
 if not np.allclose(ta[1:],tb[1:],atol=1e-8):raise ValueError('Entry requires exact same bone offsets')
 return t,r
