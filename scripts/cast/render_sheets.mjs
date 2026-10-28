import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('.'),out=resolve(process.env.OUTPUT_DIR||'out/cast');await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(root+'/'))return res.writeHead(403).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript'})[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404).end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;const log={commit:process.env.GITHUB_SHA,sheets:[],errors:[]};
try{
 browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:[],protocolTimeout:180000});log.chrome=await browser.version();
 const page=await browser.newPage();page.on('pageerror',e=>log.errors.push(e.message));
 for(const name of ['duo_master','kokou_sheet','liuliu_sheet']){
  await page.goto(`http://127.0.0.1:${server.address().port}/cast.html?render&loop=${name}`,{waitUntil:'networkidle0',timeout:60000});await page.waitForFunction(()=>window.ready===true,{timeout:90000});
  const t=performance.now();const data=await page.evaluate(async()=>{await film.frame(0);return document.getElementById('out').toDataURL('image/png')});const b=Buffer.from(data.split(',')[1],'base64');await writeFile(resolve(out,`${name}.png`),b);log.sheets.push({name,ms:Math.round(performance.now()-t),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});
 }
 assert.deepEqual(log.errors,[]);log.status='passed';
}catch(e){log.status='failed';log.error=e.stack;throw e;}finally{await writeFile(resolve(out,'manifest.json'),JSON.stringify(log,null,2));if(browser)await browser.close();server.close();}
