# Phase F0 — Production Foundation

Status: **in progress**

Goal: reorganize Wreckmarch for long-term Web + Android development without changing the known-good game behavior.

## Completed foundation work

- [x] Added Node/Vite/TypeScript/Playwright/Vitest foundation.
- [x] Pinned Phaser to `3.90.0` during the refactor.
- [x] Added a reproducible static build that preserves the current runtime chain.
- [x] Added unit checks for the current boot contract.
- [x] Added Playwright coverage for startup, Runner movement, E0/E1 ownership, and E1 12-second asphalt persistence.
- [x] Documented the target production architecture and Android boundary.
- [x] Wired foundation checks into GitHub Actions.
- [x] Extended legacy smoke checks through E0/E1 persistence instead of stopping at D1.
- [x] Extracted stable production modules: `InputManager` and `TerrainSystem`.
- [x] Routed live keyboard/touch movement through the normalized input boundary.
- [x] Consolidated terrain/road ownership: B, B1, C4, C5, and D1 no longer own independent runtime terrain networks.
- [x] Kept E0 as the fast bootstrap and E1 as the final authoritative terrain layer, both backed by `TerrainSystem`.

## Next

- [ ] Consolidate player/character ownership around a data-driven character definition instead of one hard-coded Runner.
- [ ] Add a gamepad input provider behind the existing input boundary.
- [ ] Consolidate enemy/combat ownership.
- [ ] Consolidate Rig ownership.
- [ ] Remove superseded runtime phase modules only after their remaining behavior has equivalent tested production owners.

No old runtime file should be deleted merely for cleanup. Removal happens only after an equivalent tested owner exists.
