# WRECKMARCH — Future Run, World & Encounter Roadmap

Status: **APPROVED FOR LATER IMPLEMENTATION — DO NOT START BEFORE CURRENT REPAIR / CHARACTER / UPGRADE GATES ARE CLOSED**

This document is the future source of truth for expanding WRECKMARCH from the current ~10-wave production/balance baseline into a longer, structured survivor run with a larger world, diverse enemy roles, Elites, Mini Bosses, locked Boss Arenas, major Bosses and a real standard-run ending.

It records the design decisions approved in discussion so later implementation happens in dependency order instead of adding enemies/bosses randomly.

Related canonical documents:

- `WRECKMARCH_ENEMY_ROSTER.md` — accepted enemy identities and silhouettes.
- `WRECKMARCH_ENEMY_PRODUCTION_GUIDE.md` — production rules for enemy art/animation integration.
- `WS16_WAVE_DIFFICULTY_BASELINE.md` — current validated 10-wave pressure/performance baseline.
- `PHASE_B_ARCHITECTURE.md` — current world/camera architecture and future world-size target.
- `UPGRADE_SYSTEM_2_ROADMAP.md` — current upgrade-system work that remains ahead of this future expansion.

---

## 1. Non-negotiable run contract

- Standard WRECKMARCH is **not** intended to end at 10 minutes / Wave 10.
- The current 10-wave curve remains a **validated development, balance and character-production baseline** while the larger run is not implemented.
- Future standard-run target: **Final Boss begins at approximately 25:00**.
- The timer reaching 25:00 does **not** automatically win the run. The Final Boss must be defeated.
- Final Boss death = **RUN COMPLETE / WIN / Results**.
- A later Endless mode may become available **after a standard win**; Endless must never replace the clear standard ending.
- The exact standard duration is a tuning target, not a sacred constant. The production build must validate whether ~23, ~25 or ~27 minutes produces the best pacing before final lock.

### Pacing rule

The player should rarely experience a long stretch where nothing meaningfully changes.

- Roughly every **60–90 seconds**: a noticeable change in enemy composition, event, threat role or reward pressure.
- Roughly every **3–5 minutes**: a meaningful milestone such as Champion, Elite, Mini Boss or Boss.
- Difficulty must grow primarily through **role interaction, cadence, positioning pressure, encounter rules and controlled density**, not by turning every enemy into an HP sponge.

### Timeline / clock policy

The times in this roadmap are **earliest encounter-progression targets**, not permission to overlap milestones blindly.

- Upgrade-card pause time does not advance encounter progression.
- A new milestone cannot begin while another locked/special milestone is unresolved.
- Major/Final Boss Arena fights suspend future Director milestones until the Boss is resolved and the recovery window ends.
- Mini Boss/Elite milestones may delay later entries if their encounter is still active; the scheduler resumes in order instead of dumping overdue encounters at once.
- Therefore `~25:00` means the Final Boss target on the encounter-progression timeline; real wall-clock play may be somewhat longer because upgrade choices, Boss intros/fights and recovery windows add time.

This prevents cases such as E08 or a random Event spawning inside the Roadbreaker arena merely because the wall clock crossed another timestamp.

---

## 2. Future world-size contract

### Current state

The current Phase B world is approximately:

`2200 × 2200 world units`

That remains the current production baseline, but it is **not the intended final world size** for a 25-minute run.

With the Runner baseline near `285 world units/s`, the current world can feel like a small arena rather than a wasteland journey.

### Future target

Provisional target:

`~9600 × 9600 world units`

Before final lock, test these candidates on real mobile hardware:

- `7200 × 7200`
- `9600 × 9600` — current preferred target
- `12000 × 12000`

Choose the smallest size that still creates a convincing journey and location memory without excessive empty travel or mobile cost.

### World implementation rule

Do **not** create one giant always-active map full of objects.

Use world sectors/chunks and activate only nearby gameplay/environment work.

If `9600 × 9600` wins the test, a useful first partition is a nominal `3 × 3` district grid of about `3200 × 3200` each. This is an architectural guide, not a requirement that every district be square or visually isolated.

### Proposed districts / location identity

The world should remain open enough for survivor movement, but have memorable regions and landmarks:

