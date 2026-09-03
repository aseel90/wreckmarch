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

Examples:

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

### PHASE C — Scrap Level Bar + Cards

- [ ] Top Scrap/XP bar.
- [ ] Level progression and increasing requirements.
- [ ] Overflow Scrap handling.
- [ ] 3-card pause screen.
- [ ] Weighted random pool.
- [ ] Hero upgrade family.
- [ ] Utility upgrade family.

**Acceptance:** A 60-second run produces several meaningful build choices.

### PHASE D — Fortress as Optional Companion

- [ ] Add `CALL THE RIG` card.
- [ ] Summon entrance sequence.
- [ ] Invulnerable/non-targetable companion logic.
- [ ] Follow + catch-up movement.
- [ ] Fortress attack logic.
- [ ] Fortress upgrade cards unlock only after summon.
- [ ] Visual chassis growth.

**Acceptance:** A run works both with and without the Fortress.

### PHASE E — Build Depth

- [ ] More Hero weapons.
- [ ] More Fortress modules.
- [ ] Utility choices.
- [ ] Synergy prerequisites.
- [ ] First evolution combinations.

### PHASE F — Enemy Variety

- [ ] Scrap Brute.
- [ ] Scrap Shooter.
- [ ] Scrap Exploder.
- [ ] Elite variants.
- [ ] Mini boss.

### PHASE G — First Real Run

- [ ] 8–12 minute pacing.
- [ ] First boss.
- [ ] End/run result screen.
- [ ] First permanent unlock loop.
- [ ] Audio pass.
- [ ] Performance pass.

---

## 15. Non-Negotiable Design Rules

1. The hero is the thing the player protects.
2. The Fortress must never recreate an annoying escort mission.
3. Major upgrades should be visible or behavior-changing.
4. Random choices should create variety without frequently creating dead runs.
5. World movement must feel open, not confined to a phone-shaped arena.
6. First-minute gameplay must already be marketable in a short vertical video.
7. Mobile performance and readable silhouettes take priority over unnecessary visual complexity.
8. No forced ads, no energy gate, no required paid backend for the core game.

---

## 16. Immediate Next Build

PHASE A is complete. The immediate implementation order is now intentionally **world-first** after mobile review showed the single-screen arena is too restrictive:

1. ✅ Remove Fortress at spawn and all Fortress HP logic.
2. ✅ Give hero a reliable starting auto-attack.
3. ✅ Make enemies target hero.
4. ✅ Move hero HP bar above hero.
5. **PHASE B:** Expand world, remove the arena border, add smooth camera follow/look-ahead, and spawn enemies outside the viewport.
6. **PHASE C:** Convert Scrap into the top level progress bar and build the first 3-card upgrade selector.
7. Add `CALL THE RIG` only after the open-world movement + level-up loop both feel good.

Do not add new enemy families before Phase B and Phase C are playable and tested on mobile.

---

## 17. Canonical Frontend / Screen Ownership Roadmap

This is the approved architecture for all current and future non-gameplay screens. It is a structural contract, not a visual redesign request.

### Single owner

- [ ] Introduce one canonical `GameShell` (or equivalently named single frontend-flow owner) for navigation and lifecycle of screens outside active gameplay.
- [ ] `GameShell` is the only owner allowed to decide which frontend screen is active and how transitions enter/leave gameplay.
- [ ] Do not add parallel menu routers, per-screen navigation state, temporary scene-switch hacks, or duplicated ownership.
- [ ] Keep `GameScene` focused on gameplay. It must not accumulate main-menu, character-select, settings, shop, leaderboard, or other frontend navigation logic.

### Canonical supporting owners

- [ ] `ScreenRegistry`: one source of truth for available frontend screens/routes and their identity.
- [ ] `CharacterRegistry`: one source of truth for character identity and availability/selectability. Character presentation/runtime data must not be copied into menu code.
- [ ] `SettingsStore`: one source of truth for persistent settings such as audio, controls, accessibility/display options when introduced.
- [ ] Pause UI must ultimately use the same screen/shell ownership model rather than becoming a second unrelated UI architecture; gameplay pause state itself remains owned by the appropriate gameplay/runtime boundary.

### Screen rollout

1. [ ] Establish the canonical shell/navigation boundary with tests before migrating screens.
2. [ ] Add **Character Select** as the first screen through that boundary.
   - Runner is the only selectable/launchable character initially.
   - Shotgun Character may be shown for development/preview only while explicitly locked/non-playable.
   - No `if shotgun` special-case navigation or copied Runner configuration is permitted.
3. [ ] Route the main/start screen through the same owner without changing approved gameplay behavior.
4. [ ] Migrate/add Settings through the same owner and canonical `SettingsStore`.
5. [ ] Route future Shop, Leaderboard, progression/unlock, results and other out-of-run pages through the same shell/registry instead of creating independent navigation systems.
6. [ ] Bring Pause presentation under the shared screen architecture only when this can be done without changing gameplay pause semantics.

### Shotgun Character activation gate

- [ ] The Character Select screen does **not** authorize Shotgun gameplay by itself.
- [ ] Shotgun remains non-selectable on `main` until its production art, separate weapon ownership, runtime animation/aim integration, CI, E2E and Live validation are all complete.
- [ ] Only after those gates pass may `CharacterRegistry` change Shotgun from locked/non-playable to selectable.

### Architecture acceptance gates

- [ ] Exactly one canonical owner controls frontend screen navigation.
- [ ] Screen definitions are not duplicated across menu/gameplay files.
- [ ] Character availability is read from the canonical character owner, not inferred by UI code.
- [ ] Settings have one persistent owner when introduced.
- [ ] Starting a Runner run preserves current approved gameplay, balance, RNG, rarity and upgrade behavior.
- [ ] Shotgun cannot accidentally start a run while its activation gate is incomplete.
- [ ] Unit/E2E coverage protects navigation ownership, Runner launch, locked Shotgun behavior and mobile screen flow.
- [ ] Full Quality, Smoke, all E2E shards and aggregate E2E are required before each migration step merges.

**Implementation rule:** migrate incrementally. Do not rewrite all existing UI at once. Each screen moves only when its current ownership is understood and the new canonical owner can replace it cleanly without patch-on-patch compatibility layers.
