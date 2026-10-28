import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';import {ensureBrowser,openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';import {validatePlan} from './render-contract.mjs';
const plan=validatePlan(JSON.parse(fs.readFileSync('render-plan.json'))),work=path.resolve('.tmp/rain-letter'),out=path.resolve('artifacts/rain-letter');fs.mkdirSync(path.join(work,'stills'),{recursive:true});fs.mkdirSync(out,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');const write=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n');
const manifest={};function scan(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.tmp','artifacts','.git','__pycache__'].includes(ent.name))continue;const p=path.join(dir,ent.name);if(ent.isSymbolicLink())throw Error('No source symlinks');if(ent.isDirectory())scan(p);else if(!/\.(wav|m4a|pyc|log)$/.test(p))manifest[p]=sha(p)}}scan('.');
const evidence={schema:1,plan,commit:process.env.GITHUB_SHA,repository:process.env.GITHUB_REPOSITORY,runId:process.env.GITHUB_RUN_ID,source:manifest,remotionVersion:'4.0.534',reviewStatus:'Pending independent viewing; rendering does not certify aesthetic quality',renders:[]};write('evidence.json',evidence);
let browser;const logs=[],errors=[];const onBrowserLog=log=>{if(log.type==='error')errors.push(log.text);if(['error','warn'].includes(log.type))logs.push({type:log.type,text:log.text})};
try{
 const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.join(work,'bundle')});const status=await ensureBrowser({logLevel:'info'});evidence.browser=status;
 browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'},logLevel:'info'});const composition=await selectComposition({serveUrl,id:plan.composition,puppeteerInstance:browser});
 for(const k of ['durationInFrames','fps','width','height'])if(composition[k]!==plan[k])throw Error(`Composition ${k} mismatch`);
 const common={serveUrl,composition,puppeteerInstance:browser,onBrowserLog,timeoutInMilliseconds:120000,logLevel:'warn'};
 for(const frame of plan.keyframes)await renderStill({...common,frame,output:path.join(work,'stills',`frame-${frame}.png`),imageFormat:'png',overwrite:false});
 const repeat=path.join(work,'stills','repeat.png');await renderStill({...common,frame:plan.keyframes[0],output:repeat,imageFormat:'png'});evidence.repeatedStillIdentical=sha(repeat)===sha(path.join(work,'stills',`frame-${plan.keyframes[0]}.png`));if(!evidence.repeatedStillIdentical)throw Error('Still changed after out-of-order seeking');if(errors.length)throw Error('Browser errors in keyframes');
 execFileSync('python',['scripts/package_review.py','preflight'],{stdio:'inherit'});
 const renders=plan.phase==='preview'?plan.clips:[{id:'full-film',start:0,endExclusive:1800}];
 for(const clip of renders){const begin=Date.now();await renderMedia({...common,codec:'h264',outputLocation:path.join(work,`${clip.id}-1080p60.mp4`),frameRange:[clip.start,clip.endExclusive-1],imageFormat:'png',crf:16,pixelFormat:'yuv420p',audioCodec:'aac',audioBitrate:'192k',sampleRate:48000,concurrency:2,hardwareAcceleration:'disable',onProgress:p=>{if(p.renderedFrames%60===0)console.log(`${clip.id}: ${p.renderedFrames}/${clip.endExclusive-clip.start}`)}});evidence.renders.push({...clip,renderSeconds:(Date.now()-begin)/1000});if(errors.length)throw Error('Browser errors during render');}
 execFileSync('python',['scripts/package_review.py','package'],{stdio:'inherit'});evidence.completed=true;
}catch(error){evidence.completed=false;evidence.failure=String(error);throw error;}
finally{write('evidence.json',evidence);write('browser-log.json',{errors,logs});if(browser)await browser.close({silent:true});}
