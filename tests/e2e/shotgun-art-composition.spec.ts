import { test, expect } from '@playwright/test';
import { SHOTGUN_PRODUCTION_ART } from '../../src/characters/shotgun-production-art.js';
import { SHOTGUN_AIM_ALIGNMENT, getShotgunWeaponPlacement } from '../../src/characters/shotgun-aim-alignment.js';

const frames = [...SHOTGUN_PRODUCTION_ART.body.idle];
const requestedAimDegrees = [-540, -360, -180, -20, 0, 20, 180, 360, 540] as const;

const BODY_STAGE_X = 72;
const BODY_STAGE_Y = 16;

function facingForDegrees(angleDeg: number): 'right' | 'left' {
  const radians = angleDeg * Math.PI / 180;
  return Math.cos(radians) < 0 ? 'left' : 'right';
}

function fixedMuzzle(facing: 'right' | 'left') {
  const base = SHOTGUN_AIM_ALIGNMENT.muzzleFromGrip;
  return {
    x: facing === 'left' ? -base.x : base.x,
    y: base.y
  };
}

test.describe('WS14-C Shotgun fixed two-hand composition gate', () => {
  test('renders every authored body source with the gun behind both baked hands and no runtime rotation', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 844, height: 390 });

    const cases = frames.flatMap((frame: string) => requestedAimDegrees.map((requestedAim) => {
      const facing = facingForDegrees(requestedAim);
      const placement = getShotgunWeaponPlacement(facing);
      return {
        frame,
        facing,
        requestedAim,
        grip: placement.grip,
        support: placement.support,
        weaponSupport: placement.weaponSupport,
        supportError: placement.supportError,
        weaponTopLeft: placement.weaponTopLeft,
        flipX: placement.flipX,
        rotationRadians: placement.rotationRadians
      };
    }));

    await page.setContent('<main id="shotgun-composition-gate"></main>');
    const results = await page.evaluate(async ({ cases, bodyX, bodyY, weapon }) => {
      const root = document.querySelector('#shotgun-composition-gate') as HTMLElement;
      root.style.display = 'grid';
      root.style.gridTemplateColumns = 'repeat(5, 240px)';
      root.style.gap = '8px';

      const waitForImage = (img: HTMLImageElement) => new Promise<void>((resolve, reject) => {
        if (img.complete && img.naturalWidth > 0) return resolve();
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => reject(new Error(`failed to load ${img.src}`)), { once: true });
      });

      const measurements = [];
      for (const item of cases) {
        const stage = document.createElement('section');
        stage.dataset.frame = item.frame;
        stage.dataset.facing = item.facing;
        stage.dataset.requestedAim = String(item.requestedAim);
        Object.assign(stage.style, {
          position: 'relative',
          width: '240px',
          height: '180px',
          overflow: 'visible'
        });

        const gun = document.createElement('img');
        gun.src = `/${weapon.path}`;
        gun.alt = '';
        const left = bodyX + item.weaponTopLeft.x;
        const top = bodyY + item.weaponTopLeft.y;
        Object.assign(gun.style, {
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          width: `${weapon.canvas.width}px`,
          height: `${weapon.canvas.height}px`,
          transformOrigin: `${weapon.grip.x}px ${weapon.grip.y}px`,
          transform: item.flipX ? 'scaleX(-1)' : 'none'
        });

        const body = document.createElement('img');
        body.src = `/${item.frame}`;
        body.alt = '';
        Object.assign(body.style, {
          position: 'absolute',
          left: `${bodyX}px`,
          top: `${bodyY}px`,
          width: '128px',
          height: '148px',
          transformOrigin: '64px 74px',
          transform: item.facing === 'left' ? 'scaleX(-1)' : 'none'
        });

        stage.append(gun, body);
        root.append(stage);
        await Promise.all([waitForImage(body), waitForImage(gun)]);

        const stageRect = stage.getBoundingClientRect();
        const bodyRect = body.getBoundingClientRect();
        const gunRect = gun.getBoundingClientRect();
        measurements.push({
          frame: item.frame,
          facing: item.facing,
          requestedAim: item.requestedAim,
          supportError: item.supportError,
          rotationRadians: item.rotationRadians,
          gunTransform: gun.style.transform,
          bodyNatural: { width: body.naturalWidth, height: body.naturalHeight },
          gunNatural: { width: gun.naturalWidth, height: gun.naturalHeight },
          bodyRect: { width: bodyRect.width, height: bodyRect.height },
          gunRect: { width: gunRect.width, height: gunRect.height },
          stageRect: { width: stageRect.width, height: stageRect.height }
        });
      }
      return measurements;
    }, { cases, bodyX: BODY_STAGE_X, bodyY: BODY_STAGE_Y, weapon: SHOTGUN_PRODUCTION_ART.weapon });

    expect(results).toHaveLength(frames.length * requestedAimDegrees.length);
    for (const result of results) {
      expect(result.bodyNatural).toEqual({ width: 128, height: 148 });
      expect(result.gunNatural).toEqual({ width: 96, height: 40 });
      expect(result.bodyRect.width).toBeCloseTo(128, 3);
      expect(result.bodyRect.height).toBeCloseTo(148, 3);
      expect(result.gunRect.width).toBeGreaterThan(90);
      expect(result.gunRect.height).toBeGreaterThan(35);
      expect(result.stageRect).toEqual({ width: 240, height: 180 });
      expect(result.rotationRadians).toBe(0);
      expect(result.supportError).toBeLessThan(SHOTGUN_AIM_ALIGNMENT.hold.supportTolerancePx);
      expect(result.gunTransform).not.toContain('rotate');
    }
  });

  test('keeps the muzzle outside the body center for wrapped aim inputs without spinning through the torso', () => {
    for (const requestedAim of requestedAimDegrees) {
      const facing = facingForDegrees(requestedAim);
      const placement = getShotgunWeaponPlacement(facing);
      const muzzleDelta = fixedMuzzle(facing);
      const muzzleX = placement.grip.x + muzzleDelta.x;
      if (facing === 'right') expect(muzzleX).toBeGreaterThan(SHOTGUN_PRODUCTION_ART.body.canvas.width / 2);
      else expect(muzzleX).toBeLessThan(SHOTGUN_PRODUCTION_ART.body.canvas.width / 2);
      expect(placement.rotationRadians).toBe(0);
      expect(placement.supportError).toBeLessThan(SHOTGUN_AIM_ALIGNMENT.hold.supportTolerancePx);
    }
  });

  test('remains art-only and does not activate Shotgun runtime', () => {
    expect(SHOTGUN_PRODUCTION_ART.activation.playableOnMain).toBe(false);
    expect(SHOTGUN_AIM_ALIGNMENT.activation.playableOnMain).toBe(false);
  });
});
