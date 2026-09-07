import { createWeaponRuntimeState } from './combat/weapon-registry.js?v=2';
import { R2_WORLD_CONTRACT_VERSION, WORLD_SECTOR_POLICY } from './world/world-contract.js?v=2';
import { WorldSectorActivationSystem } from './world/world-sector-system.js?v=1';
import { R2_WORLD_SIZE_HARNESS_VERSION, resolveWorldSizeHarnessFromLocation } from './world/world-size-harness.js?v=2';
import { WorldSectorTerrain } from './world/world-sector-terrain.js?v=2&r3District=1';
/* WRECKMARCH — Phase B runtime: large world + camera + visible swappable starter weapon */
const BASE_HERO_SPEED = 285;
const TAU = Math.PI * 2;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getScene(timeoutMs = 9000) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const game = window.__WM_GAME__ || window.Phaser?.GAMES?.find(Boolean) || window.Phaser?.GAMES?.[0];
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (scene?.sys?.isActive?.() && scene.hero) return scene;
    await wait(60);
  }
  throw new Error('Timed out waiting for Wreckmarch scene for Phase B');
}

function makeRivetGunTexture(scene) {
  if (scene.textures.exists('weapon-rivet')) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x1b2023).fillRoundedRect(8, 6, 36, 14, 5);
  g.fillStyle(0x5b666a).fillRoundedRect(13, 4, 31, 13, 4);
  g.lineStyle(2, 0x24292b, 1).strokeRoundedRect(13, 4, 31, 13, 4);
  g.fillStyle(0xb86f3d).fillRect(40, 8, 15, 9);
  g.fillStyle(0xd08b48).fillRect(52, 10, 10, 5);
  g.fillStyle(0x2d3336).fillRoundedRect(18, 16, 10, 9, 2);
  g.fillStyle(0x49d3e1).fillCircle(19, 9, 2.3);
  g.fillStyle(0xe0b26f).fillCircle(33, 10, 1.7);
  g.generateTexture('weapon-rivet', 64, 26);
  g.destroy();
}

function clearOldArena(scene) {
  const keep = new Set([
    scene.hero, scene.heroShadow, scene.heroHpBg, scene.heroHpBar,
    scene.titleText, scene.timerText, scene.waveText, scene.scrapText,
    scene.hint, scene.joyBase, scene.joyKnob, scene.cart, scene.cartCore
  ]);
  [...scene.children.list].forEach(obj => {
    if (!obj || keep.has(obj) || !obj.visible || obj.__terrainSystemObject) return;
    if ((obj.depth ?? 0) <= 3) obj.destroy();
  });
}

function pinHud(scene) {
  [scene.titleText, scene.timerText, scene.waveText, scene.scrapText, scene.hint, scene.joyBase, scene.joyKnob]
    .forEach(obj => obj?.setScrollFactor?.(0));

  const top = scene.add.rectangle(270, 52, 540, 105, 0x0b0e13, .84)
    .setDepth(500).setScrollFactor(0);
  top.name = 'phase-b-hud-shade';
}

function installLargeWorld(scene, worldHarness) {
  const world = worldHarness.world;
  const WORLD_W = world.width;
  const WORLD_H = world.height;
  scene.__runtimeWorld = world;
  scene.__worldSizeHarness = worldHarness;
  scene.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
  scene.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

  scene.hero.setPosition(WORLD_W / 2, WORLD_H / 2);
  scene.hero.body?.reset?.(WORLD_W / 2, WORLD_H / 2);
  scene.heroShadow.setPosition(scene.hero.x, scene.hero.y + 50);
  scene.heroHpBg.setPosition(scene.hero.x, scene.hero.y - 64);
  scene.heroHpBar.setPosition(scene.hero.x - 34, scene.hero.y - 64);

  scene.cameras.main.startFollow(scene.hero, true, .105, .105);
  scene.cameras.main.setDeadzone(86, 132);
  scene.cameraLook = new Phaser.Math.Vector2();

  clearOldArena(scene);
  scene.worldSectorSystem?.reset?.();
  scene.worldSectorTerrain?.destroyAll?.();
  scene.worldSectorTerrain = new WorldSectorTerrain(scene, world);
  scene.worldSectorSystem = new WorldSectorActivationSystem({
    world,
    onActivate: sector => scene.worldSectorTerrain.activateSector(sector),
    onDeactivate: sector => scene.worldSectorTerrain.deactivateSector(sector)
  });
  scene.worldSectorDiagnostics = scene.worldSectorSystem.updateForPosition(scene.hero.x, scene.hero.y);
  scene.__worldSectorFoundationReady = true;
  scene.__terrainSystemState = {
    owner: 'r2-world-sector-terrain',
    worldId: world.id,
    fullMapTerrainAllocated: false
  };

  pinHud(scene);
}

