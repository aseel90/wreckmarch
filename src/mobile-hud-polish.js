/* WRECKMARCH mobile polish — compact landscape HUD rail */
function layout(scene) {
  const W = scene.scale.gameSize.width;
  const H = scene.scale.gameSize.height;
  scene.children.list.filter(object => object?.name === 'mobile-hud-polish').forEach(object => object.destroy());
  scene.children.list
    .filter(object => object?.name === 'c1-hud-shade' || object?.name === 'c2-hud-shade')
    .forEach(object => object.setVisible(false));

  const hudH = 62;
  scene.add.rectangle(W / 2, hudH / 2, W, hudH, 0x090d13, .94)
    .setDepth(916).setScrollFactor(0).setName('mobile-hud-polish');
  scene.add.rectangle(W / 2, hudH - 1, W, 2, 0x59636d, .38)
    .setDepth(917).setScrollFactor(0).setName('mobile-hud-polish');

  const edge = 16;
  scene.titleText.setPosition(edge, 8).setFontSize(17).setDepth(920).setScrollFactor(0);
  scene.waveText.setPosition(edge, 34).setOrigin(0, 0).setFontSize(10).setDepth(920).setScrollFactor(0);
  scene.timerText.setPosition(W - edge, 8).setOrigin(1, 0).setFontSize(14).setDepth(920).setScrollFactor(0);

  const barW = Phaser.Math.Clamp(Math.round(W * .44), 300, 520);
  const barX = W / 2;
  const barY = 42;
  const barLeft = barX - barW / 2;
  const barRight = barX + barW / 2;

  scene.levelText.setPosition(barLeft, 8).setOrigin(0, 0).setFontSize(11).setDepth(922).setScrollFactor(0);
  scene.scrapText.setPosition(barRight, 8).setOrigin(1, 0).setFontSize(11).setDepth(922).setScrollFactor(0);
  scene.xpBg?.destroy?.();
  scene.xpFill?.destroy?.();
  scene.xpBg = scene.add.rectangle(barX, barY, barW, 11, 0x111820, .98)
    .setStrokeStyle(1.5, 0x59636d, .75).setDepth(918).setScrollFactor(0);
  scene.xpFill = scene.add.rectangle(barLeft + 3, barY, barW - 6, 7, 0x55d7e5, 1)
    .setOrigin(0, .5).setDepth(919).setScrollFactor(0);

  scene.hint.setPosition(W / 2, H - 8).setFontSize(9).setDepth(800).setScrollFactor(0);
  scene.refreshProgressHud?.();
  scene.__mobileHudPolish = { width: W, height: H, railHeight: hudH };
}

export function installMobileHudPolish(scene) {
  scene.children.list
    .filter(object => object?.name === 'c1-hud-shade' || object?.name === 'c2-hud-shade')
    .forEach(object => object.setVisible(false));
  layout(scene);

  const relayout = () => requestAnimationFrame(() => layout(scene));
  window.addEventListener('resize', relayout, { passive: true });
  window.visualViewport?.addEventListener?.('resize', relayout, { passive: true });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    window.removeEventListener('resize', relayout);
    window.visualViewport?.removeEventListener?.('resize', relayout);
  });

  document.documentElement.dataset.wreckmarchMobileHud = 'compact-v1';
  return scene.__mobileHudPolish;
}
