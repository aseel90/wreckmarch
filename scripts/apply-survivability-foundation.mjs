import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const write = (p, s) => { fs.mkdirSync(p.split('/').slice(0,-1).join('/') || '.', { recursive: true }); fs.writeFileSync(p, s); };
const replace = (p, from, to) => { const s=read(p); if(!s.includes(from)) throw new Error(`Missing replacement in ${p}: ${from.slice(0,100)}`); write(p,s.replace(from,to)); };
const regexReplace = (p, re, to) => { const s=read(p); if(!re.test(s)) throw new Error(`Missing regex in ${p}: ${re}`); write(p,s.replace(re,to)); };

write('src/upgrades/definitions/field-repair.js', `import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=2';
import { UPGRADE_MECHANICAL_EFFECT_IDS } from '../upgrade-mechanical-effects.js?v=5';

export const FIELD_REPAIR_UPGRADE = Object.freeze({
  id: 'field-repair',
  name: 'FIELD REPAIR',
  description: 'Restore 25% max HP.',
  rarity: null,
  maxLevel: 3,
  scope: UPGRADE_SCOPES.CHARACTER,
  tags: ['HEAL', 'SURVIVABILITY', 'UTILITY'],
  requirements: [],
  weight: .78,
  offerRules: {},
  modifiers: Object.freeze([]),
  mechanicalEffect: Object.freeze({
    id: UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP,
    config: Object.freeze({ percentMaxHp: .25, requireMissingHp: true, minMissingFraction: .12 })
  }),
  artId: 'field-repair'
});
`);

write('src/upgrades/definitions/impact-shield.js', `import { UPGRADE_SCOPES } from '../upgrade-schema.js?v=2';
import { UPGRADE_MECHANICAL_EFFECT_IDS } from '../upgrade-mechanical-effects.js?v=5';

export const IMPACT_SHIELD_UPGRADE = Object.freeze({
  id: 'impact-shield',
  name: 'IMPACT SHIELD',
  description: 'Gain 1 shield charge. Absorbs the next hit. Max 2 charges.',
  rarity: 'COMMON',
  maxLevel: 2,
  scope: UPGRADE_SCOPES.CHARACTER,
  tags: ['SHIELD', 'SURVIVABILITY', 'UTILITY'],
  requirements: [],
  weight: .72,
  offerRules: {},
  modifiers: Object.freeze([]),
  mechanicalEffect: Object.freeze({
    id: UPGRADE_MECHANICAL_EFFECT_IDS.GRANT_SHIELD,
    config: Object.freeze({ charges: 1, maxCharges: 2 })
  }),
  artId: 'impact-shield'
});
`);

