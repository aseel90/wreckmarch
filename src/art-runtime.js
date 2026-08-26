import { installScrapRatVisuals } from './enemies/scrap-rat-visuals.js?v=4';

// WRECKMARCH production art runtime v2 — detailed SVG assets rendered as Phaser textures.
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const defs = `
<defs>
  <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#aab2b5"/><stop offset=".48" stop-color="#596267"/><stop offset="1" stop-color="#2a3033"/></linearGradient>
  <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e1994f"/><stop offset=".5" stop-color="#925127"/><stop offset="1" stop-color="#5b2d18"/></linearGradient>
  <linearGradient id="leather" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9b7047"/><stop offset="1" stop-color="#523824"/></linearGradient>
  <radialGradient id="lens"><stop stop-color="#e3fdff"/><stop offset=".42" stop-color="#52ddeb"/><stop offset="1" stop-color="#167d91"/></radialGradient>
</defs>`;

function heroSvg(step = 0) {
  const run = step !== 0;
  const sign = step > 0 ? 1 : -1;
  const bob = run ? 1 : 0;
  const frontLeg = run ? 7 * sign : 0;
  const backLeg = -frontLeg;
  const arm = run ? -7 * sign : 0;
  const scarf = run ? 7 : 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 148">${defs}
  <ellipse cx="63" cy="140" rx="34" ry="6" fill="#000" opacity=".2"/>
  <g transform="translate(0 ${bob})" stroke="#241b18" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="M44 54 C28 ${53-scarf} 17 ${56-scarf} 6 ${65-scarf} C21 ${67-scarf} 32 ${73-scarf} 47 68Z" fill="#ba4b2f"/>
    <path d="M45 61 C29 ${62+scarf/2} 17 ${72+scarf/2} 10 ${79+scarf/2} C27 78 37 79 50 71Z" fill="#8d3427"/>
    <g transform="translate(${backLeg*.48} 0)"><path d="M67 101L83 103 87 127 75 131 64 112Z" fill="#383630"/><path d="M72 124L91 124 97 136 72 140 64 133Z" fill="url(#leather)"/></g>
    <g transform="translate(${frontLeg*.48} 0)"><path d="M45 101L62 103 58 128 44 131 37 111Z" fill="#454139"/><path d="M41 125L61 126 66 137 39 140 32 133Z" fill="url(#leather)"/></g>
    <path d="M37 59Q43 51 55 50L78 51Q91 55 94 69L89 105Q68 112 42 105L33 72Z" fill="#8b6543"/>
    <path d="M49 61L79 61 83 99Q66 104 48 99Z" fill="#263038"/>
    <path d="M51 62L63 78 75 62" fill="none" stroke="#c0874b"/>
    <path d="M39 92H89" stroke="#2a211c" stroke-width="7"/><rect x="58" y="88" width="14" height="10" rx="2" fill="url(#copper)"/>
    <g transform="rotate(${arm/2} 35 70)"><path d="M38 61Q26 64 24 75L19 96 34 100 43 77Z" fill="#8a6543"/><path d="M19 91L35 92 36 102Q25 109 17 100Z" fill="#2b2e31"/><circle cx="26" cy="100" r="6" fill="#302823"/></g>
    <g transform="rotate(${-arm/2} 92 70)"><path d="M89 61Q101 64 103 75L109 96 94 100 86 77Z" fill="#7c5b3d"/><path d="M93 91L109 92 111 101Q102 108 92 101Z" fill="#2b2e31"/><circle cx="101" cy="100" r="6" fill="#302823"/></g>
    <path d="M82 58Q98 57 105 69L100 79 87 75 80 64Z" fill="url(#metal)"/><path d="M88 61L99 66 95 72" fill="none" stroke="#d07b3e" stroke-width="2"/><circle cx="96" cy="68" r="3" fill="#4fd9e8" stroke="none"/>
    <path d="M45 48Q64 42 83 49L88 63Q65 71 40 61Z" fill="#103d48"/><path d="M45 51Q64 47 82 52L83 58Q64 63 43 57Z" fill="#1d7483" stroke="none"/>
    <ellipse cx="64" cy="38" rx="24" ry="25" fill="#e1a773"/><ellipse cx="39" cy="40" rx="5" ry="8" fill="#d29463"/><ellipse cx="89" cy="40" rx="5" ry="8" fill="#d29463"/>
    <path d="M39 31C41 14 48 10 54 13L59 5 66 13 76 3 78 16 91 9 87 25 97 23 87 35Q62 19 39 31Z" fill="#3b281f"/><path d="M45 25L52 13 58 24 66 11 72 25 82 14 80 28" fill="none" stroke="#5a3522" stroke-width="5"/>
    <path d="M48 37L58 34M70 34L80 37"/><ellipse cx="54" cy="41" rx="4.5" ry="5" fill="#f7efe3" stroke="none"/><ellipse cx="75" cy="41" rx="4.5" ry="5" fill="#f7efe3" stroke="none"/><circle cx="55" cy="41" r="2.2" fill="#17191b" stroke="none"/><circle cx="74" cy="41" r="2.2" fill="#17191b" stroke="none"/>
    <path d="M42 48Q63 43 86 48L82 62Q64 69 45 61Z" fill="#123c47"/><path d="M48 51L60 57 64 52 68 57 79 51" fill="none" stroke="#287b89" stroke-width="2"/>
    <path d="M40 21Q64 15 88 21" fill="none" stroke="#5e3f2d" stroke-width="7"/><circle cx="51" cy="21" r="12" fill="#2e3436"/><circle cx="78" cy="21" r="12" fill="#2e3436"/><circle cx="51" cy="21" r="8.5" fill="url(#lens)" stroke="#9a6a40" stroke-width="2"/><circle cx="78" cy="21" r="8.5" fill="url(#lens)" stroke="#9a6a40" stroke-width="2"/><ellipse cx="48" cy="18" rx="3" ry="2" fill="#fff" opacity=".65" stroke="none"/><ellipse cx="75" cy="18" rx="3" ry="2" fill="#fff" opacity=".65" stroke="none"/>
    <path d="M99 86L105 112" stroke="#9da5a7" stroke-width="5"/><path d="M101 84Q108 79 111 85L106 91" fill="none" stroke="#9da5a7" stroke-width="5"/><circle cx="106" cy="115" r="5" fill="none" stroke="#9da5a7" stroke-width="4"/>
  </g></svg>`;
}

const fortressSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 112">${defs}<g stroke="#211a18" stroke-width="4" stroke-linejoin="round"><ellipse cx="88" cy="99" rx="78" ry="8" fill="#000" opacity=".18" stroke="none"/><path d="M12 65L27 42 75 36 101 48 152 48 168 70 161 88 18 88Z" fill="url(#leather)"/><path d="M22 68H160L158 90H18Z" fill="#3a3028"/><path d="M32 40L36 17H72L83 46Z" fill="#72523a"/><rect x="40" y="23" width="28" height="18" rx="3" fill="#252c30"/><rect x="44" y="26" width="20" height="12" rx="2" fill="#48cddd"/><path d="M87 49L98 25H136L151 49Z" fill="url(#metal)"/><rect x="105" y="30" width="25" height="13" rx="3" fill="#173640"/><rect x="109" y="32" width="17" height="9" rx="2" fill="#4ad4e4"/><path d="M143 48L169 38 176 51 160 63M26 71L14 76 8 68 17 58" fill="#536065"/><rect x="79" y="63" width="33" height="17" rx="4" fill="#31251f"/><path d="M82 66H108" stroke="#bf7a41" stroke-width="3"/><circle cx="26" cy="70" r="4" fill="#ffc45a"/><circle cx="152" cy="66" r="5" fill="#ffb950"/><g fill="#d18a48" stroke="none"><circle cx="34" cy="80" r="2"/><circle cx="54" cy="80" r="2"/><circle cx="75" cy="80" r="2"/><circle cx="99" cy="80" r="2"/><circle cx="122" cy="80" r="2"/><circle cx="145" cy="80" r="2"/></g><path d="M75 36L74 3"/><path d="M76 5L104 11 77 23Z" fill="#a93a2e"/><path d="M142 47L147 15" stroke="#3b4143" stroke-width="9"/><path d="M143 13H152" stroke="#171b1c" stroke-width="7"/><rect x="25" y="48" width="28" height="17" rx="3" fill="#5a3c2c"/><path d="M29 52L48 61M48 52L29 61" stroke="#b27b48" stroke-width="2"/><path d="M117 51L138 49 143 65 120 67Z" fill="#556064"/><circle cx="69" cy="49" r="3" fill="#47d9e8" stroke="none"/></g></svg>`;
const turretSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 86 56">${defs}<g stroke="#211a18" stroke-width="3" stroke-linejoin="round"><ellipse cx="27" cy="34" rx="23" ry="18" fill="#242b2f"/><ellipse cx="27" cy="31" rx="17" ry="14" fill="url(#metal)"/><circle cx="24" cy="27" r="4" fill="#4fd8e7"/><path d="M27 25L70 24Q78 25 79 31L71 37 28 36Z" fill="url(#metal)"/><rect x="67" y="24" width="14" height="13" rx="3" fill="url(#copper)"/><rect x="78" y="27" width="8" height="7" rx="2" fill="#171b1d"/></g></svg>`;
const wheelSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#101315" stroke="#201817" stroke-width="3"/><circle cx="20" cy="20" r="12" fill="#3b4347" stroke="#88613f" stroke-width="2"/><circle cx="20" cy="20" r="5" fill="#b16f39"/><path d="M20 9V31M9 20H31M12 12L28 28M28 12L12 28" stroke="#697276" stroke-width="2"/></svg>`;
const wastelandSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#342a23"/><stop offset=".45" stop-color="#2b2f33"/><stop offset="1" stop-color="#1d232a"/></linearGradient></defs><rect width="512" height="512" fill="url(#g)"/><g fill="#806246" opacity=".38"><path d="M54 80l22-6 9 11-13 15-26-4zM390 61l16-9 21 8-5 15-26 7zM210 180l19-4 8 13-12 10-20-6zM70 382l15-8 18 5 1 14-28 6zM414 340l23-7 10 17-13 12-21-4z"/></g><g fill="#566069" opacity=".3"><rect x="124" y="47" width="30" height="7" rx="2" transform="rotate(25 124 47)"/><rect x="303" y="112" width="23" height="6" rx="2" transform="rotate(-38 303 112)"/><rect x="172" y="328" width="35" height="8" rx="2" transform="rotate(13 172 328)"/><circle cx="341" cy="412" r="9"/><circle cx="102" cy="247" r="6"/></g></svg>`;
const scrapPileSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64"><g stroke="#211b18" stroke-width="3"><ellipse cx="48" cy="55" rx="40" ry="6" fill="#000" opacity=".2" stroke="none"/><circle cx="25" cy="43" r="14" fill="#252b2f"/><circle cx="25" cy="43" r="7" fill="#5b6467"/><rect x="39" y="32" width="28" height="19" rx="4" fill="#744a31" transform="rotate(-8 39 32)"/><path d="M46 36L61 47M61 36L46 47" stroke="#c17b40"/><path d="M61 38L80 25 87 31 71 48Z" fill="#4f595c"/></g></svg>`;
const barrelSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64"><g stroke="#221a18" stroke-width="3"><ellipse cx="24" cy="55" rx="18" ry="5" fill="#000" opacity=".18" stroke="none"/><path d="M10 12Q24 5 38 12L36 53Q24 60 12 53Z" fill="#7f4931"/><ellipse cx="24" cy="12" rx="14" ry="5" fill="#a26239"/><path d="M11 24H37M12 44H36" stroke="#394043" stroke-width="6"/><path d="M18 31L29 37M29 31L18 37" stroke="#e2a24f"/></g></svg>`;

async function getScene(timeoutMs = 9000) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const game = window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.hero && scene.cart) return scene;
    await wait(60);
  }
  throw new Error('Timed out waiting for Wreckmarch scene');
}

