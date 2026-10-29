"""Explicit public-source allowlist. Never publish private reference media or diagnostics."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
paths=['package.json','package-lock.json','tsconfig.json','render-plan.json','choreography.json',
 'scripts/render.mjs','scripts/verify_output.py','scripts/make_manifest.py','scripts/export_motion.py','scripts/motion.py','scripts/test_motion.py',
 'audio/synthesize.py','audio/cues.json','audio/test_audio.py']
# Generated motion and private study artifacts are rebuilt in CI, not uploaded.
for folder,extensions in [('src',{'.ts','.tsx'}),('tests',{'.ts','.py'}),('audio',{'.py','.json','.md'})]:
 for p in (root/folder).glob('*'):
  if p.is_file() and p.suffix in extensions:paths.append(str(p.relative_to(root)))
if not list((root/'tests').glob('*.test.ts')):raise ValueError('Motion test suite missing')
for name in ['README.md','docs/ATTRIBUTION.md','scripts/make_choreography.py']:
 if (root/name).is_file():paths.append(name)
entries=[]
for p in sorted(set(paths)):
 file=root/p
 if not file.is_file():raise FileNotFoundError(p)
 if file.is_symlink():raise ValueError('Symlink not publishable: '+p)
 entries.append({'path':'remotion/stick-fight-remake/'+p,'mode':'100644','type':'blob','content':file.read_text()})
workflow='.github/workflows/stick-fight-remake.yml'
entries.append({'path':workflow,'mode':'100644','type':'blob','content':(root/workflow).read_text()})
(root/'out').mkdir(exist_ok=True)
(root/'out/source-manifest.json').write_text(json.dumps(entries))
print('\n'.join(e['path'] for e in entries));print(f'{len(entries)} public source files; manually review list before remote write')
