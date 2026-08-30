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
    if (scene?.sys?.isActive?.() && scene.hero && scene.openUpgradeCards) return scene;
    await wait(60);
  }
  throw new Error('Phase C.1: scene timeout');
}

function createIconTexture(scene, id, index) {
  const key = `c1-icon-${id}`;
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ add: false });
  const color = [0xd98446,0xf0b45d,0xb6d9e0,0x8fc6d6,0x6bc6a5,0x55c6d8,0x9cabb4,0xd4ad62,0xd4ad62,0xd4ad62][index % 10];
  g.fillStyle(0x10171d, 1); g.fillRoundedRect(0, 0, 190, 120, 16); g.lineStyle(5, color, .95); g.strokeRoundedRect(4, 4, 182, 112, 14);
  g.lineStyle(9, color, .92);
  const cx=95,cy=59;
  switch(index){
    case 0: g.beginPath();g.moveTo(40,78);g.lineTo(142,43);g.strokePath();g.fillStyle(color,1);g.fillCircle(145,42,13);g.fillRect(53,63,55,10);break;
    case 1: for(let i=0;i<3;i++){g.beginPath();g.moveTo(47+i*25,84);g.lineTo(100+i*21,37);g.strokePath();}break;
    case 2: g.beginPath();g.moveTo(37,77);g.lineTo(147,42);g.strokePath();g.fillStyle(color,1);g.fillTriangle(146,42,121,31,128,57);break;
    case 3: g.beginPath();g.moveTo(38,80);g.lineTo(148,40);g.strokePath();g.beginPath();g.moveTo(45,97);g.lineTo(155,57);g.strokePath();break;
    case 4: g.fillStyle(color,1);g.fillTriangle(47,88,96,27,105,93);g.fillTriangle(92,91,141,31,149,96);break;
    case 5: g.fillStyle(color,1);g.fillCircle(cx,cy,15);g.lineStyle(5,color,.8);for(let a=0;a<6;a++){const ang=a*Math.PI/3;g.beginPath();g.moveTo(cx+Math.cos(ang)*25,cy+Math.sin(ang)*25);g.lineTo(cx+Math.cos(ang)*55,cy+Math.sin(ang)*55);g.strokePath();}break;
    case 6: g.fillStyle(color,1);g.fillRoundedRect(58,31,74,57,10);g.fillStyle(0x10171d,1);g.fillRoundedRect(73,46,44,27,6);break;
    case 7: g.fillStyle(color,1);g.fillRoundedRect(41,45,108,44,12);g.fillCircle(63,91,19);g.fillCircle(128,91,19);g.fillStyle(0x10171d,1);g.fillCircle(63,91,8);g.fillCircle(128,91,8);break;
    case 8: g.fillStyle(color,1);g.fillRoundedRect(50,43,92,46,10);g.fillStyle(0x10171d,1);g.fillRect(65,51,45,30);g.lineStyle(6,color,1);g.beginPath();g.moveTo(109,59);g.lineTo(158,35);g.strokePath();break;
    default:g.fillStyle(color,1);g.fillRoundedRect(44,47,99,38,10);g.lineStyle(7,color,1);g.beginPath();g.moveTo(102,64);g.lineTo(160,44);g.strokePath();g.beginPath();g.moveTo(102,69);g.lineTo(160,77);g.strokePath();
  }
  g.generateTexture(key,190,120);g.destroy();return key;
}

function installLandscapeHud(scene) {
  scene.scale.resize(W, H);
  scene.cameras.main.setViewport(0, 0, W, H).setSize(W, H).setZoom(.88);
  scene.cameras.main.setBounds(0,0,2200,2200);
  scene.physics.world.setBounds(0,0,2200,2200);
  scene.cameras.main.startFollow(scene.hero,true,.075,.075);
  scene.cameras.main.roundPixels=true;

  [scene.levelText,scene.scrapText,scene.xpBg,scene.xpFill,scene.titleText,scene.timerText,scene.waveText].forEach(o=>o?.destroy?.());
  const shade=scene.add.rectangle(0,0,W,66,0x081014,.94).setOrigin(0).setScrollFactor(0).setDepth(70).setStrokeStyle(2,0x53636b,.5);
  scene.titleText=scene.add.text(18,10,'WRECKMARCH',{fontFamily:'Arial Black, Arial',fontSize:'18px',color:'#f0d09b'}).setScrollFactor(0).setDepth(72);
  scene.timerText=scene.add.text(W-18,10,'00:00',{fontFamily:'Arial Black, Arial',fontSize:'14px',color:'#e7ecee'}).setOrigin(1,0).setScrollFactor(0).setDepth(72);
  scene.waveText=scene.add.text(W/2,10,'WAVE 1',{fontFamily:'Arial Black, Arial',fontSize:'11px',color:'#55cbd9'}).setOrigin(.5,0).setScrollFactor(0).setDepth(72);
  scene.levelText=scene.add.text(18,39,'LV 1',{fontFamily:'Arial Black, Arial',fontSize:'10px',color:'#f0d09b'}).setScrollFactor(0).setDepth(72);
  scene.scrapText=scene.add.text(69,39,'SCRAP 0/10',{fontFamily:'Arial',fontSize:'9px',color:'#aebbc2'}).setScrollFactor(0).setDepth(72);
  scene.xpBg=scene.add.rectangle(168,47,390,8,0x131a1f,.95).setOrigin(0,.5).setScrollFactor(0).setDepth(72).setStrokeStyle(1,0x5f717a,.65);
  scene.xpFill=scene.add.rectangle(170,47,386,5,0xe1a55d,1).setOrigin(0,.5).setScrollFactor(0).setDepth(73);
  scene.hudShade=shade;
  scene.refreshProgressHud=function(){const r=Phaser.Math.Clamp(this.scrapXp/Math.max(1,this.scrapNeeded),0,1);this.levelText.setText(`LV ${this.level}`);this.scrapText.setText(`SCRAP ${this.scrapXp}/${this.scrapNeeded}`);this.xpFill.setScale(r,1);};
  scene.refreshProgressHud();
}