function loadSvgPack(scene) {
  const files = {
    'art-hero-idle-0': heroSvg(0), 'art-hero-idle-1': heroSvg(0),
    'art-hero-run-0': heroSvg(-1), 'art-hero-run-1': heroSvg(1),
    'art-fortress-body': fortressSvg(), 'art-turret': turretSvg(), 'art-wheel': wheelSvg(),
    'art-wasteland': wastelandSvg(), 'art-scrap-pile': scrapPileSvg(), 'art-barrel': barrelSvg()
  };
  return new Promise((resolve, reject) => {
    const urls = [];
    let failed = false;
    const fail = file => {
      if (failed) return; failed = true;
      urls.forEach(URL.revokeObjectURL);
      reject(new Error(`Art asset failed: ${file?.key || 'unknown'}`));
    };
    scene.load.once('loaderror', fail);
    scene.load.once('complete', () => {
      scene.load.off('loaderror', fail);
      urls.forEach(URL.revokeObjectURL);
      if (!failed) resolve();
    });
    Object.entries(files).forEach(([key, svg]) => {
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      urls.push(url); scene.load.svg(key, url);
    });
    scene.load.start();
  });
}

function rebuildAnimations(scene) {
  ['hero-run', 'hero-idle'].forEach(key => scene.anims.exists(key) && scene.anims.remove(key));
  scene.anims.create({ key: 'hero-run', frames: [{key:'art-hero-run-0'},{key:'art-hero-run-1'}], frameRate: 9, repeat: -1 });
  scene.anims.create({ key: 'hero-idle', frames: [{key:'art-hero-idle-0'},{key:'art-hero-idle-1'}], frameRate: 2, repeat: -1 });
}

