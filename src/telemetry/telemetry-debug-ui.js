/* WRECKMARCH — temporary manual telemetry debug control for wmTelemetry=1 */
function isTelemetryDebugEnabled() {
  try { return new URLSearchParams(globalThis.location?.search || '').get('wmTelemetry') === '1'; }
  catch { return false; }
}

function getScene(game) {
  return game?.scene?.getScene?.('Wreckmarch') || null;
}

function compactError(result) {
  const stage = String(result?.stage || 'unknown').toUpperCase();
  const error = String(result?.error || 'unknown_error').replace(/\s+/g, ' ').slice(0, 88);
  return `ERROR ${stage}: ${error}`;
}

function installButton(scene) {
  if (!scene?.gameOver || scene.__wreckmarchManualReportUi) return false;
  const layout = globalThis.__WM_END_RUN_LAYOUT__;
  if (!layout?.btn?.active) return false;

  const W = Number(layout.width) || Number(scene.scale?.width) || 960;
  const H = Number(layout.height) || Number(scene.scale?.height) || 540;
  const y = Math.min(H - 72, Number(layout.btn.y || H / 2 + 72) + 62);
  const statusY = Math.min(H - 34, y + 31);

  const reportBtn = scene.add.rectangle(W / 2, y, 210, 38, 0x274a5a, .98)
    .setStrokeStyle(1.5, 0x79d8e7, .7)
    .setDepth(6010).setScrollFactor(0).setName('run-end-report-button')
    .setInteractive({ useHandCursor: true });
  const label = scene.add.text(W / 2, y, 'SEND REPORT', {
    fontFamily: 'Arial Black, Arial', fontSize: '13px', color: '#d8f7fb'
  }).setOrigin(.5).setDepth(6011).setScrollFactor(0).setName('run-end-report-button-label');
  const status = scene.add.text(W / 2, statusY, 'Telemetry debug ready', {
    fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#8f9ca8', align: 'center',
    wordWrap: { width: Math.min(520, W - 48) }
  }).setOrigin(.5).setDepth(6011).setScrollFactor(0).setName('run-end-report-status');

  layout.reportBtn = reportBtn;
  layout.reportButtonLabel = label;
  layout.reportStatus = status;
  scene.__wreckmarchManualReportUi = { reportBtn, label, status };

  reportBtn.on('pointerdown', async () => {
    if (scene.__wreckmarchManualReportSending) return;
    scene.__wreckmarchManualReportSending = true;
    reportBtn.disableInteractive?.();
    reportBtn.setAlpha?.(.72);
    label.setText('SENDING…');
    status.setColor?.('#c7d0d8');
    status.setText('FINALIZE → QUEUE → HTTP…');

    try {
      const sender = globalThis.__WM_TELEMETRY_RUNTIME__?.sendReport;
      if (typeof sender !== 'function') throw new Error('telemetry_sender_unavailable');
      const result = await sender('MANUAL REPORT');
      globalThis.__WM_LAST_MANUAL_REPORT_RESULT__ = result;

      if (result?.ok) {
        label.setText('REPORT SENT');
        const http = result.httpStatus ? ` • HTTP ${result.httpStatus}` : '';
        const bytes = result.bytes ? ` • ${result.bytes} B` : '';
        status.setColor?.('#7ee0a1');
        status.setText(`SENT ${result.reportId}${http}${bytes}`);
        document.documentElement.dataset.wreckmarchManualReport = 'sent';
        return;
      }

      label.setText('RETRY REPORT');
      status.setColor?.('#ff9b7c');
      status.setText(compactError(result));
      document.documentElement.dataset.wreckmarchManualReport = `error-${String(result?.stage || 'unknown')}`;
    } catch (error) {
      const result = { ok: false, stage: 'ui', error: String(error?.message || error) };
      globalThis.__WM_LAST_MANUAL_REPORT_RESULT__ = result;
      label.setText('RETRY REPORT');
      status.setColor?.('#ff9b7c');
      status.setText(compactError(result));
      document.documentElement.dataset.wreckmarchManualReport = 'error-ui';
    } finally {
      scene.__wreckmarchManualReportSending = false;
      if (label.text !== 'REPORT SENT') {
        reportBtn.setInteractive?.({ useHandCursor: true });
        reportBtn.setAlpha?.(1);
      }
    }
  });

  document.documentElement.dataset.wreckmarchTelemetryDebugUi = 'armed';
  return true;
}

export function installTelemetryDebugUi(game = globalThis.__WM_GAME__) {
  if (!isTelemetryDebugEnabled() || !game?.events) return false;
  if (game.__wreckmarchTelemetryDebugUi) return true;

  const eventName = globalThis.Phaser?.Core?.Events?.POST_STEP || 'poststep';
  const tick = () => {
    const scene = getScene(game);
    if (scene?.sys?.isActive?.() && scene.gameOver) installButton(scene);
  };

  game.events.on(eventName, tick);
  game.__wreckmarchTelemetryDebugUi = { eventName, tick };
  try { globalThis.__WM_TELEMETRY_DEBUG_UI__ = { active: true, eventName }; } catch {}
  return true;
}
