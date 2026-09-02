/* WRECKMARCH Phase D.1 — Hunter runner + integrated compact weapon + premium PNG cards + real roads + vehicle scale */
import { CharacterSystem } from './characters/character-system.js?v=10';
import { loadRunnerLocomotionArt } from './characters/runner-locomotion-art.js?v=4';
import { installUpgradeCardPresentation } from './upgrades/upgrade-card-presentation.js?v=2';
// Live Pages keeps this direct dependency sentinel while U5 presentation ownership migrates out of D1.
import './upgrades/upgrade-card-art.js?v=7';
const WORLD_W=2200,WORLD_H=2200;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const CARD_IDS=['heavy-rivets','overclock','long-barrel','twin-riveter','fleet-feet','scrap-magnet','armor-plate','call-rig','rig-overdrive','twin-cannon'];
const GUN_FRAMES=['gun_e.png','gun_se.png','gun_s.png','gun_sw.png','gun_w.png','gun_nw.png','gun_n.png','gun_ne.png'];
const GUN_POSES=[
  {frame:'gun_e.png', w:58,h:42,ox:.17,oy:.53,depth:31},
  {frame:'gun_se.png',w:55,h:49,ox:.20,oy:.39,depth:31,gripDx:-7,gripDy:-2},
  {frame:'gun_s.png', w:34,h:52,ox:.50,oy:.32,depth:31,gripDx:-4,gripDy:-2,muzzleReach:35},
  {frame:'gun_sw.png',w:55,h:49,ox:.80,oy:.39,depth:31,gripDx:7,gripDy:-2},
  {frame:'gun_w.png', w:58,h:42,ox:.83,oy:.53,depth:31},
  {frame:'gun_nw.png',w:55,h:49,ox:.80,oy:.63,depth:31,gripDx:7,gripDy:3},
  {frame:'gun_n.png', w:38,h:57,ox:.50,oy:.78,depth:31,gripDx:-4,gripDy:6,muzzleReach:43},
  {frame:'gun_ne.png',w:55,h:49,ox:.20,oy:.63,depth:31,gripDx:-7,gripDy:3}
];
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
  if(!s.__d1ArmJoint){s.__d1ArmJoint=s.add.circle(0,0,9,0x303a3f,1).setStrokeStyle(3,0x58d7e4,.8).setDepth(30)}s.__d1ArmJoint.setVisible(false)
  const arm=s.weaponV3Gun;s.weaponModule=arm;arm.setVisible(true).clearTint?.();s.__d1Pose=-1;s.__d1Socket=new Phaser.Math.Vector2();s.__d1Muzzle=new Phaser.Math.Vector2();
  if(!s.textures.exists('hunter-rivet')){const g=s.make.graphics({add:false});g.fillStyle(0xff8a35,.28).fillEllipse(8,4,15,6);g.fillStyle(0xc56b32).fillRoundedRect(4,2,11,4,2);g.fillStyle(0xffd58a).fillRoundedRect(9,2.5,6,3,1.5);g.fillStyle(0x5a3425).fillTriangle(15,2,18,4,15,6);g.generateTexture('hunter-rivet',18,8);g.destroy()}
  s.updateWeaponPose=function(){
    const q=aimIndex(this.weaponAim),pose=GUN_POSES[q],a=q*Math.PI/4,u=new Phaser.Math.Vector2(Math.cos(a),Math.sin(a));
    if(q!==this.__d1Pose){
      this.__d1Pose=q;
      arm.setTexture('c3-atlas',pose.frame).setCrop();
      fit(arm,pose.w,pose.h);
      arm.setOrigin(pose.ox,pose.oy);
    }
    const socket=this.characterSystem.getWeaponSocket(q),socketX=socket.x+(pose.gripDx||0),socketY=socket.y+(pose.gripDy||0);
    const recoil=this.weaponV3Recoil||0;this.__d1Socket.set(socketX,socketY);
    arm.setPosition(socketX-u.x*recoil*2.4,socketY-u.y*recoil*2.4).setDepth(pose.depth);
    this.__d1ArmJoint.setPosition(socketX,socketY).setDepth(pose.depth-1).setVisible(false);
    const reach=pose.muzzleReach??this.characterSystem.getMuzzleReach(q);this.__d1Muzzle.set(socketX+u.x*reach,socketY+u.y*reach);
    const weaponDef=this.characterSystem.definition.weapon;
    const faceLeft=q>=weaponDef.leftFacingMinIndex&&q<=weaponDef.leftFacingMaxIndex;
    if(faceLeft)this.hero?.setFlipX?.(true);
    else if(q===0||q===1||q===7)this.hero?.setFlipX?.(false);
    this.visualAimAngle=a;this.weaponV3Recoil*=.62;
    this.__c4Grip?.copy?.(this.__d1Socket);this.__c4Muzzle?.copy?.(this.__d1Muzzle);
  };
  s.weaponSystem.setMuzzleResolver(spread=>{
    const q=s.__d1Pose>=0?s.__d1Pose:aimIndex(s.weaponAim),pose=GUN_POSES[q],a=q*Math.PI/4+spread,reach=pose?.muzzleReach??s.characterSystem.getMuzzleReach(q);
    return new Phaser.Math.Vector2(s.__d1Socket.x+Math.cos(a)*reach,s.__d1Socket.y+Math.sin(a)*reach);
  });
  s.weaponSystem.configureHero({
    projectile:{lifeMs:1180,scale:.62,radius:4,offsetX:5,offsetY:0},
    fireFeedback:({visualAngle,muzzle,shots})=>{
      const a=Number.isFinite(visualAngle)?visualAngle:s.weaponAim;
      s.weaponV3Recoil=Math.min(1.9,(s.weaponV3Recoil||0)+1.55);
      shots.forEach(({bullet})=>{
        const vx=bullet?.body?.velocity?.x??Math.cos(a),vy=bullet?.body?.velocity?.y??Math.sin(a);
        bullet?.setTexture?.('hunter-rivet')?.setScale?.(.62)?.setRotation?.(Math.atan2(vy,vx));
      });
      const flashAngle=a+Phaser.Math.FloatBetween(-.035,.035);
      const flash=s.add.image(muzzle.x,muzzle.y,'flash').setDepth(32).setRotation(flashAngle).setScale(.31).setAlpha(.9).setBlendMode(Phaser.BlendModes.ADD);
      const core=s.add.image(muzzle.x,muzzle.y,'flash').setDepth(33).setRotation(a).setScale(.14).setAlpha(1).setBlendMode(Phaser.BlendModes.ADD);
      const glow=s.add.circle(muzzle.x,muzzle.y,7,0xffb45f,.18).setDepth(31).setBlendMode(Phaser.BlendModes.ADD);
      s.tweens.add({targets:flash,alpha:0,scale:.07,duration:42,ease:'Quad.easeOut',onComplete:()=>flash.destroy()});
      s.tweens.add({targets:core,alpha:0,scale:.04,duration:24,ease:'Quad.easeOut',onComplete:()=>core.destroy()});
      s.tweens.add({targets:glow,alpha:0,scale:1.55,duration:48,ease:'Quad.easeOut',onComplete:()=>glow.destroy()});
      s.cameras.main.shake(34,.0009);
      s.playTone?.(148,.032,'square',.015,-48);
      s.playTone?.(330,.016,'triangle',.005,-120);
    }
  });
  const oldMove=s.updateMovement?.bind(s);
  if(oldMove)s.updateMovement=function(time){oldMove(time);this.characterSystem.updateLocomotionVisuals();};
  s.updateWeaponPose();s.__d1MechanicalArm=true;s.__d1AnimatedRunner=true;
}

