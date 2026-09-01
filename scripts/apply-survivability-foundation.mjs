import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const write = (p, s) => { fs.mkdirSync(p.split('/').slice(0, -1).join('/') || '.', { recursive: true }); fs.writeFileSync(p, s); };
function replaceRequired(p, from, to) {
  let s = read(p);
  if (s.includes(to)) return;
  if (!s.includes(from)) throw new Error(`Missing replacement in ${p}: ${from.slice(0, 90)}`);
  write(p, s.replace(from, to));
}
function insertBeforeOnce(p, marker, block, sentinel) {
  let s = read(p);
  if (s.includes(sentinel)) return;
  const i = s.indexOf(marker);
  if (i < 0) throw new Error(`Missing marker in ${p}: ${marker}`);
  write(p, s.slice(0, i) + block + s.slice(i));
}

// Custom card art for the two survival utilities.
replaceRequired('src/upgrades/upgrade-card-art.js',
  "  'critical-rivet': 'upgrade-icon-critical-rivet'",
  "  'critical-rivet': 'upgrade-icon-critical-rivet',\n  'field-repair': 'upgrade-icon-field-repair',\n  'impact-shield': 'upgrade-icon-impact-shield'");
insertBeforeOnce('src/upgrades/upgrade-card-art.js', '\nexport function installUpgradeCardArt', `
function buildFieldRepairIcon(scene) {
  const textureKey = UPGRADE_CARD_ART_TEXTURES['field-repair'];
  if (scene.textures.exists(textureKey)) return textureKey;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x10171c, 1).fillRoundedRect(18, 18, 92, 76, 12);
  g.lineStyle(4, 0x4b565c, 1).strokeRoundedRect(18, 18, 92, 76, 12);
  g.fillStyle(0x2f3d42, 1).fillRoundedRect(38, 28, 52, 58, 8);
  g.lineStyle(3, 0x7a8b91, .9).strokeRoundedRect(38, 28, 52, 58, 8);
  g.fillStyle(0x55d8e5, .95).fillRoundedRect(58, 38, 12, 38, 3).fillRoundedRect(45, 51, 38, 12, 3);
  g.fillStyle(0xbff8ff, 1).fillCircle(64, 57, 4);
  g.lineStyle(5, 0xc66c32, 1).lineBetween(22, 88, 47, 70);
  g.lineStyle(3, 0xffd07a, 1).lineBetween(24, 85, 48, 68);
  g.generateTexture(textureKey, 128, 112);
  g.destroy();
  return textureKey;
}

function buildImpactShieldIcon(scene) {
  const textureKey = UPGRADE_CARD_ART_TEXTURES['impact-shield'];
  if (scene.textures.exists(textureKey)) return textureKey;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x10171c, 1).fillRoundedRect(18, 18, 92, 76, 12);
  g.lineStyle(4, 0x4b565c, 1).strokeRoundedRect(18, 18, 92, 76, 12);
  g.fillStyle(0x25343b, 1).fillTriangle(64, 23, 101, 37, 92, 78).fillTriangle(64, 23, 27, 37, 36, 78).fillTriangle(36, 78, 92, 78, 64, 98);
  g.lineStyle(4, 0x55d8e5, .95).beginPath().moveTo(64, 23).lineTo(101, 37).lineTo(92, 78).lineTo(64, 98).lineTo(36, 78).lineTo(27, 37).closePath().strokePath();
  g.lineStyle(2, 0xbff8ff, .78).strokeCircle(64, 58, 19);
  g.fillStyle(0xbff8ff, .95).fillCircle(64, 58, 6);
  g.generateTexture(textureKey, 128, 112);
  g.destroy();
  return textureKey;
}
`, 'function buildFieldRepairIcon(scene)');
replaceRequired('src/upgrades/upgrade-card-art.js',
  '  buildCriticalRivetIcon(scene);',
  '  buildCriticalRivetIcon(scene);\n  buildFieldRepairIcon(scene);\n  buildImpactShieldIcon(scene);');

// Put both cards into every canonical live upgrade pool and refresh the module graph.
replaceRequired('src/phase-c-runtime.js', "./upgrades/upgrade-runtime.js?v=9", "./upgrades/upgrade-runtime.js?v=13");
replaceRequired('src/phase-c-runtime.js',
  "    createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' }),\n    createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' })",
  "    createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' }),\n    createRegisteredUpgradeChoice(scene, 'field-repair', { category: 'UTILITY' }),\n    createRegisteredUpgradeChoice(scene, 'impact-shield', { category: 'UTILITY' }),\n    createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' })");
replaceRequired('src/phase-c1-runtime.js', "./upgrades/upgrade-runtime.js?v=12", "./upgrades/upgrade-runtime.js?v=13");
replaceRequired('src/phase-c1-runtime.js',
  "  'scrap-magnet', 'armor-plate', 'call-rig', 'rig-overdrive', 'twin-cannon'",
  "  'scrap-magnet', 'armor-plate', 'field-repair', 'impact-shield', 'call-rig', 'rig-overdrive', 'twin-cannon'");