1. **Central Wreckroads** — starting region / broken road junctions.
2. **Scrap Fields** — wreck piles, stripped vehicles, open sight lines.
3. **Collapsed Highway** — split asphalt, ramps, concrete wreckage.
4. **Rust Depot** — industrial storage / loading yard shapes.
5. **Chemical Yard** — pipes, tanks, acid-contaminated visual language.
6. **Burned Convoy Zone** — destroyed trucks, barricades, long road lanes.
7. **Marshal Territory** — late-run controlled wasteland / final-boss identity.

Do not turn these into a maze. Roads, clearings and traversable open ground remain dominant.

### Landmarks

Each district needs large readable landmarks so the player can remember location without a minimap being mandatory:

- major wrecks / convoy remains,
- industrial towers,
- collapsed overpasses,
- pipe/tank clusters,
- road checkpoints,
- unique scrap structures.

### Boss-capable clearings

The large world must deliberately include broad spaces suitable for temporary Boss Arena locks, for example:

- highway interchange,
- scrapyard clearing,
- convoy intersection,
- industrial loading yard,
- Marshal checkpoint.

Boss encounters happen **inside the same world and run**, not by loading an unrelated separate scene.

---

## 3. Enemy-role roster and visual read

Every new enemy must create a gameplay decision that does not already exist. Silhouette comes before detail/color.

| ID | Enemy | Role | Immediate silhouette/read | Planned first appearance |
|---|---|---|---|---:|
| E01 | Scrap Rat | Swarm melee | Very small, low rat body with scrap armor | 0:00 |
| E02 | Rust Hound | Fast hunter / pounce | Lean long hound, forward attack posture | ~1:15 |
| E03 | Sawbug | Ranged pressure | Six-legged hazard beetle, acid reservoir/nozzle | ~2:30 |
| E04 | Wreckling | Basic ranged | Small masked scavenger with obvious scrap pistol | ~5:30 |
| E05 | Fuse Tick | Kamikaze | Tiny mechanical tick with oversized glowing explosive battery | ~6:45 |
| E06 | Scrap Drone | Flying harasser | Asymmetric airborne junk machine | ~10:30 |
| E07 | Pipe Crawler | Artillery | Low crawling body with huge pipe launcher growth | ~12:00 |
| E08 | Hook Raider | Charger / pull / displacement | Tall narrow scavenger with very long hooked polearm | ~15:30 |
| E09 | Rivet Brute | Heavy melee | Very broad armored silhouette with heavy impact weapon | ~17:00 |
| E10 | Magnet Warden | Control Elite | Tripod magnetic machine with large coils | ~8:30 |
| E11 | Ash Stalker | Ambusher Elite | Tall crouched predator / vanish-reappear identity | ~18:30 |
| E12 | Signal Herald | Support Elite | Tall scavenger, huge radio pack/mast and red beacon | ~13:30 |
| E13 | Arc Warden | Lane-control Elite | Low four-legged machine with copper coils / arc cutter | ~22:30 |

### Normal-combat role limits

The Director must avoid unreadable “everything at once” compositions.

- Typical simultaneous normal roles: **4–5 maximum**.
- Typical ranged roles: **2 maximum**.
- Artillery roles: **1 maximum** in a standard encounter.
- Enemy weights rotate over time; introduction does not mean every unlocked enemy remains equally present forever.

---

## 4. Champion / Elite / Mini Boss / Boss hierarchy

Do not call every strong enemy a Boss.

### Champion

A modified version of an existing normal enemy.

Purpose:

- cheaper production than a brand-new enemy,
- short spike in attention,
- does not stop the normal run flow.

First candidate:

**Armored Rust Hound Champion**

- slightly larger than standard Hound,
- road-sign shoulder armor / warning lamp,
- stronger readable pounce pattern,
- long recovery window after its committed attack.

### Signature Elite

A unique high-priority encounter unit with a distinct control rule.

- E10 Magnet Warden — magnetic field pulse changes safe positioning.
- E11 Ash Stalker — ambush / vanish / telegraphed re-entry.
- E12 Signal Herald — support/command target; buffs or reinforces nearby enemies.
- E13 Arc Warden — telegraphed electrical lane control without projectile spam.

### Mini Boss

Short designed encounter, approximately `30–60 s` target before tuning.

Mini Bosses may use partial arena control, but not every Mini Boss needs a full Major-Boss lock.

**M01 Wreck Hound Alpha — ~5:00**

- oversized Hound with heavy road-sign armor,
- leap/dodge examination,
- howl can call a small scripted Hound pack,
- first meaningful build check.

