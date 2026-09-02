import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('weapon registry live ownership', () => {
  it('removes Phase B/C weapon stat literals as gameplay owners', () => {
    const phaseB = read('src/phase-b-runtime.js');
    const phaseC = read('src/phase-c-runtime.js');
    expect(phaseB).toContain("createWeaponRuntimeState(scene.startingWeaponId || 'rivet-gun')");
    expect(phaseB).not.toContain("id: 'scrap-rivet-gun'");
    expect(phaseB).not.toContain('range: 570');
    expect(phaseB).not.toContain('projectileSpeed: 760');
    expect(phaseC).toContain("createWeaponRuntimeState(scene.primaryWeapon?.id || scene.startingWeaponId || 'rivet-gun')");
    expect(phaseC).not.toContain('projectileSpeed: scene.primaryWeapon.projectileSpeed || 720');
  });

  it('requires exact signature weapon identity in the final Production self-test', () => {
    const d1 = read('src/phase-d1-runtime.js');
    expect(d1).toContain("weaponIdentity:s.characterSystem?.weaponDefinition?.id==='rivet-gun'");
    expect(d1).toContain("s.activeWeaponId==='rivet-gun'");
    expect(d1).toContain("s.primaryWeapon?.id==='rivet-gun'");
  });

  it('verifies the approved Shotgun foundation after the main Pages workflow without activating it', () => {
    const workflow = read('.github/workflows/ws14-shotgun-source.yml');
    expect(workflow).toContain('workflow_run:');
    expect(workflow).toContain('workflows: ["Test and Deploy Wreckmarch"]');
    expect(workflow).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(workflow).toContain('src/combat/definitions/shotgun.js?build=${SHA}');
    expect(workflow).toContain('projectileCount: 5');
    expect(workflow).toContain('halfSpreadRadians: 0.24');
    expect(workflow).toContain('fireDelay: 720');
    expect(workflow).toContain('range: 330');
    expect(workflow).toContain('volleyDamageMultiplier: 1.75');
  });
});
