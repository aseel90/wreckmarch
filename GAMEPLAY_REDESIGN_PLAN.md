# WRECKMARCH — Gameplay Redesign Plan

## 1. Core Direction

WRECKMARCH is a mobile-first landscape survival shooter focused on:

- fast movement,
- readable auto-fire combat,
- large scrolling survival space,
- Scrap-based leveling,
- three-card upgrade choices,
- strong build variety,
- one optional companion path through `CALL THE RIG`,
- clean visual readability on small mobile screens.

The approved current direction is **world first, then cards**. New enemy families remain lower priority until the movement/world loop and upgrade loop are stable and tested.

---

## 2. Current Gameplay Foundation

The current gameplay foundation includes:

- one playable Runner character,
- directional movement,
- auto-fire,
- Rivet Gun projectile combat,
- enemies spawning around the player,
- Scrap drops and collection,
- level progression,
- three-card upgrade selection,
- rarity tiers,
- multiple Hero and Utility upgrade paths,
- elite reward crate behavior,
- optional Rig companion path,
- large scrolling world/camera,
- mobile landscape HUD,
- persistent production art and terrain systems.

The existing run remains the baseline that future additions must not silently invalidate.

---

## 3. Mobile-First Requirements

The primary supported play mode is landscape mobile.

Requirements:

- Full-bleed viewport.
- No accidental page scrolling during gameplay.
- Joystick remains reachable and predictable.
- HUD remains compact.
- Cards remain readable without overlapping.
- Important combat elements remain distinguishable at small scale.
- Character, weapon, projectiles, enemies and Scrap remain visually distinct.
- Menus and non-gameplay screens use touch-friendly targets and respect landscape safe areas.

---

## 4. Player Core

### Runner

The current Runner remains the only playable production character until future character activation gates are explicitly completed.

Runner responsibilities:

- movement,
- canonical character stats,
- character-specific presentation,
- weapon ownership through the canonical weapon system,
- runtime damage/invulnerability behavior through canonical combat systems.

Do not hardcode future character assumptions into unrelated systems.

---

## 5. Weapons

### Rivet Gun

The Rivet Gun remains the Runner’s canonical weapon.

Core weapon behavior:

- automatic target acquisition,
- automatic projectile fire,
- canonical damage/fire-rate/projectile-speed stats,
- support for piercing, ricochet, explosive and crit upgrade mechanics,
- directional presentation through weapon sockets.

The weapon should not be copied into future characters as configuration duplication. Future characters must own their own canonical weapon definitions.

---

## 6. Enemy Foundation

Enemy behavior is routed through the canonical enemy foundation.

Existing production families include the approved current set such as:

- Scrap Rat,
- Rust Hound,
- Sawbug,
- existing elite/boss milestone behavior where currently active.

Do not add more enemy families until the large-world and upgrade loops are stable on mobile.

---

## 7. Large World / Camera

The approved world direction is a larger scrolling survival space rather than a fixed arena.

Requirements:

- player movement in world coordinates,
- camera follows player cleanly,
- terrain remains persistent/readable,
- roads and environmental art remain coherent,
- enemies/projectiles/HUD use the correct coordinate spaces,
- no visual popping caused by presentation patches competing with world ownership.

---

## 8. Scrap / Leveling

Scrap is the in-run progression resource.

Current role:

- enemies drop Scrap,
- Scrap contributes to level progression,
- leveling pauses the action for card selection,
- Scrap is not automatically a permanent currency.

Important rule:

> **Lifetime Scrap may be recorded as a statistic, but Scrap itself must not silently become the Shop’s persistent currency.**

Any permanent economy must have its own explicit contract.

---

## 9. Upgrade System

The current upgrade system uses three-card choices and rarity treatment.

Approved principles:

- Build variety matters more than guaranteed optimization.
- Some offered cards may be weak or irrelevant to the current build.
- Do not always hand the player exactly what they need.
- Strong combinations should emerge through randomness and decisions.
- Rarity changes value/power where explicitly defined.
- Mechanical ownership stays in canonical upgrade/weapon/character systems.

Existing approved upgrade families include current implementations such as:

- Fleet Feet,
- Armor Plate,
- Scrap Magnet,
- Overclock,
- Heavy Rivets,
- Piercing Rivets,
- Twin Riveter,
- Long Barrel,
- Ricochet,
- Shrapnel Impact,
- Critical Rivet,
- Explosive Rivet,
- Call the Rig,
- and other currently committed canonical upgrades.

---

## 10. Companion / Rig Direction

`CALL THE RIG` remains an optional build direction rather than a guaranteed core mechanic in every run.

