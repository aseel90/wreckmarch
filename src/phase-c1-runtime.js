import { createRegisteredStatUpgradeChoice, createRegisteredUpgradeChoice } from './upgrades/upgrade-runtime.js?v=7';

/* WRECKMARCH — Phase C.1: landscape HUD + 8-way two-hand aim + dedicated UpgradeScene */
const W = 960;
const H = 540;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const ICON_IDS = [
  'heavy-rivets', 'overclock', 'long-barrel', 'twin-riveter', 'fleet-feet',
  'scrap-magnet', 'armor-plate', 'call-rig', 'rig-overdrive', 'twin-cannon'
];
const CATEGORY_COLORS = {
  HERO: 0xd98446,
  UTILITY: 0x4fc8d8,
  FORTRESS: 0xd4ad62,
  EVOLUTION: 0x9d6be8
};

async function getScene(timeoutMs = 9000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    const game = window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.hero && scene.scraps && scene.upgradeLevels) return scene;
    await wait(50);
  }
  throw new Error('Phase C.1: Wreckmarch scene not ready');
}

function hsl(h, s, l) {
  return Phaser.Display.Color.HSLToColor(h / 360, s / 100, l / 100).color;
}

function iconTexture(scene, id, color) {
  const key = `c1-icon-${id}`;
  if (scene.textures.exists(key)) return key;
  const g = scene.add.graphics();
  g.fillStyle(0x0b1014, 1).fillRect(0, 0, 160, 120);
  g.lineStyle(6, color, .95);
  g.strokeRoundedRect(12, 12, 136, 96, 14);
  g.lineStyle(5, color, .9);
  if (id === 'heavy-rivets') {
    g.lineBetween(35, 80, 125, 40); g.lineBetween(35, 45, 125, 80); g.fillStyle(color, 1); g.fillCircle(50, 65, 10); g.fillCircle(110, 58, 10);
  } else if (id === 'overclock') {
    g.strokeCircle(80, 60, 32); g.lineBetween(80, 60, 105, 42); g.fillStyle(color, 1); g.fillCircle(80, 60, 7);
  } else if (id === 'long-barrel') {
    g.fillStyle(color, .9).fillRoundedRect(28, 50, 104, 20, 8); g.fillStyle(0xf7e8b3, .8).fillRect(118, 54, 26, 12);
  } else if (id === 'twin-riveter') {
    g.fillStyle(color, .9).fillRoundedRect(30, 38, 95, 18, 7); g.fillRoundedRect(38, 69, 95, 18, 7);
  } else if (id === 'fleet-feet') {
    g.lineBetween(34, 82, 78, 38); g.lineBetween(70, 88, 118, 42); g.lineBetween(92, 90, 135, 60);
  } else if (id === 'scrap-magnet') {
    g.arc(80, 58, 36, Math.PI * .15, Math.PI * .85, false); g.lineBetween(45, 70, 45, 92); g.lineBetween(115, 70, 115, 92);
  } else if (id === 'armor-plate') {
    g.fillStyle(color, .7); g.fillTriangle(80, 24, 130, 48, 116, 96); g.fillTriangle(80, 24, 30, 48, 44, 96); g.fillStyle(0x0b1014, 1); g.fillCircle(80, 63, 13);
  } else if (id === 'call-rig') {
    g.fillStyle(color, .7).fillRoundedRect(34, 48, 92, 38, 10); g.fillCircle(48, 90, 13); g.fillCircle(112, 90, 13); g.lineBetween(80, 48, 104, 27);
  } else if (id === 'rig-overdrive') {
    g.strokeCircle(65, 62, 28); g.strokeCircle(105, 62, 28); g.lineBetween(80, 28, 80, 98);
  } else if (id === 'twin-cannon') {
    g.fillStyle(color, .9).fillRoundedRect(28, 40, 110, 17, 7); g.fillRoundedRect(28, 68, 110, 17, 7);
  }
  g.generateTexture(key, 160, 120);
  g.destroy();
  return key;
}

function installCardTextures(scene) {
  for (const id of ICON_IDS) iconTexture(scene, id, CATEGORY_COLORS.HERO);
}