**M02 Boilerback — ~10:00**

- giant scrap beetle / boiler body / obvious acid tank,
- area denial and acid arcs,
- may spawn a small scripted Fuse Tick set,
- tank/recovery cycle exposes a clear vulnerable period.

**M03 Chain Hauler — ~20:00**

- low, wide tow-rig/scavenger machine,
- huge chain and hook,
- charge lanes + pull/displacement,
- breaking the chain changes the encounter into Phase 2.

### Major Boss

Designed multi-phase battle with a temporary locked Boss Arena.

**B02 The Roadbreaker — ~15:00**

Visual read:

- demolition vehicle/mech,
- huge asymmetric front plow,
- heavy wheels/tracks,
- exhaust stacks,
- side rivet cannons.

Phases:

1. **Charge Lanes** — large, strongly telegraphed directional attacks.
2. **Broken Road** — controlled mines / barricades / temporary denial zones.
3. **Exposed Engine** — front armor breaks, core becomes vulnerable, aggression rises.

A phase must alter the fight, not merely add `+20% speed` to the same pattern.

### Final Boss

**B01 The Scrap Marshal — ~25:00**

Existing accepted identity remains canonical: wasteland warlord inside a welded asymmetric exosuit.

Planned phases:

1. **Commander / Exosuit Combat** — ranged + melee telegraphed patterns.
2. **Marshal's Field** — controlled reinforcements/deployables become part of Boss mechanics; normal Director stays off.
3. **Broken Rig** — suit damage exposes a more aggressive final state / weak points.

Final Boss death = standard-run victory.

### Far-later Boss-pool candidate

**The Iron Convoy** may be explored only after B01 and the standard 25-minute run are proven. It would be a formation/vehicle Boss rather than another giant humanoid. It is not part of the first required implementation path.

---

## 5. Temporary Locked Boss Arena contract

Major Bosses and the Final Boss should **not** freely chase the player across the entire large map.

Use a temporary arena lock inside the current world.

### Arena state machine

`WORLD_COMBAT → BOSS_WARNING → ENEMY_RETREAT → ARENA_LOCK → BOSS_INTRO → BOSS_FIGHT → BOSS_REWARD → ARENA_RELEASE → RECOVERY → WORLD_COMBAT`

### BOSS_WARNING

Approximately `10–15 s` before the Major/Final Boss entry:

- stop scheduling new normal encounter packets,
- siren / radio / music transition communicates a major contact,
- begin reducing background threat cleanly.

### ENEMY_RETREAT

Small enemies should not simply vanish in front of the player.

- suitable normal enemies switch to a retreat/flee state and move out of the visible combat space,
- enemies already safely outside the camera may be despawned,
- no new normal enemies spawn,
- old normal projectiles/hazards are allowed to drain or are safely cleared before the Boss intro,
- dropped Scrap must not be silently lost; allow collection, pull nearby valid Scrap inward, or otherwise preserve the reward according to the final pickup implementation.

### ARENA_LOCK

The game remains in the same world, but temporarily constrains the fight.

- barriers/wrecks/gates close the selected clearing,
- camera bounds become local to the arena,
- player cannot flee into the rest of the map,
- arena target footprint: roughly **1.3–1.7× the visible camera footprint** before final tuning,
- do not use a literal one-screen cage if it makes dodging unfair.

### BOSS_FIGHT

- the ordinary Encounter Director is paused,
- ordinary random horde spawning is disabled,
- only Boss-scripted adds/hazards may appear,
- scripted adds have their own explicit threat/performance budget,
- long Boss fights must change pattern/phase approximately every `20–40 s` rather than relying on a huge HP bar alone.

### BOSS_REWARD / ARENA_RELEASE

After victory:

- pause hostile pressure briefly,
- deliver the milestone reward,
- open/destroy arena barriers,
- restore normal world camera bounds,
- give a short recovery window,
- resume the Director into the next Act.

### Arena use by encounter class

| Encounter | Arena rule |
|---|---|
| Champion | No lock |
| Elite | Normally no lock; reduce normal spawn pressure if required |
| Mini Boss | Partial lock / heavy pressure reduction only when the design benefits from it |
| Major Boss | Full temporary Boss Arena lock |
| Final Boss | Full large Boss Arena lock |

---

## 6. Encounter Threat Budget contract

A strong enemy should not be stacked blindly on top of a full SURGE.

