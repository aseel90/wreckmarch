/* WRECKMARCH — live player damage boundary */
import { DEFAULT_PLAYER_COMBAT_PROFILE, resolvePlayerContactHit } from './player-damage-rules.js?v=3';

export class PlayerDamageSystem {
  /** @param {any} scene */
  constructor(scene) {
    this.scene = scene;
  }

  getProfile() {
    return this.scene.playerCombatProfile || this.scene.characterDefinition?.combat || DEFAULT_PLAYER_COMBAT_PROFILE;
  }

  hitByContact(hero, enemy) {
    const scene = this.scene;
    if (!enemy?.active || !hero?.active) return null;

    const now = scene.time.now;
    const profile = this.getProfile();
    const result = resolvePlayerContactHit({
      currentHp: scene.heroHp,
      lastHitAt: scene.lastHeroHit,
      now,
      enemyDamage: enemy.damage,
      heroX: hero.x,
      heroY: hero.y,
      enemyX: enemy.x,
      enemyY: enemy.y,
      profile,
      shieldCharges: scene.heroShieldCharges,
      armor: scene.runCombatStats?.armor
    });
    if (result.ignored) return result;

    scene.lastHeroHit = now;
    scene.heroShieldCharges = result.nextShieldCharges;
    scene.heroHp = result.nextHp;
    scene.heroInvulnMs = Math.max(0, Number(profile.invulnerabilityMs) || DEFAULT_PLAYER_COMBAT_PROFILE.invulnerabilityMs);
    scene.heroKnockback.set(result.knockbackX, result.knockbackY);
    scene.heroKnockbackUntil = result.knockbackUntil;

    if (result.shieldAbsorbed) {
      try {
        scene.runTelemetry?.recordShieldAbsorb?.({ preventedDamage: result.preventedDamage, source: enemy?.__sawbugAcidImpact ? 'sawbug-acid' : enemy?.enemyId || 'contact' });
      } catch (error) {
        globalThis.__WM_LOG__?.(`Run Telemetry shield attribution failed: ${error?.message || error}`);
      }
      const ring = scene.add.circle(hero.x, hero.y, 38, 0x5ad9f0, .08)
        .setStrokeStyle(3, 0x9ff3ff, .92)
        .setDepth(79);
      scene.tweens.add({
        targets: ring,
        scale: 1.55,
        alpha: 0,
        duration: 220,
        ease: 'Quad.Out',
        onComplete: () => ring.destroy()
      });
      const shieldText = scene.add.text(hero.x, hero.y - 72, 'SHIELD', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '17px',
        color: '#9ff3ff',
        stroke: '#0a1820',
        strokeThickness: 4
      }).setOrigin(.5).setDepth(80);
      scene.tweens.add({
        targets: shieldText,
        y: shieldText.y - 28,
        alpha: 0,
        duration: 460,
        ease: 'Cubic.Out',
        onComplete: () => shieldText.destroy()
      });
      scene.playTone(420, .055, 'triangle', .018, 80);
    } else {
      // Damage feedback should read as a quick hit, not replace the Hunter art with a solid red silhouette.
      const requestedFlashDurationMs = Number.isFinite(Number(profile.hitFlashDurationMs)) ? Number(profile.hitFlashDurationMs) : DEFAULT_PLAYER_COMBAT_PROFILE.hitFlashDurationMs;
      const hitFlashColor = 0xff9a8c;
      const hitFlashAlpha = .88;
      const hitFlashDurationMs = Phaser.Math.Clamp(requestedFlashDurationMs, 35, 50);
      const hitFlashRepeats = 0;

      hero.setTint(hitFlashColor);
      scene.tweens.add({
        targets: hero,
        alpha: hitFlashAlpha,
        duration: hitFlashDurationMs,
        yoyo: true,
        repeat: hitFlashRepeats,
        onComplete: () => {
          if (scene.hero?.active) {
            scene.hero.clearTint();
            scene.hero.setAlpha(1);
          }
        }
      });

      scene.cameras.main.shake(70, .0032);
      scene.playTone(110, .055, 'square', .022, -45);

      const damageText = scene.add.text(hero.x, hero.y - 72, `-${result.appliedDamage}`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '18px',
        color: '#ff7768',
        stroke: '#160e0d',
        strokeThickness: 4
      }).setOrigin(.5).setDepth(80);
      scene.tweens.add({
        targets: damageText,
        y: damageText.y - 34,
        alpha: 0,
        duration: 520,
        ease: 'Cubic.Out',
        onComplete: () => damageText.destroy()
      });
    }

    if (result.killed) {
      // Finalize telemetry at the authoritative lethal-damage boundary before any game-over runtime can pause or replace endRun.
      try {
        const telemetry = scene.runTelemetry;
        if (telemetry && !telemetry.finalized) telemetry.finalize('RUNNER DOWN');
      } catch (error) {
        globalThis.__WM_LOG__?.(`Run Telemetry lethal finalize failed: ${error?.message || error}`);
      }
      scene.endRun('RUNNER DOWN');
    }
    return result;
  }
}
