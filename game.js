import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const gameRoot = document.querySelector('#game');
const statusEl = document.querySelector('#status');
const promptEl = document.querySelector('#prompt');
const npcCard = document.querySelector('#npc-card');
const npcNameEl = document.querySelector('#npc-name');
const npcStateEl = document.querySelector('#npc-state');
const npcMemoryEl = document.querySelector('#npc-memory');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87a9bd);
scene.fog = new THREE.Fog(0x87a9bd, 70, 210);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
gameRoot.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xdcefff, 0x53654b, 1.8);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(60, 90, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -110;
sun.shadow.camera.right = 110;
sun.shadow.camera.top = 110;
sun.shadow.camera.bottom = -110;
scene.add(sun);

const clock = new THREE.Clock();
const keys = {};
let orbitYaw = Math.PI;
let orbitPitch = 0.34;
let cameraDistance = 7.5;
let draggingCamera = false;
let lastPointer = { x: 0, y: 0 };
let currentVehicle = null;
let inspectedNpc = null;
let lastShot = -99;

const mat = (color, roughness = 0.9) => new THREE.MeshStandardMaterial({ color, roughness });
const roadMat = mat(0x34393d);
const sidewalkMat = mat(0x9c9b91);
const grassMat = mat(0x59774c);

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createWorld() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  for (const x of [-60, 0, 60]) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(18, 240), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.012, 0);
    road.receiveShadow = true;
    scene.add(road);
  }
  for (const z of [-60, 0, 60]) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(240, 18), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.014, z);
    road.receiveShadow = true;
    scene.add(road);
  }

  const buildingColors = [0x9a8874, 0x777f86, 0xb6a87f, 0x816f68, 0xa0a4a7];
  const blocks = [-90, -30, 30, 90];
  for (const x of blocks) {
    for (const z of blocks) {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const w = 11 + Math.random() * 9;
        const d = 11 + Math.random() * 9;
        const h = 8 + Math.random() * 28;
        const px = x + (Math.random() - 0.5) * 24;
        const pz = z + (Math.random() - 0.5) * 24;
        const b = box(w, h, d, mat(buildingColors[Math.floor(Math.random() * buildingColors.length)]), px, h / 2, pz);
        scene.add(b);
      }
      const sidewalk = box(42, 0.18, 42, sidewalkMat, x, 0.08, z);
      sidewalk.receiveShadow = true;
      sidewalk.castShadow = false;
      scene.add(sidewalk);
    }
  }

  for (let i = 0; i < 24; i++) {
    const trunk = box(0.45, 2.4, 0.45, mat(0x5d4029));
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), mat(0x315f32));
    const axis = Math.random() > 0.5;
    const lane = [-82, -38, 38, 82][Math.floor(Math.random() * 4)];
    const other = -105 + Math.random() * 210;
    trunk.position.set(axis ? lane : other, 1.2, axis ? other : lane);
    crown.position.copy(trunk.position).add(new THREE.Vector3(0, 2.4, 0));
    trunk.castShadow = crown.castShadow = true;
    scene.add(trunk, crown);
  }
}
createWorld();

function makePerson(color = 0x20252d, skin = 0xd2a27e) {
  const group = new THREE.Group();
  const torso = box(0.8, 1.25, 0.45, mat(color), 0, 1.25, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 10), mat(skin));
  head.position.y = 2.12;
  head.castShadow = true;
  const legMat = mat(0x1c2430);
  const leftLeg = box(0.28, 0.85, 0.28, legMat, -0.21, 0.43, 0);
  const rightLeg = box(0.28, 0.85, 0.28, legMat, 0.21, 0.43, 0);
  const leftArm = box(0.22, 1.0, 0.22, mat(color), -0.53, 1.3, 0);
  const rightArm = box(0.22, 1.0, 0.22, mat(color), 0.53, 1.3, 0);
  group.add(torso, head, leftLeg, rightLeg, leftArm, rightArm);
  return group;
}

const player = makePerson(0x171b21, 0xc98e6c);
player.position.set(4, 0, 8);
scene.add(player);

const gun = new THREE.Group();
gun.add(box(0.12, 0.14, 0.8, mat(0x151515), 0, 0, -0.35));
gun.add(box(0.12, 0.35, 0.15, mat(0x202020), 0, -0.17, -0.04));
gun.position.set(0.55, 1.42, -0.25);
player.add(gun);

const savedBrains = JSON.parse(localStorage.getItem('jogo2_npc_brains') || '{}');
const npcNames = ['Maya', 'Davi', 'Luna', 'Rico', 'Bia', 'Theo', 'Nina', 'Caio', 'Jade', 'Noah', 'Liz', 'Ivo'];
const npcColors = [0xb33b3b, 0x315f95, 0x5f3a81, 0x496b45, 0xc17a35, 0x444a55, 0x7e3f62];
const npcs = [];

