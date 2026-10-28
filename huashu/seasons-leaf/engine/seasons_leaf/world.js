(() => {
const F=window.SEASONS_LEAF={}, W=1920,H=1080,TAU=Math.PI*2,P=PAINT;
const pal=[
 {sky:['#d9e9df','#fbefd9'],hill:'#96b5a1',far:'#9fae8c',trunk:'#685a51',leaf:['#81a674','#b2c58b','#e7b8bd','#f5d9d3'],land:'#79976b',water:'#84b6b5'},
 {sky:['#8fbfbf','#e3ecd1'],hill:'#638f83',far:'#537e6c',trunk:'#435e4d',leaf:['#2e6e55','#4d8e58','#8cad59','#bdc974'],land:'#426d53',water:'#559c9c'},
 {sky:['#e9b992','#f5ddaa'],hill:'#ad8d77',far:'#b78a56',trunk:'#624a3b',leaf:['#b75c39','#d5853c','#e1b55e','#964936'],land:'#9a724a',water:'#9ba69a'},
 {sky:['#a8becb','#e5e8e4'],hill:'#98acbc',far:'#8b9fa9',trunk:'#657b82',leaf:['#d4e0df','#eff1e8','#b7ced0','#829fa8'],land:'#dbe4df',water:'#a2c4c8'}];
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x))};
F.state=t=>{const x=700+240*t+65*Math.sin(t*1.13),y=485+100*Math.sin(t*.87)+32*Math.sin(t*1.91);
 const sx=940+150*Math.sin(t*.64),sy=485+75*Math.sin(t*.87+.25);
 const pull=smooth((t-11)/4),z=(1.13+.13*Math.sin(t*.37))*(1-.38*pull);
 const angle=.22+.53*Math.sin(t*1.23)+.16*Math.sin(t*2.11),yaw=.65*Math.sin(t*1.7)+.38*Math.sin(t*.71);
 const camera=CAM.anchor(x,y,z,sx,sy);camera.r=.035*Math.sin(t*.56);
 return {x,y,angle,yaw,size:1, camera,screen:CAM.toScreen(camera,x,y),phase:t/3.75};};
const ellipse=(c,x,y,rx,ry,col,a=0)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fill()};
function tree(c,x,y,s,season,seed){const r=U.rng(seed),p=pal[season];c.save();c.translate(x,y);c.scale(s,s);
 c.strokeStyle=p.trunk;c.lineCap='round';c.lineWidth=22;c.beginPath();c.moveTo(0,250);c.bezierCurveTo(-22,60,30,-90,0,-290);c.stroke();
 for(let k=0;k<7;k++){let by=80-k*45,side=k%2?1:-1,bx=side*(65+r()*90);c.lineWidth=12-k;c.beginPath();c.moveTo(0,by+30);c.quadraticCurveTo(bx*.5,by-35,bx,by-70);c.stroke();
 if(season!==3){for(let j=0;j<22;j++){const a=r()*TAU,rr=Math.sqrt(r())*85;ellipse(c,bx+Math.cos(a)*rr,by-70+Math.sin(a)*rr*.65,15+r()*25,10+r()*18,p.leaf[(r()*4)|0],r());}}
 else {c.strokeStyle='#edf3ed';c.lineWidth=8;c.beginPath();c.moveTo(0,by+18);c.quadraticCurveTo(bx*.5,by-44,bx,by-78);c.stroke();c.strokeStyle=p.trunk;}}
 if(season!==3)for(let j=0;j<45;j++){let a=r()*TAU,rr=Math.sqrt(r())*115;ellipse(c,Math.cos(a)*rr,-260+Math.sin(a)*rr*.65,18+r()*28,12+r()*20,p.leaf[(r()*4)|0],r());}
 c.restore();}
