import { expect, test } from '@playwright/test';

const TARGET_VIEWPORT = { width: 844, height: 390 };
const TEST_URL = '/?debug=1&autotest=1';
const CARD_GROUPS = [
  ['heavy-rivets', 'overclock', 'long-barrel'],
  ['piercing-rivets', 'ricochet', 'shrapnel-impact'],
  ['critical-rivet', 'twin-riveter', 'explosive-rivet'],
  ['triple-riveter', 'fleet-feet', 'scrap-magnet'],
  ['armor-plate', 'field-repair', 'impact-shield'],
  ['call-rig', 'heavy-rivets', 'overclock']
] as const;

test.use({ viewport: TARGET_VIEWPORT });
test.setTimeout(480_000);

async function waitForGame(page: any) {
  await page.goto(TEST_URL);
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 30_000 }
  ).toBe(true);
}

async function renderAndMeasureGroup(page: any, ids: readonly string[], level: number) {
  await waitForGame(page);
  return page.evaluate(async ({ ids, level }: { ids: string[]; level: number }) => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.level = Math.max(2, Number(scene.level || 1));
    scene.heroHp = Math.min(Number(scene.heroHp || 1), Number(scene.heroMaxHp || 1) * .6);
    scene.heroShieldCharges = 0;
    scene.rigSummoned = false;

    const runtimeImport = (specifier: string) => import(specifier);
    const catalogApi = await runtimeImport('/src/upgrades/upgrade-catalog.js?v=14');
    const definitions = catalogApi.listUpgradeDefinitions();
    const desired = new Set(ids);
    for (const definition of definitions) {
      if (desired.has(definition.id)) {
        scene.upgradeLevels[definition.id] = 0;
      } else if (definition.id === 'triple-riveter' && desired.has('twin-riveter')) {
        scene.upgradeLevels[definition.id] = 0;
      } else {
        scene.upgradeLevels[definition.id] = definition.maxLevel;
      }
    }
    if (desired.has('triple-riveter')) scene.upgradeLevels['twin-riveter'] = 2;

    scene.openUpgradeCards();

    const waitForCards = async () => {
      for (let attempt = 0; attempt < 240; attempt += 1) {
        const current = game.scene.getScene('UpgradeSceneV4');
        if (current?.sys?.isActive?.() && Array.isArray(current.cards) && current.cards.length === 3) return current;
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
      }
      const current = game.scene.getScene('UpgradeSceneV4');
      throw new Error(`timed out waiting for canonical UpgradeSceneV4 render for ${ids.join(',')}; active=${Boolean(current?.sys?.isActive?.())}; cards=${current?.cards?.length ?? 'n/a'}; choices=${(current?.choices || []).map((choice: any) => choice.id).join(',')}`);
    };
    const upgradeScene = await waitForCards();
    const choices = upgradeScene.choices || [];
    const actualIds = choices.map((choice: any) => String(choice.id));

    const canvasRect = game.canvas.getBoundingClientRect();
    const logicalWidth = Number(upgradeScene.scale?.width || game.config.width || canvasRect.width);
    const logicalHeight = Number(upgradeScene.scale?.height || game.config.height || canvasRect.height);
    const sx = canvasRect.width / logicalWidth;
    const sy = canvasRect.height / logicalHeight;
    const cards = upgradeScene.cards.map((card: any, index: number) => {
      const choice = choices[index];
      const scale = Number(card.g.scaleX || 1);
      const bgWidth = Number(card.bg.width || card.bg.displayWidth || 0);
      const bgHeight = Number(card.bg.height || card.bg.displayHeight || 0);
      const left = card.g.x - bgWidth * scale / 2;
      const right = card.g.x + bgWidth * scale / 2;
      const top = card.g.y - bgHeight * scale / 2;
      const bottom = card.g.y + bgHeight * scale / 2;
      const textChildren = card.g.list
        .filter((child: any) => child?.type === 'Text' && Number.isFinite(Number(child.y)))
        .filter((child: any) => Number(child.y) < Number(card.previewBackground.y))
        .sort((a: any, b: any) => Number(b.y) - Number(a.y));
      const description = textChildren[0] || null;
      const hit = card.g.list.find((child: any) => child?.type === 'Zone');
      const previewTop = card.g.y + (card.previewBackground.y - card.previewBackground.height / 2) * scale;
      const previewBottom = card.g.y + (card.previewBackground.y + card.previewBackground.height / 2) * scale;
      const descriptionBottom = description ? card.g.y + (description.y + description.displayHeight) * scale : null;
      const footerTop = card.g.y + (card.footer.y - card.footer.displayHeight / 2) * scale;
      return {
        id: choice.id,
        scale,
        screenLeft: canvasRect.left + left * sx,
        screenRight: canvasRect.left + right * sx,
        screenTop: canvasRect.top + top * sy,
        screenBottom: canvasRect.top + bottom * sy,
        hitWidth: Number(hit?.width || 0),
        hitHeight: Number(hit?.height || 0),
        previewTop,
        previewBottom,
        previewWidth: Number(card.previewBackground.width || 0) * scale,
        previewHeight: Number(card.previewBackground.height || 0) * scale,
        previewTextWidth: Number(card.previewText.displayWidth || 0) * scale,
        previewTextHeight: Number(card.previewText.displayHeight || 0) * scale,
        previewText: String(card.previewText.text || ''),
        descriptionBottom,
        descriptionHeight: Number(description?.displayHeight || 0) * scale,
        footerTop,
        footerText: String(card.footer.text || '')
      };
    });
    const gaps = cards.slice(0, -1).map((card: any, index: number) => cards[index + 1].screenLeft - card.screenRight);
    const fullscreenDuringUpgrade = {
      upgradeClass: document.body.classList.contains('wm-upgrade-active'),
      display: getComputedStyle(document.getElementById('fs-btn')!).display,
    };
    scene.closeUpgradeCards();
    const upgradeClassAfterClose = document.body.classList.contains('wm-upgrade-active');
    return {
      actualIds,
      cards,
      gaps,
      viewport: { width: innerWidth, height: innerHeight },
      presentationVersion: scene.__upgradeCardPresentationVersion,
      previewVersion: scene.__upgradeCardPreviewVersion,
      uniformCards: scene.__finalUniformUpgradeCards,
      fullscreenDuringUpgrade,
      upgradeClassAfterClose,
      level
    };
  }, { ids: [...ids], level });
}

