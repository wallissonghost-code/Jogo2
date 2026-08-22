import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0d12);
const camera = new THREE.PerspectiveCamera(40,1,.01,100);
camera.position.set(3.2,2.1,5.5);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
$('viewer').appendChild(renderer.domElement);
const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.target.set(0,1.25,0);
scene.add(new THREE.HemisphereLight(0xffffff,0x293342,2.5));
const key = new THREE.DirectionalLight(0xffffff,3); key.position.set(4,6,5); key.castShadow=true; scene.add(key);
const rim = new THREE.DirectionalLight(0x6aa8ff,1.2); rim.position.set(-4,3,-4); scene.add(rim);
const floor = new THREE.Mesh(new THREE.CircleGeometry(2.2,64),new THREE.MeshStandardMaterial({color:0x10151c,roughness:1})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
const grid = new THREE.GridHelper(8,20,0x2b3440,0x171c23); grid.position.y=.002; scene.add(grid);

const matBody = new THREE.MeshStandardMaterial({color:0x20252c,roughness:.72,metalness:.05});
const matAccent = new THREE.MeshStandardMaterial({color:0x4d5968,roughness:.72,metalness:.05});
const character = new THREE.Group(); character.name='Character'; scene.add(character);
const rig = new THREE.Group(); rig.name='Skeleton'; character.add(rig);
const bones = {};
const meshes=[];
let currentAnim='idle', animating=true, clock=new THREE.Clock(), texture=null;
const defaults={height:1,headScale:1,shoulder:1,torso:1,arms:1,legs:1,hands:1,feet:1};
const params={...defaults};

function bone(name,parent,pos=[0,0,0]){const g=new THREE.Group();g.name=name;g.position.set(...pos);(parent||rig).add(g);bones[name]=g;return g}
function mesh(name,geo,mat,parent,pos=[0,0,0],scale=[1,1,1]){const m=new THREE.Mesh(geo,mat);m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);meshes.push(m);return m}
function capsule(r,len){return new THREE.CapsuleGeometry(r,len,8,16)}
function box(x,y,z,r=.08){return new THREE.BoxGeometry(x,y,z,2,2,2).translate(0,0,0)}

function buildCharacter(){
  while(rig.children.length) rig.remove(rig.children[0]); meshes.length=0; Object.keys(bones).forEach(k=>delete bones[k]);
  const root=bone('Root',rig,[0,0,0]);
  const hips=bone('Hips',root,[0,1.05,0]);
  const spine=bone('Spine',hips,[0,.38,0]);
  const chest=bone('Chest',spine,[0,.42,0]);
  const neck=bone('Neck',chest,[0,.42,0]);
  const head=bone('Head',neck,[0,.28,0]);
  const shoulderL=bone('Shoulder_L',chest,[-.46,.28,0]);
  const upperArmL=bone('UpperArm_L',shoulderL,[-.18,0,0]);
  const lowerArmL=bone('LowerArm_L',upperArmL,[-.42,0,0]);
  const handL=bone('Hand_L',lowerArmL,[-.36,0,0]);
  const shoulderR=bone('Shoulder_R',chest,[.46,.28,0]);
  const upperArmR=bone('UpperArm_R',shoulderR,[.18,0,0]);
  const lowerArmR=bone('LowerArm_R',upperArmR,[.42,0,0]);
  const handR=bone('Hand_R',lowerArmR,[.36,0,0]);
  const thighL=bone('Thigh_L',hips,[-.2,-.18,0]);
  const shinL=bone('Shin_L',thighL,[0,-.52,0]);
  const footL=bone('Foot_L',shinL,[0,-.48,.08]);
  const thighR=bone('Thigh_R',hips,[.2,-.18,0]);
  const shinR=bone('Shin_R',thighR,[0,-.52,0]);
  const footR=bone('Foot_R',shinR,[0,-.48,.08]);

  mesh('Pelvis',capsule(.25,.22),matAccent,hips,[0,.03,0],[1.25,1,1]);
  mesh('Torso',box(.72,.78,.38),matBody,spine,[0,.35,0]);
  mesh('ChestArmor',box(.82,.36,.43),matAccent,chest,[0,.08,0]);
  mesh('Neck',capsule(.09,.12),matBody,neck,[0,.08,0]);
  mesh('Head',new THREE.SphereGeometry(.24,32,24),matBody,head,[0,.12,0],[.92,1.08,.92]);
  mesh('Face',box(.27,.13,.025),matAccent,head,[0,.12,.22]);

  function arm(side,s){const ua=bones['UpperArm_'+side],la=bones['LowerArm_'+side],h=bones['Hand_'+side];mesh('UpperArm_'+side,capsule(.105,.36),matBody,ua,[s*.2,0,0],[1,1,1]);meshes.at(-1).rotation.z=Math.PI/2;mesh('LowerArm_'+side,capsule(.09,.31),matAccent,la,[s*.17,0,0]);meshes.at(-1).rotation.z=Math.PI/2;mesh('Hand_'+side,new THREE.SphereGeometry(.11,20,16),matBody,h,[s*.07,0,0],[1.05,.85,.8]);}
  arm('L',-1); arm('R',1);
  function leg(side){const t=bones['Thigh_'+side],s=bones['Shin_'+side],f=bones['Foot_'+side];mesh('Thigh_'+side,capsule(.14,.43),matBody,t,[0,-.24,0]);mesh('Shin_'+side,capsule(.12,.4),matAccent,s,[0,-.22,0]);mesh('Foot_'+side,box(.25,.16,.42),matBody,f,[0,-.06,.12]);}
  leg('L'); leg('R');
  applyShape(); populateBoneUI(); updateHierarchy();
}

