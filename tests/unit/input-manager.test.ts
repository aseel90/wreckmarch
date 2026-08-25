import { describe, expect, it, vi } from 'vitest';
import { InputManager } from '../../src/input/input-manager.js';

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

const cursorKeys = (down: Partial<Record<'left' | 'right' | 'up' | 'down', boolean>> = {}) => ({
  left: { isDown: Boolean(down.left) },
  right: { isDown: Boolean(down.right) },
  up: { isDown: Boolean(down.up) },
  down: { isDown: Boolean(down.down) }
});

describe('InputManager', () => {
  it('creates cursor keys once instead of once per frame', () => {
    const createCursorKeys = vi.fn(() => cursorKeys({ right: true }));
    const input = new InputManager({ keyboard: { createCursorKeys } });
    const out = new TestVector();

    input.readMove(out);
    input.readMove(out);

    expect(createCursorKeys).toHaveBeenCalledTimes(1);
    expect(out.x).toBe(1);
    expect(out.y).toBe(0);
  });

  it('preserves the current eight-pixel joystick deadzone', () => {
    const input = new InputManager({
      joystick: {
        active: true,
        origin: { x: 100, y: 100 },
        current: { x: 106, y: 104 }
      }
    });
    const out = new TestVector();

    input.readMove(out);

    expect(out.x).toBe(0);
    expect(out.y).toBe(0);
  });

  it('normalizes joystick movement outside the deadzone', () => {
    const input = new InputManager({
      joystick: {
        active: true,
        origin: { x: 10, y: 10 },
        current: { x: 40, y: 50 }
      }
    });
    const out = new TestVector();

    input.readMove(out);

    expect(out.length()).toBeCloseTo(1);
    expect(out.x).toBeCloseTo(0.6);
    expect(out.y).toBeCloseTo(0.8);
  });

  it('combines keyboard with touch movement using the legacy normalization rule', () => {
    const keyboard = { createCursorKeys: () => cursorKeys({ right: true }) };
    const input = new InputManager({
      keyboard,
      joystick: {
        active: true,
        origin: { x: 0, y: 0 },
        current: { x: 0, y: -20 }
      }
    });
    const out = new TestVector();

    input.readMove(out);

    expect(out.length()).toBeCloseTo(1);
    expect(out.x).toBeCloseTo(Math.SQRT1_2);
    expect(out.y).toBeCloseTo(-Math.SQRT1_2);
  });
});
