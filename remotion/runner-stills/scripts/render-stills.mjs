import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';import {ensureBrowser,openBrowser,selectComposition,renderStill} from '@remotion/renderer';
import {validatePlan} from './plan.mjs';
const plan=validatePlan(JSON.parse(fs.readFileSync('render-plan.json','utf8'))),out=path.resolve('out');fs.mkdirSync(out,{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build')});
await ensureBrowser({logLevel:'info'});const browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'},logLevel:'info'});
const report=[];
try{for(const p of plan){const inputProps=p.inputProps??{};const composition=await selectComposition({serveUrl,id:p.id,inputProps,puppeteerInstance:browser});if(p.frame>=composition.durationInFrames)throw Error('Still frame out of range');const output=path.join(out,p.output);await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame:p.frame,imageFormat:'png',output});const png=fs.readFileSync(output);if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Not PNG');if(png.readUInt32BE(16)!==composition.width||png.readUInt32BE(20)!==composition.height)throw Error('PNG dimension mismatch');report.push({id:p.id,frame:p.frame,output:p.output,width:composition.width,height:composition.height,bytes:png.length,sha256:crypto.createHash('sha256').update(png).digest('hex')});}}finally{await browser.close({silent:true});}
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({renderer:'Remotion renderStill',stills:report},null,2)+'\n');
fs.writeFileSync(path.join(out,'source-commit.txt'),execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}));
const names=[...report.map(x=>x.output),'verification.json','source-commit.txt'];fs.writeFileSync(path.join(out,'SHA256SUMS.txt'),names.map(n=>crypto.createHash('sha256').update(fs.readFileSync(path.join(out,n))).digest('hex')+'  '+n+'\n').join(''));
