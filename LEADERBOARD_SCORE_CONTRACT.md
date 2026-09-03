# WRECKMARCH — Leaderboard / Score Activation Contract

**Status:** Architecture/product gate only. Leaderboard is **OFFLINE**.

## 1. Current canonical state

The current frozen post-run `RunResult` contains:

- `reason`
- `characterId`
- `survivedSeconds`
- `scrap`
- `level`
- `createdAt`

It intentionally contains **no canonical `score` field**. Combat telemetry records additional analytical data such as kills and DPS, but telemetry is not a player-facing scoring owner and must not silently become one.

## 2. Non-negotiable scoring rules

Do not activate Leaderboard until one score/ranking contract is explicitly approved.

- The ranking value must be produced once at the canonical run-end boundary.
- Results and Leaderboard may display that value; neither may independently recalculate it.
- Analytics-only telemetry fields must not be promoted into score without an explicit product/balance decision.
- A ranking definition must be deterministic from immutable run-end data.
- Equal scores need one documented tie-break order.
- Abandoned/restarted/debug/autotest runs need explicit eligibility rules.
- Score rules must be versioned so balance changes do not silently mix incomparable runs.
- Future characters must not gain an accidental ranking advantage merely because their mechanics generate different telemetry patterns.

## 3. Required product decisions before implementation

- [ ] Choose the primary ranking objective (for example survival, run completion, or a deliberately designed composite score).
- [ ] Define all tie-breakers.
- [ ] Define whether rankings are global, per-character, per-ruleset/season, or some combination.
- [ ] Define run eligibility and anti-debug/test exclusions.
- [ ] Define a score/ruleset version identifier.
- [ ] Decide retention/season reset behavior.
- [ ] Define player identity/display-name/privacy behavior.
- [ ] Define backend write/read ownership and offline/failure behavior.

## 4. Backend and integrity gates

Before Leaderboard becomes an active Main route:

- [ ] One canonical score field is added to the frozen run-end contract or to a single canonical ranking-result object produced from it.
- [ ] Score submission is idempotent and identified by a stable run/submission ID.
- [ ] Backend rejects malformed, test/debug, ineligible, or unsupported-ruleset submissions.
- [ ] Duplicate submissions cannot create duplicate ranked entries.
- [ ] Read failures leave Main, Character Select, Gameplay, Progression and local Results fully usable.
- [ ] Unit tests cover score calculation/versioning/eligibility/ties.
- [ ] E2E covers Leaderboard navigation without bypassing the shell.
- [ ] Full Quality, Smoke, E2E and Live validation pass.

## 5. Current decision

Leaderboard remains registered but OFFLINE. Do not build a fake local leaderboard and do not infer a score from Scrap, level, kills, DPS, or survival time until the ranking objective is explicitly approved.
