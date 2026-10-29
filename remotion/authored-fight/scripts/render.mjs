import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';import fs from 'node:fs';import crypto from 'node:crypto';
import {verifyFrozenSource} from './frozen-source.mjs';
import {codecPreflight} from './codec-preflight.mjs';
import {resolveRenderTarget} from './resolve-render-target.mjs';import {readFilmSpec} from './film-spec.mjs';
const require=createRequire(import.meta.url);const {bundle}=await import('@remotion/bundler');
const {RenderInternals,ensureBrowser,openBrowser,selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
verifyFrozenSource();
const spec=readFilmSpec(),out=path.resolve('out');fs.mkdirSync(out,{recursive:true});
const plan=JSON.parse(fs.readFileSync('render-plan.json','utf8'));if(!['keyframes','preview','final'].includes(plan.mode))throw Error('Invalid mode');
const ffmpeg=RenderInternals.getExecutablePath({type:'ffmpeg',indent:false,logLevel:'warn',binariesDirectory:null});
execFileSync(ffmpeg,['-version'],{stdio:'ignore'});execFileSync('ffprobe',['-version'],{stdio:'ignore'});execFileSync('ffmpeg',['-version'],{stdio:'ignore'});
codecPreflight(ffmpeg,out);
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build')});
await ensureBrowser({logLevel:'info'});const browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'},logLevel:'info'});
try{
 const base={serveUrl,puppeteerInstance:browser,timeoutInMilliseconds:120000};
 const targets={};
 for(const fx of [true,false]){
  const target=await resolveRenderTarget(selectComposition,base,spec.id,fx);targets[String(fx)]=target;
  for(const key of ['fps','width','height','durationInFrames'])if(target.composition[key]!==spec[key])throw Error(`Film spec drift: ${key}`);
  await renderStill({...target,frame:spec.impactQaFrame,output:path.join(out,`qa-impact-${fx}.png`)});
 }
 // Compare decoded RGBA pixels, not file metadata. This gate precedes costly full-film rendering.
 const pixels=fx=>execFileSync('ffmpeg',['-v','error','-i',path.join(out,`qa-impact-${fx}.png`),'-frames:v','1','-pix_fmt','rgba','-c:v','rawvideo','-f','rawvideo','-'],{maxBuffer:spec.width*spec.height*4+1048576});
 const hashes=[true,false].map(fx=>crypto.createHash('sha256').update(pixels(fx)).digest('hex'));
 fs.writeFileSync(path.join(out,'fx-prop-gate.json'),JSON.stringify({frame:spec.impactQaFrame,purpose:'FX visibility check only; not an asserted action/audio contact cue',hashes,pass:hashes[0]!==hashes[1]},null,2));
 if(hashes[0]===hashes[1])throw Error('FX/Clean impact pixels identical; wrong props or impactQaFrame');
 const encode=async(fx,name,scale)=>{
  const raw=path.join(out,'raw-'+name),dest=path.join(out,name);
  await renderMedia({...targets[String(fx)],codec:'h264',audioCodec:'aac',crf:plan.mode==='preview'?25:19,scale,concurrency:2,outputLocation:raw});
  execFileSync(ffmpeg,['-y','-v','error','-i',raw,'-t',String(spec.duration),'-c:v','copy','-c:a','aac','-b:a','192k','-metadata','comment=Original animation and soundtrack; MIT component attribution in THIRD_PARTY_NOTICES.md','-movflags','+faststart',dest]);
  execFileSync(ffmpeg,['-v','error','-i',dest,'-c:v','rawvideo','-c:a','pcm_s16le','-f','null','-'],{stdio:'inherit'});fs.unlinkSync(raw);
 };
 for(const frame of (plan.stillFrames??[])){
  if(!Number.isInteger(frame)||frame<0||frame>=spec.durationInFrames)throw Error('Invalid still frame');
  await renderStill({...targets.true,frame,output:path.join(out,`keyframe-${frame}.png`)});
 }
 if(plan.mode==='keyframes')console.log('Keyframe gate only; no full film rendered');
 else if(plan.mode==='preview'){await encode(true,'preview.mp4',.5);await encode(false,'clean.mp4',.5);}
 else await encode(true,spec.outputName,1);
}finally{await browser.close({silent:true});}
