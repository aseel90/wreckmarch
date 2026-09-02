# Workstream 14-C — Shotgun Character Visual Identity & Art Gate

Status: 🟡 ACTIVE DESIGN GATE — ART NOT GENERATED YET

WS14-B is complete. The canonical Shotgun weapon foundation is merged, tested and production-deployed, but it remains unreachable from the live character flow. WS14-C now owns the **dedicated visual identity and minimal production animation set** for the future Shotgun character.

This workstream must not invent a temporary Runner reskin and must not build the character-selection screen. Selection belongs to WS14-D; live character activation belongs to WS14-E.

## 1. Decisions intentionally not guessed

The following visual choices require an explicit character-art decision before final production frames are generated:

- Character visual concept / silhouette
- Face/head treatment
- Outfit/armor language
- Body build and readable proportions
- Distinctive visual feature that separates the character from Runner
- Final character display name

No production frame should silently decide these by accident.

## 2. Canonical frame contract inherited from the current Runner pipeline

The current production Runner normalization path establishes a known-safe character frame contract:

- Output canvas: **128 × 148 px**
- Target opaque-body box: approximately **104 × 132 px**
- Shared foot/baseline: **Y = 140**
- Transparent background
- Stable character scale across every frame
- Stable body proportions and silhouette across every frame
- Weapon is **not baked into the character image**
- Arms/body must clearly read as a two-handed weapon-holding pose so the independent weapon layer can sit naturally in the hands
- The same reference character must be used for every generated frame; do not redesign clothing, face, gear or proportions between frames

These dimensions are a production normalization contract, not a requirement to stretch the raw source image. Raw generated art may be larger, but all final runtime frames must normalize to the same output contract.

## 3. Minimal animation set — approved direction

Do not generate a large sprite sheet. Start with the smallest set already proven by Runner:

### Idle / breathing — 2 frames

- `shotgun-idle-0`
- `shotgun-idle-1`
- Only subtle breathing/body movement between frames
- Feet and overall scale remain fixed
- Clear two-handed Shotgun-holding posture, but **no weapon rendered in either frame**

### Run / locomotion — 3 frames

- `shotgun-run-0`
- `shotgun-run-1`
- `shotgun-run-2`
- Readable three-step movement cycle
- Keep torso/arms compatible with an independent aiming weapon layer
- No change in character identity, clothing or scale between frames
- No weapon rendered in the frames

**Initial total: 5 production frames.**

Do not add dedicated aim/reload/attack frames until live integration demonstrates a real visual need. The current architecture already handles weapon aiming independently, so extra frames would add production cost before evidence says they are necessary.

## 4. Character-system integration boundary

WS14-C may prepare dedicated art assets and a future character definition draft, but must preserve these architecture rules:

- New character-owned files go under `src/characters/` / `src/characters/assets/`; do not create a new `phase-*` or hotfix runtime.
- The character's starting weapon will resolve canonically to `shotgun` through the existing Weapon Registry when WS14-E activates it.
- Do not duplicate Shotgun balance numbers in the character definition.
- Do not modify Runner art, Runner movement numbers or Runner weapon identity to make the new art fit.
- Do not hard-code a two-character selector into the current runtime; WS14-D must build an extensible selection flow.

## 5. Visual acceptance checklist

Before a generated frame is accepted into the repository:

- [ ] Same approved character identity as the master reference
- [ ] Transparent background
- [ ] No baked-in firearm
- [ ] Correct two-handed weapon-holding posture
- [ ] Character size/proportions match the approved reference
- [ ] Feet/baseline can normalize cleanly to `Y=140`
- [ ] No clipped hands, feet, hair, clothing or equipment
- [ ] No unexplained black/white artifacts between body parts
- [ ] No frame-to-frame color drift or glowing/washed-out body parts
- [ ] Idle pair reads as subtle breathing, not two different poses/characters
- [ ] Run trio reads as grounded running rather than floating/sliding
- [ ] Weapon socket can be aligned without repainting the character frame

## 6. Production sequence

1. Approve **one master visual reference** for the Shotgun character.
2. Generate/approve **Idle 0** as the dimensional reference.
3. Generate **Idle 1** from that same reference and verify breathing consistency.
4. Generate the three run frames **one image at a time**, validating dimensions and identity after each frame.
5. Normalize all five frames through the same `128×148 / 104×132 / baseline 140` contract.
6. Add dedicated Shotgun-character locomotion art loader/asset ownership under `src/characters/`.
7. Run unit/visual ownership tests without making the character selectable.
8. Close WS14-C only after the five-frame production set is accepted and repository ownership is clean.

## 7. Stop rule

Do not start WS14-D character selection or WS14-E live activation using placeholder/Runner art. If the visual identity is not approved, WS14-C stays open rather than shipping a temporary character that later requires patch-over-patch replacement.
