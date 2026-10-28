// All acting and prop states are pure functions of FILM time, including at cuts.
(() => {
const F = window.FABLE = {};
F.C = {paper:'#F2E4C9', cream:'#F9F1DD', ochre:'#C69C52', honey:'#DDAF59',
  rust:'#C76935', ink:'#49382B', green:'#72806A', sage:'#9EA58B', wood:'#A37141', darkwood:'#68492F', soup:'#C88535'};
F.SHOTS = [
  {id:'s01_serve',a:0,b:5,cam:[960,555,1.02]},
  {id:'s02_fox_lap',a:5,b:10,cam:[670,550,1.56]},
  {id:'s03_stork_peck',a:10,b:15,cam:[1190,568,1.67]},
  {id:'s04_polite_reaction',a:15,b:19,cam:[1370,404,1.83]},
  {id:'s05_angled_fail',a:19,b:24,cam:[1170,573,1.67]},
  {id:'s06_fox_finish',a:24,b:28,cam:[950,568,1.08]},
  {id:'s07_return_invite',a:28,b:33,cam:[960,555,0.98]},
  {id:'s08_jars',a:33,b:38,cam:[960,545,1.08]},
  {id:'s09_stork_drink',a:38,b:43,cam:[1210,435,1.40]},
  {id:'s10_fox_blocked',a:43,b:48,cam:[740,520,1.7]},
  {id:'s11_fox_lick',a:48,b:53,cam:[740,542,1.68]},
  {id:'s12_deadpan',a:53,b:57,cam:[1260,425,1.83]},
  {id:'s13_fox_realizes',a:57,b:61,cam:[650,488,1.83]},
  {id:'s14_final',a:61,b:65,cam:[960,555,1.02]}
];
F.at = t => F.SHOTS.find(s=>t>=s.a && t<s.b) || F.SHOTS[t<0?0:13];
F.e = (t,a,b) => MO.smooth(MO.seg(t,a,b));
F.bump = (t,a,b) => t<a||t>b?0:Math.sin(Math.PI*MO.seg(t,a,b));
F.mix = (a,b,q) => a+(b-a)*q;
F.plate = {left:730,right:1190,y:710,soupY:697,rx:154,ry:28};
F.jar = {left:770,right:1190,y:710,h:288,mouthY:422,innerRx:23,outerRx:33};
F.homeAt = t => t>=33?1:0;
F.origin = home => home*2800;
F.contactTimes = {plateSlide:2,foxLap:[6.2,6.65,7.1],storkPeck:12.1,storkAngle:21,storkDrop:21.35,foxFinish:24.8,
  jarSet:[34.2,34.55],storkEntry:39.35,storkSip:40.2,storkSwallow:41.8,foxBlock:45.1,foxLick:49.4,foxLickReturn:50.3,finalSip:62.1,tummy:63,hold:63.5};
F.camera = t => {
  const s=F.at(t), [x,y,z]=s.cam, home=F.homeAt(t);
  // Only one within-shot camera action: return invitation travels to the next garden.
  if(s.id==='s07_return_invite'){
    const q=F.e(t,30.25,32.8);
    return {x:x+2800*q,y:y,z:z};
  }
  return {x:x+F.origin(home),y:y,z:z};
};
F.state = t => {
  const home=F.homeAt(t), shot=F.at(t).id;
  const f={pose:'stand',x:492.37,y:836.8,h:650,rot:0}, s={pose:'stand',x:1370.95,y:930,h:733,rot:0};
  let leftSoup=t>=25.5?0:1,rightSoup=1,drop=0,jarDrop=0,leftJarDrop=0;
  const action=(who,pose,target,approach,lift=55)=>Object.assign(who,{pose,contact:target,approach,lift});
  if(t<5){ f.pose='host'; f.rot=-.018*F.bump(t,.2,1.2); drop=1-F.e(t,.6,2);s.pose=t<2.8?'polite':'stand'; }
  else if(t<10){
    f.pose=t<5.65?'look_up':t<8.7?'lap_down':'smug';
    if(t>=5.65&&t<8.7){const q=F.e(t,5.65,6.2)*(1-F.e(t,8.15,8.7));action(f,'lap_down',[730,697-2*Math.sin((t-6.5)*12)],q);}
    leftSoup=1-.68*F.e(t,6.5,8.6);s.pose='polite';
  } else if(t<15){
    f.pose='smug';leftSoup=.32;s.pose=t<10.5?'polite':t<13.5?'beak_down':'polite';
    if(t>=10.5&&t<13.5){const q=F.e(t,10.5,12.1)*(1-F.e(t,12.95,13.5));action(s,'beak_down',[1190,697],q);}
  } else if(t<19){f.pose='smug';s.pose=t<16?'polite':'deadpan';leftSoup=.32;}
  else if(t<24){f.pose='smug';leftSoup=.32;s.pose=t<19.5?'deadpan':t<22.6?'beak_down':'polite';
    if(t>=19.5&&t<22.6){action(s,'beak_down',[1196,697],F.e(t,19.5,21)*(1-F.e(t,21.05,21.35)));s.upperRot=-.10*F.bump(t,20,22.2);}}
  else if(t<28){
    f.pose=t<25.7?'lap_down':'smug';leftSoup=.32*(1-F.e(t,24.2,25.5));s.pose=t<26.3?'deadpan':'host';
    if(t<25.7)action(f,'lap_down',[730,697-2*Math.sin(t*12)],1-F.e(t,25.15,25.7));
  } else if(t<33){leftSoup=0;f.pose=t<29.8?'look_up':'stand';s.pose=t<30.1?'host':'stand';
    // Exit is a deliberately brief pose-to-pose cut-paper step, not an endless idle drift.
    const q=F.e(t,30.3,32.7); f.x+=q*2800;s.x+=q*2800;f.y+=93.2*F.e(t,29.8,30.3);
    // Grounded travel: no vertical bob is added to planted feet.
    f.travel=q;s.travel=q;
  } else if(t<38){f.pose='look_up';s.pose='host';leftJarDrop=1-F.e(t,33.4,34.2);jarDrop=1-F.e(t,33.7,34.55);}
  else if(t<43){f.pose='look_up';s.pose=t<38.5?'content':t<41.8?'vertical_peck':'content';
    if(t>=38.5&&t<41.8){let tipY=t<39.35?F.mix(350,422,F.e(t,38.5,39.35)):F.mix(422,590,F.e(t,39.35,40.2));tipY=F.mix(tipY,350,F.e(t,40.95,41.65));action(s,'vertical_peck',[1188,tipY],1,0);}
  } else if(t<48){s.pose='content';f.pose=t<43.55?'look_up':t<46.5?'muzzle_to_jar':'look_up';
    if(t>=43.55&&t<46.5)action(f,'muzzle_to_jar',[737,418],F.e(t,43.55,45.1)*(1-F.e(t,46,46.5)));
  } else if(t<53){s.pose='content';f.pose=t<48.5?'look_up':t<50.6?'muzzle_to_jar':'ears_droop';
    if(t>=48.5&&t<50.6){action(f,'muzzle_to_jar',[737,418],F.e(t,48.5,49.05),0);f.lick=F.e(t,49.05,49.4)*(1-F.e(t,49.8,50.3));}
  } else if(t<57){s.pose=t<54?'content':'deadpan';f.pose='ears_droop';}
  else if(t<61){s.pose='deadpan';f.pose=t<58.3?'look_up':'ears_droop';f.rot=.025*F.bump(t,58.6,59.6);}
  else {f.pose='ears_droop';s.pose=t<61.5?'content':t<63.5?'vertical_peck':'content';
    if(t>=61.5&&t<63.5){let tipY=t<61.8?F.mix(350,422,F.e(t,61.5,61.8)):F.mix(422,590,F.e(t,61.8,62.1));tipY=F.mix(tipY,350,F.e(t,62.6,63.35));action(s,'vertical_peck',[1188,tipY],1,0);}
    f.rot=.015*F.bump(t,62.1,63.1);
  }
  return {t,shot,home,fox:f,stork:s,leftSoup,rightSoup,drop,jarDrop,leftJarDrop};
};
})();
