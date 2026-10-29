"""Public-source allowlist. Official BVH archive is fetched and hash verified in CI, not uploaded."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
paths=['package.json','package-lock.json','tsconfig.json','film-spec.json','render-plan.json','action_graph.json','active_windows.json','motion_engine.py','native_bvh.py','test_motion_engine.py','scripts/build_motion.py','scripts/preview.ts','scripts/global_pose_entry.py','scripts/materialize_assets.py','assets/hit/hit_knockback.npz.b64','assets/hit/ASSET_LICENSE.md','assets/hit/Quaternius-CC0-License.txt','scripts/render.mjs','scripts/film-spec.mjs','scripts/resolve-render-target.mjs','scripts/verify_output.py','scripts/make_manifest.py','audio/synthesize.py','audio/derive_cues.py','audio/test_contract.py','audio/cues.json','audio/test_audio.py','docs/ATTRIBUTION.md']
for folder,extensions in [('src',{'.ts','.tsx'}),('tests',{'.ts','.mjs','.py'})]:
 for p in (root/folder).glob('*'):
  if p.is_file() and p.suffix in extensions:paths.append(str(p.relative_to(root)))
for p in ['README.md','audio/README.md']:
 if (root/p).is_file():paths.append(p)
entries=[]
for p in sorted(set(paths)):
 f=root/p
 if not f.is_file() or f.is_symlink():raise ValueError('Missing or symlink source: '+p)
 entries.append({'path':'remotion/continuous-stick-fight/'+p,'mode':'100644','type':'blob','content':f.read_text()})
w='.github/workflows/continuous-stick-fight.yml';entries.append({'path':w,'mode':'100644','type':'blob','content':(root/w).read_text()})
(root/'out').mkdir(exist_ok=True);(root/'out/source-manifest.json').write_text(json.dumps(entries));print('\n'.join(e['path'] for e in entries))
