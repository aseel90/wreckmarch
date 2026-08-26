/* WRECKMARCH Phase D.1 — animated runner + integrated mechanical arm + premium PNG cards + real roads + vehicle scale */
import { CharacterSystem } from './characters/character-system.js?v=1';
const WORLD_W=2200,WORLD_H=2200;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const COLORS={HERO:0xd98446,UTILITY:0x4fc8d8,FORTRESS:0xd4ad62,EVOLUTION:0x9d6be8};
const CARD_IDS=['heavy-rivets','overclock','long-barrel','twin-riveter','fleet-feet','scrap-magnet','armor-plate','call-rig','rig-overdrive','twin-cannon'];
const GUN_FRAMES=['gun_e.png','gun_se.png','gun_s.png','gun_sw.png','gun_w.png','gun_nw.png','gun_n.png','gun_ne.png'];
const CARD_FRAME=id=>`icon_${id}.png`;
const WRECK_FRAMES={sedan:'wreck_a.png',overturned:'wreck_c.png',van:'wreck_b.png',truck:'wreck_d.png'};
const VEHICLE_PROFILE={sedan:{w:246,h:166},overturned:{w:270,h:240},van:{w:292,h:214},truck:{w:356,h:302}};

async function getScene(timeout=10000){const t=performance.now();while(performance.now()-t<timeout){const g=window.Phaser?.GAMES?.find(Boolean)||window.Phaser?.GAMES?.[0],s=g?.scene?.getScene?.('Wreckmarch');if(s?.sys?.isActive?.()&&s.hero&&s.weaponV3Gun&&s.textures?.exists?.('c3-atlas')&&s.textures?.exists?.('c4-road')&&window.__WM_PHASE_C5__)return s;await wait(50)}throw Error('Phase D.1 scene timeout')}
function fit(im,w,h){const fw=im.frame?.realWidth||im.width||1,fh=im.frame?.realHeight||im.height||1,z=Math.min(w/fw,h/fh);im.setDisplaySize(fw*z,fh*z);return im}
function aimIndex(a){return Math.round(Phaser.Math.Angle.Normalize(a)/(Math.PI/4))%8}
function ensureFrame(s,name){const tex=s.textures.get('c3-atlas');if(tex?.has?.(name))return true;return false}

function installRunnerAndMechanicalArm(s){
  const character=s.characterSystem||(s.characterSystem=new CharacterSystem(s,s.characterId||'runner'));
  character.installProductionVisuals();
  [s.weaponV3ArmA,s.weaponV3ArmB,s.weaponV3HandA,s.weaponV3HandB,s.weaponArm,s.weaponRig,s.aimPose].forEach(o=>o?.setVisible?.(false));
  if(!s.__d1ArmJoint){s.__d1ArmJoint=s.add.circle(0,0,9,0x303a3f,1).setStrokeStyle(3,0x58d7e4,.8).setDepth(30)}
  const arm=s.weaponV3Gun;s.weaponModule=arm;arm.setVisible(true).clearTint?.();s.__d1Pose=-1;s.__d1Socket=new Phaser.Math.Vector2();s.__d1Muzzle=new Phaser.Math.Vector2();
  s.updateWeaponPose=function(){
    const q=aimIndex(this.weaponAim),a=q*Math.PI/4,u=new Phaser.Math.Vector2(Math.cos(a),Math.sin(a));
    if(q!==this.__d1Pose){this.__d1Pose=q;arm.setTexture('c3-atlas',GUN_FRAMES[q]).setCrop();fit(arm,q%2?94:102,q%2?92:84);arm.setOrigin(q===4||q===3||q===5?.82:.18,.52)}
    const socket=this.characterSystem.getWeaponSocket(q),socketX=socket.x,socketY=socket.y;
    const recoil=this.weaponV3Recoil||0;this.__d1Socket.set(socketX,socketY);
    arm.setPosition(socketX-u.x*recoil*3.2,socketY-u.y*recoil*3.2).setDepth(q>=5?19:31);
    this.__d1ArmJoint.setPosition(socketX,socketY).setDepth(q>=5?18:30);
    const reach=this.characterSystem.getMuzzleReach(q);this.__d1Muzzle.set(socketX+u.x*reach,socketY+u.y*reach);
    this.visualAimAngle=a;this.weaponV3Recoil*=.7;
    this.__c4Grip?.copy?.(this.__d1Socket);this.__c4Muzzle?.copy?.(this.__d1Muzzle);
  };
  s.weaponSystem.setMuzzleResolver(spread=>{const a=(s.__d1Pose>=0?s.__d1Pose*Math.PI/4:s.weaponAim)+spread,reach=s.characterSystem.definition.weapon.muzzleReachStraight;return new Phaser.Math.Vector2(s.__d1Socket.x+Math.cos(a)*reach,s.__d1Socket.y+Math.sin(a)*reach)});
  const oldMove=s.updateMovement?.bind(s);
  if(oldMove)s.updateMovement=function(time){
    oldMove(time);
    this.characterSystem.updateLocomotionVisuals();
  };
  s.updateWeaponPose();s.__d1MechanicalArm=true;s.__d1AnimatedRunner=true;
}

