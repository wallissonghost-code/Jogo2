import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const gameRoot = document.querySelector('#game');
const statusEl = document.querySelector('#status');
const promptEl = document.querySelector('#prompt');
const useButton = document.querySelector('#action-use');
const fireButton = document.querySelector('#action-fire');
const npcCard = document.querySelector('#npc-card');
const npcNameEl = document.querySelector('#npc-name');
const npcStateEl = document.querySelector('#npc-state');
const npcMemoryEl = document.querySelector('#npc-memory');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fb5ca);
scene.fog = new THREE.Fog(0x8fb5ca, 85, 235);

const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.08, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 900 ? 1.35 : 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
gameRoot.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xe7f5ff, 0x667054, 1.65);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4df, 2.35);
sun.position.set(55, 85, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(innerWidth < 900 ? 1024 : 2048, innerWidth < 900 ? 1024 : 2048);
sun.shadow.camera.left = -95;
sun.shadow.camera.right = 95;
sun.shadow.camera.top = 95;
sun.shadow.camera.bottom = -95;
sun.shadow.bias = -0.0008;
scene.add(sun);

const clock = new THREE.Clock();
const keys = {};
let orbitYaw = Math.PI;
let orbitPitch = 0.28;
let cameraDistance = 6.6;
let draggingCamera = false;
let lastPointer = { x: 0, y: 0 };
let currentVehicle = null;
let inspectedNpc = null;
let lastShot = -99;

const mat = (color, roughness = 0.88, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const roadMat = mat(0x30363a, 0.96);
const sidewalkMat = mat(0xa8aaa2, 0.98);
const curbMat = mat(0xc5c5bc, 0.95);
const grassMat = mat(0x55784a, 1);
const whiteMat = mat(0xf2f0df, 0.8);
const yellowMat = mat(0xe5bd43, 0.75);

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const ROAD_CENTERS = [-60, 0, 60];
const BLOCK_CENTERS = [-90, -30, 30, 90];
const ROAD_HALF = 9;
const SIDEWALK_HALF = 21;

function addCrosswalk(cx, cz, horizontalRoad) {
  const stripeCount = 7;
  const spacing = 1.35;
  for (let i = 0; i < stripeCount; i++) {
    const offset = (i - (stripeCount - 1) / 2) * spacing;
    const stripe = horizontalRoad
      ? box(0.72, 0.025, 7.3, whiteMat, cx + offset, 0.055, cz)
      : box(7.3, 0.025, 0.72, whiteMat, cx, 0.055, cz + offset);
    stripe.castShadow = false;
    scene.add(stripe);
  }
}

function addRoadMarkings() {
  for (const x of ROAD_CENTERS) {
    for (let z = -112; z <= 112; z += 10) {
      if (ROAD_CENTERS.some(c => Math.abs(z - c) < 12)) continue;
      const dash = box(0.18, 0.02, 4.8, yellowMat, x, 0.045, z);
      dash.castShadow = false;
      scene.add(dash);
    }
  }
  for (const z of ROAD_CENTERS) {
    for (let x = -112; x <= 112; x += 10) {
      if (ROAD_CENTERS.some(c => Math.abs(x - c) < 12)) continue;
      const dash = box(4.8, 0.02, 0.18, yellowMat, x, 0.046, z);
      dash.castShadow = false;
      scene.add(dash);
    }
  }

  for (const x of ROAD_CENTERS) {
    for (const z of ROAD_CENTERS) {
      addCrosswalk(x, z - 10.7, true);
      addCrosswalk(x, z + 10.7, true);
      addCrosswalk(x - 10.7, z, false);
      addCrosswalk(x + 10.7, z, false);
    }
  }
}

function createWorld() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  for (const x of ROAD_CENTERS) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(18, 240), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.012, 0);
    road.receiveShadow = true;
    scene.add(road);
  }
  for (const z of ROAD_CENTERS) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(240, 18), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.014, z);
    road.receiveShadow = true;
    scene.add(road);
  }

  addRoadMarkings();

  const buildingColors = [0x998a78, 0x707c84, 0xb4a77f, 0x816f68, 0x9ca3a5, 0x8f9279];
  for (const x of BLOCK_CENTERS) {
    for (const z of BLOCK_CENTERS) {
      const sidewalk = box(42, 0.18, 42, sidewalkMat, x, 0.08, z);
      sidewalk.receiveShadow = true;
      sidewalk.castShadow = false;
      scene.add(sidewalk);

      const curbNorth = box(42, 0.26, 0.35, curbMat, x, 0.13, z - 20.8);
      const curbSouth = box(42, 0.26, 0.35, curbMat, x, 0.13, z + 20.8);
      const curbWest = box(0.35, 0.26, 42, curbMat, x - 20.8, 0.13, z);
      const curbEast = box(0.35, 0.26, 42, curbMat, x + 20.8, 0.13, z);
      [curbNorth, curbSouth, curbWest, curbEast].forEach(c => { c.castShadow = false; scene.add(c); });

      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const w = 10 + Math.random() * 8;
        const d = 10 + Math.random() * 8;
        const h = 10 + Math.random() * 30;
        const px = x + (Math.random() - 0.5) * 19;
        const pz = z + (Math.random() - 0.5) * 19;
        const building = box(w, h, d, mat(buildingColors[Math.floor(Math.random() * buildingColors.length)], 0.93), px, h / 2 + 0.18, pz);
        scene.add(building);

        if (Math.random() > 0.35) {
          const door = box(Math.min(2.4, w * 0.22), 2.5, 0.12, mat(0x313b42, 0.55), px, 1.43, pz + d / 2 + 0.07);
          door.castShadow = false;
          scene.add(door);
        }
      }
    }
  }

  for (let i = 0; i < 22; i++) {
    const trunk = box(0.38, 2.2, 0.38, mat(0x5a3d26));
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.25, 9, 7), mat(0x315f34));
    const axis = Math.random() > 0.5;
    const lane = [-108, -72, -48, -12, 12, 48, 72, 108][Math.floor(Math.random() * 8)];
    const other = -108 + Math.random() * 216;
    trunk.position.set(axis ? lane : other, 1.2, axis ? other : lane);
    crown.position.copy(trunk.position).add(new THREE.Vector3(0, 2.15, 0));
    trunk.castShadow = crown.castShadow = true;
    scene.add(trunk, crown);
  }
}
createWorld();

