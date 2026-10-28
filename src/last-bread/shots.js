// Only the approved 16–21 second action pilot is registered. No full-film placeholder loop.
Bread.drawFrame=t=>{
 const s=Bread.sample(t);camBegin(s.camera.cx,s.camera.cy,s.camera.zoom);
 Bread.drawSet();
 for(const [name,p]of [['tuantuan',s.tuantuan],['jiujiao',s.jiujiao]])Bread.drawGroundShadow(name,p.x,Bread.groundY(p.x)+4,name==='tuantuan'?83:41);
 Bread.drawGroundShadow('parcel',s.bread.x,Bread.groundY(s.bread.x)+5,46,18);
 // Sparrow stays in the foreground: the opaque ringed tail must not hide its
 // catch-up face/hat. Fixed ordering avoids a depth-swap pop mid-shot.
 Bread.drawTuantuan(s.tuantuan);Bread.drawJiuJiao(s.jiujiao);Bread.drawWrappedBread(s.bread);
 camEnd();return s;
};
LOOPS.breadPilot=t=>Bread.drawFrame(16+t);
LOOPS.breadPilot.len=5;
