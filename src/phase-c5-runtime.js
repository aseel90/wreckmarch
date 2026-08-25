/* WRECKMARCH Phase C.5 — directional hero body + high-res upgrade art + visible road network */
import { C5_CARD_ART, C5_GROUND, C5_ROAD } from './c5-assets.js?v=1';

const WORLD_W = 2200, WORLD_H = 2200;
const wait = ms => new Promise(r => setTimeout(r, ms));
const CARD_IDS = [
  'heavy-rivets','overclock','long-barrel','twin-riveter','fleet-feet',
  'scrap-magnet','armor-plate','call-rig','rig-overdrive','twin-cannon'
];
const CATEGORY_COLORS = { HERO:0xd98446, UTILITY:0x4fc8d8, FORTRESS:0xd4ad62, EVOLUTION:0x9d6be8 };
const HERO_ORIGIN = { x:64, y:77 };

async function getScene(timeoutMs=9000){
  const start=performance.now();
  while(performance.now()-start<timeoutMs){
    const game=window.Phaser?.GAMES?.find(Boolean)||window.Phaser?.GAMES?.[0];
    const s=game?.scene?.getScene?.('Wreckmarch');
    if(s?.sys?.isActive?.()&&s.hero&&s.weaponV3Gun&&s.upgradeLevels&&window.__WM_PHASE_C4__) return s;
    await wait(50);
  }
  throw Error('Phase C.5 scene timeout');
}
function fitFrame(img,maxW,maxH){
  const w=img.frame?.realWidth||img.width||1,h=img.frame?.realHeight||img.height||1;
  const z=Math.min(maxW/w,maxH/h); img.setDisplaySize(w*z,h*z);
}
function aimIndex(a){return Math.round(Phaser.Math.Angle.Normalize(a)/(Math.PI/4))%8}
function addDataImage(scene,key,b64,mime='image/webp'){
  if(scene.textures.exists(key)) return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{try{scene.textures.addImage(key,img);resolve()}catch(e){reject(e)}};
    img.onerror=()=>reject(Error('Failed to decode '+key));
    img.src=`data:${mime};base64,${b64}`;
  });
}

const HERO_GRIPS = [
  [79,77], [78,84], [66,90], [50,84], [49,77], [50,68], [64,64], [78,68]
];
const GUN_CFG = [
  {frame:'gun_e.png', origin:[.26,.70], max:[94,68], depth:31},
  {frame:'gun_se.png',origin:[.27,.28], max:[86,78], depth:31},
  {frame:'gun_s.png', origin:[.50,.18], max:[50,84], depth:31},
  {frame:'gun_sw.png',origin:[.73,.27], max:[86,78], depth:31},
  {frame:'gun_w.png', origin:[.74,.70], max:[94,68], depth:31},
  {frame:'gun_nw.png',origin:[.72,.72], max:[86,78], depth:22},
  {frame:'gun_n.png', origin:[.50,.82], max:[50,84], depth:22},
  {frame:'gun_ne.png',origin:[.28,.72], max:[86,78], depth:22}
];

