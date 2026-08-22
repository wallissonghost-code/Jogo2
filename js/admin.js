import {loadState,saveState,resetState,onStateChange} from './state.js';

const $=id=>document.getElementById(id);
let state=loadState();

function persist(){state=saveState(state);$('connectionStatus').textContent='Sincronizado';setTimeout(()=>$('connectionStatus').textContent='Ao vivo',500)}

function fileToDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}

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
        const file=input.files?.[0];if(!file)return;
        state.participants[i].image=await fileToDataURL(file);
      }else if(field==='votes') state.participants[i].votes=Math.max(0,Number(input.value)||0);
      else state.participants[i][field]=input.value;
      persist();renderEditors();
    }));
    el.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>{
      state.participants[i].votes=Math.max(0,(Number(state.participants[i].votes)||0)+Number(btn.dataset.add));
      persist();renderEditors();
    }));
  });
}

function bindGiftEditors(){
  document.querySelectorAll('.gift-editor').forEach(el=>{
    const i=Number(el.dataset.gift);
    el.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{
      const f=input.dataset.field;
      state.gifts[i][f]=f==='value'?Math.max(1,Number(input.value)||1):input.value;
      persist();renderEditors();
    }));
  });
}

$('titleInput').addEventListener('change',()=>{state.title=$('titleInput').value.trim()||'Batalha ao vivo';persist()});
$('countSelect').addEventListener('change',()=>{state.count=Number($('countSelect').value);persist();renderEditors()});
$('roundInput').addEventListener('change',()=>{state.round=Math.max(1,Number($('roundInput').value)||1);persist()});
$('resetVotes').addEventListener('click',()=>{state.participants.forEach(p=>p.votes=0);persist();renderEditors()});
$('resetAll').addEventListener('click',()=>{state=resetState();renderEditors()});

onStateChange(next=>{state={...state,...next};renderEditors()});
renderEditors();
