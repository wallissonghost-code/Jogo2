import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { loadState, storeState } from './state.js';

const SUPABASE_URL='https://tkrgihgzhpbnbcpvwxbp.supabase.co';
const SUPABASE_KEY='sb_publishable_SrWXb2m7dXqSc0-1lMjpCg_VHLrkpwE';
const ROOM='jogo2-live-battle';

const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let channel=null;
let role='live';
let stateHandler=()=>{};
let statusHandler=()=>{};
let ready=false;
let queuedState=null;

function emitStatus(label){
  try{statusHandler(label)}catch{}
}

async function send(event,payload){
  if(!channel||!ready)return false;
  const result=await channel.send({type:'broadcast',event,payload});
  return result==='ok';
}

async function sendState(state){
  const clean=storeState(state);
  if(!ready){queuedState=clean;return false;}
  queuedState=null;
  return send('state',{state:clean,updatedAt:Date.now()});
}

export function publishState(state){
  sendState(state).catch(()=>emitStatus('Reconectando…'));
}

export function connectRealtime(options={}){
  role=options.role==='admin'?'admin':'live';
  stateHandler=typeof options.onState==='function'?options.onState:()=>{};
  statusHandler=typeof options.onStatus==='function'?options.onStatus:()=>{};

  emitStatus('Conectando…');
  channel=supabase.channel(ROOM,{config:{broadcast:{self:false},presence:{key:role}}});

  channel
    .on('broadcast',{event:'state'},({payload})=>{
      if(!payload?.state)return;
      const clean=storeState(payload.state);
      stateHandler(clean);
    })
    .on('broadcast',{event:'sync-request'},()=>{
      if(role==='admin')sendState(loadState());
    })
    .subscribe(async status=>{
      if(status==='SUBSCRIBED'){
        ready=true;
        emitStatus('Ao vivo');
        if(queuedState)await sendState(queuedState);
        if(role==='admin')await sendState(loadState());
        else await send('sync-request',{at:Date.now()});
      }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){
        ready=false;
        emitStatus('Reconectando…');
      }else if(status==='CLOSED'){
        ready=false;
        emitStatus('Offline');
      }
    });

  const localChannel='BroadcastChannel' in window?new BroadcastChannel('live-battle-board-local'):null;
  if(localChannel){
    localChannel.onmessage=e=>{
      const clean=storeState(e.data);
      stateHandler(clean);
    };
  }

  const storageHandler=e=>{
    if(e.key==='live-battle-board:v3'&&e.newValue){
      try{stateHandler(storeState(JSON.parse(e.newValue)))}catch{}
    }
  };
  addEventListener('storage',storageHandler);

  return ()=>{
    removeEventListener('storage',storageHandler);
    localChannel?.close();
    if(channel)supabase.removeChannel(channel);
    channel=null;
    ready=false;
  };
}

export function publishLocal(state){
  const clean=storeState(state);
  try{new BroadcastChannel('live-battle-board-local').postMessage(clean)}catch{}
  publishState(clean);
  return clean;
}