function makePerson(color = 0x20252d, skin = 0xd2a27e) {
  const group = new THREE.Group();
  const torso = box(0.78, 1.25, 0.46, mat(color), 0, 1.28, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 9), mat(skin));
  head.position.y = 2.12;
  head.castShadow = true;
  const legMat = mat(0x1c2430);
  const leftLeg = box(0.27, 0.86, 0.28, legMat, -0.2, 0.43, 0);
  const rightLeg = box(0.27, 0.86, 0.28, legMat, 0.2, 0.43, 0);
  const leftArm = box(0.21, 0.98, 0.22, mat(color), -0.51, 1.32, 0);
  const rightArm = box(0.21, 0.98, 0.22, mat(color), 0.51, 1.32, 0);
  group.add(torso, head, leftLeg, rightLeg, leftArm, rightArm);
  return group;
}

const player = makePerson(0x171b21, 0xc98e6c);
player.position.set(18, 0.18, 18);
scene.add(player);

const gun = new THREE.Group();
gun.add(box(0.12, 0.14, 0.8, mat(0x151515, 0.5, 0.15), 0, 0, -0.35));
gun.add(box(0.12, 0.35, 0.15, mat(0x202020), 0, -0.17, -0.04));
gun.position.set(0.55, 1.42, -0.25);
player.add(gun);

const savedBrains = JSON.parse(localStorage.getItem('jogo2_npc_brains') || '{}');
const npcNames = ['Maya', 'Davi', 'Luna', 'Rico', 'Bia', 'Theo', 'Nina', 'Caio', 'Jade', 'Noah', 'Liz', 'Ivo'];
const npcColors = [0xb33b3b, 0x315f95, 0x5f3a81, 0x496b45, 0xc17a35, 0x444a55, 0x7e3f62];
const npcs = [];

function randomBlockIndex() {
  return Math.floor(Math.random() * BLOCK_CENTERS.length);
}

function sidewalkPoint(blockX, blockZ) {
  const cx = BLOCK_CENTERS[blockX];
  const cz = BLOCK_CENTERS[blockZ];
  const side = Math.floor(Math.random() * 4);
  const along = -17 + Math.random() * 34;
  const edge = 17 + Math.random() * 2;
  if (side === 0) return new THREE.Vector3(cx + along, 0.18, cz - edge);
  if (side === 1) return new THREE.Vector3(cx + along, 0.18, cz + edge);
  if (side === 2) return new THREE.Vector3(cx - edge, 0.18, cz + along);
  return new THREE.Vector3(cx + edge, 0.18, cz + along);
}

