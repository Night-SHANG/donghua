/* 这屋我说了算 · 01 安静一点. Original 32-second hand-painted silent comedy.
 * Every prop and pose is a pure function of t. Five camera phrases, one side of the axis. */
(() => {
 const C={ink:'#62594E',wall:'#E8DFCB',blue:'#BDCED0',wood:'#AC886B',floor:'#D6BA96',seat:'#9DADA0',seatDark:'#788D82',paper:'#EEE8D6',ball:'#C9A35F'};
 const E=(t,a,b)=>ease(seg(t,a,b));
 const mix=(a,b,q)=>a.map((v,i)=>lerp(v,b[i],q));
 const eventPulse=(t,at,len)=>t<at||t>at+len?0:Math.sin(Math.PI*seg(t,at,at+len));
 function camera(t){
   let keys=[[0,[920,675,1.5]],[4.7,[920,675,1.55]],[5.15,[735,675,2.2]],
    [8.45,[735,675,2.2]],[9.0,[1160,710,2.45]],[9.85,[1160,710,2.45]],
    [10.2,[1050,620,1.85]],[12.8,[1050,620,1.85]],[13.55,[1050,500,1.85]],
    [14.55,[1050,650,1.85]],[15.6,[1000,600,1.5]],[16.15,[1000,530,1.35]],
    [17.4,[1000,530,1.35]],[18.25,[1000,675,1.65]],[23.8,[900,675,1.65]],
    [24.25,[880,660,2.15]],[31.3,[880,660,2.15]]];
   let i=0;while(i+1<keys.length&&t>=keys[i+1][0])i++;
   if(i===keys.length-1)return keys[i][1];
   // Moves after a readable shot hold, with short motivated joins at shot boundaries.
   const next=keys[i+1],start=Math.max(keys[i][0],next[0]-(next[0]-keys[i][0]>.7?.45:next[0]-keys[i][0]));
   return mix(keys[i][1],next[1],E(t,start,next[0]));
 }
 function air(t,a,b,h){const q=seg(t,a,b);return t>=a&&t<b?h*Math.sin(q*Math.PI):0;}
 function state(t){
   const k={x:560,y:830,u:3.5,time:t,view:'quarter',pose:'neutral',deform:{emotion:'neutral',sx:1,sy:1,lean:0,armL:[-38,-10],armR:[38,-10]},faceOverrides:{lookX:0,lookY:.35},bowRot:0};
   const l={x:1210,y:880,u:3.5,time:t,pose:'neutral',deform:{emotion:'happy',sx:1,sy:1,lean:0,armL:[-36,-34],armR:[36,-34]},faceOverrides:{}};
   const chairX=lerp(1030,1210,E(t,16.45,17.3));
   // Newspaper interruptions: eye reaction leads the body and hand by several frames.
   if(t>=2.0&&t<2.5){k.faceOverrides={lookX:E(t,2.0,2.05)*.7,lookY:.1};k.deform.emotion='suspicious';}
   if(t>=3.0&&t<4.15){k.faceOverrides={lookX:.8};k.deform.emotion='suspicious';}
   if(t>=4.15&&t<6){k.faceOverrides={lookX:.9,lookY:0};k.deform.emotion='determined';k.deform.armR=mix([36,-34],[75,-56],E(t,4.5,5.35));}
   if(t>=5.5&&t<6.65){const q=E(t,5.65,6.4);k.deform.armR=mix([75,-56],[74,-20],q);k.deform.emotion='smug';}
   if(t>=6.65&&t<7.4){k.deform.armR=[74,-20];k.deform.emotion='proud';}
   if(t>=7.4&&t<8.15){k.deform.armR=mix([12,-40],[36,-34],E(t,7.75,8.15));k.deform.emotion='proud';}
   if(t>=8.6&&t<10){l.deform.emotion=t<9.1?'confused':'hopeful';l.deform.armL=[-8,-34];l.deform.armR=[9,-34];const press=eventPulse(t,9.05,.55);l.deform.sx=1+.1*press;l.deform.sy=1-.12*press;l.faceOverrides={lookY:t<9.5?.9:-.4};}
   const prep=eventPulse(t,10,1.2);if(t>=10&&t<11.2){l.pose='anticipate';l.deform={...l.deform,sx:1+.3*prep,sy:1-.27*prep,emotion:'determined',armL:[-42,-28],armR:[42,-28]};}
   const jumps=[[11.2,12.2,180],[12.95,14.4,325],[15.65,18,400]];
   for(const [a,b,h] of jumps)if(t>=a&&t<b){l.y=(a===15.65?lerp(880,790,seg(t,a,b)):880)-air(t,a,b,h);l.deform.emotion='excited';l.deform.sx=.91;l.deform.sy=1.12;l.deform.armL=[-43,-52];l.deform.armR=[43,-52];}
   for(const at of [12.2,14.4]){const q=eventPulse(t,at,.35);if(q){l.deform.sx=1+.35*q;l.deform.sy=1-.28*q;l.deform.emotion='proud';}}
   if(t>=12.65&&t<12.95){l.deform.emotion='smug';l.faceOverrides={lookX:-1};}
   if(t>=14.65&&t<15.65){l.deform.emotion='proud';const q=eventPulse(t,15.05,.6);l.deform.sx=1+.24*q;l.deform.sy=1-.23*q;}
   if(t>=11.7&&t<14.7){k.deform.emotion='suspicious';k.faceOverrides={lookX:1,lookY:t<14?-.6:.3};}
   if(t>=14.7&&t<16){k.deform.emotion='thinking';k.faceOverrides={lookX:1,lookY:-.3};}
   // He has already risen and approached before the wide shot; only half a chair-width is pushed.
   if(t>=15&&t<16.45){k.x=lerp(560,850,E(t,15,16.15));k.y=lerp(830,880,E(t,15,15.4));k.deform.emotion='thinking';k.faceOverrides={lookX:1};k.deform.armR=[35,-45];}
   if(t>=16.45&&t<17.35){k.x=lerp(850,1030,E(t,16.45,17.3));k.y=880;k.pose='push';k.deform={emotion:'determined',sx:1.03,sy:.96,lean:.08,armL:[20,-42],armR:[35,-44]};}
   if(t>=17.35&&t<21.8){k.x=lerp(1030,860,E(t,17.35,17.75));k.y=880;k.deform.emotion=t<20.3?'hopeful':'proud';k.faceOverrides={lookX:1};}
   if(t>=18){
     l.y=lerp(790,810,E(t,18,18.4))-10*eventPulse(t,18.4,.35);
     l.deform={emotion:t<18.6?'surprised':t<19.3?'suspicious':t<20.4?'relieved':'sleepy',sx:1.08,sy:.86,lean:lerp(0,-.2,E(t,19.3,20.8)),armL:[-34,-24],armR:[34,-24]};
     const tryBounce=eventPulse(t,18.65,.55);l.deform.sx+=.12*tryBounce;l.deform.sy-=.12*tryBounce;l.y+=12*tryBounce;
     if(t>=20.4&&t<21.25){l.faceOverrides={mouth:'yawn',eyes:'sleepy'};l.deform.armL=[-5,-64];}
     if(t>=21.25)l.faceOverrides={eyes:'closed',mouth:'o',lookX:-1};
     const inhale=.05*E(t,25.8,27.15)*(1-E(t,27.5,27.7));l.deform.sx+=inhale;l.deform.sy+=inhale;
   }
   if(t>=21.8&&t<23){k.x=lerp(860,560,E(t,21.8,22.7));k.y=lerp(880,830,E(t,22.55,23));k.deform.emotion='relieved';k.faceOverrides={lookX:0,lookY:.4};}
   if(t>=23&&t<25){k.deform.emotion='proud';k.faceOverrides={eyes:'closed',mouth:'smile'};}
   if(t>=25&&t<27.5){k.deform.emotion='nervous';k.faceOverrides={eyes:'normal',mouth:'smile',lookX:.8};}
   const paperUp=E(t,27.5,27.8);if(t>=27.5){k.deform.emotion='surprised';k.deform.armL=mix([-38,-10],[-38,-45],paperUp);k.deform.armR=mix([38,-10],[38,-45],paperUp);k.bowRot=.22*(1-E(t,30,30.7));}
   if(t>=27.8){const release=E(t,27.8,28.15);k.deform.armL=mix([-38,-45],[-37,-28],release);k.deform.armR=mix([38,-45],[37,-28],release);}
   if(t>=30&&t<30.8)k.deform.armR=mix([37,-28],[8,-40],Math.sin(seg(t,30,30.8)*Math.PI));
   if(t>=30.85&&t<31.25)k.deform.armL=mix([-37,-28],[-8,-65],Math.sin(seg(t,30.85,31.25)*Math.PI));
   if(t>=27.68)k.hideFace=true;
   if(t>=27.8&&t<28.3)k.deform.lean=-.065*eventPulse(t,27.8,.5);
   return {k,l,chairX,paperUp};
 }
 function room(cam){
   camBegin(960+(cam[0]-960)*.35,540+(cam[1]-540)*.35,1+(cam[2]-1)*.35);
   boilSeed('room');paint(rectPts(-1000,-1000,4000,2400),{wash:C.wall,fill:'#D7CEBA',fillOp:38,ink:null});
   boilSeed('window');paint(rectPts(980,100,620,460),{wash:C.blue,fill:'#A5BCBF',fillOp:55,ink:null});
   boilSeed('window-frame');for(const [x,y,w,h] of [[965,85,650,20],[965,85,20,495],[1595,85,20,495],[1270,95,20,460],[960,560,665,25]])paint(rectPts(x,y,w,h),{wash:'#C8B99F',fill:'#B4A48C',fillOp:45,ink:null});
   boilSeed('wall-base');paint(rectPts(-1000,765,4000,25),{wash:'#BCB49E',ink:null});camEnd();
   camBegin(...cam);boilSeed('floor');paint(rectPts(-1500,790,5000,1500),{wash:C.floor,fill:'#BAA080',fillOp:38,ink:null});
   for(let i=0;i<3;i++){boilSeed('floorgrain'+i);inkLine([[-100,930+i*90],[2000,930+i*90]],.45,'#B89F81','charcoal',0);}camEnd();
 }
 function shadow(x,y,rx,op,id){boilSeed(id);paint(ellPts(x,y,rx,13,24,1),{fill:'#8B806C',fillOp:op,bleed:.3,ink:null});}
 function woodenChair(){boilSeed('woodchair');for(const x of [475,615])paint(rectPts(x,710,24,170),{wash:C.wood,fill:'#8D725B',fillOp:55,ink:C.ink,sw:.6});paint(rectPts(465,505,190,40),{wash:C.wood,ink:C.ink,sw:.7});for(const x of [470,630])paint(rectPts(x,530,20,230),{wash:C.wood,ink:C.ink,sw:.7});paint(rectPts(455,755,210,30),{wash:'#BD9B78',ink:C.ink,sw:.75});}
 function sofa(x,t,front=false){
   const sink=18*E(t,18,18.4)+7*eventPulse(t,18.65,.55);boilSeed(front?'sofafront':'sofaback');
   if(!front){for(const dx of [-110,110])paint(ellPts(x+dx,880,15,15,16),{wash:'#7A786C',ink:C.ink,sw:.7});paint(rrPts(x-155,520,310,325,48),{wash:C.seat,fill:C.seatDark,fillOp:58,ink:C.ink,sw:.8});paint(rrPts(x-133,550,265,175,45),{wash:'#B3BDAA',fill:C.seat,fillOp:45,ink:null});}
   else{paint(rrPts(x-160,750+sink,320,85-sink*.2,28),{wash:'#B4BFAE',fill:C.seatDark,fillOp:60,ink:C.ink,sw:.8});for(const dx of [-163,118])paint(rrPts(x+dx,697,48,150,20),{wash:C.seat,fill:C.seatDark,fillOp:65,ink:C.ink,sw:.8});}
 }
 function box(t){const x=805-38*E(t,6.9,7.35),y=850;boilSeed('box');paint([[x-68,y-83],[x+68,y-83],[x+60,y],[x-60,y]],{wash:'#B9A88C',fill:'#958C77',fillOp:50,ink:C.ink,sw:.75});paint(ellPts(x,y-82,67,11,24),{wash:'#847E6C',ink:C.ink,sw:.65});const close=E(t,6.4,6.8);push();translate(x-68,y-84);rotate(lerp(-1.25,0,close));paint(rectPts(0,-12,136,14),{wash:'#C4B596',ink:C.ink,sw:.7});pop();}
 function ball(t){
   let x=1325,y=750,show=t<6.45;
   if(t>=1.5&&t<2.65){const q=seg(t,1.5,2.0),r=seg(t,2.0,2.65);y=t<2.0?lerp(750,850,q*q):lerp(850,750,r)-90*Math.sin(r*Math.PI);}
   else if(t>=2.65&&t<4.2){y=t<3.0?lerp(750,850,seg(t,2.65,3.0)**2):lerp(850,750,seg(t,3.0,4.2))-180*Math.sin(seg(t,3.0,4.2)*Math.PI);}
   else if(t>=4.2&&t<5.5){const q=E(t,4.2,5.5);x=lerp(1325,800,q);y=lerp(750,651,q)-130*Math.sin(q*Math.PI);}
   else if(t>=5.5){const q=E(t,5.65,6.4);x=800;y=lerp(651,800,q);}
   if(show){boilSeed('ball');paint(ellPts(x,y,27,27,22,1),{wash:C.ball,fill:'#B28B4C',fillOp:60,ink:C.ink,sw:.85});inkLine([[x-17,y-15],[x,y-7],[x+20,y-14]],.55,'#8B744C','ink',.4);}
 }
 function paper(t,s){
   if(t>=14.7&&t<22.65){
     const q=E(t,14.7,15);boilSeed('newspaper-set-aside');
     const y=lerp(716,740,q),h=lerp(154,30,q);
     paint(rectPts(444,y-h/2,232,h),{wash:C.paper,fill:'#CFC8B1',fillOp:35,ink:C.ink,sw:.65});
     inkLine([[458,y],[650,y]],.7,'#9A9B8E','charcoal',0);return;
   }
   const k=s.k,wrap=E(t,27.65,27.8),billow=E(t,27.5,27.65)*(1-wrap);
   const shake=eventPulse(t,2,.3)*3+eventPulse(t,3,.3)*5+eventPulse(t,12.2,.35)*8+eventPulse(t,14.4,.4)*13+eventPulse(t,24.85,.35)*7;
   const x=k.x+8*wrap,y=lerp(k.y-114,k.y-230,wrap)+Math.sin(t*37)*shake;
   boilSeed('newspaper');
   // The centre balloons upward before either held lower corner moves. At impact the broad
   // sheet collapses around the head into a jagged, curved shell — not a raised rectangle.
   const flat=[[-116,-77],[0,-85-82*billow],[116,-77],[116,0],[116,77],[0,70],[-116,77],[-116,0]];
   const stuck=[[-76,-53],[-14,-70],[69,-51],[81,8],[62,64],[-4,74],[-71,53],[-82,-4]];
   const outline=flat.map((p,i)=>mix(p,stuck[i],wrap).map((v,j)=>v+(j?y:x)));
   paint(outline,{wash:C.paper,washOp:255,bleed:.08,ink:C.ink,sw:.8,curv:wrap*.2});
   if(wrap>.01){
     // Folded corners plus broken print strokes reveal contact with a rounded face underneath.
     for(const pts of [ [[-76,-53],[-51,-30],[-72,-12]], [[69,-51],[43,-22],[79,8]], [[62,64],[36,37],[14,69]], [[-71,53],[-43,28],[-10,72]] ])
       inkLine(pts.map(([a,b])=>[x+a,y+b]),.7*wrap,'#AAA38D','inkfine',.25);
     inkLine([[x-10,y-58],[x-20,y-20],[x+4,y+10],[x-5,y+58]],.65*wrap,'#B4AD98','inkfine',.35);
   }
   if(wrap<.98){inkLine([[x,y-85-82*billow],[x,y+70]],.6,'#A9A38F','inkfine',.2);}
   // Print bends and compresses with the wrapping sheet; it never remains a rigid grid.
   for(const side of [-1,1])for(let row=0;row<6;row++){
     const yy=y-55+row*19,xx=x+side*12,end=x+side*lerp(91,52,wrap);
     inkLine([[xx,yy],[lerp(xx,end,.5),yy-8*wrap*Math.sin(row)],[end,yy+side*3+wrap*(row-2)*2]],row===0?.95:.45,'#9A9B8E','charcoal',.35);
   }

 }
 function breath(t,s){
   for(const [a,len,strength] of [[24.75,.65,.35],[27.5,.75,1]]){
     const q=seg(t,a,a+len);if(t<a||q>=1)continue;boilSeed('breath'+a);
     const travel=E(t,a,a+.3),x=s.l.x-48-480*travel,y=lerp(s.l.y-115,705,travel);for(let i=0;i<3;i++)inkLine([[x+60,y+i*20],[x,y-8+i*20],[x-65,y+i*18]],.8*strength*(1-q),'#D5D5C1','inkfine',.5);
   }
 }
 function render(t){
   const s=state(t),cam=camera(t);room(cam);camBegin(...cam);
   shadow(560,880,130,65,'kshadow');shadow(s.chairX,889,180,58,'chairshadow');shadow(s.l.x,885,95-(880-s.l.y)*.05,40,'lshadow');
   woodenChair();sofa(s.chairX,t,false);if(t<18)sofa(s.chairX,t,true);box(t);
   CAST.draw('kokou',s.k.x,s.k.y,s.k.u,s.k);
   if(t>=20.8){
     // The sleeping three-quarter face points toward the reader; mirror locally, not the scene.
     push();translate(s.l.x,s.l.y);scale(-1,1);
     CAST.draw('liuliu',0,0,s.l.u,{...s.l,view:'quarter',deform:{...s.l.deform,lean:-s.l.deform.lean}});pop();
   }else CAST.draw('liuliu',s.l.x,s.l.y,s.l.u,s.l);
   if(t>=18)sofa(s.chairX,t,true);ball(t);paper(t,s);breath(t,s);
   camEnd();
   if(t<.4){boilSeed('open');iris(600,580,lerp(15,2200,E(t,0,.4)),PAL.paper);}
   if(t>31.3){boilSeed('close');iris(960+(s.k.x-cam[0])*cam[2],540+(650-cam[1])*cam[2],lerp(1800,0,E(t,31.3,32)),PAL.paper);}
 }
 LOOPS.episode01=render;LOOPS.episode01.len=32;
 window.EPISODE01={state,camera,render,cues:{paperStraighten:.65,ball1:2.0,ball2:3.0,catch:5.5,box:6.8,tie:7.55,belly:9.35,jump1:11.2,land1:12.2,jump2:12.95,land2:14.4,chairRoll:16.45,cushion:18,yawn:20.4,sleep:21.25,smallSnore:24.85,inhale:25.8,bigSnore:27.5,paperFace:27.8,tieFix:30.3}};
})();
