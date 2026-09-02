import { UPGRADE_RARITIES, UPGRADE_RARITY_RULES, getUpgradeRarityRule } from './upgrade-rarity.js?v=1';
import { getUpgradeCardArtTexture, installUpgradeCardArt } from './upgrade-card-art.js?v=7';

export const UPGRADE_CARD_PRESENTATION_VERSION = 'u5-frame-hierarchy-v1';
export const UPGRADE_CARD_VISUAL_HIERARCHY = Object.freeze([
  'ART',
  'NAME',
  'RARITY',
  'LEVEL',
  'DESCRIPTION'
]);

const CATEGORY_COLORS = Object.freeze({
  HERO: 0xd98446,
  UTILITY: 0x4fc8d8,
  FORTRESS: 0xd4ad62,
  EVOLUTION: 0x9d6be8
});
const RARITY_ORDER = Object.values(UPGRADE_RARITIES);
const FALLBACK_CARD_FRAME = id => `icon_${id}.png`;

function fitImage(image, width, height) {
  const frameWidth = image.frame?.realWidth || image.width || 1;
  const frameHeight = image.frame?.realHeight || image.height || 1;
  const scale = Math.min(width / frameWidth, height / frameHeight);
  image.setDisplaySize(frameWidth * scale, frameHeight * scale);
  return image;
}

export function getUpgradeCardFrameProfile(rarity = UPGRADE_RARITIES.COMMON) {
  const normalizedRarity = RARITY_ORDER.includes(rarity) ? rarity : UPGRADE_RARITIES.COMMON;
  const rule = getUpgradeRarityRule(normalizedRarity);
  const rank = Math.max(0, RARITY_ORDER.indexOf(normalizedRarity));
  return Object.freeze({
    rarity: normalizedRarity,
    rank,
    label: rule.label,
    frame: rule.color,
    glow: rule.color,
    outerStrokeWidth: rank >= 3 ? 4 : rank >= 1 ? 3 : 2,
    innerAlpha: rank >= 3 ? .68 : rank === 2 ? .52 : rank === 1 ? .34 : .12,
    idleGlowAlpha: rank >= 3 ? .13 : rank === 2 ? .085 : rank === 1 ? .04 : .012,
    selectedGlowAlpha: rank >= 3 ? .24 : rank === 2 ? .18 : rank === 1 ? .105 : .06,
    sideRails: rank >= 1,
    cornerBrackets: rank >= 2,
    legendaryBolts: rank >= 3
  });
}

function addFrameAccents(scene, width, height, profile) {
  const accents = [];
  if (profile.sideRails) {
    accents.push(scene.add.rectangle(-width / 2 + 6, 0, 3, height * .58, profile.frame, .36));
    accents.push(scene.add.rectangle(width / 2 - 6, 0, 3, height * .58, profile.frame, .36));
  }
  if (profile.cornerBrackets) {
    const x = width / 2 - 12;
    const y = height / 2 - 12;
    const bracket = 18;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      accents.push(scene.add.rectangle(sx * (x - bracket / 2), sy * y, bracket, 3, profile.frame, .82));
      accents.push(scene.add.rectangle(sx * x, sy * (y - bracket / 2), 3, bracket, profile.frame, .82));
    });
  }
  if (profile.legendaryBolts) {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      accents.push(scene.add.circle(sx * (width / 2 - 15), sy * (height / 2 - 15), 4, 0xf7d58a, 1).setStrokeStyle(2, 0xd98446, .9));
    });
    accents.push(scene.add.rectangle(0, -height / 2 + 11, width * .48, 3, 0xf7d58a, .86));
  }
  return accents;
}

