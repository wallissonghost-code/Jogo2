import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = s => document.querySelector(s);
const gameRoot = $('#game');
const statusEl = $('#status');
const promptEl = $('#prompt');
const useButton = $('#action-use');
const fireButton = $('#action-fire');
const weaponButton = $('#action-weapon');
const runButton = $('#action-run');
const crouchButton = $('#action-crouch');
const weaponNameEl = $('#weapon-name');
const weaponHudEl = $('#weapon-hud');
const crosshairEl = $('#crosshair');
const npcCard = $('#npc-card');
const npcNameEl = $('#npc-name');
const npcStateEl = $('#npc-state');
const npcMemoryEl = $('#npc-memory');
const carControls = $('#car-controls');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fb6cc);
scene.fog = new THREE.Fog(0x8fb6cc, 95, 250);

const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.06, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 1000 ? 1.25 : 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
gameRoot.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x657153, 1.55));
const sun = new THREE.DirectionalLight(0xfff3dc, 2.25);
sun.position.set(55, 85, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(innerWidth < 1000 ? 1024 : 2048, innerWidth < 1000 ? 1024 : 2048);
sun.shadow.camera.left = -95; sun.shadow.camera.right = 95;
sun.shadow.camera.top = 95; sun.shadow.camera.bottom = -95;
sun.shadow.bias = -0.0007;
scene.add(sun);

const mat = (color, roughness=.9, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
const roadMat = mat(0x2e3438,.97), sidewalkMat = mat(0xaeb0a8,.98), curbMat = mat(0xd1d0c5,.95);
const grassMat = mat(0x54784b,1), whiteMat = mat(0xf4f2e5,.78), yellowMat = mat(0xe6bd39,.76);
const blackMat = mat(0x111316,.75), poleMat = mat(0x272c31,.72,.15);

function box(w,h,d,m,x=0,y=0,z=0){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;}

const ROAD_CENTERS=[-60,0,60], BLOCK_CENTERS=[-90,-30,30,90];
const ROAD_HALF=9;
const pedestrianNodes=[];
const crossingSegments=[];
const trafficLights=[];

function addCrosswalk(cx,cz,axis){
  const stripes=6;
  for(let i=0;i<stripes;i++){
    const offset=(i-(stripes-1)/2)*1.2;
    const stripe=axis==='x'?box(.62,.025,7.1,whiteMat,cx+offset,.052,cz):box(7.1,.025,.62,whiteMat,cx,.052,cz+offset);
    stripe.castShadow=false; scene.add(stripe);
  }
}
function addTrafficLight(x,z,rot=0){
  const g=new THREE.Group();
  const pole=box(.22,3.2,.22,poleMat,0,1.6,0); g.add(pole);
  const arm=box(2.6,.16,.16,poleMat,1.18,3.05,0); g.add(arm);
  const head=box(.48,1.1,.42,blackMat,2.25,2.78,0); g.add(head);
  const red=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),mat(0x5d0d0d,.45)); red.position.set(2.25,3.08,-.23);
  const green=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),mat(0x0d5d25,.45)); green.position.set(2.25,2.53,-.23);
  g.add(red,green); g.position.set(x,.12,z); g.rotation.y=rot; scene.add(g);
  trafficLights.push({red,green,phase:Math.random()*8});
}
function createWorld(){
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,240),grassMat); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
  for(const x of ROAD_CENTERS){const r=new THREE.Mesh(new THREE.PlaneGeometry(18,240),roadMat);r.rotation.x=-Math.PI/2;r.position.set(x,.012,0);r.receiveShadow=true;scene.add(r);}
  for(const z of ROAD_CENTERS){const r=new THREE.Mesh(new THREE.PlaneGeometry(240,18),roadMat);r.rotation.x=-Math.PI/2;r.position.set(0,.014,z);r.receiveShadow=true;scene.add(r);}
  for(const x of ROAD_CENTERS)for(let z=-112;z<=112;z+=10){if(ROAD_CENTERS.some(c=>Math.abs(z-c)<12))continue;const d=box(.16,.02,4.5,yellowMat,x,.045,z);d.castShadow=false;scene.add(d);}
  for(const z of ROAD_CENTERS)for(let x=-112;x<=112;x+=10){if(ROAD_CENTERS.some(c=>Math.abs(x-c)<12))continue;const d=box(4.5,.02,.16,yellowMat,x,.046,z);d.castShadow=false;scene.add(d);}

  for(const x of ROAD_CENTERS)for(const z of ROAD_CENTERS){
    addCrosswalk(x,z-12,'x'); addCrosswalk(x,z+12,'x'); addCrosswalk(x-12,z,'z'); addCrosswalk(x+12,z,'z');
    addTrafficLight(x-13.2,z-13.2,0); addTrafficLight(x+13.2,z+13.2,Math.PI);
    addTrafficLight(x-13.2,z+13.2,-Math.PI/2); addTrafficLight(x+13.2,z-13.2,Math.PI/2);
  }

  const buildingColors=[0x948572,0x6f7c85,0xb3a67d,0x806e67,0x9ca4a7,0x8f9278];
  for(let bx=0;bx<BLOCK_CENTERS.length;bx++)for(let bz=0;bz<BLOCK_CENTERS.length;bz++){
    const x=BLOCK_CENTERS[bx],z=BLOCK_CENTERS[bz];
    const sw=box(42,.18,42,sidewalkMat,x,.08,z);sw.castShadow=false;scene.add(sw);
    [box(42,.26,.35,curbMat,x,.13,z-20.8),box(42,.26,.35,curbMat,x,.13,z+20.8),box(.35,.26,42,curbMat,x-20.8,.13,z),box(.35,.26,42,curbMat,x+20.8,.13,z)].forEach(c=>{c.castShadow=false;scene.add(c)});
    const count=2+Math.floor(Math.random()*3);
    for(let i=0;i<count;i++){
      const w=10+Math.random()*7,d=10+Math.random()*7,h=10+Math.random()*28;
      const px=x+(Math.random()-.5)*18,pz=z+(Math.random()-.5)*18;
      scene.add(box(w,h,d,mat(buildingColors[Math.floor(Math.random()*buildingColors.length)],.93),px,h/2+.18,pz));
    }
    const ring=[[-18,-18],[0,-18],[18,-18],[18,0],[18,18],[0,18],[-18,18],[-18,0]];
    ring.forEach(([ox,oz])=>pedestrianNodes.push({bx,bz,pos:new THREE.Vector3(x+ox,.18,z+oz)}));
    const treeSpots=[[-18,-8],[-18,8],[18,-8],[18,8],[-8,-18],[8,-18],[-8,18],[8,18]];
    for(const [ox,oz] of treeSpots){if(Math.random()<.46){const trunk=box(.34,2.1,.34,mat(0x5a3d26),x+ox,1.2,z+oz);const crown=new THREE.Mesh(new THREE.SphereGeometry(1.15,9,7),mat(0x315f34));crown.position.set(x+ox,3.15,z+oz);scene.add(trunk,crown);}}
  }
}
createWorld();