replace('src/upgrades/upgrade-mechanical-effects.js', "  RESTORE_HP: 'RESTORE_HP',\n  SUMMON_RIG: 'SUMMON_RIG'", "  RESTORE_HP: 'RESTORE_HP',\n  GRANT_SHIELD: 'GRANT_SHIELD',\n  SUMMON_RIG: 'SUMMON_RIG'");
{
  const p='src/upgrades/upgrade-mechanical-effects.js'; let s=read(p);
  const a=s.indexOf("  [UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP]:");
  const b=s.indexOf("\n\n  [UPGRADE_MECHANICAL_EFFECT_IDS.SUMMON_RIG]",a);
  if(a<0||b<0) throw new Error('RESTORE_HP factory boundaries missing');
  const block=`  [UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP]: ({ scene, definition, level, config, rarity, powerMultiplier }) => {
    const flatAmount = config.amount == null ? null : Number(config.amount);
    const percentMaxHp = config.percentMaxHp == null ? null : Number(config.percentMaxHp);
    if (flatAmount == null && percentMaxHp == null) throw new TypeError('RESTORE_HP requires amount or percentMaxHp');
    if (flatAmount != null && (!Number.isFinite(flatAmount) || flatAmount < 0)) throw new TypeError('RESTORE_HP amount must be a finite number >= 0');
    if (percentMaxHp != null && (!Number.isFinite(percentMaxHp) || percentMaxHp < 0)) throw new TypeError('RESTORE_HP percentMaxHp must be a finite number >= 0');
    const previousHp = Number(scene.heroHp);
    if (!Number.isFinite(previousHp)) throw new TypeError('RESTORE_HP requires finite scene.heroHp');
    return Object.freeze({
      apply() {
        const maxHp = Number(scene.heroMaxHp);
        if (!Number.isFinite(maxHp)) throw new TypeError('RESTORE_HP requires finite scene.heroMaxHp');
        const baseAmount = flatAmount != null ? flatAmount : maxHp * percentMaxHp;
        const amount = baseAmount * powerMultiplier;
        if (!Number.isFinite(amount) || amount < 0) throw new TypeError('RESTORE_HP scaled amount must be a finite number >= 0');
        const nextHp = Math.min(maxHp, previousHp + amount);
        scene.heroHp = nextHp;
        return Object.freeze({ id: definition.id, effectId: UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP, level, rarity, amount, healed: Math.max(0, nextHp - previousHp), previousHp, heroHp: nextHp, heroMaxHp: maxHp });
      },
      rollback() { scene.heroHp = previousHp; }
    });
  },

  [UPGRADE_MECHANICAL_EFFECT_IDS.GRANT_SHIELD]: ({ scene, definition, level, config, rarity }) => {
    const charges = Math.max(1, Math.floor(Number(config.charges) || 1));
    const maxCharges = Math.max(charges, Math.floor(Number(config.maxCharges) || 2));
    const previousCharges = Math.max(0, Math.floor(Number(scene.heroShieldCharges) || 0));
    return Object.freeze({
      apply() {
        const nextCharges = Math.min(maxCharges, previousCharges + charges);
        scene.heroShieldCharges = nextCharges;
        return Object.freeze({ id: definition.id, effectId: UPGRADE_MECHANICAL_EFFECT_IDS.GRANT_SHIELD, level, rarity, chargesGranted: nextCharges - previousCharges, heroShieldCharges: nextCharges, maxCharges });
      },
      rollback() { scene.heroShieldCharges = previousCharges; }
    });
  },`;
  s=s.slice(0,a)+block+s.slice(b); write(p,s);
}
replace('src/upgrades/upgrade-mechanical-effects.js', `const EFFECT_AVAILABILITY = Object.freeze({
  [UPGRADE_MECHANICAL_EFFECT_IDS.SUMMON_RIG]: (scene) => Boolean(`, `const EFFECT_AVAILABILITY = Object.freeze({
  [UPGRADE_MECHANICAL_EFFECT_IDS.RESTORE_HP]: (scene, definition) => {
    const config = definition?.mechanicalEffect?.config || {};
    if (!config.requireMissingHp) return true;
    const hp = Number(scene?.heroHp), maxHp = Number(scene?.heroMaxHp);
    if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) return false;
    const missingFraction = Math.max(0, (maxHp - hp) / maxHp);
    return missingFraction >= Math.max(0, Number(config.minMissingFraction) || 0);
  },
  [UPGRADE_MECHANICAL_EFFECT_IDS.GRANT_SHIELD]: (scene, definition) => {
    const maxCharges = Math.max(1, Math.floor(Number(definition?.mechanicalEffect?.config?.maxCharges) || 2));
    return Math.max(0, Math.floor(Number(scene?.heroShieldCharges) || 0)) < maxCharges;
  },
  [UPGRADE_MECHANICAL_EFFECT_IDS.SUMMON_RIG]: (scene) => Boolean(`);

replace('src/upgrades/upgrade-catalog.js', "import { ARMOR_PLATE_UPGRADE } from './definitions/armor-plate.js';", "import { ARMOR_PLATE_UPGRADE } from './definitions/armor-plate.js';\nimport { FIELD_REPAIR_UPGRADE } from './definitions/field-repair.js?v=1';\nimport { IMPACT_SHIELD_UPGRADE } from './definitions/impact-shield.js?v=1';");
replace('src/upgrades/upgrade-catalog.js', "  ARMOR_PLATE_UPGRADE,\n  CALL_RIG_UPGRADE", "  ARMOR_PLATE_UPGRADE,\n  FIELD_REPAIR_UPGRADE,\n  IMPACT_SHIELD_UPGRADE,\n  CALL_RIG_UPGRADE");
replace('src/upgrades/upgrade-runtime.js', "./upgrade-catalog.js?v=11", "./upgrade-catalog.js?v=12");
replace('src/upgrades/upgrade-runtime.js', "./upgrade-mechanical-effects.js?v=4", "./upgrade-mechanical-effects.js?v=5");