replaceRequired('src/phase-c1-runtime.js',
  "    createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' }),\n    createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' })",
  "    createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' }),\n    createRegisteredUpgradeChoice(scene, 'field-repair', { category: 'UTILITY' }),\n    createRegisteredUpgradeChoice(scene, 'impact-shield', { category: 'UTILITY' }),\n    createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' })");
replaceRequired('src/phase-d1-runtime.js', "./upgrades/upgrade-card-art.js?v=4", "./upgrades/upgrade-card-art.js?v=5");

for (const [from, to] of [
  ['./src/telemetry/telemetry-runtime.js?v=12', './src/telemetry/telemetry-runtime.js?v=13'],
  ['./src/enemies/enemy-system.js?v=21', './src/enemies/enemy-system.js?v=22'],
  ['./src/phase-c-runtime.js?v=17', './src/phase-c-runtime.js?v=18'],
  ['./src/phase-c1-runtime.js?v=15', './src/phase-c1-runtime.js?v=16'],
  ['./src/phase-d1-runtime.js?v=22', './src/phase-d1-runtime.js?v=23']
]) replaceRequired('index.html', from, to);

// Regression coverage.
replaceRequired('tests/unit/player-damage-rules.test.ts',
  "\n  it('reports lethal contact without allowing negative HP'",
  `\n  it('absorbs one valid hit with a shield charge before HP is reduced', () => {\n    const result = resolvePlayerContactHit({ currentHp: 55, shieldCharges: 1, lastHitAt: 0, now: 1000, enemyDamage: 12, heroX: 0, heroY: 0, enemyX: -10, enemyY: 0, profile: DEFAULT_PLAYER_COMBAT_PROFILE });\n    expect(result.shieldAbsorbed).toBe(true);\n    expect(result.preventedDamage).toBe(12);\n    expect(result.appliedDamage).toBe(0);\n    expect(result.nextShieldCharges).toBe(0);\n    expect(result.nextHp).toBe(55);\n    expect(result.killed).toBe(false);\n  });\n\n  it('reports lethal contact without allowing negative HP'`);
replaceRequired('tests/unit/upgrade-card-art.test.ts',
  "    expect(UPGRADE_CARD_ART_TEXTURES['critical-rivet']).toBe('upgrade-icon-critical-rivet');",
  "    expect(UPGRADE_CARD_ART_TEXTURES['critical-rivet']).toBe('upgrade-icon-critical-rivet');\n    expect(UPGRADE_CARD_ART_TEXTURES['field-repair']).toBe('upgrade-icon-field-repair');\n    expect(UPGRADE_CARD_ART_TEXTURES['impact-shield']).toBe('upgrade-icon-impact-shield');");
replaceRequired('tests/unit/upgrade-card-art.test.ts', 'upgrade-card-art.js?v=4', 'upgrade-card-art.js?v=5');
replaceRequired('tests/unit/upgrade-card-art.test.ts',
  "    expect(art).toContain(\"'critical-rivet': 'upgrade-icon-critical-rivet'\");",
  "    expect(art).toContain(\"'critical-rivet': 'upgrade-icon-critical-rivet'\");\n    expect(art).toContain(\"'field-repair': 'upgrade-icon-field-repair'\");\n    expect(art).toContain(\"'impact-shield': 'upgrade-icon-impact-shield'\");");
replaceRequired('tests/unit/upgrade-card-art.test.ts', './src/phase-d1-runtime.js?v=22', './src/phase-d1-runtime.js?v=23');