class Citizen {
  constructor(name, index) {
    this.name = name;
    this.group = makePerson(npcColors[index % npcColors.length], [0xd2a27e, 0x8d5c45, 0xe0b18c][index % 3]);
    this.group.position.set(-95 + Math.random() * 190, 0, -95 + Math.random() * 190);
    this.group.userData.npc = this;
    this.group.traverse(o => { o.userData.npc = this; });
    scene.add(this.group);
    this.hp = 100;
    this.state = 'andando';
    this.target = this.randomTarget();
    this.speed = 1.45 + Math.random() * 0.55;
    this.decisionTimer = Math.random() * 3;
    this.socialCooldown = Math.random() * 4;
    this.needs = { hunger: Math.random() * 25, social: Math.random() * 40, fear: 0 };
    this.memory = savedBrains[name]?.memory || [];
    this.relationships = savedBrains[name]?.relationships || {};
  }

  randomTarget() {
    return new THREE.Vector3(-102 + Math.random() * 204, 0, -102 + Math.random() * 204);
  }

  remember(type, text, actor = null, weight = 1) {
    this.memory.unshift({ type, text, actor, weight, at: Date.now() });
    this.memory = this.memory.slice(0, 16);
  }

  relation(name) {
    return this.relationships[name] || 0;
  }

  changeRelation(name, amount) {
    this.relationships[name] = THREE.MathUtils.clamp(this.relation(name) + amount, -100, 100);
  }

  chooseAction() {
    if (this.hp <= 0) return;
    if (this.needs.fear > 45) {
      this.state = 'fugindo';
      const away = this.group.position.clone().sub(player.position).setY(0).normalize();
      this.target = this.group.position.clone().add(away.multiplyScalar(35));
      return;
    }

    if (this.needs.social > 65) {
      const candidates = npcs.filter(n => n !== this && n.hp > 0);
      candidates.sort((a, b) => this.group.position.distanceTo(a.group.position) - this.group.position.distanceTo(b.group.position));
      if (candidates[0]) {
        this.state = 'procurando companhia';
        this.target = candidates[0].group.position.clone();
        return;
      }
    }

    this.state = this.needs.hunger > 72 ? 'procurando comida' : 'andando';
    this.target = this.randomTarget();
  }

  update(dt) {
    if (this.hp <= 0) return;
    this.decisionTimer -= dt;
    this.socialCooldown -= dt;
    this.needs.hunger = Math.min(100, this.needs.hunger + dt * 0.55);
    this.needs.social = Math.min(100, this.needs.social + dt * 0.42);
    this.needs.fear = Math.max(0, this.needs.fear - dt * 2.2);

    if (this.decisionTimer <= 0 || this.group.position.distanceTo(this.target) < 2) {
      this.decisionTimer = 2 + Math.random() * 4;
      this.chooseAction();
    }

    const dir = this.target.clone().sub(this.group.position).setY(0);
    if (dir.lengthSq() > 0.2) {
      dir.normalize();
      const moveSpeed = this.state === 'fugindo' ? this.speed * 2.1 : this.speed;
      this.group.position.addScaledVector(dir, dt * moveSpeed);
      this.group.rotation.y = Math.atan2(dir.x, dir.z);
    }

    for (const other of npcs) {
      if (other === this || other.hp <= 0 || this.socialCooldown > 0) continue;
      if (this.group.position.distanceTo(other.group.position) < 2.4) {
        this.socialCooldown = 7 + Math.random() * 5;
        this.needs.social = Math.max(0, this.needs.social - 36);
        const oldRelation = this.relation(other.name);
        const vibe = Math.random() > 0.18 ? 2 : -3;
        this.changeRelation(other.name, vibe);
        this.remember('social', `Encontrou ${other.name}. Relação agora: ${this.relation(other.name)}.`, other.name, Math.abs(vibe));
        if (oldRelation < -25) this.state = 'evitando alguém';
        break;
      }
    }
  }

  hit(damage) {
    if (this.hp <= 0) return;
    this.hp -= damage;
    this.needs.fear = 100;
    this.remember('danger', `Foi atacado pelo jogador e perdeu ${damage} de vida.`, 'Jogador', 10);
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'caído';
      this.group.rotation.z = Math.PI / 2;
      this.group.position.y = 0.4;
      this.remember('danger', 'Foi derrubado pelo jogador.', 'Jogador', 20);
    } else {
      this.state = 'fugindo';
      this.chooseAction();
    }
  }
}

