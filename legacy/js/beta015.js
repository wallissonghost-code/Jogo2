// Cidade Viva — Beta 0.1.5
// Evolui a 0.1.4 com manobra de ré do guincho, hitboxes, SAMU e atropelamento por intensidade.
let source=await fetch('./beta014.js?v=015').then(r=>r.text());

// Injeta novas transformações antes do blob final da Beta 0.1.4.
const marker="const blob=new Blob([source],{type:'text/javascript'});";
const extra=`
// Beta 0.1.5 — motorista com vida e vínculo ao veículo.
source=source.replace(
"function attachDriver(car,color=0x36556f){if(car.driver)return car.driver;const d=person(color,0xb98262);d.scale.setScalar(.55);d.position.set(0,.62,-.18);d.rotation.y=Math.PI;car.g.add(d);car.driver=d;return d}",
"function attachDriver(car,color=0x36556f){if(car.driver)return car.driver;const d=person(color,0xb98262);d.scale.setScalar(.55);d.position.set(0,.62,-.18);d.rotation.y=Math.PI;d.userData.hp=100;d.userData.vehicle=car;car.g.add(d);car.driver=d;return d}"
);

// Player pode cair/arremessar conforme intensidade do atropelamento.
source=source.replace(
"let health=100,money=1250,bandages=3,slot='fist',aiming=false,crouched=false,prone=false,running=false,jumpY=0,jumpV=0,dead=false,currentCar=null,lastShot=0,reloading=false,mag=12,reserve=72;",
"let health=100,money=1250,bandages=3,slot='fist',aiming=false,crouched=false,prone=false,running=false,jumpY=0,jumpV=0,dead=false,currentCar=null,lastShot=0,reloading=false,mag=12,reserve=72,playerDown=0;const playerImpactVel=new THREE.Vector3();"
);
source=source.replace(
"damagePlayer(Math.min(95,Math.round((impact-1.5)*6)),f);this.speed*=.5",
"damagePlayer(Math.min(95,Math.round((impact-1.5)*6)),f,impact);this.speed*=.5"
);
source=source.replace(
"function damagePlayer(v,push){if(dead)return;health=Math.max(0,health-v);if(push)player.position.addScaledVector(push.clone().normalize(),Math.min(1.4,v*.025));if(health<=0){dead=true;setTimeout(()=>{health=100;dead=false;safeSpawn()},2200)}}",
"function damagePlayer(v,push,impact=0){if(dead)return;health=Math.max(0,health-v);if(push&&impact>1.8){playerDown=Math.max(playerDown,impact<5?1.2:impact<9?2.2:3.2);player.rotation.z=Math.PI/2;playerImpactVel.copy(push).normalize().multiplyScalar(impact<5?.45:impact<9?2.6:4.8)}if(health<=0){dead=true;playerDown=0;setTimeout(()=>{health=100;dead=false;player.rotation.z=0;playerImpactVel.set(0,0,0);safeSpawn()},2200)}}"
);
source=source.replace(
"function movePlayer(dt){if(currentCar||dead)return;",
"function movePlayer(dt){if(currentCar||dead)return;if(playerDown>0){playerDown-=dt;const old=player.position.clone();player.position.addScaledVector(playerImpactVel,dt);playerImpactVel.multiplyScalar(Math.pow(.9,dt*60));if(hitsStatic(player.position,.42)||cars.some(c=>!c.removed&&hitsCar(c,player.position,.35)))player.position.copy(old);if(playerDown<=0){player.rotation.z=0;playerImpactVel.set(0,0,0)}return;}"
);

// SAMU: um atendimento ativo, ambulância física, socorrista desce e atende NPC vivo derrubado.
source=source.replace(
"const roads=[-60,0,60],blocks=[-90,-30,30,90],statics=[],trees=[],poles=[],signals=[],cars=[],npcs=[],towJobs=[],projectiles=[];",
"const roads=[-60,0,60],blocks=[-90,-30,30,90],statics=[],trees=[],poles=[],signals=[],cars=[],npcs=[],towJobs=[],projectiles=[],samuJobs=[];let activeSamuJob=null;"
);
source=source.replace(
"hit(d){if(this.hp<=0)return;this.hp=Math.max(0,this.hp-d);this.down=this.hp<=0?999:Math.max(this.down,1.25);this.g.rotation.z=Math.PI/2}",
"hit(d){if(this.hp<=0)return;this.hp=Math.max(0,this.hp-d);this.down=this.hp<=0?999:Math.max(this.down,2.5);this.g.rotation.z=Math.PI/2;if(this.hp>0&&this.hp<100)requestSamu(this)}"
);
const samuCode=\`\nconst SAMU_BASE=new THREE.Vector3(60+3.2,.03,108);\nfunction requestSamu(npc){if(!npc||npc.hp<=0||npc.samuRequested)return;npc.samuRequested=true;samuJobs.push(new SamuJob(npc))}\nclass SamuJob{\nconstructor(patient){this.patient=patient;this.state='waiting';this.timer=3;this.amb=null;this.path=[];this.i=0;this.paramedic=null;this.treat=0}\nspawn(){if(activeSamuJob&&activeSamuJob!==this)return false;activeSamuJob=this;this.amb=new Car(0xf4f4f4,SAMU_BASE.x,SAMU_BASE.z,Math.PI,false);this.amb.service='samu';this.amb.hp=160;this.amb.fuel=100;this.amb.g.add(box(1.5,.14,.35,mat(0xc93030),0,1.7,-.2));attachDriver(this.amb,0xffffff);this.path=towPath(SAMU_BASE,this.patient.g.position);this.i=0;this.state='approach';return true}\nrelease(){if(activeSamuJob===this)activeSamuJob=null}\nblocked(){if(signalAhead(this.amb))return true;const f=new THREE.Vector3(Math.sin(this.amb.g.rotation.y),0,Math.cos(this.amb.g.rotation.y));for(const c of cars){if(c===this.amb||c.removed)continue;const d=c.g.position.clone().sub(this.amb.g.position).setY(0);if(d.length()<7&&f.dot(d.clone().normalize())>.7)return true}return false}\ndriveTo(target,dt,max=5){const d=target.clone().sub(this.amb.g.position).setY(0);if(d.length()<1.5){this.amb.speed=0;return true}const a=Math.atan2(d.x,d.z),delta=Math.atan2(Math.sin(a-this.amb.g.rotation.y),Math.cos(a-this.amb.g.rotation.y));this.amb.g.rotation.y+=THREE.MathUtils.clamp(delta,-dt*.85,dt*.85);this.amb.speed=THREE.MathUtils.lerp(this.amb.speed,this.blocked()?0:max,Math.min(1,dt*2.5));this.amb.move(dt);return false}\nupdate(dt){if(this.state==='done')return;if(this.patient.hp<=0){this.cleanup();return}if(this.state==='waiting'){if(activeSamuJob&&activeSamuJob!==this)return;this.timer-=dt;if(this.timer<=0)this.spawn();return}if(!this.amb||this.amb.removed||this.amb.exploded){this.release();this.patient.samuRequested=false;this.state='done';return}if(this.state==='approach'){if(this.driveTo(this.path[this.i],dt,5)){this.i++;if(this.i>=this.path.length){this.state='deploy';this.timer=1}}return}if(this.state==='deploy'){this.amb.speed=0;this.timer-=dt;if(this.timer<=0){this.paramedic=person(0xf2f2f2,0xb98262);this.paramedic.position.copy(this.amb.g.position).add(new THREE.Vector3(1.6,.18,0));scene.add(this.paramedic);this.state='walk'}return}if(this.state==='walk'){const d=this.patient.g.position.clone().sub(this.paramedic.position).setY(0);if(d.length()<.8){this.state='treat';this.treat=4;return}d.normalize();this.paramedic.position.addScaledVector(d,dt*1.8);this.paramedic.rotation.y=Math.atan2(d.x,d.z);return}if(this.state==='treat'){this.treat-=dt;if(this.treat<=0){this.patient.hp=Math.max(this.patient.hp,70);this.patient.down=0;this.patient.g.rotation.z=0;this.patient.g.position.y=.18;this.patient.samuRequested=false;this.state='return';this.path=towPath(this.amb.g.position,SAMU_BASE);this.i=0;scene.remove(this.paramedic);this.paramedic=null}return}if(this.state==='return'){if(this.driveTo(this.path[this.i],dt,5)){this.i++;if(this.i>=this.path.length)this.cleanup()}return}}\ncleanup(){if(this.paramedic)scene.remove(this.paramedic);if(this.amb){this.amb.removed=true;scene.remove(this.amb.g)}if(this.patient)this.patient.samuRequested=false;this.release();this.state='done'}\n}\n\`;
source=source.replace("function cleanPoint(p,r=.48,ignore=null)",samuCode+"\nfunction cleanPoint(p,r=.48,ignore=null)");

// Hitbox por região: cabeça fatal, corpo derruba. Motorista dentro do carro também recebe dano.
source=source.replace(
"for(const n of npcs){if(n.hp<=0)continue;const torso=n.g.position.clone().add(new THREE.Vector3(0,1.05,0));if(torso.distanceTo(p.mesh.position)<.72){n.hit(38);hit=true;break}}if(!hit)for(const c of cars){if(c.removed)continue;if(hitsCar(c,p.mesh.position,.05)){if(!c.exploded)c.damage(10);hit=true;break}}",
"for(const n of npcs){if(n.hp<=0)continue;const head=n.g.position.clone().add(new THREE.Vector3(0,2,0)),torso=n.g.position.clone().add(new THREE.Vector3(0,1.05,0));if(head.distanceTo(p.mesh.position)<.34){n.hit(120);hit=true;break}if(torso.distanceTo(p.mesh.position)<.78){n.hit(42);hit=true;break}}if(!hit)for(const c of cars){if(c.removed)continue;if(hitsCar(c,p.mesh.position,.05)){if(c.driver&&c.driver.visible!==false&&c.driver.userData.hp>0){const lp=c.g.worldToLocal(p.mesh.position.clone());if(Math.abs(lp.x)<.72&&lp.z>-1.25&&lp.z<.55&&lp.y>.65&&lp.y<2){const headshot=lp.y>1.45;c.driver.userData.hp=Math.max(0,c.driver.userData.hp-(headshot?120:55));if(c.driver.userData.hp<=0){c.ai=false;c.speed=0;c.driver.rotation.z=Math.PI/2}}}if(!c.exploded)c.damage(10);hit=true;break}}"
);

// Guincho: chega a um ponto de alinhamento e finaliza de ré até a carcaça antes do engate.
source=source.replace(
"if(this.state==='approach'){if(this.driveTo(this.path[this.i],dt,4.3)){this.i++;if(this.i>=this.path.length){this.state='position';this.hook=5}}return}",
"if(this.state==='approach'){if(this.driveTo(this.path[this.i],dt,4.3)){this.i++;if(this.i>=this.path.length){const f=new THREE.Vector3(Math.sin(this.wreck.g.rotation.y),0,Math.cos(this.wreck.g.rotation.y));this.alignPoint=this.wreck.g.position.clone().addScaledVector(f,6.3);this.state='align'}}return}if(this.state==='align'){if(this.driveTo(this.alignPoint,dt,2.2)){this.tow.g.rotation.y=this.wreck.g.rotation.y;this.state='reverse'}return}if(this.state==='reverse'){const f=new THREE.Vector3(Math.sin(this.tow.g.rotation.y),0,Math.cos(this.tow.g.rotation.y));const d=this.wreck.g.position.clone().sub(this.tow.g.position).setY(0);if(d.length()<=4){this.tow.speed=0;this.state='position';this.hook=5;return}if(!this.obstacleAhead()){const old=this.tow.g.position.clone();this.tow.g.position.addScaledVector(f,-dt*1.1);if(carStaticHit(this.tow)||cars.some(c=>c!==this.tow&&c!==this.wreck&&!c.removed&&carsTouch(this.tow,c)))this.tow.g.position.copy(old)}return}"
);
source=source.replace(
"if(this.state==='position'){const near=this.wreck.g.position.clone().sub(this.tow.g.position).setY(0);if(near.length()>4){this.driveTo(this.wreck.g.position,dt,1.15);return}this.tow.speed=0;this.hook-=dt;",
"if(this.state==='position'){this.tow.speed=0;this.hook-=dt;"
);

// Atualiza os serviços de emergência no loop.
source=source.replace(
"for(const j of towJobs)j.update(dt);updateProjectiles(dt);",
"for(const j of towJobs)j.update(dt);for(const s of samuJobs)s.update(dt);updateProjectiles(dt);"
);
`;
if(!source.includes(marker))throw new Error('Marcador final da Beta 0.1.4 não localizado');
source=source.replace(marker,extra+'\n'+marker);
const blob=new Blob([source],{type:'text/javascript'});
await import(URL.createObjectURL(blob));
