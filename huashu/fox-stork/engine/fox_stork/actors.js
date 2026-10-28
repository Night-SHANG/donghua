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
 let x=a.x+a.dx+(p[0]-a.m.anchor[0])*a.k,y=a.y+a.dy+(p[1]-a.m.anchor[1])*a.k;
 if(o.upperRot){const [px,py]=a.mouth,dx=x-px,dy=y-py,r=o.upperRot;x=px+dx*Math.cos(r)-dy*Math.sin(r);y=py+dx*Math.sin(r)+dy*Math.cos(r);}
 return [x,y];
};
F.drawActor=(c,who,o)=>{
 const a=F.actorTransform(who,o),im=F.imageBank[F.assetPath(who,o.pose)];
 c.save();if(o.upperLean&&o.upperRot){c.translate(...a.mouth);c.rotate(o.upperRot);c.translate(-a.mouth[0],-a.mouth[1]);}c.translate(a.x+(o.upperLean?a.dx:0),a.y+(o.upperLean?a.dy:0));c.rotate(o.rot||0);c.scale(a.k,a.k);
 c.shadowColor='rgba(63,40,20,.12)';c.shadowBlur=3/a.k;c.shadowOffsetY=3/a.k;
 c.drawImage(im,-a.m.anchor[0],-a.m.anchor[1]);c.restore();
 return a;
};
// A real pink tongue fragment from the original pose sheet, attached to the SAME
// measured lips. Only this flexible part moves; no whole-actor chase/foot slide.
F.drawTongue=(c,o)=>{if(!o.lick)return;const p=F.actorAnchor('fox',o,'mouth');
 const im=F.imageBank[F.assetPath('fox','tongue_out')];
 c.save();c.translate(...p);c.rotate(1.18);c.scale(.68,.68);
 const w=70*o.lick;c.drawImage(im,445,62,w,29,0,-9,w,29);c.restore();
};
})();
