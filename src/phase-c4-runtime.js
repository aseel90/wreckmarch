/* WRECKMARCH Phase C.4 — permanent weapon sockets + spring Rig follow + PNG terrain */
import { C4_GROUND, C4_ROAD } from './c4-assets.js?v=1';

const wait = ms => new Promise(r => setTimeout(r, ms));
const WORLD_W = 2200, WORLD_H = 2200;
const POSES = ['gun_e.png','gun_se.png','gun_s.png','gun_sw.png','gun_w.png','gun_nw.png','gun_n.png','gun_ne.png'];

/*
  Permanent weapon contract:
  - Hero body owns its original hands / hook.
  - A weapon profile owns only the weapon sprite, grip origin, body socket and muzzle distance.
  - No generated arm / hand sprites are allowed in normal gameplay.
  - New weapons must register eight directional socket poses instead of rotating a free arm around the hero.
*/
const RIVET_SOCKETS = [
  { frame:'gun_e.png',  socket:[ 12, 10], origin:[.26,.70], max:[100,72], muzzle:[ 76,  8], depth:31 },
  { frame:'gun_se.png', socket:[ 10, 12], origin:[.27,.28], max:[ 92,88], muzzle:[ 60, 58], depth:31 },
  { frame:'gun_s.png',  socket:[  4, 14], origin:[.50,.18], max:[ 54,92], muzzle:[  2, 76], depth:31 },
  { frame:'gun_sw.png', socket:[ -9, 12], origin:[.73,.27], max:[ 92,88], muzzle:[-60, 58], depth:31 },
  { frame:'gun_w.png',  socket:[-12, 10], origin:[.74,.70], max:[100,72], muzzle:[-76,  8], depth:31 },
  { frame:'gun_nw.png', socket:[ -8,  2], origin:[.72,.72], max:[ 94,88], muzzle:[-58,-54], depth:20 },
  { frame:'gun_n.png',  socket:[  2,  1], origin:[.50,.82], max:[ 54,92], muzzle:[  2,-72], depth:20 },
  { frame:'gun_ne.png', socket:[  8,  2], origin:[.28,.72], max:[ 94,88], muzzle:[ 58,-54], depth:20 }
];

async function getScene(){
  const start=performance.now();
  while(performance.now()-start<9000){
    const game=window.Phaser?.GAMES?.find(Boolean)||window.Phaser?.GAMES?.[0];
    const s=game?.scene?.getScene?.('Wreckmarch');
    if(s?.sys?.isActive?.()&&s.hero&&s.weaponV3Gun&&s.cart) return s;
    await wait(50);
  }
  throw Error('Phase C.4 scene timeout');
}
function addDataTexture(scene,key,b64){
  if(scene.textures.exists(key)) return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{try{scene.textures.addImage(key,img);resolve()}catch(e){reject(e)}};
    img.onerror=()=>reject(Error('Failed to decode '+key));
    img.src='data:image/png;base64,'+b64;
  });
}
function fitFrame(img,maxW,maxH){
  const w=img.frame?.realWidth||img.width||1,h=img.frame?.realHeight||img.height||1;
  const z=Math.min(maxW/w,maxH/h);
  img.setDisplaySize(w*z,h*z);
}
function aimIndex(a){return Math.round(Phaser.Math.Angle.Normalize(a)/(Math.PI/4))%8}

function installWeaponSockets(s){
  [s.weaponV3ArmA,s.weaponV3ArmB,s.weaponV3HandA,s.weaponV3HandB,s.weaponArm,s.weaponRig,s.aimPose].forEach(o=>o?.setVisible?.(false));
  s.weaponSocketProfiles=s.weaponSocketProfiles||{};
  s.weaponSocketProfiles['scrap-rivet-gun']={poses:RIVET_SOCKETS};
  s.weaponSocketProfile=s.weaponSocketProfiles['scrap-rivet-gun'];
  s.weaponSprite=s.weaponV3Gun;
  s.weaponV3Gun.setVisible(true).clearTint?.();
  s.__c4AimPose=-1;
  s.__c4Muzzle=new Phaser.Math.Vector2();
  s.__c4Grip=new Phaser.Math.Vector2();

  s.updateWeaponPose=function(){
    const q=aimIndex(this.weaponAim), cfg=this.weaponSocketProfile.poses[q];
    if(q!==this.__c4AimPose){
      this.__c4AimPose=q;
      this.weaponV3Gun.setTexture('c3-atlas',cfg.frame).setCrop();
      fitFrame(this.weaponV3Gun,cfg.max[0],cfg.max[1]);
      this.weaponV3Gun.setOrigin(cfg.origin[0],cfg.origin[1]);
    }
    const recoil=this.weaponV3Recoil||0;
    const a=q*Math.PI/4,u=new Phaser.Math.Vector2(Math.cos(a),Math.sin(a));
    const gx=this.hero.x+cfg.socket[0]-u.x*recoil*4;
    const gy=this.hero.y+cfg.socket[1]-u.y*recoil*4;
    this.__c4Grip.set(gx,gy);
    this.weaponV3Gun.setPosition(gx,gy).setDepth(cfg.depth);
    this.__c4Muzzle.set(this.hero.x+cfg.muzzle[0],this.hero.y+cfg.muzzle[1]);
    this.visualAimAngle=a;
    this.weaponV3Recoil*=.70;
  };
  s.getWeaponMuzzle=function(spread=0){
    if(Math.abs(spread)<.0001) return this.__c4Muzzle.clone();
    const q=this.__c4AimPose>=0?this.__c4AimPose:aimIndex(this.weaponAim),a=q*Math.PI/4+spread;
    return new Phaser.Math.Vector2(this.hero.x+Math.cos(a)*76,this.hero.y+8+Math.sin(a)*76);
  };
  s.updateWeaponPose();
}

