// Cidade Viva — Beta 0.1.4
// Consolida correções de tráfego, guinchos, roubo de veículos e dano por impacto.
let source=await fetch('./beta012.js?v=014').then(r=>r.text());

// 1) Carros recebem cooldown de impacto para não perder vida a cada frame encostados.
source=source.replace(
"this.route=null;this.halfW=1.08;this.halfL=2.2;cars.push(this)",
"this.route=null;this.halfW=1.08;this.halfL=2.2;this.impactCooldown=0;this.driver=null;this.serviceJob=null;cars.push(this)"
);
source=source.replace(
"move(dt){if(this.exploded||this.removed)return;const old=this.g.position.clone(),impact=Math.abs(this.speed)",
"move(dt){if(this.exploded||this.removed)return;this.impactCooldown=Math.max(0,this.impactCooldown-dt);const old=this.g.position.clone(),impact=Math.abs(this.speed)"
);
source=source.replace(
"this.damage(Math.max(3,impact*2));this.speed*=-.12;return",
"if(this.impactCooldown<=0&&impact>1.25){this.damage(Math.max(3,impact*1.65));this.impactCooldown=.7}this.speed=0;return"
);
source=source.replace(
"if(!o.exploded){const rel=Math.max(impact,Math.abs(o.speed));this.damage(Math.max(4,rel*2.5));o.damage(Math.max(3,rel*1.8))}this.speed=0;return",
"if(!o.exploded){const rel=Math.max(impact,Math.abs(o.speed));if(this.impactCooldown<=0&&rel>1.4){this.damage(Math.max(3,rel*1.65));this.impactCooldown=.7}if(o.impactCooldown<=0&&rel>1.4){o.damage(Math.max(2,rel*1.25));o.impactCooldown=.7}}this.speed=0;return"
);

// 2) Motorista visível em todo veículo de tráfego autônomo.
source=source.replace(
"for(let i=0;i<7;i++){const c=new Car([0x9f2f35,0x356a91,0xd28b28,0x44494f,0x2d7f63][i%5],-100+i*29,roads[i%3]+(i%2?3.2:-3.2),Math.PI/2,true);c.assignRoad()}",
"function attachDriver(car,color=0x36556f){if(car.driver)return car.driver;const d=person(color,0xb98262);d.scale.setScalar(.55);d.position.set(0,.62,-.18);d.rotation.y=Math.PI;car.g.add(d);car.driver=d;return d}for(let i=0;i<7;i++){const c=new Car([0x9f2f35,0x356a91,0xd28b28,0x44494f,0x2d7f63][i%5],-100+i*29,roads[i%3]+(i%2?3.2:-3.2),Math.PI/2,true);c.assignRoad();attachDriver(c,[0x36556f,0x5a4736,0x3d6044][i%3])}"
);

