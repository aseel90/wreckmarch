import { SCREEN_IDS } from './screen-registry.js?v=2';
import { createRunResult } from './run-result.js?v=2';
import { showResultsScreen } from './results-screen.js?v=2';
import { requestNextBootScreen } from './frontend-intent.js?v=2';
import { progressionStore } from '../progression/progression-store.js?v=2';
import { createWorkshopReward } from '../progression/workshop-reward.js?v=1';

function cleanGameplayForResults(scene) {
  scene.gameOver = true;
  scene.physics?.pause?.();
  if (scene.spawnEvent) scene.spawnEvent.paused = true;
  if (scene.waveEvent) scene.waveEvent.paused = true;
  scene.hero?.setVelocity?.(0, 0);
  ['UpgradeScene', 'UpgradeSceneV2', 'UpgradeSceneV3', 'UpgradeSceneV4'].forEach(key => {
    if (scene.scene?.isActive?.(key)) scene.scene.stop(key);
  });
  scene.upgradeOpen = false;
  scene.input.enabled = false;
  scene.setGameplayHudVisible?.(false);
}

function reloadTo(screenId) {
  requestNextBootScreen(screenId);
  window.location.reload();
}

function getWorkshopRewardContext() {
  const params = new URLSearchParams(globalThis.location?.search || '');
  return Object.freeze({
    isDebug: params.get('debug') === '1',
    isAutotest: params.get('autotest') === '1',
  });
}

export function installResultsRuntime(game) {
  const scene = game?.scene?.getScene?.('Wreckmarch');
  const shell = window.__WM_GAME_SHELL__;
  if (!scene || !shell) throw new Error('Results runtime requires Wreckmarch scene and GameShell');
  if (scene.__wmResultsRuntimeInstalled) return scene.__wmResultsRuntimeInstalled;

  const endRun = reason => {
    if (scene.gameOver) return;
    const telemetry = scene.runTelemetry;
    if (telemetry && !telemetry.finalized) {
      try { telemetry.finalize(reason); }
      catch (error) { window.__WM_LOG__?.(`Run Telemetry finalize failed: ${error?.message || error}`); }
    }
    cleanGameplayForResults(scene);
    scene.cameras?.main?.shake?.(220, .0065);
    scene.playTone?.(90, .30, 'sawtooth', .035, -55);

    const result = createRunResult(scene, reason);
    const workshopReward = createWorkshopReward(result, getWorkshopRewardContext());
    const progression = progressionStore.recordRun(result, { workshopReward });
    window.__WM_LAST_RUN_RESULT__ = result;
    window.__WM_LAST_WORKSHOP_REWARD__ = workshopReward;
    window.__WM_PROGRESSION_SNAPSHOT__ = progression;
    shell.navigate(SCREEN_IDS.RESULTS);
    scene.__wmPauseRuntimeInstalled?.syncTrigger?.();
    window.__WM_LOG__?.(`Canonical run result captured: ${result.reason} • ${result.survivedSeconds}s • scrap ${result.scrap} • scrip +${workshopReward.amount}`);
    document.documentElement.dataset.wreckmarchEndRunOwner = 'game-shell-results-v1';

    const sendReport = window.__WM_TELEMETRY_RUNTIME__?.sendReport;
    void showResultsScreen(result, { sendReport, workshopReward }).then(({ action }) => {
      if (action === 'play-again') {
        shell.navigate(SCREEN_IDS.CHARACTER_SELECT);
        reloadTo(SCREEN_IDS.CHARACTER_SELECT);
        return;
      }
      shell.navigate(SCREEN_IDS.MAIN);
      reloadTo(SCREEN_IDS.MAIN);
    });
  };

  scene.endRun = endRun;
  const api = Object.freeze({
    endRun,
    getLastResult: () => window.__WM_LAST_RUN_RESULT__ || null,
    getLastWorkshopReward: () => window.__WM_LAST_WORKSHOP_REWARD__ || null,
  });
  scene.__wmResultsRuntimeInstalled = api;
  return api;
}
