"""Publish only explicit text sources, required MIT licenses and original audio scripts."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
paths=['package.json','package-lock.json','tsconfig.json','film-spec.json','render-plan.json','README.md','THIRD_PARTY_NOTICES.md','scripts/render.mjs','scripts/film-spec.mjs','scripts/resolve-render-target.mjs','scripts/verify_output.py','scripts/make_manifest.py','audio/generate.py','audio/cues.json','audio/test_audio.py']
# Additional MIT components must be named explicitly after license/provenance review.
paths+=json.loads((root/'public-source-files.json').read_text())
paths+=['public-source-files.json']
for folder,extensions in [('src',{'.ts','.tsx','.js','.json'}),('tests',{'.ts','.mjs','.py'}),('host-tests',{'.mjs'})]:
 for p in (root/folder).rglob('*'):
  if p.is_file() and p.suffix in extensions:paths.append(str(p.relative_to(root)))
entries=[]
for p in sorted(set(paths)):
 f=root/p
 if '..' in Path(p).parts or Path(p).is_absolute() or not f.is_file() or f.is_symlink():raise ValueError('Invalid source '+p)
 if any(x in Path(p).parts for x in ('node_modules','.agents','out','reference','references','study','__pycache__')):raise ValueError('Disallowed source '+p)
 entries.append({'path':'remotion/skill-fight-new/'+p,'mode':'100644','type':'blob','content':f.read_text()})
w='.github/workflows/skill-fight-new.yml';entries.append({'path':w,'mode':'100644','type':'blob','content':(root/w).read_text()})
(root/'out').mkdir(exist_ok=True);(root/'out/source-manifest.json').write_text(json.dumps(entries));print('\n'.join(e['path'] for e in entries))
