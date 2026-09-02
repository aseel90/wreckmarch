# Workstream 19 — Armor / Stat Combat Semantics + Survivability Utility

Status: ✅ COMPLETE / PRODUCTION VALIDATED

## Scope

WS19 closes the missing meaning of the already-canonical `character.armor` stat without inventing a new Armor card or changing the current Runner balance. Existing survivability cards remain separate axes:

- **Armor Plate** = max HP + bounded recovery. It does **not** secretly grant mitigation.
- **Field Repair** = bounded missing-health recovery.
- **Impact Shield** = bounded hit absorption with a 2-charge cap.
- **Armor** = persistent damage mitigation owned by the canonical player-damage rules.

Runner currently resolves to **0 Armor**, so WS19 does not alter current production damage taken.

## Canonical Armor semantics

Armor is a non-negative rating with diminishing returns:

`mitigation = min(0.50, armor / (armor + 100))`

Examples:

- 0 Armor → 0%
- 25 Armor → 20%
- 50 Armor → 33.33%
- 100+ Armor → capped at 50%

Order of operations for a valid player hit:

1. Resolve enemy/base damage.
2. Apply character `incomingDamageMultiplier`.
3. Apply Armor mitigation.
4. Round to the final HP-damage value with a minimum of 1 damage for a valid unshielded hit.
5. If an Impact Shield charge exists, absorb that final mitigated hit.
6. Apply HP loss / lethal handling.

Armor does not alter knockback, i-frames, shield charge count, healing, or enemy attack cadence.

## Why this shape

- Diminishing returns keeps future stacking readable.
- The 50% hard cap prevents unlimited permanent mitigation.
- Armor Plate stays semantically honest: HP is HP, Armor is mitigation.
- Shield remains a discrete emergency layer rather than being multiplied into an opaque pre-mitigation number.
- No current balance value changes because Runner has 0 Armor and no current upgrade grants Armor.

## Production delivery

WS19 changes the live player-damage path, so the cache chain is explicit:

- `player-damage-system.js` → `player-damage-rules.js?v=3`
- `combat-system.js` → `player-damage-system.js?v=5`
- `enemy-system.js` → `combat-system.js?v=13`
- `index.html` → `enemy-system.js?v=27`

No new `phase-*` or hotfix runtime layer is introduced.

## Existing production survivability evidence

RUN-0026 remains the reference showing the current utility family functioning inside a high-power build:

- 47.5 healing received
- 1 shield hit absorbed
- 11 shield damage prevented
- Runner still died in Wave 10

That evidence supports keeping Field Repair / Impact Shield bounded. It does not justify adding an Armor card yet.

## Acceptance

- [x] Armor has one pure canonical formula with diminishing returns and a hard cap.
- [x] Zero Armor exactly preserves the Runner baseline.
- [x] Armor applies after character incoming-damage scaling and before shield absorption.
- [x] Negative/invalid Armor cannot create vulnerability or amplification.
- [x] Armor does not alter knockback or i-frame semantics.
- [x] Live `runCombatStats.armor` is threaded into PlayerDamageSystem.
- [x] Armor Plate remains max-HP + recovery only.
- [x] No current card grants Armor.
- [x] Live cache chain has deterministic coverage.
- [x] Quality / unit checks green on final head.
- [x] Smoke green on final head.
- [x] Chromium shards 1–3 green on final head.
- [x] Aggregate E2E green on final head.
- [x] Exact merge SHA Live verification green.
- [x] Pages recovery green on the same merge SHA after the `index.html` change.

## Validation evidence

- Final PR: **#218** — `WS19: define canonical Armor and survivability semantics`
- Final PR head: `5745ad0f11ccbb268efd5a4f3566d7df6252145e`
- Merge SHA: `b47b62fc7fa6e094c78709235a09971d5ebe1f01`
- Quality: **PASSED**
- Smoke: **PASSED**
- Chromium E2E shards 1/3, 2/3, 3/3: **PASSED**
- Aggregate E2E: **PASSED**
- Exact-SHA iOS live verification: **PASSED** on `b47b62fc7fa6e094c78709235a09971d5ebe1f01`
- Exact-SHA Pages recovery: **PASSED** on `b47b62fc7fa6e094c78709235a09971d5ebe1f01`
- Live Chromium coverage includes the canonical Armor path: 25 Armor converts a 20-damage hit to 16 final HP damage.
- Current Runner remains at 0 Armor and no live card grants Armor, so WS19 changes semantics without changing the existing Runner balance baseline.

## Reopen rules

Do not tune the formula from hypothetical builds. Reopen the numeric Armor curve only when at least one real character/card intentionally grants Armor and deterministic + Production telemetry show that the survivability budget is too weak or too strong.
