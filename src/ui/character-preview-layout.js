/* WRECKMARCH — generic DOM preview composition adapter.
 * Converts character-owned logical art geometry into percentages for the frontend shell.
 * It owns no character-specific constants and has no gameplay/runtime activation role.
 */

function finite(value, label) {
  if (!Number.isFinite(value)) throw Error(`Character preview ${label} must be finite`);
  return value;
}

function positive(value, label) {
  const number = finite(value, label);
  if (number <= 0) throw Error(`Character preview ${label} must be positive`);
  return number;
}

export function resolveCharacterPreviewLayout(composition) {
  if (!composition) return null;

  const bodyWidth = positive(composition.bodyCanvas?.width, 'body canvas width');
  const bodyHeight = positive(composition.bodyCanvas?.height, 'body canvas height');
  const weaponWidth = positive(composition.weaponCanvas?.width, 'weapon canvas width');
  const weaponHeight = positive(composition.weaponCanvas?.height, 'weapon canvas height');
  const originX = finite(composition.bodyRender?.originX, 'body origin X');
  const originY = finite(composition.bodyRender?.originY, 'body origin Y');
  const scale = positive(composition.bodyRender?.scale, 'body scale');
  const gripX = finite(composition.gripSocket?.offsetX, 'grip socket X');
  const gripY = finite(composition.gripSocket?.offsetY, 'grip socket Y');
  const weaponOriginX = finite(composition.weaponOrigin?.x, 'weapon origin X');
  const weaponOriginY = finite(composition.weaponOrigin?.y, 'weapon origin Y');

  const weaponLeft = (bodyWidth * originX) + (gripX / scale) - (weaponWidth * weaponOriginX);
  const weaponTop = (bodyHeight * originY) + (gripY / scale) - (weaponHeight * weaponOriginY);

  return Object.freeze({
    stageAspectRatio: `${bodyWidth} / ${bodyHeight}`,
    weaponLeftPercent: (weaponLeft / bodyWidth) * 100,
    weaponTopPercent: (weaponTop / bodyHeight) * 100,
    weaponWidthPercent: (weaponWidth / bodyWidth) * 100,
    weaponHeightPercent: (weaponHeight / bodyHeight) * 100,
  });
}