| Encounter type | Background pressure |
|---|---|
| Champion | Normal Director continues |
| Elite | Reduce new normal pressure roughly `30–40%` as a first tuning target |
| Mini Boss | Pause/reduce normal packets strongly; target roughly `25–40%` of normal background pressure unless scripted otherwise |
| Major Boss | Normal Director off; scripted Boss content only |
| Final Boss | Normal Director off; scripted Boss content only |

Percentages are starting points for playtest, not permanent balance constants.

---

## 7. Event pool — anti-repetition layer

Milestone times and enemy-family introductions are broadly predictable; the exact run between them should not be completely memorized.

First event candidates:

- **SWARM BREAK** — short Rat-heavy flood, very little ranged pressure; AoE power-fantasy moment.
- **HUNTER PACK** — Hounds + later Hook pressure; lower raw count, higher movement demand.
- **CROSSFIRE** — Wrecklings + limited Sawbugs; dodge/line pressure.
- **DEMOLITION WAVE** — Fuse Ticks behind a melee screen; target-priority test.
- **DRONE SWEEP** — aerial harassment + ground swarm, no heavy artillery overload.
- **ARTILLERY LOCKDOWN** — one/few Pipe Crawlers + melee protection with clear ground telegraphs.

Rules:

- do not repeat the same event twice consecutively,
- use weighted randomness, not a fixed identical script,
- retain legal “bad fit” situations; do not always tailor the encounter to the player's ideal build,
- event selection must respect active role and projectile/performance budgets.

---

## 8. Proposed standard-run timeline

This is the **player-facing run map**, not the implementation order. Times use the encounter-progression policy above and may slide later when a special encounter is still active.

### Five-Act structure

| Act | Target progression window | Identity | Endpoint |
|---|---:|---|---|
| Act I — Scavenge | 0–5 min | learn movement, swarm, hunter, first ranged pressure | M01 Wreck Hound Alpha |
| Act II — Escalation | 5–10 min | scavenger ranged + kamikaze + events + first Control Elite | M02 Boilerback |
| Act III — Air & Artillery | 10–15 min | drone/artillery/support pressure | B02 Roadbreaker |
| Act IV — Heavy Hunt | 15–20 min | displacement, heavy melee, ambush | M03 Chain Hauler |
| Act V — Marshal Territory | 20–25 min | late events, lane control, Final Surge | B01 The Scrap Marshal |

The Act endpoint must resolve before the next Act's milestone queue fully activates.

| Time | Run event | Purpose |
|---:|---|---|
| 0:00 | E01 Scrap Rat | readable start / basic movement and weapon loop |
| ~1:15 | E02 Rust Hound enters | punishes stationary play |
| ~2:30 | E03 Sawbug enters | introduces ranged positioning |
| ~3:30 | first Champion | early attention spike |
| ~5:00 | M01 Wreck Hound Alpha | Act I build check + milestone reward |
| ~5:30 | E04 Wreckling enters | new ranged family / scavenger identity |
| ~6:45 | E05 Fuse Tick enters | kamikaze target priority |
| ~7:30 | random Event | pattern break |
| ~8:30 | E10 Magnet Warden Elite | first major control Elite |
| ~10:00 | M02 Boilerback | Act II endpoint / area-denial check |
| ~10:30 | E06 Scrap Drone enters | aerial layer |
| ~12:00 | E07 Pipe Crawler enters | artillery / ground reading |
| ~13:30 | E12 Signal Herald Elite | support priority target |
| ~15:00 | B02 Roadbreaker | first full Major Boss Arena |
| ~15:30 | E08 Hook Raider enters | displacement/charge pressure |
| ~17:00 | E09 Rivet Brute enters | heavy melee / space consumption |
| ~18:30 | E11 Ash Stalker Elite | ambush rhythm change |
| ~20:00 | M03 Chain Hauler | late-build positioning check |
| ~21:30 | late random Event | stop late-game repetition |
| ~22:30 | E13 Arc Warden Elite | lane-control pressure without projectile spam |
| ~23:30 | Final Surge | controlled climax before final arena |
| ~24:30 | warning + retreat + recovery | clear transition to Final Boss |
| ~25:00 | B01 The Scrap Marshal | Final Boss; death = standard-run win |

Times remain tunable. The relationship/order matters more than exact seconds.

---

## 9. Reward ladder

