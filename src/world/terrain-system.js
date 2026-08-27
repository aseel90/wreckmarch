/* WRECKMARCH F0 — permanent terrain/road construction primitives */
import { C4_GROUND, C4_ROAD } from '../c4-assets.js?v=1';

export const WORLD_W = 2200;
export const WORLD_H = 2200;

export const FINAL_ROUTES = Object.freeze([
  { w: 210, p: [[-180,1100],[280,1040],[650,1120],[960,1080],[1100,1100],[1420,1030],[1810,1120],[2380,1060]] },
  { w: 190, p: [[1090,-180],[1040,250],[1120,610],[1080,900],[1100,1100],[1040,1450],[1110,1830],[1060,2380]] },
  { w: 170, p: [[-160,480],[340,540],[760,490],[1130,590],[1600,520],[2360,610]] },
  { w: 170, p: [[-160,1780],[380,1640],[790,1700],[1190,1600],[1580,1480],[1930,1560],[2360,1660]] }
]);

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function getWreckmarchScene({ timeout = 5000, requireTerrainTextures = false } = {}) {
  const started = performance.now();
  while (performance.now() - started < timeout) {
    const game = window.__WM_GAME__ || window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    const texturesReady = !requireTerrainTextures || (
      scene?.textures?.exists?.('c4-ground') && scene?.textures?.exists?.('c4-road')
    );
    if (scene?.sys?.isActive?.() && scene.hero && texturesReady) return scene;
    await wait(25);
  }
  throw Error('TerrainSystem scene timeout');
}

function addDataTexture(scene, key, b64) {
  if (scene.textures.exists(key)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        scene.textures.addImage(key, image);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(Error(`Failed to decode ${key}`));
    image.src = `data:image/png;base64,${b64}`;
  });
}

export function ensureTerrainTextures(scene) {
  return Promise.all([
    addDataTexture(scene, 'c4-ground', C4_GROUND),
    addDataTexture(scene, 'c4-road', C4_ROAD)
  ]);
}

function destroyObjects(objects) {
  objects?.forEach?.(object => object?.destroy?.());
}

function addRoadSegment(scene, a, b, width, name, index, options) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const x = (a.x + b.x) / 2;
  const y = (a.y + b.y) / 2;

  const shoulder = scene.add.rectangle(x, y, length + 34, width + 36, 0x4a3528, .98)
    .setDepth(options.shoulderDepth)
    .setRotation(angle)
    .setName(`${name}-shoulder-${index}`);

  const road = scene.add.tileSprite(x, y, length + 18, width, 'c4-road')
    .setDepth(options.roadDepth)
    .setRotation(angle)
    .setName(`${name}-asphalt-${index}`)
    .setAlpha(1);
  road.setTileScale(Math.max(1, width / 112));
  road.tilePositionX = (index * options.tileOffsetStep) % 256;
  road[options.roadMarker] = true;
  if (options.roadWidthMarker) road[options.roadWidthMarker] = width;

  const center = scene.add.rectangle(x, y, length + 10, 3, 0xc5b27e, .22)
    .setDepth(options.centerDepth)
    .setRotation(angle)
    .setName(`${name}-center-${index}`);

  return [shoulder, road, center];
}

function addRoad(scene, points, width, name, options) {
  const curve = new Phaser.Curves.Spline(points.map(([x, y]) => new Phaser.Math.Vector2(x, y)));
  const spaced = curve.getSpacedPoints(options.samples);
  const objects = [];
  for (let index = 0; index < spaced.length - 1; index++) {
    objects.push(...addRoadSegment(scene, spaced[index], spaced[index + 1], width, name, index, options));
  }
  return objects;
}

export function buildTerrainLayer(scene, options = {}) {
  const config = {
    owner: 'terrain',
    routes: FINAL_ROUTES,
    samples: 64,
    groundDepth: .2,
    shoulderDepth: .8,
    roadDepth: .9,
    centerDepth: .95,
    tileOffsetStep: 37,
    roadMarker: '__terrainRoad',
    roadWidthMarker: null,
    terrainStore: '__terrainObjects',
    roadStore: '__terrainRoadSegments',
    includeWash: false,
    washDepth: .3,
    washAlpha: .1,
    washTint: 0xb78963,
    washOffsetX: 77,
    washOffsetY: 41,
    debrisCount: 0,
    debrisDepth: 1.15,
    ...options
  };

  destroyObjects(scene[config.terrainStore]);
  scene[config.terrainStore] = [];
  scene[config.roadStore] = [];

  const terrain = scene[config.terrainStore];
  const roads = scene[config.roadStore];
  const base = scene.add.tileSprite(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 'c4-ground')
    .setDepth(config.groundDepth)
    .setName(`${config.owner}-ground-base`);
  base.setTileScale(1);
  terrain.push(base);

  let wash = null;
  if (config.includeWash) {
    wash = scene.add.tileSprite(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 'c4-ground')
      .setDepth(config.washDepth)
      .setName(`${config.owner}-ground-wash`)
      .setAlpha(config.washAlpha)
      .setTint(config.washTint);
    wash.tilePositionX = config.washOffsetX;
    wash.tilePositionY = config.washOffsetY;
    terrain.push(wash);
  }

  config.routes.forEach((route, routeIndex) => {
    const segments = addRoad(scene, route.p, route.w, `${config.owner}-road-${routeIndex}`, config);
    terrain.push(...segments);
    roads.push(...segments.filter(object => object?.[config.roadMarker] === true));
  });

  for (let index = 0; index < config.debrisCount; index++) {
    const debris = scene.add.ellipse(
      Phaser.Math.Between(80, 2120),
      Phaser.Math.Between(90, 2110),
      Phaser.Math.Between(26, 92),
      Phaser.Math.Between(9, 28),
      0x15110e,
      Phaser.Math.FloatBetween(.035, .075)
    ).setDepth(config.debrisDepth).setRotation(Phaser.Math.FloatBetween(0, Math.PI));
    terrain.push(debris);
  }

  terrain.forEach(object => {
    if (!object) return;
    object.__terrainSystemObject = true;
    object.__terrainSystemOwner = config.owner;
  });

  scene.__terrainSystemState = {
    owner: config.owner,
    terrainCount: terrain.length,
    roadCount: roads.length
  };

  return { terrain, roads, base, wash };
}
