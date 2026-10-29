import fs from 'node:fs';import crypto from 'node:crypto';
export function verifyFrozenSource(){
 const freeze=JSON.parse(fs.readFileSync('frozen-source.json','utf8'));
 if(freeze.status!=='frozen'||!Array.isArray(freeze.sources)||!freeze.sources.length)throw Error('Creative source is not frozen');
 for(const entry of freeze.sources){if(entry.path.startsWith('/')||entry.path.split('/').includes('..'))throw Error('Unsafe source path');const actual=crypto.createHash('sha256').update(fs.readFileSync(entry.path)).digest('hex');if(actual!==entry.sha256)throw Error('Frozen source changed: '+entry.path);}
 const spec=JSON.parse(fs.readFileSync('film-spec.json','utf8'));if(spec.durationInFrames!==freeze.durationInFrames||spec.fps!==freeze.fps)throw Error('Frozen duration mismatch');
 return freeze;
}
