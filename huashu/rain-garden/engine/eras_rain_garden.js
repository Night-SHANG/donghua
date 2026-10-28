window.PUNCH=0; window.FILM_DURATION=15; window.FILM_SIZE=[1920,1080];
window.SCENE_DIR='rain_garden';
window.SCENE_LIBS=['rain_garden/world.js'];
window.ERAS=[['dew',3.8],['ripple',3.2],['bloom',4],['island',4]].map(([id,dur],i)=>({id,dur,...(i?{transition:{type:'cut',dur:1/60,punch:0}}:{})}));
