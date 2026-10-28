// Original paper/gouache forest garden: native geometry, BRUSH/RENDER materials.
// Static layers cached independently. Moving props/actors/foliage are drawn live.
(() => {
const F=FABLE,C=F.C,P=PAINT;
function ellipse(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
function paper(c,pts,color,seed,grain=55){
 const path=P.cut(pts,seed,10,1.2);c.fillStyle=color;c.fill(path);
 c.save();c.clip(path);
 P.watercolor(c,pts,color,{layers:2,alpha:.08,amp:5,seed,edge:.03});
 const r=U.rng(seed+91),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 const x0=Math.min(...xs),y0=Math.min(...ys),w=Math.max(...xs)-x0,h=Math.max(...ys)-y0;
 for(let i=0;i<grain;i++){const x=x0+r()*w,y=y0+r()*h;c.strokeStyle=i%3?'rgba(255,246,210,.18)':'rgba(62,42,23,.1)';c.lineWidth=.6+r()*1.7;c.beginPath();c.moveTo(x,y);c.lineTo(x+2+r()*9,y+r()*3);c.stroke();}c.restore();return path;
}
function leaf(c,x,y,size,angle,color,seed){c.save();c.translate(x,y);c.rotate(angle);
 const p=paper(c,[[0,0],[size*.25,-size*.37],[size*.7,-size*.28],[size,0],[size*.6,size*.27],[size*.2,size*.3]],color,seed,8);
 c.strokeStyle='rgba(78,67,36,.24)';c.lineWidth=1;c.beginPath();c.moveTo(0,0);c.lineTo(size*.85,0);c.stroke();c.restore();}
F.leaf=leaf;
F.forest=()=>P.cached('fable_forest_native_v4',2800,1400,g=>{
 g.fillStyle=C.paper;g.fillRect(0,0,2800,1400);
 const r=U.rng(1937);
 P.watercolor(g,P.rectPts(0,0,2800,1100),'#D8C799',{layers:3,alpha:.22,amp:30,seed:7,edge:0});
 // Atmospheric tree ranks, not a flat rectangle/house. Stable, seeded pigment.
 for(let rank=0;rank<3;rank++)for(let n=0;n<17;n++){
  const x=n*175+r()*130,y=450+rank*90,ht=290+r()*440,wd=12+rank*10;
  const cols=['#C5C3A2','#A7AD90','#829077'];
  P.brush(g,[[x,y+270],[x-18,y-ht*.2],[x+20,y-ht]],{w:wd,col:P.hex(cols[rank]),seed:n+rank*80,tone:.3+rank*.12,dry:.4,bristles:5});
  for(let k=0;k<12;k++)P.watercolor(g,P.ellipsePts(x+(r()-.5)*180,y-ht*.6-r()*110,65+r()*65,45+r()*60,8),['#C6C69C','#ADB48A','#99A17A'][rank],{layers:2,alpha:.1,amp:10,seed:n*20+k+rank*80,edge:0});
 }
 P.watercolor(g,[[-100,810],[600,700],[1300,740],[2000,695],[2900,770],[2900,1450],[-100,1450]],'#CBAE75',{layers:3,alpha:.18,amp:18,seed:811,edge:.04});
 // Low woodland wall establishes a handcrafted place without competing with eyes.
 for(let i=0;i<26;i++){const x=i*118,y=754+(i%2)*15;paper(g,P.ellipsePts(x,y,68,34,7),i%3?'#B8AD89':'#C8BC95',200+i,20);}
 for(let i=0;i<240;i++){const x=r()*2800,y=880+r()*520;leaf(g,x,y,7+r()*17,r()*6.3,['#BB8F44','#9C9A64','#DBBE78'][i%3],i+700);}
});
F.tree=()=>P.cached('fable_oak_frame_v4',760,1100,g=>{
 P.brush(g,[[160,1080],[150,840],[205,610],[172,400],[220,170]],{w:125,col:P.hex('#786746'),seed:3,tone:1,dry:.1,bristles:12});
 P.brush(g,[[190,630],[340,390],[560,200],[740,150]],{w:62,col:P.hex('#83744C'),seed:4,tone:1,dry:.2,bristles:10});
 P.brush(g,[[180,510],[76,300],[20,140]],{w:52,col:P.hex('#82744D'),seed:8,tone:1,dry:.2,bristles:9});
 for(let i=0;i<14;i++)P.brush(g,[[140+i*5,1040],[145+i*4,750],[185+i*3,510]],{w:2,col:P.hex(i%2?'#BDA176':'#4F5138'),tone:.4,dry:.7,seed:40+i,bristles:3});
 const r=U.rng(747);for(let i=0;i<330;i++){const x=r()*760,y=r()*405;leaf(g,x,y,25+r()*44,r()*6.3,['#CFAD58','#DDBB64','#9C9D64','#BCAC62','#E0BE6D'][i%5],i+90);}
});
F.table=()=>P.cached('fable_oak_table_v5',1200,440,g=>{
 g.translate(0,-685);
 // Turned wooden legs: warm material shading is PAINT.vol from native RENDER.
 for(const x of [88,1080]){
  const p=new Path2D();p.moveTo(x-23,746);p.bezierCurveTo(x-39,795,x-33,809,x-21,836);p.lineTo(x-28,1030);p.quadraticCurveTo(x,1046,x+28,1030);p.lineTo(x+21,836);p.bezierCurveTo(x+35,805,x+37,788,x+23,746);p.closePath();
  P.vol(g,p,x-35,0,x+35,0,'#D0A566','#7A542E','rgba(61,36,14,.18)',9);
  for(const y of [782,811,843,1007]){g.strokeStyle='#8E6338';g.lineWidth=4;g.beginPath();g.ellipse(x,y,29,7,0,0,Math.PI*2);g.stroke();}
 }
 const apron=paper(g,[[20,742],[1180,742],[1164,842],[35,842]],'#93663A',48,350);
 P.vol(g,apron,0,742,0,842,'rgba(200,158,89,.28)','rgba(69,43,23,.2)',null);
 for(const x of [48,1152]){ellipse(g,x,775,5,5,'#4B3B28');ellipse(g,x-1,774,2,2,'#BE975F');}
 paper(g,[[0,703],[1180,703],[1200,742],[15,755]],'#C29150',32,600);
 // Three long, irregular planks, with growth-ring grain following the grain direction.
 const r=U.rng(225);g.save();g.beginPath();g.rect(12,705,1172,42);g.clip();
 for(let n=0;n<55;n++){const y=706+r()*40;g.strokeStyle=n%4?'rgba(88,56,28,.21)':'rgba(250,215,143,.55)';g.lineWidth=.5+r()*1.2;
  g.beginPath();g.moveTo(0,y);g.bezierCurveTo(260,y-7,550,y+10,1200,y-3);g.stroke();}
 g.restore();P.impasto(g,[[9,704],[330,701],[650,704],[1190,703]],5,'#E7BC76');
 for(const [x,y] of [[310,720],[900,732]]){for(let k=0;k<5;k++){g.beginPath();g.ellipse(x,y,12+k*9,1+k*.45,0,0,Math.PI*2);g.strokeStyle='rgba(111,73,35,.3)';g.lineWidth=.8;g.stroke();}}
});
F.bowlBase=()=>P.cached('fable_bowl_v6',350,92,g=>{
 const p=new Path2D();p.moveTo(21,28);p.bezierCurveTo(65,100,282,100,329,28);p.closePath();
 P.vol(g,p,0,20,0,90,'#EBDDC0','#AD8E60','rgba(110,78,39,.18)',9);
 ellipse(g,175,28,154,28,'#EEDDBB');ellipse(g,175,28,132,19,'#B99861');
 g.strokeStyle='#FCF2D8';g.lineWidth=4;g.beginPath();g.ellipse(175,28,148,25,0,Math.PI,Math.PI*2);g.stroke();
 const r=U.rng(819);for(let i=0;i<350;i++){const x=30+r()*290,y=27+r()*40;g.fillStyle='rgba(119,86,48,.08)';g.fillRect(x,y,1.5,1.5);}
});
F.drawBowl=(c,x,amount,t,front=false,dy=0)=>{
 const y=F.plate.y+dy;
 if(!front){c.save();c.translate(x-175,y-41);c.shadowColor='rgba(63,44,23,.2)';c.shadowBlur=7;c.shadowOffsetY=5;c.drawImage(F.bowlBase(),0,0);c.restore();
  ellipse(c,x,y-13,132,19,amount>.03?C.soup:'#D8C39A');
  if(amount>.03){c.save();c.beginPath();c.ellipse(x,y-13,130,17,0,0,Math.PI*2);c.clip();
   for(let i=0;i<5;i++){const px=x-87+i*39;c.fillStyle=i%2?'#8C925B':'#E3AD4F';c.fillRect(px,y-15+(i%2)*5,7,3);}
   if((t>6.4&&t<8.5&&x<900)||(t>11.6&&t<13&&x>900)||(t>20.7&&t<22.2&&x>900)){c.strokeStyle='rgba(255,232,174,.75)';c.lineWidth=1.6;for(let i=0;i<3;i++){const q=(t*1.9+i/3)%1;c.globalAlpha=1-q;c.beginPath();c.ellipse(x,y-13,8+q*70,2+q*9,0,0,7);c.stroke();}}c.restore();}
 }else{
  // Ceramic foreground lip occludes only the contacting tip, never the entire face.
  c.strokeStyle='#ECDBB8';c.lineWidth=9;c.beginPath();c.ellipse(x,y-13,148,25,0,0,Math.PI);c.stroke();
  c.strokeStyle='#AD8B57';c.lineWidth=1.8;c.beginPath();c.ellipse(x,y-11,153,28,0,.08,Math.PI-.08);c.stroke();
 }
};
F.jarShape=()=>{const p=new Path2D();p.moveTo(-33,-288);p.bezierCurveTo(-20,-260,-24,-204,-37,-170);p.bezierCurveTo(-83,-125,-90,-30,-54,-6);p.quadraticCurveTo(0,10,54,-6);p.bezierCurveTo(90,-30,83,-125,37,-170);p.bezierCurveTo(24,-204,20,-260,33,-288);p.closePath();return p;};
F.jarPaint=()=>P.cached('fable_jar_ceramic_v7',210,330,g=>{
 g.translate(105,312);const p=F.jarShape();P.vol(g,p,-80,0,90,0,'#ECDDAD','#B8A478','rgba(100,72,35,.15)',9);
 g.save();g.clip(p);const r=U.rng(2001);for(let i=0;i<1600;i++){g.fillStyle=i%3?'rgba(121,96,52,.08)':'rgba(255,247,211,.23)';g.fillRect(-85+r()*170,-300+r()*310,1+r()*2,1+r()*2);}
 // Hand-painted olive frond, continuous brush-stem and individual leaves.
 for(const side of [-1,1]){P.brush(g,[[side*7,-17],[side*25,-80],[side*20,-145]],{w:2.6,col:P.hex('#687E6B'),tone:.66,seed:side+90,bristles:3});for(let i=0;i<6;i++){const y=-32-i*17;P.leaf(g,side*(10+i*2),y,side>0?-1:-2.14,21,4,.62,P.hex('#6F8470'));P.leaf(g,side*(10+i*2),y-7,side>0?-2:-1.14,18,3.2,.57,P.hex('#6F8470'));}}
 g.restore();P.impasto(g,[[-19,-255],[-26,-188],[-52,-122],[-57,-55]],4,'#F4E9C3');
});
F.drawJar=(c,x,t,front=false,dy=0,tilt=0)=>{
 const y=F.jar.y+dy;c.save();c.translate(x,y);c.rotate(tilt);
 if(!front){c.shadowColor='rgba(62,43,22,.18)';c.shadowBlur=8;c.shadowOffsetY=7;c.drawImage(F.jarPaint(),-105,-312);c.shadowBlur=0;c.shadowOffsetY=0;
  ellipse(c,0,-288,34,12,'#C1AC7B');ellipse(c,0,-289,23,7,'#5E4F33');
  c.strokeStyle='#F4E6BC';c.lineWidth=4;c.beginPath();c.ellipse(0,-289,31,10,0,Math.PI,Math.PI*2);c.stroke();
 }else{
  // Opaque vessel body is intentionally redrawn over the inserted beak.
  // Beak enters ONLY through the neck aperture; no muzzle-through-glass trick.
  c.save();c.beginPath();c.rect(-110,-282,220,310);c.clip();c.drawImage(F.jarPaint(),-105,-312);c.restore();
  c.strokeStyle='#E5D3A7';c.lineWidth=6;c.beginPath();c.ellipse(0,-288,31,10,0,0,Math.PI);c.stroke();
 }
 c.restore();
};
F.steam=(c,x,y,t,alpha=.26)=>{
 c.save();c.strokeStyle='rgba(250,244,217,'+alpha+')';c.lineCap='round';c.lineWidth=3;
 for(let k=0;k<3;k++){const phase=(t*.37+k*.33)%1;c.globalAlpha=Math.sin(phase*Math.PI);c.beginPath();const yy=y-phase*76;c.moveTo(x-20+k*20,yy);c.bezierCurveTo(x-40+k*20,yy-22,x+15+k*20,yy-34,x-8+k*20,yy-54);c.stroke();}c.restore();
};
F.drawEnvironment=(c,home,t)=>{
 const ox=F.origin(home);c.save();c.translate(ox-440,-90);
 const bg=window.FABLE_ASSET_META&&FABLE_ASSET_META.background;
 if(bg){c.drawImage(F.imageBank[bg],0,0,2800,1400);}else c.drawImage(F.forest(),0,0);
 c.restore();
 c.save();c.translate(ox,0);
 // Native independent table/ground/shadows remain in shared world coordinates.
 ellipse(c,960,983,675,77,'rgba(106,77,36,.16)');
 for(const [x,y] of [[420,910],[1500,920]]){ellipse(c,x,y,110,23,'rgba(82,65,34,.12)');}
 c.restore();
};
F.foreground=(c,home,t)=>{
 const ox=F.origin(home);c.save();c.translate(ox,0);
 for(const [x,y,s,side] of [[48,1030,1.3,1],[1830,1040,1.1,-1]]){
  c.save();c.translate(x,y);c.scale(side*s,s);c.rotate(.012*Math.sin(t*.9));
  P.brush(c,[[0,80],[20,0],[70,-88],[95,-155]],{w:6,col:P.hex('#697048'),seed:51,tone:.9,dry:.4,bristles:4});
  for(let k=0;k<8;k++)leaf(c,10+k*11,20-k*21,35+k%3*7,k%2?-1.9:-.6,k%3?'#8A945C':'#B7A565',k+200);
  c.restore();
 }
 // One slowly falling oak leaf provides scale, not constant screen-wide noise.
 const q=(t%13)/13;const x=1600-180*q+30*Math.sin(q*7),y=210+820*q;
 leaf(c,x,y,28,q*5.4,'#C5A454',812);c.restore();
};
F.drawTable=(c,home)=>{c.save();c.translate(F.origin(home)+360,0);c.drawImage(F.table(),0,685);c.restore();};
})();