replace('src/combat/player-damage-rules.js', "  profile = {}\n}) {", "  profile = {},\n  shieldCharges = 0\n}) {");
replace('src/combat/player-damage-rules.js', `      appliedDamage: 0,
      nextHp: Math.max(0, finiteOr(currentHp, 0)),`, `      appliedDamage: 0,
      preventedDamage: 0,
      shieldAbsorbed: false,
      nextShieldCharges: Math.max(0, Math.floor(finiteOr(shieldCharges, 0))),
      nextHp: Math.max(0, finiteOr(currentHp, 0)),`);
replace('src/combat/player-damage-rules.js', `  const appliedDamage = Math.max(1, Math.round(baseDamage * incomingDamageMultiplier));
  const hp = Math.max(0, finiteOr(currentHp, 0));
  const nextHp = Math.max(0, hp - appliedDamage);`, `  const appliedDamage = Math.max(1, Math.round(baseDamage * incomingDamageMultiplier));
  const hp = Math.max(0, finiteOr(currentHp, 0));
  const availableShieldCharges = Math.max(0, Math.floor(finiteOr(shieldCharges, 0)));
  const shieldAbsorbed = availableShieldCharges > 0;
  const nextShieldCharges = shieldAbsorbed ? availableShieldCharges - 1 : availableShieldCharges;
  const preventedDamage = shieldAbsorbed ? appliedDamage : 0;
  const nextHp = shieldAbsorbed ? hp : Math.max(0, hp - appliedDamage);`);
replace('src/combat/player-damage-rules.js', `    ignored: false,
    appliedDamage,
    nextHp,
    killed: nextHp <= 0,`, `    ignored: false,
    appliedDamage: shieldAbsorbed ? 0 : appliedDamage,
    preventedDamage,
    shieldAbsorbed,
    nextShieldCharges,
    nextHp,
    killed: !shieldAbsorbed && nextHp <= 0,`);

replace('src/combat/player-damage-system.js', "./player-damage-rules.js?v=1", "./player-damage-rules.js?v=2");
replace('src/combat/player-damage-system.js', "      profile\n    });", "      profile,\n      shieldCharges: scene.heroShieldCharges\n    });");
replace('src/combat/player-damage-system.js', "    scene.lastHeroHit = now;\n    scene.heroHp = result.nextHp;", "    scene.lastHeroHit = now;\n    scene.heroShieldCharges = result.nextShieldCharges;\n    scene.heroHp = result.nextHp;");
{
  const p='src/combat/player-damage-system.js'; let s=read(p);
  const a=s.indexOf('    // Damage feedback should read as a quick hit');
  const b=s.indexOf('\n\n    if (result.killed)',a);
  if(a<0||b<0) throw new Error('player feedback boundaries missing');
  const block=`    if (result.shieldAbsorbed) {
      try { scene.runTelemetry?.recordShieldAbsorb?.({ preventedDamage: result.preventedDamage, source: enemy?.__sawbugAcidImpact ? 'sawbug-acid' : enemy?.enemyId || 'contact' }); }
      catch (error) { globalThis.__WM_LOG__?.(\`Run Telemetry shield attribution failed: \${error?.message || error}\`); }
      const ring = scene.add.circle(hero.x, hero.y, 38, 0x5ad9f0, .08).setStrokeStyle(3, 0x9ff3ff, .92).setDepth(79);
      scene.tweens.add({ targets: ring, scale: 1.55, alpha: 0, duration: 220, ease: 'Quad.Out', onComplete: () => ring.destroy() });
      const shieldText = scene.add.text(hero.x, hero.y - 72, 'SHIELD', { fontFamily: 'Arial Black, Arial', fontSize: '17px', color: '#9ff3ff', stroke: '#0a1820', strokeThickness: 4 }).setOrigin(.5).setDepth(80);
      scene.tweens.add({ targets: shieldText, y: shieldText.y - 28, alpha: 0, duration: 460, ease: 'Cubic.Out', onComplete: () => shieldText.destroy() });
      scene.playTone(420, .055, 'triangle', .018, 80);
    } else {
      const requestedFlashDurationMs = Number.isFinite(Number(profile.hitFlashDurationMs)) ? Number(profile.hitFlashDurationMs) : DEFAULT_PLAYER_COMBAT_PROFILE.hitFlashDurationMs;
      const hitFlashColor = 0xff9a8c, hitFlashAlpha = .88, hitFlashDurationMs = Phaser.Math.Clamp(requestedFlashDurationMs, 35, 50), hitFlashRepeats = 0;
      hero.setTint(hitFlashColor);
      scene.tweens.add({ targets: hero, alpha: hitFlashAlpha, duration: hitFlashDurationMs, yoyo: true, repeat: hitFlashRepeats, onComplete: () => { if (scene.hero?.active) { scene.hero.clearTint(); scene.hero.setAlpha(1); } } });
      scene.cameras.main.shake(70, .0032); scene.playTone(110, .055, 'square', .022, -45);
      const damageText = scene.add.text(hero.x, hero.y - 72, \`-\${result.appliedDamage}\`, { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#ff7768', stroke: '#160e0d', strokeThickness: 4 }).setOrigin(.5).setDepth(80);
      scene.tweens.add({ targets: damageText, y: damageText.y - 34, alpha: 0, duration: 520, ease: 'Cubic.Out', onComplete: () => damageText.destroy() });
    }`;
  s=s.slice(0,a)+block+s.slice(b); write(p,s);
}

