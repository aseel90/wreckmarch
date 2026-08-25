import { C3_ATLAS_1 } from './c3-atlas-1.js?v=4';
import { C3_ATLAS_2 } from './c3-atlas-2.js?v=4';
import { C3_ATLAS_3 } from './c3-atlas-3.js?v=4';
import { C3_ATLAS_4 } from './c3-atlas-4.js?v=4';
import { C3_ATLAS_5 } from './c3-atlas-5.js?v=4';
import { C3_ATLAS_6 } from './c3-atlas-6.js?v=4';
import { C3_ATLAS_7 } from './c3-atlas-7.js?v=4';
import { C3_ATLAS_8 } from './c3-atlas-8.js?v=4';

const C3_ATLAS = C3_ATLAS_1 + C3_ATLAS_2 + C3_ATLAS_3 + C3_ATLAS_4 + C3_ATLAS_5 + C3_ATLAS_6 + C3_ATLAS_7 + C3_ATLAS_8;
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const FRAMES = {
  'wreck_c.png': { x: 2, y: 2, w: 107, h: 95 },
  'wreck_d.png': { x: 111, y: 2, w: 112, h: 95 },
  'wreck_b.png': { x: 226, y: 2, w: 120, h: 88 },
  'wreck_a.png': { x: 348, y: 2, w: 120, h: 81 },
  'gun_se.png': { x: 2, y: 99, w: 72, h: 80 },
  'gun_s.png': { x: 76, y: 99, w: 38, h: 80 },
  'gun_n.png': { x: 115, y: 99, w: 36, h: 80 },
  'gun_sw.png': { x: 152, y: 99, w: 74, h: 80 },
  'rig_body.png': { x: 228, y: 99, w: 140, h: 76 },
  'gun_nw.png': { x: 370, y: 99, w: 80, h: 76 },
  'gun_ne.png': { x: 2, y: 181, w: 80, h: 76 },
  'rig_turret.png': { x: 84, y: 181, w: 85, h: 74 },
  'icon_call-rig.png': { x: 171, y: 181, w: 87, h: 68 },
  'icon_twin-cannon.png': { x: 260, y: 181, w: 88, h: 68 },
  'icon_overclock.png': { x: 350, y: 181, w: 84, h: 68 },
  'icon_long-barrel.png': { x: 2, y: 258, w: 87, h: 68 },
  'icon_heavy-rivets.png': { x: 91, y: 258, w: 80, h: 68 },
  'icon_rig-overdrive.png': { x: 173, y: 258, w: 87, h: 68 },
  'icon_twin-riveter.png': { x: 262, y: 258, w: 88, h: 68 },
  'icon_armor-plate.png': { x: 352, y: 258, w: 76, h: 68 },
  'icon_scrap-magnet.png': { x: 2, y: 328, w: 90, h: 67 },
  'icon_fleet-feet.png': { x: 94, y: 328, w: 90, h: 64 },
  'rig_wheel_side.png': { x: 186, y: 328, w: 43, h: 48 },
  'rig_wheel.png': { x: 231, y: 328, w: 48, h: 47 },
  'gun_w.png': { x: 281, y: 328, w: 80, h: 45 },
  'rig_dust_big.png': { x: 363, y: 328, w: 90, h: 45 },
  'rig_dust_med.png': { x: 2, y: 397, w: 66, h: 45 },
  'gun_e.png': { x: 70, y: 397, w: 80, h: 42 },
  'rig_shadow.png': { x: 152, y: 397, w: 90, h: 32 }
};

async function getScene(timeoutMs = 10000) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const game = window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.hero) return scene;
    await wait(50);
  }
  throw new Error('Timed out waiting for Wreckmarch scene for Phase C.3');
}

async function installAtlas(scene) {
  if (scene.textures.exists('c3-atlas')) return;
  const img = new Image();
  img.decoding = 'async';
  img.src = `data:image/png;base64,${C3_ATLAS}`;
  await img.decode();
  scene.textures.addImage('c3-atlas', img);
}

function crop(image, frameName) {
  const f = FRAMES[frameName];
  image.setCrop(f.x, f.y, f.w, f.h);
  return image;
}

function pickNearestAimFrame(angle) {
  const a = Phaser.Math.Angle.Normalize(angle);
  const index = Math.round(a / (Math.PI / 4)) % 8;
  return ['gun_e.png','gun_se.png','gun_s.png','gun_sw.png','gun_w.png','gun_nw.png','gun_n.png','gun_ne.png'][index];
}

