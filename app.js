import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const $ = (id) => document.getElementById(id);
const state = { front:null, back:null, left:null, right:null, top:null, mesh:null };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d10);
const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
camera.position.set(2.8, 0.35, 4.6);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
$('viewer').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0,0,0);
scene.add(new THREE.HemisphereLight(0xffffff,0x27303a,2.35));
const key = new THREE.DirectionalLight(0xffffff,2.6); key.position.set(3,4,5); scene.add(key);
const rim = new THREE.DirectionalLight(0x8fbfff,1.15); rim.position.set(-4,1,-3); scene.add(rim);
const grid = new THREE.GridHelper(8,16,0x2d333b,0x171b20); grid.position.y=-1.62; scene.add(grid);

function resize(){
  const el=$('viewer'); const w=el.clientWidth,h=el.clientHeight;
  if(!w||!h)return;
  renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
}
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
  $('status').textContent=state.front&&state.back
    ? (sideCount?`Pronto. ${sideCount} lateral(is) serão usadas no casco 3D.`:'Pronto. Sem lateral o volume será aproximado.')
    : 'Aguardando frente e verso.';
}
for(const kind of ['front','back','left','right','top']) $(kind+'Input').addEventListener('change',e=>pick(kind,e.target.files[0]));

function isForegroundPixel(r,g,b,a,threshold){
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), bright=(r+g+b)/3;
  const nearWhite=bright>246 && (mx-mn)<10;
  return a>threshold && !nearWhite;
}

function cleanMask(mask,n){
  let a=mask;
  for(let pass=0; pass<2; pass++){
    const b=a.slice();
    for(let y=1;y<n-1;y++) for(let x=1;x<n-1;x++){
      let around=0;
      for(let yy=-1;yy<=1;yy++) for(let xx=-1;xx<=1;xx++) if(xx||yy) around+=a[(y+yy)*n+(x+xx)];
      const i=y*n+x;
      if(a[i] && around<=2) b[i]=0;
      else if(!a[i] && around>=6) b[i]=1;
    }
    a=b;
  }
  return a;
}

function sample(img,n,mirror=false){
  const threshold=+$('threshold').value;
  const probe=document.createElement('canvas');
  const maxProbe=512;
  const scale=Math.min(1,maxProbe/Math.max(img.naturalWidth,img.naturalHeight));
  probe.width=Math.max(2,Math.round(img.naturalWidth*scale));
  probe.height=Math.max(2,Math.round(img.naturalHeight*scale));
  const pctx=probe.getContext('2d',{willReadFrequently:true});
  pctx.drawImage(img,0,0,probe.width,probe.height);
  const pd=pctx.getImageData(0,0,probe.width,probe.height).data;
  let minX=probe.width,minY=probe.height,maxX=-1,maxY=-1;
  for(let y=0;y<probe.height;y++) for(let x=0;x<probe.width;x++){
    const i=(y*probe.width+x)*4;
    if(isForegroundPixel(pd[i],pd[i+1],pd[i+2],pd[i+3],threshold)){
      if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;
    }
  }
  if(maxX<minX){ minX=0;minY=0;maxX=probe.width-1;maxY=probe.height-1; }
  const bw=maxX-minX+1,bh=maxY-minY+1;
  const pad=Math.max(bw,bh)*0.05;
  minX=Math.max(0,minX-pad); minY=Math.max(0,minY-pad);
  maxX=Math.min(probe.width,maxX+pad); maxY=Math.min(probe.height,maxY+pad);
  const sw=maxX-minX, sh=maxY-minY;

  const c=document.createElement('canvas'); c.width=n; c.height=n;
  const x=c.getContext('2d',{willReadFrequently:true}); x.clearRect(0,0,n,n);
  const fit=Math.min((n*0.92)/sw,(n*0.92)/sh);
  const dw=sw*fit, dh=sh*fit, dx=(n-dw)/2,dy=(n-dh)/2;
  x.save();
  if(mirror){ x.translate(n,0); x.scale(-1,1); }
  x.drawImage(probe,minX,minY,sw,sh,dx,dy,dw,dh);
  x.restore();

  const d=x.getImageData(0,0,n,n).data;
  let mask=new Uint8Array(n*n);
  for(let i=0;i<n*n;i++) mask[i]=isForegroundPixel(d[i*4],d[i*4+1],d[i*4+2],d[i*4+3],threshold)?1:0;
  mask=cleanMask(mask,n);
  return {canvas:c,mask};
}