function hideLegacyWrecks(s){for(const o of s.children.list){const f=String(o?.frame?.name||'');if(['b1-wreck-a','b1-wreck-b'].includes(o?.texture?.key)||f.startsWith('wreck_'))o.setVisible(false)}}
function addWreck(s,kind,x,y,rot,flip){const frame=WRECK_FRAMES[kind],p=VEHICLE_PROFILE[kind],im=s.add.image(x,y,'c3-atlas',frame).setDepth(3).setRotation(rot).setFlipX(flip).setAlpha(.98).setName(`d1-wreck-${kind}`);fit(im,p.w,p.h);const sh=s.add.ellipse(x,y+p.h*.22,p.w*.76,p.h*.22,0,0.25).setDepth(2).setRotation(rot);im.__vehicleKind=kind;s.__d1Wrecks.push(im,sh);return im}
function installVehicleScale(s){
  hideLegacyWrecks(s);s.__d1Wrecks?.forEach?.(o=>o?.destroy?.());s.__d1Wrecks=[];
  const P=[['sedan',450,780,-.12,false],['truck',1720,720,.10,true],['overturned',700,1460,.18,false],['van',1580,1510,-.12,false],['sedan',1880,1180,.21,true],['van',330,1270,.08,true],['truck',1320,390,-.07,false],['overturned',1960,1880,-.18,true]];
  P.forEach(v=>addWreck(s,...v));s.vehicleScaleProfile=VEHICLE_PROFILE;s.__d1VehicleScale=true;
}

function installPremiumCards(s){
  const up=s.game.scene.getScene('UpgradeSceneV4');if(!up)throw Error('D1 UpgradeSceneV4 missing');
  up.card=function(x,y,w,h,u,i){
    const c=COLORS[u.category]||COLORS.HERO,g=this.add.container(x,y),shadow=this.add.rectangle(7,10,w,h,0,.42),bg=this.add.rectangle(0,0,w,h,0x151b22,.995).setStrokeStyle(2,c,.86),strip=this.add.rectangle(0,-h/2+7,w,14,c,.98),cat=this.add.text(-w/2+17,-h/2+28,u.category,{fontFamily:'Arial Black,Arial',fontSize:'10px',color:Phaser.Display.Color.IntegerToColor(c).rgba}).setOrigin(0,.5),ah=Math.min(166,h*.41),ay=-h*.18,artBg=this.add.rectangle(0,ay,w-24,ah,0x091017,.82).setStrokeStyle(1.4,c,.34),art=this.add.image(0,ay,'c3-atlas',CARD_FRAME(u.id));fit(art,w-50,ah-16);
    const title=this.add.text(0,h*.075,u.title,{fontFamily:'Arial Black,Arial',fontSize:`${Math.max(15,Math.min(20,w/14))}px`,color:'#f4f6f7',align:'center',wordWrap:{width:w-30}}).setOrigin(.5),desc=this.add.text(0,h*.22,u.desc,{fontFamily:'Arial',fontSize:'12px',color:'#bbc4cc',align:'center',wordWrap:{width:w-38},lineSpacing:2}).setOrigin(.5,0),lv=this.gameScene?.upgradeLevels?.[u.id]||0,foot=this.add.text(0,h/2-23,lv?`CURRENT LV ${lv}`:'NEW UPGRADE',{fontFamily:'Arial Black,Arial',fontSize:'9px',color:'#7c8993'}).setOrigin(.5),hit=this.add.zone(0,0,w,h).setInteractive({useHandCursor:true});
    hit.on('pointerover',()=>{this.selectedIndex=i;this.refresh()});hit.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();this.choose(i)});g.add([shadow,bg,strip,cat,artBg,art,title,desc,foot,hit]);this.cards.push({g,bg,strip,art,a:c});
  };
  s.__d1PremiumCards=true;
}

