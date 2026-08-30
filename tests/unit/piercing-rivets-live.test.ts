import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('Piercing Rivets live integration', () => {
  it('boots the dedicated live installer after final D1 card ownership', () => {
    const html = read('index.html');
    const d1 = html.indexOf("./src/phase-d1-runtime.js?v=16");
    const piercing = html.indexOf("./src/upgrades/piercing-rivets-live.js?v=1");
    expect(d1).toBeGreaterThan(-1);
    expect(piercing).toBeGreaterThan(d1);
  });

  it('keeps card-art specialization and baseline migration outside the large D1 owner', () => {
    const live = read('src/upgrades/piercing-rivets-live.js');
    const d1 = read('src/phase-d1-runtime.js');
    expect(live).toContain("PIERCING_RIVETS_ICON_TEXTURE = 'upgrade-icon-piercing-rivets'");
    expect(live).toContain('weaponBase: { ...current.state.base.weapon, pierceCount: 0 }');
    expect(live).toContain("upgrade?.id === 'piercing-rivets'");
    expect(d1).not.toContain('upgrade-icon-piercing-rivets');
  });
});
