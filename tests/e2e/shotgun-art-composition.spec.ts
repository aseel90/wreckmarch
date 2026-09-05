import { test, expect } from '@playwright/test';
import { SHOTGUN_PRODUCTION_ART } from '../../src/characters/shotgun-production-art.js';
import { SHOTGUN_AIM_ALIGNMENT, getShotgunWeaponPlacement } from '../../src/characters/shotgun-aim-alignment.js';
import { SHOTGUN_HAND_OVERLAY_MASKS } from '../../src/characters/shotgun-hand-overlay-bake.js';

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

test.describe('WS14-C Shotgun canonical three-layer composition gate', () => {
  test('renders body -> weapon -> baked front hands with no runtime crop or rotation', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 844, height: 390 });

    const cases = frames.flatMap((frame: string) => requestedAimDegrees.map((requestedAim) => {
      const facing = facingForDegrees(requestedAim);
      const placement = getShotgunWeaponPlacement(facing);
      return {
        frame,
        facing,
        requestedAim,
        supportError: placement.supportError,
        weaponTopLeft: placement.weaponTopLeft,
        flipX: placement.flipX,
        rotationRadians: placement.rotationRadians
      };
    }));

    await page.setContent('<main id="shotgun-composition-gate"></main>');
    const results = await page.evaluate(async ({ cases, bodyX, bodyY, weapon, masks }) => {
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
        Object.assign(stage.style, { position: 'relative', width: '240px', height: '180px', overflow: 'visible' });

        const body = document.createElement('img');
        body.dataset.layer = 'body';
        body.src = `/${item.frame}`;
        body.alt = '';
        Object.assign(body.style, {
          position: 'absolute', left: `${bodyX}px`, top: `${bodyY}px`, width: '128px', height: '148px',
          transformOrigin: '64px 74px', transform: item.facing === 'left' ? 'scaleX(-1)' : 'none'
        });

        const gun = document.createElement('img');
        gun.dataset.layer = 'weapon';
        gun.src = `/${weapon.path}`;
        gun.alt = '';
        const left = bodyX + item.weaponTopLeft.x;
        const top = bodyY + item.weaponTopLeft.y;
        Object.assign(gun.style, {
          position: 'absolute', left: `${left}px`, top: `${top}px`, width: `${weapon.canvas.width}px`, height: `${weapon.canvas.height}px`,
          transformOrigin: `${weapon.grip.x}px ${weapon.grip.y}px`, transform: item.flipX ? 'scaleX(-1)' : 'none'
        });

        const hands = document.createElement('canvas');
        hands.dataset.layer = 'hands';
        hands.width = 128;
        hands.height = 148;
        Object.assign(hands.style, {
          position: 'absolute', left: `${bodyX}px`, top: `${bodyY}px`, width: '128px', height: '148px',
          transformOrigin: '64px 74px', transform: item.facing === 'left' ? 'scaleX(-1)' : 'none'
        });

        stage.append(body, gun, hands);
        root.append(stage);
        await Promise.all([waitForImage(body), waitForImage(gun)]);

        const ctx = hands.getContext('2d')!;
        ctx.clearRect(0, 0, 128, 148);
        ctx.save();
        ctx.beginPath();
        for (const mask of masks) {
          const points = mask.points as number[][];
          ctx.moveTo(points[0][0], points[0][1]);
          for (let index = 1; index < points.length; index += 1) ctx.lineTo(points[index][0], points[index][1]);
          ctx.closePath();
        }
        ctx.clip();
        ctx.drawImage(body, 0, 0, 128, 148);
        ctx.restore();

        const alphaAt = (x: number, y: number) => ctx.getImageData(x, y, 1, 1).data[3];
        const stageRect = stage.getBoundingClientRect();
        const bodyRect = body.getBoundingClientRect();
        const gunRect = gun.getBoundingClientRect();
        const handsRect = hands.getBoundingClientRect();
        measurements.push({
          supportError: item.supportError,
          rotationRadians: item.rotationRadians,
          gunTransform: gun.style.transform,
          layerOrder: [...stage.children].map(child => (child as HTMLElement).dataset.layer),
          bodyNatural: { width: body.naturalWidth, height: body.naturalHeight },
          gunNatural: { width: gun.naturalWidth, height: gun.naturalHeight },
          bodyRect: { width: bodyRect.width, height: bodyRect.height },
          gunRect: { width: gunRect.width, height: gunRect.height },
          handsRect: { width: handsRect.width, height: handsRect.height },
          stageRect: { width: stageRect.width, height: stageRect.height },
          gripAlpha: alphaAt(77, 81),
          supportAlpha: alphaAt(100, 78),
          headAlpha: alphaAt(64, 36),
          legAlpha: alphaAt(64, 126)
        });
      }
      return measurements;
    }, {
      cases,
      bodyX: BODY_STAGE_X,
      bodyY: BODY_STAGE_Y,
      weapon: SHOTGUN_PRODUCTION_ART.weapon,
      masks: SHOTGUN_HAND_OVERLAY_MASKS
    });

    expect(results).toHaveLength(frames.length * requestedAimDegrees.length);
    for (const result of results) {
      expect(result.bodyNatural).toEqual({ width: 128, height: 148 });
      expect(result.gunNatural).toEqual({ width: 96, height: 40 });
      expect(result.bodyRect.width).toBeCloseTo(128, 3);
      expect(result.bodyRect.height).toBeCloseTo(148, 3);
      expect(result.gunRect.width).toBeGreaterThan(90);
      expect(result.gunRect.height).toBeGreaterThan(35);
      expect(result.handsRect).toEqual({ width: 128, height: 148 });
      expect(result.stageRect).toEqual({ width: 240, height: 180 });
      expect(result.layerOrder).toEqual(['body', 'weapon', 'hands']);
      expect(result.rotationRadians).toBe(0);
      expect(result.supportError).toBeLessThan(SHOTGUN_AIM_ALIGNMENT.hold.supportTolerancePx);
      expect(result.gunTransform).not.toContain('rotate');
      expect(result.gripAlpha).toBeGreaterThan(0);
      expect(result.supportAlpha).toBeGreaterThan(0);
      expect(result.headAlpha).toBe(0);
      expect(result.legAlpha).toBe(0);
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
