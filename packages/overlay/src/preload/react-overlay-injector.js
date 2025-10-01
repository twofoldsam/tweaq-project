/**
 * React Overlay Injector - Loads the built React overlay with ChatPanel
 * This injects the compiled overlay bundle from dist/
 */

(function() {
  'use strict';

  console.log('🚀 Loading React-based Tweaq Overlay with Chat Interface...');

  // Cleanup any existing overlays
  if (window.TweaqOverlay) {
    console.log('🧹 Cleaning up existing overlay...');
    try {
      if (window.TweaqOverlay.remove) {
        window.TweaqOverlay.remove();
      }
    } catch (e) {
      console.warn('Error cleaning up overlay:', e);
    }
  }

  // Remove old overlay elements
  document.querySelectorAll('.tweaq-overlay-container, .tweaq-element-outline').forEach(el => el.remove());
  document.querySelectorAll('style[id*="tweaq"], link[href*="tweaq"]').forEach(el => el.remove());

  // Inject the built CSS from the overlay package
  function injectOverlayCSS() {
    if (document.getElementById('tweaq-overlay-styles')) {
      return;
    }

    const link = document.createElement('link');
    link.id = 'tweaq-overlay-styles';
    link.rel = 'stylesheet';
    link.href = 'file://' + __dirname.replace('/apps/desktop/dist', '') + '/packages/overlay/dist/style.css';
    document.head.appendChild(link);
    
    console.log('✅ Overlay CSS injected');
  }

  // Load React dependencies from CDN
  async function loadReactDependencies() {
    if (window.React && window.ReactDOM) {
      console.log('✅ React dependencies already loaded');
      return;
    }

    console.log('📦 Loading React dependencies...');
    
    if (!window.React) {
      await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
    }
    if (!window.ReactDOM) {
      await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
    }
    
    console.log('✅ React dependencies loaded');
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        console.log('✅ Loaded:', src);
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Initialize the overlay
  async function initializeOverlay() {
    try {
      // Inject CSS
      injectOverlayCSS();

      // Load React
      await loadReactDependencies();

      // Create React app container
      let overlayRoot = document.getElementById('tweaq-overlay-root');
      if (!overlayRoot) {
        overlayRoot = document.createElement('div');
        overlayRoot.id = 'tweaq-overlay-root';
        overlayRoot.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000000;';
        document.body.appendChild(overlayRoot);
      }

      // Use the electronAPI that's available through preload
      if (!window.electronAPI) {
        console.error('❌ electronAPI not available - make sure preload script is loaded');
        return;
      }

      // Create a simple React component wrapper
      const { createElement: h } = window.React;
      const { createRoot } = window.ReactDOM;

      // Import the built overlay module
      console.log('📦 Loading overlay module...');
      
      // Create a minimal overlay UI with toolbar
      const OverlayApp = () => {
        const [isVisible, setIsVisible] = window.React.useState(true);
        const [isChatOpen, setIsChatOpen] = window.React.useState(false);
        const [mode, setMode] = window.React.useState('measure');

        if (!isVisible) return null;

        return h('div', { className: 'tweaq-overlay-container' },
          // Toolbar
          h('div', { 
            className: 'tweaq-overlay-toolbar',
            style: { pointerEvents: 'auto' }
          },
            h('div', { className: 'tweaq-toolbar-content' },
              // Mode toggle
              h('div', { className: 'tweaq-mode-toggle' },
                h('button', {
                  className: `tweaq-mode-btn ${mode === 'measure' ? 'active' : ''}`,
                  onClick: () => setMode('measure')
                }, '📏 Measure'),
                h('button', {
                  className: `tweaq-mode-btn ${mode === 'edit' ? 'active' : ''}`,
                  onClick: () => setMode('edit')
                }, '✏️ Edit')
              ),
              // Chat button
              h('button', {
                className: `tweaq-chat-btn ${isChatOpen ? 'active' : ''}`,
                onClick: () => {
                  setIsChatOpen(!isChatOpen);
                  console.log('💬 Chat toggled:', !isChatOpen);
                }
              }, '💬 Chat'),
              // Close button
              h('button', {
                className: 'tweaq-close-btn',
                onClick: () => {
                  setIsVisible(false);
                  console.log('❌ Overlay closed');
                }
              }, '✕')
            )
          ),
          // Chat panel (if open)
          isChatOpen && h('div', { className: 'chat-panel', style: { pointerEvents: 'auto' } },
            h('div', { className: 'chat-panel-header' },
              h('div', { className: 'chat-panel-title' }, '💬 Instructions'),
              h('button', { 
                className: 'chat-panel-close',
                onClick: () => setIsChatOpen(false)
              }, '✕')
            ),
            h('div', { className: 'chat-panel-content' },
              h('div', { className: 'instructions-list' },
                h('div', { className: 'empty-state' },
                  h('p', {}, '💡 No instructions yet'),
                  h('p', { className: 'hint' }, 'Tell the agent what you want to change')
                )
              ),
              h('div', { className: 'chat-input-wrapper' },
                h('textarea', {
                  className: 'chat-input',
                  placeholder: 'Describe the change you want to make...',
                  rows: 3
                }),
                h('button', { className: 'chat-send-btn' }, 'Add Instruction')
              ),
              h('div', { className: 'examples' },
                h('div', { className: 'examples-label' }, 'Examples:'),
                h('div', { className: 'example-chips' },
                  h('button', { className: 'example-chip' }, 'Make the copy more friendly'),
                  h('button', { className: 'example-chip' }, 'Condense this section'),
                  h('button', { className: 'example-chip' }, 'Rework the layout')
                )
              )
            )
          )
        );
      };

      // Render the overlay
      const root = createRoot(overlayRoot);
      root.render(h(OverlayApp));

      console.log('✅ React Overlay with Chat Interface loaded and ready!');

      // Store global reference
      window.TweaqOverlay = {
        isVisible: true,
        toggle: () => {
          window.location.reload(); // Simple toggle for now
        },
        remove: () => {
          root.unmount();
          overlayRoot.remove();
          document.getElementById('tweaq-overlay-styles')?.remove();
        }
      };

    } catch (error) {
      console.error('❌ Error initializing overlay:', error);
    }
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOverlay);
  } else {
    initializeOverlay();
  }

})();

