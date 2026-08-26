/* WRECKMARCH — time-driven Wave + Threat Budget director */
import { RUN_BALANCE, getPressureStep, getWaveBalance, getWaveNumber } from './run-balance.js?v=1';

function enemyThreat(enemy) {
  if (!enemy?.active) return 0;
  if (Number.isFinite(enemy.threatValue)) return Math.max(0, enemy.threatValue);
  return enemy.elite ? 4 : 1;
}

export class RunDirector {
  constructor(scene) {
    this.scene = scene;
  }

  getState(runTime = this.scene.runTime || 0) {
    const wave = getWaveNumber(runTime);
    const pressureStep = getPressureStep(runTime);
    const balance = getWaveBalance(runTime);
    const pressureBudget = RUN_BALANCE.pressureBudgetMultipliers[pressureStep] || 1;
    const pressureSpawn = RUN_BALANCE.pressureSpawnMultipliers[pressureStep] || 1;
    return {
      wave,
      pressureStep,
      threatBudget: Math.round(balance.threatBudget * pressureBudget),
      activeCap: balance.activeCap,
      spawnIntervalMs: Math.max(300, Math.round(balance.spawnIntervalMs * pressureSpawn)),
      hpMultiplier: balance.hpMultiplier,
      damageMultiplier: balance.damageMultiplier,
      speedMultiplier: balance.speedMultiplier
    };
  }

  getActiveThreat() {
    let total = 0;
    this.scene.enemies?.children?.iterate?.(enemy => { total += enemyThreat(enemy); });
    return total;
  }

  canSpawn(threat = 1) {
    if (this.scene.gameOver) return false;
    const state = this.getState();
    const activeCount = this.scene.enemies?.countActive?.(true) || 0;
    if (activeCount >= state.activeCap) return false;
    return this.getActiveThreat() + Math.max(0, Number(threat) || 0) <= state.threatBudget;
  }
}

function tagNewEnemies(scene, before, threat) {
  scene.enemies?.children?.iterate?.(enemy => {
    if (!enemy?.active || before.has(enemy)) return;
    enemy.threatValue = threat;
  });
}

export function applyRunDirector(scene) {
  if (!scene || scene.__runDirectorReady) return false;

  const director = new RunDirector(scene);
  scene.runDirector = director;
  scene.__runBalanceEnabled = true;

  const previousSpawnEnemy = scene.spawnEnemy.bind(scene);
  scene.__preRunDirectorSpawnEnemy = previousSpawnEnemy;
  scene.spawnEnemy = function(elite = false) {
    const threat = elite ? 4 : 1;
    if (!this.runDirector.canSpawn(threat)) return null;
    const before = new Set(this.enemies?.getChildren?.() || []);
    const result = previousSpawnEnemy(elite);
    tagNewEnemies(this, before, threat);
    return result;
  };

  scene.waveEvent?.remove?.(false);
  scene.advanceWave = function() {
    if (this.gameOver) return;
    const state = this.runDirector.getState((this.runTime || 0) + .05);
    this.waveText?.setText?.(`WAVE ${state.wave}`);
    this.showBanner?.(state.wave >= RUN_BALANCE.waves.length ? 'Final wave' : `Wave ${state.wave}`);
  };
  scene.waveEvent = scene.time.addEvent({
    delay: RUN_BALANCE.waveDurationSeconds * 1000,
    loop: true,
    callback: () => scene.advanceWave()
  });

  const syncDirector = () => {
    if (!scene?.sys?.isActive?.() || scene.gameOver) return;
    const state = director.getState();
    if (scene.spawnEvent) scene.spawnEvent.delay = state.spawnIntervalMs;
    scene.waveText?.setText?.(`WAVE ${state.wave}`);
    scene.__runDirectorState = state;
    document.documentElement.dataset.wreckmarchWave = String(state.wave);
  };
  syncDirector();
  scene.__runDirectorTick = scene.time.addEvent({ delay: 1000, loop: true, callback: syncDirector });

  const state = director.getState();
  window.__WM_RUN_DIRECTOR__ = { active: true, version: 'balance-v1', ...state };
  document.documentElement.dataset.wreckmarchRunDirector = 'balance-v1';
  window.__WM_LOG__?.(`Run Director active: 60s waves + 15s pressure steps + Threat Budget (wave=${state.wave}, budget=${state.threatBudget}, cap=${state.activeCap})`);
  scene.__runDirectorReady = true;
  return true;
}
