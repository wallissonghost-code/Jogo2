(()=>{'use strict';
const SDK=window.LivePlusGameSDK;
if(!SDK?.Session)throw new Error('Live+ Game SDK v1 não carregou.');
function compactJogo2State(state={}){
  try{
    const copy=JSON.parse(JSON.stringify(state));
    const compact=list=>Array.isArray(list)?list.map(p=>({...p,image:p?.image?'[stored]':'',hasImage:!!p?.image})):list;
    if(copy.state?.participants)copy.state.participants=compact(copy.state.participants);
    if(copy.participants)copy.participants=compact(copy.participants);
    return copy;
  }catch{return state}
}
class Jogo2LivePlusSession extends SDK.Session{
  constructor(options={}){super({...options,stateTransformer:compactJogo2State})}
}
window.LivePlusGameSession=Jogo2LivePlusSession;
SDK.installPasteBridge('panelCode');
window.addEventListener('pageshow',()=>SDK.installPasteBridge('panelCode'));
window.Jogo2LivePlusAdapter={version:'1.0.1',sdkVersion:SDK.version};
})();