function selfTest(s){if(new URLSearchParams(location.search).get('autotest')!=='1')return;
  const runFrames=s.anims.get(s.characterDefinition?.animations?.run?.key)?.frames?.length||0,allCardFrames=CARD_IDS.every(id=>ensureFrame(s,CARD_FRAME(id))),roads=(s.__e0FastRoadSegments||[]).filter(o=>o?.active!==false),near=roads.some(o=>Phaser.Math.Distance.Between(o.x,o.y,WORLD_W/2,WORLD_H/2)<180),truck=s.__d1Wrecks?.find(o=>o.__vehicleKind==='truck'),sedan=s.__d1Wrecks?.find(o=>o.__vehicleKind==='sedan');
  const probe=s.add.image(-9999,-9999,'c3-atlas',CARD_FRAME('overclock'));fit(probe,190,140);
  const checks={animatedLegs:runFrames===2&&s.__d1AnimatedRunner===true,mechanicalArm:!!s.__d1MechanicalArm&&s.weaponModule===s.weaponV3Gun&&GUN_FRAMES.includes(s.weaponV3Gun.frame?.name),noHandSprites:[s.weaponV3ArmA,s.weaponV3ArmB,s.weaponV3HandA,s.weaponV3HandB,s.weaponArm,s.weaponRig].every(o=>!o||o.visible===false),premiumCards:allCardFrames&&probe.frame?.name===CARD_FRAME('overclock')&&probe.displayWidth>130,roadsVisible:roads.length>200&&near&&roads.every(o=>o.visible&&o.alpha>.95&&o.displayHeight>=145&&o.__terrainSystemObject),vehicleScale:!!truck&&!!sedan&&truck.displayWidth>=330&&sedan.displayWidth>=225&&truck.displayWidth>sedan.displayWidth,characterSystem:s.characterId==='runner'&&s.characterDefinition?.id==='runner'&&s.__characterSystemReady===true};probe.destroy();
  const ok=Object.values(checks).every(Boolean),detail=Object.entries(checks).map(([k,v])=>`${k}=${v?'ok':'FAIL'}`).join(' ');window.__WM_D1_SELF_TEST__={ok,...checks};document.documentElement.dataset.wreckmarchD1SelfTest=ok?'passed':'failed';window.__WM_LOG__?.(`D1 browser self-test ${ok?'PASSED':'FAILED'}: ${detail}`);if(!ok)throw Error('Phase D.1 self-test failed: '+detail)
}

export async function applyPhaseD1(){const s=await getScene();installRunnerAndMechanicalArm(s);installVehicleScale(s);installPremiumCards(s);window.__WM_PHASE_D1__=true;document.documentElement.dataset.wreckmarchPhaseD1='active';window.__WM_LOG__?.('Phase D.1 active: animated Runner + integrated mechanical arm + premium PNG card art + visible asphalt + real vehicle scale');selfTest(s);return true}
