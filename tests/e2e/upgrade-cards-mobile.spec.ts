import { expect, test } from '@playwright/test';

const TARGET_VIEWPORT = { width: 844, height: 390 };
const TEST_URL = '/?debug=1&autotest=1';
test.use({ viewport: TARGET_VIEWPORT });
test.setTimeout(480_000);

async function waitForGame(page: any) {
  await page.goto(TEST_URL);
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);
}

async function getEligibleOfferIds(page: any) {
  return page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.heroHp = Math.min(Number(scene.heroHp || 1), Number(scene.heroMaxHp || 1) * .6);
    scene.heroShieldCharges = 0;
    scene.rigSummoned = false;
    scene.upgradeLevels['twin-riveter'] = Math.max(2, Number(scene.upgradeLevels['twin-riveter'] || 0));
    scene.upgradeMechanicalState = {
      ...(scene.upgradeMechanicalState || {}),
      'twin-riveter': {
        id: 'twin-riveter', effectId: 'TWIN_RIVETER', level: 2, rarity: 'COMMON',
        projectileCount: 2, volleyDamageMultiplier: 1.4, projectileDamageScale: .7
      }
    };
    scene.twinShots = 2;
    const runtimeImport = (specifier: string) => import(specifier);
    const poolApi = await runtimeImport('/src/upgrades/upgrade-offer-pool.js?v=1');
    const choices = poolApi.createActiveUpgradeOfferChoices(scene);
    return Array.from(new Set(choices.map((choice: any) => String(choice.id))));
  });
}

async function measureGroup(page: any, groupIds: string[], groupIndex: number) {
  return page.evaluate(async ({ ids, level }) => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.heroHp = Math.min(Number(scene.heroHp || 1), Number(scene.heroMaxHp || 1) * .6);
    scene.heroShieldCharges = 0;
    scene.rigSummoned = false;
    scene.upgradeLevels['twin-riveter'] = Math.max(2, Number(scene.upgradeLevels['twin-riveter'] || 0));
    scene.upgradeMechanicalState = {
      ...(scene.upgradeMechanicalState || {}),
      'twin-riveter': {
        id: 'twin-riveter', effectId: 'TWIN_RIVETER', level: 2, rarity: 'COMMON',
        projectileCount: 2, volleyDamageMultiplier: 1.4, projectileDamageScale: .7
      }
    };
    scene.twinShots = 2;

    const runtimeImport = (specifier: string) => import(specifier);
    const poolApi = await runtimeImport('/src/upgrades/upgrade-offer-pool.js?v=1');
    const rarityApi = await runtimeImport('/src/upgrades/upgrade-rarity.js?v=1');
    const rarity = rarityApi.getUpgradeRarityRule('COMMON');
    const byId = new Map(poolApi.createActiveUpgradeOfferChoices(scene).map((choice: any) => [String(choice.id), choice]));
    const choices = ids.map((id: string) => byId.get(id)).filter(Boolean).map((choice: any) => ({
      ...choice,
      rarity: 'COMMON',
      rarityLabel: rarity.label,
      rarityColor: rarity.color,
      rarityPowerMultiplier: rarity.powerMultiplier
    }));
    if (choices.length !== 3) throw new Error(`expected three eligible choices for ${ids.join(',')}, got ${choices.length}`);

    if (game.scene.isActive('UpgradeSceneV4')) scene.scene.stop('UpgradeSceneV4');
    scene.scene.launch('UpgradeSceneV4', { gameScene: scene, choices, level });
    scene.scene.bringToTop('UpgradeSceneV4');

    const waitFor = async (predicate: () => boolean, label: string, attempts = 120) => {
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        if (predicate()) return;
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
      }
      throw new Error(`timed out waiting for ${label}`);
    };
    await waitFor(() => {
      const current = game.scene.getScene('UpgradeSceneV4');
      return game.scene.isActive('UpgradeSceneV4') && Array.isArray(current?.cards) && current.cards.length === 3;
    }, `fresh UpgradeSceneV4 render for ${ids.join(',')}`);

    const upgradeScene = game.scene.getScene('UpgradeSceneV4');
    const measure = () => {
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
        const description = card.g.list.find((child: any) => child?.text === choice.desc);
        const hit = card.g.list.find((child: any) => child?.type === 'Zone');
        const previewTop = card.g.y + (card.previewBackground.y - card.previewBackground.height / 2) * scale;
        const previewBottom = card.g.y + (card.previewBackground.y + card.previewBackground.height / 2) * scale;
        const descriptionBottom = description ? card.g.y + (description.y + description.displayHeight) * scale : null;
        const footerTop = card.g.y + (card.footer.y - card.footer.displayHeight / 2) * scale;
        const footerBottom = card.g.y + (card.footer.y + card.footer.displayHeight / 2) * scale;
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
          footerBottom,
          footerText: String(card.footer.text || '')
        };
      });
      const gaps = cards.slice(0, -1).map((card: any, index: number) => cards[index + 1].screenLeft - card.screenRight);
      return { cards, gaps, selectedIndex: upgradeScene.selectedIndex };
    };

    const initial = measure();
    upgradeScene.selectedIndex = 1;
    upgradeScene.refresh();
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    const middleSelected = measure();
    scene.scene.stop('UpgradeSceneV4');
    return {
      ids,
      initial,
      middleSelected,
      presentationVersion: scene.__upgradeCardPresentationVersion,
      previewVersion: scene.__upgradeCardPreviewVersion,
      uniformCards: scene.__finalUniformUpgradeCards,
      viewport: { width: innerWidth, height: innerHeight }
    };
  }, { ids: groupIds, level: groupIndex + 1 });
}

