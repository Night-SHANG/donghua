"""Pilot-only decode/format/frame/audio gate. It cannot approve animation or listening quality."""
import argparse, json, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools/audio'))
import mix

def verify(path, audio_only=False):
    meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(path)]))
    a=next(s for s in meta['streams'] if s['codec_type']=='audio')
    assert a['codec_name']=='aac' and int(a['sample_rate'])==48000 and a['channels']==2, 'Expected AAC stereo48k'
    assert abs(float(meta['format']['duration'])-5)<.02, 'Expected five-second pilot only'
    x=mix.load(str(path));tp=mix.true_peak(x);loudness=mix.integrated(mix.kpow(x))
    assert tp<=-1.5, f'Decoded AAC true peak {tp:.3f} exceeds -1.5dBTP'
    assert -16<=loudness<=-12, f'Pilot loudness {loudness:.3f} too far from -14LUFS'
    report=dict(scope='5-second pilot; full film deferred',duration=float(meta['format']['duration']),sample_rate=48000,channels=2,codec='aac',true_peak_dbtp=tp,integrated_lufs=loudness)
    if not audio_only:
        v=next(s for s in meta['streams'] if s['codec_type']=='video')
        assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p'
        assert (v['width'],v['height'])==(1920,1080)
        assert v['avg_frame_rate']=='24/1' and int(v['nb_read_frames'])==120
        assert all(v.get(k)=='bt709' for k in ['color_space','color_transfer','color_primaries'])
        assert v.get('color_range')=='tv'
        report.update(width=1920,height=1080,fps=24,frames=120,pix_fmt='yuv420p',color='bt709',range='tv')
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-xerror','-i',str(path),'-f','null','-'],check=True)
    report['full_decode']='pass'
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('video',nargs='?');p.add_argument('--audio');p.add_argument('--out');a=p.parse_args()
    if bool(a.video)==bool(a.audio):p.error('Supply one video or --audio, not both')
    report=verify(a.audio or a.video, bool(a.audio));result=json.dumps(report,indent=2)+'\n'
    if a.out:Path(a.out).write_text(result)
    print(result)
