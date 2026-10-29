import {execFileSync} from 'node:child_process';import fs from 'node:fs';import path from 'node:path';
export function codecPreflight(bundledFfmpeg,out){
 const probe=path.join(out,'codec-probe.mp4'),remux=path.join(out,'codec-remux.mp4');
 execFileSync('ffmpeg',['-y','-v','error','-f','lavfi','-i','color=c=black:s=16x16:r=30:d=0.1','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=0.1','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-t','0.1',probe]);
 const bytes=execFileSync('ffmpeg',['-v','error','-i',probe,'-frames:v','1','-pix_fmt','rgba','-c:v','rawvideo','-f','rawvideo','-']);
 if(bytes.length!==16*16*4)throw Error('System rawvideo muxer preflight failed');
 execFileSync(bundledFfmpeg,['-y','-v','error','-i',probe,'-c:v','copy','-c:a','aac','-movflags','+faststart',remux]);
 execFileSync(bundledFfmpeg,['-v','error','-i',remux,'-c:v','rawvideo','-c:a','pcm_s16le','-f','null','-']);
 fs.writeFileSync(path.join(out,'codec-preflight.json'),JSON.stringify({pass:true,systemRawvideoRgbaBytes:bytes.length,bundledRemux:true,bundledExplicitCodecDecode:true},null,2));
 fs.unlinkSync(probe);fs.unlinkSync(remux);
}
