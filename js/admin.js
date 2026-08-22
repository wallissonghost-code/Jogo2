import {loadState,resetState} from './state.js';
import {connectRealtime,publishLocal} from './realtime.js';

const $=id=>document.getElementById(id);
let state=loadState();
let statusTimer=null;

function setStatus(text){
  clearTimeout(statusTimer);
  $('connectionStatus').textContent=text;
}

function persist(){
  state=publishLocal(state);
  setStatus('Sincronizando…');
  statusTimer=setTimeout(()=>$('connectionStatus').textContent='Ao vivo',350);
}

function fileToDataURL(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

function renderEditors(){
  $('titleInput').value=state.title;
  $('countSelect').value=state.count;
  $('roundInput').value=state.round;
  $('participantEditors').innerHTML=state.participants.slice(0,state.count).map((p,i)=>`<section class="participant-editor" data-index="${i}">
    <div class="editor-title"><span class="swatch" style="background:${p.accent}"></span><b>${p.name}</b></div>
    <div class="editor-grid">
      <label>Nome<input data-field="name" type="text" maxlength="40" value="${p.name.replaceAll('"','&quot;')}"></label>
      <label>Votos<input data-field="votes" type="number" min="0" step="1" value="${p.votes}"></label>
      <label>Cor<input data-field="accent" type="color" value="${p.accent}"></label>
      <label>Foto<input data-field="image" type="file" accept="image/png,image/jpeg,image/webp"></label>
    </div>
    <div class="gift-actions">${state.gifts.map(g=>`<button type="button" data-add="${g.value}">${g.icon} +${g.value}</button>`).join('')}<button type="button" data-add="-1">−1</button></div>
  </section>`).join('');

  $('giftEditors').innerHTML=state.gifts.map((g,i)=>`<div class="gift-editor" data-gift="${i}"><span>${g.icon}</span><input data-field="name" type="text" value="${g.name}"><input data-field="value" type="number" min="1" step="1" value="${g.value}"></div>`).join('');

  bindParticipantEditors();
  bindGiftEditors();
}

function bindParticipantEditors(){
  document.querySelectorAll('.participant-editor').forEach(el=>{
    const i=Number(el.dataset.index);
    el.querySelectorAll('input[data-field]').forEach(input=>input.addEventListener('change',async()=>{
      const field=input.dataset.field;
      if(field==='image'){
        const file=input.files?.[0];
        if(!file)return;
        state.participants[i].image=await fileToDataURL(file);
      }else if(field==='votes'){
        state.participants[i].votes=Math.max(0,Number(input.value)||0);
      }else{
        state.participants[i][field]=input.value;
      }
      persist();
      renderEditors();
    }));

    el.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>{
      state.participants[i].votes=Math.max(0,(Number(state.participants[i].votes)||0)+Number(btn.dataset.add));
      persist();
      renderEditors();
    }));
  });
}

function bindGiftEditors(){
  document.querySelectorAll('.gift-editor').forEach(el=>{
    const i=Number(el.dataset.gift);
    el.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{
      const field=input.dataset.field;
      state.gifts[i][field]=field==='value'?Math.max(1,Number(input.value)||1):input.value;
      persist();
      renderEditors();
    }));
  });
}

$('titleInput').addEventListener('change',()=>{state.title=$('titleInput').value.trim()||'Batalha ao vivo';persist()});
$('countSelect').addEventListener('change',()=>{state.count=Number($('countSelect').value);persist();renderEditors()});
$('roundInput').addEventListener('change',()=>{state.round=Math.max(1,Number($('roundInput').value)||1);persist()});
$('resetVotes').addEventListener('click',()=>{state.participants.forEach(p=>p.votes=0);persist();renderEditors()});
$('resetAll').addEventListener('click',()=>{state=resetState();persist();renderEditors()});

connectRealtime({
  role:'admin',
  onState:next=>{state=next;renderEditors();},
  onStatus:setStatus
});

renderEditors();
