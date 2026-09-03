function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function createRunResult(scene, reason = 'RUN COMPLETE') {
  if (!scene) throw new TypeError('createRunResult requires a gameplay scene');
  return Object.freeze({
    reason: String(reason || 'RUN COMPLETE'),
    characterId: String(scene.characterId || globalThis.__WM_SELECTED_CHARACTER__ || 'runner'),
    survivedSeconds: Math.max(0, Math.floor(finiteNumber(scene.runTime))),
    scrap: Math.max(0, Math.floor(finiteNumber(scene.scrap))),
    level: Math.max(1, Math.floor(finiteNumber(scene.level, 1))),
    createdAt: new Date().toISOString(),
  });
}