function crossingRoute(fromBX, fromBZ, toBX, toBZ) {
  const route = [];
  let bx = fromBX;
  let bz = fromBZ;

  while (bx !== toBX) {
    const step = Math.sign(toBX - bx);
    const roadX = (BLOCK_CENTERS[bx] + BLOCK_CENTERS[bx + step]) / 2;
    const crossZ = BLOCK_CENTERS[bz] + (Math.random() > 0.5 ? 18 : -18);
    route.push(new THREE.Vector3(roadX - step * 11, 0.18, crossZ));
    route.push(new THREE.Vector3(roadX, 0.06, crossZ));
    route.push(new THREE.Vector3(roadX + step * 11, 0.18, crossZ));
    bx += step;
  }

  while (bz !== toBZ) {
    const step = Math.sign(toBZ - bz);
    const roadZ = (BLOCK_CENTERS[bz] + BLOCK_CENTERS[bz + step]) / 2;
    const crossX = BLOCK_CENTERS[bx] + (Math.random() > 0.5 ? 18 : -18);
    route.push(new THREE.Vector3(crossX, 0.18, roadZ - step * 11));
    route.push(new THREE.Vector3(crossX, 0.06, roadZ));
    route.push(new THREE.Vector3(crossX, 0.18, roadZ + step * 11));
    bz += step;
  }

  route.push(sidewalkPoint(bx, bz));
  return route;
}

class Citizen {
  constructor(name, index) {
    this.name = name;
    this.group = makePerson(npcColors[index % npcColors.length], [0xd2a27e, 0x8d5c45, 0xe0b18c][index % 3]);
    this.blockX = randomBlockIndex();
    this.blockZ = randomBlockIndex();
    this.group.position.copy(sidewalkPoint(this.blockX, this.blockZ));
    this.group.userData.npc = this;
    this.group.traverse(o => { o.userData.npc = this; });
    scene.add(this.group);
    this.hp = 100;
    this.state = 'andando na calçada';
    this.route = [sidewalkPoint(this.blockX, this.blockZ)];
    this.target = this.route[0];
    this.speed = 1.35 + Math.random() * 0.5;
    this.decisionTimer = Math.random() * 3;
    this.socialCooldown = Math.random() * 4;
    this.needs = { hunger: Math.random() * 25, social: Math.random() * 40, fear: 0 };
    this.memory = savedBrains[name]?.memory || [];
    this.relationships = savedBrains[name]?.relationships || {};
  }

  remember(type, text, actor = null, weight = 1) {
    this.memory.unshift({ type, text, actor, weight, at: Date.now() });
    this.memory = this.memory.slice(0, 16);
  }

  relation(name) { return this.relationships[name] || 0; }
  changeRelation(name, amount) {
    this.relationships[name] = THREE.MathUtils.clamp(this.relation(name) + amount, -100, 100);
  }

  planWalk(forceNewBlock = false) {
    let bx = this.blockX;
    let bz = this.blockZ;
    if (forceNewBlock || Math.random() < 0.32) {
      if (Math.random() > 0.5) bx = THREE.MathUtils.clamp(bx + (Math.random() > 0.5 ? 1 : -1), 0, 3);
      else bz = THREE.MathUtils.clamp(bz + (Math.random() > 0.5 ? 1 : -1), 0, 3);
    }
    this.route = crossingRoute(this.blockX, this.blockZ, bx, bz);
    this.blockX = bx;
    this.blockZ = bz;
    this.target = this.route.shift() || sidewalkPoint(bx, bz);
  }

  chooseAction() {
    if (this.hp <= 0) return;
    if (this.needs.fear > 45) {
      this.state = 'fugindo pela calçada';
      this.planWalk(true);
      return;
    }
    this.state = this.needs.hunger > 72 ? 'procurando comida' : 'andando na calçada';
    this.planWalk(false);
  }

