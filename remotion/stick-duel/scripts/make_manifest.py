import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
paths=['package.json','package-lock.json','tsconfig.json','render-plan.json']
for folder in ['src','tests','scripts','docs','audio']:
 for p in (root/folder).rglob('*'):
  if p.is_file() and p.suffix in ['.ts','.tsx','.mjs','.py','.json','.md'] and '__pycache__' not in str(p):paths.append(str(p.relative_to(root)))
entries=[{'path':'remotion/stick-duel/'+p,'mode':'100644','type':'blob','content':(root/p).read_text()} for p in sorted(set(paths))]
entries.append({'path':'.github/workflows/stick-duel.yml','mode':'100644','type':'blob','content':(root/'.github/workflows/stick-duel.yml').read_text()})
(root/'out/source-manifest.json').write_text(json.dumps(entries))
print(len(entries))
