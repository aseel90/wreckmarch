# WRECKMARCH — Enemy Roster (accepted concept roster)

This roster is intentionally diverse. **Scrap Rat is the only core rat archetype**; the game world also contains mutant beasts, scrap insects, scavengers and machines.

Production rule for all new enemies: follow **[WRECKMARCH_ENEMY_PRODUCTION_GUIDE.md](./WRECKMARCH_ENEMY_PRODUCTION_GUIDE.md)** before generating or integrating final animation frames.

| ID | Enemy | Family | Role | Core read |
|---|---|---|---|---|
| E01 | Scrap Rat | Mutant beast | Swarm melee | Current small scrap-armored rat baseline |
| E02 | Rust Hound | Mutant beast | Fast hunter | Lean wasteland hound; readable pounce |
| E03 | Sawbug | Scrap insect | Ranged pressure | Six-legged hazard beetle with acid reservoir and spit nozzle; no dash |
| E04 | Wreckling | Scavenger | Basic ranged | Small masked scavenger with scrap pistol |
| E05 | Fuse Tick | Scrap insect | Kamikaze | Tiny mechanical tick with glowing explosive battery |
| E06 | Scrap Drone | Machine | Flying harasser | Asymmetric airborne junk drone |
| E07 | Pipe Crawler | Mutant | Ranged artillery | Crawling mutant with pipe launcher growth |
| E08 | Hook Raider | Scavenger | Charger/displacer | Tall raider with long hooked polearm |
| E09 | Rivet Brute | Scavenger | Heavy melee | Huge armored hammer unit |
| E10 | Magnet Warden | Machine | Control Elite | Tripod magnetic machine with field pulses |
| E11 | Ash Stalker | Mutant beast | Ambusher Elite | Tall crouched predator that vanishes/reappears |
| E12 | Signal Herald | Scavenger | Support Elite | Tall scavenger with oversized radio pack/mast and red warning beacon |
| E13 | Arc Warden | Machine | Lane-control Elite | Low four-legged machine with large copper coils / arc cutter |
| M01 | Wreck Hound Alpha | Mutant beast | Mini Boss | Oversized Hound with heavy road-sign armor; leap + scripted pack pressure |
| M02 | Boilerback | Scrap insect | Mini Boss | Giant scrap beetle with pressure boiler and exposed acid tank |
| M03 | Chain Hauler | Scavenger machine | Mini Boss | Low wide tow-rig with huge hook/chain and displacement lanes |
| B02 | The Roadbreaker | Demolition machine | Multi-phase boss | Asymmetric plow/tracks/exhaust stacks/side cannons; first Major Boss Arena |
| B01 | The Scrap Marshal | Scavenger mech | Final multi-phase boss | Warlord inside a welded asymmetrical exosuit |

Visual concepts are references, not final production sprites. Each enemy must remain identifiable by silhouette before color/detail.

## Current production state

- **E01 Scrap Rat:** production baseline.
- **E02 Rust Hound:** production enemy with dedicated animation/attack pipeline.
- **E03 Sawbug:** current production target. Accepted direction is a hazard-yellow acid-spitting scrap insect with a minimal frame set and separate projectile/splash FX.
- **E04–E09:** accepted future normal-role identities; follow the production guide one at a time.
- **E10–E13:** accepted future Signature Elite identities; behavior must justify each control/support role without uncontrolled projectile spam.
- **M01–M03:** accepted future Mini Boss concepts for the 5/10/20-minute milestones.
- **B02 The Roadbreaker:** accepted future first Major Boss / locked-arena proof at roughly 15 minutes.
- **B01 The Scrap Marshal:** accepted Final Boss identity for the future standard run at roughly 25 minutes.
- Final timing, stats and art remain production-gated; concept acceptance does not make an enemy playable/active.
- Ordered implementation and the Boss Arena contract live in `FUTURE_RUN_WORLD_ENCOUNTER_ROADMAP.md`.
