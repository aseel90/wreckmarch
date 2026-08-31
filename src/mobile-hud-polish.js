/* WRECKMARCH mobile polish — safe-area-aware compact landscape HUD rail */
const END_RUN_OWNER_VERSION = 'runtime-v4';
function gameplayHudObjects(scene) {
  const refs = [
    scene.titleText, scene.waveText, scene.timerText, scene.levelText, scene.scrapText,
    scene.xpBg, scene.xpFill, scene.hint, scene.joyBase, scene.joyKnob,
    scene.heroHpBg, scene.heroHpBar, scene.hitboxButton
  ];
  const rails = scene.children.list.filter(object => object?.name === 'mobile-hud-polish');
  return [...new Set([...refs, ...rails].filter(Boolean))];
}

function applySuppressedState(scene) {
  if (!scene.__gameplayHudSuppressed) return;
  gameplayHudObjects(scene).forEach(object => object.setVisible?.(false));
}

function readSafeAreaInsets() {
  if (typeof document === 'undefined' || !document.body) return { top: 0, right: 0, bottom: 0, left: 0 };
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = [
    'position:fixed', 'inset:0', 'visibility:hidden', 'pointer-events:none',
    'padding-top:env(safe-area-inset-top)', 'padding-right:env(safe-area-inset-right)',
    'padding-bottom:env(safe-area-inset-bottom)', 'padding-left:env(safe-area-inset-left)'
  ].join(';');
  document.body.appendChild(probe);
  const css = getComputedStyle(probe);
  const px = value => Math.max(0, Number.parseFloat(value) || 0);
  const result = {
    top: px(css.paddingTop), right: px(css.paddingRight),
    bottom: px(css.paddingBottom), left: px(css.paddingLeft)
  };
  probe.remove();
  return result;
}

function logicalSafeArea(scene) {
  const W = scene.scale.gameSize.width;
  const H = scene.scale.gameSize.height;
  const viewport = window.visualViewport;
  const cssW = Math.max(1, Number(viewport?.width) || window.innerWidth || W);
  const cssH = Math.max(1, Number(viewport?.height) || window.innerHeight || H);
  const px = readSafeAreaInsets();
  return {
    top: px.top * H / cssH,
    right: px.right * W / cssW,
    bottom: px.bottom * H / cssH,
    left: px.left * W / cssW
  };
}

function restoreJoystick(scene) {
  const polish = scene.__mobileHudPolish;
  if (!polish || scene.joy?.active) return;
  scene.joyBase?.setPosition?.(polish.joyRestX, polish.joyRestY).setAlpha?.(.22);
  scene.joyKnob?.setPosition?.(polish.joyRestX, polish.joyRestY).setAlpha?.(.32);
}

function clampJoystickOrigin(scene, pointer) {
  if (!scene.joy?.active || scene.joy.id !== pointer.id) return;
  const polish = scene.__mobileHudPolish;
  if (!polish) return;
  const { safeInsets, railHeight } = polish;
  const radius = Number(scene.joy.radius) || 62;
  const minX = safeInsets.left + radius + 14;
  const maxX = scene.scale.gameSize.width - safeInsets.right - radius - 14;
  const minY = railHeight + radius + 14;
  const maxY = scene.scale.gameSize.height - safeInsets.bottom - radius - 14;
  const x = Phaser.Math.Clamp(pointer.x, Math.min(minX, maxX), Math.max(minX, maxX));
  const y = Phaser.Math.Clamp(pointer.y, Math.min(minY, maxY), Math.max(minY, maxY));
  scene.joy.origin.set(x, y);
  scene.joy.current.set(x, y);
  scene.joyBase?.setPosition?.(x, y).setAlpha?.(.64);
  scene.joyKnob?.setPosition?.(x, y).setAlpha?.(.88);
}