function applyShape(){
  character.scale.set(params.height,params.height,params.height);
  const h=bones.Head; if(h) h.scale.setScalar(params.headScale);
  if(bones.Shoulder_L&&bones.Shoulder_R){bones.Shoulder_L.position.x=-.46*params.shoulder;bones.Shoulder_R.position.x=.46*params.shoulder}
  const torso=meshes.find(m=>m.name==='Torso'); const chest=meshes.find(m=>m.name==='ChestArmor'); if(torso)torso.scale.set(params.torso,1,params.torso);if(chest)chest.scale.set(params.torso,1,params.torso);
  ['UpperArm_L','UpperArm_R','LowerArm_L','LowerArm_R'].forEach(n=>{if(bones[n]) bones[n].scale.y=1;});
  if(bones.LowerArm_L) bones.LowerArm_L.position.x=-.42*params.arms;if(bones.LowerArm_R)bones.LowerArm_R.position.x=.42*params.arms;
  if(bones.Hand_L)bones.Hand_L.position.x=-.36*params.arms;if(bones.Hand_R)bones.Hand_R.position.x=.36*params.arms;
  ['Hand_L','Hand_R'].forEach(n=>{const m=meshes.find(x=>x.name===n);if(m)m.scale.multiplyScalar(params.hands)});
  ['Thigh_L','Thigh_R','Shin_L','Shin_R'].forEach(n=>{if(bones[n]) bones[n].scale.y=params.legs});
  ['Foot_L','Foot_R'].forEach(n=>{const m=meshes.find(x=>x.name===n);if(m)m.scale.set(params.feet,1,params.feet)});
}

