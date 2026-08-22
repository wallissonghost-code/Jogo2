import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const $ = (id) => document.getElementById(id);
const state = { front:null, back:null, left:null, right:null, top:null, mesh:null };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d10);
const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
camera.position.set(2.9, 0.45, 4.4);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
$('viewer').appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0,0,0);
scene.add(new THREE.HemisphereLight(0xffffff,0x27303a,2.4));
const key = new THREE.DirectionalLight(0xffffff,2.8); key.position.set(3,4,5); scene.add(key);
const rim = new THREE.DirectionalLight(0x8fbfff,1.4); rim.position.set(-4,1,-3); scene.add(rim);
const grid = new THREE.GridHelper(8,16,0x2d333b,0x171b20); grid.position.y=-1.6; scene.add(grid);

function resize(){ const el=$('viewer'); const w=el.clientWidth,h=el.clientHeight; if(!w||!h)return; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
addEventListener('resize',resize); new ResizeObserver(resize).observe($('viewer'));
(function loop(){ requestAnimationFrame(loop); controls.update(); renderer.render(scene,camera); })();

function bindRange(id,out){ const el=$(id); const draw=()=>$(out).value=el.value; el.addEventListener('input',draw); draw(); }
bindRange('resolution','resOut'); bindRange('depth','depthOut'); bindRange('threshold','thresholdOut');

async function loadImage(file){ const url=URL.createObjectURL(file); const img=new Image(); img.src=url; await img.decode(); return {img,url}; }
async function pick(kind,file){
  if(!file)return;
  const data=await loadImage(file);
  if(state[kind]?.url)URL.revokeObjectURL(state[kind].url);
  state[kind]=data;
  const p=$(kind+'Preview'); p.src=data.url; p.parentElement.classList.add('has-image');
  $('generateBtn').disabled=!(state.front&&state.back);
  const sideCount=(state.left?1:0)+(state.right?1:0);
  $('status').textContent=state.front&&state.back ? (sideCount?`Pronto. ${sideCount} lateral(is) será(ão) usada(s) para profundidade.`:'Pronto. Adicione laterais para melhorar o volume.') : 'Aguardando frente e verso.';
}
for(const kind of ['front','back','left','right','top']) $(kind+'Input').addEventListener('change',e=>pick(kind,e.target.files[0]));

function sample(img,n,mirror=false){
  const c=document.createElement('canvas'); c.width=n; c.height=n; const x=c.getContext('2d',{willReadFrequently:true});
  x.clearRect(0,0,n,n); x.save(); if(mirror){x.translate(n,0);x.scale(-1,1);} x.drawImage(img,0,0,n,n); x.restore();
  const d=x.getImageData(0,0,n,n).data; const threshold=+$('threshold').value; const mask=new Uint8Array(n*n);
  for(let i=0;i<n*n;i++){
    const a=d[i*4+3], r=d[i*4],g=d[i*4+1],b=d[i*4+2];
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b), bright=(r+g+b)/3;
    const nearWhite=bright>247 && (mx-mn)<8;
    mask[i]=(a>threshold && !nearWhite)?1:0;
  }
  return {canvas:c,mask};
}

function rowExtent(mask,n,y){
  let min=n,max=-1;
  for(let x=0;x<n;x++) if(mask[y*n+x]){ if(x<min)min=x; if(x>max)max=x; }
  if(max<min)return null;
  const center=(min+max)/2, half=Math.max(1,(max-min+1)/2);
  return {center,half};
}

function smoothArray(arr,passes=2){
  let a=arr.slice();
  for(let p=0;p<passes;p++){
    const b=a.slice();
    for(let i=1;i<a.length-1;i++) if(a[i]!=null){
      const vals=[a[i-1],a[i],a[i+1]].filter(v=>v!=null);
      b[i]=vals.reduce((s,v)=>s+v,0)/vals.length;
    }
    a=b;
  }
  return a;
}

function buildDepthProfile(n,leftS,rightS){
  const fallback=+$('depth').value;
  const rows=new Array(n).fill(fallback/2);
  if(!leftS && !rightS)return rows;
  const raw=new Array(n).fill(null);
  for(let y=0;y<n;y++){
    const vals=[];
    if(leftS){ const e=rowExtent(leftS.mask,n,y); if(e) vals.push((e.half/n)*2); }
    if(rightS){ const e=rowExtent(rightS.mask,n,y); if(e) vals.push((e.half/n)*2); }
    if(vals.length) raw[y]=Math.max(0.04, vals.reduce((s,v)=>s+v,0)/vals.length);
  }
  const smooth=smoothArray(raw,3);
  for(let y=0;y<n;y++) if(smooth[y]!=null) rows[y]=smooth[y];
  return rows;
}

function makeMaterial(canvas){
  if(!canvas) return new THREE.MeshStandardMaterial({color:0x858b94,roughness:.78,metalness:.01,side:THREE.DoubleSide});
  const tex=new THREE.CanvasTexture(canvas); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return new THREE.MeshStandardMaterial({map:tex,roughness:.72,metalness:.015,side:THREE.DoubleSide});
}