function installExclusiveWeapon(scene) {
  scene.weaponV2Container?.setVisible?.(false);
  scene.weaponV3ArmA?.destroy?.();
  scene.weaponV3ArmB?.destroy?.();
  scene.weaponV3HandA?.destroy?.();
  scene.weaponV3HandB?.destroy?.();
  scene.weaponV3Gun?.destroy?.();

  scene.weaponV3ArmA = scene.add.rectangle(scene.hero.x, scene.hero.y, 28, 8, 0x8a6548, 1)
    .setOrigin(0, .5).setStrokeStyle(2, 0x1a1716, 1).setDepth(26);
  scene.weaponV3ArmB = scene.add.rectangle(scene.hero.x, scene.hero.y, 28, 8, 0x8a6548, 1)
    .setOrigin(0, .5).setStrokeStyle(2, 0x1a1716, 1).setDepth(27);
  scene.weaponV3HandA = scene.add.circle(scene.hero.x, scene.hero.y, 5, 0xd99b6c, 1)
    .setStrokeStyle(2, 0x241714, 1).setDepth(30);
  scene.weaponV3HandB = scene.add.circle(scene.hero.x, scene.hero.y, 5, 0xd99b6c, 1)
    .setStrokeStyle(2, 0x241714, 1).setDepth(30);
  scene.weaponV3Gun = crop(scene.add.image(scene.hero.x, scene.hero.y, 'c3-atlas'), 'gun_e.png')
    .setDepth(29).setDisplaySize(74, 74);
  scene.weaponV3Recoil = 0;
  scene.currentAimFrame = '';

  scene.updateWeaponPose = function() {
    const frameName = pickNearestAimFrame(this.weaponAim);
    if (frameName !== this.currentAimFrame) {
      this.currentAimFrame = frameName;
      crop(this.weaponV3Gun, frameName);
    }
    const discrete = Math.round(Phaser.Math.Angle.Normalize(this.weaponAim) / (Math.PI / 4)) * (Math.PI / 4);
    const dir = new Phaser.Math.Vector2(Math.cos(discrete), Math.sin(discrete));
    const perp = new Phaser.Math.Vector2(-dir.y, dir.x);
    const recoil = this.weaponV3Recoil || 0;

    const shoulderA = new Phaser.Math.Vector2(this.hero.x + perp.x * 8, this.hero.y + 7 + perp.y * 3);
    const shoulderB = new Phaser.Math.Vector2(this.hero.x - perp.x * 7, this.hero.y + 7 - perp.y * 3);
    const gripA = new Phaser.Math.Vector2(this.hero.x + dir.x * (18 - recoil * 4) + perp.x * 4, this.hero.y + 10 + dir.y * (15 - recoil * 4) + perp.y * 4);
    const gripB = new Phaser.Math.Vector2(this.hero.x + dir.x * (34 - recoil * 5) - perp.x * 2, this.hero.y + 9 + dir.y * (26 - recoil * 4) - perp.y * 2);
    const center = new Phaser.Math.Vector2(this.hero.x + dir.x * (30 - recoil * 5), this.hero.y + 8 + dir.y * (23 - recoil * 4));

    const arm = (r, s, e) => {
      const dx=e.x-s.x, dy=e.y-s.y;
      r.setPosition(s.x,s.y).setDisplaySize(Math.max(2,Math.hypot(dx,dy)),8).setRotation(Math.atan2(dy,dx));
    };
    arm(this.weaponV3ArmA, shoulderA, gripA); arm(this.weaponV3ArmB, shoulderB, gripB);
    this.weaponV3HandA.setPosition(gripA.x, gripA.y); this.weaponV3HandB.setPosition(gripB.x, gripB.y);
    this.weaponV3Gun.setPosition(center.x, center.y).setDisplaySize(74,74);

    const behind = discrete > Math.PI && discrete < Math.PI * 2;
    this.weaponV3ArmA.setDepth(behind?17:27); this.weaponV3ArmB.setDepth(behind?18:28);
    this.weaponV3Gun.setDepth(behind?19:29); this.weaponV3HandA.setDepth(behind?20:30); this.weaponV3HandB.setDepth(behind?20:30);
    this.visualAimAngle = discrete;
    this.weaponV3Recoil *= .72;
  };

  scene.getWeaponMuzzle = function(spread = 0) {
    const a = (this.visualAimAngle ?? this.weaponAim) + spread;
    return new Phaser.Math.Vector2(this.hero.x + Math.cos(a) * 59, this.hero.y + 8 + Math.sin(a) * 52);
  };

  scene.updateWeaponPose();
}

