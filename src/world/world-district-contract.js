/* WRECKMARCH R3 — canonical semantic district/layout contract. R2 technical sectors remain the streaming owner. */
import { CURRENT_PRODUCTION_WORLD, WORLD_SECTOR_POLICY, getWorldSectorGrid } from './world-contract.js?v=1';

export const R3_WORLD_DISTRICT_CONTRACT_VERSION = 'r3-district-v1';

const DISTRICT_DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'central-wreckroads', name: 'Central Wreckroads', tint: 0xb78963, washAlpha: 0.055, debrisTint: 0x241b15, visual: 'broken-junctions' }),
  Object.freeze({ id: 'scrap-fields', name: 'Scrap Fields', tint: 0x9a7655, washAlpha: 0.11, debrisTint: 0x30261f, visual: 'scrap-ridges' }),
  Object.freeze({ id: 'collapsed-highway', name: 'Collapsed Highway', tint: 0x77716a, washAlpha: 0.12, debrisTint: 0x292826, visual: 'concrete-asphalt' }),
  Object.freeze({ id: 'rust-depot', name: 'Rust Depot', tint: 0x9a5738, washAlpha: 0.105, debrisTint: 0x3a2018, visual: 'industrial-rust' }),
  Object.freeze({ id: 'chemical-yard', name: 'Chemical Yard', tint: 0x7f8b52, washAlpha: 0.12, debrisTint: 0x29331b, visual: 'chemical-stain' }),
  Object.freeze({ id: 'burned-convoy-zone', name: 'Burned Convoy Zone', tint: 0x665247, washAlpha: 0.13, debrisTint: 0x171311, visual: 'charred-lanes' }),
  Object.freeze({ id: 'marshal-territory', name: 'Marshal Territory', tint: 0x8d694d, washAlpha: 0.105, debrisTint: 0x2b211c, visual: 'controlled-wasteland' })
]);

export const WORLD_DISTRICTS = Object.freeze(Object.fromEntries(DISTRICT_DEFINITIONS.map(district => [district.id, district])));
export const WORLD_DISTRICT_LIST = DISTRICT_DEFINITIONS;

// Neutral metadata used only by the R2 12000 debug/comparison harness outside the selected 8x8 Production grid.
// It is deliberately not exported as an R3 district and never participates in Production coverage/validation.
const DEBUG_COMPARISON_DISTRICT = Object.freeze({
  id: 'debug-comparison-outside-production',
  name: 'Debug Comparison',
  tint: 0xb78963,
  washAlpha: 0.07,
  debrisTint: 0x15110e,
  visual: 'neutral-comparison'
});

const EMPTY_ITEMS = Object.freeze([]);

function districtIdForSector(column, row) {
  if (row <= 1) return column <= 3 ? 'scrap-fields' : 'collapsed-highway';
  if (row <= 3) {
    if (column <= 2) return 'rust-depot';
    if (column <= 4) return 'central-wreckroads';
    return 'chemical-yard';
  }
  if (row <= 5) {
    if (column <= 2) return 'burned-convoy-zone';
    if (column <= 4) return 'central-wreckroads';
    return 'marshal-territory';
  }
  return column <= 3 ? 'burned-convoy-zone' : 'marshal-territory';
}

const landmark = (id, districtId, sectorKey, name, kind, localX, localY, scale = 1) => Object.freeze({
  id, districtId, sectorKey, name, kind, localX, localY, scale
});

export const WORLD_LANDMARKS = Object.freeze([
  landmark('scrap-crown', 'scrap-fields', '1:0', 'Scrap Crown', 'scrap-spire', 610, 420, 1.25),
  landmark('crusher-ribs', 'scrap-fields', '3:1', 'Crusher Ribs', 'wreck-ribs', 770, 720, 1.05),
  landmark('broken-span', 'collapsed-highway', '5:0', 'Broken Span', 'overpass-pier', 520, 510, 1.3),
  landmark('split-ramp', 'collapsed-highway', '7:1', 'Split Ramp', 'concrete-ramp', 690, 650, 1.1),
  landmark('red-loader', 'rust-depot', '0:2', 'Red Loader', 'loader-frame', 700, 430, 1.15),
  landmark('stack-yard', 'rust-depot', '2:3', 'Stack Yard', 'container-stack', 430, 760, 1.1),
  landmark('wreckroad-totem', 'central-wreckroads', '3:3', 'Wreckroad Totem', 'road-totem', 430, 390, 1.15),
  landmark('fourway-wreck', 'central-wreckroads', '4:4', 'Fourway Wreck', 'junction-wreck', 820, 780, 1.2),
  landmark('acid-twins', 'chemical-yard', '6:2', 'Acid Twins', 'tank-pair', 610, 470, 1.2),
  landmark('pipe-crown', 'chemical-yard', '7:3', 'Pipe Crown', 'pipe-cluster', 470, 720, 1.05),
  landmark('black-hauler', 'burned-convoy-zone', '1:5', 'Black Hauler', 'burned-truck', 650, 500, 1.2),
  landmark('convoy-gate', 'burned-convoy-zone', '3:7', 'Convoy Gate', 'barricade', 510, 620, 1.15),
  landmark('marshal-watch', 'marshal-territory', '6:5', 'Marshal Watch', 'watchtower', 600, 430, 1.25),
  landmark('iron-checkpoint', 'marshal-territory', '5:7', 'Iron Checkpoint', 'checkpoint', 650, 680, 1.2)
]);

const clearing = (id, districtId, sectorKey, name, localX, localY, width, height) => Object.freeze({
  id, districtId, sectorKey, name, localX, localY, width, height, bossCapable: true, openGround: true
});