function installAimPoses(scene) {
  scene.c1Weapon = scene.add.container(scene.hero.x, scene.hero.y).setDepth(32);
  scene.c1WeaponBody = scene.add.rectangle(0, 0, 62, 18, 0x6c7477, 1).setStrokeStyle(3, 0x23292b).setOrigin(.5);
  scene.c1WeaponTip = scene.add.rectangle(32, 0, 22, 8, 0xd39f57, 1).setOrigin(0, .5);
  scene.c1WeaponCore = scene.add.circle(-9, 0, 6, 0x55d6e3, .95);
  scene.c1Weapon.add([scene.c1WeaponBody, scene.c1WeaponTip, scene.c1WeaponCore]);
  scene.weaponSprite?.setVisible?.(false);
  scene.weaponArm?.setVisible?.(false);

  scene.weaponAim = scene.weaponAim || 0;
  const oldUpdateAim = scene.updateAim?.bind(scene);
  scene.updateAim = function() {
    oldUpdateAim?.();
    const a = this.weaponAim || 0;
    const snap = Math.round(Phaser.Math.Angle.Normalize(a) / (Math.PI / 4)) % 8;
    const q = snap * Math.PI / 4;
    this.c1Weapon.setPosition(this.hero.x + Math.cos(q) * 29, this.hero.y + 7 + Math.sin(q) * 23).setRotation(q);
    this.visualAimAngle = q;
  };
  scene.updateAim();
}

function installHud(scene) {
  scene.titleText?.setVisible?.(false);
  scene.timerText?.setVisible?.(false);
  scene.waveText?.setVisible?.(false);
  scene.hpText?.setVisible?.(false);
  scene.scrapText?.setVisible?.(false);
  scene.levelText?.setVisible?.(false);
  scene.xpFill?.setVisible?.(false);
  const top = scene.add.container(0, 0).setScrollFactor(0).setDepth(160);
  const shade = scene.add.rectangle(0, 0, W, 66, 0x060b0e, .86).setOrigin(0, 0).setStrokeStyle(0);
  const brand = scene.add.text(20, 11, 'WRECKMARCH', { fontFamily: 'Arial Black, Arial', fontSize: '19px', color: '#e4c388' });
  const stage = scene.add.text(W / 2, 12, 'WAVE 01', { fontFamily: 'Arial Black, Arial', fontSize: '13px', color: '#9da8a8' }).setOrigin(.5, 0);
  const timer = scene.add.text(W - 20, 11, '00:00', { fontFamily: 'Arial Black, Arial', fontSize: '17px', color: '#f0f0e7' }).setOrigin(1, 0);
  const hpBg = scene.add.rectangle(20, 45, 220, 8, 0x101619, .9).setOrigin(0, .5);
  const hp = scene.add.rectangle(20, 45, 220, 8, 0xcd5f43, .95).setOrigin(0, .5);
  const xpBg = scene.add.rectangle(W / 2 - 120, 45, 240, 8, 0x101619, .9).setOrigin(0, .5);
  const xp = scene.add.rectangle(W / 2 - 120, 45, 240, 8, 0x55d6e3, .95).setOrigin(0, .5);
  const scrap = scene.add.text(W - 20, 37, 'SCRAP 0/8', { fontFamily: 'Arial Black, Arial', fontSize: '10px', color: '#a7c5c5' }).setOrigin(1, 0);
  top.add([shade, brand, stage, timer, hpBg, hp, xpBg, xp, scrap]);
  scene.c1Hud = { top, stage, timer, hpBg, hp, xpBg, xp, scrap };

  const oldRefresh = scene.refreshProgressHud?.bind(scene);
  scene.refreshProgressHud = function() {
    oldRefresh?.();
    const hpR = Phaser.Math.Clamp(this.heroHp / Math.max(1, this.heroMaxHp), 0, 1);
    const xpR = Phaser.Math.Clamp(this.scrapXp / Math.max(1, this.scrapNeeded), 0, 1);
    this.c1Hud.hp.setScale(hpR, 1);
    this.c1Hud.xp.setScale(xpR, 1);
    this.c1Hud.scrap.setText(`LV ${this.level}  •  SCRAP ${this.scrapXp}/${this.scrapNeeded}`);
  };
  scene.refreshProgressHud();
}

