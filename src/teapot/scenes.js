/* Bubble Too Big — 14 seconds, three camera phrases. All poses are evaluated from t. */
(() => {
  const K=TEAPOT.C;
  const FACE=[[0,'hopeful'],[1.2,'proud'],[1.95,'determined'],[3.75,'surprised'],[4.6,'excited'],[5.35,'nervous',{lookX:0,lookY:1}],[6.7,'surprised'],[7.8,'dizzy'],[8.55,'shy'],[9.45,'suspicious'],[10.1,'surprised'],[10.8,'relieved'],[11.85,'hopeful',{lookY:-1}],[12.35,'happy']];
  function pose(t) {
    const e=emotions(t,FACE,{take:.3});
    const lift=ease(seg(t,3.65,5.15)), fall=seg(t,6.82,7.65);
    const h=t<6.82?230*lift:230*(1-fall*fall);
    let rot=t<3.65?-.09*Math.sin(Math.PI*seg(t,1.95,2.6))+.055*ease(seg(t,2.6,3.4)):-.11*lift;
    if(t>=6.82)rot=lerp(-.11,0,ease(fall));
    const landing=t>=7.65?.065*Math.exp(-(t-7.65)*9)*Math.sin((t-7.65)*26):0;
    const hiccup=t>=10.1&&t<10.45?Math.sin(seg(t,10.1,10.45)*Math.PI):0;
    // Lid lags continuously during the fall, then catches up at the ceramic cue.
    const lidFall=t<7.65?ease(seg(t,6.85,7.65)):(t<8.05?1-seg(t,7.65,8.05)**2:0);
    const lidRattle=t>=8.05?.07*Math.exp(-(t-8.05)*9)*Math.sin((t-8.05)*40):0;
    const paddle=Math.sin(seg(t,5.85,6.45)*Math.PI)*.7;
    return {x:800+55*lift,y:825-Math.max(0,h)-8*hiccup,u:29,rot:rot+lidRattle*.2,sq:landing,
      lidLift:Math.sin(Math.PI*seg(t,1.95,2.6))*.35+lidFall*1.45+hiccup*.3,
      lidRot:lidRattle,hang:h>10?1:0,footL:paddle,footR:-.55*paddle,
      eyes:e.eyes,mouth:t>=2.6&&t<3.65?'o':e.mouth,squint:e.squint,lookX:e.lookX||0,lookY:e.lookY||0,blush:e.blush};
  }
  function camera(t) {
    const reveal=ease(seg(t,.35,1.3));
    let c={x:lerp(1100,950,reveal),y:lerp(510,620,reveal),z:lerp(1.75,1.18,reveal)};
    if(t>=3.65){const q=ease(seg(t,3.65,5.2));c={x:950,y:lerp(620,440,q),z:lerp(1.18,1.04,q)};}
    if(t>=6.82){const q=ease(seg(t,6.82,7.8));c={x:950,y:lerp(440,620,q),z:1.04};}
    if(t>=9.1){const q=ease(seg(t,9.1,10));c={x:lerp(950,880,q),y:lerp(620,620,q),z:lerp(1.04,1.65,q)};}
    return c;
  }
  function garden(c) {
    // Far washes move at 35% of the foreground camera displacement.
    camBegin(960+(c.x-960)*.35,540+(c.y-540)*.35,1+(c.z-1)*.35);
    boilSeed('wall');paint(rectPts(-1200,-1000,4400,2400),{wash:'#EEE7D8',fill:K.wall,fillOp:45,bleed:.15,ink:null});
    // A large quiet window gives the scene a place, while the hero keeps the strongest ink.
    boilSeed('window-light');paint([[-200,-450],[1800,-450],[1800,650],[-200,650]],
      {wash:'#DCE4DE',fill:'#A9C7CD',fillOp:80,bleed:.18,tex:.7,ink:null});
    boilSeed('distant-garden');paint([[-300,500],[150,350],[600,430],[1050,330],[1500,430],[1950,300],[1950,650],[-300,650]],
      {fill:'#A8B9A0',fillOp:82,bleed:.3,ink:null,curv:.3});
    for(const x of [210,1740]) {boilSeed('window-post'+x);paint(rectPts(x,-450,35,1120),
      {wash:'#DDD0B3',fill:'#BCA98D',fillOp:65,ink:null});}
    boilSeed('window-sill');paint(rectPts(-250,650,2140,38),
      {wash:'#D8C4A6',fill:'#BDA78A',fillOp:65,ink:null});
    inkLine([[-250,650],[1890,650]],.65,'#ADAA92','charcoal',0);
    camEnd();
    camBegin(c.x,c.y,c.z);
    // The hero stands on a warm tea table, not an empty strip of ground.
    boilSeed('tabletop');paint([[-1600,760],[3200,760],[3200,1035],[-1600,1035]],
      {wash:'#D7B38F',fill:'#C39977',fillOp:65,bleed:.13,tex:.7,ink:null});
    boilSeed('table-edge');paint(rectPts(-1600,1035,4800,85),
      {wash:'#B88D6D',fill:'#A4775D',fillOp:65,ink:null});
    inkLine([[-1600,1035],[3200,1035]],.7,'#967A64','charcoal',0);
    boilSeed('under-table');paint(rectPts(-1600,1120,4800,1000),{wash:'#C6C1AB',ink:null});
    for(let i=0;i<3;i++){boilSeed('woodgrain'+i);const y=895+i*42;inkLine([[-450,y],[120,y+3],[460,y-2]],.45,'#B29274','charcoal',.3);}
    // Upright background plant: symmetric pot, a single vertical stem and four attached leaves.
    boilSeed('pot');paint([[80,648],[220,648],[202,766],[98,766]],
      {wash:'#BEA38D',fill:'#A68E79',fillOp:48,ink:'#998873',sw:.6,curv:0});
    boilSeed('pot-soil');paint(ellPts(150,650,59,5,18,0),
      {wash:'#A2957D',fill:'#8F8D76',fillOp:40,ink:null});
    boilSeed('plant-stem');inkLine([[150,650],[150,492]],.85,'#899984','ink',0);
    for(const [i,y,side] of [[0,612,-1],[1,580,1],[2,548,-1],[3,518,1]]) {
      boilSeed('plant-leaf'+i);
      // Each pointed leaf begins and ends on its stem node; no floating ellipse or diagonal stalk.
      paint([[150,y],[150+side*15,y-18],[150+side*43,y-24],
        [150+side*33,y-5],[150+side*13,y+2]],
        {wash:i%2?'#B1BCA2':'#A4B49E',fill:'#91A58F',fillOp:48,bleed:.1,ink:null,curv:.35});
    }
    camEnd();
  }
  function world(t) {
    const p=pose(t),c=camera(t);garden(c);camBegin(c.x,c.y,c.z);
    boilSeed('shadow');const high=clamp((825-p.y)/230);paint(ellPts(820,831,lerp(150,75,high),lerp(19,11,high),28,2),{fill:'#77695D',fillOp:lerp(115,48,high),bleed:.4,ink:null});
    TEAPOT.draw(p.x,p.y,p.u,p);
    const tip=TEAPOT.tip(p);
    if(t<.82){const q=seg(t,.45,.82);TEAPOT.bubble(tip[0]+30+q*36,tip[1]-28-q*45,26,t,'first');}
    TEAPOT.burst(TEAPOT.tip(pose(.82))[0]+66,TEAPOT.tip(pose(.82))[1]-73,26,t,.82,'firstpop');
    if(t>=2.6&&t<6.7){const r=lerp(8,165,ease(seg(t,2.6,4.8)));TEAPOT.bubble(tip[0]+r*.66,tip[1]-r*.75,r,t,'big');}
    const popTip=TEAPOT.tip(pose(6.7));TEAPOT.burst(popTip[0]+165*.66,popTip[1]-165*.75,165,t,6.7);
    if(t>=7.65&&t<7.95){const q=seg(t,7.65,7.95);for(const s of [-1,1]){boilSeed('dust'+s);inkLine([[p.x+s*(100+q*40),823],[p.x+s*(145+q*60),817-q*8]],1-q,'#B78F78','charcoal',.4);}}
    if(t>=10.1){
      const q=ease(seg(t,10.1,11.8)), start=TEAPOT.tip(pose(10.1));
      const bx=lerp(start[0]+23,855,q),by=lerp(start[1]-22,825-29*12.9,q)-55*Math.sin(q*Math.PI);
      TEAPOT.bubble(bx,by+2*Math.sin(t*3)-10,34,t,'crown');
      if(t>11.85&&t<12.5){const k=Math.sin(seg(t,11.85,12.5)*Math.PI);boilSeed('delight');for(const s of [-1,1])inkLine([[bx+s*45,by-14],[bx+s*(45+15*k),by-18]],.9*k,PAL.cream,'ink',0);}
    }
    camEnd();
    if(t<.45){const xy=toScreen(TEAPOT.tip(p)[0]+30,TEAPOT.tip(p)[1]-28,{cx:c.x,cy:c.y,zoom:c.z,rot:0});boilSeed('opening');iris(xy[0],xy[1],lerp(12,2300,ease(seg(t,0,.45))),PAL.paper);}
    if(t>13.15){const centreX=960+(855-c.x)*c.z,centreY=540+(580-c.y)*c.z;boilSeed('closing');iris(centreX,centreY,lerp(1900,0,ease(seg(t,13.15,14))),PAL.paper);}
  }
  // A→B matches on the tug. B→C is one continuous push, not an arbitrary dissolve.
  shots([[0,world],[4,world],[9.4,world]]);
  LOOPS.teapot_model=t=>{
    boilSeed('sheet');paint(rectPts(-60,-60,2040,1200),{wash:PAL.paper,ink:null});
    const views=['front','threequarter','profile'];
    views.forEach((view,i)=>TEAPOT.draw(355+i*590,470,24,{...feel('hopeful',t),view,id:'model'+i}));
    ['proud','determined','nervous','dizzy','happy'].forEach((name,i)=>TEAPOT.draw(220+i*370,960,17,{...feel(name,t),id:'emotion'+i}));
  };LOOPS.teapot_model.len=2;
  Object.assign(TEAPOT,{pose,camera,faceKeys:FACE,cues:{firstPop:.82,blow:2.6,lift:3.65,bigPop:6.7,land:7.65,lid:8.05,hiccup:10.1,crown:11.8},render:world});
})();