export const BOSS_CLEARINGS = Object.freeze([
  clearing('wreckroad-circle', 'central-wreckroads', '4:3', 'Wreckroad Circle', 600, 600, 560, 500),
  clearing('highway-interchange', 'collapsed-highway', '6:1', 'Highway Interchange', 600, 600, 620, 480),
  clearing('depot-loading-yard', 'rust-depot', '1:3', 'Depot Loading Yard', 600, 600, 580, 520),
  clearing('convoy-intersection', 'burned-convoy-zone', '2:6', 'Convoy Intersection', 600, 600, 620, 500),
  clearing('marshal-checkpoint-arena', 'marshal-territory', '5:6', 'Marshal Checkpoint', 600, 600, 600, 520)
]);

const landmarksBySector = new Map();
const clearingsBySector = new Map();
for (const item of WORLD_LANDMARKS) {
  const items = landmarksBySector.get(item.sectorKey) || [];
  items.push(item);
  landmarksBySector.set(item.sectorKey, items);
}
for (const item of BOSS_CLEARINGS) {
  const items = clearingsBySector.get(item.sectorKey) || [];
  items.push(item);
  clearingsBySector.set(item.sectorKey, items);
}

function isProductionSector(column, row) {
  const grid = getWorldSectorGrid(CURRENT_PRODUCTION_WORLD);
  return Number.isInteger(column) && Number.isInteger(row) && column >= 0 && row >= 0 && column < grid.columns && row < grid.rows;
}

export function getDistrictForSector(column, row) {
  if (!isProductionSector(column, row)) throw new RangeError(`Invalid production sector ${column}:${row}`);
  return WORLD_DISTRICTS[districtIdForSector(column, row)];
}

export function getDistrictMetadataForSector(sector) {
  if (!sector || !Number.isInteger(sector.column) || !Number.isInteger(sector.row)) {
    throw new TypeError('R3 district metadata requires a valid sector');
  }
  if (!isProductionSector(sector.column, sector.row)) {
    return Object.freeze({ district: DEBUG_COMPARISON_DISTRICT, landmarks: EMPTY_ITEMS, bossClearings: EMPTY_ITEMS, debugComparisonOnly: true });
  }
  const district = getDistrictForSector(sector.column, sector.row);
  return Object.freeze({
    district,
    landmarks: Object.freeze([...(landmarksBySector.get(sector.key) || [])]),
    bossClearings: Object.freeze([...(clearingsBySector.get(sector.key) || [])]),
    debugComparisonOnly: false
  });
}

export function validateWorldDistrictContract() {
  const errors = [];
  const grid = getWorldSectorGrid(CURRENT_PRODUCTION_WORLD);
  const coverage = new Map(DISTRICT_DEFINITIONS.map(district => [district.id, 0]));

  if (CURRENT_PRODUCTION_WORLD.width !== 9600 || CURRENT_PRODUCTION_WORLD.height !== 9600) {
    errors.push('R3 requires selected 9600x9600 R2 production world');
  }
  if (WORLD_SECTOR_POLICY.sectorSize !== 1200 || !WORLD_SECTOR_POLICY.districtPartitionIndependent) {
    errors.push('R3 districts must remain independent from R2 sectors');
  }

  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      const district = getDistrictForSector(column, row);
      if (!district) errors.push(`Uncovered ${column}:${row}`);
      else coverage.set(district.id, (coverage.get(district.id) || 0) + 1);
    }
  }

  for (const district of DISTRICT_DEFINITIONS) {
    if (!coverage.get(district.id)) errors.push(`${district.id} has no sectors`);
    if (!WORLD_LANDMARKS.some(item => item.districtId === district.id)) errors.push(`${district.id} has no landmark`);
  }

  for (const item of WORLD_LANDMARKS) {
    const [column, row] = item.sectorKey.split(':').map(Number);
    if (getDistrictForSector(column, row).id !== item.districtId) errors.push(`${item.id} district mismatch`);
  }

  const clearingIds = new Set();
  const clearingDistricts = new Set();
  for (const item of BOSS_CLEARINGS) {
    if (clearingIds.has(item.id)) errors.push(`Duplicate ${item.id}`);
    clearingIds.add(item.id);
    clearingDistricts.add(item.districtId);
    const [column, row] = item.sectorKey.split(':').map(Number);
    if (getDistrictForSector(column, row).id !== item.districtId) errors.push(`${item.id} district mismatch`);
    if (!item.bossCapable || !item.openGround || item.width < 480 || item.height < 420) errors.push(`${item.id} invalid clearing`);
    if (item.localX - item.width / 2 < 80 || item.localX + item.width / 2 > 1120 || item.localY - item.height / 2 < 80 || item.localY + item.height / 2 > 1120) {
      errors.push(`${item.id} exceeds safe bounds`);
    }
  }

  if (clearingDistricts.size < 5) errors.push('Boss clearings need five districts');
  if (getDistrictForSector(4, 4).id !== 'central-wreckroads') errors.push('Start must be Central Wreckroads');

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    coveredSectorCount: [...coverage.values()].reduce((sum, count) => sum + count, 0),
    districtSectorCounts: Object.freeze(Object.fromEntries(coverage))
  });
}

export const R3_WORLD_DISTRICT_VALIDATION = validateWorldDistrictContract();
if (!R3_WORLD_DISTRICT_VALIDATION.ok) {
  throw new Error(`Invalid R3 district contract: ${R3_WORLD_DISTRICT_VALIDATION.errors.join('; ')}`);
}
