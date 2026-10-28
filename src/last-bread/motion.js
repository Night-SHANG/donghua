// Pilot-only pure-time choreography. World coordinates are pixels; no accumulated simulation.
(() => {
 const eventTimes={runStart:16,crouch:17.1,takeoff:17.42,miss:17.9,land:18.2,brakeEnd:18.75,birdBrake:19.16,birdStop:19.65,settle:20.6};
 const E=eventTimes;
 const gaitSpecs={tuantuan:{period:.44,stance:.19,lift:40,lead:28,end:E.crouch},jiujiao:{period:.32,stance:.14,lift:27,lead:16,end:E.birdBrake}};
 const steps=Object.entries(gaitSpecs).flatMap(([species,g])=>{
  const a=[];for(let n=0;16+n*g.period/2<g.end;n++)a.push({id:`${species}-step-${n}`,t:16+n*g.period/2});return a;
 });
 Bread.events=Object.freeze([...Object.entries(E).map(([id,t])=>({id,t})),...steps].sort((a,b)=>a.t-b.t).map(Object.freeze));
 Bread.groundY=x=>750+.055*x;
 const ground=Bread.groundY;
 // One production silhouette for support and rendering; string/paper corners are
 // included rather than pretending the asymmetric parcel is a radius47 circle.
 const parcelOutline=Object.freeze([[-58,8],[-48,-27],[-20,-40],[-32,-65],[-1,-57],[17,-71],[30,-42],[50,-24],[58,8],[38,36],[-27,39]].map(Object.freeze));
 Bread.parcelGeometry=b=>parcelOutline.map(([x,y])=>[b.x+x*Math.cos(b.rot)-y*Math.sin(b.rot),b.y+x*Math.sin(b.rot)+y*Math.cos(b.rot)]);

 const racX=t=>t<E.crouch?360+220*(t-16):kf(t,[[E.crouch,602],[E.takeoff,650],[E.land,880],[E.brakeEnd,935]],t<E.takeoff?ease:t<E.land?x=>x:easeOut);
 const birdX=t=>t<18.55?140+220*(t-16):kf(t,[[18.55,701],[E.birdStop,790]],easeOut);
 function gait(t,root,spec){
  const {period,stance,lift,lead}=spec;
  const feet=[],contacts=[];
  for(let i=0;i<2;i++){
   const offset=i*period/2,n=Math.floor((t-16-offset)/period),touch=16+offset+n*period,age=t-touch;
   const x=root(touch)+lead;
   if(age<stance){feet.push([x,ground(x)]);contacts.push(`step-${i}-${n}`);}
   else {const next=root(touch+period)+lead;feet.push(arcPt([x,ground(x)],[next,ground(next)],lift,(age-stance)/(period-stance)));contacts.push(null);}
  }
  return {feet,contacts};
 }
 const fixed=(x)=>[x,ground(x)];
 function raccoon(t){
  const x=racX(t),flight=seg(t,E.takeoff,E.land),air=t>=E.takeoff&&t<E.land;
  const running=t<E.crouch,runFade=1-ease(seg(t,E.crouch-.12,E.crouch));
  const bodyLift=running?(9+6*Math.cos((t-16)*TAU/.22))*runFade:air?80*4*flight*(1-flight):0;
  const p={x,y:ground(x)-bodyLift,u:38,view:'q',flip:false,
   bodyRot:kf(t,[[16,.13],[E.crouch,.15],[E.takeoff,.24],[E.miss,.29],[E.land,.1],[18.38,-.16],[E.brakeEnd,-.05],[19.4,0]]),
   squash:running?.035*Math.sin((t-16)*TAU/.22):kf(t,[[E.crouch,0],[17.3,.16],[E.takeoff,-.1],[17.8,-.04],[E.land,.03],[18.3,.17],[18.65,0],[19,0]])+.025*spring(t,E.land,5,19),
   armL:running?lerp(-.1,-.3+.55*Math.sin((t-16)*TAU/.44),runFade):kf(t,[[E.crouch,-.1],[E.takeoff,-1.05],[E.miss,-1.2],[18.06,-.7],[E.land,.4],[18.55,.15],[19.3,-.15]]),
   armR:running?lerp(-.35,-.25-.55*Math.sin((t-16)*TAU/.44),runFade):kf(t,[[E.crouch,-.35],[E.takeoff,-1.42],[E.miss,-1.6],[18.05,-.95],[E.land,.7],[18.55,.25],[19.3,-.15]]),
   lookX:kf(t,[[16,1],[19.05,1],[19.5,-.8],[20.1,.6]]),lookY:kf(t,[[16,.3],[E.takeoff,-.2],[E.land,.55],[19.5,.3]]),
   mood:t<E.miss?'determined':t<19.4?'surprised':'worried',
   tailAngle:kf(t,[[16,-.12],[E.takeoff,-.35],[E.land,-.48],[18.52,.27],[19.05,.05],[20.2,0]])+.1*spring(t,18.4,3,12),legPhase:0};
  let feet,contacts;
  if(running)({feet,contacts}=gait(t,racX,gaitSpecs.tuantuan));
  else if(t<E.takeoff){
   const prior=gait(E.crouch,racX,gaitSpecs.tuantuan),k=seg(t,E.crouch,17.3);
   feet=prior.feet.map((f,i)=>arcPt(f,fixed(i?685:602),18,ease(k)));contacts=k===1?['crouch-L','crouch-R']:[null,null];
  } else if(air){
   feet=[arcPt(fixed(602),fixed(845),100,flight),arcPt(fixed(685),fixed(980),115,flight)];contacts=[null,null];
  } else {
   // Front right foot at980 remains planted during the decelerating body's entire brake.
   const k=seg(t,18.47,18.92);feet=[arcPt(fixed(845),fixed(898),24,ease(k)),fixed(980)];contacts=[t<18.47?'land-L':t>=18.92?'settled-L':null,'brake-R'];
  }
  return {...p,footTargets:feet,contacts};
 }
 function bird(t){
  const x=birdX(t),g=gait(Math.min(t,E.birdBrake),birdX,gaitSpecs.jiujiao),k=seg(t,E.birdBrake,E.birdStop);
  const feet=t<E.birdBrake?g.feet:g.feet.map((p,i)=>arcPt(p,fixed(i?811:772),18,ease(k)));
  const moving=t<E.birdStop;
  return {x,y:ground(x)-(moving?7*Math.abs(Math.sin((t-16)*TAU/.32))*(1-ease(k)):0),u:29,view:'q',flip:false,
   bodyRot:kf(t,[[16,.16],[18.8,.2],[E.birdBrake,.13],[19.42,-.14],[E.birdStop,-.04],[20.2,0]]),
   squash:.055*spring(t,E.birdStop,5,16),wingL:moving?(.4+.55*Math.sin((t-16)*TAU/.32))*(1-ease(k)):.05*spring(t,E.birdStop),
   wingR:moving?(-.4-.55*Math.sin((t-16)*TAU/.32))*(1-ease(k)):-.05*spring(t,E.birdStop),
   hatDrop:kf(t,[[16,.08],[E.birdBrake,.15],[19.5,.48],[20.1,.13],[20.6,.06]])+.14*spring(t,E.birdStop,4,15),
   lookX:1,lookY:t<19.4?-.1:-.5,mood:t<19.7?'determined':'surprised',legPhase:0,
   footTargets:feet,contacts:t<E.birdBrake?g.contacts:k===1?['bird-stop-L','bird-stop-R']:[null,null]};
 }
 Bread.sample=t=>{
  if(!Number.isFinite(t)||t<16||t>21)throw new RangeError('pilot sample requires finite time16–21; full film deferred');
  const tuantuan=raccoon(t),jiujiao=bird(t);
  const bx=t<E.miss?700+140*(t-16):kf(t,[[E.miss,966],[18.8,1250],[21,1430]],easeOut);
  const hop=t>=E.takeoff&&t<=18.15?145*4*seg(t,E.takeoff,18.15)*(1-seg(t,E.takeoff,18.15)):kf(t,[[16,0],[18.55,0],[18.9,24],[19.25,0],[21,0]]);
  const bread={x:bx,y:0,rot:(bx-700)/53,wrapped:true};
  bread.y=Math.min(...Bread.parcelGeometry(bread).map(([x,y])=>ground(x)-y))-hop;
  const corners=Bread.characterGeometry('tuantuan',tuantuan).anchors.apron;
  return {tuantuan,jiujiao,bread,apron:{left:corners[0],right:corners[1],sag:8+3*spring(t,E.land)},camera:{cx:960,cy:540,zoom:1},set:'bakery-slope',shotId:'chase-pilot'};
 };
})();
