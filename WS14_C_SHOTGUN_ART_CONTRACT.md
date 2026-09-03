# WS14-C — Shotgun Character Production Art Contract

Status: **ACTIVE ART GATE / NOT PLAYABLE**

This contract implements the approved first safe step of WS14-C. It does not register a new playable character, change Runner gameplay, alter balance, steer RNG, or activate Shotgun A1 on `main`.

## Exact production geometry

Every accepted Shotgun body frame must use the same production geometry as the current Runner/Hunter body pipeline:

- Canvas: **128 × 148 px** exactly.
- Body target envelope: **104 × 132 px** maximum.
- Foot line: **Y = 140**.
- Render origin: **X = 0.50, Y = 0.52**.
- Runtime render scale: **0.78**.
- Grip socket baseline: **X = ±15 px, Y = -5 px** from hero world origin, mirrored using the existing aim-facing contract.
- Body and Shotgun remain separate layers. The weapon must never be baked into the body sprites.

These values are not approximations. They are frozen from the currently deployed Runner production path so the new character cannot become larger/smaller, float, sink, or drift at the grip when frames change.

## Minimal frame set

Create and approve frames one at a time:

1. `idle-0` — neutral breathing pose.
2. `idle-1` — second breathing pose with minimal body displacement.
3. `run-0` — first run contact/stride pose.
4. `run-1` — passing/mid-stride pose.
5. `run-2` — opposite contact/stride pose.

All five body frames must preserve head/body scale, foot line, shoulder/grip relationship, silhouette readability, and transparent background. Additional recoil/hit/death frames are explicitly deferred until gameplay proves they are necessary.

## Separate Shotgun weapon art

The Shotgun visual is a separate asset/layer. It must be authored against the frozen grip socket and later receive a measured weapon pivot and muzzle origin from the final approved weapon image. No muzzle/pivot pixel value should be invented before that weapon art exists.

## Acceptance gate before runtime integration

WS14-C art is accepted only when:

- every body frame is exactly 128 × 148;
- visible body bounds fit the 104 × 132 envelope and feet align at Y=140;
- origin/scale stay identical to Runner production geometry;
- the hand/grip does not drift across idle/run frames;
- left/right mirroring remains believable;
- Shotgun is not baked into body frames;
- no character registration, selection UI, runtime import, cache-bust, balance change, or `main` activation is introduced yet.

The executable source of truth is `src/characters/shotgun-art-contract.js`, protected by `tests/unit/shotgun-art-contract.test.ts`.
