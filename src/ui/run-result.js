function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function createRunId() {
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  } catch { /* Fall through to the local browser-safe identifier. */ }
  return `wm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveRunId(scene) {
  if (typeof scene.__wmRunId === 'string' && scene.__wmRunId) return scene.__wmRunId;
  const runId = createRunId();
  try { scene.__wmRunId = runId; }
  catch { /* The frozen result still owns the generated ID if scene assignment is unavailable. */ }
  return runId;
}

export function createRunResult(scene, reason = 'RUN COMPLETE') {
  if (!scene) throw new TypeError('createRunResult requires a gameplay scene');
  return Object.freeze({
    runId: resolveRunId(scene),
    reason: String(reason || 'RUN COMPLETE'),
    characterId: String(scene.characterId || globalThis.__WM_SELECTED_CHARACTER__ || 'runner'),
    survivedSeconds: Math.max(0, Math.floor(finiteNumber(scene.runTime))),
    scrap: Math.max(0, Math.floor(finiteNumber(scene.scrap))),
    level: Math.max(1, Math.floor(finiteNumber(scene.level, 1))),
    createdAt: new Date().toISOString(),
  });
}