function applyHero(scene) {
  scene.hero.stop();
  scene.hero.setTexture('art-hero-idle-0').setScale(.78).setOrigin(.5, .52).play('hero-idle', true);
  scene.hero.body.setCircle(25, 39, 88);
  scene.heroShadow.setScale(1.08, .9).setAlpha(.34);
  const originalMove = scene.updateMovement.bind(scene);
  scene.updateMovement = function(time) {
    originalMove(time);
    const moving = this.move.lengthSq() > .05;
    this.heroShadow.setPosition(this.hero.x, this.hero.y + 50).setScale(moving ? 1.12 : 1.04, moving ? .82 : .9);
  };
}

function applyFortress(scene) {
  scene.cart.setScale(.82);
  scene.cartBody.setTexture('art-fortress-body').setPosition(0, 0);
  [[-58,41],[-20,42],[22,42],[59,41]].forEach((p,i) => scene.cartWheels[i].setTexture('art-wheel').setPosition(...p).setScale(1));
  scene.turrets.forEach((turret,i) => { turret.setTexture('art-turret').setOrigin(.28,.55).setScale(.88); if (!i) turret.setPosition(18,-30); });
  scene.cartShadow.setPosition(0, 38).setScale(1.35, 1.15);
  scene.cartCore.setCircle(42); scene.cartCore.body.setOffset(-4,-4);
  scene.addTurret = function(x,y) {
    const turret = this.add.image(x,y,'art-turret').setOrigin(.28,.55).setScale(.88);
    this.cart.add(turret); this.turrets.push(turret); this.weaponLevel=this.turrets.length;
    this.cameras?.main?.flash(90,240,180,88,false); this.playTone?.(310,.045,'square',.025);
  };
  scene.updateFortress = function(dt,time) {
    const desiredX = Phaser.Math.Clamp(this.hero.x - this.move.x * 92, 74, 466);
    const desiredY = Phaser.Math.Clamp(this.hero.y - this.move.y * 86 - 92, 150, 740);
    const follow = 1 - Math.pow(.001,dt);
    this.cart.x=Phaser.Math.Linear(this.cart.x,desiredX,follow*.27); this.cart.y=Phaser.Math.Linear(this.cart.y,desiredY,follow*.27);
    this.cart.rotation=Phaser.Math.Linear(this.cart.rotation,this.move.x*.025,.08);
    const rolling=Phaser.Math.Clamp(this.move.length(),0,1);
    this.cartWheels.forEach((w,i)=>w.rotation+=.055+rolling*.12*(i%2?1:.95));
    this.cartBody.y=Math.sin(time*.012)*(1+rolling*1.2);
    this.cartCore.setPosition(this.cart.x,this.cart.y); this.cartCore.body.updateFromGameObject();
    if(time>this.lastSmokeAt+(rolling?180:420)){this.lastSmokeAt=time;this.spawnSmoke(this.cart.x+47,this.cart.y-34);if(rolling)this.spawnDust(this.cart.x-42,this.cart.y+40,.95);}
    const target=this.weaponSystem?.acquireTarget?.(this.cart.x,this.cart.y,430)||null;
    if(target){const angle=Phaser.Math.Angle.Between(this.cart.x,this.cart.y-18,target.x,target.y);this.turrets.forEach(t=>t.rotation=Phaser.Math.Angle.RotateTo(t.rotation,angle-this.cart.rotation,.14));}
  };
}