npcNames.forEach((name, i) => npcs.push(new Citizen(name, i)));

class Car {
  constructor(color, x, z, rotation = 0) {
    this.group = new THREE.Group();
    this.body = box(3.6, 0.75, 1.75, mat(color), 0, 0.7, 0);
    this.cabin = box(1.9, 0.72, 1.55, mat(0x8ba3af, 0.35), -0.25, 1.35, 0);
    this.group.add(this.body, this.cabin);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12), mat(0x111111));
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(sx * 1.1, 0.38, sz * 0.88);
        wheel.castShadow = true;
        this.group.add(wheel);
      }
    }
    this.group.position.set(x, 0, z);
    this.group.rotation.y = rotation;
    this.speed = 0;
    scene.add(this.group);
  }

  update(dt) {
    if (currentVehicle !== this) return;
    const accel = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    const steer = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0);
    this.speed += accel * dt * 10;
    this.speed *= Math.pow(0.985, dt * 60);
    this.speed = THREE.MathUtils.clamp(this.speed, -6, 18);
    if (Math.abs(this.speed) > 0.3) this.group.rotation.y += steer * dt * 1.55 * Math.sign(this.speed);
    const forward = new THREE.Vector3(Math.sin(this.group.rotation.y), 0, Math.cos(this.group.rotation.y));
    this.group.position.addScaledVector(forward, this.speed * dt);
  }
}

const cars = [
  new Car(0xb72d2d, 8, -4, Math.PI / 2),
  new Car(0x1e4d75, -52, 8, 0),
  new Car(0xd08a26, 67, -8, Math.PI),
  new Car(0x30343a, -7, 62, Math.PI / 2),
];

function nearestCar() {
  return cars
    .map(car => ({ car, d: car.group.position.distanceTo(player.position) }))
    .sort((a, b) => a.d - b.d)[0];
}

function nearestNpc(reference = player.position) {
  return npcs
    .filter(n => n.hp > 0)
    .map(npc => ({ npc, d: npc.group.position.distanceTo(reference) }))
    .sort((a, b) => a.d - b.d)[0];
}

function toggleVehicle() {
  if (currentVehicle) {
    const forward = new THREE.Vector3(Math.cos(currentVehicle.group.rotation.y), 0, -Math.sin(currentVehicle.group.rotation.y));
    player.position.copy(currentVehicle.group.position).addScaledVector(forward, 2.8);
    player.visible = true;
    currentVehicle = null;
    statusEl.textContent = 'A pé • Pistola';
    return;
  }
  const near = nearestCar();
  if (near && near.d < 4.5) {
    currentVehicle = near.car;
    player.visible = false;
    statusEl.textContent = 'Dirigindo • E para sair';
  }
}

function inspectMemory() {
  const origin = currentVehicle ? currentVehicle.group.position : player.position;
  const near = nearestNpc(origin);
  if (!near || near.d > 8) {
    npcCard.classList.add('hidden');
    inspectedNpc = null;
    return;
  }
  inspectedNpc = near.npc;
  npcCard.classList.remove('hidden');
  refreshMemoryCard();
}

function refreshMemoryCard() {
  if (!inspectedNpc) return;
  npcNameEl.textContent = `${inspectedNpc.name} • HP ${inspectedNpc.hp}`;
  npcStateEl.textContent = `${inspectedNpc.state} • fome ${Math.round(inspectedNpc.needs.hunger)} • social ${Math.round(inspectedNpc.needs.social)} • medo ${Math.round(inspectedNpc.needs.fear)}`;
  npcMemoryEl.innerHTML = inspectedNpc.memory.length
    ? inspectedNpc.memory.slice(0, 7).map(m => `<div class="memory-item">${escapeHtml(m.text)}</div>`).join('')
    : '<div class="memory-item">Ainda não possui lembranças importantes.</div>';
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

const raycaster = new THREE.Raycaster();
function shoot() {
  if (currentVehicle || clock.elapsedTime - lastShot < 0.22) return;
  lastShot = clock.elapsedTime;
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const targets = npcs.flatMap(n => n.group.children);
  const hits = raycaster.intersectObjects(targets, false);
  if (hits[0]) {
    const npc = hits[0].object.userData.npc;
    if (npc) npc.hit(34);
  }
  for (const npc of npcs) {
    if (npc.hp <= 0) continue;
    const d = npc.group.position.distanceTo(player.position);
    if (d < 28) {
      npc.needs.fear = Math.max(npc.needs.fear, 60);
      if (!hits[0] || hits[0].object.userData.npc !== npc) {
        npc.remember('danger', 'Ouviu um disparo perto e ficou em alerta.', 'Jogador', 5);
      }
    }
  }
}

function updatePlayer(dt) {
  if (currentVehicle) return;
  const forwardInput = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  const sideInput = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  if (!forwardInput && !sideInput) return;

  const camForward = new THREE.Vector3(-Math.sin(orbitYaw), 0, -Math.cos(orbitYaw)).normalize();
  const camRight = new THREE.Vector3(camForward.z, 0, -camForward.x);
  const move = camForward.multiplyScalar(forwardInput).add(camRight.multiplyScalar(sideInput)).normalize();
  const speed = keys.ShiftLeft || keys.ShiftRight ? 7.3 : 4.3;
  player.position.addScaledVector(move, dt * speed);
  player.position.x = THREE.MathUtils.clamp(player.position.x, -112, 112);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -112, 112);
  player.rotation.y = Math.atan2(move.x, move.z);
}