function makePerson(color=0x20252d,skin=0xd2a27e){
  const g=new THREE.Group();
  const torso=box(.72,1.08,.38,mat(color),0,1.22,0);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.29,14,10),mat(skin));head.position.y=2.0;head.castShadow=true;
  const lm=mat(0x202733);const ll=box(.25,.82,.27,lm,-.19,.43,0),rl=box(.25,.82,.27,lm,.19,.43,0);
  const la=box(.19,.9,.2,mat(color),-.46,1.25,0),ra=box(.19,.9,.2,mat(color),.46,1.25,0);
  g.add(torso,head,ll,rl,la,ra);g.userData.parts={torso,head,ll,rl,la,ra};return g;
}

const player=makePerson(0x171b21,0xc98e6c);player.position.set(18,.18,18);scene.add(player);
const gun=new THREE.Group();gun.add(box(.11,.13,.7,mat(0x151515,.5,.18),0,0,-.32));gun.add(box(.11,.31,.13,mat(0x202020),0,-.15,-.03));gun.position.set(.48,1.35,-.22);player.add(gun);gun.visible=false;

let weapon='fist', crouched=false, running=false, health=100, money=1250;
const keys={}, clock=new THREE.Clock();
let orbitYaw=Math.PI,orbitPitch=.2,cameraDistance=5.5,dragging=false,lastPointer={x:0,y:0};
let currentVehicle=null,lastShot=-99,inspectedNpc=null;
let joystick={x:0,y:0};

