import sys,json,numpy as np
from scipy.spatial.transform import Rotation
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent));from export_motion import native,motion
root=Path(__file__).resolve().parent.parent
D=np.array([37.07096951030516,0,146.0588146846484]);theta=np.degrees(np.arctan2(D[0],D[2])-np.arctan2(70,140));R=Rotation.from_euler('y',theta,degrees=True).as_matrix();off=D-R@np.array([70,0,140]);az=30-theta
_,kt,kr,_=native('Male2_G4_SpinningBackKick.bvh',yaw=theta,offset=off);runoff=kt[-1,0].copy();runoff[1]=0
boxnative=np.array([np.cos(np.pi/6)*114.06108232-.5*88.39881548,102,np.sin(np.pi/6)*114.06108232+np.cos(np.pi/6)*88.39881548]);boxworld=R@boxnative+off
impactnative=np.array([46.78615850,101.24590391,129.08616103]);impactworld=R@impactnative+off
centerkick=45+np.cos(np.radians(az))*off[0]+np.sin(np.radians(az))*off[2]
def seg(at,filename,start=0,end=9999,yaw=0,offset=(0,0,0)):return dict(at=at,filename=filename,start=start,end=end,yaw=yaw,offset=list(offset))
config={'azimuth':30,'center':45,'kickAzimuth':az,'kickCenter':centerkick,'kickStart':300,'boxWorld':boxworld.tolist(),'impactWorld':impactworld.tolist(),'cabinetFrame':382,'contacts':[],'actors':[
 [seg(42,'Male2_E3_CrossLeft.bvh',8,60),seg(160,'Male2_E16_BlockRightMiddle.bvh',9,61),seg(300,'Male2_G4_SpinningBackKick.bvh',yaw=theta,offset=off),seg(522,'Male2_D6_ReadyToRun.bvh',yaw=theta+180,offset=runoff)],
 [seg(42,'Male2_E16_BlockRightMiddle.bvh',9,61,180,D),seg(160,'Male2_E3_CrossLeft.bvh',8,60,yaw=180,offset=D),seg(300,'Male2_E20_DodgeRight.bvh',yaw=180+theta,offset=D),seg(522,'Male2_D4_ReadyToRelax.bvh',yaw=180+theta,offset=D)]]}
(root/'choreography.json').write_text(json.dumps(config,indent=2));print('kick yaw',theta,'camera',az,'Aoff',off,'run origin',runoff)