  update(dt) {
    if (this.hp <= 0) return;
    this.decisionTimer -= dt;
    this.socialCooldown -= dt;
    this.needs.hunger = Math.min(100, this.needs.hunger + dt * 0.5);
    this.needs.social = Math.min(100, this.needs.social + dt * 0.4);
    this.needs.fear = Math.max(0, this.needs.fear - dt * 2.1);

    const targetDistance = this.group.position.distanceTo(this.target);
    if (targetDistance < 0.55) {
      if (this.route.length) this.target = this.route.shift();
      else this.chooseAction();
    } else if (this.decisionTimer <= 0 && this.route.length === 0) {
      this.decisionTimer = 2 + Math.random() * 4;
      this.chooseAction();
    }

    const dir = this.target.clone().sub(this.group.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.04) {
      dir.normalize();
      const movingOnRoad = ROAD_CENTERS.some(x => Math.abs(this.group.position.x - x) < ROAD_HALF) || ROAD_CENTERS.some(z => Math.abs(this.group.position.z - z) < ROAD_HALF);
      const moveSpeed = this.state.includes('fugindo') ? this.speed * 1.8 : this.speed;
      this.group.position.addScaledVector(dir, dt * moveSpeed);
      this.group.rotation.y = Math.atan2(dir.x, dir.z);
      this.group.position.y = movingOnRoad ? 0.06 : 0.18;
    }

    for (const other of npcs) {
      if (other === this || other.hp <= 0 || this.socialCooldown > 0) continue;
      if (this.group.position.distanceTo(other.group.position) < 2.15) {
        this.socialCooldown = 7 + Math.random() * 5;
        this.needs.social = Math.max(0, this.needs.social - 34);
        const vibe = Math.random() > 0.18 ? 2 : -3;
        this.changeRelation(other.name, vibe);
        this.remember('social', `Encontrou ${other.name}. Relação agora: ${this.relation(other.name)}.`, other.name, Math.abs(vibe));
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
      this.group.position.y += 0.35;
      this.remember('danger', 'Foi derrubado pelo jogador.', 'Jogador', 20);
    } else {
      this.state = 'fugindo pela calçada';
      this.planWalk(true);
    }
  }
}

npcNames.forEach((name, i) => npcs.push(new Citizen(name, i)));

class Car {
  constructor(color, x, z, rotation = 0) {
    this.group = new THREE.Group();
    this.body = box(3.65, 0.72, 1.78, mat(color, 0.52, 0.08), 0, 0.7, 0);
    this.cabin = box(1.95, 0.7, 1.52, mat(0x7892a0, 0.25, 0.08), -0.2, 1.33, 0);
    this.hood = box(0.85, 0.12, 1.62, mat(color, 0.5, 0.08), 1.25, 1.08, 0);
    this.group.add(this.body, this.cabin, this.hood);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12), mat(0x101112));
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(sx * 1.15, 0.38, sz * 0.9);
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
    this.speed += accel * dt * 9.5;
    this.speed *= Math.pow(0.984, dt * 60);
    this.speed = THREE.MathUtils.clamp(this.speed, -5.5, 17);
    if (Math.abs(this.speed) > 0.25) this.group.rotation.y += steer * dt * 1.45 * Math.sign(this.speed);
    const forward = new THREE.Vector3(Math.sin(this.group.rotation.y), 0, Math.cos(this.group.rotation.y));
    this.group.position.addScaledVector(forward, this.speed * dt);
    this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, -114, 114);
    this.group.position.z = THREE.MathUtils.clamp(this.group.position.z, -114, 114);

    for (const npc of npcs) {
      if (npc.hp <= 0) continue;
      const d = npc.group.position.distanceTo(this.group.position);
      if (d < 1.75 && Math.abs(this.speed) > 3) {
        npc.hit(Math.min(100, 24 + Math.abs(this.speed) * 5));
        const push = npc.group.position.clone().sub(this.group.position).setY(0).normalize();
        npc.group.position.addScaledVector(push, 1.7);
        this.speed *= 0.55;
      }
    }
  }
}

const cars = [
  new Car(0xb72d2d, 10, -4, Math.PI / 2),
  new Car(0x1e4d75, -52, 5, 0),
  new Car(0xd08a26, 67, -5, Math.PI),
  new Car(0x30343a, -5, 62, Math.PI / 2),
];

function nearestCar() {
  return cars.map(car => ({ car, d: car.group.position.distanceTo(player.position) })).sort((a, b) => a.d - b.d)[0];
}

function nearestNpc(reference = player.position) {
  return npcs.filter(n => n.hp > 0).map(npc => ({ npc, d: npc.group.position.distanceTo(reference) })).sort((a, b) => a.d - b.d)[0];
}

function syncUseButton() {
  useButton.textContent = currentVehicle ? 'SAIR' : 'ENTRAR';
}

