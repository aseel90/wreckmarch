# Phase F0 — Production Foundation

Status: **in progress**

Branch: `refactor/f0-production-foundation`

Goal: reorganize Wreckmarch for long-term Web + Android development without changing the known-good game behavior.

## Started

- [x] Isolated F0 from `main`.
- [x] Added Node/Vite/TypeScript/Playwright/Vitest foundation.
- [x] Pinned Phaser to `3.90.0` during the refactor.
- [x] Added a reproducible static build that preserves the current runtime chain.
- [x] Added unit checks for the current boot contract.
- [x] Added a Playwright test for E0 startup terrain and E1 12-second asphalt persistence.
- [x] Documented the target production architecture and Android boundary.
- [ ] Wire Node checks into GitHub Actions.
- [ ] Extract the first stable production module from legacy phase layers.
- [ ] Introduce normalized input contracts for keyboard/touch/gamepad.
- [ ] Consolidate terrain/road ownership.
- [ ] Consolidate player/character ownership.
- [ ] Remove superseded runtime phase modules only after parity tests pass.

No old runtime file should be deleted merely for cleanup. Removal happens only after an equivalent tested owner exists.
