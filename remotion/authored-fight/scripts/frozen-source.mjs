import fs from 'node:fs';import crypto from 'node:crypto';
export function verifyFrozenSource(){
 const freeze=JSON.parse(fs.readFileSync('frozen-source.json','utf8'));
 if(freeze.status!=='frozen')throw Error('Director source is not frozen');
 const hash=crypto.createHash('sha256').update(fs.readFileSync('src/poses.json')).digest('hex');
 if(hash!==freeze.posesSha256)throw Error('Frozen pose source changed');
 const poses=JSON.parse(fs.readFileSync('src/poses.json','utf8')),spec=JSON.parse(fs.readFileSync('film-spec.json','utf8'));
 if(poses.length!==freeze.durationInFrames||poses.length!==spec.durationInFrames)throw Error('Frozen duration mismatch');
 const cues=JSON.parse(fs.readFileSync('audio/cues.json','utf8'));
 if(cues.total_frames!==poses.length||cues.fps!==spec.fps||cues.source_hashes['src/poses.json']!==hash)throw Error('Audio/pose source mismatch');
 return freeze;
}