function installRigVisual(scene) {
  const originalSpawn = scene.spawnRig.bind(scene);
  scene.spawnRig = function() {
    if (this.rigSummoned) return;
    originalSpawn();
    this.rigSprite?.setVisible?.(false);
    this.rig?.setVisible?.(false);
    this.cartContainer?.setVisible?.(true);
    this.cartContainer?.setDepth?.(17);
    this.cartShadow?.destroy?.(); this.cartBody?.destroy?.(); this.cartWheels?.forEach(w=>w?.destroy?.()); this.cartWheels=[];

    this.cartShadow = crop(this.add.image(0, 26, 'c3-atlas'),'rig_shadow.png').setDisplaySize(186,54).setAlpha(.44);
    this.cartBody = crop(this.add.image(0, -2, 'c3-atlas'),'rig_body.png').setDisplaySize(180,98);
    this.cartWheels = [-53,-18,20,55].map((x,i)=>crop(this.add.image(x, 30, 'c3-atlas'),'rig_wheel.png').setDisplaySize(37,37));
    this.__c3Turret = crop(this.add.image(25,-31,'c3-atlas'),'rig_turret.png').setDisplaySize(82,72);
    this.cartContainer.removeAll(true);
    this.cartContainer.add([this.cartShadow,...this.cartWheels,this.cartBody,this.__c3Turret]);
    this.cartContainer.setPosition(this.hero.x-125,this.hero.y+75);
    this.__c3RigVel = new Phaser.Math.Vector2();
    this.__c3RigFacing = 0;
    this.__c3RigWheelSpin = 0;
    this.__c3RigDustClock = 0;
    this.__c3RigTargetDistance = 126;
    this.__c3RigActualMaxSpeed = 330;
    this.__c3RigAcceleration = 720;
    this.__c3RigDeceleration = 840;
  };
}

function installRigMotion(scene) {
  const oldUpdate = scene.update.bind(scene);
  scene.update = function(time, delta) {
    oldUpdate(time, delta);
    if (!this.rigSummoned || !this.cartContainer || !this.__c3RigVel) return;
    const dt = Math.min(.04, delta / 1000);
    const hv = this.heroVelocity || new Phaser.Math.Vector2();
    let heading = hv.lengthSq() > 80 ? hv.clone().normalize() : new Phaser.Math.Vector2(Math.cos(this.__c3RigFacing||0),Math.sin(this.__c3RigFacing||0));
    const desired = new Phaser.Math.Vector2(this.hero.x - heading.x * this.__c3RigTargetDistance, this.hero.y - heading.y * this.__c3RigTargetDistance + 30);
    const to = desired.subtract(new Phaser.Math.Vector2(this.cartContainer.x,this.cartContainer.y));
    const d = to.length();
    const dir = d > 2 ? to.normalize() : new Phaser.Math.Vector2();
    const desiredSpeed = Phaser.Math.Clamp((d - 24) * 2.1, 0, this.__c3RigActualMaxSpeed);
    const wanted = dir.scale(desiredSpeed);
    const diff = wanted.clone().subtract(this.__c3RigVel);
    const accel = desiredSpeed > this.__c3RigVel.length() ? this.__c3RigAcceleration : this.__c3RigDeceleration;
    if (diff.length() > accel*dt) diff.setLength(accel*dt);
    this.__c3RigVel.add(diff);
    if (d < 30) this.__c3RigVel.scale(Math.pow(.1,dt));
    this.cartContainer.x += this.__c3RigVel.x*dt; this.cartContainer.y += this.__c3RigVel.y*dt;
    const speed=this.__c3RigVel.length();
    if(speed>6){const target=Math.atan2(this.__c3RigVel.y,this.__c3RigVel.x);this.__c3RigFacing=Phaser.Math.Angle.RotateTo(this.__c3RigFacing,target,2.5*dt)}
    this.__c3RigWheelSpin += speed*dt*.095;
    this.cartWheels.forEach((w,i)=>{w.rotation=this.__c3RigWheelSpin*(i<2?1:-1)});
    const suspension=Math.sin(time*.008)*Math.min(2.2,speed/100);
    this.cartBody.y=-2+suspension; this.__c3Turret.y=-31+suspension*.55;
    if(speed>90){this.__c3RigDustClock-=delta;if(this.__c3RigDustClock<=0){this.__c3RigDustClock=Phaser.Math.Between(100,170);const dust=crop(this.add.image(this.cartContainer.x-45,this.cartContainer.y+32,'c3-atlas'),speed>190?'rig_dust_big.png':'rig_dust_med.png').setDepth(13).setDisplaySize(speed>190?75:54,38).setAlpha(.56);dust.setRotation(Phaser.Math.FloatBetween(-.14,.14));this.tweens.add({targets:dust,alpha:0,scaleX:1.3,scaleY:1.3,duration:500,onComplete:()=>dust.destroy()})}}
    const target=this.findNearestEnemy?.(this.cartContainer.x,this.cartContainer.y,700);if(target){const desiredA=Phaser.Math.Angle.Between(this.cartContainer.x+24,this.cartContainer.y-30,target.x,target.y);this.__c3Turret.rotation=Phaser.Math.Angle.RotateTo(this.__c3Turret.rotation,desiredA,.04)}
  };
}

