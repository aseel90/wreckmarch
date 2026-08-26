/* WRECKMARCH — spawn ownership boundary */
import { EnemyFactory } from './enemy-factory.js';

const BASE_W = 540;
const BASE_H = 960;

function fallbackBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class SpawnSystem {
  /**
   * @param {any} scene
   * @param {{ factory?: EnemyFactory, randomBetween?: (min: number, max: number) => number }} [options]
   */
  constructor(scene, { factory, randomBetween } = {}) {
    this.scene = scene;
    this.factory = factory || new EnemyFactory(scene, { randomBetween });
    this.randomBetween = randomBetween || ((min, max) => globalThis.Phaser?.Math?.Between?.(min, max) ?? fallbackBetween(min, max));
  }

  getEdgeSpawnPoint() {
    const side = this.randomBetween(0, 3);
    if (side === 0) return { x: this.randomBetween(20, BASE_W - 20), y: 105 };
    if (side === 1) return { x: BASE_W - 20, y: this.randomBetween(130, BASE_H - 180) };
    if (side === 2) return { x: this.randomBetween(20, BASE_W - 20), y: BASE_H - 165 };
    return { x: 20, y: this.randomBetween(130, BASE_H - 180) };
  }

  spawn(enemyId = 'scrap-rat', { elite = false } = {}) {
    if (this.scene.gameOver) return null;
    const point = this.getEdgeSpawnPoint();
    return this.factory.create(enemyId, {
      elite,
      x: point.x,
      y: point.y,
      runTime: this.scene.runTime
    });
  }
}
