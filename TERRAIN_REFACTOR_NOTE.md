# Terrain refactor working note

This branch consolidates terrain/road ownership without changing visuals or gameplay.

Rules:
- Preserve E0 immediate startup terrain.
- Preserve E1 final asphalt persistence and diagnostics.
- Do not remove legacy terrain code until parity tests pass.
- Move shared route data and construction helpers behind one permanent world module.