function makeMesh(){
  const n=+$('resolution').value;
  const F=sample(state.front.img,n,false);
  const B=sample(state.back.img,n,$('flipBack').checked);
  const L=state.left?sample(state.left.img,n,false):null;
  const R=state.right?sample(state.right.img,n,$('flipRight').checked):null;
  const T=state.top?sample(state.top.img,n,false):null;
  const intersect=$('useIntersection').checked;
  const mask=new Uint8Array(n*n);
  for(let i=0;i<mask.length;i++) mask[i]=intersect?(F.mask[i]&&B.mask[i]):(F.mask[i]||B.mask[i]);

  const depthByRow=buildDepthProfile(n,L,R);
  const pos=[],uv=[],idx=[],groups=[]; let v=0, triIndex=0;
  const cell=2/n;
  const addQuad=(p0,p1,p2,p3,u0,u1,u2,u3,matIndex)=>{
    pos.push(...p0,...p1,...p2,...p3); uv.push(...u0,...u1,...u2,...u3);
    idx.push(v,v+1,v+2,v,v+2,v+3); groups.push({start:triIndex,count:6,mat:matIndex}); triIndex+=6; v+=4;
  };
  const occ=(x,y)=>x>=0&&y>=0&&x<n&&y<n&&mask[y*n+x];

  for(let y=0;y<n;y++) for(let x=0;x<n;x++) if(occ(x,y)){
    const x0=-1+x*cell,x1=x0+cell,y1=1-y*cell,y0=y1-cell;
    const z=Math.max(0.025,depthByRow[y]);
    const zUp=Math.max(0.025,depthByRow[Math.max(0,y-1)]), zDn=Math.max(0.025,depthByRow[Math.min(n-1,y+1)]);
    const U0=x/n,U1=(x+1)/n,V1=1-y/n,V0=1-(y+1)/n;

    addQuad([x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],[U0,V0],[U1,V0],[U1,V1],[U0,V1],0);
    addQuad([x1,y0,-z],[x0,y0,-z],[x0,y1,-z],[x1,y1,-z],[1-U1,V0],[1-U0,V0],[1-U0,V1],[1-U1,V1],1);

    if(!occ(x-1,y)) addQuad([x0,y0,-z],[x0,y0,z],[x0,y1,zUp],[x0,y1,-zUp],[0,V0],[1,V0],[1,V1],[0,V1],2);
    if(!occ(x+1,y)) addQuad([x1,y0,z],[x1,y0,-z],[x1,y1,-zUp],[x1,y1,zUp],[0,V0],[1,V0],[1,V1],[0,V1],3);
    if(!occ(x,y-1)) addQuad([x0,y1,zUp],[x1,y1,zUp],[x1,y1,-zUp],[x0,y1,-zUp],[U0,1],[U1,1],[U1,0],[U0,0],4);
    if(!occ(x,y+1)) addQuad([x0,y0,-zDn],[x1,y0,-zDn],[x1,y0,zDn],[x0,y0,zDn],[U0,0],[U1,0],[U1,1],[U0,1],4);
  }

  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);
  g.clearGroups(); for(const gr of groups) g.addGroup(gr.start,gr.count,gr.mat);
  g.computeVertexNormals();

  const materials=[makeMaterial(F.canvas),makeMaterial(B.canvas),makeMaterial(L?.canvas),makeMaterial(R?.canvas),makeMaterial(T?.canvas)];
  const mesh=new THREE.Mesh(g,materials);
  if(state.mesh){ scene.remove(state.mesh); state.mesh.geometry.dispose(); const ms=Array.isArray(state.mesh.material)?state.mesh.material:[state.mesh.material]; ms.forEach(m=>{m.map?.dispose();m.dispose();}); }
  state.mesh=mesh; scene.add(mesh);

  const box=new THREE.Box3().setFromObject(mesh), size=box.getSize(new THREE.Vector3()), center=box.getCenter(new THREE.Vector3());
  mesh.position.sub(center);
  const scale=2.8/Math.max(size.x,size.y,size.z); mesh.scale.setScalar(scale);
  controls.target.set(0,0,0); camera.position.set(2.9,.45,4.4); controls.update();

  const tris=(g.index.count/3).toLocaleString('pt-BR');
  $('meshInfo').textContent=`${g.attributes.position.count.toLocaleString('pt-BR')} vértices • ${tris} tri`;
  $('downloadBtn').disabled=false;
  const sideCount=(L?1:0)+(R?1:0);
  $('status').textContent=sideCount?`GLB multi-view gerado com ${sideCount} lateral(is).`:'GLB gerado. Para melhor volume, adicione pelo menos uma lateral.';
}

$('generateBtn').addEventListener('click',()=>{ $('status').textContent='Cruzando silhuetas e reconstruindo volume...'; setTimeout(makeMesh,30); });

$('downloadBtn').addEventListener('click',()=>{
  if(!state.mesh)return;
  const exporter=new GLTFExporter();
  exporter.parse(state.mesh,(data)=>{
    const blob=new Blob([data],{type:'model/gltf-binary'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='ghost-3d-forge-multiview.glb'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  },(err)=>{console.error(err);$('status').textContent='Erro ao exportar GLB.';},{binary:true,onlyVisible:true,maxTextureSize:2048});
});