function installMovementTuning(scene) {
  scene.heroSpeed = BASE_HERO_SPEED;
  scene.heroMoveVelocity = new Phaser.Math.Vector2();
  scene.movePower = 0;

  scene.updateMovement = function(time) {
    const delta = Phaser.Math.Clamp(this.game?.loop?.delta || 16.67, 8, 40);
    this.move.set(0, 0);
    this.movePower = 0;

    if (this.joy.active) {
      const raw = new Phaser.Math.Vector2(this.joy.current.x - this.joy.origin.x, this.joy.current.y - this.joy.origin.y);
      const len = raw.length();
      if (len > 8) {
        this.move.copy(raw.normalize());
        const analog = Phaser.Math.Clamp((len - 8) / (this.joy.radius - 8), 0, 1);
        this.movePower = .46 + analog * .54;
      }
    }

    const kb = this.input.keyboard;
    if (kb) {
      const c = kb.createCursorKeys();
      let used = false;
      if (c.left.isDown) { this.move.x -= 1; used = true; }
      if (c.right.isDown) { this.move.x += 1; used = true; }
      if (c.up.isDown) { this.move.y -= 1; used = true; }
      if (c.down.isDown) { this.move.y += 1; used = true; }
      if (used) {
        if (this.move.lengthSq() > 1) this.move.normalize();
        this.movePower = 1;
      }
    }

    const moving = this.move.lengthSq() > .05 && this.movePower > .01;
    const targetX = moving ? this.move.x * this.heroSpeed * this.movePower : 0;
    const targetY = moving ? this.move.y * this.heroSpeed * this.movePower : 0;
    const responseMs = moving ? 72 : 48;
    const blend = 1 - Math.exp(-delta / responseMs);

    this.heroMoveVelocity.x = Phaser.Math.Linear(this.heroMoveVelocity.x, targetX, blend);
    this.heroMoveVelocity.y = Phaser.Math.Linear(this.heroMoveVelocity.y, targetY, blend);

    let vx = this.heroMoveVelocity.x, vy = this.heroMoveVelocity.y;
    if (time < this.heroKnockbackUntil) {
      const strength = Phaser.Math.Clamp((this.heroKnockbackUntil - time) / 140, 0, 1);
      vx += this.heroKnockback.x * strength;
      vy += this.heroKnockback.y * strength;
    }
    this.hero.setVelocity(vx, vy);
    this.worldSectorDiagnostics = this.worldSectorSystem?.updateForPosition?.(this.hero.x, this.hero.y) || this.worldSectorDiagnostics;

    if (!this.__characterSystemReady) {
      this.hero.rotation = Phaser.Math.Linear(this.hero.rotation, moving ? this.move.x * .075 : 0, .15);
      this.hero.setFlipX(this.move.x < -.12);
      if (moving && this.hero.anims.currentAnim?.key !== 'hero-run') this.hero.play('hero-run', true);
      if (!moving && this.hero.anims.currentAnim?.key !== 'hero-idle') this.hero.play('hero-idle', true);
    }

    const shadowY = this.textures.exists('art-hero-idle-0') ? 50 : 36;
    this.heroShadow.setPosition(this.hero.x, this.hero.y + shadowY).setScale(moving ? 1.12 : 1.04, moving ? .82 : .9);

    const lookX = moving ? -this.move.x * 56 : 0;
    const lookY = moving ? -this.move.y * 82 : 0;
    this.cameraLook.x = Phaser.Math.Linear(this.cameraLook.x, lookX, .075);
    this.cameraLook.y = Phaser.Math.Linear(this.cameraLook.y, lookY, .075);
    this.cameras.main.setFollowOffset(this.cameraLook.x, this.cameraLook.y);

    if (moving && time > this.lastDustAt + 105) {
      this.lastDustAt = time;
      this.spawnDust(this.hero.x - this.move.x * 22, this.hero.y + 36, .65);
    }
  };
}

