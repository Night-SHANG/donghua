// Thin host for the unchanged film.frame contract. No Chrome flags or GL fallback.
import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import {existsSync,readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';

export function requestStage(request) {
 if(!request||!['views','pilot'].includes(request.stage))throw new Error('stage must be views or pilot; full film deferred pending pilot review');
 return request.stage;
}
export function parseArgs(args) {
 const out={};const allowed=new Set(['loop','start','end','out']);
 for(let i=0;i<args.length;i+=2){const key=args[i]?.slice(2),value=args[i+1];
  if(!args[i]?.startsWith('--')||!allowed.has(key)||Object.hasOwn(out,key)||!value||value.startsWith('--'))throw new Error('Invalid or missing CLI argument');
  out[key]=['start','end'].includes(key)?Number(value):value;
 }
 if(!['breadPilot','breadViews'].includes(out.loop))throw new Error('full film deferred pending pilot review; choose --loop breadPilot|breadViews');
 for(const key of ['start','end'])if(out[key]!==undefined&&(!Number.isInteger(out[key])||out[key]<0))throw new Error('frame bounds must be nonnegative integers');
 return out;
}
export function planFrames(options,film) {
 const total=film.duration*film.fps;
 if(!Number.isInteger(total)||total<1||!Number.isFinite(film.width)||!Number.isFinite(film.height)||film.fps<=0)throw new Error('Invalid film metadata');
 if(!['breadPilot','breadViews'].includes(options.loop))throw new Error('full film deferred pending pilot review');
 const start=options.start??0,end=options.end??total;
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||start>=end||end>total)throw new Error('Invalid frame range');
 const continuous=options.loop==='breadPilot';
 const frames=Array.from({length:end-start},(_,i)=>start+i).filter(f=>continuous||f%Math.round(film.fps/2)===0);
 if(!frames.length)throw new Error('No selected view frames in range');
 return {start,end,total,continuous,frames,boundary:continuous?end:null};
}
export function timingSummary(ms,startupMs,encodeMs=0,chunks=6) {
 if(!ms.length||ms.some(x=>!Number.isFinite(x)||x<0)||!Number.isInteger(chunks)||chunks<1)throw new Error('Invalid timing input');
 const s=[...ms].sort((a,b)=>a-b),p95=s[Math.ceil(s.length*.95)-1];
 return {medianMs:s[Math.floor(s.length/2)],p95Ms:p95,maxMs:s.at(-1),startupMs,encodeMs,
 projectedChunks:chunks,projectionFrames:1440,headroom:1.3,projectedChunkUpperMs:Math.ceil((Math.ceil(1440/chunks)*p95+startupMs+encodeMs)*1.3),projectionOnly:true};
}
export function entryMetadata(loop) {
 const window={},ctx=vm.createContext({window,console,URLSearchParams,location:{search:`?render&loop=${loop}`}});
 for(const [,src,inline]of readFileSync('last-bread.html','utf8').matchAll(/<script(?:\s+src="([^"]+)")?>([\s\S]*?)<\/script>/g)){
  if(src?.startsWith('node_modules/'))continue;
  vm.runInContext(src?readFileSync(src,'utf8'):inline,ctx,{filename:src||'entry-inline'});
 }
 if(!vm.runInContext(`typeof LOOPS[${JSON.stringify(loop)}] === 'function'`,ctx))throw new Error(`${loop} is not implemented in this source snapshot`);
 const {width,height,fps,duration}=window.film;return {width,height,fps,duration};
}
export function encoderPreflight(film,out) {
 execFileSync('ffmpeg',['-version'],{stdio:'ignore'});execFileSync('ffprobe',['-version'],{stdio:'ignore'});
 const file=resolve(out,'encoder-preflight.mp4');
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i',`color=c=orange:s=${film.width}x${film.height}:r=${film.fps}`,'-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-frames:v','1','-t',String(1/film.fps),'-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',file]);
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-i',file,'-f','null','-']);
 const p=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',file]));
 if(!p.streams.some(s=>s.codec_name==='h264')||!p.streams.some(s=>s.codec_name==='aac'))throw new Error('Encoder/mux preflight missing streams');
 return p;
}
async function processTreeRss(rootPid) {
 // Linux real process tree including Chrome renderers, not just Node heap.
 const rows=[];
 for(const id of await readdir('/proc'))if(/^\d+$/.test(id))try{const s=await readFile(`/proc/${id}/status`,'utf8');rows.push({id:+id,parent:+s.match(/^PPid:\s+(\d+)/m)[1],rss:+(s.match(/^VmRSS:\s+(\d+)/m)?.[1]||0)});}catch{}
 const ids=new Set([rootPid]);let grew=true;while(grew){grew=false;for(const r of rows)if(ids.has(r.parent)&&!ids.has(r.id)){ids.add(r.id);grew=true;}}
 return rows.filter(r=>ids.has(r.id)).reduce((sum,r)=>sum+r.rss,0);
}
export async function render(options) {
 const started=performance.now(),root=resolve('.'),out=resolve(options.out||'out/last-bread');
 let server,browser,timer,peakRssKiB=0;const frameTimes=[],errors=[];
 const manifest={status:'initializing',stage:options.loop,scope:'pilot-validation-only',sourceSHA:process.env.GITHUB_SHA||null,frameTimes};
 try{
  await mkdir(out,{recursive:true});
  const film=entryMetadata(options.loop),plan=planFrames(options,film);
  Object.assign(manifest,{film,plan});
  manifest.preflight=encoderPreflight(film,out);
  manifest.sourceSHA=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  server=createServer(async(req,res)=>{try{const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
  await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});
  const {default:puppeteer}=await import('puppeteer-core');
  browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:[],protocolTimeout:300000});
  manifest.chromeVersion=await browser.version();manifest.chromeArgs=browser.process().spawnargs;
  timer=setInterval(()=>processTreeRss(process.pid).then(r=>peakRssKiB=Math.max(peakRssKiB,r)).catch(()=>{}),1000);
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  const probe=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=4;const gl=c.getContext('webgl2');if(!gl)return {webgl2:false};gl.clearColor(.25,.5,.75,1);gl.clear(gl.COLOR_BUFFER_BIT);const pixel=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);return {webgl2:true,pixel:[...pixel],error:gl.getError(),version:gl.getParameter(gl.VERSION)};});
  manifest.probe=probe;await writeFile(resolve(out,'webgl2.json'),JSON.stringify(probe,null,2));
  if(!probe.webgl2||probe.error!==0||probe.pixel.some((p,i)=>Math.abs(p-[64,128,191,255][i])>1))throw new Error('Sandbox WebGL2 readPixels preflight failed; no fallback authorized');
  await page.goto(`http://127.0.0.1:${server.address().port}/last-bread.html?render&loop=${options.loop}`,{waitUntil:'networkidle0',timeout:90000});
  await page.waitForFunction(()=>window.ready===true,{timeout:180000});
  const actual=await page.evaluate(()=>({width:film.width,height:film.height,fps:film.fps,duration:film.duration}));
  if(JSON.stringify(actual)!==JSON.stringify(film))throw new Error('Runtime film metadata differs from source metadata');
  manifest.startupMs=performance.now()-started;manifest.status='rendering';
  await mkdir(resolve(out,'frames'),{recursive:true});await mkdir(resolve(out,'diagnostics'),{recursive:true});
  for(const frame of [...plan.frames,...(plan.boundary===null?[]:[plan.boundary])]){
   const t0=performance.now(),result=await page.evaluate(async t=>{await film.frame(t);const c=document.getElementById('out'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let min=255,max=0;for(let i=0;i<d.length;i+=64){min=Math.min(min,d[i]);max=Math.max(max,d[i]);}return {url:c.toDataURL('image/png'),min,max};},frame/film.fps);
   if(errors.length)throw new Error(errors.join('\n'));if(result.max-result.min<=50)throw new Error(`Blank frame ${frame}`);
   const diagnostic=frame===plan.boundary,ms=performance.now()-t0;
   await writeFile(resolve(out,diagnostic?'diagnostics':'frames',`${diagnostic?'boundary-':'f'}${String(frame).padStart(5,'0')}.png`),Buffer.from(result.url.split(',')[1],'base64'));
   frameTimes.push({frame,t:frame/film.fps,ms,diagnostic});console.log('RENDER',frame,ms.toFixed(1),'ms',diagnostic?'boundary (excluded)':'');
   await writeFile(resolve(out,'render-manifest.json'),JSON.stringify({...manifest,peakProcessTreeRssKiB:peakRssKiB},null,2));
  }
  manifest.status='rendered';manifest.renderedFrameCount=plan.frames.length;manifest.encodedFrameCount=0;
  manifest.timing=timingSummary(frameTimes.filter(f=>!f.diagnostic).map(f=>f.ms),manifest.startupMs);
 }catch(e){manifest.status='failed';manifest.error=e.message;throw e;}
 finally{clearInterval(timer);manifest.peakProcessTreeRssKiB=peakRssKiB;manifest.nodePeakRssKiB=process.resourceUsage().maxRSS;manifest.errors=errors;try{await writeFile(resolve(out,'render-manifest.json'),JSON.stringify(manifest,null,2));}finally{if(browser)await browser.close();if(server?.listening)await new Promise(ok=>server.close(ok));}}
 return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try {if(process.argv[2]==='--request-stage'){console.log(requestStage(JSON.parse(readFileSync(process.argv[3],'utf8'))));}else await render(parseArgs(process.argv.slice(2)));}
 catch(e){console.error(e.message);process.exitCode=1;}
}
