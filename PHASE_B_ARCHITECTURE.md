# Phase B Architecture Notes

- Starter weapon: `Scrap Rivet Gun`.
- Weapon identity, texture, damage, fire delay, range, projectile speed and muzzle distance are stored as swappable state.
- Future upgrade cards may replace or evolve the weapon without rewriting movement or targeting.
- Full-input Hero baseline speed: 285 world units/second.
- Touch input uses analog intensity plus short acceleration/deceleration smoothing.
- World baseline: 2200 x 2200 with camera follow, directional look-ahead and off-screen enemy entry.
- Ground art must stay readable: broken roads, cracks, terrain variation, scrap fragments and wreck landmarks rather than a flat brown floor.

## Future world expansion target

The current `2200 × 2200` world remains the production baseline for the current roadmap, but it is **not the intended final size** for the future ~25-minute standard run.

Future world expansion is deferred until the current repair/character/upgrade gates are closed.

- Provisional preferred target: `~9600 × 9600` world units.
- Real-device candidates to compare before final lock: `7200 × 7200`, `9600 × 9600`, `12000 × 12000`.
- Use chunk/sector activation near the player; do not simulate or render the entire large world continuously.
- If `9600 × 9600` wins, a nominal `3 × 3` / `~3200 × 3200` district partition is a starting architecture, not a visual grid requirement.
- Future districts should include memorable roads/landmarks and multiple broad Boss-capable clearings.
- Major/Final Bosses use temporary locked arenas inside the same world rather than loading an unrelated separate Boss map.

See `FUTURE_RUN_WORLD_ENCOUNTER_ROADMAP.md` for the ordered implementation path, district concepts and Boss Arena state machine.
