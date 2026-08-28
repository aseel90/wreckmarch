# WRECKMARCH — Balance & Run Director Spec

Status: **Accepted foundation / implementation in progress**

This document is the source of truth for the first 10-minute Wreckmarch vertical slice. Values are tuning targets, not permanent promises; changes should be deliberate and recorded here.

## 1. Run structure

- Target run length: **10:00** before the first major boss.
- A main **Wave lasts 60 seconds**.
- Every Wave has four **15-second pressure steps**. Pressure steps adjust spawn cadence and threat budget, but do not change the Wave number.
- **Kills never advance the Wave.** Kills clear active threat, creating breathing room and rewarding damage-focused builds without allowing players to stall progression.
- Wave progression is time-driven so every build faces the same macro pacing.

### First vertical-slice timeline

| Wave | Time | New roster pressure |
|---|---:|---|
| 1 | 0:00–0:59 | Scrap Rat baseline |
| 2 | 1:00–1:59 | + Rust Hound |
| 3 | 2:00–2:59 | + Sawbug |
| 4 | 3:00–3:59 | + Wreckling |
| 5 | 4:00–4:59 | + Fuse Tick |
| 6 | 5:00–5:59 | + Scrap Drone / first Elite milestone region |
| 7 | 6:00–6:59 | + Pipe Crawler |
| 8 | 7:00–7:59 | + Hook Raider / second Elite milestone region |
| 9 | 8:00–8:59 | + Rivet Brute / Elite pressure |
| 10 | 9:00–9:59 | Full weighted pool |
| Boss | 10:00 | The Scrap Marshal |

Enemy unlocks above are the intended final roster. Until an archetype is implemented, the Run Director must keep working with the available pool rather than inventing substitutes.

## 2. Threat Budget instead of raw spawn count

Each enemy has a threat cost. The director limits **active threat** and also maintains a hard active-enemy cap for performance/readability.

Initial threat references:

- Scrap Rat: 1
- Rust Hound / Sawbug: 2
- Wreckling: 3
- Fuse Tick / Scrap Drone / Pipe Crawler: 4
- Hook Raider: 5
- Rivet Brute: 6
- Elite: base threat + Elite modifier; never treated as a free extra enemy
- Boss: outside normal threat spawning

Threat budget rises mainly by Wave and slightly inside each 15-second pressure step. It is preferred over continuously increasing movement speed.

## 3. Player movement rules

Current Runner base movement speed is **255** and remains the tuning baseline.

- Base speed: 255
- `FLEET FEET`: **+6%** per level
- Maximum `FLEET FEET` levels: **3**
- Hard movement-speed cap: **310**
- Movement speed does **not** rise automatically with time/Wave.
- Character run-animation timing must track actual movement speed to avoid sliding.

Approximate Fleet Feet path: 255 → 270 → 287 → 304.

## 4. Enemy movement and attack-read rules

Enemy difficulty should come from different movement/attack tools, not from making every enemy permanently faster than the player.

- Global enemy speed scaling from Wave 1 to Wave 10 is capped around **+9%**.
- Normal pursuit enemies should generally stay below the Runner's base speed.
- Faster-than-player movement is allowed only as readable, short actions such as pounce, charge or ambush.
- Telegraph dangerous movement or attacks before they become unavoidable.
- Rust Hound attack read: first pounce is armed within ~0.22–0.36s; at 100–280px it crouches for ~0.28s with a red ground warning, then pounces and recovers for ~0.32s.
- **Sawbug has no dash attack.** Its accepted role is mobile ranged acid pressure: it repositions on its legs, telegraphs a spit, fires a separate acid projectile, then recovers before the next shot.
- Sawbug projectile speed, damage, cooldown and splash lifetime remain explicit tuning values to lock during E03 implementation; do not infer them from the old dash prototype.

Target examples:

| Enemy/action | Target speed |
|---|---:|
| Scrap Rat | 105–125 |
| Rust Hound pursuit | 200–216 |
| Rust Hound pounce | 348 burst |
| Sawbug movement | 165–190 |
| Wreckling | 120–145 |
| Hook Raider charge | 330–370 burst |
| Rivet Brute | 85–105 |

## 5. HP and damage scaling

Do not use unlimited per-second HP inflation for production balance.

Target Wave multipliers:

- HP: Wave 1 = 1.00x → Wave 10 = 1.90x
- Contact/attack damage: Wave 1 = 1.00x → Wave 10 ≈ 1.36x
- Speed: Wave 1 = 1.00x → Wave 10 ≈ 1.09x

Enemy archetypes own their base stats; the Run Director supplies the global Wave multiplier.

## 6. Elite rules and reward crates

Elites are meaningful encounters, not only high-HP recolors.

- First guaranteed Elite reward target: approximately **4:30**.
- Second guaranteed Elite reward target: approximately **7:30**.
- Around **9:00**, a bonus Elite may appear depending on final tuning.
- Elite spawn timing remains time/director controlled; kills do not advance the schedule.
- Elite visuals must be immediately readable: size/outline/effect plus an archetype-specific modifier.

### WRECK CRATE

Killing an Elite drops a **WRECK CRATE** at its death position.

Opening the crate:

1. Pauses combat like a normal level-up choice.
2. Offers **3 upgrades**; the player chooses one.
3. Grants a **bonus upgrade** independent from XP level-up progression.
4. Guarantees at least **Rare or better** when the pool supports it.
5. Respects `maxLevel`, prerequisites, unique/one-time rules and exclusions.
6. Companion upgrades are eligible only after the companion is owned.
7. The player's upgrades and companion upgrades remain mechanically isolated unless a card explicitly says it affects both.

Boss rewards will use a separate `BOSS CACHE` path later rather than reusing the normal Elite crate.

## 7. Upgrade repetition rules

Upgrades need metadata rather than ad-hoc availability checks.

- Mechanical/transformative upgrades (example: `TWIN RIVETER`) are normally **unique** or one-time.
- A stronger mechanic should be a named follow-up card (example: future `TRIPLE RIVETER`) instead of repeating the same unique card.
- Numeric upgrades may have multiple levels with an explicit `maxLevel`.
- Invalid/maxed upgrades must not enter either XP choices or crate choices.
- Companion upgrades use a separate pool and prerequisites.

## 8. Progression target

For the first 10-minute slice, tune toward roughly **10–14 total upgrade choices obtained**, including approximately two bonus Elite-crate upgrades. Exact XP curve is a later balance pass after the first multi-enemy roster is playable.

## 9. Roster implementation order

1. Scrap Rat (implemented baseline)
2. Rust Hound
3. Sawbug
4. Wreckling
5. Fuse Tick
6. Scrap Drone
7. Pipe Crawler
8. Hook Raider
9. Rivet Brute
10. Magnet Warden
11. Ash Stalker
12. The Scrap Marshal boss

The first validation milestone is a 3–4 minute run with **Scrap Rat + Rust Hound + Sawbug + Wreckling** and visibly different combat decisions.

Enemy art/animation production for this roster follows **[WRECKMARCH_ENEMY_PRODUCTION_GUIDE.md](./WRECKMARCH_ENEMY_PRODUCTION_GUIDE.md)**.

## 10. Engineering rules

- Balance numbers live in a dedicated balance module, not scattered across visuals.
- Enemy definitions remain data-driven.
- Run Director owns Wave number, 15-second pressure step, active threat and spawn pacing.
- Enemy behavior owns movement/attacks; Run Director must not micromanage archetype AI.
- Reward logic owns Elite crate eligibility separately from XP progression.
- Mobile performance cap is a first-class balance rule.
- Every new balance system requires a deterministic unit test before expanding the roster.
