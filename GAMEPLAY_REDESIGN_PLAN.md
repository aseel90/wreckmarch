# WRECKMARCH — Core Gameplay Redesign Plan

**Status:** Approved design direction, ready for implementation  
**Decision date:** 2026-08-24  
**Primary target:** Mobile portrait, Western audience, short 8–12 minute runs

## 1. New Core Identity

WRECKMARCH remains a **Survivor Roguelite + Build/Evolution game**, but the player is now the center of combat.

The run starts with **the hero alone**. The moving Fortress is no longer mandatory at spawn and is no longer an objective that can be destroyed. Instead, it becomes a powerful optional companion that can appear as a random upgrade choice during the run.

Core fantasy:

> **Fight as the Scrap Runner, collect scrap, choose a build, and optionally summon and evolve a giant moving war rig beside you.**

This removes the frustrating escort feeling and preserves the strongest visual hook: a small support rig can eventually become a ridiculous rolling fortress.

---

## 2. Core Run Loop

```text
Move + dodge
↓
Hero auto-attacks enemies
↓
Enemies drop Scrap
↓
Collect Scrap to fill the top XP/Scrap bar
↓
Level Up
↓
Pause briefly and show 3 random upgrade cards
↓
Choose 1 card
↓
Build hero / utility / Fortress / synergy path
↓
Fight denser hordes, elites, events and bosses
↓
Finish or die
```

The player must always feel responsible for survival. There is only one fail state during normal combat: **the hero reaches 0 HP**.

---

## 3. Hero Rules

### Hero is the primary combat unit

- Hero starts every run alone.
- Hero has the only normal HP pool.
- Enemies primarily target the hero.
- Hero auto-attacks the nearest valid enemy.
- Player controls movement and dodging with one thumb.
- Hero weapons and abilities should be the main source of damage early in a run.

### Hero health presentation

Remove the large Fortress HP bar from the top UI.

Use a compact HP bar **directly above the hero**:

- Tracks hero position.
- Only becomes visually prominent when damaged or not full.
- Damage number can briefly appear on hit.
- Short hit flash + knockback / micro-stagger.
- Short invulnerability window after a hit to prevent instant multi-hit death.

Recommended initial values:

- Hero HP: `100`
- Hit invulnerability: `350–500 ms`
- Damage feedback: red flash + small screen shake + floating damage value

---

## 4. Scrap / Level System

Scrap now functions as the **in-run XP resource**.

### Top HUD

The top of the screen should contain:

- Current Level
- Scrap/XP progress bar
- Run timer
- Optional kill count / wave indicator later

Example:

```text
LV. 4       ███████████░░░░       01:42
```

### Scrap behavior

- Enemies drop Scrap pickups.
- Pickups have a readable glow and attraction radius.
- Collection fills the top bar.
- When the bar reaches 100%, level up triggers.
- Overflow Scrap should carry into the next level when practical.
- Required Scrap increases gradually per level.

Initial progression target:

```text
Level 1 → 12 Scrap
Level 2 → 16
Level 3 → 21
Level 4 → 27
Level 5 → 34
```

Exact tuning will be tested on mobile.

---

## 5. Upgrade Card System

On level-up:

1. Gameplay pauses.
2. Background dims slightly.
3. Three upgrade cards appear.
4. Player chooses exactly one.
5. Choice applies immediately.
6. Gameplay resumes quickly.

Target selection time should be short. Cards must be understandable in a glance.

### Card anatomy

Each card should have:

- Large icon / visual
- Upgrade name
- One short description
- Rarity color / badge when needed
- Level/evolution indicator if already owned

Do not overload cards with stats.

---

## 6. Upgrade Families

### A. HERO

Direct player weapons and combat behavior.

Examples:

- Scrap Blaster
- Shotgun Burst
- Ricochet Bolts
- Chain Lightning
- Burning Wrench
- Orbiting Blades
- Piercing Slugs

Hero upgrades should change gameplay, not only increase percentages.

### B. FORTRESS

Fortress cards are locked until the player acquires the summon card.

First unlock card:

**CALL THE RIG**  
Summons the Level 1 Fortress companion.

Once summoned, Fortress upgrades enter the random pool:

- Twin Cannon
- Tesla Coil
- Rocket Rack
- Flamethrower
- Drone Bay
- Magnet Module
- Support Beacon
- Armor/visual chassis upgrades

### C. UTILITY

Movement, survival, collection and quality-of-life build choices.

Examples:

- Movement Speed
- Pickup Magnet
- Dodge / dash enhancement
- Max HP
- Healing on elite kill
- Cooldown reduction
- Luck / rarity weighting

Utility upgrades should be useful but should not dominate every build.

### D. SYNERGY / EVOLUTION

Special cards that only enter the pool after prerequisites are met.

Examples:

- Fire weapon + Oil module → **INFERNO RIG**
- Tesla + Wet/Water effect → **ELECTRIC STORM**
- Drone + Rockets → **MISSILE SWARM**
- Freeze + Saw → **FROZEN SHREDDER**

These should be visually dramatic and rare enough to feel discovered.

---

## 7. Weighted Random Upgrade Logic

The card system must feel random but not unfair.

### Rules

- Always offer 3 distinct valid cards.
- Do not offer maxed upgrades.
- Fortress upgrades cannot appear before `CALL THE RIG` is owned.
- Synergies cannot appear before prerequisites are met.
- If the player has too few offensive options, slightly increase Hero weapon weight.
- If a player commits to a build family, increase related upgrade weight modestly without guaranteeing it.
- Avoid three weak stat-only choices at once.

### Later controls

Add later, not in the first implementation:

- `Reroll ×1`
- `Skip`
- Permanent unlocks that alter pool contents

---

## 8. Fortress Companion Redesign

### Important rule

**The Fortress does not have HP and cannot be killed by enemies.**

It is a combat companion, not an escort objective.

### Behavior

- Hidden at the start of each run.
- Appears only if the player chooses `CALL THE RIG`.
- Enters with a strong arrival animation/effect.
- Follows the hero at a short comfortable distance.
- Uses catch-up acceleration if it falls too far behind.
- Enemies do not target it as a normal damage objective.
- Fortress weapons auto-target enemies independently or assist hero targeting.

### Visual progression

The Fortress must transform physically as upgrades are chosen:

```text
No Rig
↓
Level 1 small scrap vehicle
↓
Extra turret / module
↓
Expanded chassis
↓
Heavy rolling war machine
↓
Late-run absurd moving fortress
```

This visible growth remains one of the main marketing hooks.

---

## 9. Large World / Camera Redesign

The current single-screen rounded arena must be removed.

### First implementation target

Use a world substantially larger than the viewport, approximately:

- `2200 × 2200` minimum initial test area

The exact size may change after performance testing.

### Camera

- Smooth camera follow on hero.
- Small look-ahead in movement direction.
- Hero does not need to stay exactly at screen center.
- Keep useful space visible in front of movement direction.

### No visible arena border

- Remove the rounded rectangle playfield border.
- Environment should extend beyond the camera.
- Player should not feel trapped in a corridor.

### Enemy spawning

- Spawn enemies outside the current camera viewport.
- Use a safe spawn ring around the visible screen.
- Avoid obvious pop-in directly beside the hero.

### Environment

World 1 / Wasteland should include non-obstructive dressing:

- Wrecked cars
- Scrap piles
- Barrels
- Broken signs
- Tire stacks
- Industrial debris
- Cracked road / sand patches
- Power poles / ruined structures at safe positions

Later, selected environmental elements can become gameplay objects such as explosive barrels or oil pools.

### Future scalable world

After the fixed large-world version is stable, move toward chunk-based or recycled world sections so the run can feel much larger without heavy memory cost.

---

## 10. Enemy Targeting and Combat

### Initial enemy rule

- Standard enemies target the hero.
- Enemies should not stop to attack the Fortress.
- Melee contact damages hero.
- Ranged enemies attack hero with telegraphed projectiles.

### Enemy family after core redesign

1. **Scrap Rat** — fast basic melee enemy
2. **Scrap Brute** — slower, heavy attack, strong telegraph
3. **Scrap Shooter** — ranged pressure
4. **Scrap Exploder** — rush / danger zone / explosion
5. Elite variants later

Do not add all enemy types before the new core loop is proven.

---

## 11. UI Redesign

### Top HUD

Keep it clean and gameplay-first.

Recommended structure:

```text
LV. 3     [ SCRAP / XP BAR ]     01:24
```

Optional later row:

```text
KILLS 148        WAVE / THREAT 2
```

### Remove

- Fortress HP bar
- Permanent fortress health text
- UI that implies the rig is an escort objective

### Hero HP

- Floating above hero
- Compact and readable
- Damage feedback local to hero

### Upgrade screen

- 3 vertical/mobile-friendly cards
- Fast tap targets
- Big icons
- Minimal text
- Pause combat while choosing

---

## 12. First 60-Second Target Experience

### 0–10 sec

- Hero alone.
- Immediate movement and auto-fire.
- First Rats enter from outside screen.
- Scrap begins dropping.

### 10–25 sec

- First level-up.
- 3 card choices.
- Player visibly changes weapon or behavior.

### 25–45 sec

- Enemy density increases.
- Second/third level-up.
- Player begins forming a build.

### 45–60 sec

- `CALL THE RIG` may appear depending on random weighting.
- If chosen, Fortress makes a dramatic entrance and begins assisting.

Important: the Fortress should feel like a reward/discovery, not something the player is forced to protect.

---

## 13. Technical Architecture Plan

### Systems to separate

Refactor toward distinct modules/classes as the prototype grows:

- `PlayerSystem`
- `EnemySystem`
- `CombatSystem`
- `PickupSystem`
- `LevelSystem`
- `UpgradePool`
- `UpgradeCardUI`
- `FortressCompanion`
- `WorldSystem`
- `CameraSystem`
- `HUD`

The current prototype may remain partially monolithic during the first refactor, but new functionality should not make `game.js` increasingly unmaintainable.

### Data-driven upgrade definitions

Prefer upgrade definitions in data objects rather than hardcoded UI logic.

Example concept:

```js
{
  id: 'call_the_rig',
  family: 'fortress',
  rarity: 'rare',
  prerequisites: [],
  maxLevel: 1,
  weight: 0.55,
  title: 'CALL THE RIG',
  description: 'Summon a mobile war rig that fights beside you.'
}
```

This allows weighting, unlock rules, synergies and future localization.

---

## 14. Implementation Roadmap

### PHASE A — Core Ownership Shift

- [ ] Hero is primary damage source.
- [ ] Remove Fortress from run start.
- [ ] Remove Fortress HP/damage/fail state.
- [ ] Enemies target hero only.
- [ ] Hero HP bar above player.
- [ ] Hero damage feedback and invulnerability window.

**Acceptance:** Player can run alone and survive/fight without any rig present.

### PHASE B — Scrap Level Bar + Cards

- [ ] Top Scrap/XP bar.
- [ ] Level progression.
- [ ] 3-card pause screen.
- [ ] Weighted random pool.
- [ ] Hero upgrade family.
- [ ] Utility upgrade family.

**Acceptance:** A 60-second run produces several meaningful build choices.

### PHASE C — Large World

- [ ] Expand world beyond viewport.
- [ ] Smooth camera follow.
- [ ] Remove visible rounded arena border.
- [ ] Spawn enemies outside camera.
- [ ] Expand wasteland dressing.
- [ ] World coordinate-safe pickups/projectiles/enemies.

**Acceptance:** Player can move freely for an extended period without feeling trapped on one screen.

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
- [ ] First Evolutions.
- [ ] Card rarity/weight tuning.

### PHASE F — Enemy Variety

- [ ] Brute.
- [ ] Shooter.
- [ ] Exploder.
- [ ] Elite variants.
- [ ] Telegraph polish.

### PHASE G — First Real Run

- [ ] 8–10 minute pacing.
- [ ] Mini boss.
- [ ] Boss.
- [ ] Threat curve.
- [ ] Audio polish.
- [ ] Haptics.
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

The next implementation should execute **PHASE A + the foundation of PHASE B/C** in this order:

1. Remove Fortress at spawn and all Fortress HP logic.
2. Give hero a reliable starting auto-attack.
3. Make enemies target hero.
4. Move hero HP bar above hero.
5. Convert Scrap into the top level progress bar.
6. Build the first 3-card upgrade selector.
7. Expand world and add camera follow.
8. Add `CALL THE RIG` only after the base loop feels good.

Do not add new enemy families before steps 1–7 are playable and tested on mobile.
