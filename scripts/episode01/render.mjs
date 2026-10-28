import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
const mode=process.env.RENDER_STAGE||'preview',root=resolve('.'),out=resolve(process.env.OUTPUT_DIR||'out/episode01');
assert.ok(['preview','full'].includes(mode));await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{let p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+'/')){res.writeHead(403).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json'})[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404).end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;const manifest={stage:mode,commit:process.env.GITHUB_SHA,frames:[],pageErrors:[]};
try{
 browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:[],protocolTimeout:300000});
 manifest.chrome=await browser.version();manifest.args=browser.process().spawnargs;
 const page=await browser.newPage();page.on('pageerror',e=>{manifest.pageErrors.push(e.message);console.error('PAGE ERROR',e.message)});
 manifest.gl=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=4;const gl=c.getContext('webgl2');if(!gl)return{available:false};gl.clearColor(.25,.5,.75,1);gl.clear(gl.COLOR_BUFFER_BIT);const p=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);const e=gl.getExtension('WEBGL_debug_renderer_info');return{available:true,pixel:[...p],error:gl.getError(),renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}});
 assert.equal(manifest.gl.available,true);assert.equal(manifest.gl.error,0);assert.ok(Math.abs(manifest.gl.pixel[0]-64)<2);
 const base=`http://127.0.0.1:${server.address().port}/episode01.html?render`;
 const load=async(url)=>{await page.goto(url,{waitUntil:'networkidle0',timeout:60000});await page.waitForFunction(()=>window.ready===true,{timeout:120000});};
 const frame=async(t,path)=>{const now=performance.now();const r=await page.evaluate(async t=>{await film.frame(t);const c=document.getElementById('out');return c.toDataURL('image/png')},t);const b=Buffer.from(r.split(',')[1],'base64');await writeFile(path,b);const entry={t,path,bytes:b.length,ms:Math.round(performance.now()-now),sha256:createHash('sha256').update(b).digest('hex')};manifest.frames.push(entry);console.log(JSON.stringify(entry));return entry;};
 if(mode==='preview'){
  const request=JSON.parse(await readFile(resolve(root,'film/house-comedy/episode-01/render-request.json'),'utf8'));
  await load(base);manifest.film=await page.evaluate(()=>({width:film.width,height:film.height,duration:film.duration,fps:film.fps}));assert.equal(manifest.film.duration,32);
  for(const [i,t] of request.times.entries()){if(process.env.PREVIEW_PART!==undefined && i%3!==Number(process.env.PREVIEW_PART))continue;await frame(t,resolve(out,`t${t.toFixed(3)}.png`));}
 }else{
  await load(base);manifest.film=await page.evaluate(()=>({width:film.width,height:film.height,duration:film.duration,fps:film.fps}));assert.deepEqual(manifest.film,{width:1920,height:1080,duration:32,fps:24});
  const start=Number(process.env.FRAME_START),end=Number(process.env.FRAME_END);assert.ok(Number.isInteger(start)&&Number.isInteger(end)&&start>=0&&end<=768&&end>start);await mkdir(resolve(out,'frames'),{recursive:true});
  for(let f=start;f<Math.min(end+1,768);f++)await frame(f/24,resolve(out,`frames/f${String(f).padStart(5,'0')}.png`));
 }
 assert.deepEqual(manifest.pageErrors,[]);manifest.status='passed';
}catch(e){manifest.status='failed';manifest.error=e.stack;throw e;}finally{await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2));if(browser)await browser.close();server.close();}
