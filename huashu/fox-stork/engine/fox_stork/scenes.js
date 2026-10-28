// A continuous native world and one global film clock. Shot files only select camera.
(() => {
const F=FABLE;
function actorHalf(c,who,o,upper){
 c.save();c.beginPath();c.rect(-1600,upper?-1500:710,6500,upper?2210:1800);c.clip();
 // Grounded legs keep measured feet. The lean is behind an opaque tabletop.
 F.drawActor(c,who,upper?{...o,upperLean:true}:{...o,contact:null,rot:0});c.restore();
}
F.draw=(c,t)=>{
 const st=F.state(t),cam=F.camera(t);
 c.fillStyle=F.C.paper;c.fillRect(0,0,1920,1080);
 CAM.with(c,cam,g=>{
  F.drawEnvironment(g,0,t);F.drawEnvironment(g,1,t);
  const traveling=t>=28&&t<33;
  const ox=F.origin(st.home);
  // Behind-table leg contact is retained at foot anchors, upper body can lean.
  g.save();g.translate(ox,0);
  actorHalf(g,'fox',st.fox,false);actorHalf(g,'stork',st.stork,false);g.restore();
  F.drawTable(g,0);F.drawTable(g,1);
  // Preserve both dinner settings during the one geographical bridge.
  for(const home of [0,1]){
   g.save();g.translate(F.origin(home),0);
   if(home===0){
    const slide=home===st.home?st.drop:0;
    F.drawBowl(g,730,st.leftSoup,t,false,-slide*50);
    F.drawBowl(g,1190,1,t,false,0);
   }else if(t>=33){
    F.drawJar(g,770,t,false,-st.leftJarDrop*95);F.drawJar(g,1190,t,false,-st.jarDrop*95);
   }
   g.restore();
  }
  g.save();g.translate(ox,0);
  actorHalf(g,'fox',st.fox,true);actorHalf(g,'stork',st.stork,true);
  // Front ceramic shells are live redraws; actor pixels below their rims vanish.
  if(st.home===0&&!traveling){F.drawBowl(g,730,st.leftSoup,t,true,-st.drop*50);F.drawBowl(g,1190,1,t,true);}
  if(st.home===1){F.drawJar(g,770,t,true,-st.leftJarDrop*95);F.drawJar(g,1190,t,true,-st.jarDrop*95);}
  if(st.home===0){if(st.leftSoup>.02)F.steam(g,730,668,t,.24);F.steam(g,1190,667,t+.8,.24);}
  else {F.steam(g,770,405,t,.2);F.steam(g,1190,405-st.jarDrop*95,t+.8,.18);}
  F.drawTongue(g,st.fox);
  // Actual food bead appears only after the beak clears the mouth; swallow removes it.
  if((t>=41.45&&t<41.8)||(t>=62.9&&t<63.35)){const tip=F.actorAnchor('stork',st.stork,'beak_tip');if(tip[1]<431){g.fillStyle='#D7A348';g.beginPath();g.ellipse(tip[0],tip[1]-1,5,3,0,0,7);g.fill();}}
  // One tiny wet drop falls BACK to the shallow dish: tip wet, no soup consumed.
  if(t>=21.35&&t<21.8){const q=F.e(t,21.35,21.8);g.fillStyle='#C28A44';g.beginPath();g.ellipse(1196,F.mix(F.actorAnchor('stork',F.state(21.35).stork,'beak_tip')[1],697,q),2.8,5.3,0,0,7);g.fill();}
  g.restore();
  F.foreground(g,0,t);F.foreground(g,1,t);
  // A foreground oak masks the time-compressed journey between two dinners.
  // It is an independent physical plane, not a whole-picture slide/fade.
  if(t>=30&&t<=33){g.save();g.translate(2050,-40);g.drawImage(F.tree(),0,0);g.restore();}
 });
};
for(const shot of F.SHOTS)SCENES[shot.id]={init:shot.a===0?F.initActors:undefined,draw:(c,lt,t)=>F.draw(c,t)};
// Testable semantic state is exposed to browser QA; it does not replace pixel QA.
window.FABLE_DEBUG={shotAt:t=>F.at(t).id,state:t=>F.state(t),camera:t=>F.camera(t),contacts:F.contactTimes};
})();
