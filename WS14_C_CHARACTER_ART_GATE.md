# Workstream 14-C — Shotgun Character Visual Identity & Art Gate

Status: ✅ ART FOUNDATION COMPLETE / PLAYABLE ACTIVATION STILL LOCKED

WS14-B is complete. The canonical Shotgun weapon foundation is merged, tested and production-deployed. The dedicated Shotgun visual foundation is also now implemented: two idle frames, three run frames, an independent Shotgun weapon asset, aim-alignment/runtime composition, and character-driven C5/D1 presenters. The character remains intentionally unreachable as playable content because its canonical gameplay definition and real Production full-run approval are still blocked by the Shotgun production gate.

The original production rules below remain authoritative: no temporary Runner reskin, no duplicated Runner gameplay values, and no activation bypass. Character Select may show the locked preview, while live activation remains owned by the canonical access + production gates.


## 0. Current verified implementation — 2026-09-03

Completed:

- [x] Dedicated Shotgun body art exists under `assets/hero/shotgun/`.
- [x] Idle set contains exactly **2** production frames.
- [x] Run set contains exactly **3** production frames.
- [x] Weapon remains independent at `assets/weapons/shotgun.svg`; it is not baked into body frames.
- [x] `shotgun-production-art.js` owns the art manifest and authored grip/muzzle geometry.
- [x] `shotgun-runtime-composition.js` and `shotgun-aim-alignment.js` own composition/aim contracts.
- [x] `shotgun-production-presentation.js` provides character-driven C5/D1 presentation without `if shotgun` branches in the phase files.
- [x] Character Select can render a locked Shotgun preview from canonical art metadata.
- [x] Playable activation is still blocked.

Still pending and intentionally outside the completed art gate:

- [ ] Approve a canonical **character gameplay definition** (HP, movement speed, passive decision, physics/locomotion values where they differ).
- [ ] Register that definition only after its values are approved; do not copy Runner values as a shortcut.
- [ ] Run the real Production gameplay/full-run validation and record evidence in the Shotgun production gate.
- [ ] Only then change character availability from locked to selectable.

## 1. Historical art decisions (now resolved by the accepted production set)

The following visual choices were the original pre-generation decision gate. They are now represented by the accepted production assets and should not be silently redesigned during gameplay integration:

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
