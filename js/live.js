import {loadState,storeState,resetState,normalizeState} from './state.js';

const $=id=>document.getElementById(id);
const CODE_KEY='jogo2-liveplus-panel-code';
const HUD_RULES_KEY='jogo2-liveplus-hud-rules';
const GAME_ID='jogo2';
const VERSION='1.2.0';
let state=loadState();
let session=null;
let rules=[];

const participantOptions=[
  {value:'0',label:'Candidato A'},
  {value:'1',label:'Candidato B'},
  {value:'2',label:'Candidato C'},
  {value:'3',label:'Candidato D'}
];

const manifest={
  protocol:'liveplus-game-manifest-v1',
  gameId:GAME_ID,
  name:'Jogo2 · Live Battle Board',
  icon:'🏆',
  version:VERSION,
  hud:{
    type:'battle-gifts-v1',
    sides:[
      {id:'0',label:'CANDIDATO A',tone:'red'},
      {id:'1',label:'CANDIDATO B',tone:'blue'},
      {id:'2',label:'CANDIDATO C',tone:'red'},
      {id:'3',label:'CANDIDATO D',tone:'blue'}
    ],
    slotsPerSide:6
  },
  actions:[
    {id:'add_votes',label:'Adicionar votos',icon:'➕',description:'Soma votos a um participante.',params:[{id:'participant',label:'PARTICIPANTE',type:'select',default:'0',options:participantOptions},{id:'amount',label:'VOTOS',type:'number',min:1,max:1000000,default:1}]},
    {id:'remove_votes',label:'Remover votos',icon:'➖',description:'Remove votos de um participante.',params:[{id:'participant',label:'PARTICIPANTE',type:'select',default:'0',options:participantOptions},{id:'amount',label:'VOTOS',type:'number',min:1,max:1000000,default:1}]},
    {id:'set_votes',label:'Definir votos',icon:'🎯',description:'Define o total exato de votos.',params:[{id:'participant',label:'PARTICIPANTE',type:'select',default:'0',options:participantOptions},{id:'amount',label:'TOTAL',type:'number',min:0,max:100000000,default:0}]},
    {id:'set_name',label:'Alterar participante',icon:'👤',description:'Altera o nome exibido.',params:[{id:'participant',label:'PARTICIPANTE',type:'select',default:'0',options:participantOptions},{id:'name',label:'NOME',type:'text',placeholder:'Novo nome'}]},
    {id:'set_round',label:'Definir rodada',icon:'🔢',description:'Altera o número da rodada.',params:[{id:'round',label:'RODADA',type:'number',min:1,max:9999,default:1}]},
    {id:'next_round',label:'Próxima rodada',icon:'⏭️',description:'Avança uma rodada.',params:[]},
    {id:'set_title',label:'Alterar título',icon:'✏️',description:'Altera o título principal.',params:[{id:'title',label:'TÍTULO',type:'text',placeholder:'Batalha ao vivo'}]},
    {id:'set_count',label:'Quantidade de participantes',icon:'👥',description:'Define quantos participantes aparecem.',params:[{id:'count',label:'QUANTIDADE',type:'number',min:2,max:4,default:2}]},
    {id:'reset_votes',label:'Zerar votos',icon:'🧹',description:'Zera os votos de todos os participantes.',params:[]},
    {id:'reset_all',label:'Resetar batalha',icon:'♻️',description:'Restaura o estado padrão do Jogo2.',params:[]}
  ]
};

