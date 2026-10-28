window.PUNCH=0;window.FILM_DURATION=15;window.FILM_SIZE=[1920,1080];
window.SCENE_DIR='seasons_leaf';window.SCENE_LIBS=['seasons_leaf/world.js'];
window.ERAS=['spring','summer','autumn','winter'].map((id,i)=>({id,dur:3.75,...(i?{transition:{type:'cut',dur:1/60,punch:0}}:{})}));
