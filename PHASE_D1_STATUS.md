# WRECKMARCH Phase D.1

## Implemented
- Restored true Runner locomotion using the production run frames; legs now alternate while moving and idle returns automatically.
- Removed the hand-held weapon presentation. The Rivet weapon is now an integrated shoulder/cybernetic arm module, with no hand sprites.
- Reused the detailed exclusive PNG ability artwork from the production C3 atlas instead of the primitive C5 vector placeholders.
- Rebuilt the world road layer as five curved cracked-asphalt routes; the primary crossroads passes directly through the player spawn at world centre.
- Added a fixed world scale profile for wrecks: sedan 246, overturned 270, van 292, heavy truck 356 world units wide.
- Repositioned high-detail wreck assets using the fixed scale profile and shadows so vehicles read larger than the hero and enemies.
- Browser self-test validates animated legs, integrated arm, absence of hand overlays, premium card frames, visible road at spawn, and vehicle scale.

## Validation gate
The branch must pass the Chromium smoke test before merge to main.