replace('src/combat/enemy-combat-system.js', "    this.spawnRivetImpactFx(impactX, impactY, velocityX, velocityY, enemyId);", "    this.spawnRivetImpactFx(impactX, impactY, velocityX, velocityY, enemyId);\n    if (bullet.isCritical && result.appliedDamage > 0) this.spawnCriticalHitFx(impactX, impactY, result.appliedDamage);");
{
  const p='src/combat/enemy-combat-system.js'; let s=read(p); const marker='\n  applyTexturePreservingHitTint'; const i=s.indexOf(marker); if(i<0) throw new Error('critical method marker missing');
  const method=`
  spawnCriticalHitFx(x, y, damage) {
    const scene = this.scene;
    const label = scene.add.text(x, y - 30, \`CRIT! \${Math.max(1, Math.round(Number(damage) || 0))}\`, { fontFamily: 'Arial Black, Arial', fontSize: '16px', color: '#ffe08a', stroke: '#271607', strokeThickness: 4 }).setOrigin(.5).setDepth(82).setScale(.88);
    scene.tweens.add({ targets: label, y: label.y - 28, scale: 1.08, alpha: 0, duration: 430, ease: 'Cubic.Out', onComplete: () => label.destroy() });
    const ring = scene.add.circle(x, y, 8, 0xffc85b, .04).setStrokeStyle(2, 0xffdf83, .9).setDepth(34);
    scene.tweens.add({ targets: ring, scale: 2.15, alpha: 0, duration: 150, ease: 'Quad.Out', onComplete: () => ring.destroy() });
  }
`;
  s=s.slice(0,i)+method+s.slice(i); write(p,s);
}
replace('src/combat/combat-system.js', "./enemy-combat-system.js?v=7", "./enemy-combat-system.js?v=8");
replace('src/combat/combat-system.js', "./player-damage-system.js?v=3", "./player-damage-system.js?v=4");
replace('src/enemies/enemy-system.js', "../combat/combat-system.js?v=11", "../combat/combat-system.js?v=12");

