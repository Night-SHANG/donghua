import assert from 'node:assert/strict';
import {leaf2DMotion} from './motion';
const boundaries=[{scene:0,from:0,end:234},{scene:1,from:198,end:450},{scene:2,from:414,end:690},{scene:3,from:654,end:900}];
for(const {scene,from,end} of boundaries){let prev:ReturnType<typeof leaf2DMotion>|undefined;for(let f=from;f<end;f++){const t=(f-from)/60;const a=leaf2DMotion(scene,t);assert.deepEqual(a,leaf2DMotion(scene,t));for(const v of Object.values(a))assert(Number.isFinite(v));assert(a.x>300&&a.x<1650);assert(a.y>50&&a.y<950);assert(a.fold>=.49&&a.fold<=1.001);assert(a.scale>.4&&a.scale<1.4);assert(a.frost>=0&&a.frost<=1);if(prev){assert(Math.abs(a.x-prev.x)<30);assert(Math.abs(a.y-prev.y)<30);assert(Math.abs(a.rotation-prev.rotation)<12)}prev=a}}
const end=leaf2DMotion(3,4);const resting=leaf2DMotion(3,3.3);assert.equal(end.x,resting.x);assert.equal(end.y,resting.y);assert.equal(end.rotation,resting.rotation);assert.equal(end.frost,1);
console.log('2D motion: 1008 sampled states passed finite, deterministic, bounds, continuity, frost and winter-rest checks. Transition windows: 198–234, 414–450, 654–690.');
