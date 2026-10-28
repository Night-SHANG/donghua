/* Three bounded design sheets. Every drawing is actual p5.brush, not an episode. */
function sheetGround(y,x1=90,x2=1830){boilSeed('ground'+y);inkLine([[x1,y],[x2,y]],.45,'#C6BDAA','charcoal',0);}
LOOPS.duo_master=t=>{
 sheetGround(590);sheetGround(1010,450,1470);
 CAST.draw('kokou',590,590,4.7,{view:'front',pose:'neutral',id:'master-k'});
 CAST.draw('liuliu',1330,590,4.7,{view:'front',pose:'neutral',id:'master-l'});
 CAST.draw('kokou',730,1010,2.8,{pose:'push',id:'active-k'});
 CAST.draw('liuliu',1220,1010,2.8,{pose:'smug',id:'active-l'});
};
function turnSheet(who){
 sheetGround(465);sheetGround(1005);
 ['front','quarter','profile','back'].forEach((view,i)=>CAST.draw(who,235+i*470,465,3.05,{view,pose:'neutral',id:who+'-'+view}));
 const poses=who==='kokou'?['anticipate','push','squash','proud']:['sneak','dash','stretch','smug'];
 poses.forEach((pose,i)=>CAST.draw(who,235+i*470,1005,2.7,{pose,id:who+'-'+pose}));
}
LOOPS.kokou_sheet=t=>turnSheet('kokou');LOOPS.liuliu_sheet=t=>turnSheet('liuliu');
for(const n of ['duo_master','kokou_sheet','liuliu_sheet'])LOOPS[n].len=1;
