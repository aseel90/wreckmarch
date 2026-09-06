import { describe, expect, it } from 'vitest';
import { applySelectedCharacterToGame } from '../../src/characters/selected-character-runtime.js';

describe('selected character runtime binding', () => {
  it('binds the canonical Runner id before character runtime installation', async () => {
    const scene: any = {};
    const game: any = { scene: { getScene: () => scene } };
    await expect(applySelectedCharacterToGame(game, 'runner', 50)).resolves.toMatchObject({ id: 'runner' });
    expect(scene.characterId).toBe('runner');
    expect(scene.characterDefinition?.id).toBe('runner');
  });

  it('rejects an unowned production-ready character before touching the gameplay scene', async () => {
    const scene: any = {};
    const game: any = { scene: { getScene: () => scene } };
    await expect(applySelectedCharacterToGame(game, 'runner', 50, { ownedCharacterIds: [] }))
      .rejects.toThrow('Character is not selectable: runner (not-owned)');
    expect(scene.characterId).toBeUndefined();
  });

  it('binds the officially activated Wrecker before character runtime installation', async () => {
    const scene: any = {};
    const game: any = { scene: { getScene: () => scene } };
    await expect(applySelectedCharacterToGame(game, 'shotgun', 50)).resolves.toMatchObject({ id: 'shotgun', displayName: 'Wrecker' });
    expect(scene.characterId).toBe('shotgun');
    expect(scene.characterDefinition?.id).toBe('shotgun');
  });
});
