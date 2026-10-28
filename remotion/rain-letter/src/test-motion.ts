import assert from 'node:assert/strict';
import {umbrellaOpen,umbrellaCenter,windowOpen,camera,progress} from './motion';
for(let f=0;f<1800;f++){
 const t=f/60,u=umbrellaOpen(t),w=windowOpen(t),c=camera(t),p=umbrellaCenter(t);
 assert(u>=0&&u<=1);assert(w>=0&&w<=1);
 for(const n of [u,w,c.x,c.y,c.scale,p.x,p.y])assert(Number.isFinite(n));
 assert.deepEqual(umbrellaCenter(t),umbrellaCenter(t));
 assert.equal(p.x,1100);
 if(f&&![300,600,900,1200,1500].includes(f))assert(Math.abs(c.scale-camera((f-1)/60).scale)<.01);
 if(f)assert(Math.abs(p.y-umbrellaCenter((f-1)/60).y)<5);
}
assert.equal(umbrellaOpen(0),0);assert.equal(umbrellaOpen(12.2),1);assert.equal(umbrellaOpen(27),0);
assert.equal(windowOpen(17.2),0);assert.equal(windowOpen(19.2),1);
assert.equal(progress(3.6,2.8,3.6),1);
console.log('1800 finite deterministic states; shared umbrella center; bounded fold/hinge states and framewise continuity PASS (not visual QA)');