function makeMaterial(canvas){
  if(!canvas) return new THREE.MeshStandardMaterial({color:0x707780,roughness:.8,metalness:.01,side:THREE.DoubleSide});
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return new THREE.MeshStandardMaterial({map:tex,roughness:.72,metalness:.01,side:THREE.DoubleSide});
}

function buildVisualHull(){
  // Keep browser/mobile memory under control: UI resolution maps to a practical voxel grid.
  const uiN=+$('resolution').value;
  const n=Math.max(28,Math.min(64,Math.round(uiN/2)));
  const F=sample(state.front.img,n,false);
  const B=sample(state.back.img,n,$('flipBack').checked);
  const L=state.left?sample(state.left.img,n,false):null;
  const R=state.right?sample(state.right.img,n,$('flipRight').checked):null;
  const T=state.top?sample(state.top.img,n,false):null;
  const intersect=$('useIntersection').checked;

  const frontMask=new Uint8Array(n*n);
  for(let i=0;i<frontMask.length;i++) frontMask[i]=intersect?(F.mask[i]&&B.mask[i]):(F.mask[i]||B.mask[i]);

  const depthFallback=Math.max(.18,+$('depth').value);
  const depthScale=Math.min(1.0,Math.max(.22,depthFallback));
  const occ=new Uint8Array(n*n*n);
  const at=(x,y,z)=>(z*n+y)*n+x;
  const maskAt=(m,x,y)=>m && x>=0&&y>=0&&x<n&&y<n ? m[y*n+x] : 0;

  let occupied=0;
  for(let z=0;z<n;z++) for(let y=0;y<n;y++) for(let x=0;x<n;x++){
    if(!frontMask[y*n+x]) continue;

    let sideOk=true;
    if(L || R){
      // Side images: horizontal axis is depth. Both views are normalized/cropped first.
      const lOk=L?maskAt(L.mask,z,y):1;
      const rOk=R?maskAt(R.mask,n-1-z,y):1;
      sideOk=intersect?(lOk&&rOk):(lOk||rOk);
    } else {
      // Smooth ellipsoid fallback instead of flat extrusion.
      const zn=((z+.5)/n-.5)*2;
      sideOk=Math.abs(zn)<=depthScale;
    }
    if(!sideOk) continue;

    if(T){
      // Top image: x = width, y = depth.
      const topY=n-1-z;
      if(!maskAt(T.mask,x,topY)) continue;
    }

    occ[at(x,y,z)]=1; occupied++;
  }

  if(!occupied) throw new Error('Nenhum volume comum encontrado. Confira orientação, corte do fundo e espelhamento.');

  // Mild 3D majority filter removes isolated slices and jagged noise.
  for(let pass=0;pass<1;pass++){
    const next=occ.slice();
    for(let z=1;z<n-1;z++) for(let y=1;y<n-1;y++) for(let x=1;x<n-1;x++){
      const i=at(x,y,z); let nb=0;
      nb+=occ[at(x-1,y,z)]+occ[at(x+1,y,z)]+occ[at(x,y-1,z)]+occ[at(x,y+1,z)]+occ[at(x,y,z-1)]+occ[at(x,y,z+1)];
      if(occ[i] && nb<=1) next[i]=0;
      else if(!occ[i] && nb>=5) next[i]=1;
    }
    occ.set(next);
  }

  const pos=[],uv=[],idx=[]; const groups=[];
  let v=0,indexStart=0;
  const cell=2/n;
  const get=(x,y,z)=>x>=0&&y>=0&&z>=0&&x<n&&y<n&&z<n?occ[at(x,y,z)]:0;
  const addQuad=(p0,p1,p2,p3,uvs,mat)=>{
    pos.push(...p0,...p1,...p2,...p3); uv.push(...uvs[0],...uvs[1],...uvs[2],...uvs[3]);
    idx.push(v,v+1,v+2,v,v+2,v+3); groups.push({start:indexStart,count:6,mat}); indexStart+=6; v+=4;
  };

  for(let z=0;z<n;z++) for(let y=0;y<n;y++) for(let x=0;x<n;x++) if(get(x,y,z)){
    const x0=-1+x*cell,x1=x0+cell;
    const y1=1-y*cell,y0=y1-cell;
    const z0=-1+z*cell,z1=z0+cell;
    const U0=x/n,U1=(x+1)/n,V1=1-y/n,V0=1-(y+1)/n;
    const W0=z/n,W1=(z+1)/n;

    if(!get(x,y,z+1)) addQuad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[[U0,V0],[U1,V0],[U1,V1],[U0,V1]],0); // front
    if(!get(x,y,z-1)) addQuad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[[1-U1,V0],[1-U0,V0],[1-U0,V1],[1-U1,V1]],1); // back
    if(!get(x-1,y,z)) addQuad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[[W0,V0],[W1,V0],[W1,V1],[W0,V1]],2); // left
    if(!get(x+1,y,z)) addQuad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[[1-W1,V0],[1-W0,V0],[1-W0,V1],[1-W1,V1]],3); // right
    if(!get(x,y-1,z)) addQuad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[[U0,1-W1],[U1,1-W1],[U1,1-W0],[U0,1-W0]],4); // top
    if(!get(x,y+1,z)) addQuad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[[U0,W0],[U1,W0],[U1,W1],[U0,W1]],4); // bottom
  }

  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);
  g.clearGroups(); groups.forEach(gr=>g.addGroup(gr.start,gr.count,gr.mat));
  g.computeVertexNormals();

  const materials=[makeMaterial(F.canvas),makeMaterial(B.canvas),makeMaterial(L?.canvas),makeMaterial(R?.canvas),makeMaterial(T?.canvas)];
  const mesh=new THREE.Mesh(g,materials);

  if(state.mesh){
    scene.remove(state.mesh); state.mesh.geometry.dispose();
    const ms=Array.isArray(state.mesh.material)?state.mesh.material:[state.mesh.material];
    ms.forEach(m=>{m.map?.dispose();m.dispose();});
  }
  state.mesh=mesh; scene.add(mesh);

  const box=new THREE.Box3().setFromObject(mesh), size=box.getSize(new THREE.Vector3()), center=box.getCenter(new THREE.Vector3());
  mesh.position.sub(center);
  const scale=2.85/Math.max(size.x,size.y,size.z); mesh.scale.setScalar(scale);
  controls.target.set(0,0,0); camera.position.set(2.8,.35,4.6); controls.update();

  const tris=(g.index.count/3).toLocaleString('pt-BR');
  $('meshInfo').textContent=`${g.attributes.position.count.toLocaleString('pt-BR')} vértices • ${tris} tri`;
  $('downloadBtn').disabled=false;
  const sideCount=(L?1:0)+(R?1:0);
  $('status').textContent=`Casco 3D reconstruído por silhuetas${sideCount?` com ${sideCount} lateral(is)`:''}.`;
}

$('generateBtn').addEventListener('click',()=>{
  $('status').textContent='Normalizando imagens e reconstruindo casco 3D...';
  $('generateBtn').disabled=true;
  setTimeout(()=>{
    try{ buildVisualHull(); }
    catch(err){ console.error(err); $('status').textContent=err.message||'Falha na reconstrução.'; }
    $('generateBtn').disabled=!(state.front&&state.back);
  },30);
});

$('downloadBtn').addEventListener('click',()=>{
  if(!state.mesh)return;
  const exporter=new GLTFExporter();
  exporter.parse(state.mesh,(data)=>{
    const blob=new Blob([data],{type:'model/gltf-binary'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='ghost-3d-forge-visual-hull.glb'; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  },(err)=>{console.error(err);$('status').textContent='Erro ao exportar GLB.';},{binary:true,onlyVisible:true,maxTextureSize:2048});
});
