import { settingsStore } from './settings-store.js?v=1';

export function installSettingsRuntime(game) {
  const scene = game?.scene?.getScene?.('Wreckmarch');
  if (!scene) throw new Error('Settings runtime requires the Wreckmarch scene');
  if (scene.__wmSettingsRuntimeInstalled) return scene.__wmSettingsRuntimeInstalled;

  const originalPlayTone = typeof scene.playTone === 'function' ? scene.playTone.bind(scene) : null;
  if (originalPlayTone) {
    scene.playTone = (...args) => {
      if (!settingsStore.get('audioEnabled')) return undefined;
      return originalPlayTone(...args);
    };
  }

  const camera = scene.cameras?.main;
  const originalShake = typeof camera?.shake === 'function' ? camera.shake.bind(camera) : null;
  if (camera && originalShake) {
    camera.shake = (...args) => {
      if (!settingsStore.get('screenShakeEnabled')) return camera;
      return originalShake(...args);
    };
  }

  const api = Object.freeze({
    store: settingsStore,
    getSnapshot: () => settingsStore.getSnapshot(),
  });
  scene.__wmSettingsRuntimeInstalled = api;
  window.__WM_SETTINGS__ = settingsStore;
  return api;
}