export function installUpgradeCardPresentation(gameScene) {
  if (!gameScene?.game?.scene) throw new TypeError('Upgrade card presentation requires the live game scene');
  const upgradeScene = gameScene.game.scene.getScene('UpgradeSceneV4');
  if (!upgradeScene) throw new Error('UpgradeSceneV4 missing');
  if (!gameScene.textures?.get?.('c5-upgrade-sheet')) throw new Error('HD upgrade sheet missing');

  installUpgradeCardArt(gameScene);

  upgradeScene.card = function(x, y, width, height, upgrade, index) {
    const categoryColor = CATEGORY_COLORS[upgrade.category] || CATEGORY_COLORS.HERO;
    const profile = getUpgradeCardFrameProfile(upgrade.rarity || UPGRADE_RARITIES.COMMON);
    const group = this.add.container(x, y);

    const shadow = this.add.rectangle(8, 11, width, height, 0x000000, .46);
    const glow = this.add.rectangle(0, 0, width + 10, height + 10, profile.glow, profile.idleGlowAlpha);
    const background = this.add.rectangle(0, 0, width, height, 0x141a21, .997)
      .setStrokeStyle(profile.outerStrokeWidth, profile.frame, .94);
    const inner = this.add.rectangle(0, 0, width - 10, height - 10, 0, 0)
      .setStrokeStyle(1, profile.frame, profile.innerAlpha);
    const rarityRail = this.add.rectangle(0, -height / 2 + 5, width, 9, profile.frame, .98);

    const metaY = -height / 2 + 25;
    const metaBackground = this.add.rectangle(0, metaY, width - 18, 32, 0x0b1016, .93);
    const categoryText = this.add.text(-width / 2 + 17, metaY, upgrade.category, {
      fontFamily: 'Arial Black,Arial', fontSize: '9px',
      color: Phaser.Display.Color.IntegerToColor(categoryColor).rgba, letterSpacing: 1
    }).setOrigin(0, .5);
    const rarityText = this.add.text(width / 2 - 17, metaY, `${upgrade.rarityLabel || profile.label} • ${Math.round((Number(upgrade.rarityPowerMultiplier) || 1) * 100)}% POWER`, {
      fontFamily: 'Arial Black,Arial', fontSize: profile.rank >= 3 ? '9px' : '8px',
      color: Phaser.Display.Color.IntegerToColor(profile.frame).rgba, letterSpacing: 1
    }).setOrigin(1, .5);

    // U5 hierarchy: the art is the dominant visual block, with only compact metadata above it.
    const artHeight = Math.min(166, height * .42);
    const artY = -height * .18;
    const artBackground = this.add.rectangle(0, artY, width - 26, artHeight, 0x091016, .985)
      .setStrokeStyle(profile.rank >= 2 ? 2 : 1, profile.frame, profile.rank >= 2 ? .52 : .27);
    const artInset = this.add.rectangle(0, artY, width - 38, artHeight - 12, 0x111920, .72)
      .setStrokeStyle(1, categoryColor, .22);
    const categoryRail = this.add.rectangle(-width / 2 + 20, artY, 4, artHeight * .62, categoryColor, .7);
    const customArtTexture = getUpgradeCardArtTexture(this, upgrade.id);
    const art = customArtTexture
      ? this.add.image(0, artY, customArtTexture)
      : this.add.image(0, artY, 'c3-atlas', FALLBACK_CARD_FRAME(upgrade.id));
    fitImage(art, Math.min(124, width * .46), Math.min(110, artHeight * .70));

    const title = this.add.text(0, height * .105, upgrade.title, {
      fontFamily: 'Arial Black,Arial',
      fontSize: `${Math.max(16, Math.min(21, width / 13.6))}px`,
      color: '#f4f6f7', align: 'center', wordWrap: { width: width - 28 }
    }).setOrigin(.5);
    const titleUnderline = this.add.rectangle(0, height * .145, width * .38, 2, profile.frame, .52);
    const description = this.add.text(0, height * .225, upgrade.desc, {
      fontFamily: 'Arial', fontSize: '12px', color: '#c1c9d0',
      align: 'center', wordWrap: { width: width - 34 }, lineSpacing: 3
    }).setOrigin(.5, 0);

    const level = this.gameScene?.upgradeLevels?.[upgrade.id] || 0;
    const footerLabel = level ? `LV ${level}  →  ${level + 1}` : 'NEW UPGRADE';
    const footer = this.add.text(0, height / 2 - 23, footerLabel, {
      fontFamily: 'Arial Black,Arial', fontSize: '9px',
      color: Phaser.Display.Color.IntegerToColor(profile.frame).rgba
    }).setOrigin(.5);

    const accents = addFrameAccents(this, width, height, profile);
    const hit = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { this.selectedIndex = index; this.refresh(); });
    hit.on('pointerdown', (_pointer, _x, _y, event) => { event?.stopPropagation?.(); this.choose(index); });

    group.add([
      shadow, glow, background, inner, rarityRail, metaBackground, categoryText, rarityText,
      artBackground, artInset, categoryRail, art, title, titleUnderline, description, footer,
      ...accents, hit
    ]);
    this.cards.push({
      g: group,
      bg: background,
      inner,
      strip: rarityRail,
      art,
      artBackground,
      glow,
      rarityText,
      rarity: profile.rarity,
      style: profile,
      a: profile.frame,
      hierarchyVersion: UPGRADE_CARD_PRESENTATION_VERSION
    });
  };

  upgradeScene.refresh = function() {
    this.cards.forEach((card, index) => {
      const selected = index === this.selectedIndex;
      const profile = card.style;
      card.g.setScale(selected ? 1.028 : 1);
      card.bg.setStrokeStyle(
        selected ? profile.outerStrokeWidth + 1 : profile.outerStrokeWidth,
        profile.frame,
        selected ? 1 : .9
      );
      card.inner.setAlpha(selected ? 1 : profile.innerAlpha);
      card.strip.setAlpha(selected ? 1 : .86);
      card.glow.setAlpha(selected ? profile.selectedGlowAlpha : profile.idleGlowAlpha);
      card.art.setAlpha(selected ? 1 : .95);
      card.artBackground.setAlpha(selected ? 1 : .94);
      card.rarityText.setAlpha(selected ? 1 : .87);
    });
  };

  gameScene.__d1PremiumCards = true;
  gameScene.__d1RarityStyles = Object.keys(UPGRADE_RARITY_RULES);
  gameScene.__d1CardArtSource = 'c3-atlas-icons';
  gameScene.__upgradeCardPresentationVersion = UPGRADE_CARD_PRESENTATION_VERSION;
  gameScene.__upgradeCardVisualHierarchy = [...UPGRADE_CARD_VISUAL_HIERARCHY];
  return upgradeScene;
}
