import unittest,tempfile,pathlib,json
from derive_cues import derive
class ContractTests(unittest.TestCase):
 def fixture(self,kind='threat-phase',reaction=None,frames=60):
  temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup);p=pathlib.Path(temp.name);(p/'src').mkdir()
  (p/'film-spec.json').write_text(json.dumps(dict(durationInFrames=frames,fps=60)))
  data=dict(fps=60,frames=[{}]*60,beats=[dict(id='push-to-wall',start=0,contactFrame=30)],contacts=[dict(frame=30,beat='push-to-wall',kind=kind)],terminalReaction=reaction)
  (p/'src/poses.json').write_text(json.dumps(data));return p
 def test_missed_pushkick_only_air(self):
  c=derive(self.fixture());self.assertEqual([x['kind'] for x in c['events']],['whoosh'])
 def test_unvalidated_impact_rejected(self):
  with self.assertRaises(AssertionError):derive(self.fixture('impact'))
 def test_duration_mismatch_rejected(self):
  with self.assertRaises(AssertionError):derive(self.fixture(frames=61))
 def test_verified_block(self):
  c=derive(self.fixture('block'));self.assertEqual(c['events'][-1]['kind'],'block')
 def test_verified_rail(self):
  c=derive(self.fixture('rail'));self.assertEqual(c['events'][-1]['kind'],'metal')
 def test_frame_samples(self):
  c=derive(self.fixture());self.assertEqual(c['frames']*800,48000)
if __name__=='__main__':unittest.main()
