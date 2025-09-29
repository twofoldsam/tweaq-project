// Modern Tweaq Overlay Injector - Uses the new React-based overlay system
// This script is injected into web pages to provide the enhanced overlay functionality

(function() {
  'use strict';

  // NUCLEAR cleanup - remove EVERYTHING overlay related
  console.log('🧹 NUCLEAR CLEANUP: Removing all overlay elements...');
  
  // Remove all possible overlay elements with any class containing 'tweaq'
  document.querySelectorAll('*').forEach(el => {
    if (el.className && typeof el.className === 'string' && el.className.includes('tweaq')) {
      console.log('🗑️ Removing element with class:', el.className);
      el.remove();
    }
  });
  
  // Remove all styles
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
    if (el.id && (el.id.includes('tweaq') || el.id.includes('smartqa'))) {
      console.log('🗑️ Removing style:', el.id);
      el.remove();
    }
    if (el.textContent && el.textContent.includes('tweaq')) {
      console.log('🗑️ Removing style with tweaq content');
      el.remove();
    }
  });
  
  // Reset ALL globals
  Object.keys(window).forEach(key => {
    if (key.toLowerCase().includes('tweaq') || key.toLowerCase().includes('overlay')) {
      console.log('🗑️ Deleting global:', key);
      try {
        delete window[key];
      } catch (e) {}
    }
  });
  
  // Remove event listeners by cloning and replacing body
  const newBody = document.body.cloneNode(true);
  document.body.parentNode.replaceChild(newBody, document.body);
  
  console.log('✅ NUCLEAR CLEANUP COMPLETE');

  // Load React and ReactDOM from CDN if not already available
  async function loadReactDependencies() {
    if (!window.React) {
      await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
    }
    if (!window.ReactDOM) {
      await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Inject the enhanced overlay styles
  function injectStyles() {
    if (document.getElementById('tweaq-overlay-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'tweaq-overlay-styles';
    style.textContent = `
      /* Tweaq Overlay Styles - Enhanced with Preview Controls */

      /* Element outline */
      .tweaq-element-outline {
        position: absolute;
        pointer-events: none;
        border: 2px solid #007acc;
        background-color: rgba(0, 122, 204, 0.1);
        z-index: 999999;
        transition: all 0.1s ease;
        box-shadow: 0 0 0 1px rgba(0, 122, 204, 0.3);
      }

      /* Main overlay container */
      .tweaq-overlay-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        font-size: 13px;
        line-height: 1.4;
      }

      /* Toolbar */
      .tweaq-overlay-toolbar {
        position: fixed;
        top: 20px;
        right: 20px;
        pointer-events: auto;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 36px;
      }

      .tweaq-toolbar-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .tweaq-mode-toggle {
        display: flex;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 6px;
        padding: 2px;
      }

      .tweaq-mode-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 10px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        color: #666;
        transition: all 0.15s ease;
      }

      .tweaq-mode-btn:hover {
        color: #333;
        background: rgba(0, 0, 0, 0.05);
      }

      .tweaq-mode-btn.active {
        background: #007acc;
        color: white;
        box-shadow: 0 1px 3px rgba(0, 122, 204, 0.3);
      }

      .tweaq-mode-btn svg {
        width: 14px;
        height: 14px;
      }

      .tweaq-current-mode {
        display: flex;
        align-items: center;
        padding: 0 8px;
        border-left: 1px solid rgba(0, 0, 0, 0.1);
      }

      .tweaq-mode-indicator {
        font-size: 12px;
        font-weight: 500;
        color: #666;
      }

      .tweaq-close-btn {
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        color: #666;
        transition: all 0.15s ease;
      }

      .tweaq-close-btn:hover {
        background: rgba(255, 0, 0, 0.1);
        color: #dc3545;
      }

      .tweaq-confirm-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .tweaq-confirm-btn {
        border: none;
        background: #28a745;
        color: white;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.15s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .tweaq-confirm-btn:hover {
        background: #218838;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }

      .tweaq-clear-btn {
        border: none;
        background: #dc3545;
        color: white;
        cursor: pointer;
        padding: 6px 8px;
        border-radius: 6px;
        font-size: 12px;
        transition: all 0.15s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .tweaq-clear-btn:hover {
        background: #c82333;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }

      .tweaq-edits-count {
        background: #007bff;
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        margin-left: 8px;
      }

      /* Panels */
      .tweaq-overlay-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        height: 100vh;
        pointer-events: auto;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-left: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        z-index: 1000001;
      }

      .tweaq-overlay-panel.tweaq-panel-visible {
        transform: translateX(0);
      }

      .tweaq-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(0, 0, 0, 0.02);
        min-height: 64px;
      }

      .tweaq-panel-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        color: #1d1d1f;
        letter-spacing: -0.3px;
      }

      .tweaq-panel-close {
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        color: #666;
        transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tweaq-panel-close:hover {
        background: rgba(0, 0, 0, 0.06);
        color: #333;
        transform: scale(1.1);
      }

      .tweaq-panel-close:active {
        transform: scale(0.95);
      }

      .tweaq-panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      }

      /* Preview Controls */
      .tweaq-preview-controls {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.02);
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        margin: -16px -16px 16px -16px;
      }

      .tweaq-preview-source-group,
      .tweaq-view-mode-group,
      .tweaq-split-scrubber-container,
      .tweaq-confidence-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tweaq-preview-label {
        font-size: 11px;
        font-weight: 500;
        color: #666;
        min-width: 80px;
      }

      .tweaq-preview-toggle,
      .tweaq-view-mode-toggle {
        display: flex;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 6px;
        padding: 2px;
      }

      .tweaq-preview-toggle-btn,
      .tweaq-view-mode-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        color: #666;
        transition: all 0.15s ease;
      }

      .tweaq-preview-toggle-btn:hover,
      .tweaq-view-mode-btn:hover {
        color: #333;
        background: rgba(0, 0, 0, 0.05);
      }

      .tweaq-preview-toggle-btn.active,
      .tweaq-view-mode-btn.active {
        background: #007acc;
        color: white;
        box-shadow: 0 1px 3px rgba(0, 122, 204, 0.3);
      }

      .tweaq-preview-toggle-btn svg,
      .tweaq-view-mode-btn svg {
        width: 12px;
        height: 12px;
      }

      /* Split Scrubber */
      .tweaq-split-scrubber {
        flex: 1;
        cursor: pointer;
      }

      .tweaq-split-track {
        position: relative;
        height: 20px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        margin-bottom: 4px;
      }

      .tweaq-split-handle {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 18px;
        height: 18px;
        background: #007acc;
        border: 2px solid white;
        border-radius: 50%;
        cursor: grab;
        box-shadow: 0 2px 6px rgba(0, 122, 204, 0.3);
        transition: all 0.15s ease;
      }

      .tweaq-split-handle:hover {
        transform: translate(-50%, -50%) scale(1.1);
        box-shadow: 0 3px 8px rgba(0, 122, 204, 0.4);
      }

      .tweaq-split-handle:active {
        cursor: grabbing;
        transform: translate(-50%, -50%) scale(0.95);
      }

      .tweaq-split-labels {
        display: flex;
        justify-content: space-between;
      }

      .tweaq-split-label-left,
      .tweaq-split-label-right {
        font-size: 10px;
        color: #666;
        font-weight: 500;
      }

      /* Confidence Chip */
      .tweaq-confidence-chip {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        cursor: help;
      }

      .tweaq-confidence-chip svg {
        width: 10px;
        height: 10px;
      }

      /* Enhanced Edit Panel Styles */
      .tweaq-edit-panel .tweaq-panel-content {
        padding-top: 0;
      }

      .tweaq-section-changed {
        background: rgba(0, 122, 204, 0.02);
        border-left: 3px solid #007acc;
        padding-left: 13px;
        margin-left: -16px;
        margin-right: -16px;
        padding-right: 16px;
      }

      /* Info panel specific styles */
      .tweaq-inspector-section {
        margin-bottom: 16px;
      }

      .tweaq-inspector-section:last-child {
        margin-bottom: 0;
      }

      .tweaq-section-title {
        font-size: 12px;
        font-weight: 600;
        color: #333;
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .tweaq-element-tag {
        background: rgba(0, 0, 0, 0.05);
        padding: 8px;
        border-radius: 4px;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        font-size: 12px;
      }

      .tweaq-tag-name {
        color: #007acc;
        font-weight: 600;
      }

      .tweaq-element-id {
        color: #28a745;
        font-weight: 600;
        margin-left: 4px;
      }

      .tweaq-element-classes {
        color: #6f42c1;
        font-weight: 600;
        margin-left: 4px;
      }

      .tweaq-info-row {
        display: flex;
        align-items: flex-start;
        margin-bottom: 6px;
        gap: 8px;
      }

      .tweaq-info-row:last-child {
        margin-bottom: 0;
      }

      .tweaq-info-label {
        font-size: 11px;
        color: #666;
        min-width: 80px;
        font-weight: 500;
      }

      .tweaq-info-value {
        font-size: 11px;
        color: #333;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        flex: 1;
        word-break: break-all;
      }

      .tweaq-text-content {
        background: rgba(0, 0, 0, 0.05);
        padding: 8px;
        border-radius: 4px;
        font-size: 11px;
        color: #333;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 120px;
        overflow-y: auto;
      }

      .tweaq-property-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        gap: 8px;
      }

      .tweaq-property-label {
        font-size: 11px;
        font-weight: 500;
        color: #333;
        min-width: 60px;
      }

      .tweaq-edit-input-inline,
      .tweaq-edit-select-inline,
      .tweaq-edit-number-inline {
        flex: 1;
        padding: 4px 6px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 3px;
        font-size: 11px;
        background: white;
        color: #333;
      }

      .tweaq-edit-input-inline:focus,
      .tweaq-edit-select-inline:focus,
      .tweaq-edit-number-inline:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
        color: #000;
      }

      .tweaq-edit-input-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .tweaq-unit-inline {
        font-size: 10px;
        color: #666;
      }

      .tweaq-edit-color-inline {
        flex: 1;
        display: flex;
        gap: 4px;
      }

      .tweaq-color-picker-inline {
        width: 30px;
        height: 24px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 3px;
        cursor: pointer;
      }

      .tweaq-color-text-inline {
        flex: 1;
        padding: 4px 6px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 3px;
        font-size: 11px;
        color: #333;
        background: white;
      }

      .tweaq-color-text-inline:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
        color: #000;
      }

      .tweaq-range-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tweaq-edit-range-inline {
        flex: 1;
      }

      .tweaq-range-value-inline {
        font-size: 10px;
        color: #666;
        min-width: 30px;
      }

      .tweaq-edit-textarea-inline {
        width: 100%;
        padding: 6px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 3px;
        font-size: 11px;
        font-family: 'SF Mono', Monaco, monospace;
        resize: vertical;
        min-height: 60px;
        color: #333;
        background: white;
      }

      .tweaq-edit-textarea-inline:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
        color: #000;
      }

      .tweaq-spacing-group {
        margin-bottom: 12px;
      }

      .tweaq-spacing-label {
        display: block;
        font-size: 11px;
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
      }

      .tweaq-spacing-box {
        position: relative;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
        padding: 16px;
      }

      .tweaq-spacing-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        gap: 4px;
        width: 80px;
        height: 80px;
        margin: 0 auto;
      }

      .tweaq-spacing-input {
        width: 100%;
        padding: 2px 4px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 2px;
        font-size: 10px;
        text-align: center;
        color: #333;
        background: white;
      }

      .tweaq-spacing-input:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 0 1px rgba(0, 122, 204, 0.3);
        color: #000;
      }

      .tweaq-edit-actions-section {
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        padding-top: 16px;
        margin-top: 16px;
      }

      .tweaq-edit-actions-inline {
        display: flex;
        gap: 8px;
      }

      .tweaq-edit-button {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .tweaq-edit-reset {
        background: white;
        color: #666;
      }

      .tweaq-edit-reset:hover:not(:disabled) {
        background: #f8f9fa;
        color: #333;
      }

      .tweaq-edit-record {
        background: #007acc;
        color: white;
        border-color: #007acc;
      }

      .tweaq-edit-record:hover:not(:disabled) {
        background: #0056b3;
      }

      .tweaq-edit-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .tweaq-overlay-toolbar {
          top: 10px;
          right: 10px;
        }
        
        .tweaq-overlay-panel {
          top: 70px;
          right: 10px;
          left: 10px;
          width: auto;
        }

        .tweaq-preview-controls {
          gap: 8px;
        }

        .tweaq-preview-source-group,
        .tweaq-view-mode-group,
        .tweaq-split-scrubber-container,
        .tweaq-confidence-group {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .tweaq-preview-label {
          min-width: auto;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // Enhanced overlay implementation with new preview features
  class ModernTweaqOverlay {
    constructor() {
      this.isVisible = false;
      this.mode = 'measure';
      this.selectedElement = null;
      this.selectedElements = [];
      this.hoveredElement = null;
      this.showRuler = false;
      this.pendingEdits = new Map();
      this.previewState = {
        source: 'inline',
        viewMode: 'after',
        splitPosition: 50
      };
      this.adapterPreview = null;
      this.originalStyles = new Map();
      
      this.overlayContainer = null;
      this.outlineElement = null;
      
      // Bind methods
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleClick = this.handleClick.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    async inject(options = {}) {
      if (this.isVisible) return;

      await loadReactDependencies();
      injectStyles();

      this.mode = options.initialMode || 'measure';
      this.createOverlayElements();
      this.attachEventListeners();
      this.isVisible = true;
    }

    createOverlayElements() {
      // Create outline element
      this.outlineElement = document.createElement('div');
      this.outlineElement.className = 'tweaq-element-outline';
      this.outlineElement.style.display = 'none';
      document.body.appendChild(this.outlineElement);

      // Create overlay container
      this.overlayContainer = document.createElement('div');
      this.overlayContainer.className = 'tweaq-overlay-container';
      document.body.appendChild(this.overlayContainer);

      this.renderToolbar();
    }

    renderToolbar() {
      const toolbar = document.createElement('div');
      toolbar.className = 'tweaq-overlay-toolbar';
      
      const hasRecordedEdits = this.recordedEdits && this.recordedEdits.length > 0;
      const editsCount = hasRecordedEdits ? this.recordedEdits.length : 0;
      
      toolbar.innerHTML = `
        <div class="tweaq-toolbar-content">
          <div class="tweaq-mode-toggle">
            <button class="tweaq-mode-btn ${this.mode === 'measure' ? 'active' : ''}" data-mode="measure">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h12v1H2V2zm0 11h12v1H2v-1zM2 2v12h1V2H2zm11 0v12h1V2h-1zM5 5h6v1H5V5zm0 2h6v1H5V7zm0 2h4v1H5V9z"/>
              </svg>
              Measure
            </button>
            <button class="tweaq-mode-btn ${this.mode === 'edit' ? 'active' : ''}" data-mode="edit">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.854 2.854a.5.5 0 0 0-.708-.708L10.5 3.793 12.207 5.5l1.647-1.646zm-.708.708L3.5 11.207v1.293h1.293l8.646-8.646L11.793 2.207z"/>
              </svg>
              Edit
            </button>
          </div>
          
          <div class="tweaq-current-mode">
            <span class="tweaq-mode-indicator">
              ${this.mode === 'measure' ? '📏' : '✏️'} ${this.mode.charAt(0).toUpperCase() + this.mode.slice(1)}
            </span>
            ${hasRecordedEdits ? `<span class="tweaq-edits-count">${editsCount} edit${editsCount === 1 ? '' : 's'}</span>` : ''}
          </div>

          ${hasRecordedEdits ? `
          <div class="tweaq-confirm-actions">
            <button class="tweaq-confirm-btn" data-action="confirm" title="Create PR with ${editsCount} edit${editsCount === 1 ? '' : 's'}">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
              </svg>
              Confirm
            </button>
            <button class="tweaq-clear-btn" data-action="clear" title="Clear all recorded edits">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
            </button>
          </div>
          ` : ''}

          <button class="tweaq-close-btn" data-action="close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
            </svg>
          </button>
        </div>
      `;

      // Add event listeners to toolbar buttons
      toolbar.addEventListener('click', (e) => {
        if (e.target.closest('[data-mode]')) {
          const newMode = e.target.closest('[data-mode]').dataset.mode;
          this.setMode(newMode);
        } else if (e.target.closest('[data-action="close"]')) {
          this.remove();
        } else if (e.target.closest('[data-action="confirm"]')) {
          this.confirmAllEdits();
        } else if (e.target.closest('[data-action="clear"]')) {
          this.clearAllEdits();
        }
      });

      this.overlayContainer.appendChild(toolbar);
    }

    renderInspectorPanel() {
      if (!this.selectedElement || this.mode !== 'measure') return;

      const existingPanel = this.overlayContainer.querySelector('.tweaq-overlay-panel');
      if (existingPanel) {
        existingPanel.remove();
      }

      const panel = document.createElement('div');
      panel.className = 'tweaq-overlay-panel tweaq-inspector-panel tweaq-panel-visible';
      
      const rect = this.selectedElement.getBoundingClientRect();
      const computedStyles = getComputedStyle(this.selectedElement);
      
      panel.innerHTML = `
        <div class="tweaq-panel-header">
          <h3 class="tweaq-panel-title">Measure</h3>
          <button class="tweaq-panel-close" title="Close panel">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
            </svg>
          </button>
        </div>

        <div class="tweaq-panel-content">
          <!-- Element Info Section -->
          <div class="tweaq-inspector-section">
            <h4 class="tweaq-section-title">Element</h4>
            <div class="tweaq-element-tag">
              <span class="tweaq-tag-name">&lt;${this.selectedElement.tagName.toLowerCase()}&gt;</span>
              ${this.selectedElement.id ? `<span class="tweaq-element-id">#${this.selectedElement.id}</span>` : ''}
              ${this.selectedElement.className ? `<span class="tweaq-element-classes">${this.selectedElement.className.split(' ').map(cls => `.${cls}`).join(' ')}</span>` : ''}
            </div>
          </div>

          <!-- Dimensions Section -->
          <div class="tweaq-inspector-section">
            <h4 class="tweaq-section-title">Dimensions</h4>
            <div class="tweaq-info-row">
              <span class="tweaq-info-label">Width:</span>
              <span class="tweaq-info-value">${Math.round(rect.width)}px</span>
            </div>
            <div class="tweaq-info-row">
              <span class="tweaq-info-label">Height:</span>
              <span class="tweaq-info-value">${Math.round(rect.height)}px</span>
            </div>
            <div class="tweaq-info-row">
              <span class="tweaq-info-label">X Position:</span>
              <span class="tweaq-info-value">${Math.round(rect.left + window.scrollX)}px</span>
            </div>
            <div class="tweaq-info-row">
              <span class="tweaq-info-label">Y Position:</span>
              <span class="tweaq-info-value">${Math.round(rect.top + window.scrollY)}px</span>
            </div>
          </div>

          <!-- Computed Styles Section -->
          <div class="tweaq-inspector-section">
            <h4 class="tweaq-section-title">Computed Styles</h4>
            <div class="tweaq-info-row">
              <span class="tweaq-info-label">Display:</span>
              <span class="tweaq-info-value">${computedStyles.display}</span>
            </div>
            <div class="tweaq-info-row">
              <span class="tweaq-info-label">Position:</span>
              <span class="tweaq-info-value">${computedStyles.position}</span>
            </div>
            <div class="tweaq-info-row">
              <span class="tweaq-info-label">Font Size:</span>
              <span class="tweaq-info-value">${computedStyles.fontSize}</span>
            </div>
            <div class="tweaq-info-row">
              <span class="tweaq-info-label">Color:</span>
              <span class="tweaq-info-value">${computedStyles.color}</span>
            </div>
            <div class="tweaq-info-row">
              <span class="tweaq-info-label">Background:</span>
              <span class="tweaq-info-value">${computedStyles.backgroundColor}</span>
            </div>
          </div>

          ${this.selectedElement.textContent && this.selectedElement.textContent.trim() ? `
          <!-- Text Content Section -->
          <div class="tweaq-inspector-section">
            <h4 class="tweaq-section-title">Text Content</h4>
            <div class="tweaq-text-content">${this.selectedElement.textContent.trim().substring(0, 200)}${this.selectedElement.textContent.trim().length > 200 ? '...' : ''}</div>
          </div>
          ` : ''}
        </div>
      `;

      // Add event listeners
      panel.addEventListener('click', (e) => {
        if (e.target.closest('.tweaq-panel-close')) {
          this.closePanel();
        }
      });

      this.overlayContainer.appendChild(panel);
    }

    renderEditPanel() {
      if (!this.selectedElement || this.mode !== 'edit') return;

      const existingPanel = this.overlayContainer.querySelector('.tweaq-overlay-panel');
      if (existingPanel) {
        existingPanel.remove();
      }

      const panel = document.createElement('div');
      panel.className = 'tweaq-overlay-panel tweaq-inspector-panel tweaq-edit-panel tweaq-panel-visible';
      
      const hasChanges = this.pendingEdits.size > 0;
      
      panel.innerHTML = `
        <div class="tweaq-panel-header">
          <h3 class="tweaq-panel-title">Edit</h3>
          <button class="tweaq-panel-close" title="Close panel">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
            </svg>
          </button>
        </div>

        <div class="tweaq-panel-content">
          ${hasChanges ? this.renderPreviewControls() : ''}
          
          <!-- Element Info Section -->
          <div class="tweaq-inspector-section">
            <div class="tweaq-element-tag">
              <span class="tweaq-tag-name">&lt;${this.selectedElement.tagName.toLowerCase()}&gt;</span>
              ${this.selectedElement.id ? `<span class="tweaq-element-id">#${this.selectedElement.id}</span>` : ''}
              ${this.selectedElement.className ? `<span class="tweaq-element-classes">${this.selectedElement.className.split(' ').map(cls => `.${cls}`).join(' ')}</span>` : ''}
            </div>
          </div>

          <!-- Property Groups -->
          ${this.renderPropertyGroups()}

          <!-- Actions -->
          <div class="tweaq-inspector-section tweaq-edit-actions-section">
            <div class="tweaq-edit-actions-inline">
              <button class="tweaq-edit-button tweaq-edit-reset" ${!hasChanges ? 'disabled' : ''} data-action="reset">
                Reset Changes
              </button>
              <button class="tweaq-edit-button tweaq-edit-record" ${!hasChanges ? 'disabled' : ''} data-action="record">
                Record Edit
              </button>
            </div>
          </div>
        </div>
      `;

      // Add event listeners
      panel.addEventListener('click', (e) => {
        if (e.target.closest('.tweaq-panel-close')) {
          this.closePanel();
        } else if (e.target.closest('[data-action="reset"]')) {
          this.resetChanges();
        } else if (e.target.closest('[data-action="record"]')) {
          this.recordEdit();
        }
      });

      panel.addEventListener('input', (e) => {
        if (e.target.dataset.property) {
          this.handlePropertyChange(e.target.dataset.property, e.target.value);
        }
      });

      panel.addEventListener('change', (e) => {
        if (e.target.dataset.property) {
          this.handlePropertyChange(e.target.dataset.property, e.target.value);
        }
      });

      // Add preview control event listeners
      panel.addEventListener('click', (e) => {
        // Handle preview source toggle
        if (e.target.closest('[data-preview-source]')) {
          const source = e.target.closest('[data-preview-source]').dataset.previewSource;
          this.handlePreviewSourceChange(source);
        }
        
        // Handle view mode toggle
        if (e.target.closest('[data-view-mode]')) {
          const viewMode = e.target.closest('[data-view-mode]').dataset.viewMode;
          this.handleViewModeChange(viewMode);
        }
      });

      this.overlayContainer.appendChild(panel);
    }

    renderPreviewControls() {
      const confidence = this.adapterPreview?.overallConfidence || 'medium';
      const confidenceColors = {
        high: '#22c55e',
        medium: '#f59e0b',
        low: '#ef4444'
      };
      const confidenceLabels = {
        high: 'High',
        medium: 'Med',
        low: 'Low'
      };

      return `
        <div class="tweaq-preview-controls">
          <!-- Preview Source Toggle -->
          <div class="tweaq-preview-source-group">
            <span class="tweaq-preview-label">Preview Source:</span>
            <div class="tweaq-preview-toggle">
              <button class="tweaq-preview-toggle-btn ${this.previewState.source === 'inline' ? 'active' : ''}" data-preview-source="inline">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Inline
              </button>
              <button class="tweaq-preview-toggle-btn ${this.previewState.source === 'adapter' ? 'active' : ''}" data-preview-source="adapter">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3z"/>
                  <path d="M4 5h8v1H4V5zm0 2h8v1H4V7zm0 2h6v1H4V9z" fill="white"/>
                </svg>
                Adapter CSS
              </button>
            </div>
          </div>

          <!-- View Mode Controls -->
          <div class="tweaq-view-mode-group">
            <span class="tweaq-preview-label">View Mode:</span>
            <div class="tweaq-view-mode-toggle">
              <button class="tweaq-view-mode-btn ${this.previewState.viewMode === 'before' ? 'active' : ''}" data-view-mode="before">
                Before
              </button>
              <button class="tweaq-view-mode-btn ${this.previewState.viewMode === 'after' ? 'active' : ''}" data-view-mode="after">
                After
              </button>
              <button class="tweaq-view-mode-btn ${this.previewState.viewMode === 'split' ? 'active' : ''}" data-view-mode="split">
                Split
              </button>
            </div>
          </div>

          ${this.previewState.viewMode === 'split' ? `
          <!-- Split View Scrubber -->
          <div class="tweaq-split-scrubber-container">
            <span class="tweaq-preview-label">Split Position:</span>
            <div class="tweaq-split-scrubber">
              <div class="tweaq-split-track">
                <div class="tweaq-split-handle" style="left: ${this.previewState.splitPosition}%"></div>
              </div>
              <div class="tweaq-split-labels">
                <span class="tweaq-split-label-left">Before</span>
                <span class="tweaq-split-label-right">After</span>
              </div>
            </div>
          </div>
          ` : ''}

          ${this.previewState.source === 'adapter' ? `
          <!-- Confidence Chip -->
          <div class="tweaq-confidence-group">
            <span class="tweaq-preview-label">Mapping Confidence:</span>
            <div class="tweaq-confidence-chip" style="background-color: ${confidenceColors[confidence]}; color: white;">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
                <path d="M6.5 7.5A1.5 1.5 0 0 1 8 6h.5a.5.5 0 0 1 0 1H8a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 1-1 0V7.5z"/>
                <path d="M8 10.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z"/>
              </svg>
              ${confidenceLabels[confidence]}
            </div>
          </div>
          ` : ''}
        </div>
      `;
    }

    renderPropertyGroups() {
      const computedStyles = getComputedStyle(this.selectedElement);
      
      return `
        <!-- Typography -->
        <div class="tweaq-inspector-section">
          <h4 class="tweaq-section-title">Typography</h4>
          
          <div class="tweaq-property-row">
            <span class="tweaq-property-label">Size</span>
            <div class="tweaq-edit-input-wrapper">
              <input type="number" value="${parseInt(computedStyles.fontSize) || ''}" min="8" max="200" 
                     class="tweaq-edit-number-inline" data-property="fontSize" />
              <span class="tweaq-unit-inline">px</span>
            </div>
          </div>
          
          <div class="tweaq-property-row">
            <span class="tweaq-property-label">Weight</span>
            <select class="tweaq-edit-select-inline" data-property="fontWeight">
              <option value="100" ${computedStyles.fontWeight === '100' ? 'selected' : ''}>100</option>
              <option value="200" ${computedStyles.fontWeight === '200' ? 'selected' : ''}>200</option>
              <option value="300" ${computedStyles.fontWeight === '300' ? 'selected' : ''}>300</option>
              <option value="400" ${computedStyles.fontWeight === '400' ? 'selected' : ''}>400</option>
              <option value="500" ${computedStyles.fontWeight === '500' ? 'selected' : ''}>500</option>
              <option value="600" ${computedStyles.fontWeight === '600' ? 'selected' : ''}>600</option>
              <option value="700" ${computedStyles.fontWeight === '700' ? 'selected' : ''}>700</option>
              <option value="800" ${computedStyles.fontWeight === '800' ? 'selected' : ''}>800</option>
              <option value="900" ${computedStyles.fontWeight === '900' ? 'selected' : ''}>900</option>
            </select>
          </div>
          
          <div class="tweaq-property-row">
            <span class="tweaq-property-label">Color</span>
            <div class="tweaq-edit-color-inline">
              <input type="color" value="${this.rgbToHex(computedStyles.color)}" 
                     class="tweaq-color-picker-inline" data-property="color" />
              <input type="text" value="${computedStyles.color}" 
                     class="tweaq-color-text-inline" data-property="color" />
            </div>
          </div>
          
          <div class="tweaq-property-row">
            <span class="tweaq-property-label">Align</span>
            <select class="tweaq-edit-select-inline" data-property="textAlign">
              <option value="left" ${computedStyles.textAlign === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${computedStyles.textAlign === 'center' ? 'selected' : ''}>Center</option>
              <option value="right" ${computedStyles.textAlign === 'right' ? 'selected' : ''}>Right</option>
              <option value="justify" ${computedStyles.textAlign === 'justify' ? 'selected' : ''}>Justify</option>
            </select>
          </div>
        </div>

        <!-- Appearance -->
        <div class="tweaq-inspector-section">
          <h4 class="tweaq-section-title">Appearance</h4>
          
          <div class="tweaq-property-row">
            <span class="tweaq-property-label">Background</span>
            <div class="tweaq-edit-color-inline">
              <input type="color" value="${this.rgbToHex(computedStyles.backgroundColor)}" 
                     class="tweaq-color-picker-inline" data-property="backgroundColor" />
              <input type="text" value="${computedStyles.backgroundColor}" 
                     class="tweaq-color-text-inline" data-property="backgroundColor" />
            </div>
          </div>
          
          <div class="tweaq-property-row">
            <span class="tweaq-property-label">Border Radius</span>
            <div class="tweaq-edit-input-wrapper">
              <input type="number" value="${parseInt(computedStyles.borderRadius) || ''}" min="0" max="100" 
                     class="tweaq-edit-number-inline" data-property="borderRadius" />
              <span class="tweaq-unit-inline">px</span>
            </div>
          </div>
          
          <div class="tweaq-property-row">
            <span class="tweaq-property-label">Opacity</span>
            <div class="tweaq-range-wrapper">
              <input type="range" value="${parseFloat(computedStyles.opacity) || 1}" min="0" max="1" step="0.01" 
                     class="tweaq-edit-range-inline" data-property="opacity" />
              <span class="tweaq-range-value-inline">${computedStyles.opacity}</span>
            </div>
          </div>
        </div>
      `;
    }

    setMode(newMode) {
      this.mode = newMode;
      this.closePanel();
      this.renderToolbar();
      
      // If we have a selected element, show the appropriate panel for the new mode
      if (this.selectedElement) {
        if (newMode === 'edit') {
          this.storeOriginalStyles(this.selectedElement);
          this.renderEditPanel();
        } else if (newMode === 'measure') {
          this.renderInspectorPanel();
        }
      }
    }

    handleMouseMove(e) {
      if (!this.isVisible) return;

      const target = e.target;
      
      // Don't highlight overlay elements
      if (target.closest('.tweaq-overlay-toolbar') || 
          target.closest('.tweaq-overlay-panel') ||
          target.closest('.tweaq-element-outline')) {
        return;
      }

      this.hoveredElement = target;
      
      // Only show outline for hovered element if no element is selected
      if (!this.selectedElement) {
        this.updateOutline(target);
      }
    }

    handleClick(e) {
      if (!this.isVisible) return;

      const target = e.target;
      
      // Don't select overlay elements
      if (target.closest('.tweaq-overlay-toolbar') || 
          target.closest('.tweaq-overlay-panel') ||
          target.closest('.tweaq-element-outline')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      this.selectedElement = target;
      this.updateOutline(target);
      
      if (this.mode === 'edit') {
        this.storeOriginalStyles(target);
        this.renderEditPanel();
      } else if (this.mode === 'measure') {
        this.renderInspectorPanel();
      }
    }

    handleKeyDown(e) {
      if (e.key === 'Escape') {
        this.closePanel();
        this.selectedElement = null;
        this.updateOutline(null);
      }
    }

    updateOutline(element) {
      if (!element) {
        this.outlineElement.style.display = 'none';
        return;
      }

      const rect = element.getBoundingClientRect();
      this.outlineElement.style.display = 'block';
      this.outlineElement.style.left = `${rect.left + window.scrollX}px`;
      this.outlineElement.style.top = `${rect.top + window.scrollY}px`;
      this.outlineElement.style.width = `${rect.width}px`;
      this.outlineElement.style.height = `${rect.height}px`;
    }

    storeOriginalStyles(element) {
      const computedStyles = getComputedStyle(element);
      const propertiesToStore = [
        'color', 'backgroundColor', 'fontSize', 'fontWeight', 'textAlign',
        'display', 'width', 'height', 'margin', 'padding', 'borderRadius',
        'opacity', 'boxShadow'
      ];
      
      this.originalStyles.clear();
      propertiesToStore.forEach(prop => {
        this.originalStyles.set(prop, computedStyles.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase()));
      });
    }

    handlePropertyChange(property, value) {
      if (!this.selectedElement) return;

      console.log('🔧 Property change:', property, '=', value);

      const originalValue = this.originalStyles.get(property) || '';
      
      // Apply the change immediately for live preview
      try {
        if (property === 'fontSize' && value) {
          this.selectedElement.style.fontSize = value + 'px';
          console.log('✅ Applied fontSize:', value + 'px');
        } else if (property === 'borderRadius' && value) {
          this.selectedElement.style.borderRadius = value + 'px';
          console.log('✅ Applied borderRadius:', value + 'px');
        } else if (property === 'color') {
          this.selectedElement.style.color = value;
          console.log('✅ Applied color:', value);
        } else if (property === 'backgroundColor') {
          this.selectedElement.style.backgroundColor = value;
          console.log('✅ Applied backgroundColor:', value);
        } else if (property === 'fontWeight') {
          this.selectedElement.style.fontWeight = value;
          console.log('✅ Applied fontWeight:', value);
        } else if (property === 'textAlign') {
          this.selectedElement.style.textAlign = value;
          console.log('✅ Applied textAlign:', value);
        } else if (property === 'opacity') {
          this.selectedElement.style.opacity = value;
          console.log('✅ Applied opacity:', value);
        } else {
          this.selectedElement.style[property] = value;
          console.log('✅ Applied generic property:', property, '=', value);
        }
      } catch (error) {
        console.error('❌ Error applying property change:', error);
      }

      // Track the pending edit
      this.pendingEdits.set(property, {
        property,
        after: value,
        before: originalValue,
      });

      // Update the preview if in adapter mode
      if (this.previewState.source === 'adapter') {
        this.updateAdapterPreview();
        const css = this.generateAdapterCSS();
        this.injectAdapterCSS(css);
      }

      // Update preview controls if they exist, otherwise render the panel
      const existingPreviewControls = this.overlayContainer.querySelector('.tweaq-preview-controls');
      const hasChanges = this.pendingEdits.size > 0;
      
      if (hasChanges && !existingPreviewControls) {
        // First time we have changes - render the panel with preview controls
        setTimeout(() => this.renderEditPanel(), 100);
      } else if (hasChanges && existingPreviewControls) {
        // Update existing preview controls without full re-render
        this.updatePreviewControlsState();
      }
    }

    updatePreviewControlsState() {
      // Update button states without full re-render
      const previewControls = this.overlayContainer.querySelector('.tweaq-preview-controls');
      if (!previewControls) return;

      // Update preview source buttons
      const sourceButtons = previewControls.querySelectorAll('[data-preview-source]');
      sourceButtons.forEach(btn => {
        const source = btn.dataset.previewSource;
        if (source === this.previewState.source) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Update view mode buttons
      const viewModeButtons = previewControls.querySelectorAll('[data-view-mode]');
      viewModeButtons.forEach(btn => {
        const mode = btn.dataset.viewMode;
        if (mode === this.previewState.viewMode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    updateAdapterPreview() {
      // Simplified adapter preview generation
      this.adapterPreview = {
        id: `adapter_${Date.now()}`,
        selector: this.getElementSelector(this.selectedElement),
        mappings: Array.from(this.pendingEdits.values()).map(edit => ({
          property: edit.property,
          value: edit.after,
          tailwindClass: this.mapToTailwind(edit.property, edit.after),
          confidence: 'medium'
        })),
        overallConfidence: 'medium'
      };
    }

    mapToTailwind(property, value) {
      // Simplified Tailwind mapping
      const mappings = {
        'color': {
          '#000000': 'text-black',
          '#ffffff': 'text-white',
          '#ef4444': 'text-red-500',
          '#22c55e': 'text-green-500',
          '#3b82f6': 'text-blue-500',
        },
        'backgroundColor': {
          '#000000': 'bg-black',
          '#ffffff': 'bg-white',
          '#ef4444': 'bg-red-500',
          '#22c55e': 'bg-green-500',
          '#3b82f6': 'bg-blue-500',
        },
        'fontSize': {
          '12px': 'text-xs',
          '14px': 'text-sm',
          '16px': 'text-base',
          '18px': 'text-lg',
          '20px': 'text-xl',
        },
        'fontWeight': {
          '400': 'font-normal',
          '500': 'font-medium',
          '600': 'font-semibold',
          '700': 'font-bold',
        }
      };

      return mappings[property]?.[value] || null;
    }

    getElementSelector(element) {
      if (element.id) {
        return `#${element.id}`;
      }
      
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.trim().split(/\s+/).join('.');
        if (classes) {
          return `.${classes}`;
        }
      }
      
      return element.tagName.toLowerCase();
    }

    resetChanges() {
      if (!this.selectedElement) return;

      // Revert all pending changes
      this.pendingEdits.forEach((edit, property) => {
        if (edit.before) {
          this.selectedElement.style[property] = edit.before;
        } else {
          this.selectedElement.style.removeProperty(property.replace(/([A-Z])/g, '-$1').toLowerCase());
        }
      });

      this.pendingEdits.clear();
      this.renderEditPanel();
    }

    recordEdit() {
      if (!this.selectedElement || this.pendingEdits.size === 0) return;

      const visualEdit = this.createOptimizedVisualEdit(
        this.selectedElement, 
        this.pendingEdits, 
        this.getElementSelector(this.selectedElement)
      );

      console.log('📝 Recorded Optimized VisualEdit:', visualEdit);
      
      // Add to recorded edits list
      if (!this.recordedEdits) {
        this.recordedEdits = [];
      }
      this.recordedEdits.push(visualEdit);
      
      // Analyze relationships between all edits
      this.recordedEdits = this.analyzeEditRelationships(this.recordedEdits);
      
      this.pendingEdits.clear();
      this.renderEditPanel();
      this.renderToolbar(); // Update toolbar to show Confirm button if edits exist
    }

    // Create optimized visual edit with enhanced context
    createOptimizedVisualEdit(element, pendingEdits, selector) {
      // Initialize session if needed
      if (!this.sessionId) {
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.sessionStartTime = Date.now();
      }

      // Get enhanced element information
      const elementInfo = this.getEnhancedElementInfo(element, selector);
      
      // Process and categorize changes
      const optimizedChanges = Array.from(pendingEdits.values()).map(edit => 
        this.optimizeChange(edit, element)
      );

      // Infer user intent
      const intent = this.inferUserIntent(optimizedChanges, element);

      return {
        id: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        element: elementInfo,
        changes: optimizedChanges,
        intent,
        validation: {
          applied: true,
          errors: [],
          warnings: []
        }
      };
    }

    // Get enhanced element information
    getEnhancedElementInfo(element, selector) {
      // Get computed styles for key properties
      const computedStyle = window.getComputedStyle(element);
      const computedStyles = {};
      
      // Collect important computed styles
      const importantStyles = [
        'display', 'position', 'width', 'height', 'margin', 'padding',
        'backgroundColor', 'color', 'fontSize', 'fontFamily', 'lineHeight',
        'border', 'borderRadius', 'boxShadow', 'opacity', 'zIndex'
      ];
      
      importantStyles.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value) {
          computedStyles[prop] = value;
        }
      });

      // Get bounding rectangle
      const rect = element.getBoundingClientRect();
      const boundingRect = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      };

      return {
        selector,
        tagName: element.tagName,
        id: element.id || undefined,
        className: element.className || undefined,
        textContent: element.textContent?.trim() || undefined,
        computedStyles,
        boundingRect,
        componentPath: this.inferComponentPath(element),
        componentName: this.inferComponentName(element)
      };
    }

    // Optimize a single change with categorization
    optimizeChange(edit, element) {
      return {
        property: edit.property,
        before: edit.before,
        after: edit.after,
        category: this.categorizeProperty(edit.property),
        impact: this.determineImpact(edit.property, edit.before, edit.after, element),
        confidence: this.calculateConfidence(edit, element)
      };
    }

    // Categorize CSS property
    categorizeProperty(property) {
      const colorProps = ['color', 'background-color', 'border-color', 'outline-color', 'text-decoration-color'];
      const spacingProps = ['margin', 'padding', 'gap', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right', 
                           'padding-top', 'padding-bottom', 'padding-left', 'padding-right'];
      const layoutProps = ['display', 'position', 'width', 'height', 'top', 'left', 'right', 'bottom', 
                          'flex', 'grid', 'float', 'clear', 'overflow', 'z-index'];
      const typographyProps = ['font-size', 'font-family', 'font-weight', 'line-height', 'text-align', 
                              'text-decoration', 'letter-spacing', 'word-spacing', 'text-transform'];
      const borderProps = ['border', 'border-width', 'border-style', 'border-radius', 'outline', 'border-top',
                          'border-right', 'border-bottom', 'border-left'];
      const backgroundProps = ['background', 'background-image', 'background-size', 'background-position',
                              'background-repeat', 'background-attachment'];
      const animationProps = ['transition', 'animation', 'transform', 'opacity', 'filter'];

      const prop = property.toLowerCase();
      
      if (colorProps.some(p => prop.includes(p))) return 'color';
      if (spacingProps.some(p => prop.includes(p))) return 'spacing';
      if (layoutProps.some(p => prop.includes(p))) return 'layout';
      if (typographyProps.some(p => prop.includes(p))) return 'typography';
      if (borderProps.some(p => prop.includes(p))) return 'border';
      if (backgroundProps.some(p => prop.includes(p))) return 'background';
      if (animationProps.some(p => prop.includes(p))) return 'animation';
      
      return 'other';
    }

    // Determine the impact type of a change
    determineImpact(property, before, after, element) {
      const structuralProps = ['display', 'position', 'width', 'height', 'flex', 'grid', 'float'];
      const behavioralProps = ['cursor', 'pointer-events', 'user-select', 'overflow', 'z-index'];

      const prop = property.toLowerCase();

      if (structuralProps.some(p => prop.includes(p))) {
        return 'structural';
      }
      if (behavioralProps.some(p => prop.includes(p))) {
        return 'behavioral';
      }
      return 'visual';
    }

    // Calculate confidence in the before/after values
    calculateConfidence(edit, element) {
      let confidence = 0.8; // Base confidence
      
      // Reduce confidence for computed/auto values
      if (edit.before.includes('auto') || edit.before.includes('inherit') || edit.before.includes('initial')) {
        confidence -= 0.2;
      }
      
      // Reduce confidence if the before value seems to be a computed value (very precise decimals)
      if (/\d+\.\d{3,}px/.test(edit.before)) {
        confidence -= 0.1;
      }
      
      // Increase confidence for explicit units and values
      if (/^\d+(\.\d{1,2})?(px|em|rem|%|vh|vw)$/.test(edit.after)) {
        confidence += 0.1;
      }
      
      // Increase confidence for color values
      if (/^#[0-9a-fA-F]{6}$/.test(edit.after) || /^rgb\(/.test(edit.after) || /^rgba\(/.test(edit.after)) {
        confidence += 0.1;
      }
      
      // Verify the change was actually applied
      try {
        const currentValue = window.getComputedStyle(element).getPropertyValue(edit.property);
        if (currentValue === edit.after) {
          confidence += 0.1;
        }
      } catch (error) {
        confidence -= 0.1;
      }
      
      return Math.max(0.1, Math.min(1.0, confidence));
    }

    // Infer user intent from change patterns
    inferUserIntent(changes, element) {
      const categories = changes.map(c => c.category);
      
      // Build description based on change patterns
      const descriptions = [];
      const categoryCount = {};
      
      categories.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
      
      Object.entries(categoryCount).forEach(([category, count]) => {
        if (count === 1) {
          descriptions.push(`${category} adjustment`);
        } else {
          descriptions.push(`${category} modifications (${count} properties)`);
        }
      });
      
      // Determine user action type
      let userAction = 'direct-edit';
      
      if (changes.length > 5) {
        userAction = 'batch-operation';
      } else if (categories.every(cat => cat === categories[0]) && changes.length > 2) {
        userAction = 'copy-from'; // Likely copying similar styles
      }
      
      return {
        description: descriptions.join(', ') || 'Visual modification',
        userAction,
        relatedEdits: [] // Will be populated by session analysis
      };
    }

    // Infer component path from element
    inferComponentPath(element) {
      // Look for React component indicators
      const classes = element.className.split(' ');
      
      // Common React component class patterns
      const componentClass = classes.find(cls => 
        /^[A-Z]/.test(cls) || // PascalCase
        cls.includes('component') ||
        cls.includes('Component') ||
        cls.includes('-component') ||
        cls.includes('_component')
      );
      
      if (componentClass) {
        // Convert class name to likely component path
        const componentName = componentClass.replace(/[-_]/g, '');
        return `src/components/${componentName}.tsx`;
      }
      
      // Look for data attributes that might indicate components
      const dataComponent = element.getAttribute('data-component');
      if (dataComponent) {
        return `src/components/${dataComponent}.tsx`;
      }
      
      return undefined;
    }

    // Infer component name from element
    inferComponentName(element) {
      const classes = element.className.split(' ');
      
      // Look for PascalCase class names (likely component names)
      const componentClass = classes.find(cls => /^[A-Z][a-zA-Z]*$/.test(cls));
      if (componentClass) {
        return componentClass;
      }
      
      // Look for data attributes
      const dataComponent = element.getAttribute('data-component');
      if (dataComponent) {
        return dataComponent;
      }
      
      return undefined;
    }

    // Analyze multiple edits to find relationships
    analyzeEditRelationships(edits) {
      if (edits.length <= 1) return edits;
      
      // Group edits by timing (within 5 seconds = likely related)
      const timeThreshold = 5000;
      const groups = [];
      
      for (const edit of edits) {
        let addedToGroup = false;
        
        for (const group of groups) {
          const lastEditInGroup = group[group.length - 1];
          const timeDiff = edit.timestamp - lastEditInGroup.timestamp;
          
          if (timeDiff <= timeThreshold) {
            // Check if changes are similar (same categories)
            const editCategories = edit.changes.map(c => c.category);
            const groupCategories = lastEditInGroup.changes.map(c => c.category);
            const hasOverlap = editCategories.some(cat => groupCategories.includes(cat));
            
            if (hasOverlap) {
              group.push(edit);
              addedToGroup = true;
              break;
            }
          }
        }
        
        if (!addedToGroup) {
          groups.push([edit]);
        }
      }
      
      // Update related edits for each group
      return edits.map(edit => {
        const group = groups.find(g => g.includes(edit));
        if (group && group.length > 1) {
          const relatedIds = group.filter(e => e.id !== edit.id).map(e => e.id);
          return {
            ...edit,
            intent: {
              ...edit.intent,
              relatedEdits: relatedIds,
              userAction: group.length > 3 ? 'batch-operation' : edit.intent.userAction
            }
          };
        }
        return edit;
      });
    }

    async confirmAllEdits() {
      if (!this.recordedEdits || this.recordedEdits.length === 0) {
        console.log('No edits to confirm');
        return;
      }

      console.log('🚀 Confirming all edits:', this.recordedEdits);

      try {
        // Call the electron API to confirm changes
        if (window.electronAPI && window.electronAPI.confirmChanges) {
          const result = await window.electronAPI.confirmChanges(this.recordedEdits);
          
          if (result.success && result.pr) {
            alert(`✅ Success! PR created: ${result.pr.url}`);
            // Clear recorded edits after successful confirmation
            this.recordedEdits = [];
            this.renderToolbar();
          } else {
            alert(`❌ Error: ${result.error || 'Failed to create PR'}`);
          }
        } else {
          console.log('📝 Would confirm edits:', this.recordedEdits);
          alert('Confirm flow not available - running in browser mode');
        }
      } catch (error) {
        console.error('Error confirming edits:', error);
        alert(`❌ Error: ${error.message || 'Failed to confirm changes'}`);
      }
    }

    clearAllEdits() {
      if (!this.recordedEdits || this.recordedEdits.length === 0) return;
      
      if (confirm('Are you sure you want to clear all recorded edits?')) {
        this.recordedEdits = [];
        this.renderToolbar();
        console.log('🗑️ Cleared all recorded edits');
      }
    }

    // Preview control handlers
    handlePreviewSourceChange(source) {
      console.log('🔄 Preview source changed to:', source);
      this.previewState.source = source;
      
      if (source === 'adapter') {
        // Switch to Adapter CSS mode
        this.removeAdapterCSS();
        this.restoreOriginalStyles();
        
        // Generate and apply adapter CSS
        this.updateAdapterPreview();
        const css = this.generateAdapterCSS();
        this.injectAdapterCSS(css);
        
        console.log('🎨 Generated Adapter CSS:', css);
      } else {
        // Switch to Inline mode
        this.removeAdapterCSS();
        this.reapplyInlineStyles();
      }
      
      this.renderEditPanel();
    }

    handleViewModeChange(viewMode) {
      console.log('👁️ View mode changed to:', viewMode);
      this.previewState.viewMode = viewMode;
      
      if (viewMode === 'before') {
        // Show original state
        if (this.previewState.source === 'inline') {
          this.restoreOriginalStyles();
        } else {
          this.removeAdapterCSS();
        }
      } else if (viewMode === 'after') {
        // Show modified state
        if (this.previewState.source === 'inline') {
          this.reapplyInlineStyles();
        } else {
          this.updateAdapterPreview();
          const css = this.generateAdapterCSS();
          this.injectAdapterCSS(css);
        }
      } else if (viewMode === 'split') {
        // Split view - show after state but with visual indicators
        this.handleViewModeChange('after');
        // TODO: Add split view visual overlay
      }
      
      this.renderEditPanel();
    }

    // CSS Adapter functionality
    generateAdapterCSS() {
      if (!this.adapterPreview) return '';
      
      const rules = [];
      for (const mapping of this.adapterPreview.mappings) {
        if (mapping.tailwindClass) {
          // Convert Tailwind class to actual CSS
          const cssRule = this.tailwindToCSSRule(mapping.tailwindClass, mapping.property, mapping.value);
          if (cssRule) rules.push(cssRule);
        } else {
          // Use raw CSS
          const cssProperty = mapping.property.replace(/([A-Z])/g, '-$1').toLowerCase();
          rules.push(`${cssProperty}: ${mapping.value}`);
        }
      }
      
      if (rules.length === 0) return '';
      
      return `${this.adapterPreview.selector} {\n  ${rules.join(';\n  ')};\n}`;
    }

    tailwindToCSSRule(tailwindClass, property, value) {
      // For classes with arbitrary values like text-[#ff0000]
      if (tailwindClass.includes('[') && tailwindClass.includes(']')) {
        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssProperty}: ${value}`;
      }
      
      // For standard Tailwind classes, return the raw CSS as fallback
      const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssProperty}: ${value}`;
    }

    injectAdapterCSS(css) {
      // Remove existing override styles
      this.removeAdapterCSS();
      
      if (!css.trim()) return;
      
      // Create new style element
      const style = document.createElement('style');
      style.id = '__smartqa-override';
      style.textContent = css;
      document.head.appendChild(style);
      
      console.log('💉 Injected Adapter CSS:', css);
    }

    removeAdapterCSS() {
      const existingStyle = document.getElementById('__smartqa-override');
      if (existingStyle) {
        existingStyle.remove();
      }
    }

    restoreOriginalStyles() {
      if (!this.selectedElement) return;
      
      this.originalStyles.forEach((value, property) => {
        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        if (value) {
          this.selectedElement.style.setProperty(cssProperty, value);
        } else {
          this.selectedElement.style.removeProperty(cssProperty);
        }
      });
    }

    reapplyInlineStyles() {
      if (!this.selectedElement) return;
      
      this.pendingEdits.forEach(edit => {
        if (edit.property === 'fontSize' && edit.after) {
          this.selectedElement.style.fontSize = edit.after + 'px';
        } else if (edit.property === 'borderRadius' && edit.after) {
          this.selectedElement.style.borderRadius = edit.after + 'px';
        } else {
          this.selectedElement.style[edit.property] = edit.after;
        }
      });
    }

    closePanel() {
      const existingPanel = this.overlayContainer.querySelector('.tweaq-overlay-panel');
      if (existingPanel) {
        existingPanel.remove();
      }
    }

    attachEventListeners() {
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('click', this.handleClick, true);
      document.addEventListener('keydown', this.handleKeyDown);
    }

    removeEventListeners() {
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('click', this.handleClick, true);
      document.removeEventListener('keydown', this.handleKeyDown);
    }

    remove() {
      if (!this.isVisible) return;

      this.removeEventListeners();
      
      if (this.overlayContainer) {
        this.overlayContainer.remove();
        this.overlayContainer = null;
      }
      
      if (this.outlineElement) {
        this.outlineElement.remove();
        this.outlineElement = null;
      }

      // Remove styles
      const styleElement = document.getElementById('tweaq-overlay-styles');
      if (styleElement) {
        styleElement.remove();
      }

      this.isVisible = false;
      this.selectedElement = null;
      this.pendingEdits.clear();

      console.log('🎨 Modern Tweaq Overlay removed');
    }

    toggle(options = {}) {
      if (this.isVisible) {
        this.remove();
      } else {
        this.inject(options);
      }
    }

    // Utility methods
    rgbToHex(rgb) {
      if (rgb.startsWith('#')) return rgb;
      
      const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!match) return '#000000';
      
      const [, r, g, b] = match;
      return '#' + [r, g, b].map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }
  }

  // Create single global overlay instance
  if (window.TweaqOverlay) {
    console.error('❌ DUPLICATE OVERLAY DETECTED! This should not happen.');
    return;
  }
  
  window.TweaqOverlay = new ModernTweaqOverlay();
  window.TweaqOverlayInjected = true;
  
  console.log('✅ Single Tweaq Overlay created successfully');
})();