function setWeapon(next){weapon=next;gun.visible=weapon==='pistol'&&!currentVehicle;weaponNameEl.textContent=weapon==='pistol'?'Pistola':'Soco';weaponHudEl.firstChild.textContent=weapon==='pistol'?'🔫 ':'👊 ';weaponButton.textContent=weapon==='pistol'?'SOCO':'ARMA';fireButton.textContent=weapon==='pistol'?'ATIRAR':'SOCAR';crosshairEl.classList.toggle('hidden',weapon!=='pistol'||!!currentVehicle);updateStatus();}
function toggleCrouch(){if(currentVehicle)return;crouched=!crouched;crouchButton.classList.toggle('active-action',crouched);player.scale.y=crouched?.72:1;updateStatus();}
function updateStatus(){statusEl.textContent=currentVehicle?'Dirigindo':`${crouched?'Agachado':running?'Correndo':'A pé'} • ${weapon==='pistol'?'Pistola':'Soco'}`;}

const savedBrains=JSON.parse(localStorage.getItem('jogo2_npc_brains')||'{}');
const npcNames=['Maya','Davi','Luna','Rico','Bia','Theo','Nina','Caio','Jade','Noah','Liz','Ivo'];
const npcColors=[0xb33b3b,0x315f95,0x5f3a81,0x496b45,0xc17a35,0x444a55,0x7e3f62];
const npcs=[];

function nodeIndex(bx,bz,slot){return (bx*4+bz)*8+slot;}
function buildPedRoute(fromBX,fromBZ){
  const route=[];let bx=fromBX,bz=fromBZ;
  if(Math.random()<.72){const slots=[0,1,2,3,4,5,6,7];for(let i=0;i<3;i++)route.push(pedestrianNodes[nodeIndex(bx,bz,slots[Math.floor(Math.random()*8)])].pos.clone());return{route,bx,bz};}
  const dirs=[];if(bx>0)dirs.push([-1,0]);if(bx<3)dirs.push([1,0]);if(bz>0)dirs.push([0,-1]);if(bz<3)dirs.push([0,1]);
  const [dx,dz]=dirs[Math.floor(Math.random()*dirs.length)];const nbx=bx+dx,nbz=bz+dz;
  if(dx!==0){const roadX=(BLOCK_CENTERS[bx]+BLOCK_CENTERS[nbx])/2;const crossZ=BLOCK_CENTERS[bz]+(Math.random()<.5?-12:12);route.push(new THREE.Vector3(roadX-dx*11,.18,crossZ),new THREE.Vector3(roadX,.055,crossZ),new THREE.Vector3(roadX+dx*11,.18,crossZ));}
  else{const roadZ=(BLOCK_CENTERS[bz]+BLOCK_CENTERS[nbz])/2;const crossX=BLOCK_CENTERS[bx]+(Math.random()<.5?-12:12);route.push(new THREE.Vector3(crossX,.18,roadZ-dz*11),new THREE.Vector3(crossX,.055,roadZ),new THREE.Vector3(crossX,.18,roadZ+dz*11));}
  route.push(pedestrianNodes[nodeIndex(nbx,nbz,Math.floor(Math.random()*8))].pos.clone());return{route,bx:nbx,bz:nbz};
}
class Citizen{
  constructor(name,i){this.name=name;this.group=makePerson(npcColors[i%npcColors.length],[0xd2a27e,0x8d5c45,0xe0b18c][i%3]);this.bx=Math.floor(Math.random()*4);this.bz=Math.floor(Math.random()*4);this.group.position.copy(pedestrianNodes[nodeIndex(this.bx,this.bz,Math.floor(Math.random()*8))].pos);this.group.userData.npc=this;this.group.traverse(o=>o.userData.npc=this);scene.add(this.group);this.hp=100;this.state='andando na calçada';this.speed=1.25+Math.random()*.5;this.route=[];this.target=null;this.memory=savedBrains[name]?.memory||[];this.relationships=savedBrains[name]?.relationships||{};this.socialTimer=0;this.chooseRoute();}
  chooseRoute(){const r=buildPedRoute(this.bx,this.bz);this.route=r.route;this.bx=r.bx;this.bz=r.bz;this.target=this.route.shift();this.state='andando na calçada';}
  remember(type,text,actor=null,weight=1){this.memory.unshift({type,text,actor,weight,at:Date.now()});this.memory=this.memory.slice(0,18);}
  update(dt){if(this.hp<=0)return;this.socialTimer=Math.max(0,this.socialTimer-dt);if(!this.target||this.group.position.distanceTo(this.target)<.45){this.target=this.route.shift();if(!this.target)this.chooseRoute();}
    const dir=this.target.clone().sub(this.group.position);dir.y=0;if(dir.lengthSq()>.02){dir.normalize();this.group.position.addScaledVector(dir,this.speed*dt);this.group.rotation.y=Math.atan2(dir.x,dir.z);}
    if(this.socialTimer<=0)for(const o of npcs){if(o===this||o.hp<=0)continue;if(this.group.position.distanceTo(o.group.position)<1.8){this.socialTimer=8;this.remember('social',`Encontrou ${o.name} durante o passeio.`,o.name,2);break;}}
  }
  hit(dmg){if(this.hp<=0)return;this.hp-=dmg;this.remember('danger',`Foi atacado pelo jogador e perdeu ${dmg} de vida.`,'Jogador',10);if(this.hp<=0){this.hp=0;this.state='caído';this.group.rotation.z=Math.PI/2;this.group.position.y=.4;}else this.state='assustado';}
}
npcNames.forEach((n,i)=>npcs.push(new Citizen(n,i)));

