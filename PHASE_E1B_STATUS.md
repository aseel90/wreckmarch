# Phase E.1b — Road persistence + debug capture

Scope is intentionally narrow.

- Asphalt/ground render above the original prototype world Graphics and below gameplay props.
- Legacy prototype Graphics and tiny depth-0 debris are suppressed.
- ROAD WATCH records road visibility at 0 / 0.5 / 1 / 2 / 3 / 5 / 8 / 12 seconds.
- `?debug=1` keeps recent logs in localStorage and exposes a `COPY DEBUG` button.
- The 12-second autotest fails if road segments disappear, old covered layers return, or the spawn road is no longer near the player.

No player, weapon, card, enemy, or vehicle behavior is changed in this patch.
