import { RUN_BALANCE } from './balance/run-balance.js?v=6';
import { createRegisteredStatUpgradeChoice, createRegisteredUpgradeChoice } from './upgrades/upgrade-runtime.js?v=9';
import { rollUpgradeChoices } from './upgrades/upgrade-roll-service.js?v=2';

/* WRECKMARCH — Phase C: combat correction + Scrap level/card loop + optional Rig */

const WORLD_W = 2200, WORLD_H = 2200;
const wait = ms => new Promise(r => setTimeout(r, ms));

function worldScene() {
  return window.__WM_GAME__?.scene?.getScene?.('Wreckmarch') || null;
}

async function getScene() {
  for (let i = 0; i < 80; i++) {
    const s = worldScene();
    if (s?.hero && s?.enemies && s?.bullets) return s;
    await wait(100);
  }
  throw Error('Phase C: Wreckmarch scene unavailable');
}

function ensureTexture(s,key,w,h,draw){
  if(s.textures.exists(key))return;
  const g=s.make.graphics({add:false}); draw(g,w,h); g.generateTexture(key,w,h); g.destroy();
}

function makeAssets(s){
  ensureTexture(s,'c-scrap',28,28,(g)=>{g.fillStyle(0x0a1217,1).fillCircle(14,14,13);g.lineStyle(2,0x68d9df,.75).strokeCircle(14,14,12);g.fillStyle(0xd18a45,1).fillRect(8,11,12,6);g.fillStyle(0xf1c16d,1).fillRect(11,7,6,14);});
  ensureTexture(s,'c-shot',20,8,(g)=>{g.fillStyle(0xf6d283,1).fillRoundedRect(0,1,18,6,3);g.fillStyle(0xffffff,.8).fillRect(2,2,7,2);});
}

function cleanupLegacyEnemies(s){
  (s.enemies?.getChildren?.()||[]).forEach(e=>{if(!e?.active)return; if(!e.enemyId){e.__wmLegacy=true;e.destroy();}});
}

function installWorldBounds(s){
  s.physics.world.setBounds(0,0,WORLD_W,WORLD_H);
  s.cameras.main.setBounds(0,0,WORLD_W,WORLD_H);
  s.hero.setCollideWorldBounds(true);
}

function installWeaponRig(scene) {
  scene.primaryWeapon = {
    ...(scene.primaryWeapon || {}),
    damage: scene.primaryWeapon.damage || scene.damage || 24,
    fireDelay: scene.primaryWeapon.fireDelay || scene.fireDelay || 390,
    projectileSpeed: scene.primaryWeapon.projectileSpeed || 720,
    range: scene.primaryWeapon.range || 570,
    pierceCount: Math.max(0, Math.floor(Number(scene.primaryWeapon.pierceCount) || 0)),
    ricochetCount: Math.max(0, Math.floor(Number(scene.primaryWeapon.ricochetCount) || 0))
  };
  scene.twinShots = scene.twinShots || 1;

  scene.weaponSystem?.configureHero?.({
    muzzleResolver: spread => scene.weaponMuzzleResolver?.(spread) || scene.weaponSystem.getMuzzle(spread),
    fireFeedback: ({ muzzle, shots }) => {
      scene.spawnMuzzleFx?.(muzzle?.x, muzzle?.y);
      shots?.forEach(({ bullet }) => bullet?.setTexture?.('c-shot'));
    }
  });
}

function createUpgradePool(scene) {
  return [
    createRegisteredStatUpgradeChoice(scene, 'heavy-rivets', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'overclock', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'long-barrel', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'piercing-rivets', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'ricochet', { category: 'HERO' }),
    createRegisteredUpgradeChoice(scene, 'twin-riveter', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'fleet-feet', { category: 'UTILITY' }),
    createRegisteredStatUpgradeChoice(scene, 'scrap-magnet', { category: 'UTILITY' }),
    createRegisteredStatUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' }),
    createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' })
  ].filter(Boolean);
}

function installUpgradeLoop(scene){
  const previousOpen = scene.openUpgradeCards?.bind(scene);
  scene.openUpgradeCards = function(){
    const pool=createUpgradePool(this);
    const choices=rollUpgradeChoices(this,pool,3);
    if(!choices.length){previousOpen?.();return;}
    const UpgradeScene=this.scene.get('UpgradeSceneV4')||this.scene.get('UpgradeSceneV3')||this.scene.get('UpgradeSceneV2');
    if(UpgradeScene){this.scene.launch(UpgradeScene.scene.key,{choices,source:'level'});this.scene.pause();return;}
    previousOpen?.();
  };
}

export async function applyPhaseC(){
  const s=await getScene();makeAssets(s);cleanupLegacyEnemies(s);installWorldBounds(s);installWeaponRig(s);installUpgradeLoop(s);window.__WM_PHASE_C__=true;return true;
}