function installOutsideViewportSpawns(scene, world) {
  const WORLD_W = world.width;
  const WORLD_H = world.height;
  const baseSpawn = scene.spawnEnemy.bind(scene);

  scene.spawnEnemy = function(elite = false) {
    if (this.gameOver) return;
    const before = new Set(this.enemies.getChildren());

    baseSpawn(elite);
    let enemy = null;
    this.enemies.children.iterate(e => {
      if (e?.active && !before.has(e)) enemy = e;
    });
    if (!enemy) return;

    const view = this.cameras.main.worldView;
    let x = this.hero.x, y = this.hero.y;
    for (let tries = 0; tries < 14; tries++) {
      const angle = Phaser.Math.FloatBetween(0, TAU);
      const radius = Phaser.Math.Between(610, 790);
      const cx = Phaser.Math.Clamp(this.hero.x + Math.cos(angle) * radius, 38, WORLD_W - 38);
      const cy = Phaser.Math.Clamp(this.hero.y + Math.sin(angle) * radius, 38, WORLD_H - 38);
      const visible = cx > view.left - 75 && cx < view.right + 75 && cy > view.top - 75 && cy < view.bottom + 75;
      x = cx; y = cy;
      if (!visible) break;
    }
    enemy.setPosition(x, y);
    enemy.body?.reset?.(x, y);
  };
}

function installVisibleStarterWeapon(scene, world) {
  const WORLD_W = world.width;
  const WORLD_H = world.height;
  makeRivetGunTexture(scene);

  scene.primaryWeapon = {
    ...createWeaponRuntimeState(scene.startingWeaponId || 'rivet-gun'),
    texture: 'weapon-rivet'
  };
  scene.activeWeaponId = scene.primaryWeapon.id;
  scene.weaponAim = 0;
  scene.weaponSprite?.destroy?.();
  scene.weaponSprite = scene.add.image(scene.hero.x + 18, scene.hero.y + 8, scene.primaryWeapon.texture)
    .setOrigin(.18, .5).setScale(.72).setDepth(24);

  scene.updateWeaponPose = function() {
    const ang = this.weaponAim;
    this.weaponSprite.setPosition(this.hero.x + Math.cos(ang) * 13, this.hero.y + 8 + Math.sin(ang) * 13);
    this.weaponSprite.setRotation(ang);
    this.weaponSprite.setFlipY(Math.cos(ang) < 0);
  };

  scene.equipPrimaryWeapon = function(weaponOrId) {
    const weaponId = typeof weaponOrId === 'string' ? weaponOrId : weaponOrId?.id;
    const next = createWeaponRuntimeState(weaponId);
    const texture = typeof weaponOrId === 'object' && weaponOrId?.texture
      ? weaponOrId.texture
      : this.primaryWeapon?.texture || 'weapon-rivet';
    this.primaryWeapon = { ...next, texture };
    this.weaponSprite?.setTexture?.(texture);
    this.activeWeaponId = next.id;
    this.damage = next.damage;
    this.fireDelay = next.fireDelay;
  };

  scene.projectileSystem.configureBounds({ minX: -60, maxX: WORLD_W + 60, minY: -60, maxY: WORLD_H + 60 });
  scene.weaponSystem.configureHero({
    aimYOffset: 4,
    targetTurnRate: .22,
    moveTurnRate: .14,
    twinSpread2: .055,
    twinSpread3: .085,
    projectile: { lifeMs: 1120, scale: .74, radius: 7, offsetX: 3, offsetY: 3 },
    muzzleResolver: () => {
      const ang = scene.weaponAim;
      return new Phaser.Math.Vector2(
        scene.weaponSprite.x + Math.cos(ang) * scene.primaryWeapon.muzzleDistance,
        scene.weaponSprite.y + Math.sin(ang) * scene.primaryWeapon.muzzleDistance
      );
    },
    fireFeedback: ({ angle, muzzle }) => {
      const flash = scene.add.image(muzzle.x, muzzle.y, 'flash').setDepth(31).setRotation(angle).setScale(.58);
      scene.tweens.add({ targets: flash, alpha: 0, scale: .12, duration: 70, onComplete: () => flash.destroy() });
      scene.weaponSprite.x -= Math.cos(angle) * 5;
      scene.weaponSprite.y -= Math.sin(angle) * 5;
      scene.playTone(165, .045, 'square', .019, -34);
    }
  });
}

function installWorldSizeHarnessApi(scene, worldHarness) {
  if (!worldHarness.enabled) {
    try { delete window.__WM_WORLD_HARNESS__; } catch {}
    return;
  }
  const world = worldHarness.world;
  const clamp = (value, max) => Phaser.Math.Clamp(Number(value) || 0, 24, Math.max(24, max - 24));
  const teleport = (x, y) => {
    const nextX = clamp(x, world.width);
    const nextY = clamp(y, world.height);
    scene.hero.setPosition(nextX, nextY);
    scene.hero.body?.reset?.(nextX, nextY);
    scene.worldSectorDiagnostics = scene.worldSectorSystem?.updateForPosition?.(nextX, nextY) || scene.worldSectorDiagnostics;
    scene.cameras.main.centerOn(nextX, nextY);
    return window.__WM_WORLD_HARNESS__.diagnostics();
  };
  window.__WM_WORLD_HARNESS__ = {
    active: true,
    version: R2_WORLD_SIZE_HARNESS_VERSION,
    worldId: world.id,
    width: world.width,
    height: world.height,
    teleport,
    teleportSector: (column, row) => teleport((Number(column) + .5) * WORLD_SECTOR_POLICY.sectorSize, (Number(row) + .5) * WORLD_SECTOR_POLICY.sectorSize),
    diagnostics: () => ({
      harness: { active: true, version: R2_WORLD_SIZE_HARNESS_VERSION, worldId: world.id, width: world.width, height: world.height },
      sectors: scene.worldSectorSystem?.getDiagnostics?.() || null,
      terrain: scene.worldSectorTerrain?.getDiagnostics?.() || null,
      hero: { x: scene.hero.x, y: scene.hero.y },
      physicsBounds: { width: scene.physics.world.bounds.width, height: scene.physics.world.bounds.height },
      cameraBounds: { width: scene.cameras.main._bounds?.width ?? world.width, height: scene.cameras.main._bounds?.height ?? world.height }
    })
  };
}

export async function applyPhaseB() {
  const scene = await getScene();
  const worldHarness = resolveWorldSizeHarnessFromLocation();
  const world = worldHarness.world;
  installLargeWorld(scene, worldHarness);
  installMovementTuning(scene);
  installOutsideViewportSpawns(scene, world);
  installVisibleStarterWeapon(scene, world);
  installWorldSizeHarnessApi(scene, worldHarness);

  window.__WM_PHASE_B__ = true;
  window.__WM_WORLD_SECTORS__ = {
    active: true,
    contractVersion: R2_WORLD_CONTRACT_VERSION,
    mode: worldHarness.enabled ? 'candidate-harness' : 'production-streaming',
    worldId: world.id,
    diagnostics: () => scene.worldSectorSystem?.getDiagnostics?.() || null,
    terrainDiagnostics: () => scene.worldSectorTerrain?.getDiagnostics?.() || null
  };
  document.documentElement.dataset.wreckmarchPhase = 'b';
  document.documentElement.dataset.wreckmarchWorldSectors = R2_WORLD_CONTRACT_VERSION;
  document.documentElement.dataset.wreckmarchWorldSize = String(world.width);
  document.documentElement.dataset.wreckmarchWorldHarness = worldHarness.enabled ? R2_WORLD_SIZE_HARNESS_VERSION : 'off';
  window.__WM_LOG__?.(`Phase B applied: ${world.width}x${world.height} world + tuned movement + visible Rivet Gun + R2 ${worldHarness.enabled ? 'candidate harness' : 'production streaming'}`);
  return true;
}
