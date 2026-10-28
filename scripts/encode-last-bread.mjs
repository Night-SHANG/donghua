// Assemble only an already-rendered, complete pilot. Boundary stills never enter the image sequence.
import {readFile,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';
import {timingSummary} from './render-last-bread.mjs';
export function validatePilotManifest(m){
 const f=m?.film,p=m?.plan;
 if(m?.status!=='rendered'||m.stage!=='breadPilot'||!p?.continuous||f?.width!==1920||f.height!==1080||f.fps!==24||f.duration!==5)throw new Error('Only a completed1080p24 five-second pilot may be encoded');
 const total=f.fps*f.duration,frames=p.frames;
 if(p.start!==0||p.end!==total||p.total!==total||frames.length!==total||frames.some((f,i)=>f!==i))throw new Error('Pilot requires exact continuous frame coverage without duplicates');
 const rendered=m.frameTimes.filter(x=>!x.diagnostic);
 if(rendered.length!==total||rendered.some((x,i)=>x.frame!==i)||!m.frameTimes.some(x=>x.diagnostic&&x.frame===total))throw new Error('Missing rendered frames or boundary diagnostic');
 return {frames:total,fps:f.fps,width:f.width,height:f.height,duration:f.duration};
}
export async function encodePilot(out,audio){
 out=resolve(out);audio=resolve(audio);const path=resolve(out,'render-manifest.json'),m=JSON.parse(await readFile(path,'utf8')),f=validatePilotManifest(m);
 for(let i=0;i<f.frames;i++)await access(resolve(out,'frames',`f${String(i).padStart(5,'0')}.png`));
 const target=resolve(out,'last-bread-pilot-1080p.mp4'),start=performance.now();
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(f.fps),'-start_number','0','-i',resolve(out,'frames/f%05d.png'),'-i',audio,'-map','0:v:0','-map','1:a:0','-frames:v',String(f.frames),'-t',String(f.duration),'-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=range=tv:colorspace=bt709:color_primaries=bt709:color_trc=bt709','-c:v','libx264','-preset','slow','-crf','17','-c:a','copy','-movflags','+faststart',target],{stdio:'inherit'});
 const encodeMs=performance.now()-start;
 execFileSync('python',['scripts/verify-last-bread.py',target,'--out',resolve(out,'pilot-technical-qa.json')],{stdio:'inherit'});
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',target,'-vf',"select=eq(n\\,0)+eq(n\\,29)+eq(n\\,34)+eq(n\\,46)+eq(n\\,53)+eq(n\\,66)+eq(n\\,76)+eq(n\\,87)+eq(n\\,110)+eq(n\\,119),scale=384:216,tile=5x2",'-frames:v','1',resolve(out,'pilot-contact-sheet.jpg')]);
 m.encodedFrameCount=f.frames;m.output=target;m.status='encoded-and-technically-verified';m.visualReview='pending controller and user';m.listeningReview='pending controller and user';
 m.timing=timingSummary(m.frameTimes.filter(x=>!x.diagnostic).map(x=>x.ms),m.startupMs,encodeMs);
 await writeFile(path,JSON.stringify(m,null,2)+'\n');return m;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.length!==4)throw new Error('Usage: node scripts/encode-last-bread.mjs OUT_DIR AUDIO_M4A');
 await encodePilot(process.argv[2],process.argv[3]);
}
