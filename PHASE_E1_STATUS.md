# Phase E.1 — Road Visibility

Scope: terrain only. Player, weapons, cards and vehicles are intentionally untouched in this batch.

## Goal
- Remove legacy ground / road layers that visually cover newer roads.
- Rebuild one clean terrain renderer.
- Make a clearly visible asphalt road pass through the spawn area.
- Keep roads above ground and below gameplay entities.

## Validation required before merge
- Chromium smoke check passes.
- Road segment exists within 220 world units of spawn center.
- No legacy terrain layer remains above the E1 asphalt.
- E1 ground depth is below E1 road depth.