function installAimPose(scene) {
  scene.weaponArm?.setVisible(false);scene.weaponSprite?.setVisible(false);scene.weaponHand?.setVisible(false);
  const armA=scene.add.rectangle(0,0,30,8,0x704e37).setStrokeStyle(2,0x261b15,.9).setOrigin(0,.5).setDepth(31);
  const armB=scene.add.rectangle(0,0,28,8,0x704e37).setStrokeStyle(2,0x261b15,.9).setOrigin(0,.5).setDepth(31);
  const handA=scene.add.circle(0,0,5,0x916445).setStrokeStyle(2,0x251915,.9).setDepth(33);
  const handB=scene.add.circle(0,0,5,0x916445).setStrokeStyle(2,0x251915,.9).setDepth(33);
  const gun=scene.add.sprite(0,0,'rivet-gun').setOrigin(.18,.5).setDisplaySize(76,36).setDepth(32);
  scene.aimPose={armA,armB,handA,handB,gun};
  scene.currentAimPose=0;scene.visualAimAngle=0;
  const oldUpdate=scene.updateWeaponRig?.bind(scene);
  scene.updateWeaponRig=function(){oldUpdate?.();const target=this.weaponTarget;let a=this.weaponAim||0;if(target)a=Phaser.Math.Angle.Between(this.hero.x,this.hero.y+5,target.x,target.y);const step=Math.PI/4,q=Math.round(Phaser.Math.Angle.Normalize(a)/step)%8,qa=q*step,u=new Phaser.Math.Vector2(Math.cos(qa),Math.sin(qa)),p=new Phaser.Math.Vector2(-u.y,u.x);this.currentAimPose=q;this.visualAimAngle=qa;const rear=this.hero.getCenter(),shoulderA=new Phaser.Math.Vector2(rear.x+p.x*9,rear.y+6+p.y*4),shoulderB=new Phaser.Math.Vector2(rear.x-p.x*7,rear.y+6-p.y*3),grip=new Phaser.Math.Vector2(rear.x+u.x*18+p.x*3,rear.y+6+u.y*15+p.y*3),front=new Phaser.Math.Vector2(rear.x+u.x*34-p.x*3,rear.y+6+u.y*25-p.y*3);const limb=(r,s,h)=>{r.setPosition(s.x,s.y).setDisplaySize(Phaser.Math.Distance.Between(s.x,s.y,h.x,h.y),8).setRotation(Phaser.Math.Angle.Between(s.x,s.y,h.x,h.y));};limb(armA,shoulderA,grip);limb(armB,shoulderB,front);handA.setPosition(grip.x,grip.y);handB.setPosition(front.x,front.y);gun.setPosition(rear.x+u.x*30,rear.y+6+u.y*24).setRotation(qa);this.weaponMuzzle.set(rear.x+u.x*69,rear.y+6+u.y*69);const back=q>=5&&q<=7;[armA,armB,handA,handB,gun].forEach((o,i)=>o.setDepth((back?18:29)+i));};
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
  const existing=scene.game.scene.getScene('UpgradeScene');
  if(existing) scene.game.scene.remove('UpgradeScene');
  class UpgradeSceneV2 extends Phaser.Scene {
    constructor(){super('UpgradeSceneV2');}
    init(data){this.gameScene=data.gameScene;this.choices=data.choices;this.level=data.level;this.selectedIndex=0;this.cards=[];this.locked=false;}
    create(){const W=this.scale.width,H=this.scale.height;this.add.rectangle(W/2,H/2,W,H,0x05080c,.94);this.add.text(W/2,20,`LEVEL ${this.level}`,{fontFamily:'Arial Black, Arial',fontSize:'12px',color:'#55cfdd'}).setOrigin(.5);this.add.text(W/2,47,'CHOOSE YOUR UPGRADE',{fontFamily:'Arial Black, Arial',fontSize:'24px',color:'#f0d09b'}).setOrigin(.5);this.add.text(W/2,72,'BUILD THE RUN  •  CHANGE THE MACHINE',{fontFamily:'Arial Black, Arial',fontSize:'8px',color:'#7d8b94'}).setOrigin(.5);const margin=Phaser.Math.Clamp(W*.05,32,56),gap=Phaser.Math.Clamp(W*.018,12,22),cw=Math.min(294,(W-margin*2-gap*2)/3),ch=Math.min(360,H-118),start=(W-(cw*3+gap*2))/2+cw/2;this.choices.forEach((u,i)=>this.card(start+i*(cw+gap),H*.59,cw,ch,u,i));this.refresh();this.input.keyboard?.on('keydown-LEFT',()=>this.move(-1));this.input.keyboard?.on('keydown-RIGHT',()=>this.move(1));this.input.keyboard?.on('keydown-ENTER',()=>this.choose(this.selectedIndex));this.input.keyboard?.on('keydown-ONE',()=>this.choose(0));this.input.keyboard?.on('keydown-TWO',()=>this.choose(1));this.input.keyboard?.on('keydown-THREE',()=>this.choose(2));}
    card(x,y,w,h,u,i){const c=CATEGORY_COLORS[u.category]||CATEGORY_COLORS.HERO,g=this.add.container(x,y),shadow=this.add.rectangle(7,10,w,h,0,.4),bg=this.add.rectangle(0,0,w,h,0x151b22,.99).setStrokeStyle(2,c,.8),strip=this.add.rectangle(0,-h/2+7,w,14,c,.95),cat=this.add.text(-w/2+18,-h/2+29,u.category,{fontFamily:'Arial Black, Arial',fontSize:'10px',color:Phaser.Display.Color.IntegerToColor(c).rgba}).setOrigin(0,.5);const ay=-h*.18,art=this.add.image(0,ay,`c1-icon-${u.id}`).setDisplaySize(Math.min(w-44,190),Math.min(h*.35,120)),title=this.add.text(0,h*.07,u.title,{fontFamily:'Arial Black, Arial',fontSize:`${Math.max(14,Math.min(19,w/14))}px`,color:'#f4f5f6',align:'center',wordWrap:{width:w-32}}).setOrigin(.5),desc=this.add.text(0,h*.19,u.desc,{fontFamily:'Arial',fontSize:'12px',color:'#b7c0c8',align:'center',wordWrap:{width:w-42},lineSpacing:2}).setOrigin(.5,0),lv=this.gameScene?.upgradeLevels?.[u.id]||0,foot=this.add.text(0,h/2-24,lv?`CURRENT  LV ${lv}`:'NEW UPGRADE',{fontFamily:'Arial Black, Arial',fontSize:'9px',color:'#788590'}).setOrigin(.5),hit=this.add.zone(0,0,w,h).setInteractive({useHandCursor:true});hit.on('pointerover',()=>{this.selectedIndex=i;this.refresh();});hit.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();this.choose(i);});g.add([shadow,bg,strip,cat,art,title,desc,foot,hit]);this.cards.push({g,bg,strip,art,c});}
    move(d){if(!this.choices.length||this.locked)return;this.selectedIndex=(this.selectedIndex+d+this.choices.length)%this.choices.length;this.refresh();}
    refresh(){this.cards.forEach((x,i)=>{const on=i===this.selectedIndex;x.g.setScale(on?1.025:1);x.bg.setStrokeStyle(on?4:2,x.c,on?1:.72);x.strip.setAlpha(on?1:.82);x.art.setAlpha(on?1:.9);});}
    choose(i){if(this.locked||!this.choices[i])return;this.locked=true;this.choices[i].apply();this.cameras.main.flash(75,75,198,215,false);this.time.delayedCall(80,()=>this.gameScene?.closeUpgradeCards?.());}
  }
  if(!scene.game.scene.getScene('UpgradeSceneV2'))scene.game.scene.add('UpgradeSceneV2',UpgradeSceneV2,false);
  scene.openUpgradeCards=function(){if(this.upgradeOpen||this.gameOver)return;const choices=pickC1Choices(this,3);if(!choices.length){this.pendingUpgrade=false;return;}this.upgradeOpen=true;this.pendingUpgrade=false;this.physics.world.pause();this.scene.launch('UpgradeSceneV2',{gameScene:this,choices,level:this.level});this.scene.bringToTop('UpgradeSceneV2');this.playTone?.(520,.06,'triangle',.012,120);};
  scene.closeUpgradeCards=function(){this.scene.stop('UpgradeSceneV2');this.physics.world.resume();this.upgradeOpen=false;this.refreshProgressHud?.();};
}

export async function applyPhaseC1() {
  const scene=await getScene();
  ICON_IDS.forEach((id,i)=>createIconTexture(scene,id,i));
  installLandscapeHud(scene);
  installAimPose(scene);
  installUpgradeScene(scene);
  window.__WM_PHASE_C1__=true;
  document.documentElement.dataset.wreckmarchPhaseC1='active';
  window.__WM_LOG__?.('Phase C.1 active: landscape HUD + 8-way two-hand aim + UpgradeScene cards');
  return true;
}
