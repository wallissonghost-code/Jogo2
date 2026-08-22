import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const $ = (id) => document.getElementById(id);
const state = { front:null, back:null, mesh:null };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d10);
const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
camera.position.set(0, 0.2, 4.8);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('viewer').appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
scene.add(new THREE.HemisphereLight(0xffffff,0x30333b,2.2));
const key = new THREE.DirectionalLight(0xffffff,2.5); key.position.set(3,4,5); scene.add(key);
const rim = new THREE.DirectionalLight(0x8fbfff,1.5); rim.position.set(-4,1,-3); scene.add(rim);
const grid = new THREE.GridHelper(8,16,0x2d333b,0x171b20); grid.position.y=-1.6; scene.add(grid);

function resize(){ const el=$('viewer'); const w=el.clientWidth,h=el.clientHeight; if(!w||!h)return; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
addEventListener('resize',resize); new ResizeObserver(resize).observe($('viewer'));
(function loop(){ requestAnimationFrame(loop); controls.update(); renderer.render(scene,camera); })();

function bindRange(id,out){ const el=$(id); const draw=()=>$(out).value=el.value; el.addEventListener('input',draw); draw(); }
bindRange('resolution','resOut'); bindRange('depth','depthOut'); bindRange('threshold','thresholdOut');

async function loadImage(file){
  const url=URL.createObjectURL(file); const img=new Image(); img.src=url; await img.decode(); return {img,url};
}
async function pick(kind,file){
  if(!file)return; const data=await loadImage(file); if(state[kind]?.url)URL.revokeObjectURL(state[kind].url); state[kind]=data;
  const p=$(kind+'Preview'); p.src=data.url; p.parentElement.classList.add('has-image');
  $('generateBtn').disabled=!(state.front&&state.back); $('status').textContent=state.front&&state.back?'Pronto para reconstruir.':'Aguardando a outra vista.';
}
$('frontInput').addEventListener('change',e=>pick('front',e.target.files[0]));
$('backInput').addEventListener('change',e=>pick('back',e.target.files[0]));

function sample(img,n,mirror=false){
  const c=document.createElement('canvas'); c.width=n; c.height=n; const x=c.getContext('2d',{willReadFrequently:true});
  x.clearRect(0,0,n,n); x.save(); if(mirror){x.translate(n,0);x.scale(-1,1);} x.drawImage(img,0,0,n,n); x.restore();
  const d=x.getImageData(0,0,n,n).data; const threshold=+$('threshold').value; const mask=new Uint8Array(n*n);
  for(let i=0;i<n*n;i++){ const a=d[i*4+3]; const rgb=(d[i*4]+d[i*4+1]+d[i*4+2])/3; mask[i]=(a>threshold && !(a>245&&rgb>248))?1:0; }
  return {canvas:c,mask};
}

function makeMesh(){
  const n=+$('resolution').value, depth=+$('depth').value;
  const F=sample(state.front.img,n,false), B=sample(state.back.img,n,$('flipBack').checked);
  const mask=new Uint8Array(n*n), intersect=$('useIntersection').checked;
  for(let i=0;i<mask.length;i++) mask[i]=intersect?(F.mask[i]&&B.mask[i]):(F.mask[i]||B.mask[i]);
  const pos=[],uv=[],idx=[]; const cell=2/n, z=depth/2; let v=0;
  const addQuad=(p0,p1,p2,p3,u0,u1,u2,u3,flip=false)=>{ pos.push(...p0,...p1,...p2,...p3); uv.push(...u0,...u1,...u2,...u3); if(!flip)idx.push(v,v+1,v+2,v,v+2,v+3); else idx.push(v,v+2,v+1,v,v+3,v+2); v+=4; };
  const occ=(x,y)=>x>=0&&y>=0&&x<n&&y<n&&mask[y*n+x];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(occ(x,y)){
    const x0=-1+x*cell,x1=x0+cell,y1=1-y*cell,y0=y1-cell;
    const U0=x/n,U1=(x+1)/n,V1=1-y/n,V0=1-(y+1)/n;
    addQuad([x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],[U0,V0],[U1,V0],[U1,V1],[U0,V1],false);
    addQuad([x0,y0,-z],[x0,y1,-z],[x1,y1,-z],[x1,y0,-z],[U0,V0],[U0,V1],[U1,V1],[U1,V0],false);
    const s=[[x-1,y,[x0,y0,-z],[x0,y0,z],[x0,y1,z],[x0,y1,-z]],[x+1,y,[x1,y0,z],[x1,y0,-z],[x1,y1,-z],[x1,y1,z]],[x,y-1,[x0,y1,z],[x1,y1,z],[x1,y1,-z],[x0,y1,-z]],[x,y+1,[x0,y0,-z],[x1,y0,-z],[x1,y0,z],[x0,y0,z]]];
    for(const q of s)if(!occ(q[0],q[1]))addQuad(q[2],q[3],q[4],q[5],[0,0],[1,0],[1,1],[0,1],false);
  }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
  const texF=new THREE.CanvasTexture(F.canvas), texB=new THREE.CanvasTexture(B.canvas); texF.colorSpace=texB.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshStandardMaterial({map:texF,roughness:.72,metalness:.02,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(g,mat); mesh.rotation.x=0;
  if(state.mesh)scene.remove(state.mesh); state.mesh=mesh; scene.add(mesh);
  const box=new THREE.Box3().setFromObject(mesh), size=box.getSize(new THREE.Vector3()); const scale=2.8/Math.max(size.x,size.y,size.z); mesh.scale.setScalar(scale);
  $('meshInfo').textContent=`${g.attributes.position.count.toLocaleString('pt-BR')} vértices`;
  $('downloadBtn').disabled=false; $('status').textContent='GLB gerado no navegador. Você já pode baixar.';
}
$('generateBtn').addEventListener('click',()=>{ $('status').textContent='Reconstruindo malha...'; setTimeout(makeMesh,30); });

$('downloadBtn').addEventListener('click',()=>{
  if(!state.mesh)return; const exporter=new GLTFExporter();
  exporter.parse(state.mesh,(data)=>{ const blob=new Blob([data],{type:'model/gltf-binary'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ghost-3d-forge.glb'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); },(err)=>{console.error(err);$('status').textContent='Erro ao exportar GLB.';},{binary:true,onlyVisible:true});
});