function hideLegacyWrecks(s){for(const o of s.children.list){const f=String(o?.frame?.name||'');if(['b1-wreck-a','b1-wreck-b'].includes(o?.texture?.key)||f.startsWith('wreck_'))o.setVisible(false)}}
function addWreck(s,kind,x,y,rot,flip){const frame=WRECK_FRAMES[kind],p=VEHICLE_PROFILE[kind],im=s.add.image(x,y,'c3-atlas',frame).setDepth(3).setRotation(rot).setFlipX(flip).setAlpha(.98).setName(`d1-wreck-${kind}`);fit(im,p.w,p.h);const sh=s.add.ellipse(x,y+p.h*.22,p.w*.76,p.h*.22,0,0.25).setDepth(2).setRotation(rot);im.__vehicleKind=kind;s.__d1Wrecks.push(im,sh);return im}
function installVehicleScale(s){
  hideLegacyWrecks(s);s.__d1Wrecks?.forEach?.(o=>o?.destroy?.());s.__d1Wrecks=[];
  const P=[['sedan',450,780,-.12,false],['truck',1720,720,.10,true],['overturned',700,1460,.18,false],['van',1580,1510,-.12,false],['sedan',1880,1180,.21,true],['van',330,1270,.08,true],['truck',1320,390,-.07,false],['overturned',1960,1880,-.18,true]];
  P.forEach(v=>addWreck(s,...v));s.vehicleScaleProfile=VEHICLE_PROFILE;s.__d1VehicleScale=true;
}

