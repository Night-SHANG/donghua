import test from 'node:test';import assert from 'node:assert/strict';import {validateFilmSpec} from '../scripts/film-spec.mjs';
const spec={id:'LineWorldJourney',width:1280,height:720,fps:30,durationInFrames:720,outputName:'line-world-journey.mp4'};
test('duration derives exactly from frames',()=>assert.equal(validateFilmSpec(spec).duration,24));
test('invalid sizes and output path fail',()=>{assert.throws(()=>validateFilmSpec({...spec,fps:0}));assert.throws(()=>validateFilmSpec({...spec,outputName:'../x.mp4'}));});
