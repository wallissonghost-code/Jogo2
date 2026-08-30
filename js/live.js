import {loadState,storeState,resetState,normalizeState} from './state.js';

const $=id=>document.getElementById(id);
const CODE_KEY='jogo2-liveplus-panel-code';
const GAME_ID='jogo2';
const VERSION='1.1.0';
let state=loadState();
let session=null;

const participantOptions=[
  {value:'0',label:'Candidato A'},
  {value:'1',label:'Candidato B'},
  {value:'2',label:'Candidato C'},
  {value:'3',label:'Candidato D'}
];
const giftOptions=[
  {value:'0',label:'Presente 1'},
  {value:'1',label:'Presente 2'},
  {value:'2',label:'Presente 3'}
];

const manifest={
  protocol:'liveplus-game-manifest-v1',
  gameId:GAME_ID,
  name:'Jogo2 · Live Battle Board',
  icon:'🏆',
  version:VERSION,
  actions:[
    {id:'add_votes',label:'Adicionar votos',icon:'➕',description:'Soma votos a um participante.',params:[{id:'participant',label:'PARTICIPANTE',type:'select',default:'0',options:participantOptions},{id:'amount',label:'VOTOS',type:'number',min:1,max:1000000,default:1}]},
    {id:'remove_votes',label:'Remover votos',icon:'➖',description:'Remove votos de um participante.',params:[{id:'participant',label:'PARTICIPANTE',type:'select',default:'0',options:participantOptions},{id:'amount',label:'VOTOS',type:'number',min:1,max:1000000,default:1}]},
    {id:'set_votes',label:'Definir votos',icon:'🎯',description:'Define o total exato de votos.',params:[{id:'participant',label:'PARTICIPANTE',type:'select',default:'0',options:participantOptions},{id:'amount',label:'TOTAL',type:'number',min:0,max:100000000,default:0}]},
    {id:'set_name',label:'Alterar participante',icon:'👤',description:'Altera o nome exibido.',params:[{id:'participant',label:'PARTICIPANTE',type:'select',default:'0',options:participantOptions},{id:'name',label:'NOME',type:'text',placeholder:'Novo nome'}]},
    {id:'set_round',label:'Definir rodada',icon:'🔢',description:'Altera o número da rodada.',params:[{id:'round',label:'RODADA',type:'number',min:1,max:9999,default:1}]},
    {id:'next_round',label:'Próxima rodada',icon:'⏭️',description:'Avança uma rodada.',params:[]},
    {id:'set_title',label:'Alterar título',icon:'✏️',description:'Altera o título principal.',params:[{id:'title',label:'TÍTULO',type:'text',placeholder:'Batalha ao vivo'}]},
    {id:'set_count',label:'Quantidade de participantes',icon:'👥',description:'Define quantos participantes aparecem.',params:[{id:'count',label:'QUANTIDADE',type:'number',min:2,max:4,default:2}]},
    {id:'set_gift',label:'Configurar presente',icon:'🎁',description:'Altera nome, ícone e valor de um presente.',params:[{id:'gift',label:'PRESENTE',type:'select',default:'0',options:giftOptions},{id:'name',label:'NOME',type:'text',placeholder:'Presente'},{id:'icon',label:'ÍCONE',type:'text',placeholder:'🎁'},{id:'value',label:'VALOR EM VOTOS',type:'number',min:1,max:1000000,default:1}]},
    {id:'reset_votes',label:'Zerar votos',icon:'🧹',description:'Zera os votos de todos os participantes.',params:[]},
    {id:'reset_all',label:'Resetar batalha',icon:'♻️',description:'Restaura o estado padrão do Jogo2.',params:[]}
  ]
};

function initials(name){return (name||'?').trim().slice(0,2).toUpperCase()}
function cleanCode(v=''){return String(v).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)}
function formatCode(v=''){const c=cleanCode(v);return c.length>4?c.slice(0,4)+'-'+c.slice(4):c}
function setPairStatus(text,kind=''){
  const el=$('pairMessage');
  if(el){el.textContent=text;el.className='pair-message '+kind}
  const badge=$('universalStatus');
  if(badge){badge.textContent=text;badge.dataset.kind=kind}
}

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
    return `<article class="candidate-card" style="--accent:${p.accent}"><div class="candidate-media">${media}</div><h2>${p.name}</h2><div class="vote-number">${votes.toLocaleString('pt-BR')}</div><div class="vote-label">VOTOS</div><div class="progress"><span style="width:${pct}%"></span></div></article>`;
  }).join('');
  $('giftLegend').innerHTML=state.gifts.map(g=>`<div class="gift-chip"><span class="gift-icon">${g.icon}</span><div><b>${g.name}</b><small>+${Number(g.value)||0} voto${Number(g.value)===1?'':'s'}</small></div></div>`).join('');
}

function stateSnapshot(scope='battle'){
  return {scope,gameId:GAME_ID,version:VERSION,state:normalizeState(state),title:state.title,round:state.round,count:state.count,participants:state.participants,gifts:state.gifts};
}
function sendState(scope='battle'){session?.sendState(stateSnapshot(scope))}
function commitState(next,scope='battle',eventName='state_changed'){
  state=storeState(normalizeState(next));
  render();
  sendState(scope);
  session?.sendEvent({gameId:GAME_ID,event:eventName,scope,round:state.round});
}
function participantIndex(value){return Math.max(0,Math.min(3,Number(value)||0))}
function giftIndex(value){return Math.max(0,Math.min(2,Number(value)||0))}