function toggleVehicle() {
  if (currentVehicle) {
    const side = new THREE.Vector3(Math.cos(currentVehicle.group.rotation.y), 0, -Math.sin(currentVehicle.group.rotation.y));
    player.position.copy(currentVehicle.group.position).addScaledVector(side, 2.6);
    player.position.y = 0.18;
    player.visible = true;
    currentVehicle = null;
    statusEl.textContent = 'A pé • Pistola';
    orbitPitch = 0.28;
    cameraDistance = 6.6;
    syncUseButton();
    return;
  }
  const near = nearestCar();
  if (near && near.d < 4.5) {
    currentVehicle = near.car;
    player.visible = false;
    statusEl.textContent = 'Dirigindo • E para sair';
    orbitYaw = 0;
    orbitPitch = 0.04;
    syncUseButton();
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
  npcNameEl.textContent = `${inspectedNpc.name} • HP ${Math.round(inspectedNpc.hp)}`;
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
    if (npc.group.position.distanceTo(player.position) < 28) {
      npc.needs.fear = Math.max(npc.needs.fear, 60);
      if (!hits[0] || hits[0].object.userData.npc !== npc) npc.remember('danger', 'Ouviu um disparo perto e ficou em alerta.', 'Jogador', 5);
    }
  }
}

function updatePlayer(dt) {
  if (currentVehicle) return;
  const forwardInput = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  const sideInput = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  if (!forwardInput && !sideInput) return;

  const camForward = new THREE.Vector3(-Math.sin(orbitYaw), 0, -Math.cos(orbitYaw)).normalize();
  const camRight = new THREE.Vector3(-camForward.z, 0, camForward.x);
  const move = camForward.multiplyScalar(forwardInput).add(camRight.multiplyScalar(sideInput)).normalize();
  const speed = keys.ShiftLeft || keys.ShiftRight ? 7.2 : 4.25;
  player.position.addScaledVector(move, dt * speed);
  player.position.x = THREE.MathUtils.clamp(player.position.x, -112, 112);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -112, 112);
  player.rotation.y = Math.atan2(move.x, move.z);
}

function updateCamera() {
  if (currentVehicle) {
    const car = currentVehicle.group;
    const driverLocal = new THREE.Vector3(-0.32, 1.52, 0.34);
    const driverWorld = car.localToWorld(driverLocal.clone());
    const forward = new THREE.Vector3(Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y));
    const right = new THREE.Vector3(Math.cos(car.rotation.y), 0, -Math.sin(car.rotation.y));
    const lookDir = forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), orbitYaw * 0.42);
    const desired = driverWorld.clone().addScaledVector(right, 0.08);
    camera.position.lerp(desired, 0.28);
    camera.lookAt(camera.position.clone().add(lookDir.multiplyScalar(18)).add(new THREE.Vector3(0, -orbitPitch * 2.2, 0)));
    return;
  }

  const target = player.position.clone().add(new THREE.Vector3(0, 1.48, 0));
  const horizontal = Math.cos(orbitPitch) * cameraDistance;
  const desired = target.clone().add(new THREE.Vector3(
    Math.sin(orbitYaw) * horizontal,
    1.25 + Math.sin(orbitPitch) * cameraDistance,
    Math.cos(orbitYaw) * horizontal
  ));
  camera.position.lerp(desired, 0.18);
  camera.lookAt(target.clone().add(new THREE.Vector3(0, 0.22, 0)));
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
  const cameraGesture = e.button === 2 || (e.pointerType === 'touch' && e.clientX > innerWidth * 0.36 && e.clientY < innerHeight * 0.78);
  if (cameraGesture) {
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
  if (currentVehicle) {
    orbitYaw = THREE.MathUtils.clamp(orbitYaw - dx * 0.004, -1.05, 1.05);
    orbitPitch = THREE.MathUtils.clamp(orbitPitch + dy * 0.0025, -0.18, 0.28);
  } else {
    orbitYaw -= dx * 0.0055;
    orbitPitch = THREE.MathUtils.clamp(orbitPitch + dy * 0.0035, 0.06, 0.92);
  }
  lastPointer = { x: e.clientX, y: e.clientY };
});
renderer.domElement.addEventListener('pointerup', e => {
  draggingCamera = false;
  renderer.domElement.releasePointerCapture?.(e.pointerId);
});
renderer.domElement.addEventListener('pointercancel', () => { draggingCamera = false; });
renderer.domElement.addEventListener('wheel', e => {
  if (!currentVehicle) cameraDistance = THREE.MathUtils.clamp(cameraDistance + e.deltaY * 0.007, 4.2, 11.5);
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
fireButton.addEventListener('pointerdown', e => { e.preventDefault(); shoot(); });
useButton.addEventListener('pointerdown', e => { e.preventDefault(); toggleVehicle(); });
document.querySelector('#action-memory').addEventListener('pointerdown', e => { e.preventDefault(); inspectMemory(); });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 900 ? 1.35 : 1.7));
});

syncUseButton();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.045);
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
