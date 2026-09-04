import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('locked Shotgun can complete the production stack only through the explicit validation harness', async ({ page }) => {
  await page.goto('/?autotest=1&characterValidation=shotgun&debug=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 45_000 }
  ).toBe(true);

  const state = await page.evaluate(async () => {
    const game = (window as any).__WM_GAME__;
    const scene = game?.scene?.getScene?.('Wreckmarch');
    const registryPath = '/src/characters/character-registry.js?v=5';
    const registry = await import(registryPath);
    return {
      selected: (window as any).__WM_SELECTED_CHARACTER__ || null,
      shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
      validation: (window as any).__WM_CHARACTER_PRODUCTION_VALIDATION__ || null,
      sceneValidation: scene?.__characterProductionValidation || null,
      sceneCharacter: scene?.characterId || null,
      characterReady: scene?.__characterSystemReady === true,
      activeWeaponId: scene?.activeWeaponId || null,
      startingWeaponId: scene?.startingWeaponId || null,
      primaryWeaponId: scene?.primaryWeapon?.id || null,
      heroMaxHp: scene?.heroMaxHp || null,
      heroSpeed: scene?.heroSpeed || null,
      c5Ok: scene?.__characterPresentationC5?.ok === true,
      d1Ok: scene?.__characterPresentationD1?.ok === true,
      registryAvailability: registry.getCharacterEntry('shotgun').availability,
      registrySelectable: registry.isCharacterSelectable('shotgun')
    };
  });

  expect(state).toMatchObject({
    selected: 'shotgun',
    shellScreen: 'gameplay',
    validation: { characterId: 'shotgun', mode: 'production-validation' },
    sceneValidation: { characterId: 'shotgun', mode: 'production-validation' },
    sceneCharacter: 'shotgun',
    characterReady: true,
    activeWeaponId: 'shotgun',
    startingWeaponId: 'shotgun',
    primaryWeaponId: 'shotgun',
    heroMaxHp: 110,
    heroSpeed: 255,
    c5Ok: true,
    d1Ok: true,
    registryAvailability: 'locked',
    registrySelectable: false
  });
});
