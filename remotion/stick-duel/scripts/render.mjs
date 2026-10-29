import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';import path from 'node:path';import fs from 'node:fs';
const require=createRequire(import.meta.url);
// Cloud sandbox cannot enumerate network devices. Bind only its permitted loopback interface.
if(process.env.REMOTION_LOOPBACK_ONLY==='1'){
 const rendererDir=path.dirname(require.resolve('@remotion/renderer'));
 const config=require(path.join(rendererDir,'port-config.js'));
 config.getPortConfig=()=>({host:'127.0.0.1',hostsToTry:['127.0.0.1']});
}
const {bundle}=await import('@remotion/bundler');const {RenderInternals,ensureBrowser,openBrowser,selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const ffmpeg=RenderInternals.getExecutablePath({type:'ffmpeg',indent:false,logLevel:'warn',binariesDirectory:null});execFileSync(ffmpeg,['-version'],{stdio:'ignore'});
const out=path.resolve('out');fs.mkdirSync(out,{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build')});
await ensureBrowser({logLevel:'info'});
const browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'},logLevel:'info'});
const opts={serveUrl,id:'StickDuel',puppeteerInstance:browser,timeoutInMilliseconds:120000};
const composition=await selectComposition(opts);console.log('COMPOSITION',composition);
if(process.argv.includes('--stills')){
 for(const sec of [0,.7,1.4,2.1,2.5,2.9,3.42,4.9,5.833333,7.583333,8.25,9.166667,11.98]){await renderStill({...opts,composition,frame:Math.min(719,Math.round(sec*60)),scale:2/3,output:path.join(out,`frame-${sec}.png`)});console.log('STILL',sec);}
 await renderMedia({...opts,composition,codec:'h264',audioCodec:'aac',crf:25,scale:1/3,concurrency:2,outputLocation:path.join(out,'preview-360p60.mp4')});
 await renderMedia({...opts,composition:{...composition,id:'StickDuelClean',props:{fx:false}},inputProps:{fx:false},codec:'h264',audioCodec:'aac',crf:25,scale:1/3,concurrency:2,outputLocation:path.join(out,'clean-360p60.mp4')});
}else{await renderMedia({...opts,composition,codec:'h264',audioCodec:'aac',crf:19,scale:2/3,concurrency:2,outputLocation:path.join(out,'stick-duel-12s.mp4'),onProgress:({progress})=>{console.log('PROGRESS',Math.round(progress*100))}});}

await browser.close({silent:true});

if(!process.argv.includes('--stills')){const source=path.join(out,'stick-duel-12s.mp4'),trimmed=path.join(out,'trimmed.mp4');execFileSync(ffmpeg,['-y','-v','error','-i',source,'-t','12','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',trimmed]);fs.renameSync(trimmed,source);}