function layer(season,depth){return P.cached('leaf_season_wrap_v2_'+season+'_'+depth,3200,1080,c=>{const p=pal[season],r=U.rng(702+season*71+depth*101);
 if(depth===0){const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,p.sky[0]);g.addColorStop(1,p.sky[1]);c.fillStyle=g;c.fillRect(0,0,3200,H);
 for(let k=0;k<3;k++){c.fillStyle=[p.hill,p.far,p.land][k];c.globalAlpha=.25+k*.1;c.beginPath();c.moveTo(0,H);for(let x=0;x<=3200;x+=25)c.lineTo(x,510+k*100+70*Math.sin(x*.003+k)+45*P.fbm(x*.002,k+2));c.lineTo(3200,H);c.closePath();c.fill();}c.globalAlpha=1;
 // airy watercolor sky granulation, stationary with the scene
 for(let j=0;j<1500;j++){c.globalAlpha=.035;ellipse(c,r()*3200,r()*700,10+r()*25,3+r()*10,j%2?'#fff8dd':p.hill);}c.globalAlpha=1;
 } else if(depth===1){
 for(let j=0;j<12;j++){const x=j*(3200/12)+90,scale=.65+r()*.4,seed=170+j*19+season*113;for(const wrap of [-3200,0,3200])tree(c,x+wrap,season===3?680:600,scale,season,seed);}
 c.fillStyle=p.water;c.beginPath();c.moveTo(0,760);c.bezierCurveTo(700,690,1700,750,3200,630);c.lineTo(3200,1080);c.lineTo(0,1080);c.fill();
 c.fillStyle=p.land;c.beginPath();c.moveTo(0,840);c.bezierCurveTo(900,640,1300,960,2050,870);c.bezierCurveTo(2500,810,2800,700,3200,760);c.lineTo(3200,1080);c.lineTo(0,1080);c.fill();
 for(let j=0;j<1100;j++){let x=r()*3200,y=850+r()*230;c.globalAlpha=.2+r()*.25;c.strokeStyle=p.leaf[j%4];c.lineWidth=2+r()*3;c.beginPath();c.moveTo(x,y);c.lineTo(x+8+r()*16,y-7-r()*18);c.stroke();}c.globalAlpha=1;
 } else {
 // Periodic artwork must wrap its geometry BEFORE the cache is clipped.
 // Drawing unrelated trees at the two edges severed branches at the tile seam.
 for(let j=0;j<4;j++){const x=j*800+80,scale=1.25+r()*.32,seed=900+j*37+season*90;for(const wrap of [-3200,0,3200])tree(c,x+wrap,850,scale,season,seed);}}
 });}
function repeat(c,img,shift,y,scale){const width=img.width*scale,off=((shift%width)+width)%width;c.drawImage(img,-off,y,img.width*scale,img.height*scale);c.drawImage(img,width-off,y,img.width*scale,img.height*scale);}
function landscape(c,season,t){let s=F.state(t),p=pal[season];c.save();
 // Separate focal depths: tracked world is moving, not four flat pages.
 repeat(c,layer(season,0),s.camera.x*.085,0,1);
 c.save();c.translate(W/2,H/2);c.scale(.94+(s.camera.z-1)*.19,.94+(s.camera.z-1)*.19);c.translate(-W/2,-H/2);repeat(c,layer(season,1),s.camera.x*.28,-15*Math.sin(t*.43),1);c.restore();
 // Lake highlights are attached to their world plane, not regenerated every frame.
 c.save();c.globalAlpha=.45;for(let i=0;i<74;i++){const r=U.rng(610+i),x=((r()*2500-s.camera.x*.28+2500)%2500)-250,y=765+r()*220;let a=.2+.6*Math.pow(Math.sin(t*1.2+i),2);c.strokeStyle=`rgba(249,245,215,${a})`;c.lineWidth=1+r()*3;c.beginPath();c.moveTo(x,y);c.lineTo(x+15+r()*55,y+Math.sin(t*1.7+i)*2);c.stroke();}c.restore();
 // Mid/near canopy has pronounced parallax for side tracking and pull-back.
 c.save();c.globalAlpha=.94;repeat(c,layer(season,2),s.camera.x*.60,-60-30*Math.sin(t*.31),1.1);c.restore();
 // Screen-plane weather has continuous trajectories and fades at wrapping edges.
 const r=U.rng(129+season);for(let i=0;i<70;i++){const depth=.4+r(),bx=r()*2400,by=r()*1500;const x=((bx-t*(25+depth*35)+2400)%2400)-240,y=((by+t*(season===3?30:13))%1500)-180;
 const alpha=.6*Math.min(1,Math.max(0,(y+100)/120),Math.max(0,(1200-y)/120));c.globalAlpha=alpha;
 if(season===3)ellipse(c,x,y,2+depth*2,2+depth*2,'#f8faf2');else if(season===0)ellipse(c,x,y,5+depth*5,2+depth*3,i%2?'#f8e2d9':'#e6b8b9',t*.8+i);else if(season===2){c.save();c.translate(x,y);c.rotate(t*.65+i);ellipse(c,0,0,9+depth*4,3+depth*2,p.leaf[i%4]);c.restore();}else ellipse(c,x,y,1+depth*2,1+depth*2,'#f6efb6');}
 c.globalAlpha=1;c.restore();}
