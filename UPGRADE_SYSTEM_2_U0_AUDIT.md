# Wreckmarch — Upgrade System 2.0 / U0 Ownership Audit

> **Phase:** U0 — Audit and ownership  
> **Result:** Completed baseline audit. No gameplay behavior is intentionally changed by this document.  
> **Purpose:** Freeze a truthful map of current ownership before U1 refactoring so Wreckmarch does not continue as patch-on-patch architecture.

---

## 1. Executive finding

The current build is playable, but several core responsibilities are still layered chronologically.

The strongest canonical boundaries already present are:

- `src/characters/character-registry.js` — playable character registry.
- `src/characters/character-system.js` — character selection/defaults/production visual boundary.
- `src/characters/definitions/runner.js` — canonical Runner definition.
- `src/combat/weapon-system.js` — authoritative target acquisition and weapon firing runtime.
- `src/balance/run-balance.js` — canonical run/player balance constants and helper calculations.

The main Upgrade System 2.0 architecture debt is:

- base player/weapon values still originate in `src/game.js`;
- upgrades, upgrade levels, offer generation and direct stat mutation are centralized together in `src/phase-c-runtime.js`;
- later phase files override character/weapon pose and card presentation after earlier phases install their own versions;
- `index.html` depends on a long chronological import/install order to reach the final playable state.

**U1 must consolidate ownership. It must not add another late runtime layer.**

---

# 2. Current ownership map

## Character identity

### Canonical target owner

`src/characters/definitions/runner.js`

Current Runner baseline:

```text
id: runner
maxHp: 100
moveSpeed: 255
```

The definition also owns current combat profile, physics, render configuration, animations, locomotion tuning and weapon socket geometry.

### Selection/install boundary

`src/characters/character-system.js`

It currently:

- resolves a character through the registry;
- writes `scene.characterId` and `scene.characterDefinition`;
- applies max HP and movement speed defaults;
- installs production Runner animation definitions;
- applies Runner render texture/scale;
- updates locomotion visuals;
- resolves weapon socket/muzzle geometry.

### Legacy/bootstrap ownership still present

`src/game.js` still initializes:

```text
heroMaxHp = 100
heroHp = 100
heroSpeed = 255
hero sprite / bootstrap texture
```

This is currently required during boot, but it duplicates values that are now also defined by the canonical Runner definition.

**U1 direction:** character definition should become the source of character defaults. Bootstrap may use safe fallback values only where initialization ordering requires them.

---

## Character visuals / pose ownership

This is the highest-risk overlap because it matches the class of regression previously seen where the wrong character/art can win due to runtime ordering.

### Historical/runtime layers found

- `src/art-runtime.js`
- `src/phase-c3-runtime.js`
- `src/phase-c4-runtime.js`
- `src/phase-c5-runtime.js`
- `src/phase-d1-runtime.js`
- `src/characters/character-system.js`

Examples of overlapping behavior:

- Phase C3 installs `updateWeaponPose` and configures muzzle/fire feedback.
- Phase C4 replaces/calibrates weapon socket/pose behavior.
- Phase C5 directly changes hero textures by aim pose and installs another upgrade scene.
- Phase D1 finally installs `CharacterSystem`, production Runner visuals, another `updateWeaponPose`, weapon feedback and locomotion integration.

The current final state is protected partly because Phase D1 loads after C5.

**Risk:** changing script order or adding another late patch can resurrect an old visual implementation.

**U1/U7 direction:** final character identity/locomotion must remain owned by `CharacterSystem` + character definition. Old phase-specific visual ownership should be retired only after equivalent behavior is proven.

---

## Weapon runtime

### Canonical firing owner

`src/combat/weapon-system.js`

It currently owns:

- enemy target acquisition;
- aim rotation;
- auto-fire timing;
- multishot spread resolution;
- projectile spawning through ProjectileSystem;
- muzzle resolver hook;
- fire feedback hook;
- support-volley firing.

This is a good canonical boundary and should be extended, not replaced.

### Current weapon data/state

The active scene uses `scene.primaryWeapon` for values such as:

- damage;
- fireDelay;
- projectileSpeed;
- range;
- muzzleDistance.

Legacy mirror fields still exist in places, such as `scene.damage` / `scene.fireDelay`.

**U1 direction:** identify the canonical weapon definition/base values and resolved weapon stats, then reduce mirrored mutable fields where safe.

---

## Upgrade system

### Current owner

`src/phase-c-runtime.js`

It currently owns all of the following together:

- level / XP progression bootstrap;
- `scene.upgradeLevels`;
- upgrade level lookup/increment;
- upgrade definitions;
- availability rules;
- card weights;
- weighted offer generation;
- direct gameplay mutations;
- an upgrade-card UI implementation.

Current upgrade examples directly mutate scene/weapon state:

```text
Heavy Rivets -> primaryWeapon.damage *= 1.2
Overclock -> primaryWeapon.fireDelay *= .88, with minimum delay
Long Barrel -> projectileSpeed *= 1.18 and range *= 1.1
Twin Riveter -> scene.twinShots = 2
Fleet Feet -> recalculates scene.heroSpeed
Scrap Magnet -> scene.magnetRadius *= 1.25
Armor Plate -> scene.heroMaxHp += 15 and heals 15
```

