# Phase B Architecture Notes

- Starter weapon: `Scrap Rivet Gun`.
- Weapon identity, texture, damage, fire delay, range, projectile speed and muzzle distance are stored as swappable state.
- Future upgrade cards may replace or evolve the weapon without rewriting movement or targeting.
- Full-input Hero baseline speed: 285 world units/second.
- Touch input uses analog intensity plus short acceleration/deceleration smoothing.
- World baseline: 2200 x 2200 with camera follow, directional look-ahead and off-screen enemy entry.
- Ground art must stay readable: broken roads, cracks, terrain variation, scrap fragments and wreck landmarks rather than a flat brown floor.