function leaf(c,s,t){CAM.with(c,s.camera,g=>{g.translate(s.x,s.y);g.rotate(s.angle);g.scale(1,Math.cos(s.yaw));
 const path=new Path2D();path.moveTo(-110,0);path.bezierCurveTo(-35,-104,93,-76,135,-8);path.bezierCurveTo(42,68,-55,74,-110,0);
 let shade=g.createLinearGradient(-100,-70,100,65);shade.addColorStop(0,'#e6d57b');shade.addColorStop(.4,'#b8b958');shade.addColorStop(1,'#728846');g.fillStyle=shade;g.shadowColor='rgba(26,42,28,.3)';g.shadowBlur=16;g.shadowOffsetY=7;g.fill(path);g.shadowBlur=0;g.shadowOffsetY=0;
 g.save();g.clip(path);const r=U.rng(445);for(let i=0;i<500;i++){g.globalAlpha=.1;ellipse(g,-110+r()*245,-75+r()*150,.5+r()*2,.4+r(),'#fff4b1');}g.globalAlpha=1;
 g.strokeStyle='rgba(87,103,44,.65)';g.lineWidth=2;g.beginPath();g.moveTo(-110,0);g.quadraticCurveTo(10,-4,135,-8);g.stroke();for(let i=0;i<8;i++){let x=-85+i*25;for(let side of [-1,1]){g.beginPath();g.moveTo(x,0);g.quadraticCurveTo(x+16,side*28,x+29,side*(46- Math.abs(x)*.1));g.stroke();}}g.restore();
 g.strokeStyle='#657841';g.lineWidth=3;g.beginPath();g.moveTo(-110,0);g.quadraticCurveTo(-133,1,-147,11);g.stroke();
 // A single identifying nick and dew highlight stay in the same local coordinates.
 g.fillStyle='#f8e9a4';g.beginPath();g.arc(63,-15,3,0,TAU);g.fill();});}
function occluder(c,x,season){const p=pal[season];c.save();c.translate(x,0);let g=c.createLinearGradient(-160,0,160,0);g.addColorStop(0,p.trunk);g.addColorStop(.5,season===3?'#9caeb1':'#4b5544');g.addColorStop(1,p.trunk);c.fillStyle=g;c.beginPath();c.moveTo(-155,-80);c.bezierCurveTo(-130,350,-195,680,-145,1160);c.lineTo(160,1160);c.bezierCurveTo(120,680,190,300,145,-80);c.closePath();c.fill();
 c.strokeStyle=season===3?'#e1e9e5':'rgba(219,209,151,.22)';for(let i=0;i<9;i++){c.lineWidth=2+i%3;c.beginPath();c.moveTo(-120+i*29,-20);c.bezierCurveTo(-95+i*29,300,-160+i*29,700,-100+i*29,1120);c.stroke();}c.restore();}
F.draw=(c,t)=>{t=Math.max(0,Math.min(15,t));let current=Math.min(3,Math.floor(t/3.75));let trans=null;for(let k=1;k<=3;k++)if(Math.abs(t-k*3.75)<=.45){trans={old:k-1,next:k,q:(t-(k*3.75-.45))/.9};break;}
 if(trans){landscape(c,trans.old,t);let edge=-220+(W+440)*trans.q;c.save();c.beginPath();c.rect(0,0,Math.max(0,edge),H);c.clip();landscape(c,trans.next,t);c.restore();leaf(c,F.state(t),t);occluder(c,edge,trans.next);}
 else{landscape(c,current,t);leaf(c,F.state(t),t);}
 c.save();c.globalAlpha=.12;c.drawImage(P.grain('seasons-finish',.07,[50,45,30],.12),0,0);c.restore();};
for(const id of ['spring','summer','autumn','winter'])SCENES[id]={draw:(c,lt,t)=>F.draw(c,t)};
})();
