import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $ = (s) => document.querySelector(s);
const VERSION = 'Beta 0.2.0';
const isForcedLandscape = () => matchMedia('(orientation:portrait) and (pointer:coarse)').matches;
const viewport = () => isForcedLandscape() ? { w: innerHeight, h: innerWidth } : { w: innerWidth, h: innerHeight };

function showFatal(error) {
  console.error('[Cidade Viva] fatal boot error:', error);
  const loading = $('#loading-screen');
  if (!loading) return;
  loading.classList.remove('done');
  loading.innerHTML = `<div class="loading-brand">CIDADE VIVA</div><div class="loading-version">${VERSION}</div><div class="loading-tip" style="max-width:520px;text-align:center">FALHA AO INICIAR<br><small>${String(error?.message || error)}</small></div>`;
}

try {
  const game = $('#game');
  if (!game) throw new Error('Elemento #game nÃ£o encontrado');

  const vp = viewport();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x93b9cf);
  scene.fog = new THREE.Fog(0x93b9cf, 145, 335);

  const camera = new THREE.PerspectiveCamera(62, vp.w / vp.h, 0.05, 600);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(vp.w, vp.h, false);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  game.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x5c6b55, 1.45));
  const sun = new THREE.DirectionalLight(0xfff2db, 2);
  sun.position.set(50, 80, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const mat = (c, r = .9, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const roadMat = mat(0x272d31, .98), sideMat = mat(0xb9bab3, .98), grassMat = mat(0x557a4e, 1), lineMat = mat(0xead04a, .8), whiteMat = mat(0xf2f1e9, .82), darkMat = mat(0x171b20, .7, .1);
  function box(w, h, d, material, x = 0, y = 0, z = 0) {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    return o;
  }

  const roads = [-60, 0, 60], blocks = [-90, -30, 30, 90];
  const statics = [], trees = [], poles = [], signals = [], cars = [], npcs = [], towJobs = [], samuJobs = [], projectiles = [];
  const loader = new GLTFLoader();
  const assetCache = new Map();
  let activeTowJob = null, activeSamuJob = null;

  const vehicleAsset = {
    police: './police_car_simple.glb',
    tow: './tow_truck_simple.glb',
    samu: './Bu.glb'
  };

  function addStatic(x, z, hx, hz, type, owner = null) {
    const c = { x, z, hx, hz, type, owner, active: true };
    statics.push(c);
    return c;
  }
  function circleAabb(p, r, b) {
    if (!b.active) return false;
    const x = THREE.MathUtils.clamp(p.x, b.x - b.hx, b.x + b.hx), z = THREE.MathUtils.clamp(p.z, b.z - b.hz, b.z + b.hz);
    const dx = p.x - x, dz = p.z - z;
    return dx * dx + dz * dz < r * r;
  }
  const hitsStatic = (p, r = .4) => statics.find(b => circleAabb(p, r, b)) || null;
  function localCar(c, p) {
    const q = p.clone().sub(c.g.position), a = -c.g.rotation.y, co = Math.cos(a), si = Math.sin(a);
    return { x: q.x * co - q.z * si, z: q.x * si + q.z * co };
  }
  function hitsCar(c, p, r = .4) {
    if (!c || c.removed) return false;
    const q = localCar(c, p);
    return Math.abs(q.x) <= c.halfW + r && Math.abs(q.z) <= c.halfL + r;
  }
  function carsTouch(a, b) {
    if (!a || !b || a.removed || b.removed) return false;
    const pts = [[0, a.halfL], [0, -a.halfL], [a.halfW, a.halfL * .72], [-a.halfW, a.halfL * .72], [a.halfW, -a.halfL * .72], [-a.halfW, -a.halfL * .72]];
    return pts.some(([x, z]) => hitsCar(b, a.g.localToWorld(new THREE.Vector3(x, 0, z)), .08));
  }
  function carStaticHit(c) {
    for (const [x, z] of [[0, c.halfL], [0, -c.halfL], [c.halfW, c.halfL * .72], [-c.halfW, c.halfL * .72], [c.halfW, -c.halfL * .72], [-c.halfW, -c.halfL * .72]]) {
      const h = hitsStatic(c.g.localToWorld(new THREE.Vector3(x, 0, z)), .16);
      if (h) return h;
    }
    return null;
  }

  function person(color = 0x20242a, skin = 0xd2a27e, role = 'civilian') {
    const g = new THREE.Group();
    const torso = box(.72, 1.08, .4, mat(color), 0, 1.22, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.29, 14, 10), mat(skin));
    head.position.y = 2;
    const ll = box(.25, .82, .27, mat(0x202733), -.19, .43, 0), rl = box(.25, .82, .27, mat(0x202733), .19, .43, 0), la = box(.19, .9, .2, mat(color), -.46, 1.25, 0), ra = box(.19, .9, .2, mat(color), .46, 1.25, 0);
    g.add(torso, head, ll, rl, la, ra);
    g.userData.parts = { torso, head, ll, rl, la, ra };
    g.userData.role = role;
    if (role === 'police') {
      const gun = new THREE.Group();
      gun.add(box(.12, .15, .58, mat(0x121417, .35, .3), 0, 0, .28), box(.14, .28, .14, mat(0x262a2e), 0, -.17, .06));
      gun.position.set(.36, 1.35, .18);
      g.add(gun);
      g.userData.gun = gun;
    }
    if (role === 'medic') {
      const badge = box(.18, .18, .03, mat(0xd02d34), 0, 1.4, -.22);
      g.add(badge);
    }
    return g;
  }

  const LIGHT = { GREEN: 8, YELLOW: 2, RED: 8, CYCLE: 18 };
  function addTree(x, z) {
    const g = new THREE.Group();
    g.add(box(.36, 2.2, .36, mat(0x593d25), 0, 1.2, 0));
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 8), mat(0x315f34));
    crown.position.y = 3.15;
    g.add(crown);
    g.position.set(x, 0, z);
    scene.add(g);
    const t = { g, fallen: false, collider: null };
    t.collider = addStatic(x, z, .3, .3, 'tree', t);
    trees.push(t);
  }
  function addSignal(x, z, rot = 0, phase = 0) {
    const g = new THREE.Group();
    g.add(box(.2, 3.25, .2, darkMat, 0, 1.62, 0), box(2.5, .14, .14, darkMat, 1.15, 3.05, 0), box(.52, 1.35, .44, darkMat, 2.2, 2.72, 0));
    const mk = (y, c) => { const s = new THREE.Mesh(new THREE.SphereGeometry(.115, 10, 8), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .08 })); s.position.set(2.2, y, -.24); g.add(s); return s; };
    const red = mk(3.08, 0x6a1010), yellow = mk(2.72, 0x725d10), green = mk(2.36, 0x0f5f27);
    g.position.set(x, .12, z); g.rotation.y = rot; scene.add(g);
    const s = { g, red, yellow, green, phase, fallen: false, state: 'RED', collider: null };
    s.collider = addStatic(x, z, .3, .3, 'pole', s); signals.push(s); poles.push(s); return s;
  }
  function signalState(s, t) { const p = (t + s.phase) % LIGHT.CYCLE; if (p < LIGHT.GREEN) return 'GREEN'; if (p < LIGHT.GREEN + LIGHT.YELLOW) return 'YELLOW'; return 'RED'; }
  function updateSignals(t) {
    for (const s of signals) {
      if (s.fallen) continue;
      s.state = signalState(s, t);
      const set = (m, on, c) => { m.material.color.setHex(on ? c : 0x171717); m.material.emissive.setHex(on ? c : 0); m.material.emissiveIntensity = on ? 1.8 : .02; };
      set(s.green, s.state === 'GREEN', 0x25d45c); set(s.yellow, s.state === 'YELLOW', 0xffbf28); set(s.red, s.state === 'RED', 0xff3030);
    }
  }
  function signalAhead(vehicle) {
    const pos = vehicle.g.position, f = new THREE.Vector3(Math.sin(vehicle.g.rotation.y), 0, Math.cos(vehicle.g.rotation.y));
    for (const s of signals) {
      if (s.fallen) continue;
      const d = s.g.position.clone().sub(pos).setY(0), dist = d.length();
      if (dist > 13 || dist < 1.5) continue;
      if (f.dot(d.normalize()) < .78) continue;
      if (s.state !== 'GREEN') return true;
    }
    return false;
  }
  function knock(o, car) {
    if (!o ||"o.fallen) return;
    o.fallen = true; if (o.collider) o.collider.active = false;
    const d = o.g.position.clone().sub(car.g.position); o.axis = Math.abs(d.x) > Math.abs(d.zi) ? 'z' : 'x'; o.sign = (o.axis === 'z' ? d.x : d.z) >= 0 ? 1 : -1;
  }

  function world() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), grassMat); ground.rotation.x = -Math.PI / 2; ground.position.y = -.06; scene.add(ground);
    for (const x of roads) { const r = new THREE.Mesh(new THREE.PlaneGeometry(18, 240), roadMat); r.rotation.x = -Math.PI / 2; r.position.set(x, 0, 0); scene.add(r); }
    for (const z of roads) { const r = new THREE.Mesh(new THREE.PlaneGeometry(240, 18), roadMat); r.rotation.x = -Math.PI / 2; r.position.set(0, .002, z); scene.add(r); }
    for (const x of roads) for (let z = -110; z <= 110; z += 10) if (!roads.some(v => Math.abs(z - v) < 11)) scene.add(box(.14, .018, 4.2, lineMat, x, .022, z));
    for (const z of roads) for (let x = -110; x <= 110; x += 10) if (!roads.some(v => Math.abs(x - v) < 11)) scene.add(box(4.2, .018, .14, lineMat, x, .024, z));
    for (const x of roads) for (const z of roads) {
      for (let i = -3; i <= 3; i++) {
        scene.add(box(.66, .02, 7.4, whiteMat, x + i * 1.15, .028, z - 12)); scene.add(box(.66, .02, 7.4, whiteMat, x + i * 1.15, .028, z + 12));
        scene.add(box(7.4, .02, .66, whiteMat, x - 12, .028, z + i * 1.15)); scene.add(box(7.4, .02, .66, whiteMat, x + 12, .028, z + i * 1.15));
      }
      addSignal(x - 13, z - 13, 0, 0); addSignal(x + 13, z + 13, Math.PI, 0); addSignal(x - 13, z + 13, -Math.PI / 2, 9); addSignal(x + 13, z - 13, Math.PI / 2, 9);
    }
    const cols = [0x93836f, 0x718087, 0xa99d78, 0x806b62, 0x9aa2a5];
    for (const bx of blocks) for (const bz of blocks) {
      scene.add(box(42, .18, 42, sideMat, bx, .08, bz));
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        const w = 11 + Math.random() * 7, d = 11 + Math.random() * 7, h = 12 + Math.random() * 28, x = bx + (Math.random() - .5) * 18, z = bz + (Math.random() - .5) * 18;
        scene.add(box(w, h, d, mat(cols[Math.floor(Math.random() * cols.length)], .94), x, h / 2 + .18, z)); addStatic(x, z, w / 2 + .2, d / 2 + .2, 'building');
      }
      for (const [ox, oz] of [[-18, -8], [-18, 8], [18, -8], [18, 8], [-8, -18], [8, -18], [-8, 18], [8, 18]]) if (Math.random() < .45) addTree(bx + ox, bz + oz);
    }
    scene.add(box(30, .16, 18, mat(0x6a6e70), -82, .02, -116)); scene.add(box(18, 5, 10, mat(0x4d555a), -88, 2.5, -121)); scene.add(box(8, .12, 4, lineMat, -70, .08, -112));
    scene.add(box(28, .16, 18, mat(0xdedede), 82, .02, 116)); scene.add(box(17, 5, 10, mat(0xf4f4f4), 88, 2.5, 121)); scene.add(box(5, .16, 1.2, mat(0xc93030), 88, 4.2, 115));
    scene.add(box(24, .16, 16, mat(0x565d65), 82, .02, -116)); scene.add(box(15, 5, 9, mat(0x303944), 88, 2.5, -121));
  }
  world();

  function carMesh(color, kind = 'normal') {
    const tow = kind === 'tow', amb = kind == 'samu', police = kind === 'police';
    const g = new THREE.Group();
    const body = box(tow ? 2.25 : 1.9, .65, tow ? 5 : 4, mat(color, .55, .15), 0, .68, 0);
    const hood = box(tow ? 2.05 : 1.75, .36, 1.25, mat(color, .55, .15), 0, 1, 1.35);
    const cab = box(tow ? 1.95 : 1.68, .8, tow ? 1.9 : 1.72, mat(0x7b95a3, .28, .06), 0, 1.3, -.35);
    g.add(body, hood, cab);
    if (tow) { g.add(box(1.9, .16, 2.6, darkMat, 0, .78, -2.15)); g.add(box(.18, .18, 2.2, lineMat, 0, .92, -2.25)); }
    if (amb) { g.add(box(1.5, .14, .35, mat(0xc93030), 0, 1.72, -.2)); g.add(box(.32, .16, 1.2, mat(0x2468a2), 0, 1.84, -.2)); }
    if (police) { g.add(box(1.4, .12, .26, mat(0x1e65d8), 0, 1.83, -.2)); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.37, .37, .26, 12), darkMat); w.rotation.z = Math.PI / 2; w.position.set(sx * (tow ? 1.13 : .98), .4, sz * (tow ? 1.58 : 1.24)); g.add(w); }
    return { g, body, hood, cab };
  }

  function loadAsset(path) {
    if (!assetCache.has(path)) assetCache.set(path, new Promise((resolve, reject) => loader.load(path, gltf => resolve(gltf.scene), undefined, reject)));
    return assetCache.get(path);
  }
  async function applyVehicleSkin(car) {
    const path = vehicleAsset[car.kind];
    if (!path) return;
    try {
      const src = await loadAsset(path), model = src.clone(true);
      model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.material = o.material?.clone?.() || o.material; } });
      const b = new THREE.Box3().setFromObject(model), size = new THREE.Vector3(), center = new THREE.Vector3(); b.getSize(size); b.getCenter(center);
      const desiredLength = car.halfL * 2, desiredWidth = car.halfW * 2;
      const sx = desiredWidth / Math.max(.01, size.x), sz = desiredLength / Math.max(.01, size.z), s = Math.min(sx, sz) * .96;
      model.scale.setScalar(s);
      model.position.sub(center.multiplyScalar(s));
      const bb = new THREE.Box3().setFromObject(model), minY = bb.min.y; model.position.y -= minY - .05;
      car.g.add(model); car.model3d = model;
      car.body.visible = car.hood.visible = car.cab.visible = false;
    } catch (e) { console.warn('[Cidade Viva] falha ao carregar skin', car.kind, e); }
  }
  function tintVehicle(car, hex) {
    if (!car.model3d) return;
    car.model3d.traverse(o => { if (o.isMesh && o.material?.color) o.material.color.lerp(new THREE.Color(hex), .7); });
  }

  function occupantColor(role) { return role === 'police' ? 0x162b55 : role === 'medic' ? 0xf0f2f4 : 0x36556f; }
  function attachOccupant(car, role = 'civilian', seat = 'driver', hp = 100) {
    if (seat === 'driver' && car.driver) return car.driver;
    const d = person(occupantColor(role), 0xb98262, role); d.scale.setScalar(.55); d.position.set(seat === 'driver' ? -.25 : .35, .62, -.18); d.rotation.y = Math.PI;
    d.userData.hp = hp; d.userData.vehicle = car; d.userData.role = role; d.userData.seat = seat;
    car.g.add(d);
    if (seat === 'driver') car.driver = d; else car.passengers.push(d);
    return d;
  }

  function separationPoint(car, pos, extra = .75) {
    const q = localCar(car, pos), dx = car.halfW - Math.abs(q.x), dz = car.halfL - Math.abs(q.z); let lx = q.x, lz = q.z;
    if (dx < dz) lx = (q.x >= 0 ? 1 : -1) * (car.halfW + extra); else lz = (q.z >= 0 ? 1 : -1) * (car.halfL + extra);
    const p = car.g.localToWorld(new THREE.Vector3(lx, .18, lz)); p.y = .18; return p;
  }
  function isRoadPoint(p) { return roads.some(r => Math.abs(p.x - r) < 8.7 || Math.abs(p.z - r) < 8.7); }
  function sidewalkPointNear(origin, radius = 16) {
    const tries = [];
    for (const bx of blocks) for (const bz of blocks) for (const [ox, oz] of [[18, 0], [-18, 0], [0, 18], [0, -18]]) { const p = new THREE.Vector3(bx + ox, .18, bz + oz), d = p.distanceTo(origin); if (d < radius) tries.push({ p, d }); }
    tries.sort((a, b) => a.d - b.d);
    for (const t of tries) if (!hitsStatic(t.p, .42) && cars.every(c => c.removed || !hitsCar(c, t.p, .45))) return t.p.clone();
    return null;
  }
  function vehicleThreatFor(npc) {
    let best = null;
    for (const c of cars) {
      if (c.removed || c.exploded || Math.abs(c.speed) < 2) continue;
      const d = npc.g.position.clone().sub(c.g.position).setY(0), dist = d.length(); if (dist > 10 || dist < .1) continue;
      const f = new THREE.Vector3(Math.sin(c.g.rotation.y), 0, Math.cos(c.g.rotation.y));
      if (f.dot(d.clone().normalize()) > .55 && (!best || dist < best.dist)) best = { car: c, dist, dir: d.normalize() };
    }
    return best;
  }

  let playerWanted = 0, wantedTimer = 0, lastCrime = '';
  function registerCrime(actor, level = 1, reason = 'crime') {
    if (actor === 'player') { playerWanted = Math.min(5, Math.max(playerWanted, level)); wantedTimer = 30; lastCrime = reason; return; }
    if (actor instanceof NPC) { actor.crimeLevel = Math.min(5, Math.max(actor.crimeLevel || 0, level)); actor.crimeTimer = 30; actor.lastCrime = reason; }
  }
  function hasCrime(actor) { return actor === 'player' ? playerWanted > 0 : actor instanceof NPC && actor.crimeLevel > 0; }
  function actorPosition(actor) { if (actor === 'player') return currentCar ? currentCar.g.position : player.position; return actor?.inVehicle ? actor.inVehicle.g.position : actor?.g?.position; }
  function nearestCriminal(from) {
    const candidates = [];
    if (playerWanted > 0 && !dead) candidates.push({ actor: 'player', d: from.distanceTo(actorPosition('player')) });
    for (const n of npcs) if (n.hp > 0 && n.crimeLevel > 0) candidates.push({ actor: n, d: from.distanceTo(actorPosition(n)) });
    candidates.sort((a, b) => a.d - b.d); return candidates[0]?.actor || null;
  }

  class NPC {
    constructor(name, i = 0, role = 'civilian', opts = {}) {
      this.name = name; this.role = role; this.g = person(occupantColor(role === 'civilian' ? null : role) || [0x7b3d55, 0x376b8b, 0x4f7a48, 0x8a642fZH	HKÌ˜LÙKXÍKLŒN×VÚH	H×K›ÛJNÂˆYˆ
›ÛHOOH	ØÚ]š[X[‰ÊH\Ë™Ë˜Ú[™[–ÌK›X]\šX[˜ÛÛÜ‹œÙ]^
ÌØŒÙMKÍÍ˜‹ØMM™—VÚH	HJNÂˆ\Ë™Ë˜]™\œÙJÈOˆË\Ù\‘]K›œÈH\ÊNÈØÙ[™K˜Y
\Ë™ÊNÂˆ\ËšHÜËšÏÈLÈ\Ë™İÛˆHÈ\Ë™[H™]È‘QK•™XİÜŒÊ
NÈ\Ë\™Ù]H[È\ËœØ[]T™\]Y\İYH˜[ÙNÈ\ËœÜYYHKŒNÈ\ËšYÛ›Ü™PØ\ˆH[È\ËšYÛ›Ü™PØ\•[Y\ˆHÈ\Ëš[•™ZXÛHH[È\Ëœ™]ZÙPØ\ˆH[È\Ë˜Üš[YS]™[HÈ\Ë˜Üš[YU[Y\ˆHÈ\Ë›\İÜš[YHH	ÉÎÂˆ\Ë˜œ˜Z[ˆHÈİ]Nˆ›ÛHOOH	ÜÛXÙIÈÈ	Ü]›Û	Èˆ	İØ[™\‰Ë™X\ˆ›ÛHOOH	ÜÛXÙIÈÈŒMHˆŒMH
ÈX]œ˜[™ÛJ
H
ˆKÛİ\˜YÙNˆ›ÛHOOH	ÜÛXÙIÈÈMHˆŒMH
ÈX]œ˜[™ÛJ
H
ˆËİ\š[ÜÚ]NˆŒˆ
ÈX]œ˜[™ÛJ
H
ˆËÛØÚX[ˆ›ÛHOOH	ÛYYXÉÈÈMHˆŒˆ
ÈX]œ˜[™ÛJ
H
ˆË[šÎˆŒˆ
ÈX]œ˜[™ÛJ
H
ˆK[\ˆ›Øİ\Îˆ[Y[[ÜšY\Îˆ×HNÂˆYˆ
[ÜË››Ô™[ØØ]JH\Ëœ™[ØØ]J
NÂˆBˆ™[Y[X™\Š\KÜËHLÙZYÚHJHÈÛÛœİHHÈ\KÜÎˆÜË˜ÛÛ™J
KÙZYÚNÈ\Ë˜œ˜Z[‹›Y[[ÜšY\Ë[œÚY
JNÈYˆ
\Ë˜œ˜Z[‹›Y[[ÜšY\Ë›[™İˆ
H\Ë˜œ˜Z[‹›Y[[ÜšY\Ë›[™İHÈ™]\›ˆNÈBˆ›Ü™Ù]

HÈ›Üˆ
ÛÛœİHÙˆ\Ë˜œ˜Z[‹›Y[[ÜšY\ÊHKOHÈ\Ë˜œ˜Z[‹›Y[[ÜšY\ÈH\Ë˜œ˜Z[‹›Y[[ÜšY\Ë™š[\ŠHOˆKˆ
NÈ\Ë˜œ˜Z[‹˜[\HX]›X^
\Ë˜œ˜Z[‹˜[\H
ˆŒ
NÈYˆ
\Ë˜Üš[YS]™[ˆ
HÈ\Ë˜Üš[YU[Y\ˆOHÈYˆ
\Ë˜Üš[YU[Y\ˆH
H\Ë˜Üš[YS]™[HÈHBˆ™[ØØ]J
HÂˆ›Üˆ
]ÈHÈÈŒÈÊÊÊHÂˆÛÛœİH›ØÚÜÖÓX]™›ÛÜŠX]œ˜[™ÛJ
H
ˆ
WKˆH›ØÚÜÖÓX]™›ÛÜŠX]œ˜[™ÛJ
H
ˆ
WKYÙHHÖÌN
X]œ˜[™ÛJ
HHJH
ˆÌ—KËLN
X]œ˜[™ÛJ
HHJH
ˆÌ—KÊX]œ˜[™ÛJ
HHJH
ˆÌ‹NKÊX]œ˜[™ÛJ
HHJH
ˆÌ‹LNWVÓX]™›ÛÜŠX]œ˜[™ÛJ
H
ˆ
WKH™]È‘QK•™XİÜŒÊ
ÈYÙVÌKŒNˆ
ÈYÙVÌWJNÂˆYˆ
Z\Ô›ØYÚ[

H	‰ˆZ]Ôİ]XÊ
H	‰ˆØ\œË™]™\JÈOˆZ]ĞØ\ŠËJJJHÈ\Ë™ËœÜÚ][Û‹˜ÛÜJ
NÈ™]\›ÈBˆBˆ\Ë™ËœÜÚ][Û‹œÙ]
NŒNN
NÂˆBˆ]
YË™YÚ[ÛˆH	Ø›ÙIË]XÚÙ\ˆH	Ü^Y\‰ÊHÂˆYˆ
\ËšH
H™]\›ÂˆYˆ
]XÚÙ\ˆOOH	Ü^Y\‰È	‰ˆ\Ëœ›ÛHOOH	ÜÛXÙIÊH™YÚ\İ\Üš[YJ	Ü^Y\‰Ë™YÚ[ÛˆOOH	ÚXY	ÈÈÈˆ‹	ØYÜ™\ÜğèÛÈ\›XYIÊNÂˆ\Ëœ™[Y[X™\Š	Ø]XÚÙY	ËXİÜ”ÜÚ][ÛŠ]XÚÙ\ŠH^Y\‹œÜÚ][Û‹MŠNÈ\Ë˜œ˜Z[‹˜[\HNÈ\Ë˜œ˜Z[‹œİ]HH	Ù›YIÎÂˆ\ËšHX]›X^
\ËšHYÊNÂˆYˆ
\ËšH
HÈ\Ë™İÛˆHNNNÈ\Ë™Ëœ›İ][Û‹ˆHX]”HÈÈ™]\›ÈBˆ\Ë™İÛˆHX]›X^
\Ë™İÛ‹™YÚ[ÛˆOOH	ÚXY	ÈÈˆËŒŠNÈ\Ë™Ëœ›İ][Û‹ˆHX]”HÈÈYˆ
\ËšL	‰ˆ\Ëœ›ÛHOOH	ÜÛXÙIÊH™\]Y\İØ[]J\ÊNÂˆBˆ[\Xİ
ÜYY\‹Ûİ\˜ÙPØ\ˆH[
HÂˆYˆ
\ËšHÜYYŠH™]\›Âˆ]YÈH\ÚHŒKİÛˆHKŒÂˆYˆ
ÜYYJHÈYÈH
È
ÜYYHŠH
ˆÈ\ÚHNÈİÛˆHKÈBˆ[ÙHYˆ
ÜYY
HÈYÈHLˆ
È
ÜYYHJH
ˆNÈ\ÚH‹ÈİÛˆH‹ÈBˆ[ÙHÈYÈHX]›Z[ŠLÌ
È
ÜYYH
H
ˆÊNÈ\ÚHKŒÈİÛˆHËNÈBˆYˆ
Ûİ\˜ÙPØ\ŠHÈ\ËšYÛ›Ü™PØ\ˆHÛİ\˜ÙPØ\È\ËšYÛ›Ü™PØ\•[Y\ˆHÈ\Ëœ™[Y[X™\Š	İ™ZXÛKY[™Ù\‰ËÛİ\˜ÙPØ\‹™ËœÜÚ][Û‹KÊNÈ\Ë˜œ˜Z[‹˜[\HNÈÛÛœİÙ\HÙ\\˜][Û”Ú[
Ûİ\˜ÙPØ\‹\Ë™ËœÜÚ][Û‹ŒŠNÈYˆ
Z]Ôİ]XÊÙ\ŒÌŠJH\Ë™ËœÜÚ][Û‹˜ÛÜJÙ\
NÈYˆ
İ\œ™[Ø\ˆOOHÛİ\˜ÙPØ\ŠH™YÚ\İ\Üš[YJ	Ü^Y\‰Ë‹	Ø]›Ü[[Y[ÉÊNÈBˆ\Ëš]
X]œ›İ[™
YÊK	Ø›ÙIËİ\œ™[Ø\ˆOOHÛİ\˜ÙPØ\ˆÈ	Ü^Y\‰ÈˆÛİ\˜ÙPØ\ËYY“”È[
NÈ\Ë™İÛˆHX]›X^
\Ë™İÛ‹İÛŠNÈ\Ë™[˜ÛÜJ\ŠK›][\TØØ[\Š\Ú
NÈ\Ë™[HHÜYYHÈ‹Œˆ
ÈÜYY
ˆŒLˆˆÂˆBˆÚÛÜÙUØ[™\Š
HÈÛÛœİH›ØÚÜÖÓX]™›ÛÜŠX]œ˜[™ÛJ
H
ˆ
WKˆH›ØÚÜÖÓX]™›ÛÜŠX]œ˜[™ÛJ
H
ˆ
WKÜÈHÖÌN
X]œ˜[™ÛJ
HHJH
ˆÌKËLN
X]œ˜[™ÛJ
HHJH
ˆÌKÊX]œ˜[™ÛJ
HHJH
ˆÌNKÊX]œ˜[™ÛJ
HHJH
ˆÌLNWKÈHÜÖÓX]™›ÛÜŠX]œ˜[™ÛJ
H
ˆÜË›[™İ
WNÈ\Ë\™Ù]H™]È‘QK•™XİÜŒÊ
ÈÖÌKŒNˆ
ÈÖÌWJNÈ\Ë˜œ˜Z[‹œİ]HH	İØ[™\‰ÎÈBˆ›YQœ›ÛJÜË›ÛÜİHJHÈÛÛœİ]Ø^HH\Ë™ËœÜÚ][Û‹˜ÛÛ™J
KœİXŠÜÊKœÙ]J
NÈYˆ
]Ø^K›[™İÜJ
HŒJH]Ø^KœÙ]
X]œ˜[™ÛJ
HHKX]œ˜[™ÛJ
HHJNÈ]Ø^K››Ü›X[^™J
NÈ]H\Ë™ËœÜÚ][Û‹˜ÛÛ™J
K˜YØØ[Y™XİÜŠ]Ø^KLˆ
È
ˆ›ÛÜİ
NÈYˆ
\Ô›ØYÚ[

H]Ôİ]XÊ
JHÈÛÛœİØY™HHÚY]Ø[ÔÚ[™X\Š\Ë™ËœÜÚ][Û‹
NÈYˆ
ØY™JHHØY™NÈH\Ë\™Ù]HÈ\Ë˜œ˜Z[‹œİ]HH	Ù›YIÎÈ\Ë˜œ˜Z[‹˜[\HX]›X^
\Ë˜œ˜Z[‹˜[\ÊNÈBˆT™]ZÙJ
HÂˆÛÛœİØ\ˆH\Ëœ™]ZÙPØ\ÈYˆ
XØ\ˆØ\‹œ™[[İ™YØ\‹™^ÙY
HÈ\Ëœ™]ZÙPØ\ˆH[È™]\›ˆ˜[ÙNÈBˆÛÛœİH\Ë™ËœÜÚ][Û‹™\İ[˜ÙUÊØ\‹™ËœÜÚ][ÛŠNÈ\Ë\™Ù]HÙ\\˜][Û”Ú[
Ø\‹Ø\‹™ËœÜÚ][Û‹˜ÛÛ™J
K˜Y
™]È‘QK•™XİÜŒÊK
JKKŒÊNÈ\Ë˜œ˜Z[‹œİ]HH	Ü™]ZÙIÎÂˆYˆ
ËŒˆ	‰ˆX]˜XœÊØ\‹œÜYY
HKÊHÈ™]ZÙU™ZXÛJ\ËØ\ŠNÈ™]\›ˆYNÈBˆ™]\›ˆ˜[ÙNÂˆBˆ[šÊ
HÂˆYˆ
\ËšH\Ë™İÛˆˆ\Ëš[•™ZXÛJH™]\›ÂˆYˆ
\Ëœ™]ZÙPØ\ˆ	‰ˆ\ËT™]ZÙJ
JH™]\›ÂˆYˆ
\Ëœ›ÛHOOH	ÜÛXÙIÊHÂˆÛÛœİÜš[Z[˜[H™X\™\İÜš[Z[˜[
\Ë™ËœÜÚ][ÛŠNÂˆYˆ
Üš[Z[˜[
HÈÛÛœİHXİÜ”ÜÚ][ÛŠÜš[Z[˜[
NÈ\Ë˜œ˜Z[‹™›Øİ\ÈHÜš[Z[˜[È\Ë\™Ù]H˜ÛÛ™J
NÈ\Ë˜œ˜Z[‹œİ]HH	Ü\œİYIÎÈÛÛœİ\İH\Ë™ËœÜÚ][Û‹™\İ[˜ÙUÊ
NÈYˆ
\İMJHÛXÙTÚÛİ
\Ë™ËœÜÚ][Û‹˜ÛÛ™J
K˜Y
™]È‘QK•™XİÜŒÊKK
JKÜš[Z[˜[\ÊNÈ™]\›ÈBˆBˆÛÛœİH™ZXÛU™X]›ÜŠ\ÊNÈYˆ

HÈ\Ëœ™[Y[X™\Š	ØØ\‹XÛÛZ[™ÉË˜Ø\‹™ËœÜÚ][Û‹ŠNÈÛÛœİÚYHH™]È‘QK•™XİÜŒÊ]™\‹‹™\‹
NÈYˆ
X]œ˜[™ÛJ
HJHÚYK›][\TØØ[\ŠLJNÈ\Ë\™Ù]H\Ë™ËœÜÚ][Û‹˜ÛÛ™J
K˜YØØ[Y™XİÜŠÚYK
NÈÛÛœİØY™HHÚY]Ø[ÔÚ[™X\Š\Ë™ËœÜÚ][Û‹Œ
NÈYˆ
\Ô›ØYÚ[
\Ë\™Ù]
H	‰ˆØY™JH\Ë\™Ù]HØY™NÈ\Ë˜œ˜Z[‹œİ]HH	ÙÙÙIÎÈ\Ë˜œ˜Z[‹˜[\HNÈ™]\›ÈBˆ][™Ù\ˆH[È›Üˆ
ÛÛœİÈÙˆØ\œÊHÈYˆ
Ëœ™[[İ™Y
HÛÛ[YNÈÛÛœİH\Ë™ËœÜÚ][Û‹™\İ[˜ÙUÊË™ËœÜÚ][ÛŠNÈYˆ

Ë˜Üš]XØ[	‰ˆM
H
Ë™^ÙY	‰ˆN
JHÈ[™Ù\ˆHË™ËœÜÚ][ÛÈœ™XZÎÈHHYˆ
[™Ù\ŠHÈ\Ë™›YQœ›ÛJ[™Ù\‹K
NÈ™]\›ÈBˆÛÛœİY[[ÜHH\Ë˜œ˜Z[‹›Y[[ÜšY\Ë™š[™
HOˆKÙZYÚHKJNÈYˆ
Y[[ÜH	‰ˆ\Ë˜œ˜Z[‹™™X\ˆˆŒ
HÈ\Ë™›YQœ›ÛJY[[ÜKœÜËÊNÈ™]\›ÈBˆÛÛœİ\HœÜË™š[\ŠˆOˆˆOOH\È	‰ˆ‹šˆ	‰ˆ‹™İÛˆˆ	‰ˆ\Ë™ËœÜÚ][Û‹™\İ[˜ÙUÊ‹™ËœÜÚ][ÛŠHL
KœÛÜ

KŠHOˆ\Ë™ËœÜÚ][Û‹™\İ[˜ÙUÊK™ËœÜÚ][ÛŠHH\Ë™ËœÜÚ][Û‹™\İ[˜ÙUÊ‹™ËœÜÚ][ÛŠJVÌNÈYˆ
\	‰ˆ\Ë˜œ˜Z[‹œÛØÚX[ˆŒˆ	‰ˆ\Ë˜œ˜Z[‹˜Ûİ\˜YÙHˆŒÍH	‰ˆ\Ë˜œ˜Z[‹˜[\JHÈ\Ë\™Ù]H\™ËœÜÚ][Û‹˜ÛÛ™J
K˜Y
™]È‘QK•™XİÜŒÊKJJNÈ\Ë˜œ˜Z[‹œİ]HH	Ú[	ÎÈ™]\›ÈBˆYˆ
\Ëœ›ÛHOOH	ØÚ]š[X[‰È	‰ˆ\Ë˜œ˜Z[‹˜Ûİ\˜YÙHˆˆ	‰ˆX]œ˜[™ÛJ
HŒJHÂˆÛÛœİˆHØ\œË™š[\ŠÈOˆXËœ™[[İ™Y	‰ˆXË™^ÙY	‰ˆËšÚ[™OOH	Û›Ü›X[	È	‰ˆË™š]™\ˆ	‰ˆ\Ë™ËœÜÚ][Û‹™\İ[˜ÙUÊË™ËœÜÚ][ÛŠHÊKœÛÜ

KŠHOˆ\Ë™ËœÜÚ][Û‹™\İ[˜ÙUÊK™ËœÜÚ][ÛŠHH\Ë™ËœÜÚ][Û‹™\İ[˜ÙUÊ‹™ËœÜÚ][ÛŠJVÌNÈYˆ
ŠHÈİX[™ZXÛJ‹\ÊNÈ™]\›ÈBˆBˆYˆ
]\Ë\™Ù]\Ë™ËœÜÚ][Û‹™\İ[˜ÙUÊ\Ë\™Ù]
HX]œ˜[™ÛJ
HŒ
H\Ë˜ÚÛÜÙUØ[™\Š
NÂˆBˆS[İ™J\‹ÜYY
HÂˆÛÛœİÛH\Ë™ËœÜÚ][Û‹˜ÛÛ™J
K[™Û\ÈHÌMKKMKKLWNÂˆ›Üˆ
ÛÛœİHÙˆ[™Û\ÊHÂˆÛÛœİÈHX]˜ÛÜÊJKÈHX]œÚ[ŠJKˆH™]È‘QK•™XİÜŒÊ\‹
ˆÈH\‹ˆ
ˆË\‹
ˆÈ
È\‹ˆ
ˆÊK››Ü›X[^™J
KH\Ë™ËœÜÚ][Û‹˜ÛÛ™J
K˜YØØ[Y™XİÜŠ‹
ˆÜYY
NÂˆÛÛœİ›ØYH\Ô›ØYÚ[

K›ØÚÙYH]Ôİ]XÊŒÍŠHØ\œËœÛÛYJØ\ˆOˆØ\ˆOOH\ËšYÛ›Ü™PØ\ˆ	‰ˆXØ\‹œ™[[İ™Y	‰ˆ]ĞØ\ŠØ\‹ŒÎ
JNÂˆYˆ
\›ØY	‰ˆX›ØÚÙY
HÈ\Ë™ËœÜÚ][Û‹˜ÛÜJ
NÈ\Ë™Ëœ›İ][Û‹HHX]˜][ŒŠ‹‹ŠNÈ™]\›ˆYNÈBˆBˆ\Ë™ËœÜÚ][Û‹˜ÛÜJÛ
NÈ™]\›ˆ˜[ÙNÂˆBˆ\]J
HÂˆYˆ
\Ëš[•™ZXÛJH™]\›ÂˆYˆ
\ËšH
H™]\›Âˆ\Ë™›Ü™Ù]

NÈ\ËšYÛ›Ü™PØ\•[Y\ˆHX]›X^
\ËšYÛ›Ü™PØ\•[Y\ˆH
NÈYˆ
\ËšYÛ›Ü™PØ\•[Y\ˆH
H\ËšYÛ›Ü™PØ\ˆH[ÂˆYˆ
\Ë™İÛˆˆ
HÈ\Ë™İÛˆOHÈÛÛœİÛH\Ë™ËœÜÚ][Û‹˜ÛÛ™J
NÈ\Ë™ËœÜÚ][Û‹˜YØØ[Y™XİÜŠ\Ë™[
NÈ\Ë™[HOHˆ
ˆÈ\Ë™ËœÜÚ][Û‹HHX]›X^
ŒN\Ë™ËœÜÚ][Û‹H
È\Ë™[H
ˆ
NÈ\Ë™[›][\TØØ[\ŠMŠNÈÛÛœİ›ØÚÙYPØ\ˆHØ\œËœÛÛYJÈOˆÈOOH\ËšYÛ›Ü™PØ\ˆ	‰ˆXËœ™[[İ™Y	‰ˆ]ĞØ\ŠË\Ë™ËœÜÚ][Û‹ŒÊJNÈYˆ
]Ôİ]XÊ\Ë™ËœÜÚ][Û‹ŒÍ
H›ØÚÙYPØ\ŠH\Ë™ËœÜÚ][Û‹˜ÛÜJÛ
NÈYˆ
\Ë™İÛˆH
HÈ\Ë™Ëœ›İ][Û‹ˆHÈ\Ë™ËœÜÚ][Û‹HHŒNÈ\Ë™[œÙ]

NÈH™]\›ÈBˆ\Ë˜œ˜Z[‹[šÈOHÈYˆ
\Ë˜œ˜Z[‹[šÈH
HÈ\Ë˜œ˜Z[‹[šÈHŒÈ
ÈX]œ˜[™ÛJ
H
ˆÈ\Ë[šÊ
NÈBˆYˆ
]\Ë\™Ù]
HÈ\Ë˜ÚÛÜÙUØ[™\Š
NÈ™]\›ÈBˆÛÛœİH\Ë\™Ù]˜ÛÛ™J
KœİXŠ\Ë™ËœÜÚ][ÛŠKœÙ]J
K\İH›[™İ

NÈYˆ
\İJHÈ\Ë\™Ù]H[È™]\›ÈH››Ü›X[^™J
NÂˆÛÛœİXÙHHÉÙ›YIË	ÙÙÙIË	Ü\œİYIË	Ü™]ZÙI×Kš[˜ÛY\Ê\Ë˜œ˜Z[‹œİ]JHÈËŒÈˆ\Ë˜œ˜Z[‹œİ]HOOH	Ú[	ÈÈˆˆKŒNÂˆYˆ
]\ËS[İ™JXÙJJHÈ\Ë\™Ù]H[È\Ë˜œ˜Z[‹[šÈHÈBˆBˆB‚ˆÛÛœİ[™U˜[Y\ÈH›ØYË™›]X\
ˆOˆÜˆHËŒ‹ˆ
ÈËŒ—JNÂˆ[˜İ[Ûˆ™X\™\İ[™R[™›Ê
HÂˆ]™\İH[\İH[™š[š]NÂˆ›Üˆ
ÛÛœİÙˆ[™U˜[Y\ÊHÈÛÛœİHH™]È‘QK•™XİÜŒÊŒË‘QK“X]][Ë˜Û[\
‹LLL
JKHK™\İ[˜ÙUÔÜ]X\™Y

NÈYˆ
\İ
HÈ\İHÈ™\İHÈÜšY[][Ûˆ	İ‰ËÛÛÜ™ˆÚ[ˆHNÈHBˆ›Üˆ
ÛÛœİˆÙˆ[™U˜[Y\ÊHÈÛÛœİHH™]È‘QK•™XİÜŒÊ‘QK“X]][Ë˜Û[\
LLL
KŒËŠKHK™\İ[˜ÙUÔÜ]X\™Y

NÈYˆ
\İ
HÈ\İHÈ™\İHÈÜšY[][Ûˆ	Ú	ËÛÛÜ™ˆ‹Ú[ˆHNÈHBˆ™]\›ˆ™\İÂˆBˆÛÛœİ™X\™\İ›ØYÚ[HOˆ™X\™\İ[™R[™›Ê
KœÚ[˜ÛÛ™J
NÂˆÛÛœİ™X\™\İ[™U˜[YHHˆOˆ[™U˜[Y\Ëœ™YXÙJ
KŠHOˆX]˜XœÊˆHŠHX]˜XœÊHHŠHÈˆˆK[™U˜[Y\ÖÌJNÂˆ[˜İ[Ûˆ]™]ÙY[Šœ›ÛKÊHÂˆÛÛœİHH™X\™\İ[™R[™›Êœ›ÛJKˆH™X\™\İ[™R[™›ÊÊK]HØKœÚ[˜ÛÛ™J
WNÂˆYˆ
K›ÜšY[][ÛˆOOH	İ‰È	‰ˆ‹›ÜšY[][ÛˆOOH	Ú	ÊH]œ\Ú
™]È‘QK•™XİÜŒÊK˜ÛÛÜ™ŒË‹˜ÛÛÜ™
JNÂˆ[ÙHYˆ
K›ÜšY[][ÛˆOOH	Ú	È	‰ˆ‹›ÜšY[][ÛˆOOH	İ‰ÊH]œ\Ú
™]È‘QK•™XİÜŒÊ‹˜ÛÛÜ™ŒËK˜ÛÛÜ™
JNÂˆ[ÙHYˆ
K›ÜšY[][ÛˆOOH	İ‰È	‰ˆ‹›ÜšY[][ÛˆOOH	İ‰È	‰ˆX]˜XœÊK˜ÛÛÜ™H‹˜ÛÛÜ™
HˆŒJHÈÛÛœİˆH™X\™\İ[™U˜[YJ
KœÚ[ˆ
È‹œÚ[ŠHÈŠNÈ]œ\Ú
™]È‘QK•™XİÜŒÊK˜ÛÛÜ™ŒËŠK™]È‘QK•™XİÜŒÊ‹˜ÛÛÜ™ŒËŠJNÈBˆ[ÙHYˆ
K›ÜšY[][ÛˆOOH	Ú	È	‰ˆ‹›ÜšY[][ÛˆOOH	Ú	È	‰ˆX]˜XœÊK˜ÛÛÜ™H‹˜ÛÛÜ™
HˆŒJHÈÛÛœİH™X\™\İ[™U˜[YJ
KœÚ[
È‹œÚ[
HÈŠNÈ]œ\Ú
™]È‘QK•™XİÜŒÊŒËK˜ÛÛÜ™
K™]È‘QK•™XİÜŒÊŒË‹˜ÛÛÜ™
JNÈBˆ]œ\Ú
‹œÚ[˜ÛÛ™J
NÈ™]\›ˆ]™š[\Š
JHOˆHOOH™\İ[˜ÙUÊ]ÚHHWJHˆŒÍJNÂˆB‚ˆÛ\ÜÈØ\ˆÂˆÛÛœİXİÜŠÛÛÜ‹‹›İHZHH˜[ÙKÚ[™H	Û›Ü›X[	ÊHÂˆØš™Xİ˜\ÜÚYÛŠ\ËØ\“Y\Ú
ÛÛÜ‹Ú[™
JNÈ\Ë™ËœÜÚ][Û‹œÙ]
ŒËŠNÈ\Ë™Ëœ›İ][Û‹HH›İÈØÙ[™K˜Y
\Ë™ÊNÂˆ\ËœÜYYHÈ\ËšHÚ[™OOH	İİÉÈÈNˆÚ[™OOH	ÜØ[]IÈÈMŒˆÚ[™OOH	ÜÛXÙIÈÈMˆLÈ\Ë›X^H\ËšÈ\Ë™Y[HLÈ\Ë˜ZHHZNÈ\ËšÚ[™HÚ[™È\Ë™^ÙYH˜[ÙNÈ\Ëœ™[[İ™YH˜[ÙNÈ\Ëœ›İ]HH[È\ËšYHÈ\Ëš[•ÈHÚ[™OOH	İİÉÈÈKŒMˆˆKŒÈ\Ëš[“HÚ[™OH	İİÉÈÈ‹MHˆ‹ŒÈ\Ëš[\XİÛÛÛİÛˆHÈ\Ë™š]™\ˆH[È\Ëœ\ÜÙ[™Ù\œÈH×NÈ\ËœÙ\šXÙR›ØˆH[È\Ë˜Üš]XØ[H˜[ÙNÈ\Ë˜Üš]XØ[[Y\ˆHÈ\Ë™š]™\‘XÚ\Ú[Û“XYHH˜[ÙNÈ\ËYY“”ÈH[È\Ë›İÛ™\“”ÈH[È\Ë›[Ù[ÙH[È\ËœÛXÙT]H×NÈ\ËœÛXÙRYHÈ\ËœÛXÙT™\]HÈ\ËœÛXÙTÚİHÂˆØ\œËœ\Ú
\ÊNÈ\U™ZXÛTÚÚ[Š\ÊNÂˆBˆ\ÜÚYÛ”›ØY

HÈÛÛœİÜš^›Û[HX]œ˜[™ÛJ
HK[™HHX]œ˜[™ÛJ
HHÈLËŒˆˆËŒÈYˆ
Üš^›Û[
HÈÛÛœİˆH›ØYÖÓX]™›ÛÜŠX]œ˜[™ÛJ
H
ˆÊWH
È[™NÈ\Ëœ›İ]HHÛ™]È‘QK•™XİÜŒÊLLŠK™]È‘QK•™XİÜŒÊLŠWNÈH[ÙHÈÛÛœİH›ØYÖÓX]™›ÛÜŠX]œ˜[™ÛJ
H
ˆÊWH
È[™NÈ\Ëœ›İ]HHÛ™]È‘QK•™XİÜŒÊLL
K™]È‘QK•™XİÜŒÊL
WNÈH\ËšYHÈBˆ[XYÙJŠHÂˆYˆ
\Ë™^ÙY\Ëœ™[[İ™Y\Ë˜Üš]XØ[
H™]\›Âˆ\ËšHX]›X^
\ËšHŠNÂˆYˆ
\Ë™š]™\ˆ	‰ˆ]\Ë™š]™\‘XÚ\Ú[Û“XYH	‰ˆ\ËšHX]›X^
N\Ë›X^
ˆŒN
JHÈ\Ë™š]™\‘XÚ\Ú[Û“XYHHYNÈYˆ

\Ë™š]™\‹\Ù\‘]KšÏÈL
Hˆ	‰ˆX]œ˜[™ÛJ
HÍJHZ™XİØØİ\[Ê\ËÈ›YNˆYK™]ZÙNˆ˜[ÙHJNÈBˆYˆ
\ËšH
HÈ\Ë˜Üš]XØ[HYNÈ\Ë˜Üš]XØ[[Y\ˆHÈ
ÈX]œ˜[™ÛJ
H
ˆÈ\Ë˜ZHH˜[ÙNÈ\ËœÜYY
HÈ\Ë˜›ÙK›X]\šX[˜ÛÛÜ‹œÙ]^
ØLŒ
NÈ\ËšÛÙ›X]\šX[˜ÛÛÜ‹œÙ]^
LLŒÊNÈ[™ZXÛJ\ËØLŒ
NÈBˆBˆ^ÙJ
HÂˆYˆ
\Ë™^ÙY\Ëœ™[[İ™Y
H™]\›Âˆ\Ë™^ÙYHYNÈ\Ë˜Üš]XØ[H˜[ÙNÈ\ËœÜYYHÈ\Ë˜ZHH˜[ÙNÈ\Ë˜›ÙK›X]\šX[˜ÛÛÜ‹œÙ]^
MÌMŒMŠNÈ\ËšÛÙ›X]\šX[˜ÛÛÜ‹œÙ]^
ŒLXŒNJNÈ\Ë˜ØX‹›X]\šX[˜ÛÛÜ‹œÙ]^
ŒŒŒ
NÈ[™ZXÛJ\ËLLLLLJNÂˆYˆ
\Ë™š]™\ŠH\Ë™š]™\‹\Ù\‘]KšHÈ›Üˆ
ÛÛœİÙˆ\Ëœ\ÜÙ[™Ù\œÊH\Ù\‘]KšHÂˆYˆ
İ\œ™[Ø\ˆOOH\ÊHX]™PØ\ŠYJNÂˆYˆ
\ËšÚ[™OOH	İİÉÈ	‰ˆ\ËšÚ[™OOH	ÜØ[]IÊHİÒ›ØœËœ\Ú
™]ÈİÒ›ØŠ\ÊJNÂˆBˆ\ÕİÕÜ™XÚÊÊHÈ™]\›ˆ\ËœÙ\šXÙR›Øˆ	‰ˆ\ËœÙ\šXÙR›Ø‹Ü™XÚÈOOHÈ	‰ˆÉİÚ[˜Ú	Ë	Ü™]\›‰Ë	Ü\šÉ×Kš[˜ÛY\Ê\ËœÙ\šXÙR›Ø‹œİ]JNÈBˆœ›Û›ØÚÙY

HÂˆYˆ
ÚYÛ˜[ZXY
\ÊJH™]\›ˆYNÂˆÛÛœİˆH™]È‘QK•™XİÜŒÊX]œÚ[Š\Ë™Ëœ›İ][Û‹JKX]˜ÛÜÊ\Ë™Ëœ›İ][Û‹JJNÂˆ›Üˆ
ÛÛœİÈÙˆØ\œÊHÈYˆ
ÈOOH\ÈÛËœ™[[İ™Y\Ëš\ÕİÕÜ™XÚÊÊJHÛÛ[YNÈÛÛœİHË™ËœÜÚ][Û‹˜ÛÛ™J
KœİXŠ\Ë™ËœÜÚ][ÛŠKœÙ]J
NÈYˆ
›[™İ

H	‰ˆ‹™İ
˜ÛÛ™J
K››Ü›X[^™J
JHˆÌŠH™]\›ˆYNÈBˆ›Üˆ
ÛÛœİˆÙˆœÜÊHÈYˆ
‹šH‹š[•™ZXÛJHÛÛ[YNÈÛÛœİH‹™ËœÜÚ][Û‹˜ÛÛ™J
KœİXŠ\Ë™ËœÜÚ][ÛŠKœÙ]J
NÈYˆ
›[™İ

HH	‰ˆ‹™İ
˜ÛÛ™J
K››Ü›X[^™J
JHˆÍJH™]\›ˆYNÈBˆ™]\›ˆ˜[ÙNÂˆBˆ[İ™J
HÂˆYˆ
\Ë™^ÙY\Ëœ™[[İ™Y
H™]\›Âˆ\Ëš[\XİÛÛÛİÛˆHX]›X^
\Ëš[\XİÛÛÛİÛˆH
NÈÛÛœİÛH\Ë™ËœÜÚ][Û‹˜ÛÛ™J
K[\XİHX]˜XœÊ\ËœÜYY
KˆH™]È‘QK•™XİÜŒÊX]œÚ[Š\Ë™Ëœ›İ][Û‹JKX]˜ÛÜÊ\Ë™Ëœ›İ][Û‹JJNÈ\Ë™ËœÜÚ][Û‹˜YØØ[Y™XİÜŠ‹\ËœÜYY
ˆ
NÂˆÛÛœİ]HØ\”İ]XÒ]
\ÊNÂˆYˆ
]
HÈÛÛœİÛ\İHX]š\İ
ÛH]ÛˆH]šK™]Ñ\İHX]š\İ
\Ë™ËœÜÚ][Û‹H]\Ë™ËœÜÚ][Û‹ˆH]ŠNÈYˆ
\ËœÜYY	‰ˆ™]Ñ\İˆÛ\İ
ÈŒJH™]\›È\Ë™ËœÜÚ][Û‹˜ÛÜJÛ
NÈYˆ

]\HOOH	İ™YIÈ]\HOOH	ÜÛIÊH	‰ˆ[\XİˆÊHÈÛ›ØÚÊ]›İÛ™\‹\ÊNÈYˆ
\Ëš[\XİÛÛÛİÛˆH
HÈ\Ë™[XYÙJX]›X^
‹[\Xİ
JNÈ\Ëš[\XİÛÛÛİÛˆHÎÈH\ËœÜYY
HŒÍNÈ™]\›ÈHYˆ
\Ëš[\XİÛÛÛİÛˆH	‰ˆ[\XİˆKŒJHÈ\Ë™[XYÙJX]›X^
‹[\Xİ
ˆKŠJNÈ\Ëš[\XİÛÛÛİÛˆHÎÈH\ËœÜYYHÈ™]\›ÈBˆ›Üˆ
ÛÛœİÈÙˆØ\œÊHÈYˆ
ÈOOH\ÈÛËœ™[[İ™Y\Ëš\ÕİÕÜ™XÚÊÊHXØ\œÕİXÚ
\ËÊJHÛÛ[YNÈÛÛœİÛ\İHÛ™\İ[˜ÙUÊË™ËœÜÚ][ÛŠK™]Ñ\İH\Ë™ËœÜÚ][Û‹™\İ[˜ÙUÊË™ËœÜÚ][ÛŠNÈYˆ
\ËœÜYY	‰ˆ™]Ñ\İˆÛ\İ
ÈŒJHÛÛ[YNÈ\Ë™ËœÜÚ][Û‹˜ÛÜJÛ
NÈÛÛœİ™[HX]›X^
[\XİX]˜XœÊËœÜYY
JNÈYˆ
[Ë™^ÙY	‰ˆ™[ˆK
HÈYˆ
\Ëš[\XİÛÛÛİÛˆH
HÈ\Ë™[XYÙJX]›X^
Ë™[
ˆKMJJNÈ\Ëš[\XİÛÛÛİÛˆHÎÈHYˆ
Ëš[\XİÛÛÛİÛˆH
HÈË™[XYÙJX]›X^
‹™[
ˆKŒŠJNÈËš[\XİÛÛÛİÛˆHÎÈHH\ËœÜYYHÈ™]\›ÈBˆYˆ
Xİ\œ™[Ø\ˆ	‰ˆ]ĞØ\Š\Ë^Y\‹œÜÚ][Û‹Œ
H	‰ˆ[\XİˆK
HÈ[XYÙT^Y\’[\Xİ
[\Xİ‹\ÊNÈ\ËœÜYY
HMNÈBˆ›Üˆ
ÛÛœİˆÙˆœÜÊHYˆ
‹šˆ	‰ˆ[‹š[•™ZXÛH	‰ˆ]ĞØ\Š\Ë‹™ËœÜÚ][Û‹Œ
JHÈ‹š[\Xİ
[\Xİ‹\ÊNÈ\ËœÜYY
H[\XİˆˆÈMHˆÈBˆBˆš]™UÊ\™Ù]X^HJHÂˆYˆ
]\™Ù]
H™]\›ˆYNÂˆÛÛœİH\™Ù]˜ÛÛ™J
KœİXŠ\Ë™ËœÜÚ][ÛŠKœÙ]J
NÈYˆ
›[™İ

HKŒÍJHÈ\ËœÜYYHÈ™]\›ˆYNÈBˆÛÛœİHHX]˜][ŒŠšK[HHX]˜][ŒŠX]œÚ[ŠHH\Ë™Ëœ›İ][Û‹JKX]˜ÛÜÊHH\Ë™Ëœ›İ][Û‹JJNÈ\Ë™Ëœ›İ][Û‹H
ÏH‘QK“X]][Ë˜Û[\
[KY
ˆK
ˆJNÈÛÛœİ\™Ù]ÜYYH\Ë™œ›Û›ØÚÙY

HÈˆX^È\ËœÜYYH‘QK“X]][Ë›\œ
\ËœÜYY\™Ù]ÜYYX]›Z[ŠK
ˆ‹JJNÈ\Ë›[İ™J
NÈ™]\›ˆ˜[ÙNÂˆBˆ\]TÛXÙJ
HÂˆÛÛœİÜš[Z[˜[H™X\™\İÜš[Z[˜[
\Ë™ËœÜÚ][ÛŠNÂˆYˆ
XÜš[Z[˜[
HÈ\Ë˜ZHHYNÈ™]\›ˆ˜[ÙNÈBˆ\Ë˜ZHH˜[ÙNÈ\ËœÛXÙT™\]OHÈÛÛœİ\™Ù]ÜÈHXİÜ”ÜÚ][ÛŠÜš[Z[˜[
NÂˆYˆ
\ËœÛXÙT™\]H]\ËœÛXÙT]›[™İ
HÈ\ËœÛXÙT]H]™]ÙY[Š\Ë™ËœÜÚ][Û‹\™Ù]ÜÊNÈ\ËœÛXÙRYHÈ\ËœÛXÙT™\]HKÈBˆÛÛœİ\İH\Ë™ËœÜÚ][Û‹™\İ[˜ÙUÊ\™Ù]ÜÊNÂˆYˆ
\İMJHÈ\ËœÜYY
HÈ\ËœÛXÙTÚİOHÈYˆ
\ËœÛXÙTÚİH
HÈ\ËœÛXÙTÚİHÎÈÛXÙTÚÛİ
\Ë™ËœÜÚ][Û‹˜ÛÛ™J
K˜Y
™]È‘QK•™XİÜŒÊËKŒË
JKÜš[Z[˜[\ÊNÈH™]\›ˆYNÈBˆYˆ
\ËœÛXÙRYH\ËœÛXÙT]›[™İ
HÈ\ËœÛXÙT]H×NÈ™]\›ˆYNÈBˆYˆ
\Ë™š]™UÊ\ËœÛXÙT]İ\ËœÛXÙRYK‹ŒŠJH\ËœÛXÙRY
ÊÎÂˆ™]\›ˆYNÂˆBˆ\]J
HÂˆYˆ
\Ëœ™[[İ™Y\Ë™^ÙY
H™]\›ÂˆYˆ
\Ë˜Üš]XØ[
HÈ\Ë˜Üš]XØ[[Y\ˆOHÈ\ËœÜYY
HX]œİÊMË
ˆŒ
NÈYˆ
\Ë˜Üš]XØ[[Y\ˆH
H\Ë™^ÙJ
NÈ™]\›ÈBˆYˆ
\ËšÚ[™OOH	ÜÛXÙIÈ	‰ˆİ\œ™[Ø\ˆOOH\È	‰ˆ\Ë\]TÛXÙJ
JH™]\›ÂˆYˆ
\Ë˜ZJHÈYˆ
]\Ë™š]™\ˆ
\Ë™š]™\‹\Ù\‘]KšÏÈ
HH
HÈ\Ë˜ZHH˜[ÙNÈ\ËœÜYYHÈ™]\›ÈHYˆ
]\Ëœ›İ]JH\Ë˜\ÜÚYÛ”›ØY

NÈÛÛœİH\Ëœ›İ]Vİ\ËšYKH˜ÛÛ™J
KœİXŠ\Ë™ËœÜÚ][ÛŠKœÙ]J
NÈYˆ
›[™İ

HŠHÈ\ËšYHHH\ËšYÈ™]\›ÈHÛÛœİHHX]˜][ŒŠŠK[HHX]˜][ŒŠX]œÚ[ŠHH\Ë™Ëœ›İ][Û‹JKX]˜ÛÜÊHH\Ë™Ëœ›İ][Û‹JJNÈ\Ë™Ëœ›İ][Û‹H
ÏH‘QK“X]][Ë˜Û[\
[KY
ˆ
ˆ
NÈÛÛœİ\™Ù]H\Ë™œ›Û›ØÚÙY

HÈˆKŒÈ\ËœÜYYH‘QK“X]][Ë›\œ
\ËœÜYY\™Ù]X]›Z[ŠK
ˆ‹
JNÈ\Ë›[İ™J
NÈ™]\›ÈBˆYˆ
İ\œ™[Ø\ˆOOH\È	‰ˆ]\ËYY“”ÊH™]\›ÂˆYˆ
\ËYY“”È	‰ˆİ\œ™[Ø\ˆOOH\ÊHÈYˆ
]\Ëœ›İ]JH\Ë˜\ÜÚYÛ”›ØY

NÈÛÛœİH\Ëœ›İ]Vİ\ËšYKH˜ÛÛ™J
KœİXŠ\Ë™ËœÜÚ][ÛŠKœÙ]J
NÈYˆ
›[™İ

HŠHÈ\ËšYHHH\ËšYÈ™]\›ÈHÛÛœİHHX]˜][ŒŠšK[HHX]˜][ŒŠX]œÚ[ŠHH\Ë™Ëœ›İ][Û‹JKX]˜ÛÜÊHH\Ë™Ëœ›İ][Û‹JJNÈ\Ë™Ëœ›İ][Û‹H
ÏH‘QK“X]][Ë˜Û[\
[KY
ˆ
ˆ
NÈ\ËœÜYYH‘QK“X]][Ë›\œ
\ËœÜYY\Ë™œ›Û›ØÚÙY

HÈˆKKX]›Z[ŠK
ˆ‹
JNÈ\Ë›[İ™J
NÈ™]\›ÈBˆYˆ
\Ë™Y[H
HÈ\ËœÜYY
HMÎÈ™]\›ÈBˆÛÛœİØ\ÈH
Ù^\Ë‘š]™QØ\ÈÙ^\Ë’Ù^UÊHÈHˆ™]™\œÙHH
Ù^\Ë‘š]™Pœ˜ZÙHÙ^\Ë’Ù^TÊHÈHˆİH
Ù^\Ë‘š]™SYÙ^\Ë’Ù^PHÈHˆ
HH
Ù^\Ë‘š]™TšYÚÙ^\Ë’Ù^QÈHˆ
NÂˆYˆ
Ø\È	‰ˆ\™]™\œÙJH\ËœÜYY
ÏH
ˆKNÈYˆ
™]™\œÙH	‰ˆYØ\ÊHÈYˆ
\ËœÜYYˆJH\ËœÜYYOH
ˆMNÈ[ÙH\ËœÜYYOH
ˆNÈHYˆ
YØ\È	‰ˆ\™]™\œÙJH\ËœÜYY
HX]œİÊN
ˆŒ
NÈ\ËœÜYYH‘QK“X]][Ë˜Û[\
\ËœÜYYM‹MÊNÈYˆ
X]˜XœÊ\ËœÜYY
HˆŒŠH\Ë™Ëœ›İ][Û‹H
ÏHİ
ˆ
ˆKŒÍH
ˆX]œÚYÛŠ\ËœÜYY
NÈ\Ë™Y[HX]›X^
\Ë™Y[H
ˆ
Œˆ
ÈX]˜XœÊ\ËœÜYY
H
ˆŒJJNÈ\Ë›[İ™J
NÂˆBˆB‚ˆ[˜İ[ÛˆXZÙQ›ÜY”Ñœ›ÛUš\İX[
Ø\‹š\İX[›YHH˜[ÙK™]ZÙHHYJHÂˆÛÛœİ›ÛHHš\İX[\Ù\‘]Kœ›ÛH	ØÚ]š[X[‰ËH™]È”Ê›ÛHOOH	ÜÛXÙIÈÈ	ÔÛXÚX[	Èˆ›ÛHOOH	ÛYYXÉÈÈ	ÓpêYXÛÉÈˆ	Ó[İÜš\İIËX]™›ÛÜŠX]œ˜[™ÛJ
H
ˆ
K›ÛKÈ›Ô™[ØØ]NˆYKˆš\İX[\Ù\‘]KšÏÈLJNÂˆÛÛœİÚYHHš\İX[\Ù\‘]KœÙX]OOH	Ùš]™\‰ÈÈLKÈˆKÎÈ™ËœÜÚ][Û‹˜ÛÜJØ\‹™Ë›ØØ[ÕÛÜ›
™]È‘QK•™XİÜŒÊÚYKŒN
JJNÈ™ËœÜÚ][Û‹HHŒNÈœ™]ZÙPØ\ˆH™]ZÙHÈØ\ˆˆ[ÂˆYˆ
›YJHÈ™›YQœ›ÛJØ\‹™ËœÜÚ][Û‹JNÈœ™]ZÙPØ\ˆH[ÈBˆØ\‹™Ëœ™[[İ™Jš\İX[
NÈ™]\›ˆÂˆBˆ[˜İ[ÛˆZ™XİØØİ\[ÊØ\‹È›YHH˜[ÙK™]ZÙHHYHHHßJHÂˆÛÛœİİ]H×NÂˆYˆ
Ø\‹™š]™\ŠHÈİ]œ\Ú
XZÙQ›ÜY”Ñœ›ÛUš\İX[
Ø\‹Ø\‹™š]™\‹›YK™]ZÙJJNÈØ\‹™š]™\ˆH[ÈBˆ›Üˆ
ÛÛœİÙˆË‹‹˜Ø\‹œ\ÜÙ[™Ù\œ×JHİ]œ\Ú
XZÙQ›ÜY”Ñœ›ÛUš\İX[
Ø\‹›YK™]ZÙJJNÈØ\‹œ\ÜÙ[™Ù\œÈH×NÂˆØ\‹˜ZHH˜[ÙNÈØ\‹œÜYYHÈ™]\›ˆİ]ÂˆBˆ[˜İ[ÛˆİX[™ZXÛJØ\‹XİÜŠHÂˆYˆ
XØ\ˆØ\‹œ™[[İ™YØ\‹™^ÙY
H™]\›ˆ˜[ÙNÂˆÛÛœİØØİ\YYHHXØ\‹™š]™\ˆØ\‹œ\ÜÙ[™Ù\œË›[™İˆÂˆYˆ
ØØİ\YY
HZ™XİØØİ\[ÊØ\‹È›YNˆ˜[ÙK™]ZÙNˆYHJNÂˆØ\‹˜ZHH˜[ÙNÈØ\‹œÜYYHÂˆYˆ
XİÜˆOOH	Ü^Y\‰ÊHÈYˆ
ØØİ\YY
H™YÚ\İ\Üš[YJ	Ü^Y\‰ËØ\‹šÚ[™OOH	ÜÛXÙIÈÈˆ‹Ø\‹šÚ[™OOH	ÜÛXÙIÈÈ	Ü›İX›ÈHšX]\˜IÈˆ	Ü›İX›ÈH™pëpë[ÉÊNÈ™]\›ˆYNÈBˆYˆ
XİÜˆ[œİ[˜Ù[Ùˆ”ÊHÂˆ™YÚ\İ\Üš[YJXİÜ‹Ø\‹šÚ[™OOH	ÜÛXÙIÈÈˆ‹	Ü›İX›ÈH™pëXİ[ÉÊNÈXİÜ‹š[•™ZXÛHHØ\ÈXİÜ‹™Ëš\ÚX›HH˜[ÙNÈØ\‹YY“”ÈHXİÜÈ]XÚØØİ\[
Ø\‹XİÜ‹œ›ÛK	Ùš]™\‰ËXİÜ‹š
NÈØ\‹˜ZHH˜[ÙNÈ™]\›ˆYNÂˆBˆ™]\›ˆ˜[ÙNÂˆBˆ[˜İ[Ûˆ™]ZÙU™ZXÛJİÛ™\‹Ø\ŠHÂˆYˆ
[İÛ™\ˆXØ\ˆ\[ÙˆØ\ˆOOH	ÛØš™Xİ	ÈØ\‹œ™[[İ™YØ\‹™^ÙY
H™]\›ˆ˜[ÙNÂˆYˆ
İ\œ™[Ø\ˆOOHØ\ŠHX]™PØ\Š˜[ÙJNÂˆYˆ
Ø\‹YY“”ÊHÈÛÛœİYYˆHØ\‹YY“”ÎÈYY‹š[•™ZXÛHH[ÈYY‹™Ëš\ÚX›HHYNÈYY‹™ËœÜÚ][Û‹˜ÛÜJÙ\\˜][Û”Ú[
Ø\‹Ø\‹™ËœÜÚ][Û‹˜ÛÛ™J
K˜Y
™]È‘QK•™XİÜŒÊK
JKKŒJJNÈØ\‹YY“”ÈH[ÈYˆ
Ø\‹™š]™\ŠHÈØ\‹™Ëœ™[[İ™JØ\‹™š]™\ŠNÈØ\‹™š]™\ˆH[ÈHBˆİÛ™\‹œ™]ZÙPØ\ˆH[ÈİÛ™\‹š[•™ZXÛHHØ\ÈİÛ™\‹™Ëš\ÚX›HH˜[ÙNÈ]XÚØØİ\[
Ø\‹İÛ™\‹œ›ÛK	Ùš]™\‰ËİÛ™\‹š
NÈØ\‹˜ZHHYNÈØ\‹˜\ÜÚYÛ”›ØY

NÈ™]\›ˆYNÂˆB‚ˆÉÓX^XIË	Ñ]šIË	Ó[˜IË	ÔšXÛÉË	ĞšXIË	Õ[ÉË	Óš[˜IË	ĞØZ[ÉË	Ò˜YIË	Ó›ØZ	Ë	Ó^‰Ë	Ò]›É×K™›Ü‘XXÚ

‹JHOˆœÜËœ\Ú
™]È”Ê‹JJJNÂ‚ˆÛÛœİ\šÙYHÛ™]ÈØ\ŠÍL˜ŒÌ‹L‹M
K™]ÈØ\Š˜‹ML‹X]”HÈŠK™]ÈØ\ŠL‹ËN
K™]ÈØ\ŠÍÎÙKMËŒ‹X]”HÈŠWNÂˆ›Üˆ
]HHÈHÎÈJÊÊHÈÛÛœİÈH™]ÈØ\ŠÌYŒ™ŒÍKÍM˜NLKŒM‹™ÙŒ×VÚH	HWKLL
ÈH
ˆK›ØYÖÚH	H×H
È
H	HˆÈËŒˆˆLËŒŠKX]”HÈ‹YJNÈË˜\ÜÚYÛ”›ØY

NÈ]XÚØØİ\[
Ë	ØÚ]š[X[‰Ë	Ùš]™\‰ÊNÈB‚ˆÛÛœİÕ×ĞTÑHH™]È‘QK•™XİÜŒÊMM‹ŒËLL
KĞSUWĞTÑHH™]È‘QK•™XİÜŒÊŒËŒ‹ŒËL
KÓPÑWĞTÑHH™]È‘QK•™XİÜŒÊŒËŒ‹ŒËLL
NÂˆÛ\ÜÈİÒ›ØˆÂˆÛÛœİXİÜŠÜ™XÚÊHÈ\ËÜ™XÚÈHÜ™XÚÎÈ\Ë[Y\ˆHÈ\Ëœİ]HH	İØZ][™ÉÎÈ\ËİÈH[È\Ëœ]H×NÈ\ËšHHÈ\ËšÛÚÈHÈ\ËœÙ\šXÙHH[È\ËœİYÙHH[È\Ë\™Ù]X]ÈHÈ\ËœİXÚÈHÈ\Ë›\İÜÈH[È\Ë[œİXÚÕ[Y\ˆHÈ\Ëœ™\İ[YTİ]HH	Ø\›ØXÚ	ÎÈBˆ]Ú\İ[˜ÙJ
HÈ™]\›ˆ
\ËİÏËš[“‹MJH
È
\ËÜ™XÚÏËš[“‹ŒŠH
ÈNÈBˆ[”Ù\šXÙJœ›ÛJHÈ\ËœÙ\šXÙHH™X\™\İ[™R[™›Ê\ËÜ™XÚË™ËœÜÚ][ÛŠNÈÛÛœİÈH\ËœÙ\šXÙKœÚ[˜ÛÛ™J
KÙ™œÙ]H\Ëš]Ú\İ[˜ÙJ
H
È‹È]ÚYÛÈYˆ
\ËœÙ\šXÙK›ÜšY[][ÛˆOOH	İ‰ÊHÈÚYÛˆHœ›ÛKˆHËˆÈLHˆNÈ\ËœİYÙHHË˜ÛÛ™J
K˜Y
™]È‘QK•™XİÜŒÊÚYÛˆ
ˆÙ™œÙ]
JNÈÛÛœİ™]™\œÙQ\ˆHË˜ÛÛ™J
KœİXŠ\ËœİYÙJKœÙ]J
K››Ü›X[^™J
K›ÜØ\™H™]™\œÙQ\‹›][\TØØ[\ŠLJNÈ\Ë\™Ù]X]ÈHX]˜][ŒŠ›ÜØ\™›ÜØ\™ŠNÈH[ÙHÈÚYÛˆHœ›ÛKHËÈLHˆNÈ\ËœİYÙHHË˜ÛÛ™J
K˜Y
™]È‘QK•™XİÜŒÊÚYÛˆ
ˆÙ™œÙ]
JNÈÛÛœİ™]™\œÙQ\ˆHË˜ÛÛ™J
KœİXŠ\ËœİYÙJKœÙ]J
K››Ü›X[^™J
K›ÜØ\™H™]™\œÙQ\‹›][\TØØ[\ŠLJNÈ\Ë\™Ù]X]ÈHX]˜][ŒŠ›ÜØ\™›ÜØ\™ŠNÈH\Ëœ]H]™]ÙY[Šœ›ÛK\ËœİYÙJNÈ\ËšHHÈBˆÜ]ÛŠ
HÈYˆ
Xİ]™UİÒ›Øˆ	‰ˆXİ]™UİÒ›ØˆOOH\ÊH™]\›ˆ˜[ÙNÈXİ]™UİÒ›ØˆH\ÎÈ\ËİÈH™]ÈØ\ŠLKÕ×ĞTÑKÕ×ĞTÑK‹˜[ÙK	İİÉÊNÈ\ËİËœÙ\šXÙR›ØˆH\ÎÈ]XÚØØİ\[
\ËİË	ØÚ]š[X[‰Ë	Ùš]™\‰ÊNÈ\Ëœ[”Ù\šXÙJÕ×ĞTÑJNÈ\Ëœİ]HH	Ø\›ØXÚ	ÎÈ\Ë›\İÜÈH\ËİË™ËœÜÚ][Û‹˜ÛÛ™J
NÈ\ËœİXÚÈHÈ™]\›ˆYNÈBˆ™[X\ÙJ
HÈYˆ
Xİ]™UİÒ›ØˆOOH\ÊHXİ]™UİÒ›ØˆH[ÈBˆ[Ûš]ÜŠ
HÈYˆ
]\ËİÈÉİØZ][™ÉË	İÚ[˜Ú	Ë	Ü\šÉË	İ[œİXÚÉ×Kš[˜ÛY\Ê\Ëœİ]JJH™]\›ÈYˆ
]\Ë›\İÜÊH\Ë›\İÜÈH\ËİË™ËœÜÚ][Û‹˜ÛÛ™J
NÈÛÛœİ[İ™YH\ËİË™ËœÜÚ][Û‹™\İ[˜ÙUÊ\Ë›\İÜÊNÈYˆ
[İ™YŒH	‰ˆX]˜XœÊ\ËİËœÜYY
HJH\ËœİXÚÈ
ÏHÈ[ÙH\ËœİXÚÈHX]›X^
\ËœİXÚÈH
ˆŠNÈ\Ë›\İÜË˜ÛÜJ\ËİË™ËœÜÚ][ÛŠNÈYˆ
\ËœİXÚÈˆËJHÈ\ËœİXÚÈHÈ\ËİËœÜYYHÈ\Ë[œİXÚÕ[Y\ˆHNÈ\Ëœ™\İ[YTİ]HH\Ëœİ]HOOH	Ü™]\›‰ÈÈ	Ü™]\›‰Èˆ	Ø\›ØXÚ	ÎÈ\Ëœİ]HH	İ[œİXÚÉÎÈHBˆ\]J
HÂˆYˆ
\Ëœİ]HOOH	ÙÛ™IÈ\Ëœİ]HOOH	ÜİÛ[‰ÊH™]\›ÂˆYˆ
\Ëœİ]HOOH	İØZ][™ÉÊHÈYˆ
Xİ]™UİÒ›Øˆ	‰ˆXİ]™UİÒ›ØˆOOH\ÊH™]\›È\Ë[Y\ˆOHÈYˆ
\Ë[Y\ˆH
H\ËœÜ]ÛŠ
NÈ™]\›ÈBˆYˆ
]\ËİÈ\ËİËœ™[[İ™Y\ËİË™^ÙY
HÈ\Ëœ™[X\ÙJ
NÈYˆ
]\ËÜ™XÚËœ™[[İ™Y
HÈ\Ëœİ]HH	İØZ][™ÉÎÈ\Ë[Y\ˆHLÈ\ËİÈH[ÈH[ÙH\Ëœİ]HH	ÙÛ™IÎÈ™]\›ÈBˆYˆ
İ\œ™[Ø\ˆOOH\ËİÈ\ËİËYY“”ÊHÈ\Ëœİ]HH	ÜİÛ[‰ÎÈ\Ëœ™[X\ÙJ
NÈÛÛœİÜ™XÚÈH\ËÜ™XÚÎÈÙ][Y[İ]


HOˆÈYˆ
]Ü™XÚËœ™[[İ™Y
HİÒ›ØœËœ\Ú
™]ÈİÒ›ØŠÜ™XÚÊJNÈKL
NÈ™]\›ÈBˆ\Ë›[Ûš]ÜŠ
NÂˆYˆ
\Ëœİ]HOOH	İ[œİXÚÉÊHÈ\Ë[œİXÚÕ[Y\ˆOHÈ\ËİËœÜYYHLKŒNÈ\ËİË™Ëœ›İ][Û‹H
ÏH
ˆNÈ\ËİË›[İ™J
NÈYˆ
\Ë[œİXÚÕ[Y\ˆH
HÈ\ËİËœÜYYHÈYˆ
\Ëœ™\İ[YTİ]HOOH	Ü™]\›‰ÊHÈ\Ëœ]H]™]ÙY[Š\ËİË™ËœÜÚ][Û‹Õ×ĞTÑJNÈ\ËšHHÈ\Ëœİ]HH	Ü™]\›‰ÎÈH[ÙHÈ\Ëœ[”Ù\šXÙJ\ËİË™ËœÜÚ][ÛŠNÈ\Ëœİ]HH	Ø\›ØXÚ	ÎÈHH™]\›ÈBˆYˆ
\Ëœİ]HOOH	Ø\›ØXÚ	ÊHÈYˆ
\ËİË™š]™UÊ\Ëœ]İ\ËšWKŒJJHÈ\ËšJÊÎÈYˆ
\ËšHH\Ëœ]›[™İ
HÈ\ËİËœÜYYHÈ\Ëœİ]HH	Ø[YÛ‰ÎÈHH™]\›ÈBˆYˆ
\Ëœİ]HOOH	Ø[YÛ‰ÊHÈÛÛœİ[HHX]˜][ŒŠX]œÚ[Š\Ë\™Ù]X]ÈH\ËİË™Ëœ›İ][Û‹JKX]˜ÛÜÊ\Ë\™Ù]X]ÈH\ËİË™Ëœ›İ][Û‹JJNÈ\ËİË™Ëœ›İ][Û‹H
ÏH‘QK“X]][Ë˜Û[\
[KY
ˆK
ˆJNÈYˆ
X]˜XœÊ[JHŒJHÈ\ËİË™Ëœ›İ][Û‹HH\Ë\™Ù]X]ÎÈ\Ëœİ]HH	Ü™]™\œÙIÎÈH™]\›ÈBˆYˆ
\Ëœİ]HOOH	Ü™]™\œÙIÊHÈÛÛœİH\ËœÙ\šXÙKœÚ[˜ÛÛ™J
KœİXŠ\ËİË™ËœÜÚ][ÛŠKœÙ]J
NÈYˆ
›[™İ

HHKŒÍJHÈ\ËİËœÜYYHÈ\Ëœİ]HH	İÚ[˜Ú	ÎÈ\ËšÛÚÈHËNÈ™]\›ÈH\ËİËœÜYYHLKŒMNÈ\ËİË›[İ™J
NÈ™]\›ÈBˆYˆ
\Ëœİ]HOOH	İÚ[˜Ú	ÊHÈ\ËİËœÜYYHÈ\ËšÛÚÈOHÈÛÛœİ˜XÚÈH™]È‘QK•™XİÜŒÊSX]œÚ[Š\ËİË™Ëœ›İ][Û‹JKSX]˜ÛÜÊ\ËİË™Ëœ›İ][Û‹JJK[˜ÚÜˆH\ËİË™ËœÜÚ][Û‹˜ÛÛ™J
K˜YØØ[Y™XİÜŠ˜XÚË\Ëš]Ú\İ[˜ÙJ
HHJNÈ\ËÜ™XÚË™ËœÜÚ][Û‹›\œ
[˜ÚÜ‹X]›Z[ŠK
ˆKŒŠJNÈ\ËÜ™XÚË™Ëœ›İ][Û‹HH‘QK“X]][Ë›\œ
\ËÜ™XÚË™Ëœ›İ][Û‹K\ËİË™Ëœ›İ][Û‹KX]›Z[ŠK
ˆKJJNÈYˆ
\ËšÛÚÈH
HÈ\ËÜ™XÚË™ËœÜÚ][Û‹˜ÛÜJ[˜ÚÜŠNÈ\ËÜ™XÚË™Ëœ›İ][Û‹HH\ËİË™Ëœ›İ][Û‹NÈ\Ëœİ]HH	Ü™]\›‰ÎÈ\Ëœ]H]™]ÙY[Š\ËİË™ËœÜÚ][Û‹Õ×ĞTÑJNÈ\ËšHHÈH™]\›ÈBˆYˆ
\Ëœİ]HOOH	Ü™]\›‰ÊHÈÛÛœİ\œš]™YH\ËİË™š]™UÊ\Ëœ]İ\ËšWKË
K˜XÚÈH™]È‘QK•™XİÜŒÊSX]œÚ[Š\ËİË™Ëœ›İ][Û‹JKSX]˜ÛÜÊ\ËİË™Ëœ›İ][Û‹JJNÈ\ËÜ™XÚË™ËœÜÚ][Û‹˜ÛÜJ\ËİË™ËœÜÚ][ÛŠK˜YØØ[Y™XİÜŠ˜XÚË\Ëš]Ú\İ[˜ÙJ
HHJNÈ\ËÜ™XÚË™Ëœ›İ][Û‹HH\ËİË™Ëœ›İ][Û‹NÈYˆ
\œš]™Y
HÈ\ËšJÊÎÈYˆ
\ËšHH\Ëœ]›[™İ
HÈØÙ[™Kœ™[[İ™J\ËÜ™XÚË™ÊNÈ\ËÜ™XÚËœ™[[İ™YHYNÈ\Ëœİ]HH	Ü\šÉÎÈ\Ë[Y\ˆHÎÈHH™]\›ÈBˆYˆ
\Ëœİ]HOOH	Ü\šÉÊHÈ\Ë[Y\ˆOHÈYˆ
\Ë[Y\ˆH
HÈ\ËİËœ™[[İ™YHYNÈØÙ[™Kœ™[[İ™J\ËİË™ÊNÈ\Ëœ™[X\ÙJ
NÈ\Ëœİ]HH	ÙÛ™IÎÈHBˆBˆB‚ˆ[˜İ[Ûˆ™\]Y\İØ[]JœÊHÈYˆ
[œÈœËšHœËœØ[]T™\]Y\İY
H™]\›ÈœËœØ[]T™\]Y\İYHYNÈØ[]R›ØœËœ\Ú
™]ÈØ[]R›ØŠœÊJNÈBˆÛ\ÜÈØ[]R›ØˆÂˆÛÛœİXİÜŠ]Y[
HÈ\Ëœ]Y[H]Y[È\Ëœİ]HH	İØZ][™ÉÎÈ\Ë[Y\ˆHÎÈ\Ë˜[XˆH[È\Ëœ]H×NÈ\ËšHHÈ\Ëœ\˜[YYXÈH[È\Ë™X]HÈBˆÜ]ÛŠ
HÈYˆ
Xİ]™TØ[]R›Øˆ	‰ˆXİ]™TØ[]R›ØˆOOH\ÊH™]\›ˆ˜[ÙNÈXİ]™TØ[]R›ØˆH\ÎÈ\Ë˜[XˆH™]ÈØ\ŠĞSUWĞTÑKĞSUWĞTÑK‹X]”K˜[ÙK	ÜØ[]IÊNÈ]XÚØØİ\[
\Ë˜[X‹	ÛYYXÉË	Ùš]™\‰ÊNÈ]XÚØØİ\[
\Ë˜[X‹	ÛYYXÉË	Ü\ÜÙ[™Ù\‰ÊNÈ\Ëœ]H]™]ÙY[ŠĞSUWĞTÑK\Ëœ]Y[.g.position); this.i = 0; this.state = 'approach'; return true; }
    release() { if (activeSamuJob === this) activeSamuJob = null; }
    cleanup() { if (this.paramedic) scene.remove(this.paramedic); if (this.amb) { this.amb.removed = true; scene.remove(this.amb.g); } if (this.patient) this.patient.samuRequested = false; this.release(); this.state = 'done'; }
    update(dt) {
      if (this.state === 'done') return; if (this.patient.hp <= 0) { this.cleanup(); return; }
      if (this.state === 'waiting') { if (activeSamuJob && activeSamuJob !== this) return; this.timer -= dt; if (this.timer <= 0) this.spawn(); return; }
      if (!this.amb || this.amb.removed || this.amb.exploded) { this.release(); this.patient.samuRequested = false; this.state = 'done'; return; }
      if (currentCar === this.amb || this.amb.thiefNPC) { this.release(); this.patient.samuRequested = false; this.state = 'done'; return; }
      if (this.state === 'approach') { if (this.amb.driveTo(this.path[this.i], dt, 5)) { this.i++; if (this.i >= this.path.length) { this.state = 'deploy'; this.timer = 1; } } return; }
      if (this.state === 'deploy') { this.amb.speed = 0; this.timer -= dt; if (this.timer <= 0) { const med = this.amb.passengers.shift() || this.amb.driver; if (med) { this.amb.g.remove(med); this.paramedic = med; this.paramedic.scale.setScalar(1); this.paramedic.position.copy(this.amb.g.position).add(new THREE.Vector3(1.6, .18, 0)); scene.add(this.paramedic); } else { this.paramedic = person(0xf2f2f2, 0xb98262, 'medic'); this.paramedic.position.copy(this.amb.g.position).add(new THREE.Vector3(1.6, .18, 0)); scene.add(this.paramedic); } this.state = 'walk'; } return; }
      if (this.state === 'walk') { const d = this.patient.g.position.clone().sub(this.paramedic.position).setY(0); if (d.length() < .8) { this.state = 'treat'; this.treat = 4; return; } d.normalize(); this.paramedic.position.addScaledVector(d, dt * 1.8); this.paramedic.rotation.y = Math.atan2(d.x, d.z); return; }
      if (this.state === 'treat') { this.treat -= dt; if (this.treat <= 0) { this.patient.hp = Math.max(this.patient.hp, 70); this.patient.down = 0; this.patient.g.rotation.z = 0; this.patient.g.position.y = .18; this.patient.samuRequested = false; this.state = 'return'; this.path = pathBetween(this.amb.g.position, SAMU_BASE); this.i = 0; scene.remove(this.paramedic); this.paramedic = null; } return; }
      if (this.state === 'return' && this.amb.driveTo(this.path[this.i], dt, 5)) { this.i++; if (this.i >= this.path.length) this.cleanup(); }
    }
  }

  function spawnPolicePatrol(x, z, rot = 0) { const c = new Car(0x1c376d, x, z, rot, true, 'police'); attachOccupant(c, 'police', 'driver'); attachOccupant(c, 'police', 'passenger'); c.assignRoad(); return c; }
  spawnPolicePatrol(POLICE_BASE.x, POLICE_BASE.z, 0); spawnPolicePatrol(-3.2, -100, 0);

  const player = person(0x171b21, 0xc98e6c); scene.add(player);
  const pistol = new THREE.Group(); pistol.add(box(.13, .17, .7, mat(0x17191c, .35, .35), 0, 0, .35), box(.16, .35, .18, mat(0x25282c, .55, .2), 0, -.2, .1)); pistol.position.set(.35, 1.38, .2); player.add(pistol);
  let health = 100, money = 1250, bandages = 3, slot = 'fist', aiming = false, crouched = false, prone = false, running = false, jumpY = 0, jumpV = 0, dead = false, currentCar = null, lastShot = -999, reloading = false, mag = 12, reserve = 72, playerDown = 0;
  const playerImpactVel = new THREE.Vector3(), MAG_SIZE = 12, keys = {}, clock = new THREE.Clock(), joy = { x: 0, y: 0, tx: 0, ty: 0, p: null };
  let playerIgnoreCar = null, playerIgnoreCarTimer = 0, yaw = Math.PI, pitch = .12, camDist = 5.8, drag = false, last = { x: 0, y: 0 }, camPointer = null;

  const statusEl = $('#status'), moneyEl = $('#money'), healthEl = $('#health-value'), healthBar = $('#health-bar'), promptEl = $('#prompt'), vehicleHud = $('#vehicle-hud'), speedEl = $('#vehicle-speed'), fuelEl = $('#vehicle-fuel'), fuelBar = $('#vehicle-fuel-bar'), carHpEl = $('#vehicle-health'), carHpBar = $('#vehicle-health-bar'), ammoHud = $('#ammo-hud'), ammoMagEl = $('#ammo-mag'), ammoReserveEl = $('#ammo-reserve'), reloadBtn = $('#action-reload'), footUI = $('#on-foot-controls'), carUI = $('#car-controls'), crosshair = $('#crosshair');
  function cleanPoint(p, r = .48, ignore = null) { return !hitsStatic(p, r) && cars.every(c => c === ignore || c.removed || !hitsCar(c, p, r)); }
  function safeSpawn() { for (const [x, z] of [[12, 12], [-12, 12], [12, -12], [-12, -12], [0, 14], [14, 0]]) { const p = new THREE.Vector3(x, .18, z); if (cleanPoint(p, .55)) { player.position.copy(p); return; } } player.position.set(0, .18, 14); }
  safeSpawn();
  function nearestVehicle() { return cars.filter(c => !c.exploded && !c.removed).map(car => ({ car, d: car.g.position.distanceTo(player.position) })).sort((a, b) => a.d - b.d)[0]; }
  function leaveCar(force = false) {
    if (!currentCar) return; const old = currentCar; currentCar = null; player.visible = true; let placed = false;
    for (const [x, z] of [[2.7, 0], [-2.7, 0], [0, 3.2], [0, -3.2]]) { const p = old.g.localToWorld(new THREE.Vector3(x, .18, z)); p.y = .18; if (cleanPoint(p, .48, old)) { player.position.copy(p); placed = true; break; } }
    if (!placed) safeSpawn(); footUI?.classList.remove('hidden'); carUI?.classList.add('hidden'); vehicleHud?.classList.add('hidden'); keys.DriveGas = keys.DriveBrake = keys.DriveLeft = keys.DriveRight = false; if (force) health = Math.max(1, health - 35);
  }
  function toggleCar() {
    if (currentCar) { leaveCar(); return; }
    const n = nearestVehicle(); if (!n || n.d >= 4.8) return;
    stealVehicle(n.car, 'player'); currentCar = n.car; n.car.thiefNPC = null; player.visible = false; footUI?.classList.add('hidden'); carUI?.classList.remove('hidden'); vehicleHud?.classList.remove('hidden'); aiming = false; refreshActionLabels();
  }
  function damagePlayerImpact(impact, dir, sourceCar = null) {
    if (dead) return; let dmg = 0, push = .4, down = 1.2;
    if (impact < 4.5) { dmg = 5 + impact * 2; push = .7; down = 1.2; } else if (impact < 8) { dmg = 15 + (impact - 4.5) * 6; push = 2.9; down = 2.2; } else { dmg = Math.min(95, 35 + (impact - 8) * 7); push = 5.1; down = 3.2; }
    if (sourceCar) { playerIgnoreCar = sourceCar; playerIgnoreCarTimer = .85; const sep = separationPoint(sourceCar, player.position, .7); if (!hitsStatic(sep, .36)) player.position.copy(sep); }
    health = Math.max(0, health - Math.round(dmg)); playerDown = Math.max(playerDown, down); player.rotation.z = Math.PI / 2; playerImpactVel.copy(dir).normalize().multiplyScalar(push); if (health <= 0) { dead = true; playerDown = 0; setTimeout(() => { health = 100; dead = false; player.rotation.z = 0; playerImpactVel.set(0, 0, 0); playerIgnoreCar = null; playerIgnoreCarTimer = 0; playerWanted = 0; safeSpawn(); }, 2200); }
  }
  function useBandage() { if (dead || currentCar || bandages <= 0 || health >= 100) return; bandages--; health = Math.min(100, health + 35); slot = 'bandage'; setTimeout(() => { slot = 'fist'; refreshActionLabels(); }, 500); refreshActionLabels(); }
  function cycleSlot() { slot = slot === 'fist' ? 'pistol' : slot === 'pistol' ? 'bandage' : 'fist'; aiming = false; refreshActionLabels(); }
  function refreshActionLabels() { const s = $('#slot-name'); if (s) s.textContent = slot === 'fist' ? 'SOCO' : slot === 'pistol' ? 'PISTOLA' : `BANDAGEM ${bandages}`; const a = $('#action-fire'); if (a) a.textContent = slot === 'fist' ? 'GOLPE' : slot === 'pistol' ? 'ATIRAR' : 'USAR'; crosshair?.classList.toggle('hidden', slot !== 'pistol' || !aiming || !!currentCar); pistol.visible = slot === 'pistol' && !currentCar && !dead; ammoHud?.classList.toggle('hidden', slot !== 'pistol' || !!currentCar); if (ammoMagEl) ammoMagEl.textContent = String(mag).padStart(2, '0'); if (ammoReserveEl) ammoReserveEl.textContent = String(reserve).padStart(2, '0'); }
  function reload() { if (reloading || slot !== 'pistol' || currentCar || mag >= MAG_SIZE || reserve <= 0) return; reloading = true; if (reloadBtn) reloadBtn.textContent = 'RECARREGANDO'; setTimeout(() => { const take = Math.min(MAG_SIZE - mag, reserve); mag += take; reserve -= take; reloading = false; if (reloadBtn) reloadBtn.textContent = 'RECARREGAR'; refreshActionLabels(); }, 950); }

  function makeBullet(origin, dir, owner, target = null) { const mesh = new THREE.Mesh(new THREE.SphereGeometry(.065, 8, 6), new THREE.MeshBasicMaterial({ color: owner === 'police' ? 0x6bb9ff : 0xffd45c })); mesh.position.copy(origin); scene.add(mesh); projectiles.push({ mesh, vel: dir.normalize().multiplyScalar(owner === 'police' ? 40 : 48), life: 1.8, owner, target }); }
  function fireProjectile() { if (mag <= 0) { reload(); return; } mag--; registerCrime('player', 1, 'disparo de arma'); const dir = new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)).normalize(), origin = player.position.clone().add(new THREE.Vector3(0, crouched ? 1.25 : 1.65, 0)).addScaledVector(dir, .7); makeBullet(origin, dir, 'player'); refreshActionLabels(); }
  let lastPoliceShotGlobal = -999;
  function policeShoot(origin, target, shooter) { if (clock.elapsedTime - lastPoliceShotGlobal < .14) return; lastPoliceShotGlobal = clock.elapsedTime; const tp = actorPosition(target); if (!tp) return; const aim = tp.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(origin); makeBullet(origin, aim, 'police', target); }
  function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]; p.mesh.position.addScaledVector(p.vel, dt); p.life -= dt; let hit = false;
      if (p.owner === 'police') {
        const target = p.target, tp = actorPosition(target);
        if (tp && p.mesh.position.distanceTo(tp.clone().add(new THREE.Vector3(0, .9, 0))) < .75) {
          if (target === 'player') { health = Math.max(0, health - 28); if (health <= 0 && !dead) { dead = true; playerDown = 0; setTimeout(() => { health = 100; dead = false; playerWanted = 0; safeSpawn(); }, 2200); } }
          else if (target instanceof NPC) target.hit(45, 'body', null);
          hit = true;
        }
      } else {
        for (const n of npcs) { if (n.hp <= 0 || n.inVehicle) continue; const head = n.g.position.clone().add(new THREE.Vector3(0, 2, 0)), torso = n.g.position.clone().add(new THREE.Vector3(0, 1.05, 0)); if (head.distanceTo(p.mesh.position) < .34) { n.hit(120, 'head', 'player'); hit = true; break; } if (torso.distanceTo(p.mesh.position) < .78) { n.hit(42, 'body', 'player'); hit = true; break; } }
        if (!hit) for (const c of cars) { if (c.removed) continue; if (hitsCar(c, p.mesh.position, .05)) { if (c.driver && (c.driver.userData.hp ?? 100) > 0) { const lp = c.g.worldToLocal(p.mesh.position.clone()); if (Math.abs(lp.x) < .72 && lp.z > -1.25 && lp.z < .55 && lp.y > .65 && lp.y < 2) { const headshot = lp.y > 1.45; c.driver.userData.hp = Math.max(0, (c.driver.userData.hp ?? 100) - (headshot ? 120 : 55)); if (c.driver.userData.hp <= 0) { const deadDriver = makeDroppedNPCFromVisual(c, c.driver, false, false); deadDriver.hp = 0; deadDriver.down = 999; deadDriver.g.rotation.z = Math.PI / 2; c.driver = null; c.ai = false; } } } if (!c.exploded) c.damage(10); hit = true; break; } }
      }
      if (!hit && hitsStatic(p.mesh.position, .08)) hit = true;
      if (hit || p.life <= 0) { scene.remove(p.mesh); projectiles.splice(i, 1); }
    }
  }
  function primaryAction() { if (currentCar || dead) return; if (slot === 'bandage') { useBandage(); return; } if (slot === 'fist') { const n = npcs.filter(n => n.hp > 0 && !n.inVehicle).map(n => ({ n, d: n.g.position.distanceTo(player.position) })).sort((a, b) => a.d - b.d)[0]; if (n && n.d < 1.7) { n.n.hit(15, 'body', 'player'); registerCrime('player', 1, 'agressÃ§o'); } return; } if (reloading || clock.elapsedTime - lastShot < .22) return; lastShot = clock.elapsedTime; fireProjectile(); }
  function jump() { if (currentCar || dead || prone || jumpY > 0) return; jumpV = 4.5; }

  function movePlayer(dt) {
    if (currentCar || dead) return; playerIgnoreCarTimer = Math.max(0, playerIgnoreCarTimer - dt); if (playerIgnoreCarTimer <= 0) playerIgnoreCar = null;
    if (playerDown > 0) { playerDown -= dt; const old = player.position.clone(); player.position.addScaledVector(playerImpactVel, dt); playerImpactVel.multiplyScalar(Math.pow(.9, dt * 60)); const blockedByCar = cars.some(c => c !== playerIgnoreCar && !c.removed && hitsCar(c, player.position, .35)); if (hitsStatic(player.position, .42) || blockedByCar) player.position.copy(old); if (playerDown <= 0) { player.rotation.z = 0; playerImpactVel.set(0, 0, 0); } return; }
    joy.x = THREE.MathUtils.lerp(joy.x, joy.tx, Math.min(1, dt * 16)); joy.y = THREE.MathUtils.lerp(joy.y, joy.ty, Math.min(1, dt * 16)); const x = Math.abs(joy.x) > .08 ? joy.x : (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), y = Math.abs(joy.y) > .08 ? joy.y : (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0), m = Math.min(1, Math.hypot(x, y)); running = !!keys.MobileRun; const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), r = new THREE.Vector3(-f.z, 0, f.x);
    if (m > .05) { const mv = f.multiplyScalar(y / m).add(r.multiplyScalar(x / m)).normalize(), speed = (prone ? 1.2 : crouched ? 2.1 : running ? 7 : 4.1) * (.35 + .65 * m), delta = mv.clone().multiplyScalar(speed * dt), px = player.position.clone().add(new THREE.Vector3(delta.x, 0, 0)), pz = player.position.clone().add(new THREE.Vector3(0, 0, delta.z)); if (cleanPoint(px, .42)) player.position.x = px.x; if (cleanPoint(pz, .42)) player.position.z = pz.z; player.rotation.y = Math.atan2(mv.x, mv.z); }
    if (jumpY > 0 || jumpV > 0) { jumpV -= 9 * dt; jumpY = Math.max(0, jumpY + jumpV * dt); if (jumpY === 0) jumpV = 0; } player.position.y = .18 + jumpY; player.scale.y = prone ? .34 : crouched ? .72 : 1;
  }
  function updateCamera() { if (currentCar) { const p = currentCar.g.localToWorld(new THREE.Vector3(0, 1.55, .1)), l = currentCar.g.localToWorld(new THREE.Vector3(0, 1.45, 10)); camera.position.copy(p); camera.lookAt(l); return; } if (slot === 'pistol' && aiming) { const head = player.position.clone().add(new THREE.Vector3(0, prone ? .65 : crouched ? 1.2 : 1.72, 0)), dir = new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)); camera.position.copy(head); camera.lookAt(head.clone().add(dir.multiplyScalar(20))); return; } const target = player.position.clone().add(new THREE.Vector3(0, prone ? .6 : crouched ? 1 : 1.45, 0)), h = Math.cos(pitch) * camDist; camera.position.copy(target).add(new THREE.Vector3(Math.sin(yaw) * h, Math.sin(pitch) * camDist + .8, Math.cos(yaw) * h)); camera.lookAt(target); }
  function updateHud(dt) {
    if (playerWanted > 0) { wantedTimer -= dt; if (wantedTimer <= 0) playerWanted = 0; }
    if (statusEl) statusEl.textContent = playerWanted > 0 ? `PROCURADO ${'â˜…'.repeat(playerWanted)}` : currentCar ? 'DIRIGINDO' : playerDown > 0 ? 'CAÃDO' : prone ? 'DEITADO' : crouched ? 'AGACHADO' : running ? 'CORRENDO' : 'A PÃ‰';
    if (moneyEl) moneyEl.textContent = money.toLocaleString('pt-BR'); if (healthEl) healthEl.textContent = `${Math.round(health)}/100`; if (healthBar) healthBar.style.width = `${health}%`;
    if (currentCar) { if (speedEl) speedEl.textContent = `${Math.round(Math.abs(currentCar.speed) * 8)} km/h`; if (fuelEl) fuelEl.textContent = `${Math.round(currentCar.fuel)}%`; if (fuelBar) fuelBar.style.width = `${currentCar.fuel}%`; if (carHpEl) carHpEl.textContent = currentCar.critical ? 'CRÃTICO' : `${Math.round(currentCar.hp)}%`; if (carHpBar) carHpBar.style.width = `${Math.max(0, currentCar.hp / currentCar.maxHp * 100)}%`; }
    const n = nearestVehicle(); if (promptEl) promptEl.textContent = !currentCar && n && n.d < 4.8 ? 'ENTRAR NO VEÃCULO' : ''; if (ammoMagEl) ammoMagEl.textContent = String(mag).padStart(2, '0'); if (ammoReserveEl) ammoReserveEl.textContent = String(reserve).padStart(2, '0');
  }
  function sanitizeWorld() { for (const n of npcs) if (!n.inVehicle && (hitsStatic(n.g.position, .4) || isRoadPoint(n.g.position))) n.relocate(); for (const c of cars) { if (!c.ai || !['normal', 'police'].includes(c.kind) || c.removed || c.exploded) continue; c.g.position.copy(nearestRoadPoint(c.g.position)); c.speed = 0; if (!c.driver) attachOccupant(c, c.kind === 'police' ? 'police' : 'civilian', 'driver'); } }
  sanitizeWorld();

  addEventListener('keydown', e => { keys[e.code] = true; if (e.repeat) return; if (e.code === 'KeyE') toggleCar(); if (e.code === 'KeyF') cycleSlot(); if (e.code === 'KeyR') reload(); if (e.code === 'Space') jump(); }); addEventListener('keyup', e => keys[e.code] = false);
  renderer.domElement.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && e.clientX < innerWidth * .45) return; drag = true; camPointer = e.pointerId; last = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointermove', e => { if (!drag || e.pointerId !== camPointer) return; const dx = e.clientX - last.x, dy = e.clientY - last.y; yaw -= dx * .003; pitch = THREE.MathUtils.clamp(pitch + dy * .002, -.35, .55); last = { x: e.clientX, y: e.clientY }; }); renderer.domElement.addEventListener('pointerup', () => drag = false); renderer.domElement.addEventListener('pointercancel', () => drag = false);

  $('#action-fire')?.addEventListener('pointerdown', e => { e.preventDefault(); primaryAction(); }); $('#action-slot')?.addEventListener('pointerdown', e => { e.preventDefault(); cycleSlot(); }); $('#action-aim')?.addEventListener('pointerdown', e => { e.preventDefault(); if (slot === 'pistol') { aiming = !aiming; refreshActionLabels(); } }); $('#action-bandage')?.addEventListener('pointerdown', e => { e.preventDefault(); useBandage(); }); reloadBtn?.addEventListener('pointerdown', e => { e.preventDefault(); reload(); }); $('#action-crouch')?.addEventListener('pointerdown', e => { e.preventDefault(); crouched = !crouched; prone = false; }); $('#action-prone')?.addEventListener('pointerdown', e => { e.preventDefault(); prone = !prone; crouched = false; }); $('#action-run')?.addEventListener('pointerdown', e => { e.preventDefault(); keys.MobileRun = !keys.MobileRun; }); $('#action-jump')?.addEventListener('pointerdown', e => { e.preventDefault(); jump(); }); $('#action-use')?.addEventListener('pointerdown', e => { e.preventDefault(); toggleCar(); }); $('#car-exit')?.addEventListener('pointerdown', e => { e.preventDefault(); leaveCar(); });
  const joyEl = $('#joystick'), knob = $('#joystick-knob');
  if (joyEl && knob) { function jm(e) { const r = joyEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = e.clientX - cx, dy = e.clientY - cy, max = Math.min(r.width, r.height) * .3, l = Math.hypot(dx, dy) || 1; if (l > max) { dx = dx / l * max; dy = dy / l * max; } const nx = dx / max, ny = -dy / max, magv = Math.hypot(nx, ny); if (magv < .12) joy.tx = joy.ty = 0; else { const s = (magv - .12) / .88; joy.tx = nx / magv * s; joy.ty = ny / magv * s; } knob.style.transform = `translate(${dx}px,${dy}px)`; } joyEl.onpointerdown = e => { e.preventDefault(); joy.p = e.pointerId; joyEl.setPointerCapture?.(e.pointerId); jm(e); }; joyEl.onpointermove = e => { if (joy.p === e.pointerId) jm(e); }; const je = e => { if (joy.p !== e.pointerId) return; joy.p = null; joy.tx = joy.ty = 0; knob.style.transform = 'translate(0,0)'; }; joyEl.onpointerup = je; joyEl.onpointercancel = je; }
  for (const b of document.querySelectorAll('[data-drive]')) { const k = { left: 'DriveLeft', right: 'DriveRight', gas: 'DriveGas', brake: 'DriveBrake' }[b.dataset.drive], on = e => { e.preventDefault(); keys[k] = true; }, off = e => { e.preventDefault(); keys[k] = false; }; b.onpointerdown = on; b.onpointerup = off; b.onpointercancel = off; b.onpointerleave = off; }
  function resizeGame() { const v = viewport(); camera.aspect = v.w / v.h; camera.updateProjectionMatrix(); renderer.setSize(v.w, v.h, false); } addEventListener('resize', resizeGame); addEventListener('orientationchange', () => setTimeout(resizeGame, 120)); refreshActionLabels();

  let firstFrame = false;
  function loop() {
    requestAnimationFrame(loop); const dt = Math.min(clock.getDelta(), .045), t = clock.elapsedTime; updateSignals(t); movePlayer(dt); for (const c of cars) c.update(dt); for (const n of npcs) n.update(dt); for (const o of [...trees, ...poles]) if (o.fallen) { const a = o.sign * Math.PI * .48; if (o.axis === 'x') o.g.rotation.x = THREE.MathUtils.lerp(o.g.rotation.x, a, dt * 3); else o.g.rotation.z = THREE.MathUtils.lerp(o.g.rotation.z, a, dt * 3); } for (const j of towJobs) j.update(dt); for (const s of samuJobs) s.update(dt); updateProjectiles(dt); updateCamera(); updateHud(dt); renderer.render(scene, camera); if (!firstFrame) { firstFrame = true; setTimeout(() => $('#loading-screen')?.classList.add('done'), 250); console.info('[Cidade Viva] boot OK', VERSION); }
  }
  loop();
} catch (error) { showFatal(error); }
