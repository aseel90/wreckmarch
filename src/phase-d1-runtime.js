/* WRECKMARCH Phase D.1 — Hunter runner + integrated compact weapon + premium PNG cards + real roads + vehicle scale */
import { CharacterSystem } from './characters/character-system.js?v=5';
import { loadRunnerLocomotionArt } from './characters/runner-locomotion-art.js?v=4';
import { installMobileHudPolish } from './mobile-hud-polish.js?v=2';
const WORLD_W=2200,WORLD_H=2200;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const COLORS={HERO:0xd98446,UTILITY:0x4fc8d8,FORTRESS:0xd4ad62,EVOLUTION:0x9d6be8};
const CARD_RARITY={
  'heavy-rivets':'COMMON','overclock':'COMMON','long-barrel':'RARE','twin-riveter':'EPIC','fleet-feet':'COMMON',
  'scrap-magnet':'RARE','armor-plate':'COMMON','call-rig':'LEGENDARY','rig-overdrive':'RARE','twin-cannon':'EPIC'
};
const RARITY_STYLE={
  COMMON:{label:'COMMON',frame:0x7f8b93,glow:0x7f8b93,rank:0},
  RARE:{label:'RARE',frame:0x4fc8d8,glow:0x2d9fb4,rank:1},
  EPIC:{label:'EPIC',frame:0xa26be8,glow:0x7543bb,rank:2},
  LEGENDARY:{label:'LEGENDARY',frame:0xf0b95f,glow:0xd98446,rank:3}
};
const CARD_IDS=['heavy-rivets','overclock','long-barrel','twin-riveter','fleet-feet','scrap-magnet','armor-plate','call-rig','rig-overdrive','twin-cannon'];
const GUN_FRAMES=['gun_e.png','gun_se.png','gun_s.png','gun_sw.png','gun_w.png','gun_nw.png','gun_n.png','gun_ne.png'];
const GUN_POSES=[
  {frame:'gun_e.png', w:58,h:42,ox:.17,oy:.53,depth:31},
  {frame:'gun_se.png',w:55,h:49,ox:.20,oy:.39,depth:31},
  {frame:'gun_s.png', w:38,h:57,ox:.50,oy:.22,depth:31},
  {frame:'gun_sw.png',w:55,h:49,ox:.80,oy:.39,depth:31},
  {frame:'gun_w.png', w:58,h:42,ox:.83,oy:.53,depth:31},
  {frame:'gun_nw.png',w:55,h:49,ox:.80,oy:.63,depth:31},
  {frame:'gun_n.png', w:38,h:57,ox:.50,oy:.78,depth:31},
  {frame:'gun_ne.png',w:55,h:49,ox:.20,oy:.63,depth:31}
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
  s.updateWeaponPose=function(){
    const q=aimIndex(this.weaponAim),pose=GUN_POSES[q],a=q*Math.PI/4,u=new Phaser.Math.Vector2(Math.cos(a),Math.sin(a));
    if(q!==this.__d1Pose){
      this.__d1Pose=q;
      arm.setTexture('c3-atlas',pose.frame).setCrop();
      fit(arm,pose.w,pose.h);
      arm.setOrigin(pose.ox,pose.oy);
    }
    const socket=this.characterSystem.getWeaponSocket(q),socketX=socket.x,socketY=socket.y;
    const recoil=this.weaponV3Recoil||0;this.__d1Socket.set(socketX,socketY);
    arm.setPosition(socketX-u.x*recoil*2.4,socketY-u.y*recoil*2.4).setDepth(pose.depth);
    this.__d1ArmJoint.setPosition(socketX,socketY).setDepth(pose.depth-1).setVisible(false);
    const reach=this.characterSystem.getMuzzleReach(q);this.__d1Muzzle.set(socketX+u.x*reach,socketY+u.y*reach);
    const weaponDef=this.characterSystem.definition.weapon;
    const faceLeft=q>=weaponDef.leftFacingMinIndex&&q<=weaponDef.leftFacingMaxIndex;
    if(faceLeft)this.hero?.setFlipX?.(true);
    else if(q===0||q===1||q===7)this.hero?.setFlipX?.(false);
    this.visualAimAngle=a;this.weaponV3Recoil*=.7;
    this.__c4Grip?.copy?.(this.__d1Socket);this.__c4Muzzle?.copy?.(this.__d1Muzzle);
  };
  s.weaponSystem.setMuzzleResolver(spread=>{
    const q=s.__d1Pose>=0?s.__d1Pose:aimIndex(s.weaponAim),a=q*Math.PI/4+spread,reach=s.characterSystem.getMuzzleReach(q);
    return new Phaser.Math.Vector2(s.__d1Socket.x+Math.cos(a)*reach,s.__d1Socket.y+Math.sin(a)*reach);
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

function installPremiumCards(s){
  const up=s.game.scene.getScene('UpgradeSceneV4');
  if(!up)throw Error('D1 UpgradeSceneV4 missing');
  const hdSheet=s.textures.get('c5-upgrade-sheet');
  if(!hdSheet)throw Error('D1 HD upgrade sheet missing');

  up.card=function(x,y,w,h,u,i){
    const category=COLORS[u.category]||COLORS.HERO;
    const rarity=CARD_RARITY[u.id]||'COMMON';
    const style=RARITY_STYLE[rarity];
    const rank=style.rank;
    const g=this.add.container(x,y);
    const shadow=this.add.rectangle(8,11,w,h,0,.46);
    const glow=this.add.rectangle(0,0,w+8,h+8,style.glow,rank>=2?.10:rank===1?.055:.02);
    const bg=this.add.rectangle(0,0,w,h,0x141a21,.997).setStrokeStyle(rank>=3?4:rank>=1?3:2,style.frame,.92);
    const inner=this.add.rectangle(0,0,w-10,h-10,0,0).setStrokeStyle(1,style.frame,rank>=1?.42:.14);
    const header=this.add.rectangle(0,-h/2+27,w-4,50,0x0b1016,.98);
    const strip=this.add.rectangle(0,-h/2+5,w,10,style.frame,.98);
    const categoryText=this.add.text(-w/2+16,-h/2+28,u.category,{fontFamily:'Arial Black,Arial',fontSize:'10px',color:Phaser.Display.Color.IntegerToColor(category).rgba}).setOrigin(0,.5);
    const rarityText=this.add.text(w/2-16,-h/2+28,style.label,{fontFamily:'Arial Black,Arial',fontSize:rank>=3?'9px':'8px',color:Phaser.Display.Color.IntegerToColor(style.frame).rgba,letterSpacing:1}).setOrigin(1,.5);

    const artH=Math.min(154,h*.39),artY=-h*.18;
    const artBg=this.add.rectangle(0,artY,w-34,artH,0x0a1015,.96).setStrokeStyle(2,style.frame,rank>=2?.48:.28);
    const iconPlate=this.add.circle(0,artY,Math.min(58,artH*.39),0x111a20,1).setStrokeStyle(3,category,.42);
    const art=this.add.image(0,artY,'c3-atlas',CARD_FRAME(u.id));
    fit(art,Math.min(116,w*.43),Math.min(102,artH*.68));

    const title=this.add.text(0,h*.105,u.title,{fontFamily:'Arial Black,Arial',fontSize:`${Math.max(16,Math.min(21,w/13.6))}px`,color:'#f4f6f7',align:'center',wordWrap:{width:w-28}}).setOrigin(.5);
    const desc=this.add.text(0,h*.225,u.desc,{fontFamily:'Arial',fontSize:'12px',color:'#c1c9d0',align:'center',wordWrap:{width:w-34},lineSpacing:3}).setOrigin(.5,0);
    const lv=this.gameScene?.upgradeLevels?.[u.id]||0;
    const footerLabel=lv?`LV ${lv}  →  ${lv+1}`:'NEW UPGRADE';
    const footer=this.add.text(0,h/2-23,footerLabel,{fontFamily:'Arial Black,Arial',fontSize:'9px',color:Phaser.Display.Color.IntegerToColor(style.frame).rgba}).setOrigin(.5);

    const accents=[];
    if(rank>=1){
      accents.push(this.add.rectangle(-w/2+5,0,3,h*.52,style.frame,.34));
      accents.push(this.add.rectangle(w/2-5,0,3,h*.52,style.frame,.34));
    }
    if(rank>=2){
      accents.push(this.add.rectangle(-w/2+8,-h/2+9,28,3,style.frame,.82));
      accents.push(this.add.rectangle(w/2-8,-h/2+9,28,3,style.frame,.82));
      accents.push(this.add.rectangle(0,h/2-7,w*.42,3,style.frame,.65));
    }
    if(rank>=3){
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{
        accents.push(this.add.circle(sx*(w/2-13),sy*(h/2-13),4,0xf7d58a,1).setStrokeStyle(2,0xd98446,.9));
      });
      accents.push(this.add.rectangle(0,-h/2+12,w*.54,3,0xf7d58a,.82));
    }

    const hit=this.add.zone(0,0,w,h).setInteractive({useHandCursor:true});
    hit.on('pointerover',()=>{this.selectedIndex=i;this.refresh()});
    hit.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();this.choose(i)});
    g.add([shadow,glow,bg,inner,header,strip,categoryText,rarityText,artBg,iconPlate,art,title,desc,footer,...accents,hit]);
    this.cards.push({g,bg,inner,strip,art,glow,rarityText,rarity,style,a:style.frame});
  };

  up.refresh=function(){
    this.cards.forEach((v,i)=>{
      const selected=i===this.selectedIndex;
      const rank=v.style.rank;
      v.g.setScale(selected?1.028:1);
      v.bg.setStrokeStyle(selected?(rank>=3?5:4):(rank>=3?4:rank>=1?3:2),v.style.frame,selected?1:.88);
      v.inner.setAlpha(selected?1:(rank>=1?.72:.4));
      v.strip.setAlpha(selected?1:.84);
      v.glow.setAlpha(selected?(rank>=2?.20:.10):(rank>=2?.10:rank===1?.055:.02));
      v.art.setAlpha(selected?1:.94);
      v.rarityText.setAlpha(selected?1:.86);
    });
  };

  s.__d1PremiumCards=true;
  s.__d1CardRarity={...CARD_RARITY};
  s.__d1CardArtSource='c3-atlas-icons';
}

