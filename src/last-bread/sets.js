// Sparse watercolor bakery slope: static geometry, still repainted through the original brush engine.
(() => {
 const C=Bread.palette;
 const wash=(id,p,c,op=70)=>{boilSeed(`bread/set/${id}`);paint(p,{wash:c,fill:c,fillOp:op,bleed:.09,tex:.65,border:.2,ink:null});};
 const edge=(id,p,c=C.paperShade,sw=.35)=>{boilSeed(`bread/set/${id}`);inkLine(p,sw,c,'ink',.12);};
 const oval=(x,y,rx,ry)=>Array.from({length:20},(_,i)=>[x+rx*Math.cos(i*TAU/20),y+ry*Math.sin(i*TAU/20)]);
 Bread.drawSet=()=>{
  wash('sky',[[210,140],[1690,140],[1850,410],[180,430]],'#C2D6D5',35);
  wash('distant-hill',[[720,490],[960,345],[1160,390],[1310,295],[1560,330],[1870,440],[1870,630]],'#AEBDA4',48);
  for(let i=0;i<5;i++){
   const x=1050+i*145,y=390+(i%2)*40;
   wash(`house${i}`,[[x,y],[x+106,y-8],[x+106,y+190],[x,y+180]],i%2?'#EAD9BA':'#F4E4C5',68);
   wash(`roof${i}`,[[x-14,y+2],[x+51,y-55],[x+123,y-11],[x+105,y+8]],'#BB8064',70);
   edge(`window${i}`,[[x+40,y+50],[x+62,y+46],[x+61,y+85],[x+40,y+86]],'#8B9680',1.4);
  }
  wash('near-wall',[[-80,80],[285,80],[340,765],[-80,745]],'#DDC4A0',78);
  wash('door',[[-20,300],[13,242],[83,216],[146,238],[187,300],[190,742],[-20,735]],'#805B40',85);
  wash('door-light',[[12,324],[35,272],[86,251],[139,278],[153,322],[154,739],[12,735]],'#AE8051',70);
  edge('door-planks',[[56,285],[55,725]],'#6F513C',.6);edge('door-planks2',[[107,284],[111,731]],'#6F513C',.6);
  wash('sign',[[178,285],[337,278],[344,367],[180,373]],'#98704B',82);
  wash('sign-loaf',oval(260,325,54,23),'#E1B46C',85);
  for(let i=0;i<3;i++)edge(`loaf-score${i}`,[[231+i*22,329],[241+i*22,311]],'#FFF0D4',.8);
  edge('sign-iron',[[165,205],[176,193],[335,193],[338,282]],'#615847',.8);
  wash('lane',[[-100,745],[2000,860],[2000,1120],[-100,1120]],'#D8C8AE',68);
  edge('curb',[[-100,742],[2000,857]],'#A5967D',.7);
  // Perspective cobble joints; low count preserves the character watercolor budget.
  for(let row=0;row<3;row++){
   const y=805+row*90;
   edge(`joint-row${row}`,[[-100,y],[2000,y+115]],'#BBA98E',.25);
   for(let i=0;i<6;i++){const x=i*370+(row%2)*170;edge(`stone${row}-${i}`,[[x,y+x*.055],[x-28,y+88+x*.055]],'#C1AE92',.22);}
  }
  wash('pot',[[229,670],[330,673],[315,754],[247,749]],'#BE8063',75);
  wash('plant',[[228,674],[214,625],[248,645],[242,590],[280,630],[307,604],[306,648],[338,641],[326,682]],'#849774',75);
  for(const [x,y]of [[240,625],[282,611],[317,646]])wash(`flower${x}`,oval(x,y,11,10),'#FFF0D4',85);
 };
 Bread.drawGroundShadow=(id,x,y,r,alpha=30)=>wash(`shadow/${id}`,oval(x,y,r,10), '#8D7C62',alpha);
 Bread.drawWrappedBread=b=>{
  const tr=ps=>ps.map(([x,y])=>[b.x+x*Math.cos(b.rot)-y*Math.sin(b.rot),b.y+x*Math.sin(b.rot)+y*Math.cos(b.rot)]);
  boilSeed('bread/parcel');paint(Bread.parcelGeometry(b),{wash:C.cream,fill:C.cream,fillOp:80,bleed:.05,tex:.65,ink:'#A27B50',sw:.3});
  boilSeed('bread/parcel-fold');paint(tr([[-48,-26],[-17,-14],[-8,32],[-28,38],[-56,9]]),{fill:C.paperShade,fillOp:50,ink:null,tex:.5});
  for(const [id,pts]of [['seam',[[-32,-65],[0,-31],[30,-42]]],['string',[[-10,-38],[4,-10],[3,37]]],['bow',[[-7,-36],[-24,-50],[-32,-43],[-8,-30],[10,-47],[20,-45],[15,-36],[-8,-30],[13,-12]]]]){
   boilSeed(`bread/parcel/${id}`);inkLine(tr(pts),id==='seam'?.25:.6,id==='seam'?'#B79D79':'#B96D44','ink',.1);
  }
 };
})();
