"""Extract actual final encoded frames into chronological/face/action review sheets."""
import sys, subprocess
from pathlib import Path
from PIL import Image, ImageDraw
video=Path(sys.argv[1]);out=video.parent/'visual-review';out.mkdir(exist_ok=True)
def sheet(name,times,cols,width=480,crop=None):
 tiles=[]
 for t in times:
  p=out/f'frame-{t:.3f}.png'
  if not p.exists():subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(video),'-frames:v','1',str(p)],check=True)
  im=Image.open(p).convert('RGB')
  if crop:im=im.crop(crop)
  im=im.resize((width,round(width*im.height/im.width)))
  ImageDraw.Draw(im).text((8,8),f'{t:.3f}s',fill='black',stroke_width=1,stroke_fill='white');tiles.append(im)
 w,h=tiles[0].size;canvas=Image.new('RGB',(w*cols,h*((len(tiles)+cols-1)//cols)),(243,235,220))
 for i,im in enumerate(tiles):canvas.paste(im,(i%cols*w,i//cols*h))
 canvas.save(out/f'{name}.jpg',quality=93)
sheet('chronological',[.6,1.5,2.3,3.6,4.6,5.6,6.5,6.9,7.7,8.5,9.7,10.4,11.5,12.8,13.5],3)
sheet('pop-fall-lid',[6.5,6.7,6.9,7.1,7.3,7.5,7.65,7.8,8.0,8.2,8.4,8.6],4)
sheet('face-payoff',[9.7,10.15,10.5,11,11.8,12.3,12.8,13.1],4,360,(450,170,1290,1010))
print(out)
