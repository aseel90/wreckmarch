export const UPGRADE_CARD_ART_TEXTURES = Object.freeze({
  'piercing-rivets': 'upgrade-icon-piercing-rivets',
  'ricochet': 'upgrade-icon-ricochet',
  'shrapnel-impact': 'upgrade-icon-shrapnel-impact',
  'critical-rivet': 'upgrade-icon-critical-rivet',
  'field-repair': 'upgrade-icon-field-repair',
  'impact-shield': 'upgrade-icon-impact-shield'
});

function buildPiercingRivetsIcon(scene) {
  const textureKey = UPGRADE_CARD_ART_TEXTURES['piercing-rivets'];
  if (scene.textures.exists(textureKey)) return textureKey;

  const g = scene.make.graphics({ add: false });
  const plate = (x, y, w, h) => {
    g.fillStyle(0x151b20, 1).fillRoundedRect(x + 3, y + 4, w, h, 7);
    g.fillStyle(0x495158, 1).fillRoundedRect(x, y, w, h, 7);
    g.lineStyle(4, 0x1f2529, 1).strokeRoundedRect(x, y, w, h, 7);
    g.lineStyle(2, 0x8c6949, .8).strokeRoundedRect(x + 5, y + 5, w - 10, h - 10, 4);
    g.fillStyle(0x232a2f, 1).fillCircle(x + 6, y + 8, 3).fillCircle(x + w - 6, y + h - 8, 3);
  };

  plate(28, 23, 23, 66);
  plate(53, 18, 23, 76);
  plate(78, 24, 23, 64);
  g.fillStyle(0x0a0e11, .92).fillCircle(39, 56, 10).fillCircle(64, 56, 10).fillCircle(89, 56, 10);
  g.lineStyle(10, 0x231710, 1).lineBetween(8, 58, 116, 58);
  g.lineStyle(6, 0xc66c32, 1).lineBetween(8, 57, 117, 57);
  g.lineStyle(2, 0xffd07a, 1).lineBetween(12, 55, 113, 55);
  g.fillStyle(0xf1c675, 1).fillTriangle(116, 50, 127, 57, 116, 64);
  g.fillStyle(0xe7672f, .95).fillTriangle(1, 52, 13, 57, 1, 62);
  g.lineStyle(3, 0x55d8e5, .95);
  g.lineBetween(34, 34, 27, 22);
  g.lineBetween(47, 77, 41, 91);
  g.lineBetween(59, 31, 54, 17);
  g.lineBetween(71, 79, 79, 94);
  g.lineBetween(84, 34, 93, 21);
  g.lineBetween(96, 76, 106, 88);
  g.fillStyle(0xf0b84a, 1).fillCircle(29, 39, 3).fillCircle(53, 84, 3).fillCircle(82, 27, 3).fillCircle(106, 69, 3);
  g.generateTexture(textureKey, 128, 112);
  g.destroy();
  return textureKey;
}

function buildRicochetIcon(scene) {
  const textureKey = UPGRADE_CARD_ART_TEXTURES.ricochet;
  if (scene.textures.exists(textureKey)) return textureKey;

  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x11181d, 1).fillRoundedRect(18, 18, 92, 76, 12);
  g.lineStyle(4, 0x4c5960, 1).strokeRoundedRect(18, 18, 92, 76, 12);
  g.fillStyle(0x39434a, 1).fillCircle(35, 39, 12).fillCircle(91, 73, 12);
  g.lineStyle(5, 0xc56d35, 1).lineBetween(8, 78, 53, 54);
  g.lineStyle(3, 0xffd07a, 1).lineBetween(11, 75, 54, 52);
  g.fillStyle(0xf4c66f, 1).fillTriangle(50, 45, 63, 50, 55, 61);
  g.lineStyle(5, 0x55d8e5, .96);
  g.beginPath();
  g.moveTo(58, 52);
  g.lineTo(85, 33);
  g.lineTo(106, 48);
  g.strokePath();
  g.fillStyle(0xbff8ff, 1).fillTriangle(101, 42, 118, 51, 101, 58);
  g.lineStyle(3, 0xe9a24e, .9).lineBetween(82, 29, 88, 17).lineBetween(91, 31, 103, 24);
  g.fillStyle(0xf0b84a, 1).fillCircle(55, 52, 4).fillCircle(87, 34, 3).fillCircle(105, 49, 3);
  g.generateTexture(textureKey, 128, 112);
  g.destroy();
  return textureKey;
}

function buildShrapnelImpactIcon(scene) {
  const textureKey = UPGRADE_CARD_ART_TEXTURES['shrapnel-impact'];
  if (scene.textures.exists(textureKey)) return textureKey;

  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x10171c, 1).fillRoundedRect(18, 18, 92, 76, 12);
  g.lineStyle(4, 0x4b565c, 1).strokeRoundedRect(18, 18, 92, 76, 12);
  g.fillStyle(0x4c555a, 1).fillRoundedRect(54, 25, 20, 62, 6);
  g.lineStyle(3, 0x1f2529, 1).strokeRoundedRect(54, 25, 20, 62, 6);
  g.lineStyle(7, 0xc66c32, 1).lineBetween(6, 56, 61, 56);
  g.lineStyle(3, 0xffd07a, 1).lineBetween(10, 53, 60, 53);
  g.fillStyle(0xffe4a4, 1).fillCircle(64, 56, 6);
  g.lineStyle(4, 0x55d8e5, .96);
  g.lineBetween(68, 54, 108, 31);
  g.lineBetween(69, 57, 116, 57);
  g.lineBetween(68, 60, 108, 83);
  g.fillStyle(0xbff8ff, 1)
    .fillTriangle(103, 25, 120, 27, 110, 40)
    .fillTriangle(111, 50, 126, 57, 111, 64)
    .fillTriangle(103, 87, 120, 85, 110, 74);
  g.fillStyle(0xf0b84a, 1).fillCircle(79, 42, 3).fillCircle(84, 57, 3).fillCircle(79, 72, 3);
  g.generateTexture(textureKey, 128, 112);
  g.destroy();
  return textureKey;
}

