# Wreckmarch — Character / Signature Weapon Policy

> **Status:** ✅ APPROVED DESIGN POLICY  
> **Applies to:** `UPGRADE_SYSTEM_2_ROADMAP.md`, future playable-character work, weapon architecture and upgrade-offer compatibility.  
> **Implementation status:** Current Runner/Hunter + Rivet Gun remains live. The Shotgun Character is reserved for future implementation and must not be built during U4.

---

## 1. Canonical character–weapon identity model

Every playable character is a **complete combat archetype tied to one canonical signature weapon**.

A playable character is not a skin that freely swaps between the full weapon roster.

```text
Character
+ Signature Weapon
+ Base combat profile
+ Passive/config
+ Compatible General / Character / Weapon upgrades
= Playable combat archetype
```

This is the approved long-term character model for Wreckmarch.

### Architecture rules

- Character definitions own the canonical signature-weapon reference (`startingWeaponId` or its future canonical equivalent).
- Weapon definitions/systems own real weapon mechanics and weapon-native stats.
- A new weapon must not be implemented as a visual skin over Rivet Gun behavior.
- Run upgrades modify the archetype without erasing its base weapon identity.
- General upgrades may be shared where mechanically compatible.
- Character-specific and weapon-specific upgrades must only enter offers for compatible archetypes.
- Weapon-native traits may exist from the start; the player must not be forced to buy cards merely to make the signature weapon behave like itself.
- Weapon swapping between playable characters is **not part of the approved current design**.
- A future weapon-swap feature would require a separate explicit design decision.
- New characters must be added through canonical character/weapon definitions rather than copied Runner runtime code or character-specific patch layers.

---

## 2. Current archetype — Runner / Hunter

The current playable Runner/Hunter remains tied to the **Rivet Gun**.

The existing Runner/Hunter + Rivet Gun behavior is the baseline that U4 continues to expand.

Rivet-specific upgrade concepts may include mechanics such as:

- damage / heavy-rivet scaling
- fire-rate changes
- projectile speed/range
- multishot
- pierce
- ricochet
- crit
- controlled explosive/shrapnel interactions

These upgrades must remain composable so the player creates their own build rather than being forced through a predefined upgrade tree.

---

## 3. Reserved second archetype — Shotgun Character

The **Shotgun Character is the only additional playable archetype currently approved/reserved**.

It is approved for architecture and future planning only.

**Do not implement the Shotgun Character during U4.**

### Approved weapon identity direction

Signature weapon: **Shotgun**.

The Shotgun should have a genuinely different combat profile from the Rivet Gun:

- multiple pellets/projectiles per shot as a base weapon trait
- shorter effective range than the Rivet Gun
- strong close-range pressure
- slower/heavier firing rhythm than a rapid-fire weapon
- native limited penetration/pierce is allowed as part of the Shotgun identity
- its own spread behavior
- its own projectile/pellet interactions

### Balance remains TBD

The following values are intentionally **not finalized** until the Shotgun Character enters active development and gameplay testing:

- base damage
- damage per pellet
- pellet count
- spread
- range
- fire delay / fire rate
- native pierce count
- falloff behavior
- knockback, if any
- passive/combat-profile values

No placeholder number becomes canonical simply because it appears in an implementation experiment.

### Future Shotgun upgrades

Shotgun-specific upgrades should build on the actual Shotgun identity, for example pellet, spread, close-range and penetration mechanics.

They must not be Rivet cards with renamed text.

Exact Shotgun cards are **not approved yet** and will be designed when the Shotgun Character phase begins.

---

## 4. Future characters after Shotgun

All playable characters after the Shotgun Character remain **TBD / uncommitted**.

Do not pre-approve Tank, Scout, Heavy Gunner, Flamethrower, Sniper or any other archetype as a production commitment merely because it has been discussed as an example.

For every future character we will decide separately:

- signature weapon
- weapon-native mechanics
- character base stats
- passive
- compatible General / Character / Weapon upgrade pool
- art/animation identity
- balance role

This keeps the architecture open without locking the game into speculative character designs.

---

## 5. Upgrade System compatibility contract

Upgrade System 2.0 must support three useful content layers:

### General upgrades

May appear for multiple characters when the mechanic is genuinely compatible.

### Character-specific upgrades

Modify the character/archetype rather than a generic weapon stat.

### Weapon-specific upgrades

Require a compatible signature weapon or weapon tag.

The offer system must eventually be able to filter incompatible cards without steering the player toward a predefined build.

**Compatibility filtering is allowed; build steering is not.**

Example:

- A Shotgun-only pellet/spread card must not appear for the Rivet Gun archetype.
- A Rivet-specific card must not appear for the Shotgun Character.
- A compatible general movement/defense card may appear for both.

---

## 6. Anti-regression requirements

Future work must preserve all of the following:

- Runner/Hunter keeps the Rivet Gun unless an explicit new design decision changes the policy.
- Adding the Shotgun Character must not mutate Runner definition/state/assets.
- Shotgun-native mechanics must not modify the Rivet Gun base definition.
- Character selection must resolve the correct signature weapon deterministically.
- Upgrade-offer compatibility must use canonical tags/scopes/availability rather than scene-specific exclusions.
- No character or weapon is implemented through a new `*-fix`, `*-hotfix`, `*-v2` or runtime monkey-patch ownership layer.

---

## 7. Current checklist

- [x] Approve one-character → one-signature-weapon combat-archetype model. — **Status:** ✅ DESIGN APPROVED
- [x] Keep Runner/Hunter tied to Rivet Gun. — **Status:** ✅ CURRENT BASELINE
- [x] Reserve Shotgun Character as the second planned archetype. — **Status:** ✅ DESIGN APPROVED
- [x] Defer Shotgun Character implementation until a later character phase. — **Status:** ⏸️ IMPLEMENTATION DEFERRED
- [x] Leave all characters after Shotgun uncommitted/TBD. — **Status:** ✅ DESIGN APPROVED
- [ ] Implement/test scope-aware weapon-specific card offers when required by active gameplay work. — **Status:** ⚪ NOT STARTED
- [ ] Implement Shotgun Character. — **Status:** ⏸️ DEFERRED
- [ ] Finalize Shotgun balance and card pool. — **Status:** ⏸️ DEFERRED

---

## 8. Documentation integrity

This is a protected companion policy to `UPGRADE_SYSTEM_2_ROADMAP.md`.

Future roadmap edits must not silently reverse this character/signature-weapon decision or delete the reserved Shotgun archetype.

Removing or materially changing this policy requires explicit user approval and the same `ROADMAP-REMOVAL:` discipline used by the Upgrade System 2.0 roadmap integrity guard.
