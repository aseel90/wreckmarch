/* WRECKMARCH — live enemy foundation installer */
import { EnemyFactory } from './enemy-factory.js?v=1';
import { SpawnSystem } from './spawn-system.js?v=1';
import { EnemyBehaviorSystem } from './enemy-behavior-system.js?v=1';
import { CombatSystem } from '../combat/combat-system.js?v=1';
import { ProjectileSystem } from '../combat/projectile-system.js?v=1';
import { WeaponSystem } from '../combat/weapon-system.js?v=1';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function installCombatSystem(scene) {
  scene.combatSystem = new CombatSystem(scene);
  scene.enemyCombatSystem = scene.combatSystem.enemy;
  scene.playerDamageSystem = scene.combatSystem.player;
  scene.combatSystem.installOverlaps();
  scene.__enemyCombatFoundationReady = true;
  scene.__playerDamageFoundationReady = true;
  scene.__combatSystemReady = true;
}

function installWeaponProjectileSystems(scene) {
  scene.projectileSystem = new ProjectileSystem(scene);
  scene.weaponSystem = new WeaponSystem(scene, { projectileSystem: scene.projectileSystem });
  scene.__projectileSystemReady = true;
  scene.__weaponSystemReady = true;
}

async function getScene(timeoutMs = 9000) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const game = window.__WM_GAME__ || window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.enemies && typeof scene.spawnEnemy === 'function') return scene;
    await wait(40);
  }
  throw new Error('Timed out waiting for Wreckmarch scene for Enemy Foundation');
}

export async function installEnemyFoundation() {
  const scene = await getScene();
  if (scene.__enemyFoundationReady) return scene;

  scene.enemyFactory = new EnemyFactory(scene);
  scene.spawnSystem = new SpawnSystem(scene, { factory: scene.enemyFactory });
  scene.enemyBehaviorSystem = new EnemyBehaviorSystem(scene);
  installCombatSystem(scene);
  installWeaponProjectileSystems(scene);

  scene.__legacySpawnEnemy = scene.spawnEnemy.bind(scene);
  scene.spawnEnemy = function(elite = false) {
    return this.spawnSystem.spawn('scrap-rat', { elite });
  };

  scene.__legacyUpdateEnemies = scene.updateEnemies.bind(scene);
  scene.updateEnemies = function() {
    return this.enemyBehaviorSystem.updateAll(this.enemies, this.hero);
  };

  scene.__enemyFoundationReady = true;
  scene.__enemyBehaviorFoundationReady = true;
  window.__WM_ENEMY_FOUNDATION__ = true;
  document.documentElement.dataset.wreckmarchEnemyFoundation = 'active';
  window.__WM_LOG__?.('Enemy Foundation active: Registry -> Factory -> SpawnSystem -> BehaviorSystem -> CombatSystem -> WeaponSystem -> ProjectileSystem');
  return scene;
}
