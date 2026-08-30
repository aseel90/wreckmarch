import { createRunStatState, mirrorResolvedRunStats } from '../stats/run-stat-state.js?v=3';

export const PIERCING_RIVETS_ICON_TEXTURE = 'upgrade-icon-piercing-rivets';

function copyModifierState(source, target) {
  for (const domain of ['character', 'weapon']) {
    const sourceDomain = source?.state?.modifiers?.[domain] || {};
    const targetDomain = target.state.modifiers[domain];
    for (const [stat, modifiers] of Object.entries(sourceDomain)) {
      targetDomain[stat] = Array.isArray(modifiers) ? modifiers.map(modifier => ({ ...modifier })) : [];
    }
  }
}

function ensurePierceBaseline(scene) {
  const current = scene.runStatState;
  if (!current?.state?.base?.weapon) throw new Error('Piercing Rivets requires initialized runStatState');
  if (Number.isFinite(Number(current.state.base.weapon.pierceCount))) return current;

  const next = createRunStatState({
    characterBase: current.state.base.character,
    weaponBase: { ...current.state.base.weapon, pierceCount: 0 },
    caps: {
      character: { ...current.state.caps.character },
      weapon: { ...current.state.caps.weapon }
    }
  });
  copyModifierState(current, next);
  scene.runStatState = next;
  mirrorResolvedRunStats(scene, next.resolve());
  return next;
}

function buildPiercingIcon(scene) {
  if (scene.textures.exists(PIERCING_RIVETS_ICON_TEXTURE)) return;
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
  g.generateTexture(PIERCING_RIVETS_ICON_TEXTURE, 128, 112);
  g.destroy();
}

function installCardArtOverride(scene) {
  const upgradeScene = scene.game.scene.getScene('UpgradeSceneV4');
  if (!upgradeScene || upgradeScene.__piercingRivetsCardArtInstalled) return;
  const baseCard = upgradeScene.card;
  if (typeof baseCard !== 'function') throw new Error('Piercing Rivets requires UpgradeSceneV4.card');

  upgradeScene.card = function(...args) {
    const upgrade = args[4];
    const before = this.cards?.length || 0;
    const result = baseCard.apply(this, args);
    if (upgrade?.id === 'piercing-rivets') {
      const card = this.cards?.[before];
      card?.art?.setTexture?.(PIERCING_RIVETS_ICON_TEXTURE);
      card?.art?.setCrop?.();
    }
    return result;
  };
  upgradeScene.__piercingRivetsCardArtInstalled = true;
}

export function installPiercingRivetsLive(scene) {
  if (!scene || typeof scene !== 'object') throw new TypeError('Piercing Rivets live install requires a scene');
  ensurePierceBaseline(scene);
  buildPiercingIcon(scene);
  installCardArtOverride(scene);
  scene.__piercingRivetsLiveReady = true;
  return scene;
}