replace('src/telemetry/run-telemetry.js', "criticalHits: 0, criticalDamageDealt: 0,", "criticalHits: 0, criticalDamageDealt: 0, healingReceived: 0, shieldHitsAbsorbed: 0, shieldDamagePrevented: 0,");
{
 const p='src/telemetry/run-telemetry.js'; let s=read(p); const marker='\n  observeProjectile(projectile)'; const i=s.indexOf(marker); if(i<0) throw new Error('telemetry method marker missing');
 const method=`
  recordShieldAbsorb({ preventedDamage = 0 } = {}) {
    if (this.finalized) return 0;
    const prevented = Math.max(0, n(preventedDamage));
    if (prevented <= 0) return 0;
    const combat = this.report.combat;
    combat.shieldHitsAbsorbed = n(combat.shieldHitsAbsorbed) + 1;
    combat.shieldDamagePrevented = n(combat.shieldDamagePrevented) + prevented;
    return prevented;
  }
`;
 s=s.slice(0,i)+method+s.slice(i); write(p,s);
}
replace('src/telemetry/run-telemetry.js', "    if (hp < this.previousHeroHp) {\n      const damage", "    if (hp > this.previousHeroHp) this.report.combat.healingReceived += Math.max(0, hp - this.previousHeroHp);\n    if (hp < this.previousHeroHp) {\n      const damage");
replace('src/telemetry/run-telemetry.js', "    combat.criticalDamageDealt = round(combat.criticalDamageDealt);", "    combat.criticalDamageDealt = round(combat.criticalDamageDealt);\n    combat.healingReceived = round(combat.healingReceived);\n    combat.shieldDamagePrevented = round(combat.shieldDamagePrevented);");
replace('src/telemetry/telemetry-runtime.js', "./run-telemetry.js?v=4", "./run-telemetry.js?v=5");

replace('src/upgrades/upgrade-card-art.js', "  'critical-rivet': 'upgrade-icon-critical-rivet'", "  'critical-rivet': 'upgrade-icon-critical-rivet',\n  'field-repair': 'upgrade-icon-field-repair',\n  'impact-shield': 'upgrade-icon-impact-shield'");
{
 const p='src/upgrades/upgrade-card-art.js'; let s=read(p); const marker='\nexport function installUpgradeCardArt'; const i=s.indexOf(marker); if(i<0) throw new Error('art marker missing');
 const builders=`
function buildFieldRepairIcon(scene) {
  const textureKey = UPGRADE_CARD_ART_TEXTURES['field-repair']; if (scene.textures.exists(textureKey)) return textureKey;
  const g=scene.make.graphics({add:false}); g.fillStyle(0x10171c,1).fillRoundedRect(18,18,92,76,12); g.lineStyle(4,0x4b565c,1).strokeRoundedRect(18,18,92,76,12); g.fillStyle(0x2f3d42,1).fillRoundedRect(38,28,52,58,8); g.lineStyle(3,0x7a8b91,.9).strokeRoundedRect(38,28,52,58,8); g.fillStyle(0x55d8e5,.95).fillRoundedRect(58,38,12,38,3).fillRoundedRect(45,51,38,12,3); g.fillStyle(0xbff8ff,1).fillCircle(64,57,4); g.lineStyle(5,0xc66c32,1).lineBetween(22,88,47,70); g.lineStyle(3,0xffd07a,1).lineBetween(24,85,48,68); g.generateTexture(textureKey,128,112); g.destroy(); return textureKey;
}
function buildImpactShieldIcon(scene) {
  const textureKey=UPGRADE_CARD_ART_TEXTURES['impact-shield']; if(scene.textures.exists(textureKey)) return textureKey;
  const g=scene.make.graphics({add:false}); g.fillStyle(0x10171c,1).fillRoundedRect(18,18,92,76,12); g.lineStyle(4,0x4b565c,1).strokeRoundedRect(18,18,92,76,12); g.fillStyle(0x25343b,1).fillTriangle(64,23,101,37,92,78).fillTriangle(64,23,27,37,36,78).fillTriangle(36,78,92,78,64,98); g.lineStyle(4,0x55d8e5,.95).beginPath().moveTo(64,23).lineTo(101,37).lineTo(92,78).lineTo(64,98).lineTo(36,78).lineTo(27,37).closePath().strokePath(); g.lineStyle(2,0xbff8ff,.78).strokeCircle(64,58,19); g.fillStyle(0xbff8ff,.95).fillCircle(64,58,6); g.generateTexture(textureKey,128,112); g.destroy(); return textureKey;
}
`;
 s=s.slice(0,i)+builders+s.slice(i); write(p,s);
}
replace('src/upgrades/upgrade-card-art.js', "  buildCriticalRivetIcon(scene);", "  buildCriticalRivetIcon(scene);\n  buildFieldRepairIcon(scene);\n  buildImpactShieldIcon(scene);");