function buildCriticalRivetIcon(scene) {
  const textureKey = UPGRADE_CARD_ART_TEXTURES['critical-rivet'];
  if (scene.textures.exists(textureKey)) return textureKey;

  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x10171c, 1).fillRoundedRect(18, 18, 92, 76, 12);
  g.lineStyle(4, 0x4b565c, 1).strokeRoundedRect(18, 18, 92, 76, 12);
  g.lineStyle(3, 0x55d8e5, .82).strokeCircle(72, 56, 29);
  g.lineStyle(2, 0x9cecf4, .72).strokeCircle(72, 56, 18);
  g.lineStyle(3, 0x55d8e5, .88)
    .lineBetween(72, 20, 72, 35)
    .lineBetween(72, 77, 72, 92)
    .lineBetween(36, 56, 51, 56)
    .lineBetween(93, 56, 108, 56);
  g.lineStyle(8, 0x241710, 1).lineBetween(4, 74, 68, 57);
  g.lineStyle(5, 0xc66c32, 1).lineBetween(5, 72, 69, 55);
  g.lineStyle(2, 0xffd07a, 1).lineBetween(8, 69, 68, 53);
  g.fillStyle(0xffe3a0, 1).fillTriangle(64, 48, 79, 54, 68, 63);
  g.fillStyle(0xf0b84a, .95)
    .fillTriangle(72, 42, 77, 51, 87, 53)
    .fillTriangle(87, 53, 79, 60, 80, 70)
    .fillTriangle(80, 70, 71, 65, 62, 70)
    .fillTriangle(62, 70, 64, 60, 56, 53)
    .fillTriangle(56, 53, 66, 51, 72, 42);
  g.fillStyle(0xfff0bd, 1).fillCircle(72, 56, 5);
  g.lineStyle(3, 0xe56f45, .9).lineBetween(93, 36, 104, 25).lineBetween(96, 77, 108, 88);
  g.generateTexture(textureKey, 128, 112);
  g.destroy();
  return textureKey;
}

function buildFieldRepairIcon(scene) {
  const textureKey = UPGRADE_CARD_ART_TEXTURES['field-repair'];
  if (scene.textures.exists(textureKey)) return textureKey;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x10171c, 1).fillRoundedRect(18, 18, 92, 76, 12);
  g.lineStyle(4, 0x4b565c, 1).strokeRoundedRect(18, 18, 92, 76, 12);
  g.fillStyle(0x2f3d42, 1).fillRoundedRect(38, 28, 52, 58, 8);
  g.lineStyle(3, 0x7a8b91, .9).strokeRoundedRect(38, 28, 52, 58, 8);
  g.fillStyle(0x55d8e5, .95).fillRoundedRect(58, 38, 12, 38, 3).fillRoundedRect(45, 51, 38, 12, 3);
  g.fillStyle(0xbff8ff, 1).fillCircle(64, 57, 4);
  g.lineStyle(5, 0xc66c32, 1).lineBetween(22, 88, 47, 70);
  g.lineStyle(3, 0xffd07a, 1).lineBetween(24, 85, 48, 68);
  g.generateTexture(textureKey, 128, 112);
  g.destroy();
  return textureKey;
}

function buildImpactShieldIcon(scene) {
  const textureKey = UPGRADE_CARD_ART_TEXTURES['impact-shield'];
  if (scene.textures.exists(textureKey)) return textureKey;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x10171c, 1).fillRoundedRect(18, 18, 92, 76, 12);
  g.lineStyle(4, 0x4b565c, 1).strokeRoundedRect(18, 18, 92, 76, 12);
  g.fillStyle(0x25343b, 1).fillTriangle(64, 23, 101, 37, 92, 78).fillTriangle(64, 23, 27, 37, 36, 78).fillTriangle(36, 78, 92, 78, 64, 98);
  g.lineStyle(4, 0x55d8e5, .95).beginPath().moveTo(64, 23).lineTo(101, 37).lineTo(92, 78).lineTo(64, 98).lineTo(36, 78).lineTo(27, 37).closePath().strokePath();
  g.lineStyle(2, 0xbff8ff, .78).strokeCircle(64, 58, 19);
  g.fillStyle(0xbff8ff, .95).fillCircle(64, 58, 6);
  g.generateTexture(textureKey, 128, 112);
  g.destroy();
  return textureKey;
}

export function installUpgradeCardArt(scene) {
  if (!scene?.textures || !scene?.make?.graphics) throw new TypeError('Upgrade card art requires a Phaser scene');
  buildPiercingRivetsIcon(scene);
  buildRicochetIcon(scene);
  buildShrapnelImpactIcon(scene);
  buildCriticalRivetIcon(scene);
  buildFieldRepairIcon(scene);
  buildImpactShieldIcon(scene);
  scene.__upgradeCardArtReady = true;
  return scene;
}

export function getUpgradeCardArtTexture(scene, upgradeId) {
  const textureKey = UPGRADE_CARD_ART_TEXTURES[upgradeId];
  return textureKey && scene?.textures?.exists?.(textureKey) ? textureKey : null;
}
