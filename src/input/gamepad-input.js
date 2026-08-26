/* WRECKMARCH — browser gamepad movement provider */

/** @typedef {{ value?: number, pressed?: boolean }} GamepadButtonLike */
/** @typedef {{ connected?: boolean, mapping?: string, axes?: number[], buttons?: GamepadButtonLike[] }} GamepadLike */
/** @typedef {{ x: number, y: number, set: (x: number, y: number) => MoveVector, length: () => number, lengthSq: () => number, normalize: () => MoveVector }} MoveVector */

const STANDARD_DPAD = Object.freeze({ up: 12, down: 13, left: 14, right: 15 });

function defaultGetGamepads() {
  try {
    return globalThis.navigator?.getGamepads?.() ?? [];
  } catch (_) {
    return [];
  }
}

function buttonDown(button) {
  return Boolean(button?.pressed || (button?.value ?? 0) > 0.5);
}

export class GamepadInput {
  /**
   * @param {{ getGamepads?: () => ArrayLike<GamepadLike | null>, deadzone?: number, preferredIndex?: number | null }} [options]
   */
  constructor(options = {}) {
    const { getGamepads = defaultGetGamepads, deadzone = 0.18, preferredIndex = null } = options;
    this.getGamepads = getGamepads;
    this.deadzone = Math.max(0, Math.min(0.95, deadzone));
    this.preferredIndex = preferredIndex;
  }

  /** @returns {GamepadLike | null} */
  getActiveGamepad() {
    let pads;
    try {
      pads = this.getGamepads?.() ?? [];
    } catch (_) {
      return null;
    }

    if (Number.isInteger(this.preferredIndex)) {
      const preferred = pads[this.preferredIndex];
      if (preferred?.connected !== false) return preferred;
    }

    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      if (pad && pad.connected !== false) return pad;
    }
    return null;
  }

  /** @param {MoveVector} out */
  readMove(out) {
    out.set(0, 0);
    const pad = this.getActiveGamepad();
    if (!pad) return out;

    let x = Number.isFinite(pad.axes?.[0]) ? pad.axes[0] : 0;
    let y = Number.isFinite(pad.axes?.[1]) ? pad.axes[1] : 0;
    const magnitude = Math.hypot(x, y);

    if (magnitude <= this.deadzone) {
      x = 0;
      y = 0;
    } else if (magnitude > 0) {
      const normalizedMagnitude = Math.min(1, (magnitude - this.deadzone) / (1 - this.deadzone));
      const scale = normalizedMagnitude / magnitude;
      x *= scale;
      y *= scale;
    }

    const buttons = pad.buttons ?? [];
    if (buttonDown(buttons[STANDARD_DPAD.left])) x -= 1;
    if (buttonDown(buttons[STANDARD_DPAD.right])) x += 1;
    if (buttonDown(buttons[STANDARD_DPAD.up])) y -= 1;
    if (buttonDown(buttons[STANDARD_DPAD.down])) y += 1;

    out.set(x, y);
    if (out.lengthSq() > 1) out.normalize();
    return out;
  }
}