test('three-card selection stays readable and non-overlapping on target mobile landscape', async ({ page }) => {
  await waitForGame(page);
  const eligibleOfferIds = await getEligibleOfferIds(page);
  expect(eligibleOfferIds).toHaveLength(16);

  const groups: string[][] = [];
  for (let start = 0; start < eligibleOfferIds.length; start += 3) {
    const group = eligibleOfferIds.slice(start, start + 3);
    const used = new Set(group);
    for (const id of eligibleOfferIds) {
      if (group.length >= 3) break;
      if (used.has(id)) continue;
      group.push(id);
      used.add(id);
    }
    expect(new Set(group).size).toBe(3);
    groups.push(group);
  }

  const covered = new Set<string>();
  for (let index = 0; index < groups.length; index += 1) {
    if (index > 0) await waitForGame(page);
    const snapshot = await measureGroup(page, groups[index], index);
    snapshot.ids.forEach((id: string) => covered.add(id));
    expect(snapshot.viewport).toEqual(TARGET_VIEWPORT);
    expect(snapshot.presentationVersion).toBe('u5-before-after-v3');
    expect(snapshot.previewVersion).toBe('u5-before-after-v1');
    expect(snapshot.uniformCards).toBe(true);
    for (const state of [snapshot.initial, snapshot.middleSelected]) {
      expect(state.cards).toHaveLength(3);
      expect(Math.min(...state.gaps)).toBeGreaterThanOrEqual(4);
      for (const card of state.cards) {
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
        expect(card.descriptionHeight, `${card.id}: description block`).toBeLessThanOrEqual(34);
        expect(card.descriptionBottom, `${card.id}: description→preview gap`).toBeLessThanOrEqual(card.previewTop - 2);
        expect(card.footerTop, `${card.id}: preview→footer gap`).toBeGreaterThanOrEqual(card.previewBottom + 4);
        expect(card.footerText, `${card.id}: level`).toContain('LV');
      }
    }
    expect(snapshot.initial.selectedIndex).toBe(0);
    expect(snapshot.middleSelected.selectedIndex).toBe(1);
  }

  expect([...eligibleOfferIds].every(id => covered.has(id))).toBe(true);
});