function selfTest(s){if(new URLSearchParams(location.search).get('autotest')!=='1')return;
  const runFrames=s.anims.get(s.characterDefinition?.animations?.run?.key)?.frames?.length||0,hdSheet=s.textures.get('c5-upgrade-sheet'),allHdCards=CARD_IDS.every(id=>s.textures.get('c3-atlas')?.has?.(CARD_FRAME(id))),rarities=new Set(Object.values(s.__d1CardRarity||{})),roads=(s.__e0FastRoadSegments||[]).filter(o=>o?.active!==false),near=roads.some(o=>Phaser.Math.Distance.Between(o.x,o.y,WORLD_W/2,WORLD_H/2)<180),truck=s.__d1Wrecks?.find(o=>o.__vehicleKind==='truck'),sedan=s.__d1Wrecks?.find(o=>o.__vehicleKind==='sedan');
  const probe=s.add.image(-9999,-9999,'c3-atlas',CARD_FRAME('overclock'));fit(probe,112,96);
  const checks={animatedLegs:runFrames===3&&s.__d1AnimatedRunner===true,mechanicalArm:!!s.__d1MechanicalArm&&s.weaponModule===s.weaponV3Gun&&GUN_FRAMES.includes(s.weaponV3Gun.frame?.name),weaponFront:s.weaponV3Gun.depth>s.hero.depth,weaponScale:s.weaponV3Gun.displayWidth<=60&&s.weaponV3Gun.displayHeight<=60,noHandSprites:[s.weaponV3ArmA,s.weaponV3ArmB,s.weaponV3HandA,s.weaponV3HandB,s.weaponArm,s.weaponRig].every(o=>!o||o.visible===false),premiumCards:allHdCards&&probe.texture?.key==='c3-atlas'&&probe.displayWidth>=80,rarityCards:['COMMON','RARE','EPIC','LEGENDARY'].every(r=>rarities.has(r)),roadsVisible:roads.length>200&&near&&roads.every(o=>o.visible&&o.alpha>.95&&o.displayHeight>=145&&o.__terrainSystemObject),vehicleScale:!!truck&&!!sedan&&truck.displayWidth>=330&&sedan.displayWidth>=225&&truck.displayWidth>sedan.displayWidth,characterSystem:s.characterId==='runner'&&s.characterDefinition?.id==='runner'&&s.__characterSystemReady===true};probe.destroy();
  const ok=Object.values(checks).every(Boolean),detail=Object.entries(checks).map(([k,v])=>`${k}=${v?'ok':'FAIL'}`).join(' ');window.__WM_D1_SELF_TEST__={ok,...checks};document.documentElement.dataset.wreckmarchD1SelfTest=ok?'passed':'failed';window.__WM_LOG__?.(`D1 browser self-test ${ok?'PASSED':'FAILED'}: ${detail}`);if(!ok)throw Error('Phase D.1 self-test failed: '+detail)
}

export async function applyPhaseD1(){const s=await getScene();await loadRunnerLocomotionArt(s);installRunnerAndMechanicalArm(s);installMobileHudPolish(s);installVehicleScale(s);installPremiumCards(s);window.__WM_PHASE_D1__=true;document.documentElement.dataset.wreckmarchPhaseD1='active';window.__WM_LOG__?.('Phase D.1 active: Hunter Runner + integrated compact weapon + compact icon rarity cards + visible asphalt + real vehicle scale');selfTest(s);return true}
