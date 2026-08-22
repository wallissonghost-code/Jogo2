export const STORAGE_KEY='live-battle-board:v2';
export const CHANNEL_NAME='live-battle-board-sync';

export const defaults={
  title:'Batalha ao vivo',
  round:1,
  count:2,
  participants:[
    {id:'a',name:'Candidato A',votes:0,image:'',accent:'#f43f5e'},
    {id:'b',name:'Candidato B',votes:0,image:'',accent:'#60a5fa'},
    {id:'c',name:'Candidato C',votes:0,image:'',accent:'#f59e0b'},
    {id:'d',name:'Candidato D',votes:0,image:'',accent:'#34d399'}
  ],
  gifts:[
    {id:'rose',icon:'🌹',name:'Rosa',value:1},
    {id:'tiktok',icon:'🎵',name:'TikTok',value:10},
    {id:'gift',icon:'🎁',name:'Presente',value:100}
  ]
};

const clone=v=>JSON.parse(JSON.stringify(v));

export function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return clone(defaults);
    const saved=JSON.parse(raw);
    return {
      ...clone(defaults),
      ...saved,
      participants:clone(defaults.participants).map((p,i)=>({...p,...(saved.participants?.[i]||{})})),
      gifts:clone(defaults.gifts).map((g,i)=>({...g,...(saved.gifts?.[i]||{})}))
    };
  }catch{return clone(defaults)}
}

export function saveState(state){
  const clean={...state,count:Math.max(2,Math.min(4,Number(state.count)||2)),round:Math.max(1,Number(state.round)||1)};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(clean));
  try{new BroadcastChannel(CHANNEL_NAME).postMessage(clean)}catch{}
  return clean;
}

export function resetState(){
  const state=clone(defaults);
  saveState(state);
  return state;
}

export function onStateChange(callback){
  const storageHandler=e=>{if(e.key===STORAGE_KEY&&e.newValue){try{callback(JSON.parse(e.newValue))}catch{}}};
  addEventListener('storage',storageHandler);
  let channel=null;
  try{channel=new BroadcastChannel(CHANNEL_NAME);channel.onmessage=e=>callback(e.data)}catch{}
  return ()=>{removeEventListener('storage',storageHandler);channel?.close()};
}
