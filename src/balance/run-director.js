/* WRECKMARCH — time-driven Wave + Threat Budget director */
import { RUN_BALANCE, getPressurePhase, getPressureStep, getWaveBalance, getWaveNumber, pickEnemyForRun } from './run-balance.js?v=7';

function enemyThreat(enemy) {
  if (!enemy?.active) return 0;
  if (Number.isFinite(enemy.threatValue)) return Math.max(0, enemy.threatValue);
  return enemy.elite ? 4 : 1;
}

export function applyRunEnemyRoleProfile(enemy, enemyId) {
  const profile = RUN_BALANCE.enemyRoles?.[enemyId];
  if (!enemy?.active || !profile) return enemy;
  if (enemy.__runRoleProfile === 'balance-v6') return enemy;

  const speedMultiplier = Number(profile.chaseSpeedMultiplier) || 1;
  const currentSpeed = Number(enemy.speed) || 0;
  const currentBaseSpeed = Number(enemy.baseSpeed) || currentSpeed;
  enemy.speed = currentSpeed * speedMultiplier;
  enemy.baseSpeed = currentBaseSpeed * speedMultiplier;
  enemy.threatValue = Number(profile.threat) || enemy.threatValue;
  enemy.behaviorConfig = { ...(enemy.behaviorConfig || {}), ...(profile.behaviorConfig || {}) };
  enemy.__runRole = profile.role;
  enemy.__runRoleProfile = 'balance-v6';
  return enemy;
}

export class RunDirector {
  constructor(scene, { random = Math.random } = {}) { this.scene = scene; this.random = random; }

  getState(runTime = this.scene.runTime || 0) {
    const wave = getWaveNumber(runTime);
    const pressureStep = getPressureStep(runTime);
    const pressurePhase = getPressurePhase(runTime);
    const balance = getWaveBalance(runTime);
    return {
      wave,
      pressureStep,
      pressurePhase: pressurePhase.key,
      pressureLabel: pressurePhase.label,
      threatBudget: Math.max(1, Math.round(balance.threatBudget * pressurePhase.threatBudgetMultiplier)),
      activeCap: Math.max(4, balance.activeCap + pressurePhase.activeCapDelta),
      spawnIntervalMs: Math.max(300, Math.round(balance.spawnIntervalMs * pressurePhase.spawnIntervalMultiplier)),
      hpMultiplier: balance.hpMultiplier,
      damageMultiplier: balance.damageMultiplier,
      speedMultiplier: balance.speedMultiplier
    };
  }

  chooseEnemy(runTime = this.scene.runTime || 0) { return pickEnemyForRun(runTime, this.random); }

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

function tagNewEnemies(scene, before, enemyId, threat) {
  scene.enemies?.children?.iterate?.(enemy => {
    if (!enemy?.active || before.has(enemy)) return;
    applyRunEnemyRoleProfile(enemy, enemyId);
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
    const choice = elite ? { id: 'scrap-rat', threat: 4 } : this.runDirector.chooseEnemy(this.runTime || 0);
    const threat = elite ? 4 : (Number(choice?.threat) || 1);
    if (!this.runDirector.canSpawn(threat)) return null;
    const before = new Set(this.enemies?.getChildren?.() || []);
    const result = choice.id === 'scrap-rat' ? previousSpawnEnemy(elite) : this.spawnSystem?.spawn?.(choice.id, { elite: false });
    tagNewEnemies(this, before, choice.id, threat);
    return result;
  };

  scene.waveEvent?.remove?.(false);
  scene.advanceWave = function() {
    if (this.gameOver) return;
    const state = this.runDirector.getState((this.runTime || 0) + .05);
    this.waveText?.setText?.(`WAVE ${state.wave}`);
    this.showBanner?.(state.wave >= RUN_BALANCE.waves.length ? 'Final wave' : `Wave ${state.wave}`);
  };
  scene.waveEvent = scene.time.addEvent({ delay: RUN_BALANCE.waveDurationSeconds * 1000, loop: true, callback: () => scene.advanceWave() });

  const syncDirector = () => {
    if (!scene?.sys?.isActive?.() || scene.gameOver) return;
    const state = director.getState();
    if (scene.spawnEvent) scene.spawnEvent.delay = state.spawnIntervalMs;
    scene.waveText?.setText?.(`WAVE ${state.wave}`);

    const previousPhase = scene.__runDirectorPressurePhase;
    if (previousPhase && previousPhase !== state.pressurePhase) {
      if (state.pressurePhase === 'surge') scene.showBanner?.('PRESSURE SURGE');
      else if (state.pressurePhase === 'breather') scene.showBanner?.('BREATHER');
    }
    scene.__runDirectorPressurePhase = state.pressurePhase;
    scene.__runDirectorState = state;
    document.documentElement.dataset.wreckmarchWave = String(state.wave);
    document.documentElement.dataset.wreckmarchPressure = state.pressurePhase;
    window.__WM_RUN_DIRECTOR__ = { active: true, version: 'balance-v6', ...state, activeThreat: director.getActiveThreat() };
  };
  syncDirector();
  scene.__runDirectorTick = scene.time.addEvent({ delay: 1000, loop: true, callback: syncDirector });
  const state = director.getState();
  document.documentElement.dataset.wreckmarchRunDirector = 'balance-v6';
  window.__WM_LOG__?.(`Run Director active: LULL > BUILD > SURGE > BREATHER + Threat Budget + Rust Hound hunter + Sawbug ranged pressure (wave=${state.wave}, budget=${state.threatBudget}, cap=${state.activeCap})`);
  scene.__runDirectorReady = true;
  return true;
}
