import { describe, expect, it } from 'vitest';
import { GamepadInput } from '../../src/input/gamepad-input.js';

class TestVector {
  x = 0;
  y = 0;

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  length() {
    return Math.hypot(this.x, this.y);
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    const length = this.length();
    if (length > 0) {
      this.x /= length;
      this.y /= length;
    }
    return this;
  }
}

const buttons = () => Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));

describe('GamepadInput', () => {
  it('returns neutral movement when no controller is connected', () => {
    const input = new GamepadInput({ getGamepads: () => [] });
    const out = new TestVector().set(1, 1);

    input.readMove(out);

    expect(out.x).toBe(0);
    expect(out.y).toBe(0);
  });

  it('suppresses left-stick drift inside the radial deadzone', () => {
    const input = new GamepadInput({
      getGamepads: () => [{ connected: true, axes: [0.1, -0.08], buttons: buttons() }]
    });
    const out = new TestVector();

    input.readMove(out);

    expect(out.x).toBe(0);
    expect(out.y).toBe(0);
  });

  it('preserves analog stick power after removing the deadzone', () => {
    const input = new GamepadInput({
      deadzone: 0.2,
      getGamepads: () => [{ connected: true, axes: [0.6, 0], buttons: buttons() }]
    });
    const out = new TestVector();

    input.readMove(out);

    expect(out.x).toBeCloseTo(0.5);
    expect(out.y).toBe(0);
  });

  it('supports the standard d-pad button mapping', () => {
    const padButtons = buttons();
    padButtons[12] = { pressed: true, value: 1 };
    padButtons[15] = { pressed: true, value: 1 };
    const input = new GamepadInput({
      getGamepads: () => [{ connected: true, axes: [0, 0], buttons: padButtons }]
    });
    const out = new TestVector();

    input.readMove(out);

    expect(out.length()).toBeCloseTo(1);
    expect(out.x).toBeCloseTo(Math.SQRT1_2);
    expect(out.y).toBeCloseTo(-Math.SQRT1_2);
  });

  it('falls back to the first connected controller when the preferred one disconnects', () => {
    const input = new GamepadInput({
      preferredIndex: 1,
      getGamepads: () => [
        { connected: true, axes: [-1, 0], buttons: buttons() },
        { connected: false, axes: [1, 0], buttons: buttons() }
      ]
    });
    const out = new TestVector();

    input.readMove(out);

    expect(out.x).toBe(-1);
    expect(out.y).toBe(0);
  });
});