### Upgrade presentation overlaps

Later files contain additional card scene/presentation implementations:

- `src/phase-c3-runtime.js` — `UpgradeSceneV3`
- `src/phase-c5-runtime.js` — `UpgradeSceneV4`
- `src/phase-d1-runtime.js` — latest rarity/premium card presentation layer

**U2/U5 direction:** gameplay upgrade data/offer logic must move to a canonical `src/upgrades/` layer. Presentation must consume upgrade data and resolved stats rather than own gameplay behavior.

---

## Run/player balance

### Canonical balance owner

`src/balance/run-balance.js`

Confirmed baseline:

```text
baseMoveSpeed: 255
fleetFeetPercent: 0.03
fleetFeetMaxLevel: 3
moveSpeedHardCap: 280
```

It also contains run/wave/balance configuration and helper calculations.

### Runtime state owner

The active Phaser scene currently holds many mutable run values directly, including:

```text
heroHp
heroMaxHp
heroSpeed
upgradeLevels
primaryWeapon
fireDelay
twinShots
magnetRadius
level
scrapXp
```

This is not automatically wrong for a Phaser scene, but there is not yet one explicit resolved-stat boundary.

**U1 direction:** introduce a deterministic resolution path while allowing scene fields to remain compatibility outputs during migration.

---

# 3. Patch / chronological ownership findings

`index.html` currently builds the final game by sequentially installing many runtime layers, including:

```text
game.js
runtime bridge
enemy foundation
phase-e0 terrain
art-runtime
phase-b
phase-b1 polish
phase-c
phase-c1
phase-c2
phase-c3
phase-c3-frame-fix
phase-c4
phase-c5
phase-d1
phase-e1
enemy visual installs
companion-runtime-v3
final-polish-runtime
```

This confirms the repository has historical patch-layer debt.

### Important rule for Upgrade System 2.0

We will **not** attempt a dangerous repository-wide cleanup all at once.

For every responsibility touched by U1–U7:

1. establish canonical owner;
2. redirect callers;
3. verify parity/tests;
4. remove old duplicate ownership;
5. only then remove obsolete patch code/imports.

This keeps the playable build stable while shrinking patch dependence incrementally.

---

# 4. High-risk overlaps to protect

## A. Character identity / art

Risk: a late phase calls `setTexture`, `setScale`, or installs its own pose updater after CharacterSystem.

Protection required:

- `characterId === 'runner'` resolves Runner definition;
- final production locomotion uses Runner animation keys from Runner definition;
- weapon socket comes from CharacterSystem/definition;
- adding a second character later must not mutate Runner constants/assets.

## B. Weapon values

Risk: upgrade modifies `primaryWeapon.fireDelay` while another system reads a mirrored `scene.fireDelay` value.

Protection required:

- define canonical base weapon value;
- define effective/resolved value;
- compatibility mirror, if temporarily required, is written from the canonical result only.

## C. Upgrade application

Risk: direct mutation makes recalculation/load/reset difficult and can apply effects twice.

Protection required:

- one upgrade level owner;
- deterministic modifiers;
- one application path;
- mechanical effects explicitly registered.

## D. Card UI

Risk: multiple UpgradeScene versions can make a visual patch silently own selection behavior.

Protection required:

- offer generation and applying choice must live outside presentation scene;
- one final card presentation owner after U5 migration.

---

# 5. U0 baseline invariants

The new U0 regression baseline freezes these facts before refactor:

1. Runner id remains `runner`.
2. Runner base max HP remains `100`.
3. Runner base move speed remains `255`.
4. Run balance base speed remains `255` and hard cap remains `280`.
5. WeaponSystem remains the authoritative target/fire owner.
6. Existing Upgrade System remains in Phase C until U2 migration and includes Heavy Rivets/Twin Riveter/etc.
7. CharacterSystem is the final production Runner boundary in Phase D1.
8. Character integration continues to use CharacterSystem weapon socket/muzzle geometry.

Test file:

`tests/unit/upgrade-system-u0-baseline.test.ts`

These are migration guards, not a claim that the current architecture is the final desired architecture.

---

# 6. U1 migration constraints

U1 must follow these constraints:

- No `phase-u1-runtime.js` patch.
- No `upgrade-system-v2-runtime.js` late override.
- Extend canonical character/weapon modules or create focused canonical stat modules.
- Preserve `Runner = 100 HP / 255 speed` until intentional balance work.
- Preserve current auto-fire behavior.
- Preserve current three approved run frames and final Runner identity.
- Do not touch Robot Dog/companion gameplay in U1.
- Do not remove old Phase C upgrades until U2 registry migration verifies parity.
- Keep compatibility bridges explicit and temporary.

---

# 7. U0 conclusion

U0 confirms the roadmap is compatible with the current game.

The next implementation task is **U1 — Character + weapon + stat architecture**, beginning with a safe extension of the Runner character contract and explicit Character/Weapon/Run stat ownership.

No broad cleanup should happen before those canonical replacement paths exist.
