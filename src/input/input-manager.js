/* WRECKMARCH — normalized player input boundary */

import { GamepadInput } from './gamepad-input.js';

/** @typedef {{ isDown: boolean }} DirectionKey */
/** @typedef {{ left: DirectionKey, right: DirectionKey, up: DirectionKey, down: DirectionKey }} CursorKeys */
/** @typedef {{ createCursorKeys: () => CursorKeys }} KeyboardSource */
/** @typedef {{ active: boolean, origin: { x: number, y: number }, current: { x: number, y: number } }} JoystickSource */
/** @typedef {{ readMove: (out: MoveVector) => MoveVector }} MoveSource */
/** @typedef {{ x: number, y: number, set: (x: number, y: number) => MoveVector, length: () => number, lengthSq: () => number, normalize: () => MoveVector }} MoveVector */

function createMoveVector() {
  return {
    x: 0,
    y: 0,
    set(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
    length() {
      return Math.hypot(this.x, this.y);
    },
    lengthSq() {
      return this.x * this.x + this.y * this.y;
    },
    normalize() {
      const length = this.length();
      if (length > 0) {
        this.x /= length;
        this.y /= length;
      }
      return this;
    }
  };
}

export class InputManager {
  /**
   * @param {{ keyboard?: KeyboardSource | null, joystick?: JoystickSource | null, gamepad?: MoveSource | null, joystickDeadzone?: number }} [options]
   */
  constructor(options = {}) {
    const { keyboard = null, joystick = null, gamepad = new GamepadInput(), joystickDeadzone = 8 } = options;
    this.keyboard = keyboard;
    this.joystick = joystick;
    this.gamepad = gamepad;
    this.joystickDeadzone = joystickDeadzone;
    this.cursors = keyboard?.createCursorKeys?.() ?? null;
    this.gamepadMove = createMoveVector();
  }

  /** @param {JoystickSource | null} joystick */
  setJoystick(joystick) {
    this.joystick = joystick;
    return this;
  }

  /** @param {MoveSource | null} gamepad */
  setGamepad(gamepad) {
    this.gamepad = gamepad;
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

    if (this.gamepad?.readMove) {
      this.gamepad.readMove(this.gamepadMove);
      out.x += this.gamepadMove.x;
      out.y += this.gamepadMove.y;
      if (out.lengthSq() > 1) out.normalize();
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
