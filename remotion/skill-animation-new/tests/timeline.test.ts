import {test} from 'node:test';
import assert from 'node:assert/strict';
import {heroPose,hatAt,cameraAt,TOTAL} from '../src/timeline.ts';
test('full timeline remains finite and continuous',()=>{assert.equal(TOTAL,720);for(let f=0;f<TOTAL;f++){for(const v of Object.values(heroPose(f)))assert.ok(Number.isFinite(v));for(const v of Object.values(hatAt(f)))assert.ok(Number.isFinite(v));assert.ok(cameraAt(f).z>0);if(f>0){const a=hatAt(f-1),b=hatAt(f);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<50,`hat jump at ${f}`);}}});
import {solve} from '../src/stickman/stick';
import {SCALE} from '../src/timeline';
test('lifting hand follows rotated brim not hat origin',()=>{for(let f=456;f<=530;f++){const h=hatAt(f),r=h.r*Math.PI/180,target=[h.x-83*Math.cos(r)-3*Math.sin(r),h.y-83*Math.sin(r)+3*Math.cos(r)],j=solve(heroPose(f),SCALE);assert.ok(Math.hypot(j.rHand[0]-target[0],j.rHand[1]-target[1])<1,`brim gap at ${f}`)}});
test('takeoff and landing have no one-frame root teleport',()=>{for(let f=281;f<=375;f++){const a=heroPose(f-1),b=heroPose(f);assert.ok(Math.hypot(b.x-a.x,b.y-a.y)<45,`root teleport at ${f}`)}});
test('pose modifiers blend in without joint angle pops',()=>{for(let f=1;f<720;f++){const a=heroPose(f-1),b=heroPose(f);for(const k of ['lean','head','la1','la2','ra1','ra2','ll1','ll2','rl1','rl2'] as const)assert.ok(Math.abs(((b[k]-a[k]+540)%360)-180)<40,`angle pop ${k} at ${f}`)}});
