import test from 'node:test';import assert from 'node:assert/strict';
import {resolveRenderTarget} from '../scripts/resolve-render-target.mjs';
test('each FX variant resolves matching composition.props and inputProps',async()=>{
 const calls=[];const select=async args=>{calls.push(args);return{id:args.id,props:{...args.inputProps}}};
 const fx=await resolveRenderTarget(select,{serveUrl:'test'},'ExitFight',true);
 const clean=await resolveRenderTarget(select,{serveUrl:'test'},'ExitFight',false);
 assert.equal(calls.length,2);assert.equal(fx.composition.props.fx,true);
 assert.equal(clean.composition.props.fx,false);assert.equal(clean.inputProps.fx,false);
});
test('stale resolved FX composition is rejected for clean variant',async()=>{
 await assert.rejects(resolveRenderTarget(async()=>({props:{fx:true}}),{},'ExitFight',false),/mismatch/);
});
