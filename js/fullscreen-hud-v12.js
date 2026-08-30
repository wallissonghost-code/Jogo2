(()=>{
  'use strict';
  const root=document.getElementById('livePlusBattleHud');
  if(!root)return;
  let queued=false;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function emptyHud(){
    const api=window.Jogo2Universal;
    const state=api?.getState?.()||{};
    const count=Math.max(2,Math.min(4,Number(state.count)||2));
    const participants=Array.isArray(state.participants)?state.participants.slice(0,count):[];
    const sides=Array.from({length:count},(_,i)=>{
      const p=participants[i]||{name:`Candidato ${String.fromCharCode(65+i)}`};
      return `<section class="lp-hud-side" data-side="${i}"><div class="lp-hud-head"><b>${esc(p.name)}</b><small>LIVE+</small></div><div class="lp-rule-list"><div class="lp-rule-empty">Aguardando regras da live</div></div></section>`;
    }).join('');
    root.innerHTML=`<div class="lp-hud-title">LIVE+ · INTERAÇÕES DA BATALHA</div><div class="lp-hud-grid">${sides}</div>`;
  }
  function ensure(){
    queued=false;
    if(root.hidden)root.hidden=false;
    if(!root.innerHTML.trim())emptyHud();
  }
  function schedule(){if(queued)return;queued=true;queueMicrotask(ensure)}
  const observer=new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:false,attributes:true,attributeFilter:['hidden']});
  window.addEventListener('liveplus-game-state',schedule);
  setTimeout(ensure,0);
  setTimeout(ensure,250);
})();
