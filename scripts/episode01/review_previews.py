"""Arrange actual rendered frames in numerical time order; never create replacement art."""
from pathlib import Path
from PIL import Image, ImageDraw
import argparse,re
p=argparse.ArgumentParser();p.add_argument('directory',type=Path);a=p.parse_args()
files=sorted(a.directory.glob('t*.png'),key=lambda p:float(p.stem[1:])); cols=3;w=640;h=384
out=Image.new('RGB',(cols*w,((len(files)+cols-1)//cols)*h),'#eee7da');d=ImageDraw.Draw(out)
for i,p in enumerate(files):
 im=Image.open(p).convert('RGB');assert im.size==(1920,1080);im.thumbnail((640,360));x=i%cols*w;y=i//cols*h;out.paste(im,(x,y));d.text((x+8,y+362),p.stem,fill='#34312e')
out.save(a.directory/'chronological.jpg',quality=93)
for name,times in [('bounce',[9.3,10.7,11.6,12.25,14.5]),('chair',[17,17.8,18.2,19.5]),('paper',[25,26.5,27.8,29.5,31])]:
 fs=[p for p in files if float(p.stem[1:]) in times];o=Image.new('RGB',(640*len(fs),384),'#eee7da');dd=ImageDraw.Draw(o)
 for i,p in enumerate(fs):
  im=Image.open(p).convert('RGB');im.thumbnail((640,360));o.paste(im,(i*640,0));dd.text((i*640+8,362),p.stem,fill='#34312e')
 if fs:o.save(a.directory/(name+'-strip.jpg'),quality=94)
print(len(files),'actual frames arranged')