function clearAngularRoads(s){
  for(const o of [...s.children.list]){
    if(o?.type==='Graphics' && (o.depth??0)<=-2) o.destroy();
    else if(o?.texture?.key==='b1-ground-a'||o?.texture?.key==='b1-ground-b') o.setVisible(false);
  }
}
function addRoadSpline(s,points,name){
  const curve=new Phaser.Curves.Spline(points);
  const pts=curve.getSpacedPoints(34);
  const segments=[];
  for(let i=0;i<pts.length-1;i++){
    const a=pts[i],b=pts[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
    const im=s.add.image((a.x+b.x)/2,(a.y+b.y)/2,'c4-road').setDepth(-8).setName(name);
    im.setDisplaySize(len+14,74).setRotation(Math.atan2(dy,dx)).setAlpha(.96);
    segments.push(im);
  }
  return segments;
}
function buildTerrain(s){
  clearAngularRoads(s);
  s.__c4Terrain?.forEach?.(o=>o?.destroy?.());
  s.__c4Terrain=[];
  const base=s.add.tileSprite(WORLD_W/2,WORLD_H/2,WORLD_W,WORLD_H,'c4-ground').setDepth(-10).setName('c4-ground-base');
  const wash=s.add.tileSprite(WORLD_W/2,WORLD_H/2,WORLD_W,WORLD_H,'c4-ground').setDepth(-9).setName('c4-ground-wash').setAlpha(.16);
  wash.tilePositionX=127; wash.tilePositionY=91; wash.setRotation(Math.PI);
  s.__c4Terrain.push(base,wash);
  s.__c4RoadSegments=[
    ...addRoadSpline(s,[new Phaser.Math.Vector2(-100,470),new Phaser.Math.Vector2(370,570),new Phaser.Math.Vector2(760,520),new Phaser.Math.Vector2(1110,650),new Phaser.Math.Vector2(1540,750),new Phaser.Math.Vector2(2300,680)],'c4-road-a'),
    ...addRoadSpline(s,[new Phaser.Math.Vector2(-130,1730),new Phaser.Math.Vector2(380,1530),new Phaser.Math.Vector2(760,1600),new Phaser.Math.Vector2(1140,1490),new Phaser.Math.Vector2(1560,1325),new Phaser.Math.Vector2(2300,1220)],'c4-road-b')
  ];
  s.__c4Terrain.push(...s.__c4RoadSegments);
  for(let i=0;i<34;i++){
    const d=s.add.ellipse(Phaser.Math.Between(60,WORLD_W-60),Phaser.Math.Between(80,WORLD_H-80),Phaser.Math.Between(35,110),Phaser.Math.Between(18,54),0x17130f,Phaser.Math.FloatBetween(.05,.13)).setDepth(-7);
    s.__c4Terrain.push(d);
  }
}

function ensureRigState(s){
  if(s.__c4RigState) return s.__c4RigState;
  return s.__c4RigState={pos:new Phaser.Math.Vector2(s.cart.x,s.cart.y),vel:new Phaser.Math.Vector2(),dir:new Phaser.Math.Vector2(1,0),goal:new Phaser.Math.Vector2(),travel:0,dustAt:0,lane:1};
}
function spawnDust(s,state,speed){
  if(!s.textures.exists('c3-atlas')||speed<55)return;
  const name=speed>165?'rig_dust_big.png':'rig_dust_med.png';
  const p=s.add.image(s.cart.x-state.dir.x*72+Phaser.Math.Between(-5,5),s.cart.y-state.dir.y*44+28,'c3-atlas',name).setDepth(8).setAlpha(.34);
  fitFrame(p,speed>165?76:56,42);p.setRotation(Math.atan2(state.dir.y,state.dir.x)+Math.PI);
  s.tweens.add({targets:p,alpha:0,scaleX:p.scaleX*1.55,scaleY:p.scaleY*1.55,x:p.x-state.dir.x*24,y:p.y-state.dir.y*16,duration:420,ease:'Quad.Out',onComplete:()=>p.destroy()});
}
function rigSpringMove(s,time,delta){
  if(!s.rigSummoned||!s.cart?.visible) return;
  const st=ensureRigState(s),dt=Math.min(.035,Math.max(.001,delta/1000));
  if(s.move?.lengthSq?.()>.06){const d=s.move.clone().normalize();st.dir.lerp(d,1-Math.exp(-4.2*dt));if(st.dir.lengthSq()>.001) st.dir.normalize();}
  const side=new Phaser.Math.Vector2(-st.dir.y,st.dir.x);
  st.goal.set(s.hero.x-st.dir.x*176+side.x*44*st.lane,s.hero.y-st.dir.y*145+side.y*44*st.lane+20);
  const err=st.goal.clone().subtract(st.pos),dist=err.length();
  const omega=dist>360?4.9:3.8, accel=err.scale(omega*omega).subtract(st.vel.clone().scale(2*omega));
  const maxA=dist>360?620:430,al=accel.length(); if(al>maxA) accel.scale(maxA/al);
  st.vel.add(accel.scale(dt));
  const maxV=dist>430?275:dist>260?225:190,vl=st.vel.length(); if(vl>maxV) st.vel.scale(maxV/vl);
  if(dist<32) st.vel.scale(Math.pow(.12,dt));
  const step=st.vel.clone().scale(dt); st.pos.add(step); st.travel+=step.length();
  s.cart.setPosition(st.pos.x,st.pos.y);
  const speed=st.vel.length(),motion=Phaser.Math.Clamp(speed/210,0,1);
  s.cart.rotation=Phaser.Math.Linear(s.cart.rotation,Phaser.Math.Clamp(st.vel.x/240*.024,-.024,.024),1-Math.exp(-4.5*dt));
  const spin=st.travel/15;s.cartWheels?.forEach((w,i)=>w.setRotation((i<2?-1:1)*spin));
  const suspension=Math.sin(st.travel*.085)*1.45*motion + Math.sin(time*.008)*.45*motion;
  if(s.cartBody) s.cartBody.y=(s.__c3RigBaseBodyY??-6)+suspension;
  if(s.__c3Turret) s.__c3Turret.y=(s.__c3RigBaseTurretY??-32)+suspension*.55;
  if(speed>60&&time>st.dustAt+(speed>170?110:165)){st.dustAt=time;spawnDust(s,st,speed)}
  const target=s.findNearestEnemy(s.cart.x,s.cart.y,560);if(!target||!s.__c3Turret) return;
  const wa=Phaser.Math.Angle.Between(s.cart.x+20,s.cart.y-25,target.x,target.y),native=-.79,local=wa-s.cart.rotation-native;
  s.__c3Turret.rotation=Phaser.Math.Angle.RotateTo(s.__c3Turret.rotation,local,1.85*dt);
  const aimed=s.__c3Turret.rotation+s.cart.rotation+native;
  if(Math.abs(Phaser.Math.Angle.Wrap(wa-aimed))>.25||time<s.lastRigShot+s.rigFireDelay) return;
  s.lastRigShot=time;
  (s.rigShots>1?[-.055,.055]:[0]).forEach(sp=>{const a=wa+sp,x=s.cart.x+20+Math.cos(a)*61,y=s.cart.y-25+Math.sin(a)*61,b=s.bullets.create(x,y,'bullet').setDepth(30).setScale(.66).setTint(0x66dce9);b.setCircle(8,2,2);b.damage=s.primaryWeapon.damage*s.rigDamageScale;b.life=1100;b.prevX=x;b.prevY=y;b.setVelocity(Math.cos(a)*680,Math.sin(a)*680);});
}

function debugVisuals(s){if(!window.__WM_DEBUG__) return;s.__c4Debug=s.add.graphics().setDepth(1000);s.__c4DebugText=s.add.text(12,74,'SOCKET DEBUG',{fontFamily:'monospace',fontSize:'10px',color:'#73ff8d',backgroundColor:'#061109'}).setScrollFactor(0).setDepth(1001);}
function updateDebug(s){const g=s.__c4Debug;if(!g)return;g.clear();g.lineStyle(2,0x65ff83,.9);g.strokeCircle(s.__c4Grip.x,s.__c4Grip.y,5);g.lineStyle(2,0xffcb58,.9);g.strokeCircle(s.__c4Muzzle.x,s.__c4Muzzle.y,5);g.lineBetween(s.__c4Grip.x,s.__c4Grip.y,s.__c4Muzzle.x,s.__c4Muzzle.y);if(s.__c4RigState&&s.rigSummoned){g.lineStyle(2,0x62d8ff,.8);g.strokeCircle(s.__c4RigState.goal.x,s.__c4RigState.goal.y,11);g.lineBetween(s.cart.x,s.cart.y,s.__c4RigState.goal.x,s.__c4RigState.goal.y)}}
function installLoop(s){const old=(s.sys?.sceneUpdate||s.update).bind(s);const up=function(t,d){const rig=!!this.rigSummoned;if(rig)this.rigSummoned=false;old(t,d);if(rig)this.rigSummoned=true;this.updateWeaponPose?.();if(!this.gameOver&&!this.upgradeOpen) rigSpringMove(this,t,d);updateDebug(this);};s.update=up;if(s.sys)s.sys.sceneUpdate=up;}
function selfTest(s){
  if(new URLSearchParams(location.search).get('autotest')!=='1')return;
  const checks={sockets:!!(s.weaponSocketProfile&&s.__c4Grip&&s.__c4Muzzle),noThirdHand:[s.weaponV3ArmA,s.weaponV3ArmB,s.weaponV3HandA,s.weaponV3HandB].every(o=>!o||o.visible===false),ground:s.textures.exists('c4-ground')&&!!s.children.list.find(o=>o?.name==='c4-ground-base'),roads:s.textures.exists('c4-road')&&(s.__c4RoadSegments?.length||0)>30,noAngularRoadGraphics:!s.children.list.some(o=>o?.type==='Graphics'&&(o.depth??0)<=-2)};
  const save={r:s.rigSummoned,v:s.cart.visible,x:s.cart.x,y:s.cart.y,state:s.__c4RigState,mx:s.move?.x||0,my:s.move?.y||0};let smooth=false,wheels=false,approach=false;
  try{s.rigSummoned=true;s.cart.setVisible(true);s.__c4RigState={pos:new Phaser.Math.Vector2(s.hero.x-360,s.hero.y+140),vel:new Phaser.Math.Vector2(),dir:new Phaser.Math.Vector2(1,0),goal:new Phaser.Math.Vector2(),travel:0,dustAt:0,lane:1};s.cart.setPosition(s.__c4RigState.pos.x,s.__c4RigState.pos.y);s.move?.set?.(1,0);const startDist=Phaser.Math.Distance.Between(s.cart.x,s.cart.y,s.hero.x,s.hero.y),steps=[];let lastX=s.cart.x,lastY=s.cart.y;for(let i=0;i<45;i++){rigSpringMove(s,1000+i*16,16);steps.push(Math.hypot(s.cart.x-lastX,s.cart.y-lastY));lastX=s.cart.x;lastY=s.cart.y}const endDist=Phaser.Math.Distance.Between(s.cart.x,s.cart.y,s.hero.x,s.hero.y);approach=endDist<startDist;smooth=Math.max(...steps)<8&&steps[4]<steps[20]+.2;wheels=s.cartWheels?.some(w=>Math.abs(w.rotation)>.05);}finally{s.rigSummoned=save.r;s.cart.setVisible(save.v).setPosition(save.x,save.y);s.__c4RigState=save.state;s.move?.set?.(save.mx,save.my);}
  checks.rigSpring=smooth&&approach;checks.wheels=wheels;const ok=Object.values(checks).every(Boolean),detail=Object.entries(checks).map(([k,v])=>`${k}=${v?'ok':'FAIL'}`).join(' ');window.__WM_C4_SELF_TEST__={ok,...checks};document.documentElement.dataset.wreckmarchC4SelfTest=ok?'passed':'failed';window.__WM_LOG__?.(`C4 browser self-test ${ok?'PASSED':'FAILED'}: ${detail}`);if(!ok)throw Error('Phase C.4 self-test failed: '+detail);
}

export async function applyPhaseC4(){const s=await getScene();await Promise.all([addDataTexture(s,'c4-ground',C4_GROUND),addDataTexture(s,'c4-road',C4_ROAD)]);buildTerrain(s);installWeaponSockets(s);debugVisuals(s);installLoop(s);window.__WM_PHASE_C4__=true;document.documentElement.dataset.wreckmarchPhaseC4='active';window.__WM_LOG__?.('Phase C.4 active: permanent weapon sockets + spring Rig follow + PNG terrain roads');selfTest(s);return true;}
