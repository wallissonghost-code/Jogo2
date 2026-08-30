(()=>{
  'use strict';

  const VERSION_KEY='jogo2-app-version';
  const VERSION_URL='./version.json?ts='+Date.now();
  const LOCAL_STYLES=['./assets/styles.css','./assets/liveplus.css','./assets/timer.css','./assets/game-viewport.css','./assets/ui-polish.css'];
  const LOCAL_SCRIPTS=['./js/liveplus-game-session.js','./js/timer.js','./js/ui-polish.js'];

  function syncViewport(){
    const vv=window.visualViewport;
    const h=Math.max(320,Math.round(vv?.height||window.innerHeight||document.documentElement.clientHeight||0));
    const w=Math.max(280,Math.round(vv?.width||window.innerWidth||document.documentElement.clientWidth||0));
    document.documentElement.style.setProperty('--app-vh',h+'px');
    document.documentElement.style.setProperty('--app-vw',w+'px');
  }
  syncViewport();
  window.visualViewport?.addEventListener('resize',syncViewport,{passive:true});
  window.visualViewport?.addEventListener('scroll',syncViewport,{passive:true});
  window.addEventListener('resize',syncViewport,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(syncViewport,120),{passive:true});

  function withVersion(path,version){
    const u=new URL(path,location.href);
    u.searchParams.set('v',version);
    return u.href;
  }

  function loadStyle(href){
    return new Promise((resolve,reject)=>{
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href=href;
      link.onload=()=>resolve();
      link.onerror=()=>reject(new Error('Falha ao carregar '+href));
      document.head.appendChild(link);
    });
  }

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=src;
      script.onload=()=>resolve();
      script.onerror=()=>reject(new Error('Falha ao carregar '+src));
      document.body.appendChild(script);
    });
  }

  async function clearSiteCaches(){
    if(!('caches' in window))return;
    try{
      const keys=await caches.keys();
      await Promise.all(keys.map(key=>caches.delete(key)));
    }catch{}
  }

  async function boot(){
    let version='Beta0.0.9';
    try{
      const response=await fetch(VERSION_URL,{cache:'no-store',headers:{'cache-control':'no-cache'}});
      if(response.ok){
        const data=await response.json();
        if(data&&typeof data.version==='string'&&data.version.trim())version=data.version.trim();
      }
    }catch{}

    window.JOGO2_VERSION=version;
    const versionEl=document.getElementById('appVersion');
    if(versionEl)versionEl.textContent=version;

    let previous='';
    try{previous=localStorage.getItem(VERSION_KEY)||''}catch{}
    const url=new URL(location.href);
    const urlVersion=url.searchParams.get('v')||'';

    if(previous!==version||urlVersion!==version){
      try{localStorage.setItem(VERSION_KEY,version)}catch{}
      await clearSiteCaches();
      url.searchParams.set('v',version);
      url.searchParams.set('refresh',Date.now().toString());
      location.replace(url.toString());
      return;
    }

    await Promise.all(LOCAL_STYLES.map(path=>loadStyle(withVersion(path,version))));
    await loadScript('https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js');
    for(const path of LOCAL_SCRIPTS)await loadScript(withVersion(path,version));
    await import(withVersion('./js/live.js',version));
    syncViewport();
  }

  boot().catch(error=>{
    console.error('[Jogo2 bootstrap]',error);
    const el=document.getElementById('universalStatus');
    if(el){el.textContent='Falha ao carregar '+(window.JOGO2_VERSION||'versão');el.dataset.kind='err'}
  });
})();