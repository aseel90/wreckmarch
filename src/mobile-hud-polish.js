/* WRECKMARCH mobile polish — compact landscape HUD rail */
function gameplayHudObjects(scene) {
  const refs = [
    scene.titleText, scene.waveText, scene.timerText, scene.levelText, scene.scrapText,
    scene.xpBg, scene.xpFill, scene.hint, scene.joyBase, scene.joyKnob, scene.hitboxButton
  ];
  const rails = scene.children.list.filter(object => object?.name === 'mobile-hud-polish');
  return [...new Set([...refs, ...rails].filter(Boolean))];
}

function applySuppressedState(scene) {
  if (!scene.__gameplayHudSuppressed) return;
  gameplayHudObjects(scene).forEach(object => object.setVisible?.(false));
}

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
  applySuppressedState(scene);
}

function installOverlayStateOwnership(scene) {
  const priorOpen = scene.openUpgradeCards?.bind(scene);
  const priorClose = scene.closeUpgradeCards?.bind(scene);

  if (priorOpen) {
    scene.openUpgradeCards = function(...args) {
      const result = priorOpen(...args);
      if (this.upgradeOpen) this.setGameplayHudVisible?.(false);
      return result;
    };
  }

  if (priorClose) {
    scene.closeUpgradeCards = function(...args) {
      const result = priorClose(...args);
      if (!this.gameOver) this.setGameplayHudVisible?.(true);
      return result;
    };
  }

  scene.endRun = function(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    if (this.spawnEvent) this.spawnEvent.paused = true;
    if (this.waveEvent) this.waveEvent.paused = true;
    this.hero.setVelocity(0, 0);
    this.cameras.main.shake(260, .008);
    this.playTone?.(90, .35, 'sawtooth', .04, -55);

    const W = this.scale.width || this.cameras.main.width || 960;
    const H = this.scale.height || this.cameras.main.height || 540;

    ['UpgradeScene', 'UpgradeSceneV2', 'UpgradeSceneV3', 'UpgradeSceneV4'].forEach(key => {
      if (this.scene.isActive?.(key)) this.scene.stop(key);
    });
    this.upgradeOpen = false;
    this.input.enabled = true;
    this.setGameplayHudVisible?.(false);

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x090d12, .92)
      .setDepth(6000).setScrollFactor(0).setName('run-end-overlay');
    const heading = this.add.text(W / 2, H * .36, reason, {
      fontFamily: 'Arial Black, Arial', fontSize: '32px', color: '#d56a49', align: 'center'
    }).setOrigin(.5).setDepth(6001).setScrollFactor(0).setName('run-end-title');
    const summary = this.add.text(W / 2, H * .45, `SURVIVED ${Math.floor(this.runTime)}s  •  SCRAP ${this.scrap}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#c0c8d1', align: 'center'
    }).setOrigin(.5).setDepth(6001).setScrollFactor(0).setName('run-end-summary');
    const btn = this.add.rectangle(W / 2, H * .60, 260, 64, 0xb97945)
      .setDepth(6001).setScrollFactor(0).setName('run-end-button').setInteractive({ useHandCursor: true });
    const buttonLabel = this.add.text(W / 2, H * .60, 'RUN AGAIN', {
      fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#171d26'
    }).setOrigin(.5).setDepth(6002).setScrollFactor(0).setName('run-end-button-label');

    window.__WM_END_RUN_LAYOUT__ = { width: W, height: H, overlay, heading, summary, btn, buttonLabel };
    document.documentElement.dataset.wreckmarchEndRunLayout = 'runtime-v1';
    btn.on('pointerdown', () => this.scene.restart());
  };
}

export function installMobileHudPolish(scene) {
  scene.setGameplayHudVisible = function(visible) {
    const targets = gameplayHudObjects(this);
    if (!visible) {
      if (!this.__gameplayHudSuppressed) {
        this.__gameplayHudVisibilitySnapshot = targets.map(object => [object, object.visible !== false]);
      }
      this.__gameplayHudSuppressed = true;
      targets.forEach(object => object.setVisible?.(false));
      document.documentElement.dataset.wreckmarchGameplayHud = 'suppressed';
      return;
    }

    this.__gameplayHudSuppressed = false;
    const snapshot = this.__gameplayHudVisibilitySnapshot || [];
    const restored = new Set();
    snapshot.forEach(([object, wasVisible]) => {
      if (!object?.active && object?.active !== undefined) return;
      object?.setVisible?.(wasVisible);
      restored.add(object);
    });
    gameplayHudObjects(this).forEach(object => {
      if (!restored.has(object)) object.setVisible?.(true);
    });
    this.__gameplayHudVisibilitySnapshot = null;
    document.documentElement.dataset.wreckmarchGameplayHud = 'visible';
  };

  installOverlayStateOwnership(scene);

  scene.children.list
    .filter(object => object?.name === 'c1-hud-shade' || object?.name === 'c2-hud-shade')
    .forEach(object => object.setVisible(false));
  layout(scene);
  if (!scene.__gameplayHudSuppressed) document.documentElement.dataset.wreckmarchGameplayHud = 'visible';

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
