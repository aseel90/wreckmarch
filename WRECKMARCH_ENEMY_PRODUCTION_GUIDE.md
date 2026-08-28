# WRECKMARCH — Enemy Production Guide

Status: **Accepted production standard**

This document is the reusable production reference for every new WRECKMARCH enemy. It exists so later enemies follow the same clean pipeline used for Rust Hound and the revised Sawbug instead of growing into oversized, inconsistent sprite sheets.

## 1. Core rule: only create frames the game actually needs

Do **not** generate a large animation atlas by default.

Start from the smallest complete set needed for the enemy's real behavior. Add frames only when gameplay readability or animation quality clearly requires them.

Recommended baseline for a normal enemy:

| Animation / asset | Target frame count | Notes |
|---|---:|---|
| Idle | 2 | Small mechanical/body motion only |
| Walk / locomotion | 4 | Enough to read movement cleanly at game scale |
| Main attack | 3 | Wind-up/read → release/action → recovery |
| Hit | 1–2 | Only if a dedicated hit pose is useful |
| Death | 3–4 | Optional until the enemy's core loop is approved |
| Projectile | 2 | Only for enemies that fire a visible projectile |
| Impact / splash | 2 | Separate from the enemy sprite |

These are **targets, not quotas**. A simple enemy may need fewer. A boss or unusually complex enemy may need more, but extra frames require a gameplay reason.

## 2. Asset cleanliness requirements

Every production frame must be ready for direct game use:

- PNG with a genuinely transparent background.
- No checkerboard baked into the image.
- No black/white matte behind the sprite.
- No glow halo, fringe, outline contamination or background remnants around the silhouette.
- No accidental dust, floor, shadow patch, scenery, text, arrows, labels or decorative particles attached to the frame.
- No cropped legs, weapons, antennae, tails or other silhouette parts.
- Keep clear transparent padding around the complete silhouette.
- Keep character scale and camera angle consistent across all frames in the same animation set.

If an effect is easier to control in runtime, **do not bake it into the enemy sprite**.

## 3. Separate character animation from effects

Projectiles and combat FX are separate assets whenever practical.

Examples:

- acid projectile
- acid splash / puddle
- sparks
- muzzle flash
- smoke
- dash trail
- impact burst
- warning marker / telegraph

This keeps the enemy animation clean, makes timing adjustable in code, and lets the same effect be reused or recolored later.

## 4. Consistency rules across frames

Before importing a frame set, verify:

- same body proportions
- same armor layout and major markings
- same number and placement of limbs
- same eye/sensor placement
- same weapon/nozzle/attachment design
- same palette
- same viewing angle
- no unexplained parts appearing/disappearing between frames

The pose may change; the **design must not mutate** from frame to frame.

## 5. Production sequence for every new enemy

Use this order:

1. **Lock gameplay role** — what decision does this enemy force from the player?
2. **Lock silhouette** — must be recognizable before color/detail.
3. **Lock palette** — distinguish it from enemies already active in the same waves.
4. **Lock attack language** — wind-up, active moment, recovery, and what the player reads.
5. **Choose minimum frame budget** using the table above.
6. **Generate locomotion first** — Idle + Walk.
7. **Generate the main attack** only after locomotion/design consistency is approved.
8. **Generate projectile/impact FX separately** if the enemy uses them.
9. **Add Hit/Death only when needed**; do not delay core gameplay for decorative frames.
10. **Import and test at real game scale** before creating extra frames.

## 6. Animation readability rules

A dangerous attack needs three readable phases even when we use only three frames:

1. **Wind-up / telegraph** — player can understand what is about to happen.
2. **Active / release** — the damaging action is visually clear.
3. **Recovery** — a short readable return that prevents the attack from feeling instantaneous or unfair.

The runtime can hold or tween these frames for timing. We do not need one image for every tiny motion.

## 7. Palette rule

New enemies should not disappear into the same brown/rust mass.

Use the roster around the enemy as context. A new unit should have at least one strong identifying color/material while staying inside WRECKMARCH's industrial scrap language.

Color is secondary to silhouette, but it should help the player identify threats quickly during crowded waves.

## 8. Reference art policy

Concept sheets and roster illustrations are **references only** unless explicitly promoted to production source art.

They may guide:

- silhouette
- materials
- palette direction
- mechanical language
- enemy fantasy

They do **not** force exact geometry, animation, weapon placement or final sprite details.

The production sprite must be designed for actual gameplay readability and animation consistency.

## 9. Current example — E03 Sawbug

The current accepted direction for Sawbug is the compact example of this pipeline:

- Family: Scrap insect
- Role: ranged pressure / mobile acid spitter
- **No dash attack**
- Hazard-yellow / dark gunmetal body for immediate visual separation
- Bright green acid reservoir / acid read
- Minimal locomotion set
- Three-frame spit attack: wind-up → spit → recovery
- Acid projectile kept separate
- Acid impact/splash kept separate
- Hit and Death remain optional until the core enemy feels correct in-game

Suggested first production package:

| Asset | Frames |
|---|---:|
| Idle | 2 |
| Walk | 4 |
| Acid Spit | 3 |
| Acid Projectile | 2 |
| Acid Splash | 2 |

That is enough to build and judge the complete gameplay loop before spending time on extra animation.

## 10. New-enemy checklist template

Copy this checklist when starting E04 and later enemies:

```md
### Enemy: [ID] [NAME]

- Gameplay role:
- Player decision it creates:
- Silhouette read:
- Primary palette:
- Secondary/accent color:
- Locomotion type:
- Main attack:
- Telegraph:
- Recovery:
- Projectile/FX needed:

#### Minimum production frames
- Idle: __
- Walk/Move: __
- Attack: __
- Hit: __ / deferred
- Death: __ / deferred
- Projectile: __ / N/A
- Impact FX: __ / N/A

#### Asset QA
- [ ] Transparent PNG
- [ ] No halos/background remnants
- [ ] No baked scenery/text
- [ ] Full silhouette inside canvas
- [ ] Consistent scale and angle
- [ ] Consistent body design across frames
- [ ] Runtime FX separated where appropriate
- [ ] Tested at actual in-game scale
```

## 11. Definition of done for enemy art

An enemy art package is ready to integrate when:

- the minimum gameplay animations exist;
- the design remains consistent between frames;
- transparency is clean;
- the enemy reads clearly at actual game size;
- its main attack is readable from wind-up through recovery;
- projectiles/FX are separate when appropriate;
- no extra animation was produced only to make a large sheet look complete.