function selfTest(s){if(new URLSearchParams(location.search).get('autotest')!=='1')return;
  const runFrames=s.anims.get(s.characterDefinition?.animations?.run?.key)?.frames?.length||0,hdSheet=s.textures.get('c5-upgrade-sheet'),allHdCards=CARD_IDS.every(id=>s.textures.get('c3-atlas')?.has?.(CARD_FRAME(id))),rarities=new Set(s.__d1RarityStyles||[]),roads=(s.__e0FastRoadSegments||[]).filter(o=>o?.active!==false),near=roads.some(o=>Phaser.Math.Distance.Between(o.x,o.y,WORLD_W/2,WORLD_H/2)<180),truck=s.__d1Wrecks?.find(o=>o.__vehicleKind==='truck'),sedan=s.__d1Wrecks?.find(o=>o.__vehicleKind==='sedan');
  const probe=s.add.image(-9999,-9999,'c3-atlas',CARD_FRAME('overclock'));fit(probe,112,96);
  const checks={animatedLegs:runFrames===3&&s.__d1AnimatedRunner===true,mechanicalArm:!!s.__d1MechanicalArm&&s.weaponModule===s.weaponV3Gun&&GUN_FRAMES.includes(s.weaponV3Gun.frame?.name),weaponGripCalibration:GUN_POSES[2].gripDx===-4&&GUN_POSES[2].gripDy===-2&&GUN_POSES[6].gripDx===-4&&GUN_POSES[6].gripDy===6&&GUN_POSES[1].gripDx===-7&&GUN_POSES[3].gripDx===7&&GUN_POSES[5].gripDx===7&&GUN_POSES[7].gripDx===-7,weaponFront:s.weaponV3Gun.depth>s.hero.depth,weaponScale:s.weaponV3Gun.displayWidth<=60&&s.weaponV3Gun.displayHeight<=60,noHandSprites:[s.weaponV3ArmA,s.weaponV3ArmB,s.weaponV3HandA,s.weaponV3HandB,s.weaponArm,s.weaponRig].every(o=>!o||o.visible===false),premiumCards:allHdCards&&probe.texture?.key==='c3-atlas'&&probe.displayWidth>=80&&s.textures.exists('upgrade-icon-piercing-rivets')&&s.textures.exists('upgrade-icon-ricochet')&&s.textures.exists('upgrade-icon-shrapnel-impact')&&s.textures.exists('upgrade-icon-critical-rivet')&&s.textures.exists('upgrade-icon-explosive-rivet')&&s.textures.exists('upgrade-icon-triple-riveter')&&s.__upgradeCardArtReady===true,cardPresentation:s.__upgradeCardPresentationVersion==='u5-level-max-v2'&&Array.isArray(s.__upgradeCardVisualHierarchy)&&s.__upgradeCardVisualHierarchy.join('>')==='ART>NAME>RARITY>LEVEL>DESCRIPTION',rarityCards:['COMMON','RARE','EPIC','LEGENDARY'].every(r=>rarities.has(r)),roadsVisible:roads.length>200&&near&&roads.every(o=>o.visible&&o.alpha>.95&&o.displayHeight>=145&&o.__terrainSystemObject),vehicleScale:!!truck&&!!sedan&&truck.displayWidth>=330&&sedan.displayWidth>=225&&truck.displayWidth>sedan.displayWidth,characterSystem:s.characterId==='runner'&&s.characterDefinition?.id==='runner'&&s.__characterSystemReady===true,weaponIdentity:s.characterSystem?.weaponDefinition?.id==='rivet-gun'&&s.startingWeaponId==='rivet-gun'&&s.activeWeaponId==='rivet-gun'&&s.primaryWeapon?.id==='rivet-gun',weaponVolley:s.primaryWeapon?.fireProfile?.projectileCount===1&&s.primaryWeapon?.fireProfile?.halfSpreadRadians===0&&s.primaryWeapon?.fireProfile?.volleyDamageMultiplier===1};probe.destroy();
  const ok=Object.values(checks).every(Boolean),detail=Object.entries(checks).map(([k,v])=>`${k}=${v?'ok':'FAIL'}`).join(' ');window.__WM_D1_SELF_TEST__={ok,...checks};document.documentElement.dataset.wreckmarchD1SelfTest=ok?'passed':'failed';window.__WM_LOG__?.(`D1 browser self-test ${ok?'PASSED':'FAILED'}: ${detail}`);if(!ok)throw Error('Phase D.1 self-test failed: '+detail)
}

export async function applyPhaseD1(){const s=await getScene();await loadRunnerLocomotionArt(s);installRunnerAndMechanicalArm(s);installVehicleScale(s);installUpgradeCardPresentation(s);window.__WM_PHASE_D1__=true;document.documentElement.dataset.wreckmarchPhaseD1='active';window.__WM_LOG__?.('Phase D.1 active: Hunter Runner + integrated compact weapon + dynamic canonical rarity cards + visible asphalt + real vehicle scale');selfTest(s);return true}
