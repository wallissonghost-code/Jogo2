import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { loadState, storeState, normalizeState } from './state.js';

const SUPABASE_URL='https://tkrgihgzhpbnbcpvwxbp.supabase.co';
const SUPABASE_KEY='sb_publishable_SrWXb2m7dXqSc0-1lMjpCg_VHLrkpwE';
const STATE_ID='main';
const LOCAL_CHANNEL='live-battle-board-local';

const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
});

let realtimeChannel=null;
let stateHandler=()=>{};
let statusHandler=()=>{};
let connected=false;
let writeQueue=Promise.resolve();

function emitStatus(label){
  try{statusHandler(label)}catch{}
}

function deliver(raw){
  const clean=storeState(normalizeState(raw));
  try{stateHandler(clean)}catch{}
  return clean;
}

async function readRemote(){
  const {data,error}=await supabase
    .from('live_battle_state')
    .select('data,updated_at')
    .eq('id',STATE_ID)
    .maybeSingle();
  if(error) throw error;
  if(data?.data && Object.keys(data.data).length){
    return deliver(data.data);
  }
  return null;
}

async function writeRemote(state){
  const clean=storeState(state);
  const {error}=await supabase
    .from('live_battle_state')
    .upsert({id:STATE_ID,data:clean,updated_at:new Date().toISOString()},{onConflict:'id'});
  if(error) throw error;
  return clean;
}

export function publishState(state){
  const clean=storeState(state);
  writeQueue=writeQueue
    .catch(()=>{})
    .then(async()=>{
      try{
        await writeRemote(clean);
        emitStatus('Ao vivo');
      }catch(error){
        console.error('Realtime write failed',error);
        emitStatus('Reconectando…');
      }
    });
  return clean;
}

export function publishLocal(state){
  const clean=storeState(state);
  try{
    const channel=new BroadcastChannel(LOCAL_CHANNEL);
    channel.postMessage(clean);
    channel.close();
  }catch{}
  publishState(clean);
  return clean;
}

export function connectRealtime(options={}){
  const role=options.role==='admin'?'admin':'live';
  stateHandler=typeof options.onState==='function'?options.onState:()=>{};
  statusHandler=typeof options.onStatus==='function'?options.onStatus:()=>{};
  emitStatus('Conectando…');

  let stopped=false;

  const start=async()=>{
    try{
      const remote=await readRemote();
      if(!remote && role==='admin') await writeRemote(loadState());
    }catch(error){
      console.error('Initial sync failed',error);
      emitStatus('Reconectando…');
    }

    if(stopped) return;

    realtimeChannel=supabase
      .channel('jogo2-live-battle-db')
      .on(
        'postgres_changes',
        {event:'*',schema:'public',table:'live_battle_state',filter:`id=eq.${STATE_ID}`},
        payload=>{
          const next=payload?.new?.data;
          if(next) deliver(next);
        }
      )
      .subscribe(status=>{
        if(status==='SUBSCRIBED'){
          connected=true;
          emitStatus('Ao vivo');
        }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){
          connected=false;
          emitStatus('Reconectando…');
        }else if(status==='CLOSED'){
          connected=false;
          emitStatus('Offline');
        }
      });
  };

  start();

  const localChannel='BroadcastChannel' in window?new BroadcastChannel(LOCAL_CHANNEL):null;
  if(localChannel){
    localChannel.onmessage=e=>{
      if(e.data) deliver(e.data);
    };
  }

  const storageHandler=e=>{
    if(e.key==='live-battle-board:v3'&&e.newValue){
      try{deliver(JSON.parse(e.newValue))}catch{}
    }
  };
  addEventListener('storage',storageHandler);

  return ()=>{
    stopped=true;
    removeEventListener('storage',storageHandler);
    localChannel?.close();
    if(realtimeChannel) supabase.removeChannel(realtimeChannel);
    realtimeChannel=null;
    connected=false;
  };
}