function installSafeJoystick(scene) {
  if (scene.__mobileHudSafeJoystickInstalled || !scene.input) return;
  scene.__mobileHudSafeJoystickInstalled = true;
  const onDown = pointer => clampJoystickOrigin(scene, pointer);
  const onRelease = () => requestAnimationFrame(() => restoreJoystick(scene));
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointerup', onRelease);
  scene.input.on('pointerupoutside', onRelease);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointerup', onRelease);
    scene.input.off('pointerupoutside', onRelease);
  });
}

function layout(scene) {
  const W = scene.scale.gameSize.width;
  const H = scene.scale.gameSize.height;
  const safe = logicalSafeArea(scene);
  scene.children.list.filter(object => object?.name === 'mobile-hud-polish').forEach(object => object.destroy());
  scene.children.list
    .filter(object => object?.name === 'c1-hud-shade' || object?.name === 'c2-hud-shade')
    .forEach(object => object.setVisible(false));

  const contentH = 62;
  const hudH = safe.top + contentH;
  scene.add.rectangle(W / 2, hudH / 2, W, hudH, 0x090d13, .95)
    .setDepth(916).setScrollFactor(0).setName('mobile-hud-polish');
  scene.add.rectangle(W / 2, hudH - 1, W, 2, 0x68737e, .34)
    .setDepth(917).setScrollFactor(0).setName('mobile-hud-polish');
  scene.add.rectangle(W / 2, safe.top + 1, W, 1, 0xf2d19b, .07)
    .setDepth(917).setScrollFactor(0).setName('mobile-hud-polish');

  const edgeLeft = Math.max(16, safe.left + 12);
  const edgeRight = Math.max(16, safe.right + 12);
  const top = safe.top;
  scene.titleText.setPosition(edgeLeft, top + 8).setFontSize(17).setDepth(920).setScrollFactor(0);
  scene.waveText.setPosition(edgeLeft, top + 34).setOrigin(0, 0).setFontSize(10).setDepth(920).setScrollFactor(0);
  scene.timerText.setPosition(W - edgeRight, top + 8).setOrigin(1, 0).setFontSize(14).setDepth(920).setScrollFactor(0);

  const usableW = Math.max(320, W - edgeLeft - edgeRight);
  const barW = Phaser.Math.Clamp(Math.round(usableW * .42), 250, 460);
  const barX = (edgeLeft + (W - edgeRight)) / 2;
  const barY = top + 42;
  const barLeft = barX - barW / 2;
  const barRight = barX + barW / 2;

  scene.levelText.setPosition(barLeft, top + 8).setOrigin(0, 0).setFontSize(11).setDepth(922).setScrollFactor(0);
  scene.scrapText.setPosition(barRight, top + 8).setOrigin(1, 0).setFontSize(11).setDepth(922).setScrollFactor(0);
  scene.xpBg?.destroy?.();
  scene.xpFill?.destroy?.();
  scene.xpBg = scene.add.rectangle(barX, barY, barW, 11, 0x111820, .98)
    .setStrokeStyle(1.5, 0x66727d, .7).setDepth(918).setScrollFactor(0);
  scene.xpFill = scene.add.rectangle(barLeft + 3, barY, barW - 6, 7, 0x55d7e5, 1)
    .setOrigin(0, .5).setDepth(919).setScrollFactor(0);

  scene.hint.setPosition(W / 2, H - safe.bottom - 8).setFontSize(9).setDepth(800).setScrollFactor(0);
  const joyRestX = edgeLeft + 64;
  const joyRestY = H - safe.bottom - 96;
  scene.__mobileHudPolish = {
    width: W, height: H, railHeight: hudH, contentHeight: contentH,
    edgeLeft, edgeRight, safeInsets: safe, joyRestX, joyRestY
  };
  restoreJoystick(scene);
  scene.refreshProgressHud?.();
  applySuppressedState(scene);
}

