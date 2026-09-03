/* WRECKMARCH — Runner-only production presentation adapter.
 * Character selection/ownership stays outside this file. This module owns only
 * Runner visual + weapon presentation for the legacy C5/D1 presentation phases.
 */
import { loadRunnerLocomotionArt } from './runner-locomotion-art.js?v=4';

const HERO_ORIGIN={x:64,y:77};
const HERO_GRIPS=[[79,77],[79,80],[77,83],[49,80],[49,77],[49,72],[77,69],[79,72]];
const GUN=[
 {frame:'gun_e.png',origin:[.26,.70],max:[92,66],depth:31},{frame:'gun_se.png',origin:[.27,.28],max:[84,76],depth:31},
 {frame:'gun_s.png',origin:[.50,.18],max:[48,82],depth:31},{frame:'gun_sw.png',origin:[.73,.27],max:[84,76],depth:31},
 {frame:'gun_w.png',origin:[.74,.70],max:[92,66],depth:31},{frame:'gun_nw.png',origin:[.72,.72],max:[84,76],depth:22},
 {frame:'gun_n.png',origin:[.50,.82],max:[48,82],depth:22},{frame:'gun_ne.png',origin:[.28,.72],max:[84,76],depth:22}
];

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

function fitFrame(im,w,h){const fw=im.frame?.realWidth||im.width||1,fh=im.frame?.realHeight||im.height||1,z=Math.min(w/fw,h/fh);im.setDisplaySize(fw*z,fh*z)}
function fit(im,w,h){const fw=im.frame?.realWidth||im.width||1,fh=im.frame?.realHeight||im.height||1,z=Math.min(w/fw,h/fh);im.setDisplaySize(fw*z,fh*z);return im}
function aimIndex(a){return Math.round(Phaser.Math.Angle.Normalize(a)/(Math.PI/4))%8}