function resetPose(){Object.values(bones).forEach(b=>b.rotation.set(0,0,0));character.position.set(0,0,0)}
function setRot(name,x=0,y=0,z=0){const b=bones[name];if(b)b.rotation.set(x,y,z)}
function animatePose(t){
  resetPose(); const s=+$('animSpeed').value; t*=s;
  if(currentAnim==='idle'){setRot('Chest',0,.03*Math.sin(t*.8),.02*Math.sin(t*.9));character.position.y=.012*Math.sin(t*1.6)}
  if(currentAnim==='walk'){const a=.65*Math.sin(t*4);setRot('Thigh_L',a,0,0);setRot('Thigh_R',-a,0,0);setRot('Shin_L',Math.max(0,-a)*.8,0,0);setRot('Shin_R',Math.max(0,a)*.8,0,0);setRot('Shoulder_L',-a*.55,0,0);setRot('Shoulder_R',a*.55,0,0);character.position.y=Math.abs(Math.sin(t*4))*.025}
  if(currentAnim==='run'){const a=.95*Math.sin(t*6);setRot('Thigh_L',a,0,0);setRot('Thigh_R',-a,0,0);setRot('Shin_L',Math.max(0,-a)*1.2,0,0);setRot('Shin_R',Math.max(0,a)*1.2,0,0);setRot('Shoulder_L',-a*.8,0,0);setRot('Shoulder_R',a*.8,0,0);setRot('Chest',-.15,0,0);character.position.y=Math.abs(Math.sin(t*6))*.045}
  if(currentAnim==='jump'){const p=(Math.sin(t*2)+1)/2;character.position.y=p*.5;setRot('Thigh_L',-.35+p*.65,0,0);setRot('Thigh_R',-.35+p*.65,0,0);setRot('Shin_L',.55-p*.4,0,0);setRot('Shin_R',.55-p*.4,0,0);setRot('Shoulder_L',-1.1+p*.4,0,-.25);setRot('Shoulder_R',-1.1+p*.4,0,.25)}
  if(currentAnim==='wave'){setRot('Shoulder_R',0,0,-1.25);setRot('LowerArm_R',0,0,-1.25);setRot('Hand_R',0,0,.4*Math.sin(t*6));setRot('Head',0,.15,0)}
  if(currentAnim==='attack'){const p=(Math.sin(t*4)+1)/2;setRot('Shoulder_R',-1.1+p*.9,-.15,-.25);setRot('LowerArm_R',-.8+p*.6,0,0);setRot('Chest',0,-.45+p*.9,0);setRot('Shoulder_L',-.5,0,.25)}
}

function resize(){const el=$('viewer'),w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe($('viewer'));addEventListener('resize',resize);
(function loop(){requestAnimationFrame(loop);const t=clock.getElapsedTime();if(animating)animatePose(t);controls.update();renderer.render(scene,camera)})();

function populateBoneUI(){const sel=$('boneSelect');sel.innerHTML='';Object.keys(bones).filter(n=>n!=='Root').forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o)});syncBoneControls()}
function syncBoneControls(){const b=bones[$('boneSelect').value];if(!b)return;[['boneX','x'],['boneY','y'],['boneZ','z']].forEach(([id,k])=>{$(id).value=THREE.MathUtils.radToDeg(b.rotation[k]);$(id+'Out').value=Math.round($(id).value)+'°'})}
function updateHierarchy(){$('tree').innerHTML=`<div class="root">▼ Character</div><div class="child">▼ Mesh 3D</div><div class="grand">Head</div><div class="grand">Torso / Chest</div><div class="grand">Arm L / Arm R</div><div class="grand">Leg L / Leg R</div><div class="child">▼ Skeleton</div><div class="grand">Root → Hips → Spine → Chest</div><div class="grand">Neck → Head</div><div class="grand">Shoulders → Arms → Hands</div><div class="grand">Thighs → Shins → Feet</div><div class="child">▼ Materials</div><div class="grand">BodyMaterial</div><div class="grand">AccentMaterial</div>`;$('meshCount').textContent=meshes.length;$('boneCount').textContent=Object.keys(bones).length}

for(const [id,key,out] of [['height','height','heightOut'],['headScale','headScale','headOut'],['shoulder','shoulder','shoulderOut'],['torso','torso','torsoOut'],['arms','arms','armsOut'],['legs','legs','legsOut'],['hands','hands','handsOut'],['feet','feet','feetOut']]){$(id).addEventListener('input',()=>{params[key]=+$(id).value;$(out).value=(+$(id).value).toFixed(2);applyShape()})}
$('boneSelect').addEventListener('change',()=>{animating=false;syncBoneControls()});
for(const [id,axis] of [['boneX','x'],['boneY','y'],['boneZ','z']]){$(id).addEventListener('input',()=>{animating=false;const b=bones[$('boneSelect').value];if(b)b.rotation[axis]=THREE.MathUtils.degToRad(+$(''+id).value);$(id+'Out').value=$(''+id).value+'°'})}
$('showBones').addEventListener('change',()=>{helper.visible=$('showBones').checked});
$('resetPoseBtn').addEventListener('click',()=>{animating=false;resetPose();syncBoneControls()});

