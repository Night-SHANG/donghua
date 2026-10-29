import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';import path from 'node:path';import fs from 'node:fs';
const require=createRequire(import.meta.url);
// Cloud sandbox cannot enumerate network devices. Bind only its permitted loopback interface.
if(process.env.REMOTION_LOOPBACK_ONLY==='1'){
 const rendererDir=path.dirname(require.resolve('@remotion/renderer'));
 const config=require(path.join(rendererDir,'port-config.js'));
 config.getPortConfig=()=>({host:'127.0.0.1',hostsToTry:['127.0.0.1']});
}
const {bundle}=await import('@remotion/bundler');const {ensureBrowser,openBrowser,selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const out=path.resolve('out');fs.mkdirSync(out,{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build')});
await ensureBrowser({logLevel:'info'});
const browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'},logLevel:'info'});
const opts={serveUrl,id:'CloudLaundry',puppeteerInstance:browser,timeoutInMilliseconds:120000};
const composition=await selectComposition(opts);console.log('COMPOSITION',composition);
if(process.argv.includes('--stills')){
 for(const sec of [0,3,6.2,8.4,10.5,12.6,15.5,18.5,21.8,24,28]){await renderStill({...opts,composition,frame:Math.round(sec*60),scale:2/3,output:path.join(out,`frame-${sec}.png`)});console.log('STILL',sec);}
 await renderMedia({...opts,composition,codec:'h264',audioCodec:'aac',crf:25,scale:1/3,concurrency:2,outputLocation:path.join(out,'preview-360p60.mp4')});
}else{await renderMedia({...opts,composition,codec:'h264',audioCodec:'aac',crf:19,scale:2/3,concurrency:2,outputLocation:path.join(out,'cloud-laundry-30s.mp4'),onProgress:({progress})=>{console.log('PROGRESS',Math.round(progress*100))}});}

await browser.close({silent:true});

if(!process.argv.includes('--stills')){const source=path.join(out,'cloud-laundry-30s.mp4'),trimmed=path.join(out,'trimmed.mp4');execFileSync('ffmpeg',['-y','-v','error','-i',source,'-t','30','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',trimmed]);fs.renameSync(trimmed,source);}