test('three-card selection stays readable and non-overlapping on target mobile landscape', async ({ page }) => {
  const covered = new Set<string>();
  for (let index = 0; index < CARD_GROUPS.length; index += 1) {
    const expectedIds = CARD_GROUPS[index];
    const snapshot = await renderAndMeasureGroup(page, expectedIds, index + 1);
    snapshot.actualIds.forEach((id: string) => covered.add(id));

    expect(new Set(snapshot.actualIds), `group ${index + 1}: canonical pool`).toEqual(new Set(expectedIds));
    expect(snapshot.viewport).toEqual(TARGET_VIEWPORT);
    expect(snapshot.presentationVersion).toBe('u5-before-after-v3');
    expect(snapshot.previewVersion).toBe('u5-before-after-v1');
    expect(snapshot.uniformCards).toBe(true);
    expect(snapshot.fullscreenDuringUpgrade.upgradeClass).toBe(true);
    expect(snapshot.fullscreenDuringUpgrade.display).toBe('none');
    expect(snapshot.upgradeClassAfterClose).toBe(false);
    expect(snapshot.cards).toHaveLength(3);
    expect(Math.min(...snapshot.gaps)).toBeGreaterThanOrEqual(4);
    for (const card of snapshot.cards) {
      expect(card.scale, `${card.id}: uniform mobile scale`).toBe(1);
      expect(card.screenLeft, `${card.id}: screen left`).toBeGreaterThanOrEqual(8);
      expect(card.screenRight, `${card.id}: screen right`).toBeLessThanOrEqual(TARGET_VIEWPORT.width - 8);
      expect(card.screenTop, `${card.id}: screen top`).toBeGreaterThanOrEqual(82);
      expect(card.screenBottom, `${card.id}: screen bottom`).toBeLessThanOrEqual(TARGET_VIEWPORT.height - 8);
      expect(card.hitWidth, `${card.id}: hit width`).toBeGreaterThanOrEqual(220);
      expect(card.hitHeight, `${card.id}: hit height`).toBeGreaterThanOrEqual(260);
      expect(card.previewText, `${card.id}: preview arrow`).toContain('→');
      expect(card.previewTextWidth, `${card.id}: preview width`).toBeLessThanOrEqual(card.previewWidth - 8);
      expect(card.previewTextHeight, `${card.id}: preview height`).toBeLessThanOrEqual(card.previewHeight - 4);
      expect(card.descriptionHeight, `${card.id}: description block`).toBeGreaterThan(0);
      expect(card.descriptionHeight, `${card.id}: description block`).toBeLessThanOrEqual(34);
      expect(card.descriptionBottom, `${card.id}: description→preview gap`).not.toBeNull();
      expect(card.descriptionBottom as number, `${card.id}: description→preview gap`).toBeLessThanOrEqual(card.previewTop - 2);
      expect(card.footerTop, `${card.id}: preview→footer gap`).toBeGreaterThanOrEqual(card.previewBottom + 4);
      expect(card.footerText, `${card.id}: level`).toContain('LV');
    }
  }

  expect(covered.size).toBe(16);
});
