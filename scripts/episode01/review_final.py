"""Decode the actual muxed MP4 for chronological/staging/face-contact evidence."""
from pathlib import Path
from PIL import Image,ImageDraw
import argparse,subprocess
p=argparse.ArgumentParser();p.add_argument('video',type=Path);p.add_argument('out',type=Path);a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
def frames(times,name,crop=None,width=480,cols=4):
 imgs=[]
 for t in times:
  f=a.out/f'{name}-{t:06.3f}.png';subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(a.video),'-frames:v','1',str(f)],check=True)
  im=Image.open(f).convert('RGB'); im=im.crop(crop) if crop else im; h=round(width*im.height/im.width);im=im.resize((width,h));imgs.append((t,im))
 height=imgs[0][1].height+24;o=Image.new('RGB',(cols*width,((len(imgs)+cols-1)//cols)*height),'#eee7da');d=ImageDraw.Draw(o)
 for i,(t,im) in enumerate(imgs):
  x=i%cols*width;y=i//cols*height;o.paste(im,(x,y));d.text((x+6,y+im.height+4),f'{t:.3f}s',fill='#34312e')
 o.save(a.out/(name+'.jpg'),quality=94)
frames(list(range(1,32,2)),'chronological')
frames([9.1,9.35,10.7,11.1,11.6,12.2,12.4,12.8,13.5,14.4,15.3,16.8],'body-bounce')
frames([15,15.8,16.5,17.2,17.7,18,18.2,18.8,19.5,20.7,22.5,23.5],'chair-success')
frames([24.8,26.3,27.4,27.55,27.65,27.75,27.85,28.1,29.5,30.3,30.7,31.1],'paper-payoff')
frames([26.3,27.55,27.65,27.75,27.85,29.5,30.3,31.1],'face-paper-crops',(0,150,800,1000),400,4)
print('Decoded chronological, three action strips and face-contact crops from final encoded video.')
