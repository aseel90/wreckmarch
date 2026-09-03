import { describe, expect, it } from 'vitest';
import { applySelectedCharacterToGame } from '../../src/characters/selected-character-runtime.js';

describe('selected character runtime binding', () => {
  it('binds the canonical Runner id before character runtime installation', async () => {
    const scene: any = {};
    const game: any = { scene: { getScene: () => scene } };
    await expect(applySelectedCharacterToGame(game, 'runner', 50)).resolves.toMatchObject({ id: 'runner' });
    expect(scene.characterId).toBe('runner');
  });

  it('rejects an unowned production-ready character before touching the gameplay scene', async () => {
    const scene: any = {};
    const game: any = { scene: { getScene: () => scene } };
    await expect(applySelectedCharacterToGame(game, 'runner', 50, { ownedCharacterIds: [] }))
      .rejects.toThrow('Character is not selectable: runner (not-owned)');
    expect(scene.characterId).toBeUndefined();
  });

  it('rejects locked Shotgun before touching the gameplay scene even when ownership is mocked', async () => {
    const scene: any = {};
    const game: any = { scene: { getScene: () => scene } };
    await expect(applySelectedCharacterToGame(game, 'shotgun', 50, { ownedCharacterIds: ['shotgun'] }))
      .rejects.toThrow('Character is not selectable: shotgun (production-gate)');
    expect(scene.characterId).toBeUndefined();
  });
});
