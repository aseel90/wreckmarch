/* WRECKMARCH R3 — debug-only live visual inspection positions. Never active on normal Production URLs. */
export const R3_DISTRICT_INSPECTION_PARAM = 'wmDistrictInspect';
export const R3_DISTRICT_INSPECTION_STOPS = Object.freeze({
  'scrap-fields': Object.freeze({ districtId: 'scrap-fields', x: 1800, y: 600 }),
  'collapsed-highway': Object.freeze({ districtId: 'collapsed-highway', x: 6600, y: 600 }),
  'rust-depot': Object.freeze({ districtId: 'rust-depot', x: 600, y: 3000 }),
  'central-wreckroads': Object.freeze({ districtId: 'central-wreckroads', x: 4200, y: 4200 }),
  'chemical-yard': Object.freeze({ districtId: 'chemical-yard', x: 7800, y: 3000 }),
  'burned-convoy-zone': Object.freeze({ districtId: 'burned-convoy-zone', x: 1800, y: 6600 }),
  'marshal-territory': Object.freeze({ districtId: 'marshal-territory', x: 7800, y: 6600 })
});

export function resolveWorldDistrictInspection(search = '') {
  const params = new URLSearchParams(search);
  const requested = String(params.get(R3_DISTRICT_INSPECTION_PARAM) || '').trim().toLowerCase();
  const debugEnabled = params.get('debug') === '1';
  const stop = R3_DISTRICT_INSPECTION_STOPS[requested] || null;
  return Object.freeze({
    enabled: debugEnabled && Boolean(stop),
    requested,
    reason: !debugEnabled ? 'debug-required' : stop ? 'district-selected' : requested ? 'invalid-district' : 'not-requested',
    stop
  });
}

export function resolveWorldDistrictInspectionFromLocation(locationLike = typeof location === 'undefined' ? undefined : location) {
  return resolveWorldDistrictInspection(locationLike?.search || '');
}
