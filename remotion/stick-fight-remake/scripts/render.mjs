import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {bundle}=await import('@remotion/bundler');
const {RenderInternals,ensureBrowser,openBrowser,selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const out=path.resolve('out');fs.mkdirSync(out,{recursive:true});
const plan=JSON.parse(fs.readFileSync('render-plan.json','utf8'));
if(!['preview','final'].includes(plan.mode)) throw Error('Invalid render mode');
const ffmpeg=RenderInternals.getExecutablePath({type:'ffmpeg',indent:false,logLevel:'warn',binariesDirectory:null});
execFileSync(ffmpeg,['-version'],{stdio:'ignore'});
// Bundled compositor ffmpeg lacks wrapped_avframe; runner ffmpeg performs full decode QA.
execFileSync('ffmpeg',['-version'],{stdio:'ignore'});
execFileSync('ffprobe',['-version'],{stdio:'ignore'});
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build')});
await ensureBrowser({logLevel:'info'});
const browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'},logLevel:'info'});
try {
 const base={serveUrl,puppeteerInstance:browser,timeoutInMilliseconds:120000};
 const composition=await selectComposition({...base,id:'ExitFight',inputProps:{fx:true}});
 if(composition.durationInFrames!==900||composition.fps!==60||composition.width!==1280||composition.height!==720)throw Error('Expected 15s / 720p / 60fps composition');
 fs.writeFileSync(path.join(out,'composition.json'),JSON.stringify(composition,null,2));
 const encode=async(fx,name,scale)=>{
  const raw=path.join(out,`raw-${name}`),dest=path.join(out,name);
  await renderMedia({...base,composition,inputProps:{fx},codec:'h264',audioCodec:'aac',crf:plan.mode==='preview'?25:19,scale,concurrency:2,outputLocation:raw,onProgress:({progress})=>console.log(name,Math.round(progress*100))});
  // AAC encoder padding must not extend the advertised 15-second duration.
  execFileSync(ffmpeg,['-y','-v','error','-i',raw,'-t','15','-c:v','copy','-c:a','aac','-b:a','192k','-metadata','comment=Motion derived and modified from ACCAD, The Ohio State University; CC BY 3.0; https://accad.ohio-state.edu/sites/accad.osu.edu/files/Male2_bvh.zip ; https://creativecommons.org/licenses/by/3.0/','-movflags','+faststart',dest]);
  execFileSync('ffmpeg',['-v','error','-i',dest,'-f','null','-'],{stdio:'inherit'});
  fs.unlinkSync(raw);
 };
 if(plan.mode==='preview'){
  for(const f of (plan.stillFrames??[0,120,240,348,480,622,638,738,840,899])){
   if(!Number.isInteger(f)||f<0||f>=900)throw Error('Invalid still frame');
   await renderStill({...base,composition,inputProps:{fx:true},frame:f,scale:1,output:path.join(out,`frame-${f}.png`)});
  }
  await encode(true,'preview-360p60.mp4',.5);
  await encode(false,'clean-360p60.mp4',.5);
 } else await encode(true,'exit-fight-15s.mp4',1);
} finally {await browser.close({silent:true});}