function heroSvg(q){
 const mirror=q===3||q===4||q===5,base=mirror?(8-q)%8:q,back=base===6||base===7,side=base===0,diag=base===1||base===7;
 const grip=HERO_GRIPS[q],gx=mirror?128-grip[0]:grip[0],gy=grip[1],g=mirror?'transform="translate(128 0) scale(-1 1)"':'',hs=diag?3:0,sx=side?80:82,sy=back?68:72;
 const face=back?`<path d="M44 26Q64 12 89 27L88 50Q66 58 42 48Z" fill="#3b281f"/><path d="M43 24Q65 18 89 25" fill="none" stroke="#674a35" stroke-width="7"/><ellipse cx="52" cy="25" rx="10" ry="8" fill="#2e3436"/><ellipse cx="79" cy="25" rx="10" ry="8" fill="#2e3436"/><rect x="48" y="23" width="35" height="5" rx="2" fill="#5b4030"/>`:
 side?`<ellipse cx="70" cy="39" rx="22" ry="24" fill="#e1a773"/><path d="M47 30C50 15 61 8 73 12L80 5 83 17 94 12 89 28 98 27 88 38Q71 24 47 30Z" fill="#3b281f"/><ellipse cx="79" cy="41" rx="5" ry="5.5" fill="#f7efe3"/><circle cx="81" cy="41" r="2.3" fill="#17191b"/><path d="M53 22Q71 16 89 22" fill="none" stroke="#5e3f2d" stroke-width="7"/><circle cx="65" cy="22" r="11" fill="#2e3436"/><circle cx="65" cy="22" r="8" fill="#52ddeb" stroke="#9a6a40" stroke-width="2"/><path d="M52 50Q73 46 90 50L87 62Q69 68 52 61Z" fill="#123c47"/>`:
 `<ellipse cx="${64+hs}" cy="39" rx="24" ry="25" fill="#e1a773"/><ellipse cx="${39+hs}" cy="40" rx="5" ry="8" fill="#d29463"/><ellipse cx="${89+hs}" cy="40" rx="5" ry="8" fill="#d29463"/><path d="M${39+hs} 31C${41+hs} 14 ${48+hs} 10 ${54+hs} 13L${59+hs} 5 ${66+hs} 13 ${76+hs} 3 ${78+hs} 16 ${91+hs} 9 ${87+hs} 25 ${97+hs} 23 ${87+hs} 35Q${62+hs} 19 ${39+hs} 31Z" fill="#3b281f"/><ellipse cx="${54+hs}" cy="41" rx="4.5" ry="5" fill="#f7efe3"/><ellipse cx="${75+hs}" cy="41" rx="4.5" ry="5" fill="#f7efe3"/><circle cx="${55+hs}" cy="41" r="2.2" fill="#17191b"/><circle cx="${74+hs}" cy="41" r="2.2" fill="#17191b"/><path d="M${42+hs} 48Q${63+hs} 43 ${86+hs} 48L${82+hs} 62Q${64+hs} 69 ${45+hs} 61Z" fill="#123c47"/><path d="M${40+hs} 21Q${64+hs} 15 ${88+hs} 21" fill="none" stroke="#5e3f2d" stroke-width="7"/><circle cx="${51+hs}" cy="21" r="12" fill="#2e3436"/><circle cx="${78+hs}" cy="21" r="12" fill="#2e3436"/><circle cx="${51+hs}" cy="21" r="8.5" fill="#52ddeb" stroke="#9a6a40" stroke-width="2"/><circle cx="${78+hs}" cy="21" r="8.5" fill="#52ddeb" stroke="#9a6a40" stroke-width="2"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="148" viewBox="0 0 128 148"><defs><linearGradient id="m"><stop stop-color="#b2babd"/><stop offset="1" stop-color="#293034"/></linearGradient><linearGradient id="c"><stop stop-color="#e6a154"/><stop offset="1" stop-color="#5b2d18"/></linearGradient></defs><g ${g} stroke="#241b18" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="64" cy="140" rx="34" ry="6" fill="#000" opacity=".2" stroke="none"/><path d="M45 56C30 50 17 55 7 64 21 67 34 72 48 69Z" fill="#ba4b2f"/><path d="M45 64C31 65 18 73 11 79 28 78 38 80 50 72Z" fill="#8d3427"/><path d="M67 101L83 103 87 127 75 131 64 112Z" fill="#383630"/><path d="M72 124L91 124 97 136 72 140 64 133Z" fill="#8b6543"/><path d="M45 101L62 103 58 128 44 131 37 111Z" fill="#454139"/><path d="M41 125L61 126 66 137 39 140 32 133Z" fill="#8b6543"/><path d="M37 59Q43 51 55 50L78 51Q91 55 94 69L89 105Q68 112 42 105L33 72Z" fill="${back?'#6e533c':'#8b6543'}"/><path d="M49 61L79 61 83 99Q66 104 48 99Z" fill="#263038"/><path d="M51 62L63 78 75 62" fill="none" stroke="#c0874b"/><path d="M39 92H89" stroke="#2a211c" stroke-width="7"/><rect x="58" y="88" width="14" height="10" rx="2" fill="url(#c)"/><path d="M38 62Q27 66 24 78L19 96 34 100 43 77Z" fill="#8a6543"/><path d="M19 91L35 92 36 102Q25 109 17 100Z" fill="#2b2e31"/><path d="M30 88L24 111" stroke="#9da5a7" stroke-width="5"/><circle cx="23" cy="114" r="5" fill="none" stroke="#9da5a7" stroke-width="4"/><path d="M82 58Q98 57 105 69L100 79 87 75 80 64Z" fill="url(#m)"/><circle cx="96" cy="68" r="3" fill="#4fd9e8" stroke="none"/><path d="M${sx} ${sy}Q${(sx+gx)/2} ${(sy+gy)/2} ${gx} ${gy}" fill="none" stroke="#7c5b3d" stroke-width="13"/><path d="M${sx} ${sy}Q${(sx+gx)/2} ${(sy+gy)/2} ${gx} ${gy}" fill="none" stroke="#2b2e31" stroke-width="5"/><circle cx="${gx}" cy="${gy}" r="6" fill="#d79a68"/>${face}</g></svg>`;
}

async function loadRunnerC5Assets(s){
 const heroMissing=[];for(let q=0;q<8;q++)if(!s.textures.exists(`c5-hero-${q}`))heroMissing.push(q);
 if(!heroMissing.length)return;
 await new Promise((resolve,reject)=>{const urls=[];let bad=false;const fail=f=>{if(bad)return;bad=true;urls.forEach(URL.revokeObjectURL);reject(Error('Runner C5 asset failed '+(f?.key||'')))},done=()=>{s.load.off('loaderror',fail);urls.forEach(URL.revokeObjectURL);if(!bad)resolve()};s.load.once('loaderror',fail);s.load.once('complete',done);heroMissing.forEach(q=>{const u=URL.createObjectURL(new Blob([heroSvg(q)],{type:'image/svg+xml'}));urls.push(u);s.load.svg(`c5-hero-${q}`,u,{width:128,height:148})});s.load.start()});
}

