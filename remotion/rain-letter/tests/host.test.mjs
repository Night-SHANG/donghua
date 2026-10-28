import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {validatePlan} from '../scripts/render-contract.mjs';
const p=JSON.parse(fs.readFileSync('render-plan.json'));
test('30-second preview plan validates',()=>assert.equal(validatePlan(p).durationInFrames,1800));
test('final is blocked without reviewed commit',()=>assert.throws(()=>validatePlan({...p,phase:'final',approvedPreviewCommit:null})));
test('reviewed final may render',()=>assert.equal(validatePlan({...p,phase:'final',approvedPreviewCommit:'a'.repeat(40)}).phase,'final'));
test('missing/duplicate keyframes rejected',()=>assert.throws(()=>validatePlan({...p,keyframes:Array(11).fill(1)})));
test('wrong composition duration rejected',()=>assert.throws(()=>validatePlan({...p,durationInFrames:900})));
test('lock exactly matches pinned direct dependencies',()=>{let a=JSON.parse(fs.readFileSync('package.json')),b=JSON.parse(fs.readFileSync('package-lock.json'));assert.deepEqual(a.dependencies,b.packages[''].dependencies);assert.deepEqual(a.devDependencies,b.packages[''].devDependencies);assert.equal(a.name,b.name);assert.equal(a.name,b.packages[''].name);});
