# WRECKMARCH

> **Build. Roll. Survive.**

Wreckmarch is a mobile-first **Survivor Roguelite + optional Moving Fortress Builder** designed for a Western audience. Each run starts with the Scrap Runner alone. The player fights hordes, collects Scrap, chooses randomized build cards, and may discover **CALL THE RIG**, which summons a mobile Fortress companion that can then evolve into a huge rolling war machine.

The core goal is simple:

**A player should understand the hook from a 3–5 second gameplay clip.**

---

## Current Approved Core Design (2026-08-24)

The original prototype proved movement, combat, Scrap collection, the Scrap Runner, Scrap Rat, and moving Fortress visuals. After mobile testing, the core design was updated to remove the escort-style weakness.

**Approved rules now:**

- Every run starts with **the Hero alone**.
- The **Hero is the primary combat unit and the only normal HP objective**.
- Enemies target the Hero, not the Fortress.
- Scrap fills a **top XP/Level bar**.
- Filling the bar pauses combat and shows **3 weighted random upgrade cards**.
- The Fortress is hidden at the start and can appear as the optional **CALL THE RIG** upgrade.
- Once summoned, the Fortress is an **invulnerable/non-targetable companion**, not an escort objective.
- Fortress upgrades only enter the card pool after it has been summoned.
- The single-screen rounded arena will be replaced by a **large scrolling world with smooth camera follow**.
- Hero HP will be displayed above the Hero instead of using a Fortress HP bar at the top.

Full implementation plan: [`GAMEPLAY_REDESIGN_PLAN.md`](GAMEPLAY_REDESIGN_PLAN.md)  
Persistent development log: [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md)

---

## 1. Project Vision

Wreckmarch should **not** be a generic Vampire Survivors / Survivor.io clone with a different skin.

The differentiator is:

> **A survivor roguelite where you build the hero first, then may summon and evolve a gigantic moving fortress during the run.**

The game should feel immediately satisfying, visually readable, highly replayable, and easy to market organically through short gameplay clips.

### Primary goals

- Mobile-first experience.
- Portrait orientation as the primary layout.
- One-thumb-friendly controls.
- 8–12 minute standard runs.
- Strong visual power growth during every run.
- High build diversity and meaningful choices.
- Distinct characters that change the way the game is played.
- No forced energy system.
- No forced advertisements.
- Offline-first wherever possible.
- No required paid backend or multiplayer infrastructure.
- Built with a zero-extra-budget philosophy beyond existing AI subscriptions, GitHub, and app-store developer fees.

---

## 2. Target Audience

Primary market:

- United States
- United Kingdom
- Canada
- Australia
- Western Europe

Target players:

- Fans of Survivor-like / Bullet Heaven games.
- Players who enjoy roguelites, build experimentation, progression, secrets, and large hordes.
- Mobile players who want short sessions but meaningful long-term progression.
- Players who enjoy discovering overpowered combinations and sharing them online.

---

## 3. Core Gameplay Fantasy

The player begins a run with:

- One hero.
- One weak starting weapon.
- **No Fortress at spawn.**

Enemies attack the Hero continuously and drop **Scrap**. Scrap fills the in-run XP/Level bar. When the bar fills, combat pauses briefly and the player chooses one of three weighted random upgrade cards.

One possible card is **CALL THE RIG**, which summons the Level 1 Fortress companion. Only after that choice do Fortress-specific upgrades enter the random pool.

Example transformation:

```text
START
Hero alone

EARLY LEVEL-UP
Hero weapon / utility choices

OPTIONAL DISCOVERY
CALL THE RIG → small scrap vehicle

MID RUN
Rig + turret + armor

5 MINUTES
Multiple weapons + crew + modules

10 MINUTES
Massive moving fortress + evolved weapons + screen-filling destruction
```

The vehicle must visually change as the build develops. Power growth should be obvious without reading stat numbers.

---

## 4. Core Gameplay Loop

```text
Move
↓
Fight hordes
↓
Collect Scrap / XP
↓
Fill the level bar
↓
Choose 1 of 3 meaningful upgrade cards
↓
Build Hero / Utility / optional Fortress paths
↓
Discover weapon/module synergies
↓
Choose routes and events
↓
Fight elites and bosses
↓
Finish or die
↓
Unlock meaningful permanent content
↓
Start a different build
```

---

## 5. Run Structure

Target standard run length: **about 10 minutes**.

Possible pacing:

| Time | Event |
|---|---|
| 1:00 | Mini Horde |
| 2:00 | Upgrade / Build opportunity |
| 3:00 | Elite enemy |
| 4:00 | Route choice |
| 5:00 | Mini Boss |
| 6:00 | Rescue / special event |
| 7:00 | Massive Horde |
| 8:00 | Evolution / major synergy opportunity |
| 9:00 | Final swarm |
| 10:00 | Boss |

There should be very little dead time.

An Endless Mode can be added later for players who want longer sessions.

---

## 6. Moving Fortress System

