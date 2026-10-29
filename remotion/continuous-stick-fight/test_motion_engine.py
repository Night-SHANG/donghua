import unittest,numpy as np
from motion_engine import *
class MotionTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.a=load_clip('Male2_E3_CrossLeft.bvh',13,36,fps=60)
  cls.b=load_clip('Male2_E6_HookRight.bvh',18,44,fps=60)
 def test_native_bones_and_rotations(self):
  c=splice(self.a,self.b,14);p=c.positions
  for j,n in enumerate(c.nodes):
   if n['parent']>=0:self.assertLess(np.ptp(np.linalg.norm(p[:,j]-p[:,n['parent']],axis=1)),1e-9)
  self.assertLess(np.max(np.abs(c.rotations.transpose(0,1,3,2)@c.rotations-np.eye(3))),1e-12)
 def test_no_guard_reset_root_alignment(self):
  c=splice(self.a,self.b,14)
  np.testing.assert_allclose(c.translations[:len(self.a)-14],self.a.translations[:-14])
  self.assertEqual(len(c),len(self.a)+len(self.b)-14)
  self.assertLess(metrics(c)['max_local_step_deg'],35)
 def test_persistent_c2_warp(self):
  c,path=warp_root(self.a,[0,30],[[0,0,0],[12,0,0]])
  np.testing.assert_allclose(path[30:],np.tile([12,0,0],(len(c)-30,1)))
  self.assertLess(np.linalg.norm(path[1]-path[0]),.005)
  np.testing.assert_allclose(c.rotations,self.a.rotations)
 def test_bounded_paired_contacts(self):
  a=self.a;b=rigid_transform(a,0,[15,0,0])
  aa,bb,report=paired_contact_warp(a,b,[dict(frame=30,a_joint='RightHand',b_joint='RightHand',separation=[8,0,0])])
  self.assertLess(report['event_residual_cm'][0],1e-9)
  np.testing.assert_allclose(aa.positions[:,0]+bb.positions[:,0],a.positions[:,0]+b.positions[:,0],atol=1e-10)
 def test_refuse_teleport(self):
  with self.assertRaises(ValueError):warp_root(self.a,[0,1],[[0,0,0],[60,0,0]])
 def test_support_corrector_bounded(self):
  with self.assertRaises(ValueError):support_anchor(self.a,'LeftFoot',0,40,blend=8,max_correction_cm=.0001)
if __name__=='__main__':unittest.main()

class StagingTests(unittest.TestCase):
 def test_footwork_window_and_forearm_contact(self):
  a=load_clip('Male2_E3_CrossLeft.bvh',13,36,fps=60);b=rigid_transform(a,0,[15,0,0])
  aa,bb,report=stage_pair(a,b,[dict(frame=35,ramp_start=10,a_joint='RightHand',b_joint='RightHand',separation=[8,0,0])])
  np.testing.assert_allclose(aa.positions[:11],a.positions[:11])
  self.assertLess(report['events'][0]['residual'],1e-9)
 def test_reject_declared_plant_warp(self):
  a=load_clip('Male2_E3_CrossLeft.bvh',13,36,fps=60)
  with self.assertRaises(ValueError):stage_pair(a,a,[dict(frame=30,ramp_start=5,a_joint='RightHand',b_joint='RightHand',support_a=[[0,20]])])

class SourceContractTests(unittest.TestCase):
 def test_archive_pinned(self):
  import hashlib
  self.assertEqual(hashlib.sha256(Path(__import__('motion_engine')._native.ZIP).read_bytes()).hexdigest(),'f30dc56f8557d4b9f1bd6b8b0c4218c076471de0a9c1a20f3bc4a8b776cc14b1')
 def test_phase_clock_monotonic(self):
  c,clock=retime_native_phase('Male2_E3_CrossLeft.bvh',13,35,1.1,19,29)
  self.assertTrue(np.all(np.diff(clock)>0));self.assertAlmostEqual(clock[0],13);self.assertAlmostEqual(clock[-1],35)
  self.assertTrue(np.isfinite(c.positions).all())

class BranchContinuityTests(unittest.TestCase):
 def test_moving_relative_rotation_crosses_pi_without_flip(self):
  import motion_engine as engine
  a=np.repeat(np.eye(3)[None,None],21,axis=0)
  b=Rotation.from_euler('y',np.linspace(175,185,21)[:,None],degrees=True).as_matrix()[:,None]
  r=engine._blend_rot(a,b,engine._quintic(np.linspace(0,1,21)))[:,0]
  steps=np.degrees(Rotation.from_matrix(r[:-1].transpose(0,2,1)@r[1:]).magnitude())
  self.assertLess(steps.max(),20)
  np.testing.assert_allclose(r[-1],b[-1,0],atol=1e-12)