function heroPoseSvg(q){
  const mirror = q===3||q===4||q===5;
  const baseQ = mirror ? (8-q)%8 : q;
  const isBack = baseQ===6||baseQ===7;
  const isSide = baseQ===0;
  const grip = HERO_GRIPS[mirror ? (8-baseQ)%8 : baseQ];
  const g = mirror ? `transform="translate(128 0) scale(-1 1)"` : '';
  const gx = mirror ? 128-grip[0] : grip[0], gy=grip[1];
  const shoulder = isSide ? [80,72] : isBack ? [78,69] : [79,72];
  const sx=shoulder[0], sy=shoulder[1];
  const face = isBack ? `
    <path d="M45 24Q64 12 87 25L89 49Q66 57 42 48Z" fill="#3b281f"/>
    <path d="M43 24Q65 18 88 25" fill="none" stroke="#674a35" stroke-width="7"/>
    <ellipse cx="52" cy="25" rx="10" ry="8" fill="#2e3436"/><ellipse cx="78" cy="25" rx="10" ry="8" fill="#2e3436"/>
    <rect x="48" y="23" width="34" height="5" rx="2" fill="#5b4030"/>
  ` : isSide ? `
    <ellipse cx="69" cy="39" rx="22" ry="24" fill="#e1a773"/>
    <path d="M46 30C49 15 60 8 72 12L79 5 82 17 93 12 88 28 97 27 87 38Q70 24 46 30Z" fill="#3b281f"/>
    <ellipse cx="78" cy="41" rx="5" ry="5.5" fill="#f7efe3"/><circle cx="80" cy="41" r="2.3" fill="#17191b"/>
    <path d="M52 22Q70 16 88 22" fill="none" stroke="#5e3f2d" stroke-width="7"/>
    <circle cx="64" cy="22" r="11" fill="#2e3436"/><circle cx="64" cy="22" r="8" fill="#52ddeb" stroke="#9a6a40" stroke-width="2"/>
    <path d="M51 50Q72 46 89 50L86 62Q68 68 51 61Z" fill="#123c47"/>
  ` : `
    <ellipse cx="64" cy="39" rx="24" ry="25" fill="#e1a773"/>
    <ellipse cx="39" cy="40" rx="5" ry="8" fill="#d29463"/><ellipse cx="89" cy="40" rx="5" ry="8" fill="#d29463"/>
    <path d="M39 31C41 14 48 10 54 13L59 5 66 13 76 3 78 16 91 9 87 25 97 23 87 35Q62 19 39 31Z" fill="#3b281f"/>
    <ellipse cx="54" cy="41" rx="4.5" ry="5" fill="#f7efe3"/><ellipse cx="75" cy="41" rx="4.5" ry="5" fill="#f7efe3"/><circle cx="55" cy="41" r="2.2" fill="#17191b"/><circle cx="74" cy="41" r="2.2" fill="#17191b"/>
    <path d="M42 48Q63 43 86 48L82 62Q64 69 45 61Z" fill="#123c47"/><path d="M48 51L60 57 64 52 68 57 79 51" fill="none" stroke="#287b89" stroke-width="2"/>
    <path d="M40 21Q64 15 88 21" fill="none" stroke="#5e3f2d" stroke-width="7"/>
    <circle cx="51" cy="21" r="12" fill="#2e3436"/><circle cx="78" cy="21" r="12" fill="#2e3436"/><circle cx="51" cy="21" r="8.5" fill="#52ddeb" stroke="#9a6a40" stroke-width="2"/><circle cx="78" cy="21" r="8.5" fill="#52ddeb" stroke="#9a6a40" stroke-width="2"/>
  `;
  const backTorso = isBack ? '#6f543c' : '#8b6543';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 148">
  <defs><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#aab2b5"/><stop offset=".5" stop-color="#596267"/><stop offset="1" stop-color="#2a3033"/></linearGradient><linearGradient id="copper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e1994f"/><stop offset=".5" stop-color="#925127"/><stop offset="1" stop-color="#5b2d18"/></linearGradient></defs>
  <g ${g} stroke="#241b18" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="64" cy="140" rx="34" ry="6" fill="#000" opacity=".2" stroke="none"/>
    <path d="M45 56C30 50 17 55 7 64 21 67 34 72 48 69Z" fill="#ba4b2f"/>
    <path d="M45 64C31 65 18 73 11 79 28 78 38 80 50 72Z" fill="#8d3427"/>
    <path d="M67 101L83 103 87 127 75 131 64 112Z" fill="#383630"/><path d="M72 124L91 124 97 136 72 140 64 133Z" fill="#8b6543"/>
    <path d="M45 101L62 103 58 128 44 131 37 111Z" fill="#454139"/><path d="M41 125L61 126 66 137 39 140 32 133Z" fill="#8b6543"/>
    <path d="M37 59Q43 51 55 50L78 51Q91 55 94 69L89 105Q68 112 42 105L33 72Z" fill="${backTorso}"/>
    <path d="M49 61L79 61 83 99Q66 104 48 99Z" fill="#263038"/><path d="M51 62L63 78 75 62" fill="none" stroke="#c0874b"/>
    <path d="M39 92H89" stroke="#2a211c" stroke-width="7"/><rect x="58" y="88" width="14" height="10" rx="2" fill="url(#copper)"/>
    <path d="M38 62Q27 66 24 78L19 96 34 100 43 77Z" fill="#8a6543"/><path d="M19 91L35 92 36 102Q25 109 17 100Z" fill="#2b2e31"/><circle cx="26" cy="100" r="6" fill="#302823"/>
    <path d="M99 86L105 112" stroke="#9da5a7" stroke-width="5"/><path d="M101 84Q108 79 111 85L106 91" fill="none" stroke="#9da5a7" stroke-width="5"/><circle cx="106" cy="115" r="5" fill="none" stroke="#9da5a7" stroke-width="4"/>
    <path d="M82 58Q98 57 105 69L100 79 87 75 80 64Z" fill="url(#metal)"/><circle cx="96" cy="68" r="3" fill="#4fd9e8" stroke="none"/>
    <path d="M${sx} ${sy} Q${(sx+gx)/2+2} ${(sy+gy)/2} ${gx} ${gy}" fill="none" stroke="#7c5b3d" stroke-width="13"/>
    <path d="M${sx} ${sy} Q${(sx+gx)/2+2} ${(sy+gy)/2} ${gx} ${gy}" fill="none" stroke="#2b2e31" stroke-width="5"/>
    <circle cx="${gx}" cy="${gy}" r="6" fill="#d79a68"/>
    ${face}
  </g></svg>`;
}

async function loadC5Assets(s){
  const jobs=[];
  CARD_IDS.forEach(id=>{
    const sourceId=id==='twin-cannon'?'twin-cannon':id;
    const b64=C5_CARD_ART[sourceId]||C5_CARD_ART['overclock'];
    jobs.push(addDataImage(s,`c5-card-${id}`,b64,'image/webp'));
  });
  jobs.push(addDataImage(s,'c5-ground',C5_GROUND,'image/png'));
  jobs.push(addDataImage(s,'c5-road',C5_ROAD,'image/png'));
  await Promise.all(jobs);
  const missing=[];
  for(let q=0;q<8;q++) if(!s.textures.exists(`c5-hero-${q}`)) missing.push(q);
  if(missing.length){
    await new Promise((resolve,reject)=>{
      const urls=[]; let failed=false;
      const fail=file=>{if(failed)return;failed=true;urls.forEach(URL.revokeObjectURL);reject(Error('C5 hero SVG failed '+(file?.key||'')))};
      s.load.once('loaderror',fail);
      s.load.once('complete',()=>{s.load.off('loaderror',fail);urls.forEach(URL.revokeObjectURL);if(!failed)resolve()});
      missing.forEach(q=>{const url=URL.createObjectURL(new Blob([heroPoseSvg(q)],{type:'image/svg+xml'}));urls.push(url);s.load.svg(`c5-hero-${q}`,url)});
      s.load.start();
    });
  }
}

function installDirectionalHero(s){
  [s.weaponV3ArmA,s.weaponV3ArmB,s.weaponV3HandA,s.weaponV3HandB,s.weaponArm,s.weaponRig,s.aimPose].forEach(o=>o?.setVisible?.(false));
  s.weaponSprite=s.weaponV3Gun;
  s.weaponV3Gun.setVisible(true).clearTint?.();
  s.__c5Pose=-1;
  s.__c5Muzzle=new Phaser.Math.Vector2();
  s.__c5Grip=new Phaser.Math.Vector2();
  s.hero.stop();
  s.hero.setFlipX(false).setOrigin(.5,.52).setScale(.70).setTexture('c5-hero-0');
  s.heroFacingPose=0;

  s.updateWeaponPose=function(){
    const q=aimIndex(this.weaponAim), cfg=GUN_CFG[q], gripPx=HERO_GRIPS[q];
    if(q!==this.__c5Pose){
      this.__c5Pose=q; this.heroFacingPose=q;
      this.hero.stop().setTexture(`c5-hero-${q}`).setFlipX(false).setOrigin(.5,.52).setScale(.70);
      this.weaponV3Gun.setTexture('c3-atlas',cfg.frame).setCrop();
      fitFrame(this.weaponV3Gun,cfg.max[0],cfg.max[1]);
      this.weaponV3Gun.setOrigin(cfg.origin[0],cfg.origin[1]);
    }
    this.hero.stop(); this.hero.setFlipX(false);
    const sx=Math.abs(this.hero.scaleX||.70), sy=Math.abs(this.hero.scaleY||.70);
    const gx=this.hero.x+(gripPx[0]-HERO_ORIGIN.x)*sx;
    const gy=this.hero.y+(gripPx[1]-HERO_ORIGIN.y)*sy;
    this.__c5Grip.set(gx,gy);
    const a=q*Math.PI/4, recoil=this.weaponV3Recoil||0;
    const ux=Math.cos(a),uy=Math.sin(a);
    this.weaponV3Gun.setPosition(gx-ux*recoil*3.2,gy-uy*recoil*3.2).setDepth(cfg.depth);
    const muzzleDist=(q%2?60:64);
    this.__c5Muzzle.set(gx+ux*muzzleDist,gy+uy*muzzleDist);
    this.visualAimAngle=a;
    this.weaponV3Recoil*=.70;
    this.__c4Grip?.copy?.(this.__c5Grip); this.__c4Muzzle?.copy?.(this.__c5Muzzle);
  };
  s.getWeaponMuzzle=function(spread=0){
    if(Math.abs(spread)<.0001) return this.__c5Muzzle.clone();
    const a=this.__c5Pose*Math.PI/4+spread;
    return new Phaser.Math.Vector2(this.__c5Grip.x+Math.cos(a)*64,this.__c5Grip.y+Math.sin(a)*64);
  };
  s.updateWeaponPose();
}

function destroyOldTerrain(s){
  s.__c4Terrain?.forEach?.(o=>o?.destroy?.());
  s.__c4RoadSegments?.forEach?.(o=>o?.destroy?.());
  s.__c5Terrain?.forEach?.(o=>o?.destroy?.());
  for(const o of [...s.children.list]){
    if(o?.name?.startsWith?.('c4-road')||o?.name?.startsWith?.('c5-road')||o?.name==='c4-ground-base'||o?.name==='c4-ground-wash'||o?.name==='c5-ground-base'||o?.name==='c5-ground-variation') o.destroy();
  }
}
function roadSpline(s,points,name){
  const curve=new Phaser.Curves.Spline(points);
  const pts=curve.getSpacedPoints(30);
  const out=[];
  for(let i=0;i<pts.length-1;i++){
    const a=pts[i],b=pts[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
    const im=s.add.image((a.x+b.x)/2,(a.y+b.y)/2,'c5-road').setDepth(-8).setName(name).setAlpha(.98);
    im.setDisplaySize(Math.max(92,len+30),104).setRotation(Math.atan2(dy,dx));
    out.push(im);
  }
  return out;
}
function buildVisibleTerrain(s){
  destroyOldTerrain(s);
  s.__c5Terrain=[];
  const base=s.add.tileSprite(WORLD_W/2,WORLD_H/2,WORLD_W,WORLD_H,'c5-ground').setDepth(-11).setName('c5-ground-base');
  base.tileScaleX=1; base.tileScaleY=1;
  const variation=s.add.tileSprite(WORLD_W/2,WORLD_H/2,WORLD_W,WORLD_H,'c5-ground').setDepth(-10).setName('c5-ground-variation').setAlpha(.17);
  variation.tilePositionX=131; variation.tilePositionY=79; variation.setTint(0x9a7b63);
  s.__c5Terrain.push(base,variation);
  const paths=[
    [[-120,1030],[350,970],[760,1080],[1110,1030],[1510,1130],[1900,1040],[2320,960]],
    [[-120,430],[360,560],[780,500],[1160,610],[1600,530],[2320,600]],
    [[-120,1770],[380,1610],[800,1690],[1180,1600],[1580,1460],[1900,1560],[2320,1660]],
    [[340,-120],[460,340],[410,760],[520,1120],[430,1580],[560,1900],[470,2320]],
    [[1740,-120],[1610,360],[1770,760],[1660,1120],[1810,1500],[1660,1880],[1770,2320]]
  ];
  s.__c5RoadSegments=[];
  paths.forEach((p,i)=>s.__c5RoadSegments.push(...roadSpline(s,p.map(([x,y])=>new Phaser.Math.Vector2(x,y)),`c5-road-${i}`)));
  s.__c5Terrain.push(...s.__c5RoadSegments);
  for(let i=0;i<56;i++){
    const x=Phaser.Math.Between(60,WORLD_W-60),y=Phaser.Math.Between(70,WORLD_H-70);
    const d=s.add.ellipse(x,y,Phaser.Math.Between(22,78),Phaser.Math.Between(10,34),0x16120f,Phaser.Math.FloatBetween(.05,.12)).setDepth(-7).setRotation(Phaser.Math.FloatBetween(0,Math.PI));
    s.__c5Terrain.push(d);
  }
  s.__c5RoadNetwork=true;
}

function categoryColor(category){return CATEGORY_COLORS[category]||CATEGORY_COLORS.HERO}
class UpgradeSceneV3 extends Phaser.Scene{
  constructor(){super('UpgradeSceneV3')}
  init(data){this.payload=data||{};this.selectedIndex=0;this.locked=false;this.cardViews=[]}
  create(){
    const {gameScene,choices=[],level=1}=this.payload; this.gameScene=gameScene; this.choices=choices;
    const W=this.scale.width,H=this.scale.height;
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.add.rectangle(W/2,H/2,W,H,0x05080c,.94);
    this.add.text(W/2,22,`LEVEL ${level}`,{fontFamily:'Arial Black, Arial',fontSize:'13px',color:'#55d8e5'}).setOrigin(.5);
    this.add.text(W/2,49,'CHOOSE YOUR UPGRADE',{fontFamily:'Arial Black, Arial',fontSize:'25px',color:'#f1d09a'}).setOrigin(.5);
    this.add.text(W/2,74,'Build the run. Change the machine.',{fontFamily:'Arial',fontSize:'11px',color:'#8a96a0'}).setOrigin(.5);
    const margin=Phaser.Math.Clamp(W*.045,28,48),gap=Phaser.Math.Clamp(W*.018,12,20);
    const cardW=Math.min(308,(W-margin*2-gap*2)/3),cardH=Math.min(370,H-114),total=cardW*3+gap*2,start=(W-total)/2+cardW/2;
    choices.forEach((u,i)=>this.createCard(start+i*(cardW+gap),H*.59,cardW,cardH,u,i));
    this.refreshSelection();
    this.input.keyboard?.on('keydown-LEFT',()=>this.moveSelection(-1));this.input.keyboard?.on('keydown-RIGHT',()=>this.moveSelection(1));
    this.input.keyboard?.on('keydown-ENTER',()=>this.choose(this.selectedIndex));this.input.keyboard?.on('keydown-SPACE',()=>this.choose(this.selectedIndex));
    this.input.keyboard?.on('keydown-ONE',()=>this.choose(0));this.input.keyboard?.on('keydown-TWO',()=>this.choose(1));this.input.keyboard?.on('keydown-THREE',()=>this.choose(2));
  }
  createCard(x,y,cardW,cardH,u,index){
    const accent=categoryColor(u.category),group=this.add.container(x,y).setDepth(5);
    const shadow=this.add.rectangle(7,9,cardW,cardH,0x000000,.38);
    const bg=this.add.rectangle(0,0,cardW,cardH,0x151b22,.995).setStrokeStyle(2,accent,.82);
    const strip=this.add.rectangle(0,-cardH/2+7,cardW,14,accent,.96);
    const category=this.add.text(-cardW/2+17,-cardH/2+28,u.category,{fontFamily:'Arial Black, Arial',fontSize:'10px',color:Phaser.Display.Color.IntegerToColor(accent).rgba}).setOrigin(0,.5);
    const artH=Math.min(176,cardH*.43), artY=-cardH*.18;
    const artBg=this.add.rectangle(0,artY,cardW-26,artH,0x0b1015,.72).setStrokeStyle(1.5,accent,.34);
    const textureKey=`c5-card-${u.id}`;
    const art=this.add.image(0,artY, this.textures.exists(textureKey)?textureKey:'c5-card-overclock');
    const fw=art.frame?.realWidth||512,fh=art.frame?.realHeight||360,z=Math.min((cardW-38)/fw,(artH-10)/fh);
    art.setDisplaySize(fw*z,fh*z);
    const title=this.add.text(0,cardH*.08,u.title,{fontFamily:'Arial Black, Arial',fontSize:`${Math.max(15,Math.min(20,cardW/14))}px`,color:'#f2f4f6',align:'center',wordWrap:{width:cardW-30}}).setOrigin(.5);
    const desc=this.add.text(0,cardH*.23,u.desc,{fontFamily:'Arial',fontSize:'12px',color:'#b3bdc6',align:'center',wordWrap:{width:cardW-36},lineSpacing:2}).setOrigin(.5,0);
    const level=this.gameScene?.upgradeLevels?.[u.id]||0;
    const footer=this.add.text(0,cardH/2-23,level>0?`CURRENT  LV ${level}`:'NEW UPGRADE',{fontFamily:'Arial Black, Arial',fontSize:'9px',color:'#77838d'}).setOrigin(.5);
    const hit=this.add.zone(0,0,cardW,cardH).setInteractive({useHandCursor:true});
    hit.on('pointerover',()=>{this.selectedIndex=index;this.refreshSelection()}); hit.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();this.choose(index)});
    group.add([shadow,bg,strip,category,artBg,art,title,desc,footer,hit]); this.cardViews.push({group,bg,strip,art,accent});
  }
  moveSelection(d){if(!this.choices.length||this.locked)return;this.selectedIndex=(this.selectedIndex+d+this.choices.length)%this.choices.length;this.refreshSelection()}
  refreshSelection(){this.cardViews.forEach((v,i)=>{const sel=i===this.selectedIndex;v.group.setScale(sel?1.025:1);v.bg.setStrokeStyle(sel?4:2,v.accent,sel?1:.74);v.strip.setAlpha(sel?1:.84);v.art.setAlpha(sel?1:.94)})}
  choose(i){if(this.locked||!this.choices[i])return;this.locked=true;this.choices[i].apply();this.cameras.main.flash(70,75,198,215,false);this.time.delayedCall(80,()=>this.gameScene?.closeUpgradeCards?.())}
}
function installHiResUpgradeScene(s){
  if(!s.game.scene.getScene('UpgradeSceneV3')) s.game.scene.add('UpgradeSceneV3',UpgradeSceneV3,false);
  const oldOpen=s.openUpgradeCards.bind(s), oldClose=s.closeUpgradeCards.bind(s);
  s.openUpgradeCards=function(){
    if(this.upgradeOpen||this.gameOver)return;
    const plugin=this.scene,launch=plugin.launch.bind(plugin),bring=plugin.bringToTop.bind(plugin);
    plugin.launch=(key,data)=>launch(key==='UpgradeSceneV2'?'UpgradeSceneV3':key,data);
    plugin.bringToTop=key=>bring(key==='UpgradeSceneV2'?'UpgradeSceneV3':key);
    try{oldOpen()}finally{plugin.launch=launch;plugin.bringToTop=bring}
  };
  s.closeUpgradeCards=function(){this.scene.stop('UpgradeSceneV3');oldClose()};
}

function selfTest(s){
  if(new URLSearchParams(location.search).get('autotest')!=='1')return;
  const oldAim=s.weaponAim;
  const poses=[];
  [0,2,4,6].forEach(q=>{s.weaponAim=q*Math.PI/4;s.updateWeaponPose();poses.push(s.hero.texture.key===`c5-hero-${q}`&&s.heroFacingPose===q&&s.hero.flipX===false)});
  s.weaponAim=oldAim;s.updateWeaponPose();
  const hiResCards=CARD_IDS.every(id=>{const t=s.textures.get(`c5-card-${id}`);const src=t?.source?.[0];return (src?.width||0)>=512&&(src?.height||0)>=360});
  const groundSrc=s.textures.get('c5-ground')?.source?.[0], roadSrc=s.textures.get('c5-road')?.source?.[0];
  const roadCount=s.__c5RoadSegments?.length||0;
  const nearCenter=s.__c5RoadSegments?.some(im=>Phaser.Math.Distance.Between(im.x,im.y,WORLD_W/2,WORLD_H/2)<190);
  const checks={
    bodyAim:poses.every(Boolean),
    noThirdHand:[s.weaponV3ArmA,s.weaponV3ArmB,s.weaponV3HandA,s.weaponV3HandB,s.aimPose].every(o=>!o||o.visible===false),
    cardArtHiRes:hiResCards,
    groundHiRes:(groundSrc?.width||0)>=256&&(groundSrc?.height||0)>=256,
    roadTextureHiRes:(roadSrc?.width||0)>=256&&(roadSrc?.height||0)>=100,
    roadNetwork:roadCount>120&&!!nearCenter,
    roadsVisible:s.__c5RoadSegments?.every(im=>im.visible&&im.alpha>.9&&im.displayHeight>=90)
  };
  const ok=Object.values(checks).every(Boolean),detail=Object.entries(checks).map(([k,v])=>`${k}=${v?'ok':'FAIL'}`).join(' ');
  window.__WM_C5_SELF_TEST__={ok,...checks};document.documentElement.dataset.wreckmarchC5SelfTest=ok?'passed':'failed';
  window.__WM_LOG__?.(`C5 browser self-test ${ok?'PASSED':'FAILED'}: ${detail}`); if(!ok)throw Error('Phase C.5 self-test failed: '+detail);
}

export async function applyPhaseC5(){
  const s=await getScene(); await loadC5Assets(s); installDirectionalHero(s); buildVisibleTerrain(s); installHiResUpgradeScene(s);
  window.__WM_PHASE_C5__=true;document.documentElement.dataset.wreckmarchPhaseC5='active';
  window.__WM_LOG__?.('Phase C.5 active: directional hero body + high-res upgrade art + visible PNG road network');
  selfTest(s); return true;
}