function c1UpgradePool(scene) {
  return [
    createRegisteredStatUpgradeChoice(scene, 'heavy-rivets', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'overclock', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'long-barrel', { category: 'HERO' }),
    createRegisteredUpgradeChoice(scene, 'twin-riveter', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'fleet-feet', { category: 'UTILITY' }),
    createRegisteredStatUpgradeChoice(scene, 'scrap-magnet', { category: 'UTILITY' }),
    createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' }),
    createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' }),
    { id:'rig-overdrive', category:'FORTRESS', title:'RIG OVERDRIVE', desc:'Reserved for the future companion upgrade tree.', weight:0, available:()=>false, apply:()=>{} },
    { id:'twin-cannon', category:'FORTRESS', title:'TWIN CANNON', desc:'Reserved for the future companion upgrade tree.', weight:0, available:()=>false, apply:()=>{} }
  ];
}

function pickC1Choices(scene, count=3) {
  const available=c1UpgradePool(scene).filter(item=>item.available());
  const chosen=[];
  while(chosen.length<count&&available.length){
    const total=available.reduce((sum,item)=>sum+item.weight,0);
    let roll=Math.random()*total;
    let index=0;
    for(;index<available.length;index++){ roll-=available[index].weight; if(roll<=0) break; }
    chosen.push(available.splice(Math.min(index,available.length-1),1)[0]);
  }
  return chosen;
}

function installUpgradeScene(scene) {
  class UpgradeSceneV2 extends Phaser.Scene {
    constructor(){ super('UpgradeSceneV2'); }
    init(data){ this.payload=data||{}; this.selected=0; }
    create(){
      const gameScene=this.payload.gameScene;
      const choices=this.payload.choices||[];
      this.add.rectangle(W/2,H/2,W,H,0x03070a,.94);
      this.add.text(W/2,34,`LEVEL ${gameScene.level}`,{fontFamily:'Arial Black, Arial',fontSize:'13px',color:'#55d6e3'}).setOrigin(.5);
      this.add.text(W/2,63,'CHOOSE YOUR UPGRADE',{fontFamily:'Arial Black, Arial',fontSize:'25px',color:'#edca8f'}).setOrigin(.5);
      this.add.text(W/2,91,'BUILD THE RUN  •  CHANGE THE MACHINE',{fontFamily:'Arial Black, Arial',fontSize:'9px',color:'#718083'}).setOrigin(.5);
      const gap=24, cw=270, ch=330, start=W/2-(cw+gap);
      this.cards=[];
      choices.forEach((u,i)=>{
        const x=start+i*(cw+gap), y=310;
        const col=CATEGORY_COLORS[u.category]||CATEGORY_COLORS.HERO;
        const shadow=this.add.rectangle(x+7,y+9,cw,ch,0x000000,.4);
        const bg=this.add.rectangle(x,y,cw,ch,0x151b20,.98).setStrokeStyle(3,col,.85);
        const strip=this.add.rectangle(x,y-ch/2+7,cw,14,col,.95);
        const label=this.add.text(x-cw/2+18,y-ch/2+28,u.category,{fontFamily:'Arial Black, Arial',fontSize:'10px',color:Phaser.Display.Color.IntegerToColor(col).rgba}).setOrigin(0,.5);
        const artBg=this.add.rectangle(x,y-52,cw-28,126,0x0b1014,.95).setStrokeStyle(2,col,.4);
        const art=this.add.image(x,y-52,iconTexture(this,u.id,col)).setDisplaySize(160,120);
        const title=this.add.text(x,y+30,u.title,{fontFamily:'Arial Black, Arial',fontSize:'18px',color:'#f2f2ec',align:'center',wordWrap:{width:cw-32}}).setOrigin(.5);
        const desc=this.add.text(x,y+73,u.desc,{fontFamily:'Arial',fontSize:'13px',color:'#b9c3c3',align:'center',wordWrap:{width:cw-42},lineSpacing:2}).setOrigin(.5,0);
        const lv=gameScene.upgradeLevels[u.id]||0;
        const foot=this.add.text(x,y+ch/2-24,lv?`CURRENT  LV ${lv}`:'NEW UPGRADE',{fontFamily:'Arial Black, Arial',fontSize:'9px',color:'#7c888a'}).setOrigin(.5);
        const hit=this.add.zone(x,y,cw,ch).setInteractive({useHandCursor:true});
        hit.on('pointerover',()=>{this.selected=i;this.refresh();});
        hit.on('pointerdown',()=>this.choose(i));
        this.cards.push({bg,strip,art,col,hit});
      });
      this.input.keyboard?.on('keydown-LEFT',()=>this.move(-1));
      this.input.keyboard?.on('keydown-RIGHT',()=>this.move(1));
      this.input.keyboard?.on('keydown-ENTER',()=>this.choose(this.selected));
      this.input.keyboard?.on('keydown-ONE',()=>this.choose(0));
      this.input.keyboard?.on('keydown-TWO',()=>this.choose(1));
      this.input.keyboard?.on('keydown-THREE',()=>this.choose(2));
      this.refresh();
    }
    refresh(){ this.cards.forEach((c,i)=>{ const on=i===this.selected; c.bg.setStrokeStyle(on?5:3,c.col,on?1:.72); c.art.setScale(on?1.05:1); c.strip.setAlpha(on?1:.8); }); }
    move(d){ if(!this.cards.length)return; this.selected=(this.selected+d+this.cards.length)%this.cards.length; this.refresh(); }
    choose(i){ const u=this.payload.choices?.[i]; if(!u)return; u.apply(); this.payload.gameScene?.closeUpgradeCards?.(); }
  }
  if(!scene.game.scene.getScene('UpgradeSceneV2')) scene.game.scene.add('UpgradeSceneV2',UpgradeSceneV2,false);
}

