/* WRECKMARCH R2 — canonical world geometry and sector-activation contract. */

export const R2_WORLD_CONTRACT_VERSION = 'r2-v1';

/** @typedef {{ id: string, width: number, height: number, role: string }} WorldGeometry */
/** @typedef {{ sectorSize: number, activeRadius: number, maxActiveSectors: number, districtPartitionIndependent: boolean }} WorldSectorPolicy */

const positiveDimension = (value, name) => {
  const result = Number(value);
  if (!Number.isFinite(result) || result <= 0) throw new TypeError(`${name} must be a positive finite number`);
  return result;
};

const requiredText = (value, name) => {
  const result = String(value || '').trim();
  if (!result) throw new TypeError(`${name} is required`);
  return result;
};

/** @param {{ id: string, width: number, height?: number, role: string }} input @returns {Readonly<WorldGeometry>} */
export function defineWorldGeometry(input) {
  const width = positiveDimension(input.width, 'WorldGeometry.width');
  const height = positiveDimension(input.height ?? input.width, 'WorldGeometry.height');
  return Object.freeze({
    id: requiredText(input.id, 'WorldGeometry.id'),
    width,
    height,
    role: requiredText(input.role, 'WorldGeometry.role')
  });
}

export const CURRENT_PRODUCTION_WORLD = defineWorldGeometry({
  id: 'production-2200-v1',
  width: 2200,
  height: 2200,
  role: 'current-production-reference'
});

export const FUTURE_WORLD_CANDIDATES = Object.freeze([
  defineWorldGeometry({ id: 'candidate-7200-v1', width: 7200, role: 'future-size-candidate' }),
  defineWorldGeometry({ id: 'candidate-9600-v1', width: 9600, role: 'future-size-preferred-candidate' }),
  defineWorldGeometry({ id: 'candidate-12000-v1', width: 12000, role: 'future-size-candidate' })
]);

export const PREFERRED_FUTURE_WORLD_ID = 'candidate-9600-v1';
export const PREFERRED_FUTURE_WORLD = FUTURE_WORLD_CANDIDATES.find(candidate => candidate.id === PREFERRED_FUTURE_WORLD_ID);
if (!PREFERRED_FUTURE_WORLD) throw new Error('Preferred future world candidate is missing');

/**
 * 1200 divides every approved R2 candidate exactly:
 * 7200 => 6x6, 9600 => 8x8, 12000 => 10x10.
 * Technical sectors are intentionally independent from the later district layout.
 * @type {Readonly<WorldSectorPolicy>}
 */
export const WORLD_SECTOR_POLICY = Object.freeze({
  sectorSize: 1200,
  activeRadius: 1,
  maxActiveSectors: 9,
  districtPartitionIndependent: true
});

/** @param {WorldGeometry} [world=CURRENT_PRODUCTION_WORLD] */
export function getWorldSectorGrid(world = CURRENT_PRODUCTION_WORLD) {
  const sectorSize = WORLD_SECTOR_POLICY.sectorSize;
  const columns = Math.ceil(world.width / sectorSize);
  const rows = Math.ceil(world.height / sectorSize);
  return Object.freeze({
    worldId: world.id,
    sectorSize,
    columns,
    rows,
    sectorCount: columns * rows
  });
}

const clampCoordinate = (value, max) => {
  const normalized = Number.isFinite(Number(value)) ? Number(value) : 0;
  if (normalized <= 0) return 0;
  if (normalized >= max) return Math.max(0, max - Number.EPSILON);
  return normalized;
};

/** @param {number} x @param {number} y @param {WorldGeometry} [world=CURRENT_PRODUCTION_WORLD] */
export function getWorldSectorForPosition(x, y, world = CURRENT_PRODUCTION_WORLD) {
  const grid = getWorldSectorGrid(world);
  const localX = clampCoordinate(x, world.width);
  const localY = clampCoordinate(y, world.height);
  const column = Math.min(grid.columns - 1, Math.floor(localX / grid.sectorSize));
  const row = Math.min(grid.rows - 1, Math.floor(localY / grid.sectorSize));
  return Object.freeze({
    key: `${column}:${row}`,
    column,
    row,
    x: column * grid.sectorSize,
    y: row * grid.sectorSize,
    width: Math.min(grid.sectorSize, world.width - column * grid.sectorSize),
    height: Math.min(grid.sectorSize, world.height - row * grid.sectorSize)
  });
}

/** @param {number} x @param {number} y @param {WorldGeometry} [world=CURRENT_PRODUCTION_WORLD] @param {number} [radius=WORLD_SECTOR_POLICY.activeRadius] */
export function getActiveWorldSectors(x, y, world = CURRENT_PRODUCTION_WORLD, radius = WORLD_SECTOR_POLICY.activeRadius) {
  const grid = getWorldSectorGrid(world);
  const center = getWorldSectorForPosition(x, y, world);
  const normalizedRadius = Math.max(0, Math.floor(Number(radius) || 0));
  const sectors = [];

  for (let row = Math.max(0, center.row - normalizedRadius); row <= Math.min(grid.rows - 1, center.row + normalizedRadius); row += 1) {
    for (let column = Math.max(0, center.column - normalizedRadius); column <= Math.min(grid.columns - 1, center.column + normalizedRadius); column += 1) {
      sectors.push(getWorldSectorForPosition(
        Math.min(world.width, column * grid.sectorSize + 1),
        Math.min(world.height, row * grid.sectorSize + 1),
        world
      ));
    }
  }

  return Object.freeze(sectors);
}

export function validateWorldContract() {
  const errors = [];
  if (CURRENT_PRODUCTION_WORLD.width !== 2200 || CURRENT_PRODUCTION_WORLD.height !== 2200) {
    errors.push('Current production world must remain 2200x2200 during the R2 foundation');
  }
  if (PREFERRED_FUTURE_WORLD.width !== 9600 || PREFERRED_FUTURE_WORLD.height !== 9600) {
    errors.push('Preferred future candidate must remain 9600x9600 until real-device comparison');
  }
  if (WORLD_SECTOR_POLICY.activeRadius !== 1 || WORLD_SECTOR_POLICY.maxActiveSectors !== 9) {
    errors.push('R2 sector policy must keep a 3x3 maximum active neighborhood');
  }

  for (const candidate of FUTURE_WORLD_CANDIDATES) {
    const grid = getWorldSectorGrid(candidate);
    if (candidate.width !== candidate.height) errors.push(`${candidate.id} must remain square for the R2 candidate comparison`);
    if (candidate.width % WORLD_SECTOR_POLICY.sectorSize !== 0) errors.push(`${candidate.id} must divide exactly into technical sectors`);
    if (grid.sectorCount <= WORLD_SECTOR_POLICY.maxActiveSectors) errors.push(`${candidate.id} must not require the full world to be active`);
  }

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export const R2_WORLD_CONTRACT_VALIDATION = validateWorldContract();
if (!R2_WORLD_CONTRACT_VALIDATION.ok) throw new Error(`Invalid R2 world contract: ${R2_WORLD_CONTRACT_VALIDATION.errors.join('; ')}`);
