(()=>{'use strict';
const TIMER_KEY='jogo2-battle-timer-v1';
const DEFAULT_DURATION_MS=3*60*1000;
const value=document.getElementById('battleTimerValue');
const box=document.getElementById('battleTimer');
if(!value||!box)return;

let durationMs=DEFAULT_DURATION_MS;
function saveEnd(){
  try{localStorage.setItem(TIMER_KEY,JSON.stringify({endAt,durationMs}))}catch{}
}
function loadEnd(){
  try{
    const raw=localStorage.getItem(TIMER_KEY);
    const parsed=raw?JSON.parse(raw):null;
    if(parsed&&Number.isFinite(Number(parsed.durationMs))&&Number(parsed.durationMs)>=1000)durationMs=Number(parsed.durationMs);
    if(parsed&&Number.isFinite(Number(parsed.endAt)))return Number(parsed.endAt);
  }catch{}
  const next=Date.now()+durationMs;
  try{localStorage.setItem(TIMER_KEY,JSON.stringify({endAt:next,durationMs}))}catch{}
  return next;
}

let endAt=loadEnd();
function format(ms){
  const total=Math.max(0,Math.ceil(ms/1000));
  const m=Math.floor(total/60);
  const s=total%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function advanceCycle(now){
  if(endAt>now)return false;
  const cycles=Math.floor((now-endAt)/durationMs)+1;
  endAt+=cycles*durationMs;
  saveEnd();
  box.dataset.ended='false';
  window.dispatchEvent(new CustomEvent('jogo2-timer-cycle',{detail:{endAt,durationMs}}));
  return true;
}
function render(){
  const now=Date.now();
  advanceCycle(now);
  const left=Math.max(0,endAt-now);
  value.textContent=format(left);
  box.dataset.urgent=String(left>0&&left<=30000);
  box.dataset.ended='false';
}
render();
const timer=setInterval(render,250);
window.Jogo2BattleTimer={
  reset(seconds=180){
    durationMs=Math.max(1,Number(seconds)||180)*1000;
    endAt=Date.now()+durationMs;
    saveEnd();
    render();
    return endAt;
  },
  getRemaining(){return Math.max(0,Math.ceil((endAt-Date.now())/1000))},
  stop(){clearInterval(timer)}
};
})();
