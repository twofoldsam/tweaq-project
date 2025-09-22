import { OverlayMode } from '../types';

// DISABLED: Old overlay system - all functions replaced by modern-overlay-injector.js

export interface OverlayOptions {
  initialMode?: OverlayMode;
}

export const injectOverlay = (_options: OverlayOptions = {}) => {
  // DISABLED: This old overlay system is replaced by modern-overlay-injector.js
  console.warn('⚠️ Old overlay system disabled - using modern injector instead');
  return;
};

export const removeOverlay = () => {
  // DISABLED: This old overlay system is replaced by modern-overlay-injector.js
  console.warn('⚠️ Old overlay system disabled - using modern injector instead');
  return;
};

export const toggleOverlay = (_options: OverlayOptions = {}) => {
  // DISABLED: This old overlay system is replaced by modern-overlay-injector.js
  console.warn('⚠️ Old overlay system disabled - using modern injector instead');
  return;
};

// Expose to window for easy access in preload scripts
declare global {
  interface Window {
    TweaqOverlay: {
      inject: typeof injectOverlay;
      remove: typeof removeOverlay;
      toggle: typeof toggleOverlay;
    };
  }
}

if (typeof window !== 'undefined') {
  window.TweaqOverlay = {
    inject: injectOverlay,
    remove: removeOverlay,
    toggle: toggleOverlay,
  };
}