# Wreckmarch Production Architecture

## Current transition

Wreckmarch is moving from rapid runtime-patch prototyping to a production structure that can support Android, multiple playable characters, more enemies, weapons, upgrades, Rigs, bosses, and long-term save data.

The current Phaser 3.90 runtime remains the golden behavioral baseline during F0. The refactor must preserve gameplay and visuals before old phase files are removed.

## Non-negotiable rules

1. `main` stays playable. Migration happens in small PRs.
2. Do not add new `phase-*-runtime` layers for future features.
3. Each stable domain gets one source of truth.
4. Gameplay must not depend directly on keyboard or browser APIs.
5. Content should be data-driven where practical.
6. Web and Android share the same gameplay code.
7. Phaser 4 migration is a separate future change, not part of F0.

## Target modules

```text
src/
  core/
  scenes/
  player/
    characters/
  enemies/
    behaviors/
    definitions/
  weapons/
    behaviors/
    definitions/
  rig/
    modules/
  systems/
  input/
  save/
  data/
  platform/
```

## Platform boundary

Gameplay reads normalized actions from an input layer, not raw keyboard/touch state:

```text
InputManager
  KeyboardInput
  TouchInput
  GamepadInput
```

A later Capacitor Android shell belongs behind `platform/` and must not leak Android-specific APIs into gameplay systems.

## Migration order

1. Establish reproducible Node tooling and tests around the existing game.
2. Extract constants, platform/input contracts, and pure calculations.
3. Extract terrain/roads as the first stable world system.
4. Extract player/character model without changing current Runner behavior.
5. Extract combat, enemies, progression, Rig, and UI one domain at a time.
6. Remove a legacy phase module only when its behavior is owned and tested elsewhere.
7. Add new gameplay content only through the permanent architecture.

## Definition of safe migration

For each extraction PR:

- current browser smoke tests pass;
- E0 terrain appears during startup;
- E1 road self-test passes;
- 12-second road persistence passes;
- no intended gameplay or visual change unless the PR explicitly declares one.
