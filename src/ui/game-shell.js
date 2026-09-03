import { SCREEN_IDS, getScreenDefinition } from './screen-registry.js';

/*
 * Canonical owner for navigation between Wreckmarch front-end screens.
 * This foundation intentionally does not render UI or start/stop Phaser scenes yet.
 */
export class GameShell {
  constructor({ initialScreen = SCREEN_IDS.CHARACTER_SELECT } = {}) {
    getScreenDefinition(initialScreen);
    this.currentScreenId = initialScreen;
    this.listeners = new Set();
  }

  get currentScreen() {
    return getScreenDefinition(this.currentScreenId);
  }

  navigate(screenId) {
    const next = getScreenDefinition(screenId);
    if (next.id === this.currentScreenId) return next;
    const previous = this.currentScreen;
    this.currentScreenId = next.id;
    this.listeners.forEach(listener => listener(next, previous));
    return next;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('GameShell subscriber must be a function');
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export function createGameShell(options) {
  return new GameShell(options);
}