The moving Fortress remains one of Wreckmarch's strongest visual identities, but it is now an **optional companion build path**, not an escort objective. It is hidden at run start, has no normal HP/fail state, and becomes available through the `CALL THE RIG` upgrade card.

Possible modules:

- Cannons
- Machine guns
- Flamethrowers
- Tesla coils
- Rocket launchers
- Drones
- Saw blades
- Spikes
- Shield generators
- Armor plates
- Support modules
- Utility modules

The fortress should not simply gain hidden stats. New modules should **appear physically on the vehicle**.

### Design rule

Every major upgrade should answer at least one of these:

- Does the player see it?
- Does the player hear it?
- Does it change how the build behaves?
- Does it create a new strategic decision?

If the answer to all four is no, the upgrade is probably too weak or too boring.

---

## 7. Build Diversity

Avoid a single dominant meta build.

Upgrades should change behavior rather than only numbers.

Bad example:

```text
Damage +5%
Damage +8%
Damage +10%
```

Better progression:

```text
Single projectile
→ Triple projectile
→ Piercing projectile
→ Ricochet projectile
→ Storm of projectiles
```

A successful run should create a story the player can describe:

- "I made a lightning fortress."
- "I built around drones."
- "I made a fire-and-oil build."
- "I survived using freeze and saw blades."

---

## 8. Synergy / Evolution System

Combining modules can create evolved weapons.

Examples:

### Tesla Coil + Water Cannon
**Electric Storm**

Wet enemies chain electricity to nearby enemies.

### Flamethrower + Oil Launcher
**Inferno**

Oil pools ignite and create persistent burning zones.

### Drone + Rocket Launcher
**Missile Drone**

Drones begin launching homing rockets.

### Ice Cannon + Saw Blade
**Frozen Shredder**

Frozen enemies take extreme damage from spinning blades.

Synergies should encourage experimentation and create shareable "I discovered this" moments.

---

## 9. Heroes

Characters should not be simple stat skins.

Each hero should change the gameplay style.

Concept examples:

### Engineer
Builds and improves turrets more efficiently.

### Beastmaster
Uses combat companions / creatures.

### Storm Witch
Specializes in chaining electricity and storm effects.

### Berserker
Becomes more dangerous at low health.

### Scrap King
Converts enemy remains into unusual fortress upgrades.

A hero should ideally create new build possibilities rather than merely providing `+10% Damage`.

---

## 10. Crew Rescue System

During runs, players may encounter survivors or specialists trapped in dangerous areas.

Rescuing them can add temporary or permanent benefits.

Examples:

### Crazy Engineer
Improves turrets and unlocks experimental modules.

### Medic
Repairs the fortress or improves healing.

### Pyromaniac
Changes selected weapons into fire-based variants.

### Mechanic
Improves armor and repair efficiency.

The crew system creates collection, personality, and progression without relying on gacha.

---

## 11. Route Choices

The run should move through a world rather than remain in one static arena forever.

Example route decision:

```text
LEFT: Military Base
More weapons / ammo / armor

RIGHT: Abandoned Laboratory
Mutations / experimental upgrades
```

Possible environments:

- Wasteland
- Desert
- Ruined industrial zones
- Frozen wastes
- Mutated forests
- Abandoned laboratories
- Broken highways

Route decisions should make runs feel different even before random upgrades are considered.

---

## 12. Enemy Direction

Avoid generic zombies as the entire identity of the game.

Possible factions:

- Mutant rats
- Scrap bots
- Giant insects
- Wasteland creatures
- Mechanical scavengers
- Experimental lab monsters
- Elite war machines

Enemy silhouettes should be readable instantly on a phone screen.

---

## 13. Boss Philosophy

Bosses must not simply be large enemies with huge HP bars.

Each boss should introduce:

- Recognizable attack patterns.
- Movement or arena pressure.
- Telegraphs the player can learn.
- Moments where the fortress build matters.
- A strong death / reward sequence.

Boss fights should become memorable moments that can also be used in trailers and short-form videos.

---

## 14. Art Direction

Preferred direction:

**Stylized Western Cartoon + Dieselpunk / Scrap-Punk**

Desired qualities:

- Bold silhouettes.
- Strong readable shapes.
- Colorful but rugged.
- Chunky machines.
- Expressive characters.
- Exaggerated weapons.
- Strong visual identity.
- Consistent asset style.

Avoid:

- Generic anime look.
- Generic medieval fantasy look.
- Asset-pack appearance.
- Overly realistic graphics that increase production cost without improving gameplay.

The game should be attractive in screenshots at small mobile-store sizes.

---

## 15. Animation & Game Feel

High-quality 2D game feel is a priority.

Important techniques:

- Character idle animation.
- Movement animation.
- Weapon recoil.
- Directional aiming.
- Hit flash.
- Knockback.
- Impact particles.
- Muzzle flashes.
- Explosions.
- Damage numbers when useful.
- Enemy death animations.
- Boss-specific animations.
- Controlled screen shake.
- Haptic feedback on mobile.
- Strong sound effects.
- Squash and stretch where appropriate.

