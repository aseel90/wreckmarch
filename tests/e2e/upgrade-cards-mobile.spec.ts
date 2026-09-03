import { expect, test } from '@playwright/test';

const TARGET_VIEWPORT = { width: 844, height: 390 };
test.use({ viewport: TARGET_VIEWPORT });

test('three-card selection stays readable and non-overlapping on target mobile landscape', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const result = await page.evaluate(async ({ width, height }) => {
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
    const allChoices = poolApi.createActiveUpgradeOfferChoices(scene).map((choice: any) => ({
      ...choice,
      rarity: 'COMMON',
      rarityLabel: rarity.label,
      rarityColor: rarity.color,
      rarityPowerMultiplier: rarity.powerMultiplier
    }));

    const distinctChoices = Array.from(new Map(allChoices.map((choice: any) => [choice.id, choice])).values()) as any[];
    if (distinctChoices.length < 3) throw new Error(`mobile visual gate requires >=3 distinct offers, got ${distinctChoices.length}`);

    const groups: any[][] = [];
    for (let start = 0; start < distinctChoices.length; start += 3) {
      const group = distinctChoices.slice(start, start + 3);
      const used = new Set(group.map((choice: any) => choice.id));
      for (const candidate of distinctChoices) {
        if (group.length >= 3) break;
        if (used.has(candidate.id)) continue;
        group.push(candidate);
        used.add(candidate.id);
      }
      if (group.length !== 3 || new Set(group.map((choice: any) => choice.id)).size !== 3) {
        throw new Error(`could not build a distinct three-card group from ${group.map((choice: any) => choice.id).join(',')}`);
      }
      groups.push(group);
    }

    const waitFor = async (predicate: () => boolean, label: string, attempts = 90) => {
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        if (predicate()) return;
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
      }
      throw new Error(`timed out waiting for ${label}`);
    };

    const snapshots: any[] = [];
    const measure = (upgradeScene: any, choices: any[]) => {
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
        const descriptionTop = description ? card.g.y + description.y * scale : null;
        const descriptionBottom = description ? card.g.y + (description.y + description.displayHeight) * scale : null;
        const footerTop = card.g.y + (card.footer.y - card.footer.displayHeight / 2) * scale;
        const footerBottom = card.g.y + (card.footer.y + card.footer.displayHeight / 2) * scale;
        return {
          id: choice.id,
          scale,
          left, right, top, bottom,
          screenLeft: canvasRect.left + left * sx,
          screenRight: canvasRect.left + right * sx,
          screenTop: canvasRect.top + top * sy,
          screenBottom: canvasRect.top + bottom * sy,
          bgWidth, bgHeight,
          hitWidth: Number(hit?.width || 0),
          hitHeight: Number(hit?.height || 0),
          previewTop, previewBottom,
          previewWidth: Number(card.previewBackground.width || 0) * scale,
          previewHeight: Number(card.previewBackground.height || 0) * scale,
          previewTextWidth: Number(card.previewText.displayWidth || 0) * scale,
          previewTextHeight: Number(card.previewText.displayHeight || 0) * scale,
          previewText: String(card.previewText.text || ''),
          descriptionTop,
          descriptionBottom,
          descriptionHeight: Number(description?.displayHeight || 0) * scale,
          footerTop,
          footerBottom,
          footerText: String(card.footer.text || '')
        };
      });
      const gaps = cards.slice(0, -1).map((card: any, index: number) => cards[index + 1].left - card.right);
      return {
        cards,
        gaps,
        selectedIndex: upgradeScene.selectedIndex,
        canvas: { left: canvasRect.left, top: canvasRect.top, right: canvasRect.right, bottom: canvasRect.bottom, width: canvasRect.width, height: canvasRect.height },
        logical: { width: logicalWidth, height: logicalHeight }
      };
    };

    for (let index = 0; index < groups.length; index += 1) {
      if (game.scene.isActive('UpgradeSceneV4')) {
        scene.scene.stop('UpgradeSceneV4');
        await waitFor(() => !game.scene.isActive('UpgradeSceneV4'), 'UpgradeSceneV4 shutdown');
      }
      scene.scene.launch('UpgradeSceneV4', { gameScene: scene, choices: groups[index], level: index + 1 });
      scene.scene.bringToTop('UpgradeSceneV4');
      await waitFor(() => {
        const active = game.scene.isActive('UpgradeSceneV4');
        const current = game.scene.getScene('UpgradeSceneV4');
        return active && Array.isArray(current?.cards) && current.cards.length === 3;
      }, `UpgradeSceneV4 three-card render for group ${index}`);
      const upgradeScene = game.scene.getScene('UpgradeSceneV4');
      const initial = measure(upgradeScene, groups[index]);
      upgradeScene.selectedIndex = 1;
      upgradeScene.refresh();
      await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
      const middleSelected = measure(upgradeScene, groups[index]);
      snapshots.push({ ids: groups[index].map((choice: any) => choice.id), initial, middleSelected });
    }
    scene.scene.stop('UpgradeSceneV4');

    return {
      viewport: { width: innerWidth, height: innerHeight },
      target: { width, height },
      presentationVersion: scene.__upgradeCardPresentationVersion,
      previewVersion: scene.__upgradeCardPreviewVersion,
      uniformCards: scene.__finalUniformUpgradeCards,
      eligibleOfferIds: distinctChoices.map((choice: any) => choice.id),
      snapshots
    };
  }, TARGET_VIEWPORT);

  expect(result.viewport).toEqual(result.target);
  expect(result.presentationVersion).toBe('u5-before-after-v3');
  expect(result.previewVersion).toBe('u5-before-after-v1');
  expect(result.uniformCards).toBe(true);
  expect(result.eligibleOfferIds.length).toBeGreaterThanOrEqual(3);
  expect(result.snapshots).toHaveLength(Math.ceil(result.eligibleOfferIds.length / 3));

  const covered = new Set<string>();
  for (const snapshot of result.snapshots) {
    snapshot.ids.forEach((id: string) => covered.add(id));
    for (const state of [snapshot.initial, snapshot.middleSelected]) {
      expect(state.cards).toHaveLength(3);
      expect(Math.min(...state.gaps)).toBeGreaterThanOrEqual(6);
      expect(state.logical.width).toBeGreaterThan(0);
      expect(state.logical.height).toBeGreaterThan(0);
      expect(state.canvas.width).toBeGreaterThan(0);
      expect(state.canvas.height).toBeGreaterThan(0);
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
        expect(card.footerBottom, `${card.id}: footer inside card`).toBeLessThanOrEqual(card.bottom - 6);
        expect(card.footerText, `${card.id}: level`).toContain('LV');
      }
    }
    expect(snapshot.initial.selectedIndex).toBe(0);
    expect(snapshot.middleSelected.selectedIndex).toBe(1);
  }

  expect([...result.eligibleOfferIds].every((id: string) => covered.has(id))).toBe(true);
});