// 3) Substitui serviço de guincho: um chamado ativo por vez; guincho é Car real e roubável.
const towStart=source.indexOf('class TowJob{');
const towEnd=source.indexOf('\nfunction cleanPoint',towStart);
if(towStart<0||towEnd<0)throw new Error('TowJob base não localizado');
const towCode=`let activeTowJob=null;
class TowJob{
constructor(wreck){this.wreck=wreck;this.timer=8;this.state='waiting';this.tow=null;this.path=[];this.i=0;this.hook=0;this.driver=null}
spawn(){if(activeTowJob&&activeTowJob!==this)return false;activeTowJob=this;this.tow=new Car(0xe0b429,TOW_BASE.x,TOW_BASE.z,0,false);this.tow.service='tow';this.tow.serviceJob=this;this.tow.halfW=1.12;this.tow.halfL=2.5;this.tow.hp=180;this.tow.fuel=100;this.tow.g.add(box(1.75,.16,2.5,darkMat,0,.82,-1.85));this.tow.g.add(box(.16,.16,2.1,lineMat,0,.97,-2.0));this.driver=attachDriver(this.tow,0x29455f);this.path=towPath(TOW_BASE,this.wreck.g.position);this.i=0;this.state='approach';return true}
release(){if(activeTowJob===this)activeTowJob=null}
obstacleAhead(){if(!this.tow)return true;if(signalAhead(this.tow))return true;const f=new THREE.Vector3(Math.sin(this.tow.g.rotation.y),0,Math.cos(this.tow.g.rotation.y));for(const c of cars){if(c===this.tow||c===this.wreck||c.removed)continue;const d=c.g.position.clone().sub(this.tow.g.position).setY(0);if(d.length()<8&&f.dot(d.clone().normalize())>.7)return true}for(const n of npcs){if(n.hp<=0)continue;const d=n.g.position.clone().sub(this.tow.g.position).setY(0);if(d.length()<5.5&&f.dot(d.clone().normalize())>.74)return true}return !!carStaticHit(this.tow)}
driveTo(target,dt,maxSpeed=4.2){const d=target.clone().sub(this.tow.g.position).setY(0);if(d.length()<1.35){this.tow.speed=0;return true}const desired=Math.atan2(d.x,d.z),delta=Math.atan2(Math.sin(desired-this.tow.g.rotation.y),Math.cos(desired-this.tow.g.rotation.y));this.tow.g.rotation.y+=THREE.MathUtils.clamp(delta,-dt*.75,dt*.75);const wanted=this.obstacleAhead()?0:maxSpeed;this.tow.speed=THREE.MathUtils.lerp(this.tow.speed,wanted,Math.min(1,dt*2.2));this.tow.move(dt);return false}
update(dt){if(this.state==='done'||this.state==='stolen')return;if(this.state==='waiting'){if(activeTowJob&&activeTowJob!==this)return;this.timer-=dt;if(this.timer<=0)this.spawn();return}if(!this.tow||this.tow.removed||this.tow.exploded){this.release();if(!this.wreck.removed){this.state='waiting';this.timer=10;this.tow=null}else this.state='done';return}if(currentCar===this.tow){this.state='stolen';this.release();const wreck=this.wreck;setTimeout(()=>{if(!wreck.removed)towJobs.push(new TowJob(wreck))},10000);return}if(this.state==='approach'){if(this.driveTo(this.path[this.i],dt,4.3)){this.i++;if(this.i>=this.path.length){this.state='position';this.hook=5}}return}if(this.state==='position'){const near=this.wreck.g.position.clone().sub(this.tow.g.position).setY(0);if(near.length()>4){this.driveTo(this.wreck.g.position,dt,1.15);return}this.tow.speed=0;this.hook-=dt;if(this.hook<=0){this.state='return';this.path=towPath(this.tow.g.position,TOW_BASE);this.i=0}return}if(this.state==='return'){const arrived=this.driveTo(this.path[this.i],dt,3.4);const back=new THREE.Vector3(-Math.sin(this.tow.g.rotation.y),0,-Math.cos(this.tow.g.rotation.y));this.wreck.g.position.copy(this.tow.g.position).addScaledVector(back,3.9);this.wreck.g.rotation.y=this.tow.g.rotation.y;if(arrived){this.i++;if(this.i>=this.path.length){this.tow.speed=0;scene.remove(this.wreck.g);this.wreck.removed=true;this.state='park';this.timer=3}}return}if(this.state==='park'){this.timer-=dt;if(this.timer<=0){this.tow.removed=true;scene.remove(this.tow.g);this.release();this.state='done'}}}}
`;
source=source.slice(0,towStart)+towCode+source.slice(towEnd);

// 4) Qualquer carro inteiro e próximo pode ser roubado, inclusive tráfego e guincho.
source=source.replace(
"function nearestParked(){return parked.filter(c=>!c.exploded&&!c.removed).map(car=>({car,d:car.g.position.distanceTo(player.position)})).sort((a,b)=>a.d-b.d)[0]}",
"function nearestParked(){return cars.filter(c=>!c.exploded&&!c.removed).map(car=>({car,d:car.g.position.distanceTo(player.position)})).sort((a,b)=>a.d-b.d)[0]}"
);
source=source.replace(
"currentCar=n.car;player.visible=false;footUI.classList.add('hidden');carUI.classList.remove('hidden');vehicleHud.classList.remove('hidden');aiming=false",
"currentCar=n.car;if(currentCar.driver)currentCar.driver.visible=false;currentCar.ai=false;currentCar.speed=0;player.visible=false;footUI.classList.add('hidden');carUI.classList.remove('hidden');vehicleHud.classList.remove('hidden');aiming=false"
);
source=source.replace(
"currentCar=null;player.visible=true;let placed=false;",
"currentCar=null;if(old.driver)old.driver.visible=true;player.visible=true;let placed=false;"
);

// 5) Saneamento inicial: NPCs nas calçadas e carros AI alinhados em faixas válidas.
const loopMarker="setTimeout(()=>$('#loading-screen')?.classList.add('done'),900);";
const sanity=`function sanitizeWorld(){for(const n of npcs){const p=n.g.position;if(hitsStatic(p,.4)||roads.some(r=>Math.abs(p.x-r)<9||Math.abs(p.z-r)<9))n.relocate()}for(const c of cars){if(!c.ai||c.service||c.removed||c.exploded)continue;const q=nearestRoadPoint(c.g.position);c.g.position.copy(q);if(Math.abs(q.x-roads.reduce((a,r)=>Math.abs(r-q.x)<Math.abs(a-q.x)?r:a,roads[0]))<7)c.g.rotation.y=0;else c.g.rotation.y=Math.PI/2;c.speed=0;if(!c.driver)attachDriver(c)}}sanitizeWorld();`;
source=source.replace(loopMarker,sanity+loopMarker);

const blob=new Blob([source],{type:'text/javascript'});
await import(URL.createObjectURL(blob));
