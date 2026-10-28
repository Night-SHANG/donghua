// ORIGINAL Fox & Stork · native huashu SCENES/ERAS film, no React/Remotion.
// Upstream pinned by render CI; only project overlay files live here.
window.PUNCH = 0;
window.FILM_DURATION = 65;
window.FILM_SIZE = [1920,1080];
window.SCENE_DIR = 'fox_stork';
window.SCENE_LIBS = ['fox_stork/asset_meta.js','fox_stork/timeline.js','fox_stork/actors.js','fox_stork/world.js','fox_stork/scenes.js'];
window.ERAS = [
  ['s01_serve',5], ['s02_fox_lap',5], ['s03_stork_peck',5], ['s04_polite_reaction',4],
  ['s05_angled_fail',5], ['s06_fox_finish',4], ['s07_return_invite',5], ['s08_jars',5],
  ['s09_stork_drink',5], ['s10_fox_blocked',5], ['s11_fox_lick',5], ['s12_deadpan',4],
  ['s13_fox_realizes',4], ['s14_final',4]
].map(([id,dur],i)=>({id,dur,...(i?{transition:{type:'cut',dur:1/30,punch:0}}:{})}));