function updateCamera() {
  const targetObject = currentVehicle ? currentVehicle.group : player;
  const target = targetObject.position.clone().add(new THREE.Vector3(0, currentVehicle ? 1.3 : 1.5, 0));
  const horizontal = Math.cos(orbitPitch) * cameraDistance;
  const offset = new THREE.Vector3(
    Math.sin(orbitYaw) * horizontal,
    Math.sin(orbitPitch) * cameraDistance + 1.2,
    Math.cos(orbitYaw) * horizontal
  );
  const desired = target.clone().add(offset);
  camera.position.lerp(desired, 0.14);
  camera.lookAt(target);
}

function updatePrompt() {
  if (currentVehicle) {
    promptEl.textContent = 'E • sair do carro';
    return;
  }
  const near = nearestCar();
  if (near && near.d < 4.5) {
    promptEl.textContent = 'E • entrar no carro';
    return;
  }
  const closeNpc = nearestNpc();
  if (closeNpc && closeNpc.d < 8) {
    promptEl.textContent = `Q • ver memória de ${closeNpc.npc.name}`;
    return;
  }
  promptEl.textContent = '';
}

function saveBrains() {
  const data = {};
  for (const npc of npcs) data[npc.name] = { memory: npc.memory, relationships: npc.relationships };
  localStorage.setItem('jogo2_npc_brains', JSON.stringify(data));
}
setInterval(saveBrains, 8000);
window.addEventListener('beforeunload', saveBrains);

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (!e.repeat && e.code === 'KeyE') toggleVehicle();
  if (!e.repeat && e.code === 'KeyQ') inspectMemory();
});
addEventListener('keyup', e => { keys[e.code] = false; });

renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
renderer.domElement.addEventListener('pointerdown', e => {
  if (e.button === 2 || (e.pointerType === 'touch' && e.clientX > innerWidth * 0.45)) {
    draggingCamera = true;
    lastPointer = { x: e.clientX, y: e.clientY };
    renderer.domElement.setPointerCapture?.(e.pointerId);
  } else if (e.button === 0 && e.pointerType !== 'touch') {
    shoot();
  }
});
renderer.domElement.addEventListener('pointermove', e => {
  if (!draggingCamera) return;
  const dx = e.clientX - lastPointer.x;
  const dy = e.clientY - lastPointer.y;
  orbitYaw -= dx * 0.006;
  orbitPitch = THREE.MathUtils.clamp(orbitPitch + dy * 0.004, 0.08, 1.05);
  lastPointer = { x: e.clientX, y: e.clientY };
});
renderer.domElement.addEventListener('pointerup', e => {
  draggingCamera = false;
  renderer.domElement.releasePointerCapture?.(e.pointerId);
});
renderer.domElement.addEventListener('wheel', e => {
  cameraDistance = THREE.MathUtils.clamp(cameraDistance + e.deltaY * 0.008, 3.8, 14);
}, { passive: true });

for (const btn of document.querySelectorAll('[data-key]')) {
  const code = btn.dataset.key;
  const on = e => { e.preventDefault(); keys[code] = true; };
  const off = e => { e.preventDefault(); keys[code] = false; };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointercancel', off);
  btn.addEventListener('pointerleave', off);
}
document.querySelector('#action-fire').addEventListener('pointerdown', e => { e.preventDefault(); shoot(); });
document.querySelector('#action-use').addEventListener('pointerdown', e => { e.preventDefault(); toggleVehicle(); });
document.querySelector('#action-memory').addEventListener('pointerdown', e => { e.preventDefault(); inspectMemory(); });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
});

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  updatePlayer(dt);
  for (const car of cars) car.update(dt);
  for (const npc of npcs) npc.update(dt);
  updateCamera();
  updatePrompt();
  if (inspectedNpc) refreshMemoryCard();
  renderer.render(scene, camera);
}
updateCamera();
animate();