function installOverlayStateOwnership(scene) {
  // Upgrade-overlay visibility hooks are installed once. End-run ownership is versioned
  // independently so a newer production owner can replace a stale cached implementation.
  if (!scene.__mobileHudOverlayOwnershipInstalled) {
    scene.__mobileHudOverlayOwnershipInstalled = true;
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
  }

  if (scene.__mobileHudEndRunOwnerVersion === END_RUN_OWNER_VERSION) return;
  scene.__mobileHudEndRunOwnerVersion = END_RUN_OWNER_VERSION;

  scene.endRun = function(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    if (this.spawnEvent) this.spawnEvent.paused = true;
    if (this.waveEvent) this.waveEvent.paused = true;
    this.hero.setVelocity(0, 0);
    this.cameras.main.shake(220, .0065);
    this.playTone?.(90, .30, 'sawtooth', .035, -55);

    const W = this.scale.width || this.cameras.main.width || 960;
    const H = this.scale.height || this.cameras.main.height || 540;
    const safe = this.__mobileHudPolish?.safeInsets || { top: 0, right: 0, bottom: 0, left: 0 };
    const usableTop = safe.top;
    const usableBottom = H - safe.bottom;
    const centerY = (usableTop + usableBottom) / 2;

    ['UpgradeScene', 'UpgradeSceneV2', 'UpgradeSceneV3', 'UpgradeSceneV4'].forEach(key => {
      if (this.scene.isActive?.(key)) this.scene.stop(key);
    });
    this.upgradeOpen = false;
    this.input.enabled = true;
    this.setGameplayHudVisible?.(false);

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x080c11, .93)
      .setDepth(6000).setScrollFactor(0).setName('run-end-overlay');
    const kicker = this.add.text(W / 2, centerY - 92, 'RUN COMPLETE', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#7f8b96', letterSpacing: 2
    }).setOrigin(.5).setDepth(6001).setScrollFactor(0).setName('run-end-kicker');
    const heading = this.add.text(W / 2, centerY - 54, reason, {
      fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#d96d4d', align: 'center'
    }).setOrigin(.5).setDepth(6001).setScrollFactor(0).setName('run-end-title');
    const summary = this.add.text(W / 2, centerY - 10, `SURVIVED ${Math.floor(this.runTime)}s  •  SCRAP ${this.scrap}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#c5ccd4', align: 'center'
    }).setOrigin(.5).setDepth(6001).setScrollFactor(0).setName('run-end-summary');
    const btn = this.add.rectangle(W / 2, centerY + 72, 246, 58, 0xbc7b46)
      .setStrokeStyle(2, 0xf1c988, .58)
      .setDepth(6001).setScrollFactor(0).setName('run-end-button').setInteractive({ useHandCursor: true });
    const buttonLabel = this.add.text(W / 2, centerY + 72, 'RUN AGAIN', {
      fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#171d26'
    }).setOrigin(.5).setDepth(6002).setScrollFactor(0).setName('run-end-button-label');

    let reportBtn = null;
    let reportLabel = null;
    let reportStatus = null;
    const telemetryTestMode = (() => {
      try { return new URLSearchParams(window.location.search).get('wmTelemetry') === '1'; }
      catch { return false; }
    })();
    if (telemetryTestMode) {
      reportBtn = this.add.rectangle(W / 2, centerY + 142, 220, 42, 0x28333d, .98)
        .setStrokeStyle(1.5, 0x69c8d5, .78)
        .setDepth(6001).setScrollFactor(0).setName('run-end-report-button').setInteractive({ useHandCursor: true });
      reportLabel = this.add.text(W / 2, centerY + 142, 'SEND REPORT', {
        fontFamily: 'Arial Black, Arial', fontSize: '14px', color: '#d7f5f8'
      }).setOrigin(.5).setDepth(6002).setScrollFactor(0).setName('run-end-report-button-label');
      reportStatus = this.add.text(W / 2, centerY + 177, 'Telemetry: ready', {
        fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#8f9ca8', align: 'center', wordWrap: { width: Math.max(280, W - 80) }
      }).setOrigin(.5).setDepth(6002).setScrollFactor(0).setName('run-end-report-status');
      reportBtn.on('pointerdown', async () => {
        if (this.__manualReportSending) return;
        this.__manualReportSending = true;
        reportBtn.disableInteractive?.().setAlpha?.(.72);
        reportLabel.setText('SENDING…');
        reportStatus.setColor?.('#c7d0d8');
        reportStatus.setText('Telemetry: FINALIZE → QUEUE → HTTP');
        try {
          const sendReport = window.__WM_TELEMETRY_RUNTIME__?.sendReport;
          if (typeof sendReport !== 'function') throw new Error('telemetry sendReport unavailable');
          const result = await sendReport(reason || 'MANUAL REPORT');
          window.__WM_LAST_MANUAL_REPORT_RESULT__ = result;
          if (result?.ok) {
            reportLabel.setText('REPORT SENT');
            reportStatus.setColor?.('#87d79b');
            const http = result.httpStatus ? ` • HTTP ${result.httpStatus}` : '';
            const bytes = result.bytes ? ` • ${result.bytes} B` : '';
            reportStatus.setText(`SENT • ${result.reportId || 'report'}${http}${bytes}`);
            document.documentElement.dataset.wreckmarchManualReport = 'sent';
          } else {
            reportLabel.setText('RETRY REPORT');
            reportStatus.setColor?.('#f0a082');
            const stage = String(result?.stage || 'unknown').toUpperCase();
            const error = String(result?.error || 'send failed').replace(/\s+/g, ' ').slice(0, 88);
            const http = result?.httpStatus ? ` • HTTP ${result.httpStatus}` : '';
            reportStatus.setText(`ERROR ${stage} • ${error}${http}`);
            document.documentElement.dataset.wreckmarchManualReport = `error-${String(result?.stage || 'unknown')}`;
            reportBtn.setInteractive?.({ useHandCursor: true }).setAlpha?.(1);
          }
        } catch (error) {
          const result = { ok: false, stage: 'ui', error: String(error?.message || error) };
          window.__WM_LAST_MANUAL_REPORT_RESULT__ = result;
          reportLabel.setText('RETRY REPORT');
          reportStatus.setColor?.('#f0a082');
          reportStatus.setText(`ERROR UI • ${result.error}`);
          document.documentElement.dataset.wreckmarchManualReport = 'error-ui';
          reportBtn.setInteractive?.({ useHandCursor: true }).setAlpha?.(1);
        } finally {
          this.__manualReportSending = false;
        }
      });
    }

    window.__WM_END_RUN_LAYOUT__ = { width: W, height: H, overlay, kicker, heading, summary, btn, buttonLabel, reportBtn, reportLabel, reportStatus };
    document.documentElement.dataset.wreckmarchEndRunLayout = END_RUN_OWNER_VERSION;
    this.restartRun = () => {
      if (this.__runRestarting) return;
      this.__runRestarting = true;
      btn.disableInteractive?.().setAlpha?.(.7);
      buttonLabel.setText('RESTARTING…');
      document.documentElement.dataset.wreckmarchRunRestart = 'reloading';
      window.location.reload();
    };
    btn.on('pointerdown', () => this.restartRun());
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
  installSafeJoystick(scene);
  scene.children.list
    .filter(object => object?.name === 'c1-hud-shade' || object?.name === 'c2-hud-shade')
    .forEach(object => object.setVisible(false));
  layout(scene);
  if (!scene.__gameplayHudSuppressed) document.documentElement.dataset.wreckmarchGameplayHud = 'visible';

  let relayoutFrame = 0;
  const relayout = () => {
    cancelAnimationFrame(relayoutFrame);
    relayoutFrame = requestAnimationFrame(() => layout(scene));
  };
  window.addEventListener('resize', relayout, { passive: true });
  window.visualViewport?.addEventListener?.('resize', relayout, { passive: true });
  window.visualViewport?.addEventListener?.('scroll', relayout, { passive: true });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    cancelAnimationFrame(relayoutFrame);
    window.removeEventListener('resize', relayout);
    window.visualViewport?.removeEventListener?.('resize', relayout);
    window.visualViewport?.removeEventListener?.('scroll', relayout);
  });

  document.documentElement.dataset.wreckmarchMobileHud = 'compact-v2';
  return scene.__mobileHudPolish;
}
