/* WRECKMARCH — live enemy foundation installer */
import { EnemyFactory } from './enemy-factory.js?v=1';
import { SpawnSystem } from './spawn-system.js?v=1';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

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
  scene.__legacySpawnEnemy = scene.spawnEnemy.bind(scene);
  scene.spawnEnemy = function(elite = false) {
    return this.spawnSystem.spawn('scrap-rat', { elite });
  };

  scene.__enemyFoundationReady = true;
  window.__WM_ENEMY_FOUNDATION__ = true;
  document.documentElement.dataset.wreckmarchEnemyFoundation = 'active';
  window.__WM_LOG__?.('Enemy Foundation active: Scrap Rat -> Registry -> Factory -> SpawnSystem');
  return scene;
}