write('tests/unit/survivability-upgrades.test.ts', `import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolvePlayerContactHit } from '../../src/combat/player-damage-rules.js';
import { RunTelemetry } from '../../src/telemetry/run-telemetry.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyRegisteredUpgrade, canApplyRegisteredUpgrade } from '../../src/upgrades/upgrade-runtime.js';

const scene = (heroHp = 50, heroMaxHp = 100) => ({ heroHp, heroMaxHp, heroShieldCharges: 0, upgradeLevels: {}, upgradeRarityHistory: {}, runTime: 0, level: 1, scrap: 0 });

describe('survivability utility cards', () => {
  it('Field Repair restores rarity-scaled max-HP percentage and hides near full HP', () => {
    const definition = getUpgradeDefinition('field-repair');
    expect(definition?.description).toBe('Restore 25% max HP.');
    const s = scene(40, 100);
    expect(canApplyRegisteredUpgrade(s, 'field-repair')).toBe(true);
    applyRegisteredUpgrade(s, 'field-repair', { rarity: 'LEGENDARY' });
    expect(s.heroHp).toBeCloseTo(77.5, 8);
    expect(canApplyRegisteredUpgrade(scene(92, 100), 'field-repair')).toBe(false);
  });

  it('Impact Shield is Common-only and capped at two charges', () => {
    const s = scene();
    applyRegisteredUpgrade(s, 'impact-shield', { rarity: 'LEGENDARY' });
    expect(s.heroShieldCharges).toBe(1);
    expect(s.upgradeRarityHistory['impact-shield']).toEqual(['COMMON']);
    applyRegisteredUpgrade(s, 'impact-shield');
    expect(s.heroShieldCharges).toBe(2);
    expect(canApplyRegisteredUpgrade(s, 'impact-shield')).toBe(false);
  });

  it('shield consumes a charge before HP', () => {
    const result = resolvePlayerContactHit({ currentHp: 60, shieldCharges: 2, lastHitAt: 0, now: 1000, enemyDamage: 11, heroX: 10, heroY: 0, enemyX: 0, enemyY: 0 });
    expect(result).toMatchObject({ shieldAbsorbed: true, preventedDamage: 11, appliedDamage: 0, nextShieldCharges: 1, nextHp: 60, killed: false });
  });

  it('telemetry tracks healing and prevented shield damage', () => {
    const s = scene(50, 100);
    const telemetry = new RunTelemetry(s, { now: () => 0, reportIdFactory: () => 'survival-test' });
    s.heroHp = 75;
    telemetry.observePlayerDamage([]);
    telemetry.recordShieldAbsorb({ preventedDamage: 12 });
    const report = telemetry.getReport();
    expect(report.combat.healingReceived).toBe(25);
    expect(report.combat.shieldHitsAbsorbed).toBe(1);
    expect(report.combat.shieldDamagePrevented).toBe(12);
  });

  it('wires both cards into live pools and critical feedback into combat', () => {
    const phaseC = fs.readFileSync(new URL('../../src/phase-c-runtime.js', import.meta.url), 'utf8');
    const phaseC1 = fs.readFileSync(new URL('../../src/phase-c1-runtime.js', import.meta.url), 'utf8');
    const enemyCombat = fs.readFileSync(new URL('../../src/combat/enemy-combat-system.js', import.meta.url), 'utf8');
    expect(phaseC).toContain("'field-repair'");
    expect(phaseC).toContain("'impact-shield'");
    expect(phaseC1).toContain("'field-repair'");
    expect(phaseC1).toContain("'impact-shield'");
    expect(enemyCombat).toContain('CRIT!');
  });
});
`);

// Roadmap: make survivability a formal future build axis, not an ad-hoc patch.
replaceRequired('COMBAT_BUILD_BALANCE_ROADMAP.md',
  '| 19 | Armor/stat combat semantics | ⚪ PENDING | Define one canonical mitigation/armor contract before armor becomes a character identity axis |',
  '| 19 | Armor/stat combat semantics + survivability utility | 🟡 FOUNDATION IMPLEMENTED / REVALIDATION PENDING | Keep armor mitigation separate; bounded heal/shield utility is now part of build diversity and must be validated from telemetry |');
insertBeforeOnce('COMBAT_BUILD_BALANCE_ROADMAP.md', '\n## Execution rule\n', `
### Survivability cards roadmap — 🟡 FOUNDATION IMPLEMENTED / FUTURE EXPANSION PLANNED

Survivability is now a formal build axis alongside single-target damage, crowd clear, mobility and support. The goal is to let a player recover from a limited number of mistakes **without** making stationary/infinite-sustain builds optimal.

**Implemented foundation**

- **Armor Plate:** increases max HP and provides its existing small recovery; it remains separate from the future canonical armor-mitigation stat.
- **Field Repair:** instant bounded recovery — restores **25% max HP at Common**, scales with rarity, and is only offerable while meaningfully damaged.
- **Impact Shield:** Common-only charge card — **1 absorbed hit per charge, maximum 2 stored charges**. Shield absorption is owned by PlayerDamageSystem, including Sawbug acid/contact damage.
- **Critical feedback:** critical projectile hits display readable CRIT! + damage feedback above the damaged enemy.
- Telemetry now records **healing received**, **shield hits absorbed**, and **shield damage prevented** so survival value can be balanced from real runs instead of guessed.

**Future survivability card candidates — design only, not implemented yet**

- **Emergency Patch:** small one-time heal with stronger value at low HP; must have an offer/trigger gate so it cannot become infinite sustain.
- **Reactive Plating:** short, bounded protection after a shield breaks or after taking a hit; duration/cooldown must be explicit and must not duplicate the future Armor stat.
- **Last Stand:** once-per-run emergency protection/death-prevention candidate; high rarity and strict activation limits required.
- **Wave Resupply:** small heal or shield recharge at a controlled wave milestone; no per-kill healing loop.
- **Mobility survival utility:** temporary escape/movement tools may be explored later as survival value that does not directly add DPS.

**Guardrails for future survival cards**

- No unconditional lifesteal, endless passive regeneration or uncapped permanent percentage mitigation in this phase.
- Healing, shields and mitigation must have a measurable charge, cooldown, rarity, wave, or missing-HP budget.
- Survival cards must not erase Sawbug movement pressure or let Rust Hound/SURGE hits be ignored indefinitely.
- At least one post-change telemetry run must compare survival-card builds against damage-heavy builds before expanding this family further.
`, '### Survivability cards roadmap');

for (const p of ['src/upgrades/upgrade-card-art.js', 'src/phase-c-runtime.js', 'src/phase-c1-runtime.js', 'src/phase-d1-runtime.js']) {
  new Function(read(p).replace(/^import .*$/mg, '').replace(/^export /mg, ''));
}
console.log('Survivability final integration applied.');
