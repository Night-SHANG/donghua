// Integration test: real WebGL2 readPixels, then unchanged showcase source.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
const root = resolve('.');
await mkdir('out', {recursive:true});
const server = createServer(async (req,res)=> {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if (!path.startsWith(root+'/')) {res.writeHead(403).end();return;}
    const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json'}[extname(path)] || 'application/octet-stream';
    res.setHeader('Content-Type',mime); res.end(await readFile(path));
  } catch {res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(8080,'127.0.0.1',ok));
let browser;
try {
  const mode=process.env.GL_MODE || 'default';
  const args=mode==='mesa' ? ['--use-angle=gl'] : [];
  browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:mode!=='mesa',args,protocolTimeout:180000});
  console.log('Chrome',await browser.version(),'args',browser.process().spawnargs);
  const page=await browser.newPage();
  page.on('pageerror',e=>console.error('PAGE ERROR',e.message));
  page.on('console',m=>{if(['error','warn'].includes(m.type())) console.log(m.type(),m.text());});
  const probe=await page.evaluate(()=>{
    const c=document.createElement('canvas');c.width=c.height=4;
    const gl=c.getContext('webgl2');if(!gl)return {webgl2:false};
    gl.clearColor(0.25,0.5,0.75,1);gl.clear(gl.COLOR_BUFFER_BIT);
    const p=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);
    const e=gl.getExtension('WEBGL_debug_renderer_info');
    return {webgl2:true,pixel:[...p],version:gl.getParameter(gl.VERSION),renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),error:gl.getError()};
  });
  console.log('WEBGL2',JSON.stringify(probe));
  await writeFile('out/webgl2-'+mode+'.json',JSON.stringify(probe,null,2));
  assert.equal(probe.webgl2,true,'WebGL2 context unavailable');
  assert.equal(probe.error,0);assert.ok(Math.abs(probe.pixel[0]-64)<=1 && Math.abs(probe.pixel[1]-128)<=1 && Math.abs(probe.pixel[2]-191)<=1 && probe.pixel[3]===255,'GPU readPixels mismatch');
  await page.goto('http://127.0.0.1:8080/index.html?render',{waitUntil:'networkidle0',timeout:60000});
  await page.waitForFunction(()=>window.ready===true,{timeout:120000});
  const metadata=await page.evaluate(()=>({width:film.width,height:film.height,fps:film.fps,duration:film.duration,font:document.fonts.check('100px "Permanent Marker"'),renderer:gpuInfo()}));
  console.log('FILM',metadata);assert.equal(metadata.width,1920);assert.equal(metadata.height,1080);assert.equal(metadata.fps,24);assert.equal(metadata.duration,12);
  for(const t of [0,6,11.958333333333334]) {
    const result=await page.evaluate(async t=>{await film.frame(t);const c=document.getElementById('out');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let min=255,max=0;for(let i=0;i<d.length;i+=64){min=Math.min(min,d[i]);max=Math.max(max,d[i]);}return {url:c.toDataURL('image/png'),min,max};},t);
    assert.ok(result.max-result.min>50,'Blank or near-uniform frame');
    await writeFile(`out/smoke-${t.toFixed(3)}.png`,Buffer.from(result.url.split(',')[1],'base64'));console.log('FRAME PASS',t,result.min,result.max);
  }
  await writeFile('out/smoke-pass.json',JSON.stringify({mode,metadata,probe},null,2));
} finally {if(browser)await browser.close();server.close();}
