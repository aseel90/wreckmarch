import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const roadmap = readFileSync('UPGRADE_SYSTEM_2_ROADMAP.md', 'utf8');

const protectedAnchors = [
  '## 0.0. Roadmap integrity guard — DO NOT DELETE PLANNED SCOPE',
  '## 0. Core development rule — NO PATCH-ON-PATCH',
  '# 1. Current game baseline — preserve this',
  '# 2. Design model',
  '# 3. Character identity and stats',
  '# 4. Character stats vs weapon stats vs run state',
  '# 5. Deterministic Stat Resolver',
  '# 6. Upgrade Registry — data-driven cards',
  '# 7. Rarity system',
  '# 8. Levels, duplicates and offer rules',
  '# 9. Upgrade tags and scopes',
  '# 10. Hunter / Rivet build expansion',
  '### Piercing Rivets',
  '### Ricochet',
  '### Shrapnel Impact',
  '### Critical Rivet',
  '### Explosive Rivet',
  '### Triple Riveter',
  '# 11. Build identities',
  '### Heavy / penetration build',
  '### Rapid multishot build',
  '### Precision / critical build',
  '# 12. Prerequisites, synergies and evolutions',
  '# 13. Stat caps and safety limits',
  '# 14. Upgrade card visual/UI improvement',
  '# 15. Run stats screen',
  '# 16. Status effects — architecture only for now',
  '# 17. Temporary run progression vs permanent progression',
  '# 18. Future playable characters — compatibility contract',
  '# 19. Robot Dog / Companion boundary',
  '# 20. Balance targets',
  '# 21. Testing and regression protection',
  '# 21.1. Chromium live deployment gate',
  '# 21.2. Sharded Playwright E2E gate',
  '# 22. Cleanup / architecture debt pass',
  '# 23. Implementation order — DO NOT SKIP AHEAD',
  '## Phase U4 — New Hunter build cards',
  '## Phase U5 — Card visual overhaul',
  '## Phase U6 — Run stats/build panel',
  '## Phase U7 — Balance and cleanup',
  '# 24. Definition of Done',
  '## Working discipline',
] as const;

describe('Upgrade System 2.0 roadmap integrity', () => {
  it('keeps every protected section and approved new-card/build anchor', () => {
    for (const anchor of protectedAnchors) {
      expect(roadmap, `missing protected roadmap anchor: ${anchor}`).toContain(anchor);
    }
  });

  it('keeps the roadmap-removal approval rule visible', () => {
    expect(roadmap).toContain('ROADMAP-REMOVAL:');
    expect(roadmap).toContain('explicit user approval');
    expect(roadmap).toContain('localized patches');
  });

  it('does not regress to a core-only roadmap', () => {
    expect(roadmap).toContain('U4–U7');
    expect(roadmap).toContain('NEXT ACTIVE PHASE');
    expect(roadmap).not.toContain('Upgrade System 2.0 core migration has no remaining active implementation item.');
  });
});
