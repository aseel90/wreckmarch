import { expect, test } from '@playwright/test';

test('Rust Hound uses production animated artwork and still pounces', async ({ page }) => {
  await page.goto('/?autotest=1&debug=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const initial = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game?.scene?.getScene?.('Wreckmarch');
    if (!scene) return null;

    scene.spawnEvent && (scene.spawnEvent.paused = true);
    scene.fireDelay = 999999;
    if (scene.primaryWeapon) scene.primaryWeapon.fireDelay = 999999;
    scene.lastShot = Number.MAX_SAFE_INTEGER;
    scene.bullets?.clear?.(true, true);
    scene.enemies?.clear?.(true, true);

    scene.hero?.setPosition?.(520, 480);
    scene.hero?.setVelocity?.(0, 0);
    const hound = scene.spawnSystem?.spawn?.('rust-hound', { elite: false });
    hound?.setPosition?.(330, 480);
    if (hound) {
      hound.hp = 999999;
      hound.maxHp = 999999;
      hound.behaviorConfig = {
        ...hound.behaviorConfig,
        warmupMs: 80,
        activeMs: 100,
        recoverMs: 120,
        cooldownMinMs: 160,
        cooldownMaxMs: 160
      };
    }

    return {
      spawned: !!hound,
      enemyId: hound?.enemyId,
      behaviorKey: hound?.behaviorKey,
      threatValue: hound?.threatValue,
      texture: hound?.texture?.key,
      visual: hound?.__rustHoundVisual,
      bakedFrames: hound?.__rustHoundBakedFrames,
      visualVersion: hound?.__rustHoundVisualVersion,
      anis: {
        idle: scene.anims.exists('rust-hound-idle'),
        run: scene.anims.exists('rust-hound-run'),
        pounce: scene.anims.exists('rust-hound-pounce'),
        recover: scene.anims.exists('rust-hound-recover')
      }
    };
  });

  expect(initial).toMatchObject({
    spawned: true,
    enemyId: 'rust-hound',
    behaviorKey: 'hound-pounce',
    threatValue: 3,
    visual: true,
    bakedFrames: true,
    visualVersion: 'production-v3-clean',
    anis: { idle: true, run: true, pounce: true, recover: true }
  });
  expect(String(initial?.texture)).toMatch(/^rust-hound-(?:idle|run|pounce|recover)-[01]$/);

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game?.scene?.getScene?.('Wreckmarch');
      const hound = scene?.enemies?.getChildren?.().find((enemy: any) => enemy?.enemyId === 'rust-hound');
      if (!scene || !hound?.active || !scene.hero?.active) return false;
      const state = hound.__houndState;
      if (!state) return false;
      scene.hero.setPosition?.(520, 480);
      scene.hero.setVelocity?.(0, 0);
      hound.setPosition?.(330, 480);
      hound.setVelocity?.(0, 0);
      state.phase = 'stalk';
      state.nextPounceAt = Number(scene.time?.now) || 0;
      return true;
    }),
    { timeout: 4_000 }
  ).toBe(true);

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game?.scene?.getScene?.('Wreckmarch');
      const hound = scene?.enemies?.getChildren?.().find((enemy: any) => enemy?.enemyId === 'rust-hound');
      const state = hound?.__houndState;
      const phase = state?.phase || '';
      return {
        phase,
        pounces: Number(hound?.__houndPounceCount) || 0,
        anim: hound?.anims?.currentAnim?.key || null,
        active: !!hound?.active
      };
    }),
    { timeout: 8_000 }
  ).toMatchObject({
    active: true,
    pounces: expect.any(Number)
  });

  const final = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game?.scene?.getScene?.('Wreckmarch');
    const hound = scene?.enemies?.getChildren?.().find((enemy: any) => enemy?.enemyId === 'rust-hound');
    return {
      active: !!hound?.active,
      pounces: Number(hound?.__houndPounceCount) || 0,
      phase: hound?.__houndPhase || hound?.__houndState?.phase || null,
      anim: hound?.anims?.currentAnim?.key || null
    };
  });

  expect(final.active).toBe(true);
  expect(final.pounces).toBeGreaterThanOrEqual(1);
  expect(['warmup', 'pounce', 'recover', 'stalk']).toContain(final.phase);
  expect(String(final.anim)).toMatch(/^rust-hound-(?:run|pounce|recover|idle)$/);
});