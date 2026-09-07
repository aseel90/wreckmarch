/* WRECKMARCH R2 — debug-only world-size comparison selector. */
import { CURRENT_PRODUCTION_WORLD, FUTURE_WORLD_CANDIDATES } from './world-contract.js?v=2';

export const R2_WORLD_SIZE_HARNESS_VERSION = 'r2-size-harness-v1';
export const WORLD_SIZE_HARNESS_ENABLE_PARAM = 'wmWorldHarness';
export const WORLD_SIZE_HARNESS_SIZE_PARAM = 'wmWorld';

const candidateByRequest = request => {
  const normalized = String(request || '').trim().toLowerCase();
  if (!normalized) return null;
  return FUTURE_WORLD_CANDIDATES.find(candidate => (
    candidate.id.toLowerCase() === normalized ||
    String(candidate.width) === normalized ||
    `${candidate.width}x${candidate.height}` === normalized
  )) || null;
};

/**
 * Comparison sizes remain debug-only. Normal URLs always resolve to the single
 * selected production world.
 * @param {string} [search='']
 */
export function resolveWorldSizeHarness(search = '') {
  const params = new URLSearchParams(search);
  const requested = params.get(WORLD_SIZE_HARNESS_SIZE_PARAM);
  const explicitlyEnabled = params.get(WORLD_SIZE_HARNESS_ENABLE_PARAM) === '1';
  const candidate = candidateByRequest(requested);
  const enabled = explicitlyEnabled && Boolean(candidate);
  const reason = enabled
    ? 'candidate-selected'
    : explicitlyEnabled && requested
      ? 'invalid-candidate'
      : 'production-default';

  return Object.freeze({
    version: R2_WORLD_SIZE_HARNESS_VERSION,
    enabled,
    requested,
    reason,
    world: enabled ? candidate : CURRENT_PRODUCTION_WORLD
  });
}

/** @param {{ search?: string } | undefined} [locationLike] */
export function resolveWorldSizeHarnessFromLocation(locationLike = typeof location === 'undefined' ? undefined : location) {
  return resolveWorldSizeHarness(locationLike?.search || '');
}