Strong encounters should create anticipation because they can change the run, not just because they have more HP.

### Champion reward

- small Scrap / heal / modest bonus,
- avoid a long UI interruption for every Champion.

### Elite reward — `Field Cache`

- stronger roll than a normal level-up,
- may offer a higher-rarity choice or special pool,
- still respects randomness and compatibility rules,
- must not guarantee the exact perfect card for the current build.

### Mini Boss reward

Primary future integration point for the planned **Survival Cards** concept or another special short-list reward.

### Major Boss reward

Primary future integration point for a build-changing **Evolution Core / Legendary milestone choice**.

### Final Boss reward

- standard-run victory,
- Results flow,
- Workshop Scrip / progression reward according to the future economy revision,
- character/content unlock eligibility where appropriate.

Do not let Workshop currency bypass any Character Production Gate.

---

## 10. Upgrade-system implication of a 25-minute run

The current card pool was built around a shorter baseline. A 25-minute standard run will eventually require deeper build progression so the player does not finish meaningful growth too early.

Later additions, after the base upgrade loop is stable:

- Synergies,
- Evolutions,
- Survival Cards,
- Boss/Elite special rewards,
- additional character-specific compatible options.

Do not solve this by adding endless `+10% damage` ranks.

---

## 11. Workshop Scrip implication

The current Workshop Scrip survival-time table caps around the existing short-run baseline. It is **not final economy tuning for a 25-minute run**.

Only after standard-run duration and Boss completion are validated:

- redesign Scrip milestones around the real run length,
- include meaningful completion/Boss milestones if balance supports it,
- keep anti-farm and duplicate-run protections,
- do not make one optimal build the only efficient currency farm.

---

## 12. Mobile performance guardrails

WS16 already proved an important constraint:

- reference full run sustained about **19.13 projectile spawns/s**,
- current mobile soft maximum is about **20/s**,
- peak active projectiles were **24** against a soft maximum of **48**.

Therefore late-game difficulty must **not** be implemented as “just double the projectile count”.

Preferred late-game pressure sources:

- movement control,
- telegraphed lanes,
- displacement,
- priority targets,
- ambush timing,
- mixed roles,
- Boss phases,
- controlled scripted adds,
- terrain/arena hazards with clear visual language.

Every new ranged/artillery/Elite/Boss implementation must pass the existing mobile telemetry/performance gates before production activation.

---

# 13. Ordered implementation roadmap

This is the required implementation sequence. Do not skip forward because later content looks more exciting.

## R0 — Current-work completion gate

Status: ⬜ future gate

Before this roadmap becomes active:

- [ ] close the current repair/stability work,
- [ ] close the current Character Ownership / character-production work,
- [ ] close the active Upgrade System 2.0 work scheduled ahead of this roadmap,
- [ ] keep Quality / E2E / Smoke / Live green.

Reason: do not stack a major world/enemy expansion over unresolved ownership or frontend/runtime migrations.

---

## R1 — Future-run data contract + telemetry baseline

- [ ] define canonical `RunAct / EncounterMilestone / EncounterEvent` data structures,
- [ ] retain current 10-wave curve as regression/reference scenario,
- [ ] add timeline diagnostics for current act, next milestone, event and encounter state,
- [ ] extend telemetry fields needed for 25-minute runs before balancing content,
- [ ] add deterministic tests for milestone ordering and no duplicate ownership.

**Exit gate:** the future run can be described by data without hard-coded `if minute === ...` logic scattered through runtime files.

---

## R2 — Large-world streaming / activation foundation

- [ ] test `7200 / 9600 / 12000` world candidates,
- [ ] implement chunk/sector activation around the player,
- [ ] keep enemy/projectile/world-coordinate ownership canonical,
- [ ] prove no full-map object simulation is required,
- [ ] mobile performance test during long cross-map travel.

**Exit gate:** selected world size runs smoothly and the player cannot perceive chunk activation artifacts.

---

## R3 — Districts, landmarks and Boss clearings

- [ ] Central Wreckroads,
- [ ] Scrap Fields,
- [ ] Collapsed Highway,
- [ ] Rust Depot,
- [ ] Chemical Yard,
- [ ] Burned Convoy Zone,
- [ ] Marshal Territory,
- [ ] add memorable landmark language,
- [ ] create multiple Boss-capable open clearings,
- [ ] ensure road/open-ground navigation remains readable.

