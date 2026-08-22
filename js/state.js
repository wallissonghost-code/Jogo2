export const STORAGE_KEY='live-battle-board:v3';

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

const clone=value=>JSON.parse(JSON.stringify(value));

export function normalizeState(input={}){
  const saved=input&&typeof input==='object'?input:{};
  return {
    ...clone(defaults),
    ...saved,
    count:Math.max(2,Math.min(4,Number(saved.count)||2)),
    round:Math.max(1,Number(saved.round)||1),
    participants:clone(defaults.participants).map((participant,index)=>({
      ...participant,
      ...(saved.participants?.[index]||{}),
      votes:Math.max(0,Number(saved.participants?.[index]?.votes)||0)
    })),
    gifts:clone(defaults.gifts).map((gift,index)=>({
      ...gift,
      ...(saved.gifts?.[index]||{}),
      value:Math.max(1,Number(saved.gifts?.[index]?.value)||gift.value)
    }))
  };
}

export function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    return raw?normalizeState(JSON.parse(raw)):clone(defaults);
  }catch{
    return clone(defaults);
  }
}

export function storeState(state){
  const clean=normalizeState(state);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(clean));
  return clean;
}

export function resetState(){
  return storeState(clone(defaults));
}
