import test from 'node:test';import assert from 'node:assert/strict';import {validateFilmSpec} from '../scripts/film-spec.mjs';
const s={id:'ContinuousFight',width:1280,height:720,fps:60,durationInFrames:913,impactQaFrame:74,outputName:'continuous-fight.mp4'};
test('duration derives from actual frame count, including nonwhole seconds',()=>assert.equal(validateFilmSpec(s).duration,913/60));
test('invalid frames or out-of-range impact fails closed',()=>{assert.throws(()=>validateFilmSpec({...s,durationInFrames:0}));assert.throws(()=>validateFilmSpec({...s,impactQaFrame:913}));});
