export const UPGRADE_CARD_ART_TEXTURES = Object.freeze({
  'piercing-rivets': 'upgrade-icon-piercing-rivets',
  'ricochet': 'upgrade-icon-ricochet'
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

export function installUpgradeCardArt(scene) {
  if (!scene?.textures || !scene?.make?.graphics) throw new TypeError('Upgrade card art requires a Phaser scene');
  buildPiercingRivetsIcon(scene);
  buildRicochetIcon(scene);
  scene.__upgradeCardArtReady = true;
  return scene;
}

export function getUpgradeCardArtTexture(scene, upgradeId) {
  const textureKey = UPGRADE_CARD_ART_TEXTURES[upgradeId];
  return textureKey && scene?.textures?.exists?.(textureKey) ? textureKey : null;
}
