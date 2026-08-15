// Cidade Viva — Beta 0.1.3
// Carrega a base 0.1.2 e troca o antigo serviço de guincho por um veículo Car real.
const source=await fetch('./beta012.js?v=013').then(r=>r.text());
const start=source.indexOf('class TowJob{');
const end=source.indexOf('\nfunction cleanPoint',start);
if(start<0||end<0)throw new Error('Não foi possível localizar TowJob da Beta 0.1.2');
const towCode=`class TowJob{
constructor(wreck){this.wreck=wreck;this.timer=8;this.state='waiting';this.tow=null;this.path=[];this.i=0;this.hook=0;this.driver=null}
spawn(){
  this.tow=new Car(0xe0b429,TOW_BASE.x,TOW_BASE.z,0,false);
  this.tow.service='tow';this.tow.halfW=1.12;this.tow.halfL=2.45;this.tow.hp=180;this.tow.fuel=100;
  // transforma o carro normal em guincho sem tirá-lo da física comum
  this.tow.g.add(box(1.75,.16,2.5,darkMat,0,.82,-1.85));
  this.tow.g.add(box(.16,.16,2.1,lineMat,0,.97,-2.0));
  const drv=person(0x29455f,0xb47d5e);drv.scale.setScalar(.58);drv.position.set(0,.62,-.18);drv.rotation.y=Math.PI;this.tow.g.add(drv);this.driver=drv;
  this.path=towPath(TOW_BASE,this.wreck.g.position);this.i=0;this.state='approach';
}
obstacleAhead(){
  if(signalAhead(this.tow))return true;
  const f=new THREE.Vector3(Math.sin(this.tow.g.rotation.y),0,Math.cos(this.tow.g.rotation.y));
  for(const c of cars){if(c===this.tow||c===this.wreck||c.removed)continue;const d=c.g.position.clone().sub(this.tow.g.position).setY(0);if(d.length()<8&&f.dot(d.clone().normalize())>.72)return true}
  for(const n of npcs){if(n.hp<=0)continue;const d=n.g.position.clone().sub(this.tow.g.position).setY(0);if(d.length()<5&&f.dot(d.clone().normalize())>.76)return true}
  return false;
}
driveTo(target,dt,maxSpeed=4.4){
  const d=target.clone().sub(this.tow.g.position).setY(0);if(d.length()<1.35){this.tow.speed=0;return true}
  const desired=Math.atan2(d.x,d.z),delta=Math.atan2(Math.sin(desired-this.tow.g.rotation.y),Math.cos(desired-this.tow.g.rotation.y));
  this.tow.g.rotation.y+=THREE.MathUtils.clamp(delta,-dt*.82,dt*.82);
  const wanted=this.obstacleAhead()?0:maxSpeed;this.tow.speed=THREE.MathUtils.lerp(this.tow.speed,wanted,Math.min(1,dt*2.4));
  this.tow.move(dt);return false;
}
update(dt){
  if(this.state==='done')return;
  if(this.state==='waiting'){this.timer-=dt;if(this.timer<=0)this.spawn();return}
  if(!this.tow||this.tow.removed){this.state='done';return}
  if(this.state==='approach'){
    if(this.driveTo(this.path[this.i],dt,4.5)){this.i++;if(this.i>=this.path.length){this.state='position';this.hook=5}}
    return;
  }
  if(this.state==='position'){
    const near=this.wreck.g.position.clone().sub(this.tow.g.position).setY(0);
    if(near.length()>3.9){const target=this.wreck.g.position.clone();this.driveTo(target,dt,1.25);return}
    this.tow.speed=0;this.hook-=dt;
    if(this.hook<=0){this.state='return';this.path=towPath(this.tow.g.position,TOW_BASE);this.i=0}
    return;
  }
  if(this.state==='return'){
    const arrived=this.driveTo(this.path[this.i],dt,3.5);
    const back=new THREE.Vector3(-Math.sin(this.tow.g.rotation.y),0,-Math.cos(this.tow.g.rotation.y));
    this.wreck.g.position.copy(this.tow.g.position).addScaledVector(back,3.85);this.wreck.g.rotation.y=this.tow.g.rotation.y;
    if(arrived){this.i++;if(this.i>=this.path.length){this.tow.speed=0;scene.remove(this.wreck.g);this.wreck.removed=true;this.state='park';this.timer=3}}
    return;
  }
  if(this.state==='park'){
    this.timer-=dt;if(this.timer<=0){this.tow.removed=true;scene.remove(this.tow.g);this.state='done'}
  }
}
}`;
let patched=source.slice(0,start)+towCode+source.slice(end);
// evita que o player possa entrar no veículo de serviço
patched=patched.replace("function nearestParked(){return parked.filter(c=>!c.exploded&&!c.removed)","function nearestParked(){return parked.filter(c=>!c.exploded&&!c.removed&&!c.service)");
const blob=new Blob([patched],{type:'text/javascript'});
await import(URL.createObjectURL(blob));
