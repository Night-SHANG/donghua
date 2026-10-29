import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const poses=JSON.parse(fs.readFileSync('src/poses.json'));const spec=JSON.parse(fs.readFileSync('film-spec.json'));
const keys=['hip','waist','shoulder','head','handL','handR','elbowL','elbowR','footL','footR','kneeL','kneeR'];
test('staged solved pose count equals declared Remotion duration',()=>assert.equal(poses.length,spec.durationInFrames));
test('every authored point is finite and within overscan bounds',()=>{for(const frame of poses)for(const who of ['A','B'])for(const key of keys){const p=frame[who][key];assert.equal(p.length,2);assert.ok(p.every(Number.isFinite));assert.ok(p[0]>-100&&p[0]<1380&&p[1]>-100&&p[1]<820);}});
test('renderer consumes poses exactly, with no interpolation or IK',()=>{const code=fs.readFileSync('src/scene.tsx','utf8');assert.match(code,/poses\[frame\]/);assert.doesNotMatch(code,/Math\.random|interpolate\(|inverseKinematics|requestAnimationFrame/);});
