(()=>{
  'use strict';
  function fitVotes(){
    document.querySelectorAll('.vote-number').forEach(el=>{
      const raw=String(el.textContent||'').replace(/\D/g,'');
      const len=raw.length;
      el.classList.remove('vote-fit-1','vote-fit-2','vote-fit-3','vote-fit-4');
      el.classList.add(len<=4?'vote-fit-1':len<=6?'vote-fit-2':len<=8?'vote-fit-3':'vote-fit-4');
      if(raw)el.title=Number(raw).toLocaleString('pt-BR')+' votos';
    });
  }
  const observer=new MutationObserver(()=>requestAnimationFrame(fitVotes));
  function init(){
    fitVotes();
    const grid=document.getElementById('battleGrid');
    if(grid)observer.observe(grid,{childList:true,subtree:true,characterData:true});
    window.addEventListener('resize',fitVotes,{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
