import { describe, expect, it } from 'vitest';
import { applySelectedCharacterToGame } from '../../src/characters/selected-character-runtime.js';

describe('selected character runtime binding', () => {
  it('binds the canonical Runner id before character runtime installation', async () => {
    const scene: any = {};
    const game: any = { scene: { getScene: () => scene } };
    await expect(applySelectedCharacterToGame(game, 'runner', 50)).resolves.toMatchObject({ id: 'runner' });
    expect(scene.characterId).toBe('runner');
  });

  it('rejects locked Shotgun before touching the gameplay scene', async () => {
    const scene: any = {};
    const game: any = { scene: { getScene: () => scene } };
    await expect(applySelectedCharacterToGame(game, 'shotgun', 50)).rejects.toThrow('Character is not selectable: shotgun');
    expect(scene.characterId).toBeUndefined();
  });
});