function replaceUpgradeFlow(scene) {
  scene.openUpgradeCards=function(){
    if(this.upgradeOpen||this.gameOver)return;
    const choices=pickC1Choices(this,3);
    if(!choices.length){this.pendingLevels=Math.max(0,(this.pendingLevels||1)-1);return;}
    this.upgradeOpen=true;
    this.physics.pause();
    this.scene.launch('UpgradeSceneV2',{gameScene:this,choices});
    this.scene.bringToTop('UpgradeSceneV2');
  };
  scene.closeUpgradeCards=function(){
    this.scene.stop('UpgradeSceneV2');
    this.upgradeOpen=false;
    this.pendingLevels=Math.max(0,(this.pendingLevels||1)-1);
    if(!this.gameOver)this.physics.resume();
    this.refreshWeaponProfile?.();
    this.time.delayedCall(75,()=>{if((this.pendingLevels||0)>0&&!this.upgradeOpen)this.openUpgradeCards();});
  };
}

function upgradeUpdate(scene) {
  const old=(scene.sys?.sceneUpdate||scene.update).bind(scene);
  const updated=function(time,delta){
    old(time,delta);
    if(this.gameOver)return;
    const rt=this.runTime||0;
    this.c1Hud.timer.setText(`${String(Math.floor(rt/60)).padStart(2,'0')}:${String(Math.floor(rt%60)).padStart(2,'0')}`);
    this.c1Hud.stage.setText(`WAVE ${String(Math.floor(rt/22)+1).padStart(2,'0')}`);
  };
  scene.update=updated;
  if(scene.sys)scene.sys.sceneUpdate=updated;
}

export async function applyPhaseC1(){
  const scene=await getScene();
  installCardTextures(scene);
  installAimPoses(scene);
  installHud(scene);
  installUpgradeScene(scene);
  replaceUpgradeFlow(scene);
  upgradeUpdate(scene);
  scene.phaseC1=true;
  window.__WM_PHASE_C1__=true;
  document.documentElement.dataset.wreckmarchPhaseC1='active';
  window.__WM_LOG__?.('Phase C.1 active: landscape HUD + 8-way two-hand aim + UpgradeScene cards');
  return true;
}
