import { Game } from './game/Game.js';

declare global {
  interface Window {
    __arachnidGameStarted?: boolean;
  }
}

if (!window.__arachnidGameStarted) {
  window.__arachnidGameStarted = true;
  try {
    new Game();
    window.dispatchEvent(new CustomEvent('arachnid-ready'));
  } catch (error) {
    window.__arachnidGameStarted = false;
    throw error;
  }
}