for (const p of ['src/phase-c-runtime.js','src/phase-c1-runtime.js']) {
  regexReplace(p, /\.\/upgrades\/upgrade-runtime\.js\?v=\d+/, './upgrades/upgrade-runtime.js?v=13');
  replace(p, "    createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' }),", "    createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' }),\n    createRegisteredUpgradeChoice(scene, 'field-repair', { category: 'UTILITY' }),\n    createRegisteredUpgradeChoice(scene, 'impact-shield', { category: 'UTILITY' }),");
}
replace('src/phase-d1-runtime.js', "./upgrades/upgrade-card-art.js?v=4", "./upgrades/upgrade-card-art.js?v=5");

replace('index.html', './src/telemetry/telemetry-runtime.js?v=12', './src/telemetry/telemetry-runtime.js?v=13');
replace('index.html', './src/enemies/enemy-system.js?v=21', './src/enemies/enemy-system.js?v=22');
replace('index.html', './src/phase-c-runtime.js?v=18', './src/phase-c-runtime.js?v=19');
replace('index.html', './src/phase-c1-runtime.js?v=15', './src/phase-c1-runtime.js?v=16');
replace('index.html', './src/phase-d1-runtime.js?v=23', './src/phase-d1-runtime.js?v=24');

write('tests/unit/survivability-upgrades.test.ts', `import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolvePlayerContactHit } from '../../src/combat/player-damage-rules.js';
import { RunTelemetry } from '../../src/telemetry/run-telemetry.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyRegisteredUpgrade, canApplyRegisteredUpgrade } from '../../src/upgrades/upgrade-runtime.js';
const scene=(heroHp=50,heroMaxHp=100)=>({heroHp,heroMaxHp,heroShieldCharges:0,upgradeLevels:{},upgradeRarityHistory:{},runTime:0,level:1,scrap:0});
describe('survivability utility cards',()=>{
 it('Field Repair restores rarity-scaled max-HP percentage and hides near full HP',()=>{const d=getUpgradeDefinition('field-repair');expect(d?.description).toBe('Restore 25% max HP.');const s=scene(40,100);expect(canApplyRegisteredUpgrade(s,'field-repair')).toBe(true);applyRegisteredUpgrade(s,'field-repair',{rarity:'LEGENDARY'});expect(s.heroHp).toBeCloseTo(77.5,8);expect(canApplyRegisteredUpgrade(scene(92,100),'field-repair')).toBe(false)});
 it('Impact Shield is Common-only and capped at two charges',()=>{const s=scene();applyRegisteredUpgrade(s,'impact-shield',{rarity:'LEGENDARY'});expect(s.heroShieldCharges).toBe(1);expect(s.upgradeRarityHistory['impact-shield']).toEqual(['COMMON']);applyRegisteredUpgrade(s,'impact-shield');expect(s.heroShieldCharges).toBe(2);expect(canApplyRegisteredUpgrade(s,'impact-shield')).toBe(false)});
 it('shield consumes a charge before HP',()=>{const r=resolvePlayerContactHit({currentHp:60,shieldCharges:2,lastHitAt:0,now:1000,enemyDamage:11,heroX:10,heroY:0,enemyX:0,enemyY:0});expect(r).toMatchObject({shieldAbsorbed:true,preventedDamage:11,appliedDamage:0,nextShieldCharges:1,nextHp:60,killed:false})});
 it('telemetry tracks healing and prevented shield damage',()=>{const s=scene(50,100);const t=new RunTelemetry(s,{now:()=>0,reportIdFactory:()=> 'survival-test'});s.heroHp=75;t.observePlayerDamage([]);t.recordShieldAbsorb({preventedDamage:12});const r=t.getReport();expect(r.combat.healingReceived).toBe(25);expect(r.combat.shieldHitsAbsorbed).toBe(1);expect(r.combat.shieldDamagePrevented).toBe(12)});
 it('critical feedback is owned by EnemyCombatSystem',()=>{const source=fs.readFileSync(new URL('../../src/combat/enemy-combat-system.js',import.meta.url),'utf8');expect(source).toContain('if (bullet.isCritical && result.appliedDamage > 0) this.spawnCriticalHitFx');expect(source).toContain('CRIT!')});
});
`);