class Car{
  constructor(color,x,z,rot=0){this.group=new THREE.Group();this.body=box(1.85,.62,3.9,mat(color,.58,.12),0,.66,0);this.hood=box(1.72,.35,1.25,mat(color,.58,.12),0,1.0,1.25);this.cabin=box(1.68,.78,1.75,mat(0x77909d,.3,.05),0,1.28,-.25);this.group.add(this.body,this.hood,this.cabin);for(const sx of[-1,1])for(const sz of[-1,1]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.25,12),blackMat);w.rotation.z=Math.PI/2;w.position.set(sx*.96,.4,sz*1.22);this.group.add(w);}this.group.position.set(x,.03,z);this.group.rotation.y=rot;this.speed=0;scene.add(this.group);}
  update(dt){if(currentVehicle!==this)return;const gas=(keys.KeyW?1:0)+(keys.DriveGas?1:0),brake=(keys.KeyS?1:0)+(keys.DriveBrake?1:0),steer=((keys.KeyA||keys.DriveLeft)?1:0)-((keys.KeyD||keys.DriveRight)?1:0);this.speed+=(gas-brake)*dt*9.5;this.speed*=Math.pow(.984,dt*60);this.speed=THREE.MathUtils.clamp(this.speed,-5,17);if(Math.abs(this.speed)>.25)this.group.rotation.y+=steer*dt*1.4*Math.sign(this.speed);const f=new THREE.Vector3(Math.sin(this.group.rotation.y),0,Math.cos(this.group.rotation.y));this.group.position.addScaledVector(f,this.speed*dt);
    for(const n of npcs){if(n.hp<=0)continue;if(this.group.position.distanceTo(n.group.position)<1.35&&Math.abs(this.speed)>3.5){n.hit(Math.round(Math.min(100,Math.abs(this.speed)*7)));this.speed*=.45;}}
  }
}
const cars=[new Car(0xc62b2f,12,-4,0),new Car(0x245b82,-52,8,Math.PI/2),new Car(0xd08a26,67,-8,0),new Car(0x30343a,-7,62,Math.PI/2)];
function nearestCar(){return cars.map(car=>({car,d:car.group.position.distanceTo(player.position)})).sort((a,b)=>a.d-b.d)[0];}
function nearestNpc(ref=player.position){return npcs.filter(n=>n.hp>0).map(npc=>({npc,d:npc.group.position.distanceTo(ref)})).sort((a,b)=>a.d-b.d)[0];}
function toggleVehicle(){if(currentVehicle){const side=new THREE.Vector3(Math.cos(currentVehicle.group.rotation.y),0,-Math.sin(currentVehicle.group.rotation.y));player.position.copy(currentVehicle.group.position).addScaledVector(side,2.2);player.position.y=.18;player.visible=true;currentVehicle.cabin.visible=true;currentVehicle=null;useButton.textContent='ENTRAR';carControls.classList.add('hidden');$('#joystick').classList.remove('hidden');$('.left-actions').classList.remove('hidden');gun.visible=weapon==='pistol';setWeapon(weapon);return;}const near=nearestCar();if(near&&near.d<4){currentVehicle=near.car;player.visible=false;gun.visible=false;currentVehicle.cabin.visible=false;useButton.textContent='SAIR';carControls.classList.remove('hidden');$('#joystick').classList.add('hidden');$('.left-actions').classList.add('hidden');crosshairEl.classList.add('hidden');updateStatus();}}

