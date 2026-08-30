(()=>{'use strict';
const TIMER_KEY='jogo2-battle-timer-v1';
const DURATION_MS=3*60*1000;
const value=document.getElementById('battleTimerValue');
const box=document.getElementById('battleTimer');
if(!value||!box)return;

function loadEnd(){
  try{
    const raw=localStorage.getItem(TIMER_KEY);
    const parsed=raw?JSON.parse(raw):null;
    if(parsed&&Number.isFinite(Number(parsed.endAt)))return Number(parsed.endAt);
  }catch{}
  const endAt=Date.now()+DURATION_MS;
  try{localStorage.setItem(TIMER_KEY,JSON.stringify({endAt}))}catch{}
  return endAt;
}

let endAt=loadEnd();
function format(ms){
  const total=Math.max(0,Math.ceil(ms/1000));
  const m=Math.floor(total/60);
  const s=total%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function render(){
  const left=Math.max(0,endAt-Date.now());
  value.textContent=format(left);
  box.dataset.urgent=String(left>0&&left<=30000);
  box.dataset.ended=String(left<=0);
  if(left<=0){
    value.textContent='00:00';
    return false;
  }
  return true;
}
render();
const timer=setInterval(()=>{if(!render())clearInterval(timer)},250);
window.Jogo2BattleTimer={
  reset(seconds=180){
    const duration=Math.max(1,Number(seconds)||180)*1000;
    endAt=Date.now()+duration;
    try{localStorage.setItem(TIMER_KEY,JSON.stringify({endAt}))}catch{}
    render();
    return endAt;
  },
  getRemaining(){return Math.max(0,Math.ceil((endAt-Date.now())/1000))}
};
})();