replace('tests/unit/player-damage-rules.test.ts', "\n  it('reports lethal contact", `
  it('absorbs one valid hit with a shield charge before HP is reduced', () => {
    const result = resolvePlayerContactHit({ currentHp: 55, shieldCharges: 1, lastHitAt: 0, now: 1000, enemyDamage: 12, heroX: 0, heroY: 0, enemyX: -10, enemyY: 0, profile: DEFAULT_PLAYER_COMBAT_PROFILE });
    expect(result.shieldAbsorbed).toBe(true); expect(result.preventedDamage).toBe(12); expect(result.appliedDamage).toBe(0); expect(result.nextShieldCharges).toBe(0); expect(result.nextHp).toBe(55); expect(result.killed).toBe(false);
  });

  it('reports lethal contact`);
replace('tests/unit/upgrade-card-art.test.ts', "    expect(UPGRADE_CARD_ART_TEXTURES['critical-rivet']).toBe('upgrade-icon-critical-rivet');", "    expect(UPGRADE_CARD_ART_TEXTURES['critical-rivet']).toBe('upgrade-icon-critical-rivet');\n    expect(UPGRADE_CARD_ART_TEXTURES['field-repair']).toBe('upgrade-icon-field-repair');\n    expect(UPGRADE_CARD_ART_TEXTURES['impact-shield']).toBe('upgrade-icon-impact-shield');");
replace('tests/unit/upgrade-card-art.test.ts', "upgrade-card-art.js?v=4", "upgrade-card-art.js?v=5");
replace('tests/unit/upgrade-card-art.test.ts', "    expect(art).toContain(\"'critical-rivet': 'upgrade-icon-critical-rivet'\");", "    expect(art).toContain(\"'critical-rivet': 'upgrade-icon-critical-rivet'\");\n    expect(art).toContain(\"'field-repair': 'upgrade-icon-field-repair'\");\n    expect(art).toContain(\"'impact-shield': 'upgrade-icon-impact-shield'\");");
replace('tests/unit/upgrade-card-art.test.ts', './src/phase-d1-runtime.js?v=22', './src/phase-d1-runtime.js?v=24');

replace('COMBAT_BUILD_BALANCE_ROADMAP.md', '| 19 | Armor/stat combat semantics | ⚪ PENDING | Define one canonical mitigation/armor contract before armor becomes a character identity axis |', '| 19 | Armor/stat combat semantics + survivability utility | 🟡 FOUNDATION IMPLEMENTED | Keep armor mitigation separate; Armor Plate, Field Repair and Impact Shield provide bounded survivability without becoming raw DPS |');
replace('COMBAT_BUILD_BALANCE_ROADMAP.md', '\n## Execution rule\n', `
### Survivability utility package — 🟡 IMPLEMENTED / REVALIDATION PENDING

- **Armor Plate:** hybrid durability, +15 max HP plus its existing small restore.
- **Field Repair:** restore **25% max HP** at Common, rarity-scaled, offered only while meaningfully damaged.
- **Impact Shield:** Common-only hit-charge mechanic, maximum **2 charges**, one absorbed incoming hit per charge; it is not the armor stat.
- Shield absorption routes through canonical PlayerDamageSystem, including Sawbug acid.
- Critical projectile damage shows readable **CRIT! + damage** feedback on the enemy.
- Telemetry records healing received, shield hits absorbed and prevented shield damage.
- Lifesteal/passive regeneration/permanent percentage mitigation stay deferred until this bounded survival package is revalidated.

## Execution rule
`);

for (const p of ['src/upgrades/upgrade-mechanical-effects.js','src/upgrades/upgrade-catalog.js','src/upgrades/upgrade-runtime.js','src/combat/player-damage-rules.js','src/combat/player-damage-system.js','src/combat/enemy-combat-system.js','src/combat/combat-system.js','src/enemies/enemy-system.js','src/telemetry/run-telemetry.js','src/telemetry/telemetry-runtime.js','src/upgrades/upgrade-card-art.js','src/phase-c-runtime.js','src/phase-c1-runtime.js','src/phase-d1-runtime.js']) {
  new Function(read(p).replace(/^import .*$/mg,'').replace(/^export /mg,''));
}
console.log('Survivability foundation source migration applied.');