function enrichWorld(scene) {
  const texture=scene.add.tileSprite(270,510,540,900,'art-wasteland').setDepth(1).setAlpha(.24).setTint(0xe8c49a);
  texture.setBlendMode(Phaser.BlendModes.MULTIPLY);
  [[88,190,'art-scrap-pile',.62,.08],[448,262,'art-barrel',.62,-.12],[92,504,'art-barrel',.5,.18],[445,602,'art-scrap-pile',.6,-.08],[116,770,'art-scrap-pile',.54,.12],[424,825,'art-barrel',.48,-.16]].forEach(([x,y,key,s,r])=>scene.add.image(x,y,key).setDepth(2).setScale(s).setRotation(r).setAlpha(.68));
}

export async function applyProductionArt() {
  const scene=await getScene(); await loadSvgPack(scene); rebuildAnimations(scene); await installScrapRatVisuals(scene); applyHero(scene); applyFortress(scene); enrichWorld(scene);
  scene.cart.setPosition(scene.hero.x,Math.max(170,scene.hero.y-105));
  window.__WM_ART_V2__=true; document.documentElement.dataset.wreckmarchArt='v2';
  window.__WM_LOG__?.('Art pack v2 applied: Runner + production Scrap Rat + Fortress + wasteland');
  return true;
}
