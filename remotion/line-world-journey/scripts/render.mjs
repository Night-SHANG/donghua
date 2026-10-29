import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';import path from 'node:path';import fs from 'node:fs';import crypto from 'node:crypto';
import {codecPreflight} from './codec-preflight.mjs';import {verifyFrozenSource} from './frozen-source.mjs';import {readFilmSpec} from './film-spec.mjs';
const require=createRequire(import.meta.url),{bundle}=await import('@remotion/bundler');
const {RenderInternals,ensureBrowser,openBrowser,selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
verifyFrozenSource();const spec=readFilmSpec(),out=path.resolve('out');fs.mkdirSync(out,{recursive:true});
const plan=JSON.parse(fs.readFileSync('render-plan.json','utf8'));if(!['preview','final'].includes(plan.mode))throw Error('Invalid mode');
const ffmpeg=RenderInternals.getExecutablePath({type:'ffmpeg',indent:false,logLevel:'warn',binariesDirectory:null});
codecPreflight(ffmpeg,out);
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build')});
await ensureBrowser({logLevel:'info'});const browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'},logLevel:'info'});
try{
 const base={serveUrl,puppeteerInstance:browser,timeoutInMilliseconds:120000},inputProps=plan.inputProps??{};
 const composition=await selectComposition({...base,id:spec.id,inputProps});
 if(composition.props?.withAudio!==true)throw Error('Audio prop not resolved true');
 for(const k of ['width','height','fps','durationInFrames'])if(composition[k]!==spec[k])throw Error('Composition spec mismatch: '+k);
 const target={...base,composition,inputProps};
 for(const frame of plan.stillFrames??[]){if(!Number.isInteger(frame)||frame<0||frame>=spec.durationInFrames)throw Error('Invalid still frame');await renderStill({...target,frame,output:path.join(out,`keyframe-${frame}.png`)});}
 const name=plan.mode==='preview'?'preview.mp4':spec.outputName,raw=path.join(out,'raw-'+name),dest=path.join(out,name);
 await renderMedia({...target,codec:'h264',audioCodec:'aac',crf:plan.mode==='preview'?24:19,scale:plan.mode==='preview'?.5:1,concurrency:2,outputLocation:raw});
 execFileSync(ffmpeg,['-y','-v','error','-i',raw,'-t',String(spec.duration),'-c:v','copy','-c:a','aac','-b:a','192k','-metadata','comment=Original code-authored scene and procedural soundtrack','-movflags','+faststart',dest]);
 execFileSync(ffmpeg,['-v','error','-i',dest,'-c:v','rawvideo','-c:a','pcm_s16le','-f','null','-'],{stdio:'inherit'});fs.unlinkSync(raw);
}finally{await browser.close({silent:true});}
