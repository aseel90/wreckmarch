/* WRECKMARCH — live player damage boundary */
import { DEFAULT_PLAYER_COMBAT_PROFILE, resolvePlayerContactHit } from './player-damage-rules.js?v=1';

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
      profile
    });
    if (result.ignored) return result;

    scene.lastHeroHit = now;
    scene.heroHp = result.nextHp;
    scene.heroInvulnMs = Math.max(0, Number(profile.invulnerabilityMs) || DEFAULT_PLAYER_COMBAT_PROFILE.invulnerabilityMs);
    scene.heroKnockback.set(result.knockbackX, result.knockbackY);
    scene.heroKnockbackUntil = result.knockbackUntil;

    const hitFlashColor = Number.isFinite(Number(profile.hitFlashColor)) ? Number(profile.hitFlashColor) : DEFAULT_PLAYER_COMBAT_PROFILE.hitFlashColor;
    const hitFlashAlpha = Number.isFinite(Number(profile.hitFlashAlpha)) ? Number(profile.hitFlashAlpha) : DEFAULT_PLAYER_COMBAT_PROFILE.hitFlashAlpha;
    const hitFlashDurationMs = Math.max(0, Number.isFinite(Number(profile.hitFlashDurationMs)) ? Number(profile.hitFlashDurationMs) : DEFAULT_PLAYER_COMBAT_PROFILE.hitFlashDurationMs);
    const hitFlashRepeats = Math.max(0, Math.round(Number.isFinite(Number(profile.hitFlashRepeats)) ? Number(profile.hitFlashRepeats) : DEFAULT_PLAYER_COMBAT_PROFILE.hitFlashRepeats));

    hero.setTintFill(hitFlashColor);
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

    if (result.killed) scene.endRun('RUNNER DOWN');
    return result;
  }
}