const helper=new THREE.SkeletonHelper(rig);helper.material.depthTest=false;helper.material.transparent=true;helper.material.opacity=.75;scene.add(helper);

document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.tab-page').forEach(p=>p.classList.remove('active'));btn.classList.add('active');$('tab-'+btn.dataset.tab).classList.add('active')});
document.querySelectorAll('.anim').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.anim').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentAnim=btn.dataset.anim;animating=true;clock.start()});
$('stopAnimBtn').onclick=()=>{animating=false;resetPose()};$('animSpeed').oninput=()=>{$('speedOut').value=(+$('animSpeed').value).toFixed(2)+'x'};

document.querySelectorAll('[data-preset]').forEach(btn=>btn.onclick=()=>{const p=btn.dataset.preset;const v=p==='hero'?{height:1.08,headScale:.9,shoulder:1.25,torso:1.12,arms:1.05,legs:1.06,hands:1.05,feet:1.08}:p==='stylized'?{height:.94,headScale:1.25,shoulder:.9,torso:.95,arms:.9,legs:.9,hands:1.15,feet:1.15}:p==='slim'?{height:1.05,headScale:.96,shoulder:.88,torso:.82,arms:1.05,legs:1.08,hands:.95,feet:.95}:{...defaults};Object.assign(params,v);for(const [id,key,out] of [['height','height','heightOut'],['headScale','headScale','headOut'],['shoulder','shoulder','shoulderOut'],['torso','torso','torsoOut'],['arms','arms','armsOut'],['legs','legs','legsOut'],['hands','hands','handsOut'],['feet','feet','feetOut']]){$(id).value=params[key];$(out).value=params[key].toFixed(2)}buildCharacter()});

$('bodyColor').oninput=()=>matBody.color.set($('bodyColor').value);$('accentColor').oninput=()=>matAccent.color.set($('accentColor').value);$('roughness').oninput=()=>{matBody.roughness=matAccent.roughness=+$('roughness').value;$('roughOut').value=(+$('roughness').value).toFixed(2)};$('metalness').oninput=()=>{matBody.metalness=matAccent.metalness=+$('metalness').value;$('metalOut').value=(+$('metalness').value).toFixed(2)};
$('textureInput').onchange=e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f);new THREE.TextureLoader().load(url,t=>{if(texture)texture.dispose();texture=t;t.colorSpace=THREE.SRGBColorSpace;matBody.map=t;matBody.needsUpdate=true;URL.revokeObjectURL(url)})};$('clearTextureBtn').onclick=()=>{if(texture)texture.dispose();texture=null;matBody.map=null;matBody.needsUpdate=true};

$('frontView').onclick=()=>{camera.position.set(0,1.8,5.5);controls.target.set(0,1.25,0)};$('sideView').onclick=()=>{camera.position.set(5.5,1.8,0);controls.target.set(0,1.25,0)};$('backView').onclick=()=>{camera.position.set(0,1.8,-5.5);controls.target.set(0,1.25,0)};
$('resetBtn').onclick=()=>{Object.assign(params,defaults);buildCharacter();resetPose();animating=true;currentAnim='idle'};
$('exportBtn').onclick=()=>{const was=animating;animating=false;const exporter=new GLTFExporter();exporter.parse(character,data=>{const blob=new Blob([data],{type:'model/gltf-binary'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='character-forge-base.glb';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);animating=was},err=>{console.error(err);alert('Erro ao exportar GLB.')},{binary:true,onlyVisible:true,maxTextureSize:2048})};

buildCharacter();resize();