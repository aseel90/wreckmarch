import { expect, test } from '@playwright/test';

test('Rust Hound has a readable telegraph and smooth bounded pounce in the live game', async ({ page }) => {
  await page.goto('/?debug=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const setup = await page.evaluate(() => {
    const w = window as typeof window & { __WM_GAME__?: any; __WM_E2E_HOUND_NAME__?: string };
    const scene = w.__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    if (!scene?.spawnSystem || !scene?.hero || !scene?.enemies) return { ok: false };

    if (scene.spawnEvent) scene.spawnEvent.paused = true;
    scene.fireDelay = 999999;
    if (scene.primaryWeapon) scene.primaryWeapon.fireDelay = 999999;
    scene.lastShot = Number.MAX_SAFE_INTEGER;
    scene.bullets?.clear?.(true, true);
    scene.enemies?.clear?.(true, true);
    scene.heroHp = Math.max(9999, Number(scene.heroHp) || 0);
    scene.lastHeroHit = -999999;
    scene.hero.setPosition?.(320, 480);
    scene.hero.setVelocity?.(0, 0);

    const hound = scene.spawnSystem.spawn('rust-hound', { elite: false });
    if (!hound) return { ok: false };
    hound.setPosition?.(105, 480);
    hound.hp = 999999;
    hound.maxHp = 999999;
    hound.__houndMotion = null;
    w.__WM_E2E_HOUND_NAME__ = hound.name;

    return {
      ok: true,
      visual: hound.__rustHoundVisual === true,
      behavior: hound.behaviorKey === 'hound-pounce',
      threat: hound.threatValue === 2
    };
  });

  expect(setup).toMatchObject({ ok: true, visual: true, behavior: true, threat: true });

  await expect.poll(
    () => page.evaluate(() => {
      const w = window as typeof window & { __WM_GAME__?: any; __WM_E2E_HOUND_NAME__?: string };
      const scene = w.__WM_GAME__?.scene?.getScene?.('Wreckmarch');
      const hound = scene?.enemies?.getChildren?.().find((enemy: any) => enemy?.name === w.__WM_E2E_HOUND_NAME__);
      const state = hound?.__houndMotion;
      return Boolean(
        hound?.active &&
        Number(hound.__houndTelegraphCount) >= 1 &&
        Number(hound.__houndPounceCount) >= 1 &&
        Number(hound.__houndLastPounceSpeed) >= 330 &&
        Number(hound.__houndLastPounceSpeed) <= 370 &&
        Number.isFinite(state?.vx) &&
        Number.isFinite(state?.vy) &&
        Number(state?.maxObservedSpeed) >= 330 &&
        Number(state?.maxObservedSpeed) <= 380
      );
    }),
    { timeout: 8_000 }
  ).toBe(true);

  const result = await page.evaluate(() => {
    const w = window as typeof window & { __WM_GAME__?: any; __WM_E2E_HOUND_NAME__?: string };
    const scene = w.__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    const hound = scene?.enemies?.getChildren?.().find((enemy: any) => enemy?.name === w.__WM_E2E_HOUND_NAME__);
    return {
      active: Boolean(hound?.active),
      phase: hound?.__houndPhase,
      pounces: Number(hound?.__houndPounceCount) || 0,
      telegraphs: Number(hound?.__houndTelegraphCount) || 0,
      lastPounceSpeed: Number(hound?.__houndLastPounceSpeed) || 0,
      maxObservedSpeed: Math.round(Number(hound?.__houndMotion?.maxObservedSpeed) || 0)
    };
  });

  expect(result.active).toBe(true);
  expect(result.telegraphs).toBeGreaterThanOrEqual(1);
  expect(result.pounces).toBeGreaterThanOrEqual(1);
  expect(result.lastPounceSpeed).toBeGreaterThanOrEqual(330);
  expect(result.lastPounceSpeed).toBeLessThanOrEqual(370);
  expect(result.maxObservedSpeed).toBeGreaterThanOrEqual(330);
  expect(result.maxObservedSpeed).toBeLessThanOrEqual(380);
});