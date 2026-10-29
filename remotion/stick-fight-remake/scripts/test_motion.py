import unittest,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent.parent
class MotionTests(unittest.TestCase):
 def test_constant_native_bone_lengths(self):
  d=np.load(P/'out/full-motion.npz');p=d['positions'];parents=d['parents']
  for j in range(1,len(parents)):
   lengths=np.linalg.norm(p[:,:,j]-p[:,:,parents[j]],axis=-1)
   self.assertLess(float(np.ptp(lengths)),1e-9)
 def test_finite_orthonormal_local_rotations(self):
  d=np.load(P/'out/full-motion.npz');r=d['rotations'];self.assertEqual(r.shape,(900,2,27,3,3));self.assertTrue(np.isfinite(r).all());self.assertLess(float(np.max(np.abs(r@np.swapaxes(r,-1,-2)-np.eye(3)))),1e-9)
 def test_root_motion_not_erased(self):
  d=np.load(P/'out/full-motion.npz');p=d['positions'];self.assertGreater(float(np.linalg.norm(p[676,0,0,[0,2]]-p[522,0,0,[0,2]])),500)
if __name__=='__main__':unittest.main()