The target is not AAA 3D graphics. The target is a **polished commercial 2D mobile game with excellent responsiveness and feedback**.

---

## 16. Secrets & Discovery

Do not explain every system immediately.

Possible secrets:

- Hidden heroes.
- Secret evolutions.
- Hidden bosses.
- Cursed weapons.
- Strange module combinations.
- Secret map areas.
- Rare crew members.

The goal is to create community discussion and discovery.

---

## 17. Permanent Progression

Avoid endless meaningless stat inflation.

Prefer unlocking:

- New heroes.
- New weapons.
- New modules.
- New maps.
- New crew.
- Challenge modes.
- Mutations.
- Secrets.
- New build archetypes.

Permanent progression should increase **possibilities**, not merely numbers.

---

## 18. Monetization Philosophy

Initial priority: make the game genuinely fun before monetization complexity.

Rules:

- No forced ads.
- No energy system preventing play.
- No pay-to-win design.
- No artificial grind walls designed only to sell skips.

Possible optional monetization later:

- Optional rewarded revive.
- Optional upgrade reroll.
- Optional bonus chest.
- Cosmetic content.
- Remove Ads purchase if advertisements are introduced.

The product should remain enjoyable without spending money.

---

## 19. Organic Marketing Strategy

Because the project is intended to avoid paid user-acquisition costs initially, gameplay itself must produce marketable moments.

Every major feature should be evaluated with this question:

> Can someone watch this for 3 seconds and want to know what game it is?

High-value visual hooks:

- Tiny vehicle → giant fortress transformation.
- Hundreds of enemies on screen.
- Weapon evolution during combat.
- Crazy synergy discoveries.
- Boss encounters.
- Crew rescues.
- Route decisions.
- Before / after build comparison.

Primary organic content targets:

- TikTok
- YouTube Shorts
- Instagram Reels
- Reddit / gaming communities

Portrait-first gameplay helps reuse real gameplay footage directly as vertical short-form content.

---

## 20. Technology Direction

Planned stack:

- **Phaser.js** for the 2D game layer.
- JavaScript / TypeScript as appropriate.
- HTML5 / WebGL.
- GitHub for version control and collaboration.
- GitHub Pages or equivalent for instant browser test builds.
- Capacitor or another lightweight wrapper for Android packaging later.
- Offline/local save first.

No heavy engine is required for the current plan.

### Performance priorities

The game must be designed from day one for mobile performance:

- Object pooling.
- Efficient enemy update loops.
- Controlled particle counts.
- Texture atlases where appropriate.
- Avoid unnecessary DOM work during gameplay.
- Scalable effects quality.
- Responsive UI for different phone sizes.

---

## 21. Repository / Development Strategy

Recommended workflow:

- `main` = stable tested version.
- `develop` = active development.
- Feature branches when changes are risky or large.
- Tags / releases at important milestones.
- Never destroy the last known-good playable build while experimenting.

The browser build should always be easy to test from a phone.

---

## 22. Current Core Implementation Priority

The Hero-owned combat redesign, large-world baseline, Combat & Build Balance WS1–WS23, responsive frontend remediation, and Upgrade System 2.0 are now closed production baselines. The Shotgun WS14-C **art foundation is also complete**: dedicated 2-idle/3-run body art, separate Shotgun weapon art, runtime composition/presentation and locked Character Select preview already exist.

**Current next major production track: finish the Shotgun production gate — canonical character gameplay definition, then full activation validation.**

Required order:

1. Approve the Shotgun **character gameplay definition** (HP, movement speed, passive and any differing physics/locomotion values). Do not copy Runner values as a shortcut and do not hide weapon power inside character stats.
2. Register that definition through the canonical CharacterRegistry/CharacterSystem path while keeping Shotgun production-locked until every activation requirement is ready; no ad-hoc `if shotgunCharacter` runtime branches.
3. Complete deterministic Runner-vs-Shotgun regression, mobile browser/Live checks and the required real Production/D1 full-run evidence.
4. Only after `shotgun-production-gate.js` has no blockers may availability change from locked preview to selectable.
5. Run WS15-B short-range enemy matchup review after activation.
6. Only then may `FUTURE_RUN_WORLD_ENCOUNTER_ROADMAP.md` pass its R0 Character Production gate and become the next large expansion roadmap.

Do **not** reopen Upgrade System 2.0, Combat & Build Balance scalar tuning, or responsive remediation without a new reproducible regression or explicitly approved scope change.

For documentation authority and current-vs-historical classification, use [`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md).

---

## 23. Development Tracking

All future development batches must update [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md). Use [`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md) to distinguish active contracts from closed historical roadmaps. `IMPLEMENTATION_STATUS.md` is the source of truth for:

- What is actually implemented.
- What is prototype-quality.
- What has been superseded.
- What the next priority is.

This prevents future developers or AI agents from accidentally rebuilding old discarded systems.