**Exit gate:** the large map feels like a journey rather than a larger empty brown rectangle.

---

## R4 — Encounter Director v2 + five-Act pacing

- [ ] canonical threat-budget owner,
- [ ] role-budget rules (`4–5` normal roles, `<=2` ranged, `<=1` artillery target),
- [ ] fixed milestone scheduling + weighted-random event scheduling,
- [ ] no consecutive duplicate event rule,
- [ ] recovery-window support,
- [ ] Director can lower/suspend pressure for special encounters,
- [ ] preserve compatibility with existing E01/E02/E03 production enemies first.

**Exit gate:** a long simulation changes encounter composition without relying on raw HP inflation or uncontrolled density.

---

## R5 — Boss Encounter Controller + temporary Arena Lock

Build infrastructure **before** building the major Bosses.

- [ ] encounter state machine (`WARNING → RETREAT → LOCK → INTRO → FIGHT → REWARD → RELEASE`),
- [ ] enemy retreat/flee behavior,
- [ ] safe off-camera despawn after retreat,
- [ ] Scrap preservation during transition,
- [ ] old projectile/hazard cleanup rules,
- [ ] local temporary camera/world bounds,
- [ ] physical/visual arena barriers,
- [ ] scripted-add budget separate from normal Director,
- [ ] restore world/Director after encounter,
- [ ] failure/death handling inside locked arena.

**Exit gate:** a test Boss dummy can enter and leave a locked arena cleanly without losing rewards, escaping bounds or restarting normal horde spawns during the fight.

---

## R6 — Special-encounter reward framework

- [ ] Champion minor reward hook,
- [ ] Elite `Field Cache`,
- [ ] Mini Boss special-reward hook,
- [ ] Major Boss Evolution/Legendary hook,
- [ ] Final Boss completion/progression hook,
- [ ] compatibility-aware but still random reward rules,
- [ ] no Workshop/ownership bypass.

Use existing legal rewards as placeholders until Survival Cards/Evolutions are ready; do not block encounter architecture on future card art.

---

## R7 — Early roster expansion + Event Pool v1

Produce enemies through `WRECKMARCH_ENEMY_PRODUCTION_GUIDE.md` one at a time:

- [ ] E04 Wreckling,
- [ ] E05 Fuse Tick,
- [ ] SWARM BREAK,
- [ ] CROSSFIRE,
- [ ] DEMOLITION WAVE.

**Exit gate:** early Acts contain distinct ranged/kamikaze decisions without mobile projectile overload.

---

## R8 — Champion framework + M01 (5-minute milestone)

- [ ] Champion modifiers/data contract,
- [ ] Armored Rust Hound Champion,
- [ ] first Champion reward integration,
- [ ] M01 Wreck Hound Alpha,
- [ ] M01 scripted Hound adds,
- [ ] Mini-Boss pressure-reduction policy test,
- [ ] 0:00–5:30 Act I production run.

---

## R9 — First signature Elite + M02 (10-minute milestone)

- [ ] E10 Magnet Warden production behavior/art,
- [ ] Elite `Field Cache` production path,
- [ ] M02 Boilerback,
- [ ] acid/area-denial readability,
- [ ] scripted Fuse Tick budget,
- [ ] validate 0:00–10:30 pacing against the old Wave-10 baseline.

This is the point where the old ~10-minute baseline becomes the **middle of the standard run**, not the ending.

---

## R10 — Mid-game role expansion

- [ ] E06 Scrap Drone,
- [ ] E07 Pipe Crawler,
- [ ] E12 Signal Herald,
- [ ] DRONE SWEEP event,
- [ ] ARTILLERY LOCKDOWN event,
- [ ] support-target and artillery role-budget tests,
- [ ] verify sustained projectile rate remains inside mobile envelope.

---

## R11 — B02 The Roadbreaker (15-minute Major Boss)

First complete Major-Boss proof of the arena architecture.

- [ ] production silhouette/art contract,
- [ ] Phase 1 Charge Lanes,
- [ ] Phase 2 road/mines/barricade control,
- [ ] Phase 3 exposed-engine state,
- [ ] full `WARNING → RETREAT → LOCK → FIGHT → REWARD → RELEASE` flow,
- [ ] Major Boss reward,
- [ ] 0:00–15:30 production run.

**Exit gate:** Boss feels like a designed battle, not an oversized normal enemy with a long HP bar.

---

