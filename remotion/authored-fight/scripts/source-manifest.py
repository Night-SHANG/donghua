"""Hash only deliberately public-safe source paths; never recursive-upload a workspace."""
import hashlib,json
from pathlib import Path
root=Path.cwd();entries=[]
for name in Path('SOURCE_WHITELIST.txt').read_text().splitlines():
 p=Path(name)
 assert not p.is_absolute() and '..' not in p.parts
 assert p.suffix in ('.json','.mjs','.py','.ts','.tsx','.md','.txt')
 assert p.is_file(),name
 entries.append({'path':name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
Path('out').mkdir(exist_ok=True)
Path('out/source-manifest.json').write_text(json.dumps(entries,indent=2)+'\n')
