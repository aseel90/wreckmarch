import { describe, expect, it } from 'vitest';
import { R3_DISTRICT_INSPECTION_STOPS, resolveWorldDistrictInspection } from '../../src/world/world-district-inspection.js';

describe('R3 debug-only district inspection resolver', () => {
  it('is disabled on normal Production URLs', () => {
    expect(resolveWorldDistrictInspection('').enabled).toBe(false);
    expect(resolveWorldDistrictInspection('?wmDistrictInspect=scrap-fields').enabled).toBe(false);
  });
  it('accepts all seven canonical districts only when debug=1', () => {
    expect(Object.keys(R3_DISTRICT_INSPECTION_STOPS)).toHaveLength(7);
    for (const districtId of Object.keys(R3_DISTRICT_INSPECTION_STOPS)) {
      const result = resolveWorldDistrictInspection(`?debug=1&wmDistrictInspect=${districtId}`);
      expect(result.enabled).toBe(true);
      expect(result.stop?.districtId).toBe(districtId);
      expect(result.stop?.x).toBeGreaterThan(0);
      expect(result.stop?.y).toBeGreaterThan(0);
    }
  });
  it('rejects unknown district ids', () => {
    const result = resolveWorldDistrictInspection('?debug=1&wmDistrictInspect=unknown-zone');
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe('invalid-district');
  });
});