The current companion concept is a robotic dog-like support unit rather than the retired cart presentation.

Rules:

- companion ownership stays canonical,
- no duplicated support-fire paths,
- companion upgrades should not crowd out Hero build identity,
- the companion may be absent from many runs,
- future companion expansion should remain compatible with the card system.

---

## 11. Upgrade Card Presentation

Upgrade cards should feel like WRECKMARCH objects, not generic app cards.

Visual direction:

- dark metal,
- worn industrial framing,
- cyan mechanical highlights,
- rust/sand accent tones,
- clear rarity treatment,
- readable icon-first hierarchy,
- compact landscape layout.

Avoid unnecessary arrows, generic RPG decoration, or unrelated visual language.

---

## 12. Results / Telemetry

Run-end telemetry is a development/analysis system and must not become the player-facing scoring owner by accident.

Rules:

- Results reads one canonical frozen run result.
- Telemetry may contain deeper analytical values such as kills/DPS.
- Analytics-only fields do not automatically become score, currency or permanent rewards.
- `SEND REPORT` remains a development transport action, visually secondary to player navigation.

---

## 13. Production Safety Rules

Do not solve problems by stacking patches on top of conflicting owners.

Required principles:

- one canonical owner per domain,
- remove/replace stale ownership instead of masking it,
- no duplicated character definitions,
- no duplicated weapon definitions,
- no independent frontend routers,
- no per-character UI hacks,
- no hidden automatic telemetry activation,
- no fake Shop/Leaderboard functionality,
- preserve current approved gameplay behavior unless a roadmap item explicitly changes it.

---

## 14. Testing / Validation Strategy

The project uses automated validation as a required development gate.

Current layers include:

- TypeScript checks,
- unit tests,
- static build,
- Playwright E2E,
- mobile-landscape E2E,
- smoke tests,
- production/live telemetry smoke where explicitly enabled,
- automated `ci-failure` issue tracking.

Important workflow behavior:

- CI uses `cancel-in-progress`, so repeated pushes can cancel earlier runs.
- Do not diagnose a cancelled run as a gameplay failure without reading the final current-HEAD result.
- A migration is not considered verified merely because source files look correct.

---

## 15. Balance Principles

- Survival pressure should increase over time.
- Standing still should not be the dominant safe strategy.
- Ranged threats should encourage movement.
- Upgrade randomness should preserve imperfect choices.
- Powerful mechanics need bounded frequency/chance/scaling.
- Companion/support systems should not replace the Hero’s importance.
- Future characters should create different play styles without invalidating the shared systems.
- Strong combinations should feel discovered rather than guaranteed.

---

## 16. Immediate Development Order

PHASE A is complete. The immediate implementation order is now intentionally **world first, then cards**:

1. Finish and test Phase B large-world movement/camera.
2. Verify hero HP, auto-fire and enemy targeting remain stable in world coordinates.
3. Add Scrap drops and the top XP/level bar.
4. Add the level-up pause + 3-card UI.
5. Build a very small Hero/Utility upgrade pool.
6. Test the first 60–90 seconds repeatedly on mobile.
7. Add `CALL THE RIG` only after the open-world movement + level-up loop both feel good.

Do not add new enemy families before Phase B and Phase C are playable and tested on mobile.

---

## 17. Canonical Frontend / Screen Ownership Roadmap

This is the approved architecture for all current and future frontend screens around the run. It is a structural contract first and a visual-design roadmap second. The goal is to avoid independent menus, duplicated navigation state, copied character data, and patch-on-patch UI ownership as Wreckmarch grows.

### 17.1 Single canonical owner

- [x] Introduce one canonical `GameShell` as the frontend-flow owner.
- [x] Introduce one canonical `ScreenRegistry` for registered screen identities.
- [x] `GameShell` is the canonical owner deciding which full frontend screen is active and how the application enters/leaves gameplay.
- [x] No parallel frontend router or duplicated full-screen navigation owner is used by the migrated core flow.
- [x] Migrated Main, Character Select, Settings, Pause presentation and Results navigation remain outside `GameScene`.
- [ ] Migrate incrementally. Existing gameplay must keep working while each screen is brought under the canonical owner.

Current foundation note (updated 2026-09-03): `GameShell` and `ScreenRegistry` own the migrated core frontend flow. `BOOT` and `MAIN` are registered, normal launch is `BOOT → MAIN → CHARACTER SELECT → GAMEPLAY`, and post-run navigation returns through canonical boot intents rather than bypassing the shell.

### 17.2 Canonical supporting owners

