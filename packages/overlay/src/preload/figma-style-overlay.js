// Figma-Style Tweaq Overlay - Clean unified properties panel
// This replaces the old measure/edit system with a single unified panel

(function() {
  'use strict';

  // Check if already initialized - EARLY EXIT
  if (window.TweaqOverlay && window.TweaqOverlay._initialized) {
    console.log('⚠️ TweaqOverlay already loaded, skipping initialization');
    return;
  }

  // NUCLEAR cleanup - remove EVERYTHING overlay related
  console.log('🧹 Cleaning up old overlay...');
  
  document.querySelectorAll('*').forEach(el => {
    if (el.className && typeof el.className === 'string' && el.className.includes('tweaq')) {
      el.remove();
    }
  });
  
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
    if (el.id && (el.id.includes('tweaq') || el.id.includes('smartqa'))) {
      el.remove();
    }
    if (el.textContent && el.textContent.includes('tweaq')) {
      el.remove();
    }
  });
  
  if (document.body) {
    document.body.classList.remove('tweaq-panel-open');
  }
  
  console.log('✅ Cleanup complete');

  // Inject styles
  function injectStyles() {
    if (document.getElementById('tweaq-overlay-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'tweaq-overlay-styles';
    style.textContent = `
      /* Tweaq Figma-Style Overlay */

      /* Body adjustment for panel */
      body.tweaq-panel-open {
        margin-right: 400px;
        transition: margin-right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      /* Element outline */
      .tweaq-element-outline {
        position: absolute;
        pointer-events: none;
        border: 2px solid #0A84FF;
        background-color: rgba(10, 132, 255, 0.1);
        z-index: 999999;
        transition: all 0.1s ease;
        box-shadow: 0 0 0 1px rgba(10, 132, 255, 0.3);
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
        background: rgba(28, 28, 30, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        padding: 8px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 36px;
      }

      .tweaq-selection-name {
        font-size: 13px;
        font-weight: 600;
        color: #ffffff;
      }

      .tweaq-mode-toggle-btn {
        border: none;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
      }

      .tweaq-mode-toggle-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

      .tweaq-mode-toggle-btn.active {
        background: linear-gradient(135deg, #0A84FF 0%, #0066CC 100%);
        box-shadow: 0 2px 8px rgba(10, 132, 255, 0.4);
      }

      .tweaq-mode-toggle-btn svg {
        width: 20px;
        height: 20px;
      }

      .tweaq-close-btn {
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        color: #cccccc;
        transition: all 0.15s ease;
        margin-left: 12px;
      }

      .tweaq-close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }

      /* Properties Panel */
      .tweaq-properties-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        height: 100vh;
        pointer-events: auto;
        background: rgba(28, 28, 30, 0.98);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        z-index: 1000001;
        will-change: transform;
      }

      .tweaq-properties-panel.visible {
        transform: translateX(0);
      }

      /* Ensure content stays within panel during animation */
      .tweaq-properties-panel * {
        will-change: auto;
      }

      /* Panel Header */
      .tweaq-panel-header {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.03);
      }

      .tweaq-panel-tabs {
        display: flex;
        gap: 0;
        padding: 0 24px;
        padding-top: 16px;
      }

      .tweaq-tab {
        padding: 10px 16px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: #888888;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .tweaq-tab:hover {
        color: #aaaaaa;
      }

      .tweaq-tab.active {
        color: #ffffff;
        border-bottom-color: #007AFF;
      }

      .tweaq-tab-content-header {
        padding: 16px 24px 20px 24px;
      }

      .tweaq-panel-title {
        font-size: 11px;
        font-weight: 600;
        color: #888888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 8px 0;
      }

      .tweaq-element-name {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        margin: 0;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        flex: 1;
      }

      .tweaq-element-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .tweaq-record-edit-icon-btn {
        background: linear-gradient(135deg, #34C759, #248A3D);
        border: none;
        border-radius: 6px;
        padding: 6px 8px;
        cursor: pointer;
        color: #ffffff;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
        opacity: 0;
        transform: scale(0.8);
        pointer-events: none;
      }

      .tweaq-record-edit-icon-btn.visible {
        opacity: 1;
        transform: scale(1);
        pointer-events: auto;
      }

      .tweaq-record-edit-icon-btn:hover {
        background: linear-gradient(135deg, #248A3D, #1A6929);
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(52, 199, 89, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .tweaq-record-edit-icon-btn:active {
        transform: scale(0.95);
        box-shadow: 0 1px 4px rgba(52, 199, 89, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      /* Panel Content */
      .tweaq-panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 0;
      }

      .tweaq-panel-content::-webkit-scrollbar {
        width: 8px;
      }

      .tweaq-panel-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
      }

      .tweaq-panel-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }

      .tweaq-panel-content::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /* Property Section */
      .tweaq-property-section {
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }

      .tweaq-property-section:last-child {
        border-bottom: none;
      }

      .tweaq-section-header {
        font-size: 11px;
        font-weight: 600;
        color: #888888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 12px 0;
      }

      /* Property Row */
      .tweaq-property {
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 12px;
        align-items: center;
        margin-bottom: 12px;
      }

      .tweaq-property:last-child {
        margin-bottom: 0;
      }

      .tweaq-property-label {
        font-size: 12px;
        font-weight: 500;
        color: #cccccc;
      }

      .tweaq-property-value {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Input Styles */
      .tweaq-input,
      .tweaq-select {
        width: 100%;
        padding: 6px 10px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        font-size: 12px;
        background: rgba(255, 255, 255, 0.05);
        color: #ffffff;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        transition: all 0.15s ease;
      }

      .tweaq-input:focus,
      .tweaq-select:focus {
        outline: none;
        border-color: #0A84FF;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.2);
      }

      .tweaq-input:hover,
      .tweaq-select:hover {
        border-color: rgba(255, 255, 255, 0.25);
      }

      .tweaq-input[readonly] {
        background: rgba(255, 255, 255, 0.03);
        color: #888888;
        cursor: default;
      }

      /* Number input with unit */
      .tweaq-number-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .tweaq-number-input {
        flex: 1;
      }

      .tweaq-unit {
        font-size: 11px;
        color: #888888;
        font-weight: 500;
      }

      /* Color input */
      .tweaq-color-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tweaq-color-swatch {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      /* Edit Tickets */
      .tweaq-edits-list {
        padding: 16px 24px;
      }

      .tweaq-edit-ticket {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        transition: all 0.2s ease;
        position: relative;
      }

      .tweaq-edit-ticket:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
      }

      .tweaq-edit-ticket.processing {
        border-color: rgba(0, 122, 255, 0.5);
        background: rgba(0, 122, 255, 0.05);
      }

      .tweaq-edit-ticket.completed {
        border-color: rgba(52, 199, 89, 0.5);
        background: rgba(52, 199, 89, 0.05);
      }

      .tweaq-edit-ticket.failed {
        border-color: rgba(255, 59, 48, 0.5);
        background: rgba(255, 59, 48, 0.05);
      }

      .tweaq-ticket-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .tweaq-ticket-element {
        font-size: 14px;
        font-weight: 600;
        color: #ffffff;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        margin: 0 0 4px 0;
      }

      .tweaq-ticket-timestamp {
        font-size: 11px;
        color: #888888;
        margin: 0;
      }

      .tweaq-ticket-delete {
        background: transparent;
        border: none;
        color: #888888;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tweaq-ticket-delete:hover {
        background: rgba(255, 59, 48, 0.2);
        color: #FF3B30;
      }

      .tweaq-ticket-changes {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .tweaq-ticket-change {
        font-size: 12px;
        color: #cccccc;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        border-left: 2px solid #007AFF;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .tweaq-ticket-change-property {
        color: #64D2FF;
        font-weight: 600;
      }

      .tweaq-ticket-change-before {
        color: #FF6B6B;
        text-decoration: line-through;
        opacity: 0.7;
      }

      .tweaq-ticket-change-arrow {
        color: #888888;
        font-weight: bold;
      }

      .tweaq-ticket-change-after {
        color: #51CF66;
        font-weight: 600;
      }

      /* Ticket Status */
      .tweaq-ticket-status {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .tweaq-ticket-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .tweaq-ticket-status-badge.processing {
        background: rgba(0, 122, 255, 0.2);
        color: #0A84FF;
      }

      .tweaq-ticket-status-badge.completed {
        background: rgba(52, 199, 89, 0.2);
        color: #34C759;
      }

      .tweaq-ticket-status-badge.failed {
        background: rgba(255, 59, 48, 0.2);
        color: #FF3B30;
      }

      .tweaq-spinner {
        width: 12px;
        height: 12px;
        border: 2px solid rgba(10, 132, 255, 0.3);
        border-top-color: #0A84FF;
        border-radius: 50%;
        animation: tweaq-spin 0.8s linear infinite;
      }

      @keyframes tweaq-spin {
        to { transform: rotate(360deg); }
      }

      .tweaq-pr-link {
        color: #0A84FF;
        text-decoration: none;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.15s ease;
      }

      .tweaq-pr-link:hover {
        background: rgba(10, 132, 255, 0.1);
        text-decoration: underline;
      }

      .tweaq-ticket-error {
        color: #FF6B6B;
        font-size: 11px;
        margin-top: 4px;
      }

      /* Confirm Edits Button */
      .tweaq-confirm-edits-section {
        padding: 16px 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .tweaq-confirm-edits-info {
        margin-bottom: 12px;
        padding: 12px;
        background: rgba(52, 199, 89, 0.1);
        border: 1px solid rgba(52, 199, 89, 0.3);
        border-radius: 6px;
      }

      .tweaq-confirm-edits-info p {
        margin: 0;
        font-size: 12px;
        color: #34C759;
        line-height: 1.5;
      }

      .tweaq-confirm-edits-btn {
        width: 100%;
        padding: 14px 20px;
        background: linear-gradient(135deg, #34C759, #248A3D);
        color: #ffffff;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .tweaq-confirm-edits-btn:hover {
        background: linear-gradient(135deg, #248A3D, #1A6929);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(52, 199, 89, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .tweaq-confirm-edits-btn:active {
        transform: translateY(0);
        box-shadow: 0 1px 4px rgba(52, 199, 89, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .tweaq-confirm-edits-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      /* Empty state */
      .tweaq-empty-state {
        padding: 48px 24px;
        text-align: center;
      }

      .tweaq-empty-state-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.3;
      }

      .tweaq-empty-state-title {
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 8px 0;
      }

      .tweaq-empty-state-text {
        font-size: 13px;
        color: #888888;
        margin: 0;
        line-height: 1.5;
      }

      .tweaq-color-swatch:hover {
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
      }

      .tweaq-color-input {
        flex: 1;
      }

      /* Dimension Grid (for width/height) */
      .tweaq-dimension-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      /* Empty State */
      .tweaq-empty-state {
        padding: 40px 24px;
        text-align: center;
        color: #888888;
      }

      .tweaq-empty-state-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .tweaq-empty-state-text {
        font-size: 14px;
        line-height: 1.5;
      }

      /* Chat Panel Styles */
      .tweaq-chat-panel {
        position: fixed;
        right: 430px;
        top: 80px;
        width: 380px;
        max-height: calc(100vh - 100px);
        background: rgba(28, 28, 30, 0.98);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        display: none;
        flex-direction: column;
        z-index: 1000002;
        animation: chatSlideIn 0.3s ease-out;
      }

      .tweaq-chat-panel.visible {
        display: flex;
      }

      @keyframes chatSlideIn {
        from {
          transform: translateX(50px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .tweaq-chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px 12px 0 0;
      }

      .tweaq-chat-title {
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tweaq-chat-close {
        width: 28px;
        height: 28px;
        border: none;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s;
      }

      .tweaq-chat-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .tweaq-chat-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 16px;
        overflow-y: auto;
        gap: 12px;
      }

      .tweaq-instructions-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 1;
        min-height: 100px;
        max-height: 300px;
        overflow-y: auto;
      }

      .tweaq-empty-instructions {
        text-align: center;
        padding: 40px 20px;
        color: #999;
      }

      .tweaq-empty-instructions p {
        margin: 8px 0;
        font-size: 14px;
      }

      .tweaq-instruction-item {
        display: flex;
        align-items: start;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        transition: all 0.2s;
      }

      .tweaq-instruction-item:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .tweaq-instruction-content {
        flex: 1;
        min-width: 0;
      }

      .tweaq-instruction-text {
        font-size: 14px;
        color: #fff;
        line-height: 1.5;
        margin-bottom: 4px;
        word-wrap: break-word;
      }

      .tweaq-instruction-target {
        font-size: 11px;
        color: #999;
        font-family: Monaco, Menlo, 'Courier New', monospace;
        margin-top: 4px;
      }

      .tweaq-instruction-remove {
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        color: #999;
        cursor: pointer;
        border-radius: 4px;
        font-size: 14px;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .tweaq-instruction-remove:hover {
        background: rgba(255, 59, 48, 0.2);
        color: #FF3B30;
      }

      .tweaq-chat-input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .tweaq-chat-input {
        width: 100%;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
        transition: border-color 0.2s;
      }

      .tweaq-chat-input:focus {
        outline: none;
        border-color: #667eea;
        background: rgba(255, 255, 255, 0.08);
      }

      .tweaq-chat-send-btn {
        align-self: flex-end;
        padding: 10px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tweaq-chat-send-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .tweaq-chat-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .tweaq-chat-examples {
        margin-top: 4px;
      }

      .tweaq-examples-label {
        font-size: 12px;
        color: #999;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .tweaq-example-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .tweaq-example-chip {
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        font-size: 12px;
        color: #ccc;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tweaq-example-chip:hover {
        border-color: #667eea;
        color: #667eea;
        background: rgba(102, 126, 234, 0.1);
      }
    `;

    document.head.appendChild(style);
  }

  class FigmaStyleOverlay {
    constructor() {
      this.isVisible = false;
      this.isHiding = false;
      this.selectedElement = null;
      this.hoveredElement = null;
      this.pendingEdits = new Map();
      this.recordedEdits = [];
      this.processingEdits = false;
      
      this.overlayContainer = null;
      this.outlineElement = null;
      this.propertiesPanel = null;
      
      // Mode: 'chat' (default) or 'select'
      this.mode = 'chat';
      
      // Chat state
      this.naturalLanguageEdits = [];
      
      // Bind methods
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleClick = this.handleClick.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    async inject(options = {}) {
      if (this.isVisible) return;

      injectStyles();
      this.createOverlayElements();
      this.attachEventListeners();
      this.isVisible = true;
      
      // Show panel immediately with CHAT view (default mode)
      this.showPanel();
      this.renderPanel();
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

      // Create properties panel
      this.propertiesPanel = document.createElement('div');
      this.propertiesPanel.className = 'tweaq-properties-panel';
      this.overlayContainer.appendChild(this.propertiesPanel);

      this.renderToolbar();
    }

    renderToolbar() {
      const existingToolbar = this.overlayContainer.querySelector('.tweaq-overlay-toolbar');
      if (existingToolbar) {
        existingToolbar.remove();
      }

      const toolbar = document.createElement('div');
      toolbar.className = 'tweaq-overlay-toolbar';
      
      const elementName = this.getElementName();
      
      const modeIcon = this.mode === 'chat' 
        ? `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10L10 2L18 10L10 18L2 10Z"/><circle cx="10" cy="10" r="2" fill="white"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M8 2L18 7V13L8 18L2 13V7L8 2Z"/></svg>`;

      toolbar.innerHTML = `
        <button class="tweaq-mode-toggle-btn ${this.mode === 'select' ? 'active' : ''}" title="${this.mode === 'chat' ? 'Switch to Select mode' : 'Back to Chat mode'}">
          ${modeIcon}
        </button>
        <span class="tweaq-selection-name">${this.mode === 'chat' ? 'Chat' : elementName}</span>
        <button class="tweaq-close-btn" title="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
          </svg>
        </button>
      `;

      toolbar.addEventListener('click', (e) => {
        if (e.target.closest('.tweaq-mode-toggle-btn')) {
          this.toggleMode();
        } else if (e.target.closest('.tweaq-close-btn')) {
          this.hide();
        }
      });

      this.overlayContainer.appendChild(toolbar);
    }

    getElementName() {
      if (!this.selectedElement) return 'Page';
      
      const tag = this.selectedElement.tagName.toLowerCase();
      const id = this.selectedElement.id ? `#${this.selectedElement.id}` : '';
      const className = this.selectedElement.className && typeof this.selectedElement.className === 'string'
        ? `.${this.selectedElement.className.split(' ')[0]}`
        : '';
      
      return `${tag}${id}${className}`;
    }

    toggleMode() {
      this.mode = this.mode === 'chat' ? 'select' : 'chat';
      console.log('🔄 Mode switched to:', this.mode);
      
      if (this.mode === 'chat') {
        // Clear selection when going back to chat
        this.selectedElement = null;
        this.updateOutline(null);
      }
      
      this.renderToolbar();
      this.renderPanel();
    }

    showPanel() {
      document.body.classList.add('tweaq-panel-open');
      setTimeout(() => {
        this.propertiesPanel.classList.add('visible');
      }, 10);
    }

    hidePanel() {
      // Remove body margin first to prevent content jumping
      document.body.classList.remove('tweaq-panel-open');
      // Then slide out panel
      this.propertiesPanel.classList.remove('visible');
    }

    renderPanel() {
      if (this.mode === 'chat') {
        this.renderChatView();
      } else {
        this.renderProperties();
      }
    }

    renderChatView() {
      const instructionsList = this.naturalLanguageEdits.length > 0
        ? this.naturalLanguageEdits.map((edit, index) => `
            <div class="tweaq-instruction-item" data-index="${index}">
              <div class="tweaq-instruction-content">
                <div class="tweaq-instruction-text">${edit.instruction}</div>
                ${edit.targetElement ? `<div class="tweaq-instruction-target">→ ${edit.targetElement.selector}</div>` : ''}
              </div>
              <button class="tweaq-instruction-remove" data-index="${index}">✕</button>
            </div>
          `).join('')
        : `
          <div class="tweaq-empty-instructions">
            <p style="font-size: 32px; margin: 0 0 8px 0;">💬</p>
            <p style="margin: 0 0 4px 0; font-weight: 600;">No instructions yet</p>
            <p style="color: #888; font-size: 12px; margin: 0;">Tell the agent what you want to change</p>
          </div>
        `;

      this.propertiesPanel.innerHTML = `
        <div class="tweaq-panel-header">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #fff;">Chat</h3>
        </div>
        <div class="tweaq-panel-content" style="padding: 16px; display: flex; flex-direction: column; gap: 12px; flex: 1;">
          <div class="tweaq-instructions-list">
            ${instructionsList}
          </div>
          <div class="tweaq-chat-input-wrapper">
            <textarea 
              class="tweaq-chat-input" 
              placeholder="Describe the change you want to make..." 
              rows="3"
            ></textarea>
            <button class="tweaq-chat-send-btn">Add Instruction</button>
          </div>
          <div class="tweaq-chat-examples">
            <div class="tweaq-examples-label">Examples:</div>
            <div class="tweaq-example-chips">
              <button class="tweaq-example-chip">Make the copy more friendly</button>
              <button class="tweaq-example-chip">Condense this section</button>
              <button class="tweaq-example-chip">Rework the layout to be more modern</button>
            </div>
          </div>
        </div>
      `;

      // Add event listeners
      const sendBtn = this.propertiesPanel.querySelector('.tweaq-chat-send-btn');
      const input = this.propertiesPanel.querySelector('.tweaq-chat-input');
      
      sendBtn.addEventListener('click', () => {
        this.addInstruction();
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.addInstruction();
        }
      });

      this.propertiesPanel.querySelectorAll('.tweaq-example-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          input.value = chip.textContent;
          input.focus();
        });
      });

      this.propertiesPanel.querySelectorAll('.tweaq-instruction-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.getAttribute('data-index'));
          this.removeInstruction(index);
        });
      });
    }

    addInstruction() {
      const input = this.propertiesPanel.querySelector('.tweaq-chat-input');
      if (!input) return;
      
      const instruction = input.value.trim();
      
      if (!instruction) return;

      const newEdit = {
        id: `nl_${Date.now()}`,
        type: 'natural-language',
        instruction,
        targetElement: null,
        context: {
          scope: 'page',
          userIntent: instruction
        },
        timestamp: Date.now()
      };

      this.naturalLanguageEdits.push(newEdit);
      input.value = '';
      
      console.log('💬 Added natural language instruction:', newEdit);
      
      this.renderPanel();
    }

    removeInstruction(index) {
      this.naturalLanguageEdits.splice(index, 1);
      console.log('🗑️ Removed instruction at index:', index);
      
      this.renderPanel();
    }

    renderProperties() {
      this.propertiesPanel.innerHTML = `
        <div class="tweaq-panel-header">
          <div class="tweaq-panel-tabs">
            <button class="tweaq-tab ${this.currentTab === 'properties' ? 'active' : ''}" data-tab="properties">
              Properties
            </button>
            <button class="tweaq-tab ${this.currentTab === 'edits' ? 'active' : ''}" data-tab="edits">
              Edits ${this.recordedEdits.length > 0 ? `(${this.recordedEdits.length})` : ''}
            </button>
          </div>
        </div>
        
        ${this.currentTab === 'properties' ? this.renderPropertiesTab() : this.renderEditsTab()}
      `;

      // Attach tab listeners
      this.propertiesPanel.querySelectorAll('.tweaq-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          this.currentTab = e.target.dataset.tab;
          this.renderProperties();
        });
      });

      if (this.currentTab === 'properties') {
        // Attach input event listeners for properties
        this.attachPropertyListeners();
      } else {
        // Attach listeners for edits tab
        this.attachEditsListeners();
      }
    }

    renderPropertiesTab() {
      const element = this.selectedElement || document.body;
      const isPage = !this.selectedElement;
      
      const rect = element.getBoundingClientRect();
      const computedStyles = window.getComputedStyle(element);
      
      const hasPendingEdits = this.pendingEdits.size > 0;
      
      return `
        <div class="tweaq-tab-content-header">
          <div class="tweaq-panel-title">${isPage ? 'PAGE' : 'ELEMENT'}</div>
          <div class="tweaq-element-header">
            <div class="tweaq-element-name">${this.getElementName()}</div>
            <button 
              class="tweaq-record-edit-icon-btn ${hasPendingEdits ? 'visible' : ''}" 
              id="tweaq-record-edit-icon"
              title="Record this edit"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="tweaq-panel-content">
          ${this.renderDesignSection(element, rect, computedStyles)}
          ${this.renderLayoutSection(element, rect, computedStyles)}
          ${this.renderTextSection(element, computedStyles)}
          ${this.renderEffectsSection(element, computedStyles)}
        </div>
      `;
    }

    renderEditsTab() {
      if (this.recordedEdits.length === 0) {
        return `
          <div class="tweaq-empty-state">
            <div class="tweaq-empty-state-icon">📝</div>
            <h3 class="tweaq-empty-state-title">No Edits Recorded</h3>
            <p class="tweaq-empty-state-text">Make changes to elements and click "Record Edit" to save them here.</p>
          </div>
        `;
      }

      const pendingEdits = this.recordedEdits.filter(edit => edit.status === 'pending');
      const hasCompletedEdits = this.recordedEdits.some(edit => edit.status === 'completed');

      return `
        <div class="tweaq-panel-content">
          <div class="tweaq-edits-list">
            ${this.recordedEdits.map((edit, index) => this.renderEditTicket(edit, index)).join('')}
          </div>
        </div>
        
        ${pendingEdits.length > 0 ? `
          <div class="tweaq-confirm-edits-section">
            <div class="tweaq-confirm-edits-info">
              <p><strong>${pendingEdits.length}</strong> edit${pendingEdits.length === 1 ? '' : 's'} ready to be converted into a PR using Agent V4.</p>
            </div>
            <button 
              class="tweaq-confirm-edits-btn" 
              id="tweaq-confirm-edits"
              ${this.processingEdits ? 'disabled' : ''}
            >
              ${this.processingEdits ? '⏳ Processing...' : '✅ Confirm & Create PR'}
            </button>
          </div>
        ` : hasCompletedEdits ? `
          <div class="tweaq-confirm-edits-section">
            <div class="tweaq-confirm-edits-info" style="background: rgba(52, 199, 89, 0.1); border-color: rgba(52, 199, 89, 0.3);">
              <p style="color: #34C759;">All edits have been processed successfully! ✨</p>
            </div>
          </div>
        ` : ''}
      `;
    }

    renderEditTicket(edit, index) {
      const timestamp = new Date(edit.timestamp).toLocaleString();
      const status = edit.status || 'pending';
      
      return `
        <div class="tweaq-edit-ticket ${status}" data-edit-index="${index}">
          <div class="tweaq-ticket-header">
            <div>
              <h4 class="tweaq-ticket-element">${edit.elementName}</h4>
              <p class="tweaq-ticket-timestamp">${timestamp}</p>
            </div>
            ${status === 'pending' ? `
              <button class="tweaq-ticket-delete" data-delete-index="${index}" title="Delete edit">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z"/>
                </svg>
              </button>
            ` : ''}
          </div>
          <div class="tweaq-ticket-changes">
            ${edit.changes.map(change => `
              <div class="tweaq-ticket-change">
                <span class="tweaq-ticket-change-property">${change.property}</span>: 
                <span class="tweaq-ticket-change-before">${change.before}</span>
                <span class="tweaq-ticket-change-arrow">→</span>
                <span class="tweaq-ticket-change-after">${change.after}</span>
              </div>
            `).join('')}
          </div>
          ${this.renderTicketStatus(edit)}
        </div>
      `;
    }

    renderTicketStatus(edit) {
      const status = edit.status || 'pending';
      
      if (status === 'pending') {
        return ''; // No status bar for pending
      }
      
      if (status === 'processing') {
        return `
          <div class="tweaq-ticket-status">
            <div class="tweaq-ticket-status-badge processing">
              <div class="tweaq-spinner"></div>
              Processing
            </div>
            <span style="color: #888; font-size: 11px;">Agent V4 is analyzing and creating PR...</span>
          </div>
        `;
      }
      
      if (status === 'completed') {
        return `
          <div class="tweaq-ticket-status">
            <div class="tweaq-ticket-status-badge completed">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
              </svg>
              Completed
            </div>
            ${edit.prUrl ? `
              <a href="${edit.prUrl}" class="tweaq-pr-link" target="_blank" rel="noopener noreferrer">
                View Pull Request
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.75 2a.75.75 0 000 1.5h7.19L1.22 13.22a.75.75 0 101.06 1.06L12 4.56v7.19a.75.75 0 001.5 0v-9a.75.75 0 00-.75-.75h-9z"/>
                </svg>
              </a>
            ` : ''}
          </div>
        `;
      }
      
      if (status === 'failed') {
        return `
          <div class="tweaq-ticket-status">
            <div class="tweaq-ticket-status-badge failed">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z"/>
              </svg>
              Failed
            </div>
            ${edit.error ? `
              <p class="tweaq-ticket-error">${edit.error}</p>
            ` : ''}
          </div>
        `;
      }
      
      return '';
    }

    renderDesignSection(element, rect, styles) {
      const bgColor = styles.backgroundColor;
      const borderRadius = parseInt(styles.borderRadius) || 0;
      
      return `
        <div class="tweaq-property-section">
          <h4 class="tweaq-section-header">Design</h4>
          
          <div class="tweaq-property">
            <label class="tweaq-property-label">Fill</label>
            <div class="tweaq-property-value">
              <div class="tweaq-color-group">
                <div class="tweaq-color-swatch" style="background: ${bgColor};" data-property="backgroundColor"></div>
                <input type="text" class="tweaq-input tweaq-color-input" value="${bgColor}" data-property="backgroundColor" data-type="color">
              </div>
            </div>
          </div>
          
          <div class="tweaq-property">
            <label class="tweaq-property-label">Corner Radius</label>
            <div class="tweaq-property-value">
              <div class="tweaq-number-group">
                <input type="number" class="tweaq-input tweaq-number-input" value="${borderRadius}" data-property="borderRadius" data-unit="px">
                <span class="tweaq-unit">px</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    renderLayoutSection(element, rect, styles) {
      const display = styles.display;
      const position = styles.position;
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      
      return `
        <div class="tweaq-property-section">
          <h4 class="tweaq-section-header">Layout</h4>
          
          <div class="tweaq-property">
            <label class="tweaq-property-label">Position</label>
            <div class="tweaq-property-value">
              <select class="tweaq-select" data-property="position">
                <option value="static" ${position === 'static' ? 'selected' : ''}>Static</option>
                <option value="relative" ${position === 'relative' ? 'selected' : ''}>Relative</option>
                <option value="absolute" ${position === 'absolute' ? 'selected' : ''}>Absolute</option>
                <option value="fixed" ${position === 'fixed' ? 'selected' : ''}>Fixed</option>
                <option value="sticky" ${position === 'sticky' ? 'selected' : ''}>Sticky</option>
              </select>
            </div>
          </div>
          
          <div class="tweaq-property">
            <label class="tweaq-property-label">Display</label>
            <div class="tweaq-property-value">
              <select class="tweaq-select" data-property="display">
                <option value="block" ${display === 'block' ? 'selected' : ''}>Block</option>
                <option value="inline" ${display === 'inline' ? 'selected' : ''}>Inline</option>
                <option value="inline-block" ${display === 'inline-block' ? 'selected' : ''}>Inline Block</option>
                <option value="flex" ${display === 'flex' ? 'selected' : ''}>Flex</option>
                <option value="grid" ${display === 'grid' ? 'selected' : ''}>Grid</option>
                <option value="none" ${display === 'none' ? 'selected' : ''}>None</option>
              </select>
            </div>
          </div>
          
          <div class="tweaq-property">
            <label class="tweaq-property-label">Size</label>
            <div class="tweaq-property-value">
              <div class="tweaq-dimension-grid">
                <div class="tweaq-number-group">
                  <input type="text" class="tweaq-input" value="${width}" readonly>
                  <span class="tweaq-unit">W</span>
                </div>
                <div class="tweaq-number-group">
                  <input type="text" class="tweaq-input" value="${height}" readonly>
                  <span class="tweaq-unit">H</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    renderTextSection(element, styles) {
      if (!element.textContent || element === document.body) {
        return '';
      }
      
      const fontSize = parseInt(styles.fontSize) || 16;
      const fontWeight = styles.fontWeight;
      const color = styles.color;
      const textAlign = styles.textAlign;
      
      return `
        <div class="tweaq-property-section">
          <h4 class="tweaq-section-header">Text</h4>
          
          <div class="tweaq-property">
            <label class="tweaq-property-label">Size</label>
            <div class="tweaq-property-value">
              <div class="tweaq-number-group">
                <input type="number" class="tweaq-input tweaq-number-input" value="${fontSize}" data-property="fontSize" data-unit="px">
                <span class="tweaq-unit">px</span>
              </div>
            </div>
          </div>
          
          <div class="tweaq-property">
            <label class="tweaq-property-label">Weight</label>
            <div class="tweaq-property-value">
              <select class="tweaq-select" data-property="fontWeight">
                <option value="100" ${fontWeight === '100' ? 'selected' : ''}>Thin</option>
                <option value="200" ${fontWeight === '200' ? 'selected' : ''}>Extra Light</option>
                <option value="300" ${fontWeight === '300' ? 'selected' : ''}>Light</option>
                <option value="400" ${fontWeight === '400' ? 'selected' : ''}>Regular</option>
                <option value="500" ${fontWeight === '500' ? 'selected' : ''}>Medium</option>
                <option value="600" ${fontWeight === '600' ? 'selected' : ''}>Semi Bold</option>
                <option value="700" ${fontWeight === '700' ? 'selected' : ''}>Bold</option>
                <option value="800" ${fontWeight === '800' ? 'selected' : ''}>Extra Bold</option>
                <option value="900" ${fontWeight === '900' ? 'selected' : ''}>Black</option>
              </select>
            </div>
          </div>
          
          <div class="tweaq-property">
            <label class="tweaq-property-label">Color</label>
            <div class="tweaq-property-value">
              <div class="tweaq-color-group">
                <div class="tweaq-color-swatch" style="background: ${color};" data-property="color"></div>
                <input type="text" class="tweaq-input tweaq-color-input" value="${color}" data-property="color" data-type="color">
              </div>
            </div>
          </div>
          
          <div class="tweaq-property">
            <label class="tweaq-property-label">Align</label>
            <div class="tweaq-property-value">
              <select class="tweaq-select" data-property="textAlign">
                <option value="left" ${textAlign === 'left' ? 'selected' : ''}>Left</option>
                <option value="center" ${textAlign === 'center' ? 'selected' : ''}>Center</option>
                <option value="right" ${textAlign === 'right' ? 'selected' : ''}>Right</option>
                <option value="justify" ${textAlign === 'justify' ? 'selected' : ''}>Justify</option>
              </select>
            </div>
          </div>
        </div>
      `;
    }

    renderEffectsSection(element, styles) {
      const opacity = parseFloat(styles.opacity);
      const boxShadow = styles.boxShadow !== 'none' ? styles.boxShadow : '';
      
      return `
        <div class="tweaq-property-section">
          <h4 class="tweaq-section-header">Effects</h4>
          
          <div class="tweaq-property">
            <label class="tweaq-property-label">Opacity</label>
            <div class="tweaq-property-value">
              <div class="tweaq-number-group">
                <input type="number" class="tweaq-input tweaq-number-input" value="${Math.round(opacity * 100)}" min="0" max="100" data-property="opacity" data-unit="%">
                <span class="tweaq-unit">%</span>
              </div>
            </div>
          </div>
          
          ${boxShadow ? `
          <div class="tweaq-property">
            <label class="tweaq-property-label">Shadow</label>
            <div class="tweaq-property-value">
              <input type="text" class="tweaq-input" value="${boxShadow}" data-property="boxShadow">
            </div>
          </div>
          ` : ''}
        </div>
      `;
    }

    attachPropertyListeners() {
      const inputs = this.propertiesPanel.querySelectorAll('.tweaq-input, .tweaq-select');
      
      inputs.forEach(input => {
        if (input.hasAttribute('readonly')) return;
        
        input.addEventListener('change', (e) => {
          const property = e.target.dataset.property;
          const unit = e.target.dataset.unit || '';
          let value = e.target.value;
          
          if (unit === 'px') {
            value = `${value}px`;
          } else if (unit === '%' && property === 'opacity') {
            value = (parseInt(value) / 100).toString();
          }
          
          this.applyProperty(property, value);
        });
      });

      // Color swatch click handler
      const swatches = this.propertiesPanel.querySelectorAll('.tweaq-color-swatch');
      swatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
          const property = e.target.dataset.property;
          const input = e.target.parentElement.querySelector('input');
          
          // Create hidden color input
          const colorInput = document.createElement('input');
          colorInput.type = 'color';
          colorInput.value = this.rgbToHex(input.value);
          colorInput.style.display = 'none';
          document.body.appendChild(colorInput);
          
          colorInput.addEventListener('change', () => {
            const color = colorInput.value;
            input.value = color;
            swatch.style.background = color;
            this.applyProperty(property, color);
            colorInput.remove();
          });
          
          colorInput.click();
        });
      });

      // Record edit icon button
      const recordIconBtn = document.getElementById('tweaq-record-edit-icon');
      if (recordIconBtn) {
        recordIconBtn.addEventListener('click', () => this.recordCurrentEdits());
      }
    }

    attachEditsListeners() {
      // Delete edit buttons
      const deleteButtons = this.propertiesPanel.querySelectorAll('.tweaq-ticket-delete');
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.currentTarget.dataset.deleteIndex);
          this.deleteEdit(index);
        });
      });

      // Confirm edits button
      const confirmBtn = document.getElementById('tweaq-confirm-edits');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => this.confirmEdits());
      }
    }

    recordCurrentEdits() {
      if (this.pendingEdits.size === 0) return;

      const element = this.selectedElement || document.body;
      const changes = [];

      this.pendingEdits.forEach((change, property) => {
        changes.push({
          property,
          before: change.before,
          after: change.after
        });
      });

      const edit = {
        elementName: this.getElementName(),
        elementSelector: this.generateElementSelector(element),
        timestamp: Date.now(),
        changes,
        element: element.tagName.toLowerCase(),
        elementId: element.id || null,
        elementClasses: Array.from(element.classList),
        status: 'pending', // pending, processing, completed, failed
        prUrl: null,
        error: null
      };

      this.recordedEdits.push(edit);
      this.pendingEdits.clear();
      this.originalValues.clear();

      // Switch to edits tab to show the newly recorded edit
      this.currentTab = 'edits';
      this.renderProperties();
    }

    deleteEdit(index) {
      this.recordedEdits.splice(index, 1);
      this.renderProperties();
    }

    async confirmEdits() {
      if (this.recordedEdits.length === 0 || this.processingEdits) return;

      this.processingEdits = true;

      // Update all edits to processing status
      this.recordedEdits.forEach(edit => {
        if (edit.status === 'pending') {
          edit.status = 'processing';
        }
      });
      this.renderProperties();

      // Prepare edits for Agent V4 with before/after values
      const editsForAgent = this.recordedEdits
        .filter(edit => edit.status === 'processing')
        .map(edit => ({
          selector: edit.elementSelector,
          element: edit.element,
          elementId: edit.elementId,
          elementClasses: edit.elementClasses,
          changes: edit.changes.map(change => ({
            property: change.property,
            before: change.before,
            after: change.after
          }))
        }));

      // Send to Electron main process to trigger Agent V4
      if (window.electronAPI && window.electronAPI.triggerAgentV4) {
        try {
          const result = await window.electronAPI.triggerAgentV4({
            edits: editsForAgent,
            url: window.location.href
          });
          
          if (result.success) {
            // Update all processing edits to completed
            this.recordedEdits.forEach(edit => {
              if (edit.status === 'processing') {
                edit.status = 'completed';
                edit.prUrl = result.pr?.url || null;
              }
            });
          } else {
            // Update all processing edits to failed
            this.recordedEdits.forEach(edit => {
              if (edit.status === 'processing') {
                edit.status = 'failed';
                edit.error = result.error || 'Failed to create PR';
              }
            });
          }
          
          this.processingEdits = false;
          this.renderProperties();
        } catch (error) {
          console.error('Failed to trigger Agent V4:', error);
          
          // Update all processing edits to failed
          this.recordedEdits.forEach(edit => {
            if (edit.status === 'processing') {
              edit.status = 'failed';
              edit.error = error instanceof Error ? error.message : 'Unknown error';
            }
          });
          
          this.processingEdits = false;
          this.renderProperties();
        }
      } else {
        console.error('electronAPI.triggerAgentV4 not available');
        
        this.recordedEdits.forEach(edit => {
          if (edit.status === 'processing') {
            edit.status = 'failed';
            edit.error = 'Agent V4 integration not available';
          }
        });
        
        this.processingEdits = false;
        this.renderProperties();
      }
    }

    generateElementSelector(element) {
      if (element.id) {
        return `#${element.id}`;
      }
      
      const tag = element.tagName.toLowerCase();
      const className = element.className 
        ? `.${Array.from(element.classList).join('.')}` 
        : '';
      
      return `${tag}${className}`;
    }

    applyProperty(property, value) {
      const element = this.selectedElement || document.body;
      
      // Store the original value before making the change (if not already stored)
      if (!this.originalValues) {
        this.originalValues = new Map();
      }
      
      if (!this.originalValues.has(property)) {
        // Get the current computed value before changing
        const computedStyles = window.getComputedStyle(element);
        const originalValue = computedStyles[property] || element.style[property] || 'none';
        this.originalValues.set(property, originalValue);
      }
      
      // Apply the change
      element.style[property] = value;
      
      // Track the edit with before/after values
      this.pendingEdits.set(property, {
        before: this.originalValues.get(property),
        after: value
      });
      
      console.log(`Applied ${property}: ${this.originalValues.get(property)} → ${value}`, 'Pending edits:', this.pendingEdits.size);
      
      // Update the record button visibility
      this.updateRecordButtonVisibility();
    }

    updateRecordButtonVisibility() {
      const recordBtn = document.getElementById('tweaq-record-edit-icon');
      if (recordBtn) {
        if (this.pendingEdits.size > 0) {
          recordBtn.classList.add('visible');
        } else {
          recordBtn.classList.remove('visible');
        }
      }
    }

    rgbToHex(rgb) {
      if (rgb.startsWith('#')) return rgb;
      
      const matches = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!matches) return '#000000';
      
      const r = parseInt(matches[1]).toString(16).padStart(2, '0');
      const g = parseInt(matches[2]).toString(16).padStart(2, '0');
      const b = parseInt(matches[3]).toString(16).padStart(2, '0');
      
      return `#${r}${g}${b}`;
    }

    handleMouseMove(e) {
      if (!this.isVisible || this.mode !== 'select') return;
      
      // Don't highlight elements in the overlay
      if (e.target.closest('.tweaq-overlay-container') || 
          e.target.closest('.tweaq-properties-panel') ||
          e.target.closest('.tweaq-overlay-toolbar')) {
        this.updateOutline(null);
        return;
      }
      
      this.hoveredElement = e.target;
      this.updateOutline(this.hoveredElement);
    }

    handleClick(e) {
      if (!this.isVisible || this.mode !== 'select') return;
      
      // Don't select elements in the overlay
      if (e.target.closest('.tweaq-overlay-container') || 
          e.target.closest('.tweaq-properties-panel') ||
          e.target.closest('.tweaq-overlay-toolbar')) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      this.selectedElement = e.target;
      this.updateOutline(this.selectedElement);
      this.renderPanel();
      this.renderToolbar();
    }

    handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (this.selectedElement && this.mode === 'select') {
          // First escape: deselect element and go back to chat
          this.mode = 'chat';
          this.selectedElement = null;
          this.updateOutline(null);
          this.renderPanel();
          this.renderToolbar();
        } else {
          // Second escape: hide overlay
          this.hide();
        }
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

    hide() {
      if (!this.isVisible || this.isHiding) return;
      
      this.isHiding = true;
      this.removeEventListeners();
      this.hidePanel();
      
      // Wait for slide-out animation to complete before cleanup
      setTimeout(() => {
        if (this.overlayContainer) this.overlayContainer.remove();
        if (this.outlineElement) this.outlineElement.remove();
        this.overlayContainer = null;
        this.outlineElement = null;
        this.propertiesPanel = null;
        this.selectedElement = null;
        this.hoveredElement = null;
        this.isVisible = false;
        this.isHiding = false;
      }, 320); // Slightly longer than CSS transition (300ms)
    }

    toggle(options = {}) {
      console.log('Toggle called, isVisible:', this.isVisible);
      if (this.isVisible) {
        console.log('Hiding overlay');
        this.hide();
      } else {
        console.log('Showing overlay');
        this.inject(options);
      }
    }

    remove() {
      this.hide();
    }
  }

  // Global API - Singleton pattern
  const overlayInstance = new FigmaStyleOverlay();
  
  window.TweaqOverlay = {
    _initialized: true,
    _instance: overlayInstance,
    
    inject(options) {
      console.log('TweaqOverlay.inject called');
      return overlayInstance.inject(options);
    },
    
    toggle(options) {
      console.log('TweaqOverlay.toggle called, current isVisible:', overlayInstance.isVisible);
      return overlayInstance.toggle(options);
    },
    
    remove() {
      console.log('TweaqOverlay.remove called');
      return overlayInstance.remove();
    }
  };

  console.log('✅ Figma-style Tweaq Overlay loaded and ready');
})();