function installCrowdSeparation(scene) {
  scene.__c3EnemyCap = 62;
  const originalSpawnWave = scene.spawnWave?.bind(scene);
  if (originalSpawnWave) scene.spawnWave = function() {
    const alive = this.enemies?.countActive?.(true) || 0;
    if (alive >= this.__c3EnemyCap) return;
    originalSpawnWave();
    let excess=(this.enemies?.countActive?.(true)||0)-this.__c3EnemyCap;if(excess>0){for(const e of this.enemies.getChildren()){if(excess--<=0)break;if(e.active)e.destroy()}}
  };
  const previousUpdateEnemies=scene.updateEnemies?.bind(scene);
  if(previousUpdateEnemies)scene.updateEnemies=function(time,delta){previousUpdateEnemies(time,delta);const list=this.enemies.getChildren().filter(e=>e.active);const cell=68,bins=new Map();for(const e of list){const k=`${Math.floor(e.x/cell)},${Math.floor(e.y/cell)}`;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(e)}for(const group of bins.values()){for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){const a=group[i],b=group[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;if(d2>1&&d2<1600){const d=Math.sqrt(d2),push=(40-d)*.035;a.x+=dx/d*push;a.y+=dy/d*push;b.x-=dx/d*push;b.y-=dy/d*push}}}};
}

function installCardArt(scene) {
  const up=scene.game.scene.getScene('UpgradeSceneV3'); if(!up)return;
  const oldCard=up.card.bind(up);
  up.card=function(x,y,w,h,u,i){oldCard(x,y,w,h,u,i);const card=this.cards[this.cards.length-1];if(!card)return;card.a?.destroy?.();const f=`icon_${u.id}.png`,art=crop(this.add.image(0,-h*.16,'c3-atlas'),f).setDisplaySize(Math.min(w*.7,165),Math.min(h*.38,135));card.g.addAt(art,5);card.a=art};
}

function installWreckArt(scene) {
  const frames=['wreck_a.png','wreck_b.png','wreck_c.png','wreck_d.png'];
  [[370,610,-.2],[1610,500,.16],[1710,1540,-.18],[520,1750,.22]].forEach(([x,y,r],i)=>{const f=frames[i%frames.length],p=crop(scene.add.image(x,y,'c3-atlas'),f).setDepth(3).setRotation(r);p.setDisplaySize(i%2?145:132,i%2?105:100)});
}

export async function applyPhaseC3(){
  const scene=await getScene(); await installAtlas(scene); installExclusiveWeapon(scene); installRigVisual(scene); installRigMotion(scene); installCrowdSeparation(scene); installCardArt(scene); installWreckArt(scene);
  scene.cameras.main.setZoom(Math.min(scene.cameras.main.zoom,.86));
  window.__WM_PHASE_C3__=true;document.documentElement.dataset.wreckmarchC3='active';window.__WM_LOG__?.('Phase C.3 active: exclusive PNG art + smooth Rig motion + rotating wheels + crowd separation');
  if(new URLSearchParams(location.search).get('autotest')==='1'){
    const checks={atlas:scene.textures.exists('c3-atlas'),weapon:!!scene.weaponV3Gun&&scene.weaponV3Gun.displayWidth>60&&!!scene.weaponV3ArmA&&!!scene.weaponV3ArmB,rigParts:false,cards:!!scene.game.scene.getScene('UpgradeSceneV3')?.card,wrecks:scene.children.list.some(o=>o.texture?.key==='c3-atlas'&&o.depth===3),crowd:scene.__c3EnemyCap===62,rigMotion:false,wheels:false};
    if(!scene.rigSummoned)scene.spawnRig();checks.rigParts=!!scene.cartBody&&scene.cartWheels?.length===4&&!!scene.__c3Turret&&!!scene.cartShadow;
    const beforeX=scene.cartContainer.x,beforeY=scene.cartContainer.y,beforeR=scene.cartWheels?.[0]?.rotation||0;scene.__c3RigVel.set(160,25);for(let i=0;i<10;i++)scene.update(performance.now()+i*16,16);checks.rigMotion=Math.hypot(scene.cartContainer.x-beforeX,scene.cartContainer.y-beforeY)>2;checks.wheels=Math.abs((scene.cartWheels?.[0]?.rotation||0)-beforeR)>.01;
    const ok=Object.values(checks).every(Boolean);window.__WM_C3_SELF_TEST__={ok,...checks};document.documentElement.dataset.wreckmarchC3SelfTest=ok?'passed':'failed';window.__WM_LOG__?.(`C3 browser self-test ${ok?'PASSED':'FAILED'}: `+Object.entries(checks).map(([k,v])=>`${k}=${v?'ok':'FAIL'}`).join(' '));if(!ok)throw new Error('Phase C.3 browser self-test failed');
  }
}