- [x] `CharacterRegistry` exists as the canonical character-definition owner for the currently playable Runner.
- [x] `CharacterRegistry` owns canonical `selectable` / `locked` / `hidden` availability state.
- [x] Shotgun exists as its own locked canonical preview entry with no copied Runner playable definition.
- [x] `SettingsStore` is the single persistent settings owner; current implemented settings are Audio and Screen Shake.
- [x] Results consumes one frozen canonical run-result snapshot and does not recompute gameplay outcome/reward state.
- [x] Pause presentation uses the shared shell while Phaser/runtime remains the paused/unpaused state owner.

### 17.3 Final canonical full-screen map

The following are the approved full-screen destinations that belong to the application/frontend flow:

| Screen | Registry ID target | Phase | Purpose | Priority |
| --- | --- | --- | --- | --- |
| Boot / Loading | `boot` | boot | Initialize required assets/state, restore persistent state, and hand off to Main | Core |
| Main / Start | `main` | shell | Primary home screen and entry point to Play, Settings, Shop/Progression and Leaderboard | Core |
| Character Select | `character-select` | pre-run | Choose a canonical selectable character before a run | Core |
| Gameplay | `gameplay` | run | Active Phaser gameplay | Existing |
| Pause | `pause` | run-overlay | Resume, Settings access, Restart/Exit actions without creating a second UI architecture | Core |
| Settings | `settings` | shell | Audio, controls and future display/accessibility settings | Core |
| Results / Run End | `results` | post-run | Run outcome, statistics, rewards and next action | Core |
| Shop / Progression | `shop` | shell | Permanent progression/unlocks and future economy surfaces | Phase 2 |
| Leaderboard | `leaderboard` | shell | Ranking/result comparison when backend/product rules are ready | Phase 2 |
| Help / How to Play | `help` | shell | Controls and concise core-system explanation when needed | Later |
| Credits / About | `credits` | shell | Version, credits and required product/legal information | Later |

Rules:

- [x] `BOOT` and `MAIN` are registered in `ScreenRegistry` and precede Character Select in the player-facing flow.
- [ ] `HELP` and `CREDITS` are approved future routes but should not block the core flow.
- [x] Do not add a new full-screen route merely because a temporary overlay or dialog is needed; the migrated core flow keeps temporary dialogs/overlays outside `ScreenRegistry`.
- [x] Full-screen identities are declared once in `ScreenRegistry` and referenced by ID by the migrated frontend flow.

### 17.4 Gameplay overlays are not independent frontend screens

The following remain gameplay-owned overlays/states and must **not** become independent frontend navigation routes just to simplify implementation:

- Level-up / 3-card upgrade selector.
- In-run transient notifications.
- Damage/death feedback before Results owns the post-run flow.
- Tooltips and contextual help.
- Confirmation dialogs such as Restart Run / Exit Run / Reset Settings.
- Temporary locked-character explanation/preview dialog when it does not require a full page.

Overlay rules:

- [x] Level-up cards pause/resume through the gameplay/runtime system and do not navigate away from `GAMEPLAY`.
- [x] Restart Run / Exit to Main use one shared confirmation modal/overlay pattern instead of separate ad-hoc DOM implementations.
- [x] Visual coverage does not promote gameplay overlays or confirmations into `ScreenRegistry` routes.
- [x] Pause is the one intentional run-overlay registered with the shell because it owns navigation choices outside the immediate combat loop; pause semantics themselves remain runtime-owned.

### 17.5 Approved player flow

Normal launch/run loop:

```text
BOOT / LOADING
      ↓
MAIN
      ↓
CHARACTER SELECT
      ↓
GAMEPLAY
      ↓
RESULTS
   ↙      ↘
MAIN   PLAY AGAIN
          ↓
   CHARACTER SELECT
```

Main shell branches:

```text
MAIN
 ├── PLAY → CHARACTER SELECT
 ├── SETTINGS
 ├── SHOP / PROGRESSION
 ├── LEADERBOARD
 ├── HELP          (later)
 └── CREDITS       (later)
```

In-run flow:

```text
GAMEPLAY
 ├── LEVEL-UP CARDS → GAMEPLAY
 └── PAUSE
      ├── RESUME → GAMEPLAY
      ├── SETTINGS → return to PAUSE/GAMEPLAY context
      ├── RESTART RUN → confirmation → GAMEPLAY
      └── EXIT RUN → confirmation → MAIN
```

Post-run rules:

- [x] Hero death/run completion creates one canonical frozen run result.
- [x] Results presents the already-produced canonical result without a second score/reward calculation.
- [x] `PLAY AGAIN` returns through Character Select using the canonical boot-intent flow.
- [x] `MAIN MENU` returns to `MAIN` through the canonical shell/boot-intent flow.

