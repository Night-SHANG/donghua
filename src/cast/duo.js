/* Original rival duo. Neutral construction is separate from chosen acting deformation.
 * All control points are body-local; limbs attach after the same body deformation.
 * No stateful simulation, imported image, SVG or new rig dependency. */
window.CAST=(()=>{
 const ink='#34312E';
 const palettes={kokou:{base:'#657A91',shade:'#4F647B',light:'#8C9BAC',hands:'#657A91'},liuliu:{base:'#D48968',shade:'#B97054',light:'#EBC9A1',hands:'#D48968'}};
 const defs={kokou:{h:100,faceY:-66,faceU:4.5,handY:-54,handX:24,footX:17},liuliu:{h:72,faceY:-46,faceU:4.5,handY:-38,handX:22,footX:13}};
 const poses={
  neutral:{emotion:'neutral',sx:1,sy:1,lean:0,armL:[-36,-34],armR:[36,-34]},
  anticipate:{emotion:'determined',sx:1.22,sy:.77,lean:-.12,armL:[-47,-36],armR:[47,-36]},
  push:{emotion:'determined',sx:.97,sy:.93,lean:.19,armL:[40,-44],armR:[61,-50]},
  squash:{emotion:'surprised',sx:1.55,sy:.52,lean:0,armL:[-64,-15],armR:[64,-15]},
  proud:{emotion:'proud',sx:.96,sy:1.07,lean:-.06,armL:[-31,-48],armR:[31,-48]},
  sneak:{emotion:'mischief',sx:1.1,sy:.83,lean:.18,armL:[-35,-28],armR:[44,-34]},
  dash:{emotion:'excited',sx:1.22,sy:.78,lean:.38,armL:[-54,-45],armR:[37,-19]},
  stretch:{emotion:'surprised',sx:.7,sy:1.4,lean:-.06,armL:[-22,-71],armR:[24,-70]},
  smug:{emotion:'mischief',sx:1,sy:1,lean:-.13,armL:[-28,-30],armR:[39,-46]}
 };
 function bodyPoints(who){return who==='kokou'?[[-10,-92],[-19,-85],[-21,-68],[-25,-47],[-28.5,-29],[-26,-24],[-12,-23],[12,-23],[26,-24],[28.5,-29],[25,-47],[21,-68],[19,-85],[10,-92]]:[[-7,-65],[-19,-61],[-24.5,-51],[-23,-34],[-15,-21],[0,-18],[17,-23],[24.5,-35],[23,-49],[17,-60],[6,-65]];}
 function draw(who,x,y,u,o={}){
  const d=defs[who],p=palettes[who],act={...poses[o.pose||'neutral'],...(o.deform||{})},view=o.view||'front',id=o.id||who;
  const back=view==='back',profile=view==='profile',quarter=view==='quarter';const vx=profile?.65:quarter?.88:1;
  const sx=act.sx,sy=act.sy,lean=act.lean,sw=clamp(u/2.7,.7,1.6);
  const local=([a,b])=>[a*sx*vx-b*lean,b*sy];const P=ps=>ps.map(pt=>local(pt).map(n=>n*u));
  const drawPoly=(pts,col,stroke=true)=>paint(P(pts),{wash:col,fill:p.shade,fillOp:40,bleed:.1,tex:.65,ink:stroke?ink:null,sw,curv:.35});
  push();translate(x,y);
  // Feet and hands keep deliberate silhouettes; endpoints follow local anchors.
  for(const side of [-1,1]){
   if(profile&&side<0)continue;boilSeed(id+'foot'+side);
   const dx=side*d.footX+(o.pose==='dash'?(side<0?-14:10):0),dy=o.pose==='dash'&&side>0?-5:0;
   const legTop=who==='kokou'?-24:-19;drawPoly([[side*d.footX-2.5,legTop],[side*d.footX+2.5,legTop],[dx+2.5,-5+dy],[dx-2.5,-5+dy]],p.base);
   drawPoly([[dx-9,-9+dy],[dx+7,-9+dy],[dx+11,-4+dy],[dx+8,dy],[dx-10,dy]],p.base);
  }
  function arm(side,front=false){
   if(profile&&side<0)return;const relative=d.h/100;const end0=side<0?act.armL:act.armR;const end=[end0[0]*relative,end0[1]*relative];const start=[side*d.handX,d.handY];
   const mid=[lerp(start[0],end[0],.5)+side*4,lerp(start[1],end[1],.5)-4];
   boilSeed(id+'arm'+side);inkLine(P([start,mid,end]),sw*2.8,p.base,'ink',.55);inkLine(P([start,mid,end]),sw*.62,ink,'ink',.55);
   // Closed mitten, connected at the wrist; thumb is a simple bulge, not fingers.
   const [ex,ey]=end;drawPoly([[ex-4,ey-3],[ex-5,ey-8],[ex-1,ey-10],[ex+3,ey-8],[ex+7,ey-8],[ex+8,ey-3],[ex+4,ey+2],[ex-1,ey+2]],p.hands);
  }
  if(o.pose!=='push'&&o.pose!=='proud'){arm(-1);if(back)arm(1);}
  boilSeed(id+'body');drawPoly(bodyPoints(who),p.base);
  // Stable hair silhouette; tied to the same local deformation, not free-floating.
  boilSeed(id+'hair');
  if(who==='kokou')drawPoly([[-6,-90],[-18,-98],[-4,-100],[7,-93]],p.base);
  else inkLine(P([[-2,-63],[0,-71],[7,-72],[9,-68]]),sw*1.5,ink,'ink',.5);
  if(!back&&who==='liuliu'){boilSeed(id+'belly');paint(P([[-10,-36],[9,-36],[13,-24],[0,-21],[-12,-25]]),{wash:p.light,ink:null,bleed:.1,curv:.55});}
  if(!back&&who==='kokou'){boilSeed(id+'bow');const bp=[[-8,-44],[0,-41],[8,-44],[8,-35],[0,-38],[-8,-35]];const a=o.bowRot||0;drawPoly(bp.map(([x,y])=>[x*Math.cos(a)-(y+39)*Math.sin(a),-39+x*Math.sin(a)+(y+39)*Math.cos(a)]),'#CC9A4D');}
  if(!back&&o.pose!=='push'&&o.pose!=='proud')arm(1);
  if(!back&&!o.hideFace){
   const faceX=profile?3:quarter?3:0,faceY=d.faceY;
   // Light facial field keeps dark ink readable on indigo; same painted medium.
   if(who==='kokou'){boilSeed(id+'facefield');const fw=profile?11:16;paint(P([[faceX-fw,faceY-12],[faceX+fw,faceY-12],[faceX+fw,faceY+12],[faceX-fw,faceY+12]]),{wash:'#F1DEB7',washOp:255,ink:null,curv:.6});}
   const q=local([faceX,faceY]);push();translate(q[0]*u,q[1]*u);scale(sx*(profile?.6:quarter?.9:1),sy);
   const emotion={...feel(act.emotion,o.time||0),...(o.faceOverrides||{})};boilSeed(id+'face');push();translate(0,6*d.faceU*u);eyes(d.faceU*u,{...emotion,seed:17},sw,profile?[1]:[-1,1]);mouth(d.faceU*u,emotion.mouth||'flat',sw);pop();pop();
  }
  // In strong effort the hands are intentionally brought in front of the torso.
  if(o.pose==='push'||o.pose==='proud'){arm(-1,true);arm(1,true);}
  pop();
 }
 return {draw,defs,palettes,poses,bodyPoints};
})();
