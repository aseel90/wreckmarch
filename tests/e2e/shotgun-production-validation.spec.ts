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
      heroHp: scene?.heroHp ?? null,
      heroSpeed: scene?.heroSpeed || null,
      telemetryCharacter: scene?.runTelemetry?.getReport?.()?.character || null,
      c5Ok: scene?.__characterPresentationC5?.ok === true,
      d1Ok: scene?.__characterPresentationD1?.ok === true,
      twoHandHold: scene?.__shotgunTwoHandHold || null,
      heroRotation: scene?.hero?.rotation ?? null,
      weaponRotation: scene?.weaponV3Gun?.rotation ?? null,
      handOverlayRotation: scene?.__shotgunHandOverlay?.rotation ?? null,
      heroDepth: scene?.hero?.depth ?? null,
      weaponDepth: scene?.weaponV3Gun?.depth ?? null,
      handOverlayDepth: scene?.__shotgunHandOverlay?.depth ?? null,
      heroTexture: scene?.hero?.texture?.key || null,
      handOverlayTexture: scene?.__shotgunHandOverlay?.texture?.key || null,
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
    heroHp: 110,
    heroSpeed: 255,
    telemetryCharacter: { id: 'shotgun', displayName: 'Wrecker' },
    c5Ok: true,
    d1Ok: true,
    twoHandHold: {
      mode: 'two-hand-fixed',
      layerMode: 'body-weapon-front-hands',
      locked: true,
      runtimeRotation: false,
      runtimeBodyRotation: false
    },
    heroRotation: 0,
    weaponRotation: 0,
    handOverlayRotation: 0,
    registryAvailability: 'locked',
    registrySelectable: false
  });
  expect(Number(state.heroDepth)).toBeLessThan(Number(state.weaponDepth));
  expect(Number(state.weaponDepth)).toBeLessThan(Number(state.handOverlayDepth));
  expect(state.handOverlayTexture).toMatch(/^shotgun-hands-(idle|run)-\d$/);

  const wrappedHolds = await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    const inputs = [-Math.PI * 6, -Math.PI, -0.75, 0, 0.75, Math.PI, Math.PI * 6];
    return inputs.map(requested => {
      scene.weaponAim = requested;
      scene.updateWeaponPose();
      return {
        requested,
        heroRotation: scene.hero?.rotation,
        weaponRotation: scene.weaponV3Gun?.rotation,
        handOverlayRotation: scene.__shotgunHandOverlay?.rotation,
        weaponFlipX: scene.weaponV3Gun?.flipX,
        weaponOriginX: scene.weaponV3Gun?.originX,
        weaponOriginY: scene.weaponV3Gun?.originY,
        heroFlipX: scene.hero?.flipX,
        handOverlayFlipX: scene.__shotgunHandOverlay?.flipX,
        heroDepth: scene.hero?.depth,
        weaponDepth: scene.weaponV3Gun?.depth,
        handOverlayDepth: scene.__shotgunHandOverlay?.depth,
        hold: { ...(scene.__shotgunTwoHandHold || {}) },
        gripX: scene.__shotgunGrip?.x,
        supportX: scene.__shotgunSupportHand?.x,
        muzzleX: scene.__shotgunMuzzle?.x
      };
    });
  });

  for (const hold of wrappedHolds) {
    expect(hold.heroRotation).toBe(0);
    expect(hold.weaponRotation).toBe(0);
    expect(hold.handOverlayRotation).toBe(0);
    expect(hold.heroDepth).toBeLessThan(hold.weaponDepth);
    expect(hold.weaponDepth).toBeLessThan(hold.handOverlayDepth);
    expect(hold.weaponFlipX).toBe(hold.heroFlipX);
    expect(hold.handOverlayFlipX).toBe(hold.heroFlipX);
    expect(hold.weaponOriginY).toBeCloseTo(22 / 40, 8);
    expect(hold.weaponOriginX).toBeCloseTo(hold.weaponFlipX ? 1 - (18 / 96) : 18 / 96, 8);
    expect(hold.hold).toMatchObject({
      mode: 'two-hand-fixed',
      layerMode: 'body-weapon-front-hands',
      locked: true,
      runtimeRotation: false,
      runtimeBodyRotation: false
    });
    if (hold.weaponFlipX) {
      expect(hold.supportX).toBeLessThan(hold.gripX);
      expect(hold.muzzleX).toBeLessThan(hold.gripX);
    } else {
      expect(hold.supportX).toBeGreaterThan(hold.gripX);
      expect(hold.muzzleX).toBeGreaterThan(hold.gripX);
    }
  }

  const frameLayers = await page.evaluate(async () => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    const presentationPath = '/src/characters/shotgun-runtime-presentation.js?v=7';
    const { SHOTGUN_RUNTIME_PRESENTATION } = await import(presentationPath);
    const frames = [...SHOTGUN_RUNTIME_PRESENTATION.body.idle, ...SHOTGUN_RUNTIME_PRESENTATION.body.run];
    const results = frames.map((frame: any) => {
      scene.hero.setTexture(frame.key);
      scene.updateWeaponPose();
      return {
        bodyKey: scene.hero.texture?.key,
        expectedOverlayKey: frame.handOverlayKey,
        overlayKey: scene.__shotgunHandOverlay?.texture?.key,
        heroDepth: scene.hero?.depth,
        weaponDepth: scene.weaponV3Gun?.depth,
        overlayDepth: scene.__shotgunHandOverlay?.depth
      };
    });
    scene.hero.setTexture(SHOTGUN_RUNTIME_PRESENTATION.body.idle[0].key);
    scene.updateWeaponPose();
    return results;
  });

  expect(frameLayers).toHaveLength(6);
  for (const frame of frameLayers) {
    expect(frame.overlayKey).toBe(frame.expectedOverlayKey);
    expect(frame.heroDepth).toBeLessThan(frame.weaponDepth);
    expect(frame.weaponDepth).toBeLessThan(frame.overlayDepth);
  }
});
