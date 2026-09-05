import { expect, test } from '@playwright/test';

test.describe('WS14-C inactive Shotgun real Phaser composition', () => {
  test('loads canonical assets and visibly renders every approved body frame plus mirrored aim', async ({ page }) => {
    await page.goto('./');
    await page.waitForFunction(() => Boolean((window as any).Phaser));

    const setup = await page.evaluate(async () => {
      const Phaser = (window as any).Phaser;
      const presentationModulePath = '/src/characters/shotgun-runtime-presentation.js';
      const compositionModulePath = '/src/characters/shotgun-runtime-composition.js';
      const locomotionArtModulePath = '/src/characters/shotgun-locomotion-art.js';
      const { queueShotgunRuntimeAssets, SHOTGUN_RUNTIME_PRESENTATION } = await import(presentationModulePath);
      const { loadShotgunLocomotionArt } = await import(locomotionArtModulePath);
      const { createShotgunRuntimeComposition, SHOTGUN_RUNTIME_COMPOSITION } = await import(compositionModulePath);

      const previous = document.getElementById('shotgun-phaser-gate');
      previous?.remove();

      const host = document.createElement('div');
      host.id = 'shotgun-phaser-gate';
      host.style.position = 'fixed';
      host.style.left = '0';
      host.style.top = '0';
      host.style.width = '360px';
      host.style.height = '280px';
      host.style.zIndex = '2147483647';
      host.style.background = '#111';
      document.body.appendChild(host);

      return await new Promise<any>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('Timed out creating Shotgun Phaser visual gate')), 10000);

        class ShotgunGateScene extends Phaser.Scene {
          preload() {
            queueShotgunRuntimeAssets(this);
          }

          async create() {
            try {
              await loadShotgunLocomotionArt(this);
              const composition = createShotgunRuntimeComposition(this, {
                x: 180,
                y: 150,
                motion: 'idle',
                frameIndex: 0,
                facing: 'right',
                aimDegrees: 0
              });

              const assets = [
                ...SHOTGUN_RUNTIME_PRESENTATION.body.idle,
                ...SHOTGUN_RUNTIME_PRESENTATION.body.run,
                SHOTGUN_RUNTIME_PRESENTATION.weapon
              ];
              const missing = assets.filter((asset: any) => !this.textures.exists(asset.key)).map((asset: any) => asset.key);
              const bodySource = this.textures.get(composition.body.texture.key).getSourceImage();
              const weaponSource = this.textures.get(composition.weapon.texture.key).getSourceImage();

              (window as any).__shotgunPhaserGate = {
                game,
                composition,
                setState: (motion: string, frameIndex: number, facing = 'right', aimDegrees = 0) => {
                  composition.setMotion(motion, frameIndex).setFacing(facing).setAimDegrees(aimDegrees);
                },
                advance: (deltaMs: number, motion: string, frameDurationMs: number) => {
                  composition.advanceLocomotion(deltaMs, { motion, frameDurationMs });
                },
                snapshot: () => ({
                  bodyKey: composition.body.texture.key,
                  bodyFlipX: composition.body.flipX,
                  bodyDisplayWidth: composition.body.displayWidth,
                  bodyDisplayHeight: composition.body.displayHeight,
                  weaponKey: composition.weapon.texture.key,
                  weaponFlipX: composition.weapon.flipX,
                  weaponAngle: composition.weapon.angle,
                  weaponX: composition.weapon.x,
                  weaponY: composition.weapon.y,
                  activation: SHOTGUN_RUNTIME_COMPOSITION.activation
                })
              };

              window.clearTimeout(timeout);
              resolve({
                missing,
                bodySource: { width: bodySource.width, height: bodySource.height },
                weaponSource: { width: weaponSource.width, height: weaponSource.height },
                idleCount: SHOTGUN_RUNTIME_PRESENTATION.body.idle.length,
                runCount: SHOTGUN_RUNTIME_PRESENTATION.body.run.length,
                activation: SHOTGUN_RUNTIME_COMPOSITION.activation
              });
            } catch (error: any) {
              window.clearTimeout(timeout);
              reject(new Error(error?.stack || error?.message || String(error)));
            }
          }
        }

        const game = new Phaser.Game({
          type: Phaser.CANVAS,
          width: 360,
          height: 280,
          parent: host,
          backgroundColor: '#111111',
          scene: ShotgunGateScene,
          banner: false,
          audio: { noAudio: true }
        });
      });
    });

    expect(setup.missing).toEqual([]);
    expect(setup.bodySource).toEqual({ width: 128, height: 148 });
    expect(setup.weaponSource).toEqual({ width: 96, height: 40 });
    expect(setup.idleCount).toBe(2);
    expect(setup.runCount).toBe(4);
    expect(setup.activation).toEqual({
      playableOnMain: false,
      previewRegistryEntryAllowed: true,
      playableRegistryDefinitionAllowed: true
    });

    const canvas = page.locator('#shotgun-phaser-gate canvas');
    await expect(canvas).toBeVisible();

    const states: Array<[string, number]> = [
      ['idle', 0],
      ['idle', 1],
      ['run', 0],
      ['run', 1],
      ['run', 2],
      ['run', 3]
    ];
    const frameImages: string[] = [];

    for (const [motion, frameIndex] of states) {
      await page.evaluate(([nextMotion, nextFrame]) => {
        (window as any).__shotgunPhaserGate.setState(nextMotion, nextFrame, 'right', 0);
      }, [motion, frameIndex] as const);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const snapshot = await page.evaluate(() => (window as any).__shotgunPhaserGate.snapshot());
      expect(snapshot.bodyKey).toBe(`shotgun-body-${motion}-${frameIndex}`);
      expect(snapshot.weaponKey).toBe('shotgun-weapon');
      expect(snapshot.bodyDisplayWidth).toBeCloseTo(128 * 0.78, 4);
      expect(snapshot.bodyDisplayHeight).toBeCloseTo(148 * 0.78, 4);
      frameImages.push((await canvas.screenshot()).toString('base64'));
    }

    expect(new Set(frameImages).size).toBe(6);

    const rightImage = frameImages[0];
    await page.evaluate(() => {
      (window as any).__shotgunPhaserGate.setState('idle', 0, 'left', 20);
    });
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const mirrored = await page.evaluate(() => (window as any).__shotgunPhaserGate.snapshot());
    expect(mirrored.bodyFlipX).toBe(true);
    expect(mirrored.weaponFlipX).toBe(true);
    expect(mirrored.weaponAngle).toBe(0);
    expect(mirrored.weaponX).toBeLessThan(0);
    expect((await canvas.screenshot()).toString('base64')).not.toBe(rightImage);

    await page.evaluate(() => {
      (window as any).__shotgunPhaserGate.setState('idle', 0, 'left', 720);
    });
    const wrappedAim = await page.evaluate(() => (window as any).__shotgunPhaserGate.snapshot());
    expect(wrappedAim.weaponFlipX).toBe(true);
    expect(wrappedAim.weaponAngle).toBe(0);

    await page.evaluate(() => {
      const gate = (window as any).__shotgunPhaserGate;
      gate.setState('idle', 0, 'left', 20);
      gate.advance(250, 'idle', 250);
    });
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const advancedIdle = await page.evaluate(() => (window as any).__shotgunPhaserGate.snapshot());
    expect(advancedIdle.bodyKey).toBe('shotgun-body-idle-1');
    expect(advancedIdle.bodyFlipX).toBe(true);
    expect(advancedIdle.weaponFlipX).toBe(true);
    expect(advancedIdle.weaponAngle).toBe(0);

    await page.evaluate(() => {
      const gate = (window as any).__shotgunPhaserGate;
      gate.setState('run', 0, 'right', -15);
      gate.advance(200, 'run', 100);
    });
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const advancedRun = await page.evaluate(() => (window as any).__shotgunPhaserGate.snapshot());
    expect(advancedRun.bodyKey).toBe('shotgun-body-run-2');
    expect(advancedRun.bodyFlipX).toBe(false);
    expect(advancedRun.weaponFlipX).toBe(false);
    expect(advancedRun.weaponAngle).toBe(0);
  });
});