const raycaster=new THREE.Raycaster();
function primaryAction(){if(currentVehicle)return;if(weapon==='pistol')shoot();else punch();}
function shoot(){if(clock.elapsedTime-lastShot<.22)return;lastShot=clock.elapsedTime;raycaster.setFromCamera(new THREE.Vector2(0,0),camera);const hits=raycaster.intersectObjects(npcs.flatMap(n=>n.group.children),false);if(hits[0]?.object.userData.npc)hits[0].object.userData.npc.hit(34);for(const n of npcs)if(n.hp>0&&n.group.position.distanceTo(player.position)<26)n.remember('danger','Ouviu um disparo próximo.','Jogador',4);}
function punch(){const near=nearestNpc();if(near&&near.d<1.7){near.npc.hit(16);near.npc.remember('danger','Levou um soco do jogador.','Jogador',6);}const arm=player.userData.parts.ra;arm.rotation.x=-1.2;setTimeout(()=>arm.rotation.x=0,140);}

function updatePlayer(dt){if(currentVehicle)return;const kbX=(keys.KeyD?1:0)-(keys.KeyA?1:0),kbY=(keys.KeyW?1:0)-(keys.KeyS?1:0);const ix=Math.abs(joystick.x)>Math.abs(kbX)?joystick.x:kbX,iy=Math.abs(joystick.y)>Math.abs(kbY)?joystick.y:kbY;running=!!(keys.ShiftLeft||keys.ShiftRight||keys.MobileRun);runButton.classList.toggle('active-action',running);if(!ix&&!iy){updateStatus();return;}const cf=new THREE.Vector3(-Math.sin(orbitYaw),0,-Math.cos(orbitYaw)).normalize();const cr=new THREE.Vector3(cf.z,0,-cf.x);const mv=cf.multiplyScalar(iy).add(cr.multiplyScalar(ix));if(mv.lengthSq()>1)mv.normalize();let speed=crouched?2.1:running?7.0:4.1;player.position.addScaledVector(mv,dt*speed);player.position.x=THREE.MathUtils.clamp(player.position.x,-112,112);player.position.z=THREE.MathUtils.clamp(player.position.z,-112,112);player.rotation.y=Math.atan2(mv.x,mv.z);updateStatus();}
function updateCamera(){if(currentVehicle){const localPos=new THREE.Vector3(-.38,1.52,.05);const worldPos=currentVehicle.group.localToWorld(localPos.clone());const lookLocal=new THREE.Vector3(-.18,1.42,10);const look=currentVehicle.group.localToWorld(lookLocal.clone());camera.position.lerp(worldPos,.3);camera.lookAt(look);return;}const target=player.position.clone().add(new THREE.Vector3(0,crouched?1.0:1.48,0));const horizontal=Math.cos(orbitPitch)*cameraDistance;const offset=new THREE.Vector3(Math.sin(orbitYaw)*horizontal,Math.sin(orbitPitch)*cameraDistance+1.0,Math.cos(orbitYaw)*horizontal);camera.position.lerp(target.clone().add(offset),.22);camera.lookAt(target);}
function updateTrafficLights(t){for(const l of trafficLights){const green=((t+l.phase)%10)<6;l.green.material.color.setHex(green?0x25d45c:0x0d451e);l.red.material.color.setHex(green?0x501010:0xff3030);}}
function updatePrompt(){if(currentVehicle){promptEl.textContent='E • sair do carro';return;}const c=nearestCar();if(c&&c.d<4){promptEl.textContent='E • entrar no carro';return;}const n=nearestNpc();promptEl.textContent=n&&n.d<7?`Q • memória de ${n.npc.name}`:'';}
function inspectMemory(){const n=nearestNpc(currentVehicle?currentVehicle.group.position:player.position);if(!n||n.d>8){npcCard.classList.add('hidden');inspectedNpc=null;return;}inspectedNpc=n.npc;npcCard.classList.remove('hidden');refreshMemory();}
function refreshMemory(){if(!inspectedNpc)return;npcNameEl.textContent=`${inspectedNpc.name} • HP ${inspectedNpc.hp}`;npcStateEl.textContent=inspectedNpc.state;npcMemoryEl.innerHTML=inspectedNpc.memory.length?inspectedNpc.memory.slice(0,7).map(m=>`<div class="memory-item">${escapeHtml(m.text)}</div>`).join(''):'<div class="memory-item">Sem lembranças importantes ainda.</div>';}
function escapeHtml(v){return v.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function saveBrains(){const d={};for(const n of npcs)d[n.name]={memory:n.memory,relationships:n.relationships};localStorage.setItem('jogo2_npc_brains',JSON.stringify(d));}
setInterval(saveBrains,9000);addEventListener('beforeunload',saveBrains);

addEventListener('keydown',e=>{keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyE')toggleVehicle();if(e.code==='KeyQ')inspectMemory();if(e.code==='KeyF')setWeapon(weapon==='pistol'?'fist':'pistol');if(e.code==='KeyC')toggleCrouch();});
addEventListener('keyup',e=>keys[e.code]=false);
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button===2||(e.pointerType==='touch'&&e.clientX>innerWidth*.38)){dragging=true;lastPointer={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture?.(e.pointerId);}else if(e.button===0&&e.pointerType!=='touch')primaryAction();});
renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;orbitYaw-=(e.clientX-lastPointer.x)*.006;orbitPitch=THREE.MathUtils.clamp(orbitPitch+(e.clientY-lastPointer.y)*.004,-.02,.72);lastPointer={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{dragging=false;renderer.domElement.releasePointerCapture?.(e.pointerId)});
renderer.domElement.addEventListener('wheel',e=>cameraDistance=THREE.MathUtils.clamp(cameraDistance+e.deltaY*.008,4.1,10),{passive:true});

fireButton.addEventListener('pointerdown',e=>{e.preventDefault();primaryAction()});
weaponButton.addEventListener('pointerdown',e=>{e.preventDefault();setWeapon(weapon==='pistol'?'fist':'pistol')});
useButton.addEventListener('pointerdown',e=>{e.preventDefault();toggleVehicle()});
$('#action-memory').addEventListener('pointerdown',e=>{e.preventDefault();inspectMemory()});
runButton.addEventListener('pointerdown',e=>{e.preventDefault();keys.MobileRun=!keys.MobileRun;runButton.classList.toggle('active-action',keys.MobileRun)});
crouchButton.addEventListener('pointerdown',e=>{e.preventDefault();toggleCrouch()});

const joy=$('#joystick'),knob=$('#joystick-knob');
function joyMove(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.33,len=Math.hypot(dx,dy)||1;if(len>max){dx=dx/len*max;dy=dy/len*max;}joystick.x=dx/max;joystick.y=-dy/max;knob.style.transform=`translate(${dx}px,${dy}px)`;}
joy.addEventListener('pointerdown',e=>{e.preventDefault();joy.setPointerCapture?.(e.pointerId);joyMove(e)});joy.addEventListener('pointermove',e=>{if(joy.hasPointerCapture?.(e.pointerId))joyMove(e)});function joyEnd(e){joystick.x=joystick.y=0;knob.style.transform='translate(0,0)';joy.releasePointerCapture?.(e.pointerId)}joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);

for(const b of document.querySelectorAll('[data-drive]')){const k={left:'DriveLeft',right:'DriveRight',gas:'DriveGas',brake:'DriveBrake'}[b.dataset.drive];const on=e=>{e.preventDefault();keys[k]=true},off=e=>{e.preventDefault();keys[k]=false};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);}

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<1000?1.25:1.6));});

function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.045);updatePlayer(dt);for(const c of cars)c.update(dt);for(const n of npcs)n.update(dt);updateCamera();updateTrafficLights(clock.elapsedTime);updatePrompt();if(inspectedNpc)refreshMemory();renderer.render(scene,camera);}
setWeapon('fist');updateCamera();animate();