## R12 — Late-game role expansion

- [ ] E08 Hook Raider,
- [ ] E09 Rivet Brute,
- [ ] E11 Ash Stalker,
- [ ] E13 Arc Warden,
- [ ] HUNTER PACK / late mixed event variants,
- [ ] displacement/ambush/lane-control telemetry,
- [ ] keep active role complexity readable.

---

## R13 — M03 Chain Hauler + late event layer

- [ ] M03 Chain Hauler,
- [ ] chain-break Phase 2,
- [ ] ~20:00 milestone reward,
- [ ] ~21:30 random late event,
- [ ] validate 15:30–22:30 pacing and recovery windows.

---

## R14 — Final Surge + B01 The Scrap Marshal

- [ ] controlled ~23:30 Final Surge,
- [ ] ~24:30 Final Boss warning/retreat/recovery transition,
- [ ] Marshal Territory final clearing,
- [ ] B01 Phase 1 Commander,
- [ ] B01 Phase 2 controlled reinforcements/deployables,
- [ ] B01 Phase 3 Broken Rig,
- [ ] no normal Director spawning during Final Boss,
- [ ] Final Boss death routes to standard Win / Results,
- [ ] complete 25-minute production run.

---

## R15 — Survival Cards / Synergies / Evolutions integration

Only after the 25-minute encounter path is functional:

- [ ] Mini Boss Survival Card integration,
- [ ] Boss Evolution Core / Legendary milestone integration,
- [ ] Synergies/Evolutions needed to prevent late-run build stagnation,
- [ ] character/weapon compatibility coverage,
- [ ] preserve random offers instead of always feeding the player's ideal synergy.

---

## R16 — 25-minute production balance + mobile performance closeout

- [ ] multiple strong/average/weak legal builds,
- [ ] character-specific production runs,
- [ ] Act-by-Act deaths/hits/kill-spawn analysis,
- [ ] Boss time-to-kill and phase-duration review,
- [ ] projectile spawn/active caps,
- [ ] active-enemy caps,
- [ ] long-frame/mobile heat/memory review,
- [ ] verify late difficulty is not coming mainly from HP inflation,
- [ ] Quality + E2E + Smoke + Live + real-device validation.

Do not lock exact 25:00 until this phase says the pacing is right.

---

## R17 — Workshop economy recalibration

After final standard-run duration is known:

- [ ] redesign Scrip survival milestones,
- [ ] define Boss/completion reward contribution,
- [ ] retain anti-farm/duplicate-run rules,
- [ ] verify no optimal forced build becomes the only efficient currency path.

---

## R18 — Standard Win polish

- [ ] Final Boss victory presentation,
- [ ] Results summary includes Boss/Act completion data,
- [ ] progression/unlock messaging,
- [ ] retry / Main flow,
- [ ] telemetry marks completed standard runs distinctly from deaths/exits.

---

## R19 — Endless / KEEP DRIVING (far later)

Not required for the first complete standard game.

- [ ] unlock only after a standard win,
- [ ] standard win remains recorded before Endless begins,
- [ ] every ~5 minutes: modifier/escalation layer,
- [ ] periodic Elite/Boss escalation,
- [ ] separate Endless score/telemetry contract,
- [ ] never reuse uncontrolled projectile/density inflation as the main Endless scaler.

---

## 14. Production discipline for every enemy / Boss

For each new combatant, follow this order:

1. role and unique decision,
2. silhouette contract,
3. static visual approval,
4. minimal required animation frames only,
5. behavior/system integration,
6. separate projectile/VFX where applicable,
7. hitbox/collision validation,
8. encounter/Director integration,
9. deterministic tests,
10. mobile visual/performance test,
11. production activation.

Do not generate a large animation sheet before the role/silhouette is accepted.

---

## 15. Stop rules

Do not continue adding content if any of these become true:

- CI / E2E / Smoke / Live is red,
- a new role has no gameplay decision distinct from an existing role,
- normal encounters routinely exceed readable role limits,
- projectile performance exceeds the mobile envelope,
- Boss length comes from HP alone instead of mechanics/phases,
- large-world expansion creates empty travel rather than meaningful locations,
- arena transitions lose Scrap, teleport enemies visibly, leak normal spawns or allow escaping the arena,
- new systems duplicate canonical Enemy/Character/Weapon/Upgrade ownership.

Fix the foundation before adding the next roster item.
