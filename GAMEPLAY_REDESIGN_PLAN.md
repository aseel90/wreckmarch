# Wreckmarch Gameplay Redesign Plan

## 1. Product Goal

Transform the current Wreckmarch prototype into a **mobile-first survivor roguelite** where the player directly controls a single hero, survives enemy waves, collects Scrap, levels up, and builds a different combat setup each run.

The Fortress/Rig is no longer the primary protected object. It becomes an **optional combat companion** that appears only if the player chooses the relevant upgrade during a run.

Primary target:

- Mobile browser first.
- Android APK later through the existing GitHub workflow.
- Landscape orientation.
- Short, readable sessions.
- Strong replayability through randomized build choices.
- No required backend or paid service for the core game.

---

## 2. Core Gameplay Loop

1. Start the run with only the hero.
2. Move freely around the battlefield.
3. Hero attacks automatically.
4. Enemies target the hero.
5. Killed enemies drop Scrap.
6. Scrap fills the level bar.
7. On level up, gameplay pauses.
8. Player chooses **1 of 3 random upgrade cards**.
9. The selected upgrade changes the current build.
10. Resume the run.
11. Survive escalating waves and elites.
12. Reach boss/end condition.
13. Receive permanent rewards/unlocks.
14. Start a new run with a potentially different build.

The important change is:

> The player is building a **run**, not following a fixed upgrade tree.

---

## 3. Player Character

### Role

The hero is the central combat unit and the main object the player must keep alive.

### Controls

- Left virtual joystick for movement.
- Auto-aim toward valid enemy targets.
- Auto-fire by default.
- No manual fire button in the base version.
- No second joystick unless later testing proves it is necessary.

### Starting State

The player starts with:

- One basic weapon.
- Base movement speed.
- Base HP.
- No Fortress.
- No active build upgrades.

### Death

The run ends when the hero reaches 0 HP.

There is no Fortress HP dependency in the core loop.

---

## 4. Scrap and Leveling

### Scrap

Scrap is the run XP resource.

Enemies drop Scrap on death.

### HUD

Use a top progress bar:

```text
SCRAP   Lv. 3
██████████████░░░░░░
68 / 100
```

### Level Formula

Initial suggested values:

```text
Level 1 → 30 Scrap
Level 2 → 50 Scrap
Level 3 → 75 Scrap
Level 4 → 105 Scrap
Level 5 → 140 Scrap
```

General formula candidate:

```text
requiredScrap = base + level * growth + level² * curve
```

Exact values should be tuned through playtesting.

### Overflow

If the player collects more Scrap than required:

```text
currentScrap -= requiredScrap
level += 1
```

Remaining Scrap carries into the next level.

---

## 5. Upgrade Card System

Every level up:

- Pause gameplay.
- Present 3 cards.
- Player chooses one.
- Apply upgrade.
- Resume gameplay.

### Card Structure

Each card contains:

- Icon.
- Upgrade name.
- Short effect description.
- Rarity color.
- Optional prerequisite indicator.

Example:

```text
┌────────────────────┐
│  HEAVY RIVETS      │
│                    │
│  +25% Damage       │
│  -10% Fire Rate    │
│                    │
│  [COMMON]          │
└────────────────────┘
```

### Rarity

Suggested initial rarity weights:

- Common: 60%
- Rare: 28%
- Epic: 10%
- Legendary: 2%

Rarity affects:

- Numeric strength.
- Visual presentation.
- Frequency.

Do not make higher rarity automatically correct in every situation. Build synergy matters more.

---

## 6. Upgrade Families

### A. Hero Weapon Upgrades

Examples:

**Heavy Rivets**

- +25% projectile damage.
- -10% fire rate.

**Twin Riveter**

- Fire 2 projectiles.
- Each projectile deals reduced base damage.

**Piercing Rivets**

- Projectiles pass through one additional enemy.

**Ricochet Plate**

- Projectile can bounce to another nearby target.

**Long Barrel**

- Increased projectile speed.
- Increased effective range.

**Overclock**

- Increased fire rate.
- Slightly reduced projectile damage.

---

### B. Hero Survival Upgrades

**Armor Plate**

- +Max HP.

**Emergency Weld**

- Heal a percentage of missing HP.

**Fleet Feet**

- +Movement speed.

**Reactive Plating**

- Temporary damage reduction after taking damage.

---

### C. Utility Upgrades

Examples:

**Scrap Magnet**

- Increased Scrap pickup radius.

**Lucky Find**

- Slight increase to higher-rarity card chance.

**Field Repairs**

- Small heal after elite kills.

---

## 7. Fortress / Rig Redesign

The Fortress is no longer present at the start of the run.

It becomes an optional build path.

### Unlock Card

Example:

```text
CALL THE RIG

Summon your mobile fortress.
It follows you and attacks nearby enemies.
```

### Summon Behavior

When selected:

1. Warning horn / visual signal.
2. Fortress enters from outside the screen.
3. Dust / debris effect.
4. Fortress joins the player.

### Fortress Rules

- No HP bar.
- Cannot die.
- Cannot block player movement.
- Cannot trap the player.
- Enemies do not target it.
- It follows the player.
- It provides offensive/support utility.

