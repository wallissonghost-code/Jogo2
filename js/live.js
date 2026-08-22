import {loadState,onStateChange} from './state.js';

const $=id=>document.getElementById(id);
let state=loadState();

function initials(name){return (name||'?').trim().slice(0,2).toUpperCase()}

function render(){
  $('battleTitle').textContent=state.title||'Batalha ao vivo';
  $('roundNumber').textContent=state.round;
  const list=state.participants.slice(0,state.count);
  const max=Math.max(1,...list.map(p=>Number(p.votes)||0));
  $('battleGrid').style.setProperty('--count',String(list.length));
  $('battleGrid').innerHTML=list.map(p=>{
    const votes=Math.max(0,Number(p.votes)||0);
    const pct=Math.max(2,Math.round(votes/max*100));
    const media=p.image?`<img src="${p.image}" alt="${p.name}">`:`<div class="avatar-fallback">${initials(p.name)}</div>`;
    return `<article class="candidate-card" style="--accent:${p.accent}">
      <div class="candidate-media">${media}</div>
      <h2>${p.name}</h2>
      <div class="vote-number">${votes.toLocaleString('pt-BR')}</div>
      <div class="vote-label">VOTOS</div>
      <div class="progress"><span style="width:${pct}%"></span></div>
    </article>`;
  }).join('');
  $('giftLegend').innerHTML=state.gifts.map(g=>`<div class="gift-chip"><span class="gift-icon">${g.icon}</span><div><b>${g.name}</b><small>+${Number(g.value)||0} voto${Number(g.value)===1?'':'s'}</small></div></div>`).join('');
}

render();
onStateChange(next=>{state={...state,...next};render()});
