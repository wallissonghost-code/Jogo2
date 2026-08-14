// Cidade Viva — Beta 0.1.3
// Gate de landscape estável para mobile. Não fica alternando orientação em loop.
const shell=document.querySelector('#landscape-shell');
const loading=document.querySelector('#loading-screen');
let requested=false;
function portrait(){return matchMedia('(orientation: portrait)').matches}
async function enterLandscape(){
  if(requested)return;requested=true;
  try{if(document.documentElement.requestFullscreen&&!document.fullscreenElement)await document.documentElement.requestFullscreen({navigationUI:'hide'})}catch(e){}
  try{if(screen.orientation?.lock)await screen.orientation.lock('landscape-primary')}catch(e){}
}
function syncOrientation(){
  const isPortrait=portrait();
  document.documentElement.classList.toggle('cv-portrait',isPortrait);
  shell?.classList.toggle('cv-portrait-shell',isPortrait);
}
syncOrientation();
addEventListener('orientationchange',()=>setTimeout(syncOrientation,180),{passive:true});
addEventListener('resize',()=>setTimeout(syncOrientation,80),{passive:true});
addEventListener('pointerdown',enterLandscape,{once:true,passive:true});
addEventListener('touchstart',enterLandscape,{once:true,passive:true});
