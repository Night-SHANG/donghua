"""Compare identical boundary times across independent Chrome processes."""
import subprocess,re,json
reports=[]
for part in range(5):
    a=f'parts/boundary-{part}.png'; b=f'parts/f{(part+1)*48:05d}.png'
    run=subprocess.run(['ffmpeg','-hide_banner','-i',a,'-i',b,'-lavfi','ssim','-f','null','-'],capture_output=True,text=True,check=True)
    m=re.search(r'All:([0-9.]+)',run.stderr)
    assert m,run.stderr
    score=float(m.group(1));reports.append({'frame':(part+1)*48,'ssim':score})
    reports[-1]['review_recommended']=score<0.98
print(json.dumps({'status':'DIAGNOSTIC','review_threshold':0.98,'boundaries':reports},indent=2))
