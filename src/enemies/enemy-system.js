/* WRECKMARCH — live enemy foundation installer */
import { EnemyFactory } from './enemy-factory.js?v=1';
import { SpawnSystem } from './spawn-system.js?v=1';
import { EnemyBehaviorSystem } from './enemy-behavior-system.js?v=1';
import { EnemyCombatSystem } from '../combat/enemy-combat-system.js?v=1';
import { PlayerDamageSystem } from '../combat/player-damage-system.js?v=1';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function installCombatOverlap(scene) {
  const activeColliders = scene.physics?.world?.colliders?.getActive?.() || [];
  const legacyCollider = activeColliders.find(collider =>
    collider?.active !== false &&
    ((collider.object1 === scene.bullets && collider.object2 === scene.enemies) ||
      (collider.object1 === scene.enemies && collider.object2 === scene.bullets)) &&
    collider.collideCallback === scene.onBulletHit
  );
  if (!legacyCollider) throw new Error('Enemy Foundation could not locate the legacy bullet/enemy overlap');

  scene.__legacyOnBulletHit = scene.onBulletHit.bind(scene);
  scene.__legacyKillEnemy = scene.killEnemy.bind(scene);
  legacyCollider.destroy();

  scene.enemyCombatSystem = new EnemyCombatSystem(scene);
  scene.onBulletHit = function(bullet, enemy) {
    return this.enemyCombatSystem.hitByProjectile(bullet, enemy);
  };
  scene.killEnemy = function(enemy) {
    return this.enemyCombatSystem.killEnemy(enemy);
  };
  scene.__enemyProjectileOverlap = scene.physics.add.overlap(
    scene.bullets,
    scene.enemies,
    scene.onBulletHit,
    undefined,
    scene
  );
  scene.__enemyCombatFoundationReady = true;
}

function installPlayerDamageOverlap(scene) {
  const activeColliders = scene.physics?.world?.colliders?.getActive?.() || [];
  const legacyCollider = activeColliders.find(collider =>
    collider?.active !== false &&
    ((collider.object1 === scene.hero && collider.object2 === scene.enemies) ||
      (collider.object1 === scene.enemies && collider.object2 === scene.hero)) &&
    collider.collideCallback === scene.enemyTouchesHero
  );
  if (!legacyCollider) throw new Error('Enemy Foundation could not locate the legacy hero/enemy overlap');

  scene.__legacyEnemyTouchesHero = scene.enemyTouchesHero.bind(scene);
  legacyCollider.destroy();

  scene.playerDamageSystem = new PlayerDamageSystem(scene);
  scene.enemyTouchesHero = function(hero, enemy) {
    return this.playerDamageSystem.hitByContact(hero, enemy);
  };
  scene.__playerEnemyOverlap = scene.physics.add.overlap(
    scene.hero,
    scene.enemies,
    scene.enemyTouchesHero,
    undefined,
    scene
  );
  scene.__playerDamageFoundationReady = true;
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
  installCombatOverlap(scene);
  installPlayerDamageOverlap(scene);

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
  window.__WM_LOG__?.('Enemy Foundation active: Registry -> Factory -> SpawnSystem -> BehaviorSystem -> EnemyCombatSystem -> PlayerDamageSystem');
  return scene;
}
