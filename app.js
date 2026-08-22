const $=id=>document.getElementById(id);
const state={count:2,candidates:[
  {name:'Candidato A',votes:0,image:''},
  {name:'Candidato B',votes:0,image:''},
  {name:'Candidato C',votes:0,image:''},
  {name:'Candidato D',votes:0,image:''}
]};

function totalVotes(){return state.candidates.slice(0,state.count).reduce((s,c)=>s+c.votes,0)||1}
function renderStage(){
  const stage=$('battleStage');
  stage.style.setProperty('--count',state.count);
  stage.innerHTML='';
  const total=totalVotes();
  state.candidates.slice(0,state.count).forEach((c,i)=>{
    const card=document.createElement('article');card.className='candidate';
    const photo=document.createElement('div');photo.className='candidate-photo';
    if(c.image){const img=document.createElement('img');img.src=c.image;img.alt=c.name;photo.appendChild(img)}
    else{const ph=document.createElement('div');ph.className='placeholder';ph.textContent=String.fromCharCode(65+i);photo.appendChild(ph)}
    const name=document.createElement('div');name.className='candidate-name';name.textContent=c.name;
    const votes=document.createElement('div');votes.className='vote-line';votes.innerHTML=`${c.votes.toLocaleString('pt-BR')}<span>VOTOS</span>`;
    const progress=document.createElement('div');progress.className='vote-progress';const fill=document.createElement('div');fill.style.width=`${Math.max(3,(c.votes/total)*100)}%`;progress.appendChild(fill);
    card.append(photo,name,votes,progress);stage.appendChild(card);
  });
}

function buildEditor(){
  const wrap=$('candidateEditor');wrap.innerHTML='';
  state.candidates.slice(0,state.count).forEach((c,i)=>{
    const card=document.createElement('section');card.className='editor-card';
    card.innerHTML=`<h3>Participante ${i+1}</h3><div class="editor-row"><label>Nome<input data-name="${i}" value="${c.name}"></label><label>Votos<input data-votes="${i}" type="number" min="0" step="1" value="${c.votes}"></label></div><label style="display:block;margin-top:10px">Foto<input data-image="${i}" type="file" accept="image/png,image/jpeg,image/webp"></label><div class="vote-buttons"><button type="button" data-add="1" data-index="${i}">🌹 +1</button><button type="button" data-add="10" data-index="${i}">🎵 +10</button><button type="button" data-add="100" data-index="${i}">🎁 +100</button></div>`;
    wrap.appendChild(card);
  });
  wrap.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>{const i=+btn.dataset.index;state.candidates[i].votes+=+btn.dataset.add;const v=wrap.querySelector(`[data-votes="${i}"]`);if(v)v.value=state.candidates[i].votes;renderStage()}));
  wrap.querySelectorAll('[data-image]').forEach(input=>input.addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const i=+input.dataset.image;if(state.candidates[i].image)URL.revokeObjectURL(state.candidates[i].image);state.candidates[i].image=URL.createObjectURL(file);renderStage()}));
}

function applyEdits(){
  document.querySelectorAll('[data-name]').forEach(el=>{const i=+el.dataset.name;state.candidates[i].name=el.value.trim()||`Participante ${i+1}`});
  document.querySelectorAll('[data-votes]').forEach(el=>{const i=+el.dataset.votes;state.candidates[i].votes=Math.max(0,Math.floor(Number(el.value)||0))});
  renderStage();
}
function openPanel(){ $('controlPanel').classList.add('open');$('controlPanel').setAttribute('aria-hidden','false');$('panelBackdrop').hidden=false }
function closePanel(){ $('controlPanel').classList.remove('open');$('controlPanel').setAttribute('aria-hidden','true');$('panelBackdrop').hidden=true }

$('togglePanel').addEventListener('click',openPanel);$('closePanel').addEventListener('click',closePanel);$('panelBackdrop').addEventListener('click',closePanel);
$('candidateCount').addEventListener('change',e=>{state.count=Math.max(2,Math.min(4,+e.target.value||2));buildEditor();renderStage()});
$('applyBtn').addEventListener('click',()=>{applyEdits();closePanel()});
$('resetVotesBtn').addEventListener('click',()=>{state.candidates.forEach(c=>c.votes=0);buildEditor();renderStage()});

buildEditor();renderStage();