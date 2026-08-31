/* WRECKMARCH — canonical measurement-only run telemetry owner */
import { isRemoteRunReportingEnabled, NoopRunReportProvider, RunReportProvider } from './run-report-provider.js?v=3';

const LONG_FRAME_MS = 33.34;
const MAX_FRAME_SPIKE_SAMPLES = 32;
const MAX_TTK_SAMPLES_PER_ENEMY = 24;
const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const round = (value, digits = 3) => Number(n(value).toFixed(digits));
const safeClone = value => { try { return JSON.parse(JSON.stringify(value)); } catch { return null; } };

function createReportId() {
  if (globalThis.crypto?.randomUUID) return `wm-${globalThis.crypto.randomUUID()}`;
  return `wm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function activeChildren(group) {
  return group?.getChildren?.()?.filter?.(item => item?.active) || [];
}

function projectileKind(projectile) {
  if (projectile?.projectileKind === 'shrapnel' || projectile?.isSecondaryProjectile) return 'shrapnel';
  if (Object.prototype.hasOwnProperty.call(projectile || {}, 'isCritical')) return 'hero';
  return 'support';
}

export class RunTelemetry {
  constructor(scene, { provider = new NoopRunReportProvider(), now = () => Date.now(), reportIdFactory = createReportId } = {}) {
    this.scene = scene;
    this.provider = provider;
    this.now = now;
    this.reportId = reportIdFactory();
    this.startedAtMs = this.now();
    this.finalized = false;
    this.lastSubmission = null;
    this.lastWaveKey = '';
    this.enemyState = new WeakMap();
    this.projectileState = new WeakMap();
    this.projectileSeen = new WeakSet();
    this.heroProjectileHits = new WeakSet();
    this.damageBuckets = new Map();
    this.previousHeroHp = n(scene?.heroHp);
    this.previousLastShot = n(scene?.lastShot, -1);
    this.previousUpgradeLevels = { ...(scene?.upgradeLevels || {}) };
    this.report = {
      schemaVersion: 1,
      reportId: this.reportId,
      startedAt: new Date(this.startedAtMs).toISOString(),
      finishReason: null,
      run: { durationSeconds: 0, finalWave: 1, level: 1, scrap: 0, hp: 0, maxHp: 0 },
      waves: [],
      combat: { damageDealt: 0, damageTaken: 0, hits: 0, playerHits: 0, kills: 0, killsByEnemy: {}, spawnedByEnemy: {}, ttkSecondsByEnemy: {}, criticalHits: 0, lastDamageSource: null, averageDps: 0, peakDps1s: 0 },
      projectiles: { triggers: 0, spawned: 0, heroSpawned: 0, supportSpawned: 0, shrapnelSpawned: 0, heroProjectilesWithHit: 0, heroMisses: 0, pierceHits: 0, ricochets: 0 },
      upgrades: { history: [], finalLevels: {}, rarityHistory: {}, resolvedStats: null },
      performance: { frames: 0, averageFrameMs: 0, maxFrameMs: 0, longFrames: 0, peakActiveEnemies: 0, peakActiveProjectiles: 0, frameSpikes: [] }
    };
  }

  get runTime() { return Math.max(0, n(this.scene?.runTime)); }

  observeEnemy(enemy) {
    if (!enemy?.active) return;
    let state = this.enemyState.get(enemy);
    const hp = n(enemy.hp);
    if (!state) {
      state = { hp, spawnTime: this.runTime, killed: hp <= 0 };
      this.enemyState.set(enemy, state);
      const id = enemy.enemyId || 'unknown';
      this.report.combat.spawnedByEnemy[id] = n(this.report.combat.spawnedByEnemy[id]) + 1;
      if (hp <= 0) this.recordKill(enemy, state);
      return;
    }

    if (hp < state.hp) {
      const applied = Math.max(0, Math.min(state.hp, state.hp - hp));
      this.report.combat.damageDealt += applied;
      this.report.combat.hits += 1;
      const second = Math.max(0, Math.floor(this.runTime));
      this.damageBuckets.set(second, n(this.damageBuckets.get(second)) + applied);
    }
    if (state.hp > 0 && hp <= 0 && !state.killed) this.recordKill(enemy, state);
    state.hp = hp;
  }

  recordKill(enemy, state = this.enemyState.get(enemy)) {
    if (!state || state.killed) return;
    state.killed = true;
    const id = enemy?.enemyId || 'unknown';
    const c = this.report.combat;
    c.kills += 1;
    c.killsByEnemy[id] = n(c.killsByEnemy[id]) + 1;
    const list = c.ttkSecondsByEnemy[id] || (c.ttkSecondsByEnemy[id] = []);
    if (list.length < MAX_TTK_SAMPLES_PER_ENEMY) list.push(round(this.runTime - state.spawnTime));
  }

  observeProjectile(projectile) {
    if (!projectile?.active) return;
    const hitCount = projectile.hitEnemies instanceof Set ? projectile.hitEnemies.size : 0;
    const pierce = Math.max(0, Math.floor(n(projectile.pierceRemaining)));
    const ricochet = Math.max(0, Math.floor(n(projectile.ricochetRemaining)));
    let state = this.projectileState.get(projectile);
    if (!state) {
      state = { hitCount, pierce, ricochet, kind: projectileKind(projectile) };
      this.projectileState.set(projectile, state);
      this.projectileSeen.add(projectile);
      const p = this.report.projectiles;
      p.spawned += 1;
      if (state.kind === 'hero') p.heroSpawned += 1;
      else if (state.kind === 'shrapnel') p.shrapnelSpawned += 1;
      else p.supportSpawned += 1;
      return;
    }

    const newHits = Math.max(0, hitCount - state.hitCount);
    if (newHits > 0) {
      if (state.kind === 'hero' && !this.heroProjectileHits.has(projectile)) {
        this.heroProjectileHits.add(projectile);
        this.report.projectiles.heroProjectilesWithHit += 1;
      }
      if (projectile.isCritical) this.report.combat.criticalHits += newHits;
    }
    this.report.projectiles.pierceHits += Math.max(0, state.pierce - pierce);
    this.report.projectiles.ricochets += Math.max(0, state.ricochet - ricochet);
    state.hitCount = hitCount;
    state.pierce = pierce;
    state.ricochet = ricochet;
  }

  observePlayerDamage(enemies) {
    const hp = n(this.scene?.heroHp);
    if (hp < this.previousHeroHp) {
      const damage = Math.max(0, this.previousHeroHp - hp);
      const c = this.report.combat;
      c.damageTaken += damage;
      c.playerHits += 1;
      let nearest = null;
      let nearestSq = Infinity;
      for (const enemy of enemies) {
        const dx = n(enemy.x) - n(this.scene?.hero?.x);
        const dy = n(enemy.y) - n(this.scene?.hero?.y);
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < nearestSq) { nearestSq = distanceSq; nearest = enemy; }
      }
      c.lastDamageSource = nearest?.enemyId || nearest?.name || 'unknown';
    }
    this.previousHeroHp = hp;
  }

  observeWeaponTrigger() {
    const lastShot = n(this.scene?.lastShot, -1);
    if (lastShot > 0 && lastShot !== this.previousLastShot) this.report.projectiles.triggers += 1;
    this.previousLastShot = lastShot;
  }

  observeUpgrades() {
    const current = this.scene?.upgradeLevels || {};
    const rarityHistory = this.scene?.upgradeRarityHistory || {};
    for (const [id, levelValue] of Object.entries(current)) {
      const level = Math.max(0, Math.floor(n(levelValue)));
      const previous = Math.max(0, Math.floor(n(this.previousUpgradeLevels[id])));
      if (level <= previous) continue;
      for (let acquiredLevel = previous + 1; acquiredLevel <= level; acquiredLevel += 1) {
        this.report.upgrades.history.push({ id, level: acquiredLevel, rarity: rarityHistory?.[id]?.[acquiredLevel - 1] || null, atSeconds: round(this.runTime) });
      }
    }
    this.previousUpgradeLevels = { ...current };
  }

  recordWaveState() {
    const state = this.scene?.__runDirectorState || this.scene?.runDirector?.getState?.();
    if (!state) return;
    const key = `${state.wave}:${state.pressurePhase}`;
    if (key === this.lastWaveKey) return;
    this.lastWaveKey = key;
    this.report.waves.push({ atSeconds: round(this.runTime), wave: state.wave, pressurePhase: state.pressurePhase, threatBudget: state.threatBudget, activeCap: state.activeCap, spawnIntervalMs: state.spawnIntervalMs, hpMultiplier: state.hpMultiplier, damageMultiplier: state.damageMultiplier, speedMultiplier: state.speedMultiplier });
  }

  update(deltaMs = 0) {
    if (this.finalized) return;
    const enemies = activeChildren(this.scene?.enemies);
    const bullets = activeChildren(this.scene?.bullets);
    for (const enemy of enemies) this.observeEnemy(enemy);
    for (const bullet of bullets) this.observeProjectile(bullet);
    this.observePlayerDamage(enemies);
    this.observeWeaponTrigger();
    this.observeUpgrades();

    const perf = this.report.performance;
    const frameMs = Math.max(0, n(deltaMs));
    perf.frames += 1;
    perf._totalFrameMs = n(perf._totalFrameMs) + frameMs;
    perf.maxFrameMs = Math.max(n(perf.maxFrameMs), frameMs);
    perf.peakActiveEnemies = Math.max(n(perf.peakActiveEnemies), enemies.length);
    perf.peakActiveProjectiles = Math.max(n(perf.peakActiveProjectiles), bullets.length);
    if (frameMs >= LONG_FRAME_MS) {
      perf.longFrames += 1;
      if (perf.frameSpikes.length < MAX_FRAME_SPIKE_SAMPLES) perf.frameSpikes.push({ atSeconds: round(this.runTime), frameMs: round(frameMs, 2), activeEnemies: enemies.length, activeProjectiles: bullets.length });
    }
    this.recordWaveState();
    this.syncRunSummary();
  }

  syncRunSummary() {
    const run = this.report.run;
    run.durationSeconds = round(this.runTime);
    const state = this.scene?.__runDirectorState || this.scene?.runDirector?.getState?.();
    run.finalWave = Math.max(1, Math.floor(n(state?.wave, run.finalWave || 1)));
    run.level = Math.max(1, Math.floor(n(this.scene?.level, 1)));
    run.scrap = Math.max(0, Math.floor(n(this.scene?.scrap)));
    run.hp = round(this.scene?.heroHp);
    run.maxHp = round(this.scene?.heroMaxHp);
  }

  finalize(reason = null) {
    if (this.finalized) return this.report;
    this.update(0);
    this.report.finishReason = String(reason || (n(this.scene?.heroHp) <= 0 ? 'RUNNER DOWN' : 'RUN ENDED'));
    this.report.finishedAt = new Date(this.now()).toISOString();
    const duration = Math.max(.001, n(this.report.run.durationSeconds));
    const combat = this.report.combat;
    combat.damageDealt = round(combat.damageDealt);
    combat.damageTaken = round(combat.damageTaken);
    combat.averageDps = round(combat.damageDealt / duration);
    combat.peakDps1s = round(Math.max(0, ...this.damageBuckets.values()));
    const p = this.report.projectiles;
    p.heroMisses = Math.max(0, p.heroSpawned - p.heroProjectilesWithHit);
    const perf = this.report.performance;
    perf.averageFrameMs = round(perf.frames ? n(perf._totalFrameMs) / perf.frames : 0, 2);
    delete perf._totalFrameMs;
    this.report.upgrades.finalLevels = safeClone(this.scene?.upgradeLevels || {}) || {};
    this.report.upgrades.rarityHistory = safeClone(this.scene?.upgradeRarityHistory || {}) || {};
    this.report.upgrades.resolvedStats = safeClone(this.scene?.runStatState?.resolve?.());
    this.report.run.killsPerMinute = round(combat.kills / (duration / 60));
    this.report.run.completed = /COMPLETE|SURVIVED|VICTORY/i.test(this.report.finishReason);
    this.finalized = true;
    try { globalThis.__WM_LAST_RUN_REPORT__ = this.report; } catch {}
    this.lastSubmission = Promise.resolve(this.provider?.submit?.(this.report)).catch(error => ({ submitted: false, error: String(error?.message || error) }));
    return this.report;
  }

  getReport() { return safeClone(this.report); }
}

export function installRunTelemetry(scene, options = {}) {
  if (!scene) throw new TypeError('RunTelemetry requires a scene');
  if (scene.runTelemetry && !scene.runTelemetry.finalized) return scene.runTelemetry;
  const remoteReportingEnabled = options.remoteReportingEnabled ?? isRemoteRunReportingEnabled(options.remoteReportingOptions);
  const provider = options.provider || (remoteReportingEnabled && typeof globalThis.fetch === 'function'
    ? new RunReportProvider(options.providerOptions)
    : new NoopRunReportProvider());
  const telemetry = new RunTelemetry(scene, { ...options, provider });
  telemetry.remoteReportingEnabled = remoteReportingEnabled;
  scene.runTelemetry = telemetry;
  try {
    globalThis.__WM_TELEMETRY__ = telemetry;
    globalThis.__WM_TELEMETRY_REMOTE_ENABLED__ = remoteReportingEnabled;
  } catch {}
  Promise.resolve(provider.flushPending?.()).catch(() => {});
  return telemetry;
}
