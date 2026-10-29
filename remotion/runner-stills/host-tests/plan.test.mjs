import test from 'node:test';import assert from 'node:assert/strict';import {validatePlan} from '../scripts/plan.mjs';
const a={id:'Runner',frame:0,output:'runner-01.png'},b={id:'Runner',frame:30,output:'runner-02.png'};
test('exactly two stills accepted',()=>assert.equal(validatePlan([a,b]).length,2));
test('video-like or unsafe targets rejected',()=>{for(const p of [[a],[a,a],[a,{...b,output:'movie.mp4'}],[a,{...b,output:'../x.png'}],[a,{...b,frame:-1}]])assert.throws(()=>validatePlan(p));});