### Follow Logic

Desired behavior:

```text
if distance < 100:
    idle

if distance >= 100 and distance < 280:
    follow normally

if distance >= 280:
    use catch-up speed
```

The Fortress should feel like a companion, not an escort objective.

---

## 8. Fortress Upgrade Path

Fortress cards are locked until `CALL THE RIG` has been selected.

After summon, cards can include:

### Weapon Modules

**Side Turret**

- Adds an automatic turret.

**Rear Cannon**

- Adds slow high-damage shots.

**Tesla Coil**

- Chain lightning between enemies.

**Rocket Rack**

- Periodic area damage.

### Utility Modules

**Scrap Vacuum**

- Fortress attracts nearby Scrap.

**Repair Field**

- Periodically heals the hero slightly.

**Suppressive Fire**

- Enemies near Fortress move slower.

### Visual Growth

Upgrades must visibly modify the Fortress.

Example progression:

```text
Base Rig
   ↓
Side Turret
   ↓
Twin Turrets
   ↓
Armor Frame
   ↓
Tesla Coil
   ↓
Heavy War Rig
```

This visual evolution is important for player satisfaction and marketing screenshots/video.

---

## 9. Upgrade Prerequisites

Not every card should always be available.

Example:

```text
CALL THE RIG
      ↓
SIDE TURRET
      ↓
TWIN TURRET
      ↓
TESLA COIL
```

Other example:

```text
HEAVY RIVETS + PIERCING RIVETS
      ↓
ARMOR BREAKER
```

Prerequisites create build identity and reduce random noise.

---

## 10. Evolution System

Later phase only.

Certain upgrade combinations unlock evolved abilities.

Example:

```text
Twin Riveter
+
Piercing Rivets
+
Overclock

→ BULLET STORM
```

Another:

```text
Tesla Coil
+
Overcharge

→ THUNDER ENGINE
```

Evolution should not be implemented until the base card loop already feels good.

---

## 11. Enemy Design Direction

Enemies now target the hero.

### Basic Enemy Families

**Scrap Grunt**

- Basic melee chaser.

**Scrap Brute**

- Slow, high HP.

**Scrap Shooter**

- Keeps distance and fires projectiles.

**Scrap Exploder**

- Rushes hero and explodes.

**Scrap Rider**

- Fast movement and hit-and-run behavior.

### Elites

Elites can have modifiers:

- Armored.
- Fast.
- Explosive.
- Regenerating.
- Shielded.

### Bosses

Bosses should test builds, not just HP.

Examples:

- Large armored vehicle.
- Mobile artillery machine.
- Giant scrap construct.

---

## 12. Difficulty Scaling

Difficulty increases over time through:

- Spawn rate.
- Enemy HP.
- Enemy speed.
- Elite frequency.
- Enemy composition.

Avoid scaling only HP.

Suggested structure:

```text
0–2 min
Basic enemies

2–4 min
More enemies + first ranged units

4–6 min
Elites introduced

6–8 min
Dense mixed waves

8–10 min
Mini boss / major event
```

---

## 13. Monetization Direction

Core game should remain playable without paid backend infrastructure.

Possible future monetization:

### Cosmetic

- Character skins.
- Fortress skins.
- Projectile effects.
- Death effects.

### Rewarded Ads

Optional only:

- Revive once.
- Reroll upgrade cards.
- Double post-run reward.

Avoid:

- Forced ads during active combat.
- Energy systems.
- Hard pay-to-win upgrades.

---

## 14. Implementation Roadmap

### PHASE A — Core Conversion

- [x] Remove Fortress from run start.
- [x] Remove Fortress HP dependency.
- [x] Enemies target hero.
- [x] Hero gets reliable starting weapon.
- [x] Hero HP displayed above hero.
- [x] Run ends when hero dies.

**Acceptance:** Game is fully playable with hero only.

### PHASE B — Open Battlefield / World Expansion

- [ ] Expand the playable world so the hero can keep travelling beyond the initial viewport instead of being constrained to one screen.
- [ ] Remove the hard arena border/box from normal gameplay.
- [ ] Add a smooth camera that follows the hero while preserving a comfortable look-ahead zone.
- [ ] Spawn enemies outside the current viewport and let them enter the visible area naturally.
- [ ] Keep joystick and HUD screen-space locked while the world/camera moves independently.
- [ ] Rework ground/road decoration so movement across the larger world does not reveal empty or obviously repeated screen edges.
- [ ] Keep the first implementation lightweight enough for Safari iPhone and Chrome Android.

**Acceptance:** Player can move freely for an extended period without feeling trapped on one screen, and enemies enter naturally from outside the viewport.

### PHASE C — Scrap / Level-up Core Loop

- [ ] Add enemy Scrap drops and pickup collection.
- [ ] Add a top Scrap/XP progress bar and level indicator.
- [ ] Add level progression and overflow Scrap carryover.
- [ ] Pause gameplay on level up.
- [ ] Present exactly 3 random valid upgrade cards.
- [ ] Resume gameplay immediately after one card is selected.
- [ ] Start with a small Hero/Utility card pool only.