### 17.6 Character Select contract

Character Select is the first screen to be implemented visually through the canonical shell after the screen map foundation is corrected.

Initial behavior:

- [x] Runner appears as `selectable` and is the only character that may launch gameplay initially.
- [x] Shotgun Character appears as `locked` / development preview.
- [x] Locked Shotgun is blocked by canonical selectability/runtime-definition gates and cannot launch through the migrated frontend flow.
- [x] Character Select reads identity, preview metadata and availability from `CharacterRegistry`.
- [x] Character Select does not copy Runner runtime/settings data.
- [x] No `if shotgun` menu/navigation branch is used.
- [x] Character Select renders registry entries generically for future characters.

Recommended canonical availability vocabulary:

- `selectable` — visible and may start a run.
- `locked` — visible/previewable but cannot start a run.
- `hidden` — not shown to the normal player flow yet.

The exact field names may differ during implementation, but one canonical owner must determine the state.

### 17.7 Shotgun Character activation gate

The Character Select screen does **not** authorize Shotgun gameplay by itself.

- [ ] Shotgun remains non-selectable on the `main` branch until its production art gate is complete.
- [ ] Separate Shotgun weapon ownership/configuration must be complete; no Runner weapon/config copy.
- [ ] Runtime animation, movement, aim/weapon alignment and combat integration must be complete.
- [x] CharacterRegistry integration is canonical and free of Shotgun-specific frontend navigation hacks.
- [x] Unit tests prove locked Shotgun cannot become a playable runtime definition.
- [x] E2E covers the locked Shotgun path and selectable-character launch flow.
- [ ] Full Quality, Smoke, all required E2E shards, aggregate E2E and Live validation must pass.
- [ ] Only after every activation gate passes may `CharacterRegistry` change Shotgun from `locked` to `selectable`.

### 17.8 Main / Start contract

Main is the final player-facing landing screen after Boot completes.

Core Main actions:

- [x] `PLAY` → Character Select.
- [x] `SETTINGS` → Settings through `GameShell`.
- [x] `PROGRESSION / WORKSHOP RECORD` → active canonical route backed by persistent run records; purchase economy remains disabled.
- [ ] `LEADERBOARD` → future canonical route when implemented.
- [x] Main has no direct gameplay launch that bypasses Character Select.

Main must not duplicate character selection, settings state, progression calculations, or gameplay initialization.

### 17.9 Pause contract

Pause is required for the core mobile game and must not be deferred behind Shop/Leaderboard.

- [x] Provide Resume.
- [x] Provide Settings access without losing the paused-run context.
- [x] Provide Restart Run behind shared confirmation and restart through a clean canonical boot intent.
- [x] Provide Exit to Main behind shared confirmation and return through the canonical Main boot target.
- [x] Gameplay simulation/input is paused through the Phaser/runtime pause boundary while Pause is active.
- [x] Pause uses `GameShell`; no separate pause router exists.

### 17.10 Settings contract

- [x] One canonical `SettingsStore` exists before Main/Pause settings share state.
- [x] Main Settings and Pause Settings use the same stored values and controls.
- [x] Initial settings are intentionally limited to Audio and Screen Shake, both with real runtime behavior.
- [x] No inert settings toggles are exposed.
- [x] Back navigation restores Main or paused-run caller context correctly.

### 17.11 Results / Run End contract

Results is part of the **core run loop**, not a low-priority extra screen.

- [x] Results is implemented before Shop/Leaderboard.
- [x] Results shows the approved run outcome and essential statistics only after gameplay ends.
- [x] Results does not invent permanent rewards/unlocks; any future display must come from canonical reward/result data.
- [x] `PLAY AGAIN` and `MAIN MENU` are canonical shell/boot-intent actions.
- [x] The temporary `SEND REPORT` development control is visually separated from the primary player Results actions.

### 17.12 Shop / Progression and Leaderboard contract

These are Phase 2 shell screens and must not block completion of the core launch/run/result loop.

- [x] Record-only Progression/Workshop uses one canonical persistent progression owner; the UI derives Workshop rank/milestones from that state and does not duplicate it.
- [ ] Shop purchasing/unlocks remain disabled until `WORKSHOP_PROGRESSION_CONTRACT.md` prerequisites are approved; any future character unlock must compose with the production availability gate used by Character Select.
- [ ] Leaderboard consumes one approved score/result definition rather than inventing a separate scoring formula.
- [ ] Backend/network failure must not prevent the player from reaching Main, Character Select, Gameplay or local Results.

