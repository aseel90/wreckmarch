# WS23 — U4 Balance Gate / Reintegration

Status: IMPLEMENTED / CI VALIDATION PENDING

## Purpose

WS23 is the final protective gate for the current Combat & Build Balance phase. It does not rebalance cards, steer RNG, or change gameplay values. It only declares reintegration ready when the required evidence already produced by prior workstreams is present and repository validation is green.

## Required gates

1. Production evidence is complete for the remaining gameplay-validation items, including natural Triple Riveter evidence.
2. Build diversity / anti-mandatory-card validation from WS20 is complete.
3. The deterministic interaction matrix from WS22 is complete and green.
4. Mobile projectile/effect performance from WS21 is Production validated.
5. Repository Quality, Smoke, and E2E validation are green on the reintegration change.

## Decision rule

All five gates must pass. Missing evidence blocks reintegration; it does not trigger a speculative gameplay nerf or buff.

The evaluator always returns `protectedGameplayChange: true` so a failed gate means gather/fix evidence first rather than changing combat values without attribution.

## Exit gate

WS23 is complete when its deterministic unit coverage plus repository Quality, Smoke, all E2E shards, and aggregate E2E pass on the final PR. At that point the current Combat & Build Balance roadmap phase may be marked complete and future balance work must start from this protected baseline.
