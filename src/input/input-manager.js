/* WRECKMARCH — normalized player input boundary */

/** @typedef {{ isDown: boolean }} DirectionKey */
/** @typedef {{ left: DirectionKey, right: DirectionKey, up: DirectionKey, down: DirectionKey }} CursorKeys */
/** @typedef {{ createCursorKeys: () => CursorKeys }} KeyboardSource */
/** @typedef {{ active: boolean, origin: { x: number, y: number }, current: { x: number, y: number } }} JoystickSource */
/** @typedef {{ x: number, y: number, set: (x: number, y: number) => MoveVector, length: () => number, lengthSq: () => number, normalize: () => MoveVector }} MoveVector */

export class InputManager {
  /**
   * @param {{ keyboard?: KeyboardSource | null, joystick?: JoystickSource | null, joystickDeadzone?: number }} [options]
   */
  constructor(options = {}) {
    const { keyboard = null, joystick = null, joystickDeadzone = 8 } = options;
    this.keyboard = keyboard;
    this.joystick = joystick;
    this.joystickDeadzone = joystickDeadzone;
    this.cursors = keyboard?.createCursorKeys?.() ?? null;
  }

  /** @param {JoystickSource | null} joystick */
  setJoystick(joystick) {
    this.joystick = joystick;
    return this;
  }

  /** @param {MoveVector} out */
  readMove(out) {
    out.set(0, 0);

    const joy = this.joystick;
    if (joy?.active) {
      out.set(joy.current.x - joy.origin.x, joy.current.y - joy.origin.y);
      if (out.length() > this.joystickDeadzone) out.normalize();
      else out.set(0, 0);
    }

    const cursors = this.cursors;
    if (cursors) {
      if (cursors.left.isDown) out.x -= 1;
      if (cursors.right.isDown) out.x += 1;
      if (cursors.up.isDown) out.y -= 1;
      if (cursors.down.isDown) out.y += 1;
      if (out.lengthSq() > 1) out.normalize();
    }

    return out;
  }
}