**Acceptance:** The player can run around a large world, kill enemies, collect Scrap, level up, choose one of three random upgrades and continue fighting.

### PHASE D — Upgrade Pool + Build Rules

- [ ] Move upgrade definitions to data-driven structures.
- [ ] Add rarity weighting.
- [ ] Add duplicate/max-level rules.
- [ ] Add prerequisite filtering.
- [ ] Add anti-frustration weighting without guaranteeing useful cards.
- [ ] Add build-family weighting only after baseline randomness feels good.

**Acceptance:** Different runs naturally produce different builds without frequent invalid or obviously useless selections.

### PHASE E — Optional Fortress Companion

- [ ] Add `CALL THE RIG` card to the random pool.
- [ ] Keep all other Fortress cards hidden until Rig is summoned.
- [ ] Add Fortress entry animation.
- [ ] Implement follow/catch-up behavior.
- [ ] Make Rig non-targetable / non-destructible.
- [ ] Add first visible Rig module upgrade.

**Acceptance:** Fortress feels like a powerful optional discovery, not an escort objective.

### PHASE F — Content / Polish

- [ ] Add more upgrade cards.
- [ ] Add first ranged enemy.
- [ ] Add first elite modifier.
- [ ] Improve impacts, VFX, sound and camera feedback.
- [ ] Mobile performance pass.
- [ ] Balance the first 8–10 minute run.

### PHASE G — Evolution + Long-Term Progression

- [ ] Add upgrade synergies/evolutions.
- [ ] Add permanent unlocks.
- [ ] Add multiple worlds / biome variation.
- [ ] Add monetization only after retention loop is fun.

---

## 15. Balance Philosophy

Use the following hierarchy when tuning:

1. Fun/readability.
2. Player agency.
3. Build diversity.
4. Difficulty pressure.
5. Long-term balance precision.

Avoid balancing by making every card equal in isolation.

The intended experience is:

- Some cards are situational.
- Some cards become strong only with a certain build.
- Some random offers will not perfectly help the current build.
- The player should still usually have at least one meaningful decision.
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
- [ ] Do not add a new full-screen route merely because a temporary overlay or dialog is needed.
- [ ] Full-screen identities must be declared once in `ScreenRegistry` and referenced by ID everywhere else.

### 17.4 Gameplay overlays are not independent frontend screens

The following remain gameplay-owned overlays/states and must **not** become independent frontend navigation routes just to simplify implementation:

- Level-up / 3-card upgrade selector.
- In-run transient notifications.
- Damage/death feedback before Results owns the post-run flow.
- Tooltips and contextual help.
- Confirmation dialogs such as Restart Run / Exit Run / Reset Settings.
- Temporary locked-character explanation/preview dialog when it does not require a full page.

Overlay rules:

- [ ] Level-up cards pause/resume through the gameplay/runtime system and do not navigate away from `GAMEPLAY`.
- [ ] Reusable confirmation dialogs should use one shared modal/overlay pattern instead of separate ad-hoc DOM implementations.
- [ ] An overlay may visually cover the screen, but that does not automatically make it a `ScreenRegistry` route.
- [ ] Pause is the one intentional run-overlay registered with the shell because it owns navigation choices outside the immediate combat loop; pause semantics themselves remain runtime-owned.

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
- [ ] `SHOP / PROGRESSION` → future canonical route when implemented.
- [ ] `LEADERBOARD` → future canonical route when implemented.
- [x] Main has no direct gameplay launch that bypasses Character Select.

Main must not duplicate character selection, settings state, progression calculations, or gameplay initialization.

### 17.9 Pause contract

Pause is required for the core mobile game and must not be deferred behind Shop/Leaderboard.

- [x] Provide Resume.
- [x] Provide Settings access without losing the paused-run context.
- [ ] Provide Restart Run behind confirmation.
- [ ] Provide Exit to Main behind confirmation.
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

- [ ] Shop/Progression uses canonical persistent progression data; no duplicated unlock state in the UI.
- [ ] Character unlocks, if later sold/earned here, update the canonical availability owner used by Character Select.
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
9. [ ] Add **Shop / Progression** when its persistent data contract is ready.
10. [ ] Add **Leaderboard** when score/backend contracts are ready.
11. [ ] Add **Help / Credits** only when they are needed for release/polish.

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
- [ ] Main/Settings/Results/Character Select are usable on the supported mobile landscape viewport.
- [x] Unit/E2E coverage protects navigation ownership, boot/main flow, Runner launch, locked Shotgun behavior, pause/settings context and canonical Results ownership; Live validation remains a separate gate below.
- [ ] Full Quality, Smoke, all required E2E shards and aggregate E2E are required before each migration step merges.
- [ ] Live validation is required before a newly migrated core screen is considered complete.

**Implementation rule:** do not rewrite all existing UI at once. Each screen moves only when its current ownership is understood and the new canonical owner can replace it cleanly without compatibility patches layered on top of each other. The screen architecture must remain data-driven so adding future characters or frontend pages does not require character-specific or screen-specific hacks in unrelated systems.