function installHeroAim(s){
 [s.weaponV3ArmA,s.weaponV3ArmB,s.weaponV3HandA,s.weaponV3HandB,s.weaponArm,s.weaponRig,s.aimPose].forEach(o=>o?.setVisible?.(false));
 s.weaponSprite=s.weaponV3Gun;s.weaponV3Gun.setVisible(true);s.__c5Pose=-1;s.__c5Grip=new Phaser.Math.Vector2();s.__c5Muzzle=new Phaser.Math.Vector2();
 s.hero.stop().setFlipX(false).setOrigin(.5,.52).setScale(.70).setTexture('c5-hero-0');
 s.updateWeaponPose=function(){const q=aimIndex(this.weaponAim),cfg=GUN[q],gp=HERO_GRIPS[q];if(q!==this.__c5Pose){this.__c5Pose=q;this.heroFacingPose=q;this.hero.stop().setTexture(`c5-hero-${q}`).setFlipX(false).setOrigin(.5,.52).setScale(.70);this.weaponV3Gun.setTexture('c3-atlas',cfg.frame).setCrop();fitFrame(this.weaponV3Gun,cfg.max[0],cfg.max[1]);this.weaponV3Gun.setOrigin(...cfg.origin)}this.hero.stop().setFlipX(false);const sx=Math.abs(this.hero.scaleX||.7),sy=Math.abs(this.hero.scaleY||.7),gx=this.hero.x+(gp[0]-HERO_ORIGIN.x)*sx,gy=this.hero.y+(gp[1]-HERO_ORIGIN.y)*sy,a=q*Math.PI/4,recoil=this.weaponV3Recoil||0,ux=Math.cos(a),uy=Math.sin(a);this.__c5Grip.set(gx,gy);this.weaponV3Gun.setPosition(gx-ux*recoil*3.2,gy-uy*recoil*3.2).setDepth(cfg.depth);this.__c5Muzzle.set(gx+ux*(q%2?60:64),gy+uy*(q%2?60:64));this.visualAimAngle=a;this.weaponV3Recoil*=.7;this.__c4Grip?.copy?.(this.__c5Grip);this.__c4Muzzle?.copy?.(this.__c5Muzzle)};
 s.weaponSystem.setMuzzleResolver(spread=>{if(Math.abs(spread)<.0001)return s.__c5Muzzle.clone();const a=s.__c5Pose*Math.PI/4+spread;return new Phaser.Math.Vector2(s.__c5Grip.x+Math.cos(a)*64,s.__c5Grip.y+Math.sin(a)*64)});s.updateWeaponPose();
}

function runnerC5Checks(s){
 const old=s.weaponAim,poses=[];
 [0,2,4,6].forEach(q=>{s.weaponAim=q*Math.PI/4;s.updateWeaponPose();poses.push(s.hero.texture.key===`c5-hero-${q}`&&s.heroFacingPose===q&&!s.hero.flipX)});
 s.weaponAim=old;s.updateWeaponPose();
 return {
  bodyAim:poses.every(Boolean),
  noThirdHand:[s.weaponV3ArmA,s.weaponV3ArmB,s.weaponV3HandA,s.weaponV3HandB,s.aimPose].every(o=>!o||!o.visible)
 };
}

function installRunnerD1Runtime(s){
  const character=s.characterSystem;
  if(!character||character.characterId!=='runner')throw Error('Runner D1 presentation requires aligned CharacterSystem');
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

function runnerD1Checks(s){
 const runFrames=s.anims.get(s.characterDefinition?.animations?.run?.key)?.frames?.length||0;
 return {
  animatedLegs:runFrames===3&&s.__d1AnimatedRunner===true,
  mechanicalArm:!!s.__d1MechanicalArm&&s.weaponModule===s.weaponV3Gun&&GUN_FRAMES.includes(s.weaponV3Gun.frame?.name),
  weaponGripCalibration:GUN_POSES[2].gripDx===-4&&GUN_POSES[2].gripDy===-2&&GUN_POSES[6].gripDx===-4&&GUN_POSES[6].gripDy===6&&GUN_POSES[1].gripDx===-7&&GUN_POSES[3].gripDx===7&&GUN_POSES[5].gripDx===7&&GUN_POSES[7].gripDx===-7,
  weaponFront:s.weaponV3Gun.depth>s.hero.depth,
  weaponScale:s.weaponV3Gun.displayWidth<=60&&s.weaponV3Gun.displayHeight<=60,
  noHandSprites:[s.weaponV3ArmA,s.weaponV3ArmB,s.weaponV3HandA,s.weaponV3HandB,s.weaponArm,s.weaponRig].every(o=>!o||o.visible===false),
  characterSystem:s.characterId==='runner'&&s.characterDefinition?.id==='runner'&&s.characterSystem?.characterId==='runner'&&s.__characterSystemReady===true,
  weaponIdentity:s.characterSystem?.weaponDefinition?.id==='rivet-gun'&&s.startingWeaponId==='rivet-gun'&&s.activeWeaponId==='rivet-gun'&&s.primaryWeapon?.id==='rivet-gun',
  weaponVolley:s.primaryWeapon?.fireProfile?.projectileCount===1&&s.primaryWeapon?.fireProfile?.halfSpreadRadians===0&&s.primaryWeapon?.fireProfile?.volleyDamageMultiplier===1
 };
}

export async function installRunnerC5Presentation(s){
 await loadRunnerC5Assets(s);
 installHeroAim(s);
 return { checks: runnerC5Checks(s) };
}

export async function installRunnerD1Presentation(s){
 await loadRunnerLocomotionArt(s);
 installRunnerD1Runtime(s);
 return { checks: runnerD1Checks(s) };
}