function initials(name){return (name||'?').trim().slice(0,2).toUpperCase()}
function cleanCode(v=''){return String(v).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)}
function formatCode(v=''){const c=cleanCode(v);return c.length>4?c.slice(0,4)+'-'+c.slice(4):c}
function safe(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function setPairStatus(text,kind=''){
  const el=$('pairMessage');
  if(el){el.textContent=text;el.className='pair-message '+kind}
  const badge=$('universalStatus');
  if(badge){badge.textContent=text;badge.dataset.kind=kind}
}

function participantIndex(value){return Math.max(0,Math.min(3,Number(value)||0))}
function ruleParticipant(rule){return participantIndex(rule?.actionParams?.participant)}
function effectLabel(rule){
  const p=rule?.actionParams&&typeof rule.actionParams==='object'?rule.actionParams:{};
  const amount=Math.max(0,Number(p.amount)||0);
  if(rule?.actionId==='add_votes')return `+${amount||1} ponto${(amount||1)===1?'':'s'}`;
  if(rule?.actionId==='remove_votes')return `-${amount||1} ponto${(amount||1)===1?'':'s'}`;
  if(rule?.actionId==='set_votes')return `${amount} pontos`;
  return 'ação da batalha';
}
function renderHud(){
  const root=$('livePlusBattleHud');
  if(!root)return;
  const active=rules.filter(r=>r&&r.trigger==='gift'&&r.giftName&&['add_votes','remove_votes','set_votes'].includes(String(r.actionId||''))&&ruleParticipant(r)<state.count);
  if(!active.length){root.hidden=true;root.innerHTML='';return}
  root.hidden=false;
  const sides=state.participants.slice(0,state.count).map((participant,index)=>{
    const own=active.filter(r=>ruleParticipant(r)===index).sort((a,b)=>(Number(a.giftValue)||0)-(Number(b.giftValue)||0)).slice(0,6);
    const cards=own.length?own.map(r=>{
      const icon=r.giftIcon?`<img src="${safe(r.giftIcon)}" alt="">`:'🎁';
      const cost=Number(r.giftValue)>0?`${Number(r.giftValue).toLocaleString('pt-BR')} moeda${Number(r.giftValue)===1?'':'s'}`:'presente';
      return `<div class="lp-rule-card"><div class="lp-rule-icon">${icon}</div><div class="lp-rule-copy"><b>${safe(r.giftName)}</b><small>${safe(effectLabel(r))} · ${safe(cost)}</small></div></div>`;
    }).join(''):'<div class="lp-rule-empty">Nenhum presente configurado</div>';
    return `<section class="lp-hud-side" data-side="${index}"><div class="lp-hud-head"><b>${safe(participant.name)}</b><small>vale pontos</small></div><div class="lp-rule-list">${cards}</div></section>`;
  }).join('');
  root.innerHTML=`<div class="lp-hud-title">PRESENTES DA BATALHA · LIVE+</div><div class="lp-hud-grid">${sides}</div>`;
}
function applyRulesSync(data={}){
  if(data.gameId&&String(data.gameId)!==GAME_ID)return;
  if(!Array.isArray(data.rules))return;
  rules=data.rules.slice(0,80).map(r=>({
    ...r,
    actionId:String(r.actionId||''),
    trigger:String(r.trigger||''),
    giftName:String(r.giftName||''),
    giftIcon:String(r.giftIcon||''),
    giftValue:Math.max(0,Number(r.giftValue)||0),
    actionParams:r.actionParams&&typeof r.actionParams==='object'?r.actionParams:{}
  }));
  try{localStorage.setItem(HUD_RULES_KEY,JSON.stringify(rules))}catch{}
  renderHud();
  session?.sendState({scope:'hud',gameId:GAME_ID,hud:'synced',rules:rules.length});
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
    const media=p.image?`<img src="${safe(p.image)}" alt="${safe(p.name)}">`:`<div class="avatar-fallback">${safe(initials(p.name))}</div>`;
    return `<article class="candidate-card" style="--accent:${safe(p.accent)}"><div class="candidate-media">${media}</div><h2>${safe(p.name)}</h2><div class="vote-number">${votes.toLocaleString('pt-BR')}</div><div class="vote-label">VOTOS</div><div class="progress"><span style="width:${pct}%"></span></div></article>`;
  }).join('');
  renderHud();
}

function stateSnapshot(scope='battle'){
  return {scope,gameId:GAME_ID,version:VERSION,state:normalizeState(state),title:state.title,round:state.round,count:state.count,participants:state.participants,hudRules:rules.length};
}
function sendState(scope='battle'){session?.sendState(stateSnapshot(scope))}
function commitState(next,scope='battle',eventName='state_changed'){
  state=storeState(normalizeState(next));
  render();
  sendState(scope);
  session?.sendEvent({gameId:GAME_ID,event:eventName,scope,round:state.round});
}

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
  session.addEventListener('message',e=>{const d=e.detail||{};if(d.type==='rules_sync')applyRulesSync(d)});
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

try{const cached=JSON.parse(localStorage.getItem(HUD_RULES_KEY)||'[]');if(Array.isArray(cached))rules=cached}catch{}
render();
initPanelUI();
window.Jogo2Universal={connect:connectPanel,getState:()=>normalizeState(state),executeCommand,manifest,getRules:()=>rules.slice(),renderHud};
