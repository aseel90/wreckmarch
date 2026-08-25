/* WRECKMARCH — normalized player input boundary */
export class InputManager {
  constructor({ keyboard = null, joystick = null, joystickDeadzone = 8 } = {}) {
    this.keyboard = keyboard;
    this.joystick = joystick;
    this.joystickDeadzone = joystickDeadzone;
    this.cursors = keyboard?.createCursorKeys?.() ?? null;
  }

  setJoystick(joystick) {
    this.joystick = joystick;
    return this;
  }

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
