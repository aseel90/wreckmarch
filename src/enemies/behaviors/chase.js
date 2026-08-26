/* WRECKMARCH — baseline melee chase behavior */
export function updateChaseBehavior({ scene, enemy, target, random = Math.random }) {
  if (!enemy?.active || !target) return;
  const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
  const speed = Number(enemy.speed) || 0;
  enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  enemy.setFlipX(Math.cos(angle) < 0);
  if (random() < .012) scene.spawnDust?.(enemy.x, enemy.y + 22, .38);
}
