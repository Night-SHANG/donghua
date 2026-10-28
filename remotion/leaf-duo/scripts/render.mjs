import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';import {ensureBrowser,openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';import {validateWebgl} from './render-contract.mjs';
const variant=process.argv[2];const plan=JSON.parse(fs.readFileSync('render-plan.json'));const item=plan.variants[variant];if(!item)throw Error('Variant must be two-d or three-d');
const work=path.resolve('.tmp',variant),out=path.resolve('artifacts',variant);fs.mkdirSync(path.join(work,'stills'),{recursive:true});fs.mkdirSync(out,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');const write=(name,v)=>fs.writeFileSync(path.join(out,name),JSON.stringify(v,null,2)+'\n');
const manifest={};function scan(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.tmp','artifacts','.git','__pycache__'].includes(ent.name))continue;const p=path.join(dir,ent.name);if(ent.isSymbolicLink())throw Error('Source symlinks not allowed');if(ent.isDirectory())scan(p);else if(!/\.(wav|m4a|pyc|log)$/.test(p))manifest[p]=sha(p)}}scan('.');
const evidence={schema:1,variant,composition:item.composition,repository:process.env.GITHUB_REPOSITORY,commit:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,source:manifest,plan:item,remotionVersion:'4.0.534',chromiumGl:'swangle',nativeSize:[1920,1080],fps:60,frames:900,reviewStatus:'pending independent viewing, not aesthetic approval',studioStatus:'Cloud local npm installation resource-killed; Studio CLI unavailable. This CI uses official still/render APIs.'};write('evidence.json',evidence);
const logs=[],webgl=[],errors=[];const onBrowserLog=log=>{if(log.text.includes('LEAF3D_WEBGL ')){const data=JSON.parse(log.text.slice(log.text.indexOf('LEAF3D_WEBGL ')+13));webgl.push(data);console.log(log.text)}if(log.type==='error')errors.push(log.text);if(log.type==='error'||log.type==='warn')logs.push({type:log.type,text:log.text})};
let browser;
try{
 const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.join(work,'bundle')});
 const status=await ensureBrowser({logLevel:'info'});evidence.browser=status;if('path' in status){evidence.browserExecutableSha256=sha(status.path);evidence.browserVersion=execFileSync(status.path,['--version'],{encoding:'utf8'}).trim();}
 browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'},logLevel:'info'});
 const composition=await selectComposition({serveUrl,id:item.composition,puppeteerInstance:browser});
 for(const [key,value]of Object.entries({durationInFrames:900,fps:60,width:1920,height:1080}))if(composition[key]!==value)throw Error(`Composition ${key} mismatch`);
 const common={serveUrl,composition,puppeteerInstance:browser,onBrowserLog,timeoutInMilliseconds:120000,logLevel:'warn'};
 for(const frame of item.keyframes)await renderStill({...common,frame,output:path.join(work,'stills',`frame-${frame}.png`),imageFormat:'png',overwrite:false});
 const repeat=path.join(work,'stills','repeat.png');await renderStill({...common,frame:item.keyframes[0],output:repeat,imageFormat:'png'});evidence.repeatedStillIdentical=sha(repeat)===sha(path.join(work,'stills',`frame-${item.keyframes[0]}.png`));if(!evidence.repeatedStillIdentical)throw Error('Still changed after visiting other frames');
 if(variant==='three-d')validateWebgl(webgl,item.webglFrames);
 if(errors.length)throw Error('Browser errors in keyframes');write('webgl-evidence.json',{variant,required:variant==='three-d',records:webgl,scope:'Actual hero mesh onAfterRender reads real WebGL context and rendered triangles, not state-only proof'});
 execFileSync('python',['scripts/package_review.py','preflight',variant],{stdio:'inherit'});
 const begin=Date.now();await renderMedia({...common,codec:'h264',outputLocation:path.join(work,'master-1080p60.mp4'),imageFormat:'png',crf:16,pixelFormat:'yuv420p',audioCodec:'aac',audioBitrate:'192k',sampleRate:48000,concurrency:variant==='three-d'?1:2,hardwareAcceleration:'disable',onProgress:p=>{if(p.renderedFrames%60===0)console.log(`rendered ${p.renderedFrames}/900`)}});evidence.renderSeconds=(Date.now()-begin)/1000;if(errors.length)throw Error('Browser errors during full render');
 evidence.completed=true;write('evidence.json',evidence);execFileSync('python',['scripts/package_review.py','package',variant],{stdio:'inherit'});
}catch(error){evidence.completed=false;evidence.failure=String(error);write('evidence.json',evidence);throw error;}
finally{write('browser-log.json',{errors,logs});write('webgl-evidence.json',{variant,required:variant==='three-d',records:webgl,scope:'Actual onAfterRender context/geometry measurements; independent visual review remains required'});if(browser)await browser.close({silent:true});}