### 17.13 Implementation order

Execute in this order unless a later documented dependency requires a change:

1. [x] Create the `GameShell` / `ScreenRegistry` ownership foundation with unit coverage.
2. [x] Correct the canonical registry map: add `BOOT` and `MAIN`, preserve existing screen IDs, and test the final ownership model without visual redesign.
3. [x] Extend `CharacterRegistry` with canonical availability/selectability state and add the locked Shotgun definition/preview boundary without enabling Shotgun gameplay.
4. [x] Build **Character Select** through `GameShell`.
5. [x] Build/route **Main / Start** through the same shell and make Boot → Main the final launch flow.
6. [x] Bring **Pause** presentation under the shared architecture without changing runtime pause semantics.
7. [x] Add **Settings** with one canonical `SettingsStore`, supporting Main and Pause caller contexts.
8. [x] Add **Results / Run End** and connect the complete Main → Select → Run → Results → Main/Replay loop.
9. [x] Add record-only **Progression / Workshop** backed by canonical persistent run data, with derived rank/milestones and no purchase economy.
10. [ ] Activate **Shop purchasing** only after `WORKSHOP_PROGRESSION_CONTRACT.md` currency, earning, catalog, idempotency and unlock-ownership gates are approved.
11. [ ] Add **Leaderboard** only after `LEADERBOARD_SCORE_CONTRACT.md` score, eligibility, identity and backend contracts are approved.
12. [ ] Add **Help / Credits** only when they are needed for release/polish.

### 17.14 Architecture acceptance gates

- [x] Exactly one canonical owner controls the migrated full frontend screen navigation.
- [x] `BOOT`, `MAIN`, `CHARACTER_SELECT`, `GAMEPLAY`, `PAUSE`, `SETTINGS`, `RESULTS`, `SHOP` and `LEADERBOARD` are represented by one canonical registry model.
- [x] Migrated screen identities are not duplicated across menu/gameplay files.
- [x] Character availability is read from `CharacterRegistry`, not inferred by UI code.
- [x] Runner remains the only launchable character while Shotgun is locked.
- [x] Shotgun cannot start a run while its activation gate is incomplete.
- [x] Settings have one persistent owner.
- [x] Level-up cards remain gameplay overlays instead of parallel frontend routes.
- [ ] Starting a Runner run preserves current approved gameplay, balance, RNG, rarity and upgrade behavior.
- [x] Pause does not change combat semantics beyond the approved paused state.
- [x] Results consumes canonical run outcome data and does not calculate/award rewards a second time.
- [x] Main, Character Select, Pause, Settings, Results and Progression are covered by the canonical `844×390` mobile-landscape flow gate, including overflow/viewport checks and persistent navigation context.
- [x] Unit/E2E coverage protects navigation ownership, boot/main flow, Runner launch, locked Shotgun behavior, pause/settings context and canonical Results ownership; Live validation remains a separate gate below.
- [x] Current migrated frontend + locked Shotgun HEAD has passed Quality, Smoke and aggregate/sharded E2E together (`96ed1db`, CI recovery recorded 2026-09-03).
- [ ] Live validation is required before a newly migrated core screen is considered complete.

### 17.15 Canonical mobile frontend interaction gate

The supported frontend shell now has one explicit landscape interaction gate rather than relying on visual inspection alone.

- [x] Canonical frontend E2E viewport is `844×390`, matching the existing mobile landscape target used by Wreckmarch tests.
- [x] Main, Character Select, Settings, Pause and Results must fit the viewport without hidden horizontal overflow or clipped primary actions.
- [x] Progression/Workshop is the intentional long-form exception: it may scroll vertically, but its content is anchored from the top and the footer/roster must remain reachable.
- [x] Core touch controls use a centralized `frontend-interaction.css` contract with a minimum `44px` touch target instead of per-screen patches.
- [x] The mobile flow test covers Main → Settings → Progression → Character Select → Runner Gameplay → Pause → paused Settings → Results → Main → persisted Progression.
- [x] The same gate verifies Shotgun remains visibly locked and cannot become a gameplay launch path.
- [x] Canonical Results actions and the temporary `SEND REPORT` control remain reachable at the target viewport.
- [x] The Progression top-anchor regression discovered by this gate was fixed at the layout-owner level (`align-content:start`) rather than weakening the test.

**Implementation rule:** do not rewrite all existing UI at once. Each screen moves only when its current ownership is understood and the new canonical owner can replace it cleanly without compatibility patches layered on top of each other. The screen architecture must remain data-driven so adding future characters or frontend pages does not require character-specific or screen-specific hacks in unrelated systems.
