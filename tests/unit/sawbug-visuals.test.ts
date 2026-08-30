import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const assetsDir = path.join(root, 'src/enemies/assets');

describe('Sawbug production frames', () => {
  it('ships exactly the minimal approved body and acid frame set', () => {
    const files = fs.readdirSync(assetsDir).filter(name => name.startsWith('sawbug-') && name.endsWith('.js'));
    const expected = [
      'sawbug-idle-0.js', 'sawbug-idle-1.js',
      'sawbug-walk-0.js', 'sawbug-walk-1.js', 'sawbug-walk-2.js', 'sawbug-walk-3.js',
      'sawbug-attack-0.js', 'sawbug-attack-1.js', 'sawbug-attack-2.js',
      'sawbug-projectile-0.js', 'sawbug-projectile-1.js',
      'sawbug-splash-0.js', 'sawbug-splash-1.js'
    ];
    expect(files.sort()).toEqual(expected.sort());
  });

  it('embeds transparent WebP master frames instead of external backgrounds', () => {
    for (const name of fs.readdirSync(assetsDir).filter(name => name.startsWith('sawbug-') && name.endsWith('.js'))) {
      const source = fs.readFileSync(path.join(assetsDir, name), 'utf8');
      expect(source).toContain('data:image/webp;base64,');
      expect(source).toContain('transparent baked Sawbug frame');
    }
  });

  it('canonicalizes baked frame base64 before browser decoding', () => {
    const source = fs.readFileSync(path.join(root, 'src/enemies/sawbug-visuals.js'), 'utf8');
    expect(source).toContain('canonicalizeBakedDataUrl');
    expect(source).toContain("replace(/=+$/, '')");
    expect(source).toContain("image.src = canonicalizeBakedDataUrl(source)");
  });

  it('keeps projectile and splash animation separate from the body animation', () => {
    const source = fs.readFileSync(path.join(root, 'src/enemies/sawbug-visuals.js'), 'utf8');
    expect(source).toContain("replaceAnimation(scene, 'sawbug-walk', WALK_KEYS, 8, -1)");
    expect(source).toContain("replaceAnimation(scene, 'sawbug-acid-attack', [ATTACK_KEYS[0]], 1, 0)");
    expect(source).toContain("replaceAnimation(scene, 'sawbug-acid-flight', PROJECTILE_KEYS, 10, -1)");
    expect(source).toContain("replaceAnimation(scene, 'sawbug-acid-splash', SPLASH_KEYS, 12, 0)");
  });

  it('keeps the browser self-test singleton and pending until the real acid shot resolves', () => {
    const source = fs.readFileSync(path.join(root, 'src/enemies/sawbug-visuals.js'), 'utf8');
    expect(source).toContain("document.documentElement.dataset.wreckmarchSawbugTest = 'running'");
    expect(source).toContain('function startBrowserSelfTest(scene)');
    expect(source).toContain('if (scene.__wmSawbugSelfTestStarted) return');
    expect(source).toContain('scene.__wmSawbugSelfTestStarted = true');
    expect(source).toContain("if (params.get('sawbugtest') !== '1' || scene.__wmSawbugSelfTestStarted) return");
    expect(source).toContain("if (document.body.classList.contains('visual-ready'))");
    expect(source).toContain('if (scene.__wmSawbugSelfTestObserver) return');
    expect(source).toContain('const observer = new MutationObserver');
    expect(source).toContain('scene.__wmSawbugSelfTestObserver = observer');
    expect(source).toContain("observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })");
    expect(source).toContain('scene.__wmSawbugSelfTestEnemy = sawbug || null');
    expect(source).toContain("sawbug.__sawbugState = null");
    expect(source).toContain("const status = ok ? 'passed' : 'running'");
    expect(source).not.toContain('SELF_TEST_TIMEOUT_MS');
    expect(source).toContain("const wallNow = () => globalThis.performance?.now?.() ?? Date.now()");
    expect(source).toContain('let completed = false');
    expect(source).toContain('if (completed) return');
    expect(source).toContain('if (ok) completed = true');
    expect(source).toContain('scene.__wmSawbugSelfTestRefresh = finishWhenShotObserved');
    expect(source).toContain('globalThis.setTimeout(finishWhenShotObserved, SELF_TEST_POLL_MS)');
    expect(source).not.toContain('scene.time?.delayedCall?.(SELF_TEST_POLL_MS, finishWhenShotObserved)');
  });
});
