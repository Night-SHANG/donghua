// Only original generated PNG pose art is allowed here. No geometric actor fallback.
(() => {
const F=FABLE, ROOT='fox_stork/assets/characters/';
F.poseNames={fox:['stand','host','lap_down','smug','look_up','muzzle_to_jar','tongue_out','ears_droop'],
 stork:['stand','polite','vertical_peck','angled_peck','deadpan','host','beak_down','content']};
F.assetPath=(who,pose)=>ROOT+who+'/'+pose+'.webp';
window.EXTRA_ASSETS=(window.EXTRA_ASSETS||[]).concat(Object.entries(F.poseNames).flatMap(([who,poses])=>poses.map(p=>F.assetPath(who,p))));
if(window.FABLE_ASSET_META && FABLE_ASSET_META.background)window.EXTRA_ASSETS.push(FABLE_ASSET_META.background);
F.imageBank=null;
F.meta=(who,pose)=>{
 const all=window.FABLE_ASSET_META;
 const m=all&&all.characters&&all.characters[who]&&all.characters[who].poses[pose];
 if(!m)throw new Error('Missing actual pose anchors: '+who+'/'+pose);
 return m;
};
F.initActors=IMG=>{
 F.imageBank=IMG;
 for(const [who,poses] of Object.entries(F.poseNames)) for(const pose of poses){
  const m=F.meta(who,pose),im=IMG[F.assetPath(who,pose)];
  if(!im || !m.anchor || !m.contact || !(m.ref_h>0))throw new Error('Invalid original PNG asset: '+who+'/'+pose);
 }
};
F.actorTransform=(who,o)=>{
 const m=F.meta(who,o.pose), k=o.h/m.ref_h;
 let x=o.x,y=o.y,dx=0,dy=0;
 const mouth=[x+(m.contact[0]-m.anchor[0])*k,y+(m.contact[1]-m.anchor[1])*k];
 // Pose-specific ref_h is a measured common design scale, NEVER tight-crop height.
 // Contact motion is small actor lean; lower legs are behind the physical table apron.
 if(o.contact){const q=o.approach??1;dx=(o.contact[0]-mouth[0])*q;dy=(o.contact[1]-mouth[1])*q-(1-q)*(o.lift||0);}
 return {x,y,k,m,dx,dy,mouth:[x+dx+(m.contact[0]-m.anchor[0])*k,y+dy+(m.contact[1]-m.anchor[1])*k]};
};
F.actorAnchor=(who,o,name)=>{
 const a=F.actorTransform(who,o), p=a.m[name]||a.m.anchor;
 if(name==='feet'||name==='anchor')return [a.x,a.y];
 if(name==='paw'||name==='wing')return [a.x+(p[0]-a.m.anchor[0])*a.k,a.y+(p[1]-a.m.anchor[1])*a.k];
 let x=a.x+a.dx+(p[0]-a.m.anchor[0])*a.k,y=a.y+a.dy+(p[1]-a.m.anchor[1])*a.k;
 if(o.upperRot){const [px,py]=a.mouth,dx=x-px,dy=y-py,r=o.upperRot;x=px+dx*Math.cos(r)-dy*Math.sin(r);y=py+dx*Math.sin(r)+dy*Math.cos(r);}
 return [x,y];
};
// Source-pixel head/neck masks. Original body, paws, tail and legs remain fixed.
// The joining bands are sampled from the SAME generated feather/fur art.
const RIGS={
 'stork/vertical_peck':{poly:[[0,0],[138,0],[138,88],[80,88],[65,222],[0,222]],band:[73,65,231,55]},
 'stork/beak_down':{poly:[[0,0],[143,0],[143,112],[88,151],[76,272],[0,272]],band:[88,79,58,98]},
 'fox/muzzle_to_jar':{poly:[[210,0],[452,0],[452,160],[337,170],[274,151],[230,111]],band:[170,110,282,54]},
 'fox/lap_down':{poly:[[258,0],[468,0],[468,227],[392,227],[360,188],[300,153],[258,139]],band:[270,96,65,65]}
};
const maskPath=(points,full)=>{const p=new Path2D();if(full)p.rect(-30,-30,900,900);points.forEach((q,i)=>i?p.lineTo(...q):p.moveTo(...q));p.closePath();return p;};
const rigParts=(who,pose,im,rig)=>{
 const key='fable_rig_soft_v3_'+who+'_'+pose;
 const head=PAINT.cached(key+'_head',im.width,im.height,g=>{
  g.drawImage(im,0,0);g.globalCompositeOperation='destination-in';g.filter='blur(2px)';g.fillStyle='#000';g.fill(maskPath(rig.poly,false));
 });
 const body=PAINT.cached(key+'_body',im.width,im.height,g=>{
  g.drawImage(im,0,0);g.globalCompositeOperation='destination-out';g.filter='blur(2px)';g.fillStyle='#000';g.fill(maskPath(rig.poly,false));
 });return {head,body};
};
F.drawActor=(c,who,o)=>{
 const a=F.actorTransform(who,o),im=F.imageBank[F.assetPath(who,o.pose)],rig=RIGS[who+'/'+o.pose];
 c.save();c.translate(a.x,a.y);c.rotate(o.rot||0);c.scale(a.k,a.k);c.translate(-a.m.anchor[0],-a.m.anchor[1]);
 if(o.upperLean&&o.contact&&rig){
  const dx=a.dx/a.k,dy=a.dy/a.k;
  // Body mask excludes only head + bill; NO translated red/black legs can leak above table.
  const parts=rigParts(who,o.pose,im,rig);c.drawImage(parts.body,0,0);
  const [bx,by,bw,bh]=rig.band;
  // Band width includes the original TRANSPARENT fur/feather contour at both sides.
  // Cropping a solid interior column produced a rectangular neck step in smoke 2.
  // Eight native drawImage strips stretch the existing neck's fiber texture. The
  // shoulder end stays exactly fixed while the head end follows its contact arc.
  for(let i=0;i<8;i++){const q0=i/8,q1=(i+1)/8,sy=by+bh*q0;
   const x=bx+dx*(1-q0),y=sy+dy*(1-q0),hh=bh/8-dy/8;
   c.drawImage(im,bx,sy,bw,bh/8,x,y,bw,hh+.7);
  }
  c.save();const tip=a.m.contact;c.translate(tip[0]+dx,tip[1]+dy);c.rotate(o.upperRot||0);c.translate(-tip[0],-tip[1]);
  c.drawImage(parts.head,0,0);c.restore();
 }else{c.drawImage(im,0,0);}
 c.restore();return a;
};
// A real pink tongue fragment from the original pose sheet, attached to the SAME
// measured lips. Only this flexible part moves; no whole-actor chase/foot slide.
F.drawTongue=(c,o)=>{if(!o.lick)return;const p=F.actorAnchor('fox',o,'mouth');
 const im=F.imageBank[F.assetPath('fox','tongue_out')];
 c.save();c.translate(...p);c.rotate(1.18);c.scale(.68,.68);
 const w=70*o.lick;c.drawImage(im,445,62,w,29,0,-9,w,29);c.restore();
};
})();