function executeCommand(data={}){
  const action=String(data.action||data.command||'');
  const p=data.params&&typeof data.params==='object'?data.params:{};
  const next=normalizeState(state);
  let scope='battle';
  switch(action){
    case 'add_votes':{const i=participantIndex(p.participant);next.participants[i].votes=Math.max(0,Number(next.participants[i].votes)||0)+Math.max(0,Number(p.amount)||0);scope='votes';break}
    case 'remove_votes':{const i=participantIndex(p.participant);next.participants[i].votes=Math.max(0,(Number(next.participants[i].votes)||0)-Math.max(0,Number(p.amount)||0));scope='votes';break}
    case 'set_votes':{const i=participantIndex(p.participant);next.participants[i].votes=Math.max(0,Number(p.amount)||0);scope='votes';break}
    case 'set_name':{const i=participantIndex(p.participant);next.participants[i].name=String(p.name||'').trim()||next.participants[i].name;scope='participants';break}
    case 'set_round':next.round=Math.max(1,Number(p.round)||1);scope='round';break;
    case 'next_round':next.round=Math.max(1,(Number(next.round)||1)+1);scope='round';break;
    case 'set_title':next.title=String(p.title||'').trim()||'Batalha ao vivo';scope='title';break;
    case 'set_count':next.count=Math.max(2,Math.min(4,Number(p.count)||2));scope='participants';break;
    case 'set_gift':{const i=giftIndex(p.gift);if(String(p.name||'').trim())next.gifts[i].name=String(p.name).trim();if(String(p.icon||'').trim())next.gifts[i].icon=String(p.icon).trim();next.gifts[i].value=Math.max(1,Number(p.value)||next.gifts[i].value||1);scope='gifts';break}
    case 'reset_votes':next.participants.forEach(x=>x.votes=0);scope='votes';break;
    case 'reset_all':state=resetState();render();sendState('reset');session?.sendEvent({gameId:GAME_ID,event:'reset_all',scope:'reset'});return true;
    default:return false;
  }
  commitState(next,scope,'command_executed');
  session?.sendState({scope:'command',gameId:GAME_ID,commandStatus:'executed',action,ruleId:data.ruleId||''});
  return true;
}

async function connectPanel(){
  const input=$('panelCode');
  const code=cleanCode(input?.value||'');
  if(input)input.value=formatCode(code);
  if(code.length!==8){setPairStatus('Digite os 8 caracteres do painel.','err');return}
  if(!window.Peer||!window.LivePlusGameSession){setPairStatus('Cliente LIVE+ não carregou.','err');return}
  try{localStorage.setItem(CODE_KEY,formatCode(code))}catch{}
  if(session)session.disconnect();
  session=new LivePlusGameSession({storageKey:'jogo2-liveplus-token',manifest});
  session.addEventListener('connected',()=>{setPairStatus('Painel universal conectado.','ok');sendState('initial');setTimeout(()=>$('panelModal')?.classList.remove('show'),350)});
  session.addEventListener('command',e=>{const ok=executeCommand(e.detail||{});if(!ok)session?.sendState({scope:'command',gameId:GAME_ID,commandStatus:'unsupported',action:String(e.detail?.action||'')})});
  session.addEventListener('message',e=>{const d=e.detail||{};if(d.type==='rules_sync')session?.sendState({scope:'rules',gameId:GAME_ID,rulesReceived:Array.isArray(d.rules)?d.rules.length:0})});
  session.addEventListener('reconnecting',()=>setPairStatus('Reconectando ao painel…','warn'));
  session.addEventListener('transport',e=>{if(e.detail?.status==='disconnected')setPairStatus('Painel desconectado. Reconectando…','warn')});
  session.addEventListener('rejected',e=>setPairStatus(e.detail?.reason||'Sessão recusada.','err'));
  session.addEventListener('lost',()=>setPairStatus('Conexão perdida. Gere/conecte uma nova sessão.','err'));
  setPairStatus('Conectando…','warn');
  try{await session.connect(code)}catch(error){setPairStatus(error?.message||'Não foi possível conectar.','err')}
}

function initPanelUI(){
  const btn=$('panelConnectButton'),modal=$('panelModal'),close=$('closePanelModal'),input=$('panelCode'),connect=$('connectPanel');
  btn?.addEventListener('click',()=>modal?.classList.add('show'));
  close?.addEventListener('click',()=>modal?.classList.remove('show'));
  modal?.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show')});
  connect?.addEventListener('click',connectPanel);
  input?.addEventListener('input',()=>input.value=formatCode(input.value));
  input?.addEventListener('keydown',e=>{if(e.key==='Enter')connectPanel()});
  try{const saved=localStorage.getItem(CODE_KEY);if(saved&&input)input.value=saved}catch{}
}

render();
initPanelUI();
window.Jogo2Universal={connect:connectPanel,getState:()=>normalizeState(state),executeCommand,manifest};
