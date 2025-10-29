// ⚠️ REFERENCE FILE - DO NOT USE IN PRODUCTION ⚠️
// 
// This is the OLD overlay implementation that included UI rendering.
// Saved for reference in case we need to check old functionality.
// 
// The new approach moved all UI rendering to React components in the main window.
// The active overlay (browser-interaction.js) only handles DOM interaction now.
// 
// Created: October 23, 2025
// Replaced by: Simplified DOM interaction overlay + React UI components
//
// Original comments:
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

    // Set CSS variables for dynamic sizing
    document.documentElement.style.setProperty('--tweaq-toolbar-width', '56px');
    document.documentElement.style.setProperty('--tweaq-panel-width', '320px');

    const style = document.createElement('style');
    style.id = 'tweaq-overlay-styles';
    style.textContent = `
      /* Tweaq Figma-Style Overlay */

      /* Prevent html from scrolling */
      html {
        overflow: hidden !important;
        height: 100vh !important;
      }

      /* Body adjustment for toolbar and panel with margins */
      body {
        margin-top: 28px !important; /* Toolbar ends at 84px from window top, BrowserView starts at 56px, so 84-56=28 */
        margin-left: calc(var(--tweaq-toolbar-width, 56px) + var(--tweaq-panel-width, 320px) + 24px) !important;
        margin-right: 24px !important;
        margin-bottom: 24px !important;
        transition: none !important; /* Instant updates for smooth resize */
        height: calc(100vh - 28px - 24px) !important; /* Fixed height container: full height minus top margin minus bottom margin */
        overflow-y: auto !important;
        overflow-x: hidden !important;
        box-sizing: border-box !important;
        position: relative !important;
      }

      /* Custom scrollbar styling */
      body::-webkit-scrollbar {
        width: 8px;
      }

      body::-webkit-scrollbar-track {
        background: transparent;
      }

      body::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }

      body::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /* Disable transition during resize for instant feedback */
      body.tweaq-resizing {
        transition: none !important;
      }

      body.tweaq-resizing .tweaq-select-mode-glow,
      body.tweaq-resizing .tweaq-outline-indicator,
      body.tweaq-resizing .tweaq-selected-indicator {
        transition: none !important;
      }

      /* Element outline (hover state) */
      .tweaq-element-outline {
        position: absolute;
        pointer-events: none;
        border: 2px solid #0A84FF;
        background-color: rgba(10, 132, 255, 0.1);
        z-index: 999999;
        transition: all 0.1s ease;
        box-shadow: 0 0 0 1px rgba(10, 132, 255, 0.3);
      }

      /* Selected element indicator */
      .tweaq-selected-indicator {
        position: absolute;
        pointer-events: none;
        border: 2px solid #0A84FF;
        z-index: 999999;
        transition: all 0.2s ease;
      }

      /* Hover highlight from ticket card */
      .tweaq-hover-highlight {
        position: absolute;
        pointer-events: none;
        border: 3px solid #F59E0B;
        background-color: rgba(245, 158, 11, 0.15);
        z-index: 999997;
        transition: all 0.2s ease;
        box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.5), 0 4px 16px rgba(245, 158, 11, 0.3);
        animation: tweaq-pulse 2s ease-in-out infinite;
      }

      @keyframes tweaq-pulse {
        0%, 100% {
          box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.5), 0 4px 16px rgba(245, 158, 11, 0.3);
        }
        50% {
          box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.7), 0 4px 20px rgba(245, 158, 11, 0.5);
        }
      }

      /* Corner handles for selected element */
      .tweaq-selected-indicator::before,
      .tweaq-selected-indicator::after {
        content: '';
        position: absolute;
        width: 8px;
        height: 8px;
        background: #0A84FF;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
      }

      /* Top-left corner handle */
      .tweaq-selected-indicator::before {
        top: -5px;
        left: -5px;
      }

      /* Bottom-right corner handle */
      .tweaq-selected-indicator::after {
        bottom: -5px;
        right: -5px;
      }

      /* Top-right and bottom-left handles */
      .tweaq-corner-handle {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #0A84FF;
        border: 2px solid white;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000000;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
      }

      /* Tweaq indicator for edited elements */
      .tweaq-edit-indicator {
        position: absolute;
        pointer-events: auto;
        z-index: 999998;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-size: 10px;
        padding: 3px 6px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        gap: 3px;
        font-weight: 600;
        animation: tweaq-indicator-appear 0.3s ease-out;
        transition: all 0.2s ease;
        cursor: pointer;
        user-select: none;
      }

      @keyframes tweaq-indicator-appear {
        from {
          opacity: 0;
          transform: scale(0.8) translateY(-4px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .tweaq-edit-indicator:hover {
        transform: scale(1.05);
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3);
      }

      .tweaq-edit-indicator-icon {
        font-size: 11px;
        line-height: 1;
        transition: all 0.2s ease;
      }

      .tweaq-edit-indicator:hover .tweaq-edit-indicator-icon {
        transform: scale(1.1);
      }

      .tweaq-edit-indicator-text {
        font-size: 9px;
        line-height: 1;
        letter-spacing: 0.3px;
      }

      .tweaq-edit-indicator-toggle {
        display: none;
        font-size: 11px;
        line-height: 1;
        margin-left: 2px;
        opacity: 0.9;
      }

      .tweaq-edit-indicator:hover .tweaq-edit-indicator-toggle {
        display: inline-block;
      }

      /* Hidden state for indicator */
      .tweaq-edit-indicator.tweaq-hidden {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        opacity: 0.7;
      }

      .tweaq-edit-indicator.tweaq-hidden:hover {
        opacity: 0.9;
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
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        flex-shrink: 0;
      }

      .tweaq-mode-toggle-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.4);
        color: white;
        transform: translateY(-1px);
      }

      .tweaq-mode-toggle-btn.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-color: transparent;
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .tweaq-mode-toggle-btn svg {
        width: 18px;
        height: 18px;
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
        top: 0; /* BrowserView already starts at y:56 */
        left: var(--tweaq-toolbar-width, 56px);
        width: var(--tweaq-panel-width, 320px);
        height: 100vh;
        pointer-events: auto;
        background: #0f0f0f;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        border-right: none;
        box-shadow: none;
        overflow-x: visible;
        overflow-y: hidden;
        display: flex;
        flex-direction: column;
        padding-top: 0;
        transform: translateX(calc(-100% - var(--tweaq-toolbar-width, 72px)));
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

      /* Panel Resize Handle */
      .tweaq-panel-resize-handle {
        position: fixed;
        left: calc(var(--tweaq-toolbar-width, 56px) + var(--tweaq-panel-width, 320px) - 8px);
        top: 0; /* BrowserView already starts at y:56 */
        width: 16px;
        height: 100vh;
        cursor: ew-resize;
        z-index: 1000010;
        background: transparent;
        transition: background 0.15s, left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        pointer-events: auto;
        display: none;
      }

      /* Visual indicator line in the center of the handle */
      .tweaq-panel-resize-handle::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 2px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 1px;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .tweaq-panel-resize-handle:hover::before {
        opacity: 1;
      }

      .tweaq-panel-resize-handle.visible {
        display: block;
      }

      .tweaq-panel-resize-handle:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .tweaq-panel-resize-handle:active {
        background: transparent;
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

      .tweaq-panel-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .tweaq-panel-title {
        font-size: 11px;
        font-weight: 600;
        color: #888888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
      }

      .tweaq-select-mode-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.05);
        color: #888888;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tweaq-select-mode-toggle svg {
        width: 14px;
        height: 14px;
      }

      .tweaq-select-mode-toggle:hover {
        border-color: rgba(255, 255, 255, 0.25);
        background: rgba(255, 255, 255, 0.08);
        color: #cccccc;
      }

      .tweaq-select-mode-toggle.active {
        border-color: #0A84FF;
        background: rgba(10, 132, 255, 0.15);
        color: #0A84FF;
        box-shadow: 0 0 0 2px rgba(10, 132, 255, 0.1);
      }

      .tweaq-select-mode-toggle.active:hover {
        background: rgba(10, 132, 255, 0.2);
      }

      .tweaq-select-mode-toggle:active {
        transform: scale(0.95);
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

      /* Textarea for content editing */
      .tweaq-textarea {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        font-size: 12px;
        background: rgba(255, 255, 255, 0.05);
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: all 0.15s ease;
        resize: vertical;
        min-height: 60px;
        line-height: 1.5;
      }

      .tweaq-textarea:focus {
        outline: none;
        border-color: #0A84FF;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.2);
      }

      .tweaq-textarea:hover {
        border-color: rgba(255, 255, 255, 0.25);
      }

      /* Content property uses full width */
      .tweaq-property-content {
        grid-template-columns: 100px 1fr;
        align-items: flex-start;
      }

      .tweaq-property-content .tweaq-property-label {
        padding-top: 8px;
      }

      /* Edit Tweaqs */
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

      /* Tweaq Status */
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

      /* Spacing Control (Figma-style) */
      .tweaq-spacing-control {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .tweaq-spacing-link-toggle {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #888888;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }

      .tweaq-spacing-link-toggle:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.25);
        color: #cccccc;
      }

      .tweaq-spacing-link-toggle[data-link-state="unlinked"] {
        background: rgba(255, 255, 255, 0.08);
      }

      .tweaq-spacing-link-toggle svg {
        pointer-events: none;
      }

      .tweaq-spacing-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        flex: 1;
      }

      .tweaq-spacing-inputs-individual {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto;
      }

      .tweaq-spacing-input-group {
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        padding: 2px 6px;
      }

      .tweaq-spacing-icon {
        font-size: 12px;
        color: #888888;
        flex-shrink: 0;
        width: 14px;
        text-align: center;
      }

      .tweaq-spacing-value {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        padding: 2px;
        font-size: 11px;
        text-align: center;
      }

      .tweaq-spacing-value:focus {
        outline: none;
        background: transparent;
        box-shadow: none;
      }

      /* Padding Overlay */
      .tweaq-padding-overlay {
        position: absolute;
        pointer-events: none;
        z-index: 999998;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        font-size: 10px;
        font-weight: 600;
      }

      .tweaq-padding-top,
      .tweaq-padding-right,
      .tweaq-padding-bottom,
      .tweaq-padding-left {
        position: absolute;
        background: rgba(255, 107, 0, 0.2);
        border: 1px dashed rgba(255, 107, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 107, 0, 1);
        text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
      }

      /* Measurement Overlay */
      .tweaq-measurement-overlay {
        position: absolute;
        pointer-events: none;
        z-index: 999999;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        font-size: 11px;
        font-weight: 600;
      }

      .tweaq-measurement {
        position: absolute;
        background: rgba(10, 132, 255, 0.95);
        color: white;
        padding: 3px 6px;
        border-radius: 3px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      .tweaq-measurement-line {
        position: absolute;
        background: rgba(10, 132, 255, 0.6);
      }

      .tweaq-measurement-line-h {
        height: 1px;
      }

      .tweaq-measurement-line-v {
        width: 1px;
      }

      .tweaq-measurement-cap {
        position: absolute;
        background: rgba(10, 132, 255, 0.8);
      }

      .tweaq-measurement-cap-h {
        width: 1px;
        height: 8px;
      }

      .tweaq-measurement-cap-v {
        width: 8px;
        height: 1px;
      }

      .tweaq-measurement-secondary {
        font-size: 9px;
        opacity: 0.8;
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
        left: 430px;
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
        position: relative;
        display: flex;
        align-items: flex-end;
        gap: 0;
      }

      .tweaq-chat-input {
        width: 100%;
        padding: 12px 44px 12px 12px;
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
        position: absolute;
        right: 8px;
        bottom: 8px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        padding: 0;
      }

      .tweaq-chat-send-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .tweaq-chat-send-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .tweaq-chat-send-btn svg {
        width: 14px;
        height: 14px;
      }

      /* Chat Messages */
      .tweaq-chat-message {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 12px 14px;
        border-radius: 8px;
        animation: fadeIn 0.3s ease-out;
      }

      .tweaq-chat-message.user {
        background: rgba(255, 255, 255, 0.08);
        border: none;
      }

      .tweaq-chat-message.assistant {
        background: transparent;
        border: none;
      }

      .tweaq-message-content {
        color: #fff;
        font-size: 14px;
        line-height: 1.6;
        word-wrap: break-word;
      }

      .tweaq-message-content strong {
        font-weight: 600;
        color: #fff;
      }

      .tweaq-message-content em {
        font-style: italic;
        color: rgba(255, 255, 255, 0.9);
      }

      .tweaq-message-content code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: Monaco, Menlo, 'Courier New', monospace;
        font-size: 13px;
        color: #fff;
      }

      .tweaq-message-content ul {
        margin: 8px 0;
        padding-left: 20px;
      }

      .tweaq-message-content li {
        margin: 4px 0;
      }

      .tweaq-chat-welcome {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        opacity: 0.6;
      }

      .tweaq-chat-loading {
        text-align: center;
        padding: 16px;
        color: #999;
        font-style: italic;
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse-target {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.2);
        }
      }

      /* Select Mode Glow Effect */
      .tweaq-select-mode-glow {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 999998;
        box-shadow: inset 0 0 40px 10px rgba(102, 126, 234, 0.4);
        animation: glowPulse 2s ease-in-out infinite;
        transition: left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      /* When panel is open, glow stops at panel edge */
      body.tweaq-panel-open .tweaq-select-mode-glow {
        left: calc(var(--tweaq-panel-width, 400px) + var(--tweaq-toolbar-width, 72px));
      }

      @keyframes glowPulse {
        0%, 100% {
          box-shadow: inset 0 0 40px 10px rgba(102, 126, 234, 0.3);
        }
        50% {
          box-shadow: inset 0 0 50px 15px rgba(102, 126, 234, 0.5);
        }
      }

      /* Select Mode Toast */
      .tweaq-select-mode-toast {
        position: fixed;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(28, 28, 30, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(102, 126, 234, 0.5);
        border-radius: 24px;
        padding: 12px 24px;
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        pointer-events: none;
        z-index: 1000001;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        animation: toastSlideUp 0.3s ease-out;
        transition: left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      /* When panel is open, toast centers in visible webpage area */
      body.tweaq-panel-open .tweaq-select-mode-toast {
        left: calc((100% - var(--tweaq-panel-width, 400px) - var(--tweaq-toolbar-width, 72px)) / 2);
      }

      @keyframes toastSlideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      .tweaq-select-mode-toast::before {
        content: '🎯';
        margin-right: 8px;
      }

      /* Confirmation UI */
      .tweaq-chat-confirmation {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.3);
        border-radius: 8px;
      }

      .tweaq-confirmation-header {
        font-size: 14px;
        font-weight: 600;
        color: #fff;
      }

      .tweaq-confirmation-tickets {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .tweaq-confirmation-ticket {
        display: flex;
        align-items: start;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
      }

      .tweaq-ticket-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .tweaq-ticket-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .tweaq-ticket-instruction {
        color: #fff;
        font-size: 14px;
        font-weight: 500;
      }

      .tweaq-ticket-meta {
        color: #999;
        font-size: 11px;
      }

      .tweaq-confirmation-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .tweaq-btn-primary,
      .tweaq-btn-secondary {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tweaq-btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .tweaq-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .tweaq-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      .tweaq-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
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

      /* Comment Pill Styles - Dark Mode */
      .tweaq-comment-pill {
        position: absolute;
        pointer-events: auto;
        background: rgba(40, 40, 40, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        user-select: none;
        z-index: 1000002;
      }

      .tweaq-comment-pill-expanded {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        padding: 12px;
        min-width: 320px;
        cursor: default;
      }

      .tweaq-comment-textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        resize: vertical;
        min-height: 80px;
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
        transition: all 0.2s;
      }

      .tweaq-comment-textarea:focus {
        outline: none;
        border-color: rgba(0, 122, 204, 0.6);
        background: rgba(255, 255, 255, 0.12);
        box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.15);
      }

      .tweaq-comment-textarea::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      .tweaq-comment-actions {
        display: flex;
        justify-content: flex-end;
      }

      .tweaq-comment-btn {
        padding: 8px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
      }

      .tweaq-comment-submit {
        color: rgba(255, 255, 255, 0.4);
        width: 36px;
        height: 36px;
      }

      .tweaq-comment-submit:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.6);
      }

      .tweaq-comment-submit:not(:disabled) {
        color: #007acc;
      }

      .tweaq-comment-submit:not(:disabled):hover {
        background: rgba(0, 122, 204, 0.15);
        color: #4db8ff;
      }

      .tweaq-comment-submit:not(:disabled):active {
        transform: scale(0.95);
      }

      .tweaq-comment-submit:disabled {
        cursor: not-allowed;
      }

      .tweaq-comment-submit svg {
        width: 18px;
        height: 18px;
      }

      /* Comment Bubble Styles (Figma-style) */
      .tweaq-comment-bubble {
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 2px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        pointer-events: auto;
        z-index: 999998;
        animation: commentBubbleAppear 0.3s ease-out;
      }
      
      @keyframes commentBubbleAppear {
        from {
          opacity: 0;
          transform: scale(0.5);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      .tweaq-comment-bubble:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
      }
      
      .tweaq-bubble-count {
        color: white;
        font-size: 12px;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      /* Comment Thread Panel */
      .tweaq-comment-thread {
        position: fixed;
        width: 320px;
        background: rgba(40, 40, 40, 0.98);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        pointer-events: auto;
        z-index: 1000003;
        animation: threadSlideIn 0.2s ease-out;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      @keyframes threadSlideIn {
        from {
          opacity: 0;
          transform: translateX(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      .tweaq-thread-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px 12px 0 0;
      }
      
      .tweaq-thread-title {
        font-size: 14px;
        font-weight: 600;
        color: #ffffff;
      }
      
      .tweaq-thread-close {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
        line-height: 1;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .tweaq-thread-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
      
      .tweaq-thread-content {
        padding: 16px;
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }
      
      .tweaq-comment-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .tweaq-comment-author {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
      }
      
      .tweaq-comment-text {
        font-size: 14px;
        color: #ffffff;
        line-height: 1.5;
        word-wrap: break-word;
      }
      
      .tweaq-comment-time {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
      }

      /* Comments Conversion Card Styles */
      .tweaq-comments-conversion-card {
        margin: 16px 16px 12px 16px;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
      }

      .tweaq-comments-conversion-card:hover {
        border-color: rgba(139, 92, 246, 0.5);
        box-shadow: 0 6px 20px rgba(139, 92, 246, 0.25);
        transform: translateY(-2px);
      }

      .tweaq-conversion-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .tweaq-conversion-icon {
        font-size: 28px;
        line-height: 1;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }

      .tweaq-conversion-info {
        flex: 1;
      }

      .tweaq-conversion-title {
        font-size: 14px;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 4px 0;
      }

      .tweaq-conversion-subtitle {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
      }

      .tweaq-conversion-button {
        width: 100%;
        padding: 10px 16px;
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
      }

      .tweaq-conversion-button:hover {
        background: linear-gradient(135deg, #5558e3 0%, #9333ea 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      }

      .tweaq-conversion-button:active {
        transform: translateY(0);
      }

      .tweaq-conversion-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 10px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 12px;
      }

      .tweaq-loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Conflict Indicator Styles */
      .tweaq-conflict-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        margin: 8px 0;
        background: rgba(255, 152, 0, 0.1);
        border: 1px solid rgba(255, 152, 0, 0.3);
        border-radius: 6px;
        font-size: 12px;
      }

      .tweaq-conflict-text {
        color: #ff9800;
        flex: 1;
        font-weight: 500;
      }

      .tweaq-conflict-review {
        background: transparent;
        border: none;
        color: rgba(255, 152, 0, 0.8);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tweaq-conflict-review:hover {
        background: rgba(255, 152, 0, 0.2);
        color: #ff9800;
      }

      /* Conflict Resolution Modal Styles */
      .tweaq-conflict-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000010;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: tweaqFadeIn 0.2s ease-out;
      }

      .tweaq-conflict-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
      }

      .tweaq-conflict-dialog {
        position: relative;
        width: 90%;
        max-width: 600px;
        max-height: 85vh;
        background: #1e1e1e;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        animation: tweaqSlideUp 0.3s ease-out;
      }

      @keyframes tweaqSlideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes tweaqFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .tweaq-conflict-header {
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }

      .tweaq-conflict-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .tweaq-conflict-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #fff;
        flex: 1;
      }

      .tweaq-conflict-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tweaq-conflict-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.9);
      }

      .tweaq-conflict-content {
        overflow-y: auto;
        flex: 1;
        padding: 24px;
      }

      .tweaq-conflict-section {
        margin-bottom: 24px;
      }

      .tweaq-conflict-section:last-child {
        margin-bottom: 0;
      }

      .tweaq-conflict-section-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.5);
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .tweaq-conflict-property-name {
        display: inline-block;
        font-size: 16px;
        font-weight: 600;
        color: #fff;
        font-family: 'SF Mono', Monaco, monospace;
        margin-right: 8px;
      }

      .tweaq-conflict-type-badge {
        display: inline-block;
        padding: 4px 8px;
        background: rgba(255, 152, 0, 0.15);
        color: #ff9800;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        text-transform: capitalize;
      }

      .tweaq-conflict-comments {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .tweaq-conflict-comment-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 10px 12px;
      }

      .tweaq-conflict-comment-header {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        margin-bottom: 6px;
      }

      .tweaq-conflict-comment-num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        background: rgba(255, 152, 0, 0.2);
        color: #ff9800;
        border-radius: 50%;
        font-size: 11px;
        font-weight: 600;
        flex-shrink: 0;
      }

      .tweaq-conflict-comment-text {
        color: rgba(255, 255, 255, 0.85);
        font-size: 13px;
        line-height: 1.5;
      }

      .tweaq-conflict-comment-suggestion {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        padding-left: 28px;
      }

      .tweaq-conflict-comment-suggestion code {
        background: rgba(255, 255, 255, 0.08);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'SF Mono', Monaco, monospace;
        color: #4fc3f7;
        font-size: 12px;
      }

      .tweaq-conflict-ai-choice {
        background: rgba(76, 175, 80, 0.08);
        border: 1px solid rgba(76, 175, 80, 0.2);
        border-radius: 8px;
        padding: 12px;
      }

      .tweaq-conflict-ai-value {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .tweaq-conflict-ai-value code {
        background: rgba(255, 255, 255, 0.08);
        padding: 4px 8px;
        border-radius: 4px;
        font-family: 'SF Mono', Monaco, monospace;
        color: #4caf50;
        font-size: 14px;
        font-weight: 600;
      }

      .tweaq-conflict-ai-reasoning {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.5;
        padding-left: 22px;
      }

      .tweaq-conflict-alternatives {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .tweaq-conflict-alternative {
        background: rgba(255, 255, 255, 0.03);
        border: 2px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tweaq-conflict-alternative:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.15);
      }

      .tweaq-conflict-alternative:has(.tweaq-conflict-radio:checked) {
        background: rgba(33, 150, 243, 0.1);
        border-color: #2196f3;
      }

      .tweaq-conflict-alt-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;
      }

      .tweaq-conflict-radio {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        cursor: pointer;
        accent-color: #2196f3;
      }

      .tweaq-conflict-alt-value {
        flex: 1;
        font-size: 14px;
        color: #fff;
        cursor: pointer;
        font-weight: 500;
      }

      .tweaq-conflict-alt-value code {
        background: rgba(255, 255, 255, 0.08);
        padding: 3px 7px;
        border-radius: 4px;
        font-family: 'SF Mono', Monaco, monospace;
        color: #fff;
        font-size: 13px;
      }

      .tweaq-conflict-alt-source {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        padding: 2px 6px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }

      .tweaq-conflict-alt-rationale {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.5;
        padding-left: 26px;
      }

      .tweaq-conflict-custom-input {
        width: 100%;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        color: #fff;
        font-size: 13px;
        font-family: 'SF Mono', Monaco, monospace;
        margin-top: 8px;
        outline: none;
        transition: all 0.2s;
      }

      .tweaq-conflict-custom-input:focus {
        background: rgba(255, 255, 255, 0.12);
        border-color: #2196f3;
      }

      .tweaq-conflict-custom-input:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .tweaq-conflict-footer {
        padding: 16px 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        flex-shrink: 0;
      }

      .tweaq-conflict-btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }

      .tweaq-conflict-btn-secondary {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.8);
      }

      .tweaq-conflict-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.95);
      }

      .tweaq-conflict-btn-primary {
        background: #2196f3;
        color: #fff;
      }

      .tweaq-conflict-btn-primary:hover:not(:disabled) {
        background: #1976d2;
      }

      .tweaq-conflict-btn-primary:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* Tweaqs View Styles */
      .tweaq-tickets-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 16px;
      }

      /* Tweaq Card Styles */
      .tweaq-ticket-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        transition: all 0.3s ease;
        overflow: hidden;
      }

      .tweaq-ticket-card:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      }

      .tweaq-ticket-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .tweaq-ticket-type-badge {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: 16px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        border: 1px solid;
      }

      .tweaq-ticket-badge-icon {
        font-size: 12px;
        line-height: 1;
      }

      .tweaq-ticket-badge-text {
        line-height: 1;
      }

      .tweaq-ticket-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .tweaq-ticket-toggle {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tweaq-ticket-toggle:hover {
        background: rgba(10, 132, 255, 0.2);
        color: #0A84FF;
      }

      .tweaq-ticket-delete {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tweaq-ticket-delete:hover {
        background: rgba(255, 59, 48, 0.2);
        color: #FF3B30;
      }

      .tweaq-ticket-card-body {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .tweaq-ticket-summary {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.95);
        line-height: 1.4;
        font-weight: 500;
      }

      .tweaq-ticket-target {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 5px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        cursor: pointer;
        transition: all 0.2s ease;
        overflow: hidden;
      }

      .tweaq-ticket-target:hover {
        background: rgba(0, 0, 0, 0.4);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .tweaq-target-label {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.4px;
        font-weight: 600;
        flex-shrink: 0;
      }

      .tweaq-target-selector {
        font-size: 11px;
        color: #0A84FF;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        background: transparent;
        padding: 0;
        border: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        min-width: 0;
        transition: all 0.2s ease;
      }

      .tweaq-target-selector.expanded {
        white-space: normal;
        word-break: break-all;
      }

      .tweaq-ticket-details {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .tweaq-details-header {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.4px;
        font-weight: 600;
        margin-bottom: 2px;
      }

      .tweaq-details-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .tweaq-detail-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 5px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .tweaq-detail-property {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin-bottom: 4px;
      }

      .tweaq-detail-change {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
      }

      .tweaq-detail-before {
        color: rgba(255, 255, 255, 0.5);
        text-decoration: line-through;
        opacity: 0.7;
      }

      .tweaq-detail-after {
        color: #34C759;
        font-weight: 500;
      }

      .tweaq-detail-specific {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.4;
      }

      .tweaq-confirm-button {
        width: 100%;
        padding: 16px;
        background: linear-gradient(135deg, #0A84FF 0%, #0066CC 100%);
        color: white;
        border: none;
        border-radius: 0;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s;
      }

      .tweaq-confirm-button:hover {
        background: linear-gradient(135deg, #0066CC 0%, #0A84FF 100%);
        transform: translateY(-1px);
      }

      .tweaq-empty-state {
        text-align: center;
        padding: 40px 20px;
      }

      /* Left Sidebar Toolbar Styles */
      .tweaq-right-toolbar {
        position: fixed;
        top: 0; /* BrowserView already starts at y:56 */
        left: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
        gap: 0;
        background: #0f0f0f;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        border-right: none;
        padding: 0;
        padding-bottom: 16px;
        z-index: 1000003;
        pointer-events: auto;
      }

      .tweaq-toolbar-spacer {
        flex: 1;
      }

      .tweaq-toolbar-action {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 56px;
        padding: 10px 0;
        border: none;
        background: transparent;
        border-radius: 0;
        cursor: pointer;
        transition: all 0.15s ease;
        color: rgba(255, 255, 255, 0.5);
        position: relative;
      }

      .tweaq-toolbar-action:hover {
        background: transparent;
        color: rgba(255, 255, 255, 0.8);
      }

      .tweaq-toolbar-action.active {
        background: transparent;
        color: #0A84FF;
      }

      .tweaq-toolbar-action svg {
        width: 20px;
        height: 20px;
        stroke-width: 2;
      }

      .tweaq-toolbar-action-label {
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.2px;
        text-transform: capitalize;
      }

      .tweaq-toolbar-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        min-width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #FF3B30;
        color: white;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 700;
        padding: 0 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .tweaq-toolbar-separator {
        height: 1px;
        width: 40px;
        background: rgba(255, 255, 255, 0.1);
        margin: 12px auto;
      }

      /* Browser Selector */
      .tweaq-browser-selector {
        position: relative;
      }

      .tweaq-browser-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 56px;
        padding: 10px 0;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: all 0.15s ease;
        color: rgba(255, 255, 255, 0.5);
        pointer-events: auto;
      }

      .tweaq-browser-button:hover {
        background: transparent;
        color: rgba(255, 255, 255, 0.8);
      }

      .tweaq-browser-button svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
      }

      .tweaq-browser-label {
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.2px;
      }

      .tweaq-browser-dropdown {
        position: fixed;
        right: auto;
        left: calc(56px + 8px);
        top: 16px;
        background: rgba(28, 28, 30, 0.98);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        padding: 8px 0;
        min-width: 180px;
        z-index: 10000020;
        display: none;
        pointer-events: auto;
      }

      .tweaq-browser-dropdown.visible {
        display: block;
        animation: tweaq-browser-dropdown-fadein 0.15s ease;
      }

      @keyframes tweaq-browser-dropdown-fadein {
        from {
          opacity: 0;
          transform: translateX(-4px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .tweaq-browser-option {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        background: transparent;
        border: none;
        width: 100%;
        cursor: pointer;
        transition: all 0.15s ease;
        color: rgba(255, 255, 255, 0.7);
        text-align: left;
      }

      .tweaq-browser-option:hover {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.9);
      }

      .tweaq-browser-option.active {
        background: rgba(10, 132, 255, 0.15);
        color: #0A84FF;
      }

      .tweaq-browser-option svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
        flex-shrink: 0;
      }

      .tweaq-browser-option-name {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
      }

      .tweaq-browser-checkmark {
        color: #0A84FF;
        font-size: 16px;
        font-weight: bold;
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
      this.selectedIndicator = null;
      this.selectedCornerHandles = [];
      this.hoverHighlight = null;
      this.propertiesPanel = null;
      this.commentPill = null;
      this.rightToolbar = null;
      this.paddingOverlay = null;
      this.measurementOverlay = null;
      
      // Comments system (separate from tweaqs/edits)
      this.comments = []; // Array of comment objects
      this.commentBubbles = new Map(); // Map<commentId, bubbleElement>
      this.activeCommentThread = null; // Currently open comment thread
      
      // Mode: 'chat' (default), 'design', 'comment', or 'tickets'
      this.mode = 'chat';
      
      // Select mode state for design mode
      this.isSelectModeActive = true;
      
      // Conversational Intelligence state
      this.conversationState = null;
      this.conversationMessages = [];
      this.awaitingResponse = false;
      this.readyTickets = null; // ReadyTicket[] when conversation is complete
      
      // Edit indicators for tweaqed elements
      this.editIndicators = new Map(); // Map<HTMLElement, IndicatorElement>
      
      // Bind methods
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleClick = this.handleClick.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.updateIndicatorPositions = this.updateIndicatorPositions.bind(this);
    }

    // Helper to get body margin offsets (due to left toolbar/panel and top margin)
    getBodyOffsets() {
      const computedStyle = window.getComputedStyle(document.body);
      const marginLeft = parseInt(computedStyle.marginLeft) || 0;
      const marginTop = parseInt(computedStyle.marginTop) || 0;
      return { left: marginLeft, top: marginTop };
    }

    // Helper to get scroll position (body is the scroll container)
    getScrollPosition() {
      return {
        x: document.body.scrollLeft || window.scrollX || 0,
        y: document.body.scrollTop || window.scrollY || 0
      };
    }

    // Helper to get body boundaries (the visible web view area)
    getBodyBounds() {
      // Get the body's actual visible dimensions (not including margins)
      const bodyRect = document.body.getBoundingClientRect();
      const scroll = this.getScrollPosition();
      
      // Return bounds in document coordinates
      return {
        left: 0,
        top: 0,
        right: bodyRect.width,
        bottom: document.body.scrollHeight // Allow full scrollable height
      };
    }

    async inject(options = {}) {
      if (this.isVisible) return;

      // Get saved panel width before injecting styles
      let currentWidth = 320;
      try {
        const savedWidth = localStorage.getItem('tweaq-panel-width');
        if (savedWidth) {
          currentWidth = parseInt(savedWidth);
        }
      } catch (e) {
        // Ignore
      }

      injectStyles();
      
      // Set mode before creating elements if provided
      if (options.initialMode) {
        this.mode = options.initialMode;
      }
      
      // Restore state if provided (silent restoration after browser switch)
      const restoreState = options.restoreState;
      if (restoreState) {
        this.mode = restoreState.mode || 'chat';
        this.recordedEdits = restoreState.recordedEdits || [];
      }
      
      this.createOverlayElements();
      this.attachEventListeners();
      this.isVisible = true;
      
      // Apply body margins immediately, both via CSS variable and inline
      document.documentElement.style.setProperty('--tweaq-panel-width', `${currentWidth}px`);
      this.applyBodyMargins(currentWidth);
      
      // Show panel without animations if silent mode
      if (options.silent) {
        // Skip animations - restore state silently
        if (restoreState && restoreState.isPanelVisible) {
          this.propertiesPanel.classList.add('visible');
          this.resizeHandle.classList.add('visible');
          document.body.classList.add('tweaq-panel-open');
          this.renderPanel();
        } else {
          // Just show toolbar, no panel
          this.renderPanel();
        }
      } else {
        // Normal mode with animations
        this.showPanel();
        this.renderPanel();
      }
      
      // Ensure initial panel width is communicated to Electron app
      // Use setTimeout to ensure electronAPI is ready
      setTimeout(() => {
        if (window.electronAPI && window.electronAPI.updatePanelWidth) {
          window.electronAPI.updatePanelWidth(currentWidth);
          console.log('📐 Initial panel width sent:', currentWidth);
        }
      }, 100);
      
      console.log('🎨 Overlay injected, mode:', this.mode, 'silent:', !!options.silent);
    }

    createOverlayElements() {
      // Create outline element (for hover)
      this.outlineElement = document.createElement('div');
      this.outlineElement.className = 'tweaq-element-outline';
      this.outlineElement.style.display = 'none';
      document.body.appendChild(this.outlineElement);

      // Create selected element indicator
      this.selectedIndicator = document.createElement('div');
      this.selectedIndicator.className = 'tweaq-selected-indicator';
      this.selectedIndicator.style.display = 'none';
      document.body.appendChild(this.selectedIndicator);

      // Create padding overlay
      this.paddingOverlay = document.createElement('div');
      this.paddingOverlay.className = 'tweaq-padding-overlay';
      this.paddingOverlay.style.display = 'none';
      this.paddingOverlay.innerHTML = `
        <div class="tweaq-padding-top"></div>
        <div class="tweaq-padding-right"></div>
        <div class="tweaq-padding-bottom"></div>
        <div class="tweaq-padding-left"></div>
      `;
      document.body.appendChild(this.paddingOverlay);

      // Create measurement overlay
      this.measurementOverlay = document.createElement('div');
      this.measurementOverlay.className = 'tweaq-measurement-overlay';
      this.measurementOverlay.style.display = 'none';
      document.body.appendChild(this.measurementOverlay);

      // Create hover highlight for ticket card hovers
      this.hoverHighlight = document.createElement('div');
      this.hoverHighlight.className = 'tweaq-hover-highlight';
      this.hoverHighlight.style.display = 'none';
      document.body.appendChild(this.hoverHighlight);

      // Create corner handles for selected element
      for (let i = 0; i < 2; i++) {
        const handle = document.createElement('div');
        handle.className = 'tweaq-corner-handle';
        handle.style.display = 'none';
        document.body.appendChild(handle);
        this.selectedCornerHandles.push(handle);
      }

      // Create overlay container
      this.overlayContainer = document.createElement('div');
      this.overlayContainer.className = 'tweaq-overlay-container';
      document.body.appendChild(this.overlayContainer);

      // Create properties panel
      this.propertiesPanel = document.createElement('div');
      this.propertiesPanel.className = 'tweaq-properties-panel';
      this.overlayContainer.appendChild(this.propertiesPanel);

      // Create resize handle - attach to body, not panel
      this.resizeHandle = document.createElement('div');
      this.resizeHandle.className = 'tweaq-panel-resize-handle';
      document.body.appendChild(this.resizeHandle);

      // Initialize resize functionality
      this.initPanelResize();

      // Create comment pill
      this.createCommentPill();

      // Create right toolbar
      this.createRightToolbar();
    }

    createCommentPill() {
      this.commentPill = document.createElement('div');
      this.commentPill.className = 'tweaq-comment-pill tweaq-comment-pill-expanded';
      this.commentPill.style.display = 'none';
      this.commentPill.innerHTML = `
        <textarea class="tweaq-comment-textarea" placeholder="Add a comment..." rows="3"></textarea>
        <div class="tweaq-comment-actions">
          <button class="tweaq-comment-btn tweaq-comment-submit" disabled title="Type a comment to send">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
        </svg>
          </button>
        </div>
      `;

      this.setupCommentPillListeners();
      document.body.appendChild(this.commentPill);
    }

    setupCommentPillListeners() {
      const textarea = this.commentPill.querySelector('.tweaq-comment-textarea');
      const submitBtn = this.commentPill.querySelector('.tweaq-comment-submit');

      // Handle textarea input
      textarea.addEventListener('input', () => {
        submitBtn.disabled = !textarea.value.trim();
        submitBtn.title = textarea.value.trim() ? "Send comment (⌘+Enter)" : "Type a comment to send";
      });

      // Handle keyboard shortcuts
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          if (textarea.value.trim()) {
            this.submitComment(textarea.value.trim());
            textarea.value = '';
            submitBtn.disabled = true;
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          textarea.value = '';
          submitBtn.disabled = true;
        }
      });

      // Handle submit button
      submitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (textarea.value.trim()) {
          this.submitComment(textarea.value.trim());
          textarea.value = '';
          submitBtn.disabled = true;
        }
      });
    }

    initPanelResize() {
      if (!this.resizeHandle || !this.propertiesPanel) return;

      let isResizing = false;
      let startX = 0;
      let startWidth = 320;

      const onMouseDown = (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = parseInt(getComputedStyle(this.propertiesPanel).width);
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        document.body.classList.add('tweaq-resizing');
        e.preventDefault();
        e.stopPropagation();
      };

      const onMouseMove = (e) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX; // Reversed for left panel
        const newWidth = Math.max(280, Math.min(800, startWidth + deltaX));
        document.documentElement.style.setProperty('--tweaq-panel-width', `${newWidth}px`);
        
        // Apply body margins in real-time during resize
        this.applyBodyMargins(newWidth);
        
        // Notify Electron app of width change in real-time
        if (window.electronAPI && window.electronAPI.updatePanelWidth) {
          window.electronAPI.updatePanelWidth(newWidth);
        }
      };

      const onMouseUp = () => {
        if (isResizing) {
          isResizing = false;
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.body.classList.remove('tweaq-resizing');
          
          const newWidth = parseInt(getComputedStyle(this.propertiesPanel).width);
          try {
            localStorage.setItem('tweaq-panel-width', newWidth);
          } catch (e) {
            // Ignore localStorage errors
          }
          
          // Notify Electron app of width change
          if (window.electronAPI && window.electronAPI.updatePanelWidth) {
            window.electronAPI.updatePanelWidth(newWidth);
          }
        }
      };

      // Load saved width
      try {
        const savedWidth = localStorage.getItem('tweaq-panel-width');
        if (savedWidth) {
          document.documentElement.style.setProperty('--tweaq-panel-width', `${savedWidth}px`);
          // Notify Electron app of initial panel width
          if (window.electronAPI && window.electronAPI.updatePanelWidth) {
            window.electronAPI.updatePanelWidth(parseInt(savedWidth));
          }
        } else {
          // Send default width (320px as per CSS default)
          if (window.electronAPI && window.electronAPI.updatePanelWidth) {
            window.electronAPI.updatePanelWidth(320);
          }
        }
      } catch (e) {
        // Ignore localStorage errors
        // Send default width on error
        if (window.electronAPI && window.electronAPI.updatePanelWidth) {
          window.electronAPI.updatePanelWidth(320);
        }
      }

      this.resizeHandle.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    createRightToolbar() {
      this.rightToolbar = document.createElement('div');
      this.rightToolbar.className = 'tweaq-right-toolbar';
      
      const ticketCount = this.recordedEdits.length;
      
      // Browser icons (inline SVGs)
      const browserIcons = {
        chromium: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z"/></svg>',
        edge: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path d="M 25.300781 3 C 15.790781 3 7.7008594 8.6803125 4.3808594 17.570312 C 7.0908594 14.590313 10.679609 13 14.849609 13 L 14.880859 13 C 21.350859 13.01 28.189219 17.100547 30.449219 22.310547 L 30.439453 22.310547 C 31.249453 23.890547 31.060781 25.520781 30.800781 26.550781 C 30.500781 27.720781 30.050859 28.270234 29.880859 28.490234 L 29.789062 28.609375 C 29.459063 29.019375 29.510391 29.620469 29.900391 29.980469 C 29.970391 30.040469 30.080469 30.120703 30.230469 30.220703 L 30.490234 30.380859 C 31.760234 31.180859 34.630469 32 37.230469 32 C 39.220469 32 41.819766 31.690234 44.259766 29.240234 C 48.359766 25.140234 46.779219 19.419766 46.199219 17.759766 C 45.209219 14.949766 41.100313 5.6101563 29.570312 3.4101562 C 28.170312 3.1401562 26.730781 3 25.300781 3 z M 14.849609 15 C 9.6496094 15 5.4800781 17.910937 3.0800781 23.210938 C 2.2900781 32.370937 7.8394531 40.589531 14.439453 44.269531 C 15.389453 44.799531 18.409141 46.320312 22.619141 46.820312 C 18.899141 45.060313 16.069531 41.99 14.769531 38 C 12.609531 31.37 15.319922 24.290703 21.669922 19.970703 L 21.679688 19.980469 C 22.639688 19.350469 23.809766 18.990234 25.009766 18.990234 C 25.149766 18.990234 25.279922 18.989766 25.419922 19.009766 C 22.609922 16.609766 18.630859 15.01 14.880859 15 L 14.849609 15 z M 19 25.169922 C 16.22 28.739922 15.309687 33.170859 16.679688 37.380859 C 18.489687 42.940859 23.780469 46.460469 30.230469 46.480469 C 35.250469 45.360469 39.619297 42.429219 43.279297 37.699219 L 43.369141 37.580078 C 43.619141 37.210078 43.600313 36.719141 43.320312 36.369141 C 43.030313 36.029141 42.550625 35.909844 42.140625 36.089844 L 41.660156 36.310547 C 41.460156 36.400547 41.280547 36.459063 41.060547 36.539062 C 40.830547 36.619063 40.570469 36.719375 40.230469 36.859375 C 38.940469 37.389375 37.020938 37.689453 34.960938 37.689453 C 33.230937 37.689453 31.540937 37.470312 30.210938 37.070312 C 28.330937 36.510312 22.599375 34.779688 19.609375 28.179688 C 19.239375 27.359688 18.99 26.309922 19 25.169922 z"/></svg>',
        firefox: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.824 7.287c.008 0 .004 0 0 0zm-2.8-1.4c.006 0 .003 0 0 0zm16.754 2.161c-.505-1.215-1.53-2.528-2.333-2.943.654 1.283 1.033 2.57 1.177 3.53l.002.02c-1.314-3.278-3.544-4.6-5.366-7.477-.091-.147-.184-.292-.273-.446a3.545 3.545 0 01-.13-.24 2.118 2.118 0 01-.172-.46.03.03 0 00-.027-.03.038.038 0 00-.021 0l-.006.001a.037.037 0 00-.01.005L15.624 0c-2.585 1.515-3.657 4.168-3.932 5.856a6.197 6.197 0 00-2.305.587.297.297 0 00-.147.37c.057.162.24.24.396.17a5.622 5.622 0 012.008-.523l.067-.005a5.847 5.847 0 011.957.222l.095.03a5.816 5.816 0 01.616.228c.08.036.16.073.238.112l.107.055a5.835 5.835 0 01.368.211 5.953 5.953 0 012.034 2.104c-.62-.437-1.733-.868-2.803-.681 4.183 2.09 3.06 9.292-2.737 9.02a5.164 5.164 0 01-1.513-.292 4.42 4.42 0 01-.538-.232c-1.42-.735-2.593-2.121-2.74-3.806 0 0 .537-2 3.845-2 .357 0 1.38-.998 1.398-1.287-.005-.095-2.029-.9-2.817-1.677-.422-.416-.622-.616-.8-.767a3.47 3.47 0 00-.301-.227 5.388 5.388 0 01-.032-2.842c-1.195.544-2.124 1.403-2.8 2.163h-.006c-.46-.584-.428-2.51-.402-2.913-.006-.025-.343.176-.389.206-.406.29-.787.616-1.136.974-.397.403-.76.839-1.085 1.303a9.816 9.816 0 00-1.562 3.52c-.003.013-.11.487-.19 1.073-.013.09-.026.181-.037.272a7.8 7.8 0 00-.069.667l-.002.034-.023.387-.001.06C.386 18.795 5.593 24 12.016 24c5.752 0 10.527-4.176 11.463-9.661.02-.149.035-.298.052-.448.232-1.994-.025-4.09-.753-5.844z"/></svg>',
        webkit: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm-.004.953h.006c.063 0 .113.05.113.113v1.842c0 .063-.05.113-.113.113h-.006a.112.112 0 0 1-.113-.113V1.066c0-.063.05-.113.113-.113zm-.941.041c.056.001.104.046.11.104l.077.918a.112.112 0 0 1-.101.12h-.01a.11.11 0 0 1-.12-.1l-.08-.919a.112.112 0 0 1 .102-.12h.01l.012-.003zm1.892 0H12.965a.113.113 0 0 1 .103.121l-.08.92a.111.111 0 0 1-.12.102h-.009a.111.111 0 0 1-.101-.121l.078-.92a.112.112 0 0 1 .111-.102z"/></svg>'
      };
      
      // Get current browser from electronAPI
      this.currentBrowser = 'chromium'; // Default
      
      this.rightToolbar.innerHTML = `
        <div class="tweaq-browser-selector">
          <button class="tweaq-browser-button" title="Browser">
            ${browserIcons[this.currentBrowser]}
            <span class="tweaq-browser-label">Browser</span>
          </button>
          <div class="tweaq-browser-dropdown">
            <button class="tweaq-browser-option active" data-browser="chromium">
              ${browserIcons.chromium}
              <span class="tweaq-browser-option-name">Chrome</span>
              <span class="tweaq-browser-checkmark">✓</span>
            </button>
            <button class="tweaq-browser-option" data-browser="edge">
              ${browserIcons.edge}
              <span class="tweaq-browser-option-name">Edge</span>
              <span class="tweaq-browser-checkmark"></span>
            </button>
            <button class="tweaq-browser-option" data-browser="firefox">
              ${browserIcons.firefox}
              <span class="tweaq-browser-option-name">Firefox</span>
              <span class="tweaq-browser-checkmark"></span>
            </button>
            <button class="tweaq-browser-option" data-browser="webkit">
              ${browserIcons.webkit}
              <span class="tweaq-browser-option-name">Safari</span>
              <span class="tweaq-browser-checkmark"></span>
            </button>
          </div>
        </div>

        <div class="tweaq-toolbar-separator"></div>

        <button class="tweaq-toolbar-action ${this.mode === 'chat' ? 'active' : ''}" data-mode="chat" title="Chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="tweaq-toolbar-action-label">Chat</span>
        </button>
        
        <button class="tweaq-toolbar-action ${this.mode === 'design' ? 'active' : ''}" data-mode="design" title="Design">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            <path d="M2 2l7.586 7.586"/>
            <circle cx="11" cy="11" r="2"/>
          </svg>
          <span class="tweaq-toolbar-action-label">Design</span>
        </button>
        
        <button class="tweaq-toolbar-action ${this.mode === 'comment' ? 'active' : ''}" data-mode="comment" title="Comment">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          <span class="tweaq-toolbar-action-label">Comment</span>
        </button>
        
        <div class="tweaq-toolbar-separator"></div>
        
        <button class="tweaq-toolbar-action ${this.mode === 'tickets' ? 'active' : ''}" data-mode="tickets" title="Tweaqs">
          ${ticketCount > 0 ? `<span class="tweaq-toolbar-badge">${ticketCount}</span>` : ''}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span class="tweaq-toolbar-action-label">Tweaqs</span>
        </button>

        <div class="tweaq-toolbar-spacer"></div>
        
        <button class="tweaq-toolbar-action" data-action="settings" title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m8.66-7H15m-6 0H2.34m16.25-3.66l-4.25 4.26m-6 6l-4.25 4.26M3.41 3.41l4.25 4.26m6 6l4.25 4.26m6.68-10.34l-4.25-4.26m-6-6l-4.25-4.26"/>
          </svg>
          <span class="tweaq-toolbar-action-label">Settings</span>
        </button>
      `;

      // Store browser icons for later updates
      this.browserIcons = browserIcons;

      // Add browser selector handlers
      const browserButton = this.rightToolbar.querySelector('.tweaq-browser-button');
      const browserDropdown = this.rightToolbar.querySelector('.tweaq-browser-dropdown');
      const browserOptions = this.rightToolbar.querySelectorAll('.tweaq-browser-option');

      console.log('🔧 Browser selector initialized:', { browserButton, browserDropdown, optionsCount: browserOptions.length });

      if (browserButton && browserDropdown) {
        browserButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🖱️ Browser button clicked, toggling dropdown');
          browserDropdown.classList.toggle('visible');
          console.log('Dropdown visible:', browserDropdown.classList.contains('visible'));
        });
      } else {
        console.error('❌ Browser selector elements not found!');
      }

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.tweaq-browser-selector')) {
          browserDropdown.classList.remove('visible');
        }
      });

      browserOptions.forEach(option => {
        option.addEventListener('click', async (e) => {
          e.stopPropagation();
          const browser = option.getAttribute('data-browser');
          
          if (browser !== this.currentBrowser) {
            console.log('🔄 Switching browser to:', browser);
            
            // Switch browser via IPC - the UI will update via browser-engine-changed event
            try {
              if (window.electronAPI && window.electronAPI.browserSwitchEngine) {
                const result = await window.electronAPI.browserSwitchEngine(browser);
                if (!result.success) {
                  console.error('Failed to switch browser:', result.error);
                  alert(`Failed to switch browser: ${result.error}`);
                }
              }
            } catch (error) {
              console.error('Error switching browser:', error);
              alert(`Error switching browser: ${error}`);
            }
          }
          
          browserDropdown.classList.remove('visible');
        });
      });

      // Add click handlers for mode buttons
      const buttons = this.rightToolbar.querySelectorAll('.tweaq-toolbar-action');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const mode = btn.getAttribute('data-mode');
          const action = btn.getAttribute('data-action');
          
          if (action === 'settings') {
            // Trigger settings via electronAPI
            if (window.electronAPI && window.electronAPI.toggleSettings) {
              window.electronAPI.toggleSettings(true);
            }
          } else if (mode) {
            this.switchMode(mode);
          }
        });
      });

      document.body.appendChild(this.rightToolbar);

      // Initialize with actual current browser from electronAPI
      if (window.electronAPI && window.electronAPI.browserGetCurrentEngine) {
        window.electronAPI.browserGetCurrentEngine().then(result => {
          if (result && result.engine) {
            this.updateBrowserSelector(result.engine);
          }
        }).catch(err => {
          console.error('Failed to get current browser:', err);
        });

        // Listen for browser engine changes from main process
        if (window.electronAPI.onBrowserEngineChanged) {
          window.electronAPI.onBrowserEngineChanged((data) => {
            console.log('🔄 Browser engine changed to:', data.engine);
            this.updateBrowserSelector(data.engine);
          });
        }
      }
    }

    updateBrowserSelector(engine) {
      if (!this.rightToolbar || !this.browserIcons) return;

      this.currentBrowser = engine;
      
      const browserButton = this.rightToolbar.querySelector('.tweaq-browser-button');
      const browserOptions = this.rightToolbar.querySelectorAll('.tweaq-browser-option');
      
      if (browserButton && browserOptions) {
        // Update button icon
        const svgElement = browserButton.querySelector('svg');
        if (svgElement) {
          svgElement.outerHTML = this.browserIcons[engine];
        }
        
        // Update active state in dropdown
        browserOptions.forEach(opt => {
          const browser = opt.getAttribute('data-browser');
          if (browser === engine) {
            opt.classList.add('active');
            opt.querySelector('.tweaq-browser-checkmark').textContent = '✓';
          } else {
            opt.classList.remove('active');
            opt.querySelector('.tweaq-browser-checkmark').textContent = '';
          }
        });
        
        console.log('✅ Updated browser selector UI to:', engine);
      }
    }

    setMode(newMode) {
      // Public method for external control (from React UI)
      this.switchMode(newMode);
    }

    recordEdit(editData) {
      // Public method to record edit from React UI
      const { element, changes } = editData;
      
      const edit = {
        id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        elementName: `<${element.tagName}>${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.split(' ')[0] : ''}`,
        element: {
          selector: element.selector,
          tagName: element.tagName,
          id: element.id,
          className: element.className
        },
        changes: changes,
        status: 'pending'
      };
      
      this.recordedEdits.push(edit);
      
      // Update toolbar badge
      this.updateRightToolbarBadge();
      
      console.log('✅ Edit recorded:', edit);
      
      // Auto-switch to tickets view to show the recorded edit
      this.switchMode('tickets');
      
      return edit;
    }

    sendElementDataToReact(element) {
      // Send element data to React UI via IPC
      if (!element || !window.electronAPI) return;
      
      try {
        const computedStyle = window.getComputedStyle(element);
        const elementData = {
          tagName: element.tagName.toLowerCase(),
          id: element.id || '',
          className: element.className || '',
          textContent: element.textContent?.substring(0, 100) || '',
          properties: {
            // Layout
            display: computedStyle.display,
            position: computedStyle.position,
            width: computedStyle.width,
            height: computedStyle.height,
            // Spacing
            margin: computedStyle.margin,
            padding: computedStyle.padding,
            // Typography
            fontSize: computedStyle.fontSize,
            fontFamily: computedStyle.fontFamily,
            fontWeight: computedStyle.fontWeight,
            lineHeight: computedStyle.lineHeight,
            color: computedStyle.color,
            // Background
            backgroundColor: computedStyle.backgroundColor,
            // Border
            border: computedStyle.border,
            borderRadius: computedStyle.borderRadius,
          },
          selector: this.getElementSelector(element)
        };
        
        // Send via IPC to main process, which will forward to React
        if (window.electronAPI && typeof window.electronAPI.sendOverlayMessage === 'function') {
          window.electronAPI.sendOverlayMessage('overlay-element-selected', elementData);
        }
        
        console.log('📤 Sent element data to React:', elementData);
      } catch (error) {
        console.error('Failed to send element data:', error);
      }
    }

    getElementSelector(element) {
      // Generate a unique selector for this element
      if (element.id) {
        return `#${element.id}`;
      }
      
      const path = [];
      while (element && element.nodeType === Node.ELEMENT_NODE) {
        let selector = element.nodeName.toLowerCase();
        if (element.className) {
          const classes = element.className.split(' ').filter(c => c).slice(0, 2);
          if (classes.length > 0) {
            selector += '.' + classes.join('.');
          }
        }
        path.unshift(selector);
        element = element.parentNode;
        if (path.length > 3) break; // Limit depth
      }
      return path.join(' > ');
    }

    switchMode(newMode) {
      console.log('Switching mode from', this.mode, 'to', newMode);
      
      const oldMode = this.mode;
      this.mode = newMode;

      // Update button states
      const buttons = this.rightToolbar.querySelectorAll('.tweaq-toolbar-action');
      buttons.forEach(btn => {
        if (btn.getAttribute('data-mode') === newMode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Handle mode-specific behavior
      if (newMode === 'design' || newMode === 'comment') {
        // Auto-enable select mode when entering design or comment mode
        if (newMode === 'design') {
          // Always enable select mode in design mode (for new architecture)
          this.isSelectModeActive = true;
          this.showSelectModeIndicators();
        } else {
          // Comment mode always has select mode
          this.showSelectModeIndicators();
        }
        if (this.selectedElement) {
          this.updateSelectedIndicator(this.selectedElement);
        }
      } else {
        // Disable element selection/hovering
        this.hideSelectModeIndicators();
        if (oldMode === 'design' || oldMode === 'comment') {
          this.selectedElement = null;
          this.hideSelectedIndicator();
          this.updateOutline(null);
        }
      }

      // Update panel based on mode
      if (newMode === 'chat' || newMode === 'tickets' || newMode === 'design') {
        // Always show panel for these modes
        this.showPanel();
        this.renderPanel();
      } else if (newMode === 'comment') {
        // Comment mode only shows panel when element is selected
        if (!this.selectedElement) {
          this.hidePanel();
        } else {
          this.showPanel();
          this.renderPanel();
        }
      }
    }

    toggleSelectMode() {
      // Toggle the select mode state
      this.isSelectModeActive = !this.isSelectModeActive;
      
      if (this.mode === 'design') {
        if (this.isSelectModeActive) {
          // Enable select mode indicators
          this.showSelectModeIndicators();
          if (this.selectedElement) {
            this.updateSelectedIndicator(this.selectedElement);
          }
        } else {
          // Disable select mode indicators and clear selection
          this.hideSelectModeIndicators();
          this.selectedElement = null;
          this.hideSelectedIndicator();
          this.updateOutline(null);
        }
      }
      
      // Re-render the panel to update the button state and show page properties if deselected
      this.renderPanel();
    }

    updateRightToolbarBadge() {
      const ticketsButton = this.rightToolbar.querySelector('[data-mode="tickets"]');
      if (!ticketsButton) return;

      const ticketCount = this.recordedEdits.length;
      let badge = ticketsButton.querySelector('.tweaq-toolbar-badge');
      
      if (ticketCount > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'tweaq-toolbar-badge';
          ticketsButton.insertBefore(badge, ticketsButton.firstChild);
        }
        badge.textContent = ticketCount;
      } else {
        if (badge) {
          badge.remove();
        }
      }
    }

    // Comment pill is now always expanded when visible
    // No need for expand/collapse methods

    submitComment(comment) {
      if (!this.selectedElement) return;

      const rect = this.selectedElement.getBoundingClientRect();
      
      // Extract element info directly
      const tag = this.selectedElement.tagName.toLowerCase();
      const id = this.selectedElement.id || '';
      const classes = Array.from(this.selectedElement.classList).join('.');
      
      // Generate simple CSS selector
      let selector = tag;
      if (id) {
        selector += `#${id}`;
      }
      if (classes) {
        selector += `.${classes}`;
      }
      
      // Create a comment object (separate from tweaqs/edits)
      const scroll = this.getScrollPosition();
      const commentObj = {
        id: `comment_${Date.now()}`,
        text: comment,
        timestamp: Date.now(),
        element: this.selectedElement,
        elementSelector: selector,
        position: {
          x: rect.right + scroll.x,
          y: rect.top + scroll.y
        },
        elementInfo: {
          tag: tag,
          id: id,
          classes: classes
        },
        resolved: false
      };

      this.comments.push(commentObj);
      console.log('💬 Added comment:', commentObj);

      // Create visual bubble indicator
      this.createCommentBubble(commentObj);

      // Clear the comment textarea and reset submit button
      if (this.commentPill) {
      const textarea = this.commentPill.querySelector('.tweaq-comment-textarea');
      const submitBtn = this.commentPill.querySelector('.tweaq-comment-submit');
        if (textarea) textarea.value = '';
        if (submitBtn) submitBtn.disabled = true;
      }
      
      // Hide the comment pill
      this.hideCommentPill();
      
      // Deselect element
      this.selectedElement = null;
      if (this.selectedIndicator) {
        this.selectedIndicator.style.display = 'none';
      }
    }
    
    createCommentBubble(commentObj) {
      // Create bubble container
      const bubble = document.createElement('div');
      bubble.className = 'tweaq-comment-bubble';
      bubble.dataset.commentId = commentObj.id;
      
      // Position bubble with smart positioning
      const rect = commentObj.element.getBoundingClientRect();
      const offsets = this.getBodyOffsets();
      const scroll = this.getScrollPosition();
      const bubbleSize = 32; // width/height from CSS
      const gap = 8;
      
      bubble.style.position = 'absolute';
      bubble.style.zIndex = '999998';
      
      // Smart horizontal positioning
      const spaceOnRight = window.innerWidth - rect.right;
      if (spaceOnRight >= bubbleSize + gap) {
        bubble.style.left = `${rect.right + scroll.x - offsets.left + gap}px`;
      } else {
        // Position to the left
        bubble.style.left = `${rect.left + scroll.x - offsets.left - bubbleSize - gap}px`;
      }
      
      bubble.style.top = `${rect.top + scroll.y - offsets.top}px`;
      
      // Add comment count (for now just 1)
      bubble.innerHTML = `
        <div class="tweaq-bubble-count">1</div>
      `;
      
      // Click to show comment thread
      bubble.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showCommentThread(commentObj);
      });
      
      // Add to document
      document.body.appendChild(bubble);
      
      // Store reference
      this.commentBubbles.set(commentObj.id, bubble);
      
      // Update position on scroll/resize
      this.updateCommentBubblePosition(commentObj.id);
    }
    
    updateCommentBubblePosition(commentId) {
      const comment = this.comments.find(c => c.id === commentId);
      const bubble = this.commentBubbles.get(commentId);
      
      if (!comment || !bubble || !comment.element) return;
      
      const rect = comment.element.getBoundingClientRect();
      const offsets = this.getBodyOffsets();
      const scroll = this.getScrollPosition();
      const bubbleSize = 32;
      const gap = 8;
      
      // Smart horizontal positioning
      const spaceOnRight = window.innerWidth - rect.right;
      if (spaceOnRight >= bubbleSize + gap) {
        bubble.style.left = `${rect.right + scroll.x - offsets.left + gap}px`;
      } else {
        bubble.style.left = `${rect.left + scroll.x - offsets.left - bubbleSize - gap}px`;
      }
      
      bubble.style.top = `${rect.top + scroll.y - offsets.top}px`;
    }
    
    showCommentThread(commentObj) {
      console.log('Show comment thread for:', commentObj);
      
      // Create thread panel
      const existingThread = document.querySelector('.tweaq-comment-thread');
      if (existingThread) {
        existingThread.remove();
      }
      
      const thread = document.createElement('div');
      thread.className = 'tweaq-comment-thread';
      
      const rect = commentObj.element.getBoundingClientRect();
      const threadWidth = 320; // from CSS
      const threadHeight = 200; // approximate height
      const gap = 48; // space from element
      const padding = 10; // viewport edge padding
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Use fixed positioning to prevent overflow
      thread.style.position = 'fixed';
      thread.style.zIndex = '1000003';
      
      let threadLeft, threadTop;
      
      // Smart horizontal positioning
      const spaceOnRight = viewportWidth - rect.right;
      if (spaceOnRight >= threadWidth + gap + padding) {
        // Position to the right
        threadLeft = rect.right + gap;
      } else if (rect.left >= threadWidth + gap + padding) {
        // Position to the left
        threadLeft = rect.left - threadWidth - gap;
      } else {
        // Not enough space on either side - position within viewport bounds
        if (spaceOnRight > rect.left) {
          // Align to right edge with padding
          threadLeft = viewportWidth - threadWidth - padding;
        } else {
          // Align to left edge with padding
          threadLeft = padding;
        }
      }
      
      // Ensure thread stays within viewport horizontally
      threadLeft = Math.max(padding, threadLeft);
      threadLeft = Math.min(viewportWidth - threadWidth - padding, threadLeft);
      
      // Position vertically
      threadTop = rect.top;
      
      // Ensure thread doesn't go below viewport
      if (threadTop + threadHeight > viewportHeight - padding) {
        threadTop = viewportHeight - threadHeight - padding;
      }
      
      // Ensure thread doesn't go above viewport
      if (threadTop < padding) {
        threadTop = padding;
      }
      
      thread.style.left = `${threadLeft}px`;
      thread.style.top = `${threadTop}px`;
      thread.style.maxWidth = `${Math.min(threadWidth, viewportWidth - 2 * padding)}px`;
      thread.style.maxHeight = `${Math.min(400, viewportHeight - 2 * padding)}px`;
      
      thread.innerHTML = `
        <div class="tweaq-thread-header">
          <span class="tweaq-thread-title">Comment</span>
          <button class="tweaq-thread-close">✕</button>
        </div>
        <div class="tweaq-thread-content">
          <div class="tweaq-comment-item">
            <div class="tweaq-comment-author">You</div>
            <div class="tweaq-comment-text">${commentObj.text}</div>
            <div class="tweaq-comment-time">${new Date(commentObj.timestamp).toLocaleString()}</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(thread);
      
      // Close button
      thread.querySelector('.tweaq-thread-close').addEventListener('click', () => {
        thread.remove();
      });
      
      // Click outside to close
      setTimeout(() => {
        const closeOnOutside = (e) => {
          if (!thread.contains(e.target) && !e.target.closest('.tweaq-comment-bubble')) {
            thread.remove();
            document.removeEventListener('click', closeOnOutside);
          }
        };
        document.addEventListener('click', closeOnOutside);
      }, 100);
    }

    async convertCommentsToTweaqs() {
      if (!this.comments || this.comments.length === 0) {
        console.log('No comments to convert');
        return;
      }

      console.log('🔄 Converting comments to tweaqs...');

      // Show loading state
      const loadingEl = document.getElementById('tweaq-conversion-loading');
      const buttonEl = document.getElementById('tweaq-convert-comments');
      if (loadingEl && buttonEl) {
        buttonEl.style.display = 'none';
        loadingEl.style.display = 'flex';
      }

      try {
        // Collect and format comment data
        const commentsData = this.collectCommentsData();
        
        // Call the IPC handler to process with Claude
        if (window.electronAPI && window.electronAPI.convertCommentsToTweaqs) {
          const result = await window.electronAPI.convertCommentsToTweaqs(commentsData);
          
          if (result.success && result.tweaqs) {
            console.log('✅ Received tweaqs from LLM:', result.tweaqs);
            
            // Convert each tweaq into a recorded edit
            result.tweaqs.forEach(tweaq => {
              const edit = this.convertTweaqToEdit(tweaq);
              if (edit) {
                this.recordedEdits.push(edit);
              }
            });
            
            // Remove comments from the page
            this.removeAllComments();
            
            // Update the UI and visual indicators
            this.updateRightToolbarBadge();
            this.updateAllEditIndicators(); // Show visual indicators on tweaqed elements
            this.renderPanel();
            
            console.log('✅ Successfully converted comments to tweaqs');
          } else {
            console.error('Failed to convert comments:', result.error);
            alert('Failed to convert comments to tweaqs. Please try again.');
          }
        } else {
          console.error('electronAPI.convertCommentsToTweaqs not available');
          alert('This feature requires the desktop app.');
        }
      } catch (error) {
        console.error('Error converting comments:', error);
        alert('An error occurred while converting comments.');
      } finally {
        // Hide loading state
        if (loadingEl && buttonEl) {
          loadingEl.style.display = 'none';
          buttonEl.style.display = 'flex';
        }
      }
    }

    collectCommentsData() {
      // Format comments data for LLM processing
      return this.comments.map(comment => {
        const element = comment.element;
        const rect = element ? element.getBoundingClientRect() : null;
        
        // Get computed styles if element exists
        let computedStyles = {};
        if (element) {
          const styles = window.getComputedStyle(element);
          computedStyles = {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            fontFamily: styles.fontFamily,
            textAlign: styles.textAlign,
            padding: styles.padding,
            margin: styles.margin,
            borderRadius: styles.borderRadius,
            display: styles.display,
            position: styles.position,
            width: styles.width,
            height: styles.height
          };
        }
        
        // Get element's text content
        const textContent = element ? element.textContent?.trim().substring(0, 200) : '';
        
        // Build a better selector suggestion
        let suggestedSelector = null;
        if (element) {
          // Priority: ID > unique class combo > text content match
          if (element.id) {
            suggestedSelector = `#${element.id}`;
          } else {
            const tag = element.tagName.toLowerCase();
            const classes = Array.from(element.classList);
            
            // If element has text content, suggest using :contains-like approach
            if (textContent && textContent.length < 50) {
              // For buttons with specific text, suggest the tag + text content
              suggestedSelector = `${tag} containing "${textContent}"`;
            } else if (classes.length > 0) {
              // Use tag + first meaningful class (skip utility classes)
              const meaningfulClass = classes.find(c => 
                !c.match(/^(inline|flex|items|justify|whitespace|transition|duration|bg-|text-|hover:|h-|w-|px-|py-|rounded-)/)
              ) || classes[0];
              suggestedSelector = `${tag}.${meaningfulClass}`;
            } else {
              suggestedSelector = tag;
            }
          }
        }
        
        return {
          id: comment.id,
          text: comment.text,
          timestamp: comment.timestamp,
          elementSelector: comment.elementSelector,
          suggestedSimpleSelector: suggestedSelector,
          elementInfo: {
            tag: comment.elementInfo.tag,
            id: comment.elementInfo.id,
            classes: comment.elementInfo.classes,
            textContent: textContent,
            computedStyles: computedStyles
          },
          position: rect ? {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          } : comment.position,
          // Count of comments for this element (for grouping)
          relatedCommentsCount: this.comments.filter(c => 
            c.elementSelector === comment.elementSelector
          ).length
        };
      });
    }

    formatSelectorForDisplay(selector) {
      // Format a CSS selector into a readable element name
      if (!selector) return 'Element';
      
      // Try to extract a meaningful name from the selector
      // Priority: ID > first class > tag name
      const idMatch = selector.match(/#([\w-]+)/);
      if (idMatch) return `#${idMatch[1]}`;
      
      const classMatch = selector.match(/\.([\w-]+)/);
      const tagMatch = selector.match(/^(\w+)/);
      
      if (classMatch && tagMatch) {
        return `${tagMatch[1]}.${classMatch[1]}`;
      } else if (classMatch) {
        return `.${classMatch[1]}`;
      } else if (tagMatch) {
        return tagMatch[1];
      }
      
      // Fallback: use first 30 chars of selector
      return selector.substring(0, 30) + (selector.length > 30 ? '...' : '');
    }

    simplifySelector(complexSelector) {
      // Simplify a complex CSS selector to make it valid and usable
      if (!complexSelector) return null;
      
      console.log('🔧 Simplifying selector:', complexSelector);
      
      // Remove pseudo-classes (:hover, :active, etc.)
      let simplified = complexSelector.replace(/:[a-z-]+(\([^)]*\))?/g, '');
      
      // Remove attribute selectors with special characters [attr=value]
      simplified = simplified.replace(/\[[^\]]*\]/g, '');
      
      // Extract ID if present
      const idMatch = simplified.match(/#([\w-]+)/);
      if (idMatch) {
        const cleanId = idMatch[0];
        console.log('✅ Using ID selector:', cleanId);
        return cleanId;
      }
      
      // Extract tag and first 2 simple classes
      const tagMatch = simplified.match(/^(\w+)/);
      const classMatches = simplified.match(/\.([\w-]+)/g);
      
      if (tagMatch && classMatches && classMatches.length > 0) {
        // Use tag + first 1-2 classes
        const classes = classMatches.slice(0, 2).join('');
        const result = tagMatch[1] + classes;
        console.log('✅ Using simplified selector:', result);
        return result;
      } else if (tagMatch) {
        console.log('✅ Using tag selector:', tagMatch[1]);
        return tagMatch[1];
      } else if (classMatches && classMatches.length > 0) {
        const result = classMatches[0];
        console.log('✅ Using class selector:', result);
        return result;
      }
      
      console.warn('⚠️ Could not simplify selector, returning original');
      return complexSelector;
    }

    convertTweaqToEdit(tweaq) {
      // Convert LLM-generated tweaq into a structured edit object
      try {
        // Map category to actionType expected by renderStructuredTicket
        const categoryToActionType = {
          'copy': 'content',
          'style': 'styling',
          'layout': 'layout',
          'color': 'styling',
          'spacing': 'layout',
          'size': 'layout',
          'visibility': 'styling'
        };
        
        const actionType = categoryToActionType[tweaq.category] || 'mixed';
        
        // Create specifics array from changes
        const specifics = [];
        if (tweaq.changes && Array.isArray(tweaq.changes)) {
          tweaq.changes.forEach(change => {
            if (change.description) {
              specifics.push(change.description);
            } else {
              // Generate description from property and values
              const propName = change.property === 'textContent' ? 'text' : change.property;
              specifics.push(`Update ${propName}: ${change.currentValue || 'current'} → ${change.newValue}`);
            }
          });
        }
        
        // Add source comments as specifics
        if (tweaq.sourceComments && tweaq.sourceComments.length > 0) {
          specifics.push('---');
          specifics.push('💬 Based on comments:');
          tweaq.sourceComments.forEach(comment => {
            specifics.push(`"${comment}"`);
          });
        }
        
        const edit = {
          id: `tweaq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'structured-change',
          timestamp: Date.now(),
          instruction: tweaq.description || tweaq.summary || 'Update element',
          actionType: actionType,
          target: {
            identifier: tweaq.elementSelector,
            selector: tweaq.elementSelector
          },
          specifics: specifics,
          // Add elementSelector at root level for findElementFromEdit
          elementSelector: tweaq.elementSelector,
          // Add elementName for display in property ticket
          elementName: this.formatSelectorForDisplay(tweaq.elementSelector),
          // Keep original format for agent processing
          changes: tweaq.changes ? tweaq.changes.map(change => ({
            property: change.property,
            before: change.currentValue || change.before,
            after: change.newValue || change.after,
            description: change.description
          })) : [],
          sourceComments: tweaq.sourceComments || [],
          metadata: {
            generatedByAI: true,
            originalCommentIds: tweaq.commentIds || [],
            // Add conflict information if present
            hasConflicts: tweaq.conflictInfo?.hasConflicts || false,
            conflictInfo: tweaq.conflictInfo?.hasConflicts ? {
              conflictType: tweaq.conflictInfo.conflictType,
              conflictingComments: tweaq.conflictInfo.conflictingComments || [],
              chosenSolution: tweaq.conflictInfo.chosenSolution,
              resolutionReason: tweaq.conflictInfo.resolutionReason,
              alternatives: tweaq.conflictInfo.alternatives || []
            } : null
          }
        };

        // Try to find the actual element and store as elementReference
        let element = null;
        let workingSelector = tweaq.elementSelector;
        
        // First, try to find the original comment element if we still have references
        const matchingComment = this.comments.find(c => 
          tweaq.commentIds && tweaq.commentIds.includes(c.id)
        );
        if (matchingComment && matchingComment.element && document.body.contains(matchingComment.element)) {
          element = matchingComment.element;
          console.log('✅ Using original comment element reference');
        }
        
        // If we don't have the original element, try selectors
        if (!element) {
          try {
            // First, try the original selector
            element = document.querySelector(tweaq.elementSelector);
            
            if (!element) {
              console.warn('⚠️ Original selector failed, trying simplified version...');
              // If it fails, try a simplified version
              workingSelector = this.simplifySelector(tweaq.elementSelector);
              if (workingSelector) {
                element = document.querySelector(workingSelector);
              }
            }
            
            // If still no match and we have text content, try matching by tag + text
            if (!element && tweaq.sourceComments && tweaq.sourceComments.length > 0) {
              console.log('⚠️ Simplified selector failed, trying text content match...');
              const matchingComments = this.comments.filter(c => 
                tweaq.commentIds && tweaq.commentIds.includes(c.id)
              );
              
              for (const comment of matchingComments) {
                if (comment.elementInfo && comment.elementInfo.textContent) {
                  const textContent = comment.elementInfo.textContent.trim();
                  const tag = comment.elementInfo.tag;
                  
                  // Find all elements of this tag with matching text
                  const candidates = Array.from(document.querySelectorAll(tag));
                  element = candidates.find(el => el.textContent?.trim() === textContent);
                  
                  if (element) {
                    console.log('✅ Found element by matching text content:', textContent.substring(0, 30) + '...');
                    break;
                  }
                }
              }
              
              // Final fallback: try position-based matching
              if (!element) {
                console.log('⚠️ Text match failed, trying position-based match...');
                for (const comment of matchingComments) {
                  if (comment.elementInfo && comment.position) {
                    const tag = comment.elementInfo.tag;
                    const targetPos = comment.position;
                    
                    // Find elements near the original position
                    const candidates = Array.from(document.querySelectorAll(tag));
                    element = candidates.find(el => {
                      const rect = el.getBoundingClientRect();
                      // Match if position is within 50px
                      return Math.abs(rect.x - targetPos.x) < 50 && 
                             Math.abs(rect.y - targetPos.y) < 50;
                    });
                    
                    if (element) {
                      console.log('✅ Found element by matching position');
                      break;
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.warn('❌ Error finding element:', e);
          }
        }
          
        if (element) {
            edit.elementReference = element;
            edit.elementSelector = workingSelector; // Update to working selector
            edit.target.identifier = workingSelector; // Update target too
            edit.target.selector = workingSelector;
            console.log('✅ Found element for tweaq using selector:', workingSelector.substring(0, 50) + '...');
            
            // Enrich the changes with actual current values from the element
            if (edit.changes && edit.changes.length > 0) {
              const computedStyles = window.getComputedStyle(element);
              
              edit.changes = edit.changes.map(change => {
                let actualBefore = change.before;
                
                // Get actual current value from element
                if (change.property === 'textContent') {
                  actualBefore = element.textContent?.trim() || '';
                } else {
                  // Get computed style value
                  actualBefore = computedStyles[change.property] || change.before;
                }
                
                return {
                  property: change.property,
                  before: actualBefore,
                  after: change.after,
                  description: change.description
                };
              });
              
              console.log('✅ Enriched changes with actual values:', edit.changes);
              
              // Apply the tweaq immediately to the element (like Design tweaqs do)
              this.applyEditToElement(element, edit);
              console.log('✅ Applied tweaq changes to element');
            } else {
              console.warn('⚠️ No changes to apply for this tweaq');
            }
          } else {
            console.warn('⚠️ Element not found on page for selector:', tweaq.elementSelector);
          }
        
        return edit;
      } catch (error) {
        console.error('Error converting tweaq to edit:', error);
        return null;
      }
    }

    removeAllComments() {
      // Remove all comment bubbles from the page
      this.commentBubbles.forEach((bubble, commentId) => {
        if (bubble && bubble.parentNode) {
          bubble.remove();
        }
      });
      
      // Clear the comment bubbles map
      this.commentBubbles.clear();
      
      // Close any open comment threads
      const existingThread = document.querySelector('.tweaq-comment-thread');
      if (existingThread) {
        existingThread.remove();
      }
      
      // Clear the comments array
      this.comments = [];
      
      console.log('✅ Removed all comments from page');
    }

    showConflictResolutionReview(editIndex) {
      const edit = this.recordedEdits[editIndex];
      if (!edit || !edit.metadata?.hasConflicts) {
        console.warn('No conflict information available for this tweaq');
        return;
      }

      const conflictInfo = edit.metadata.conflictInfo;
      
      // Remove existing modal if present
      const existingModal = document.querySelector('.tweaq-conflict-modal');
      if (existingModal) {
        existingModal.remove();
      }
      
      // Get the property being changed
      const propertyName = conflictInfo.conflictingComments[0]?.property || 'property';
      const currentValue = edit.changes.find(c => c.property === propertyName)?.after || conflictInfo.chosenSolution;
      
      // Create modal
      const modal = document.createElement('div');
      modal.className = 'tweaq-conflict-modal';
      modal.innerHTML = `
        <div class="tweaq-conflict-backdrop"></div>
        <div class="tweaq-conflict-dialog">
          <div class="tweaq-conflict-header">
            <div class="tweaq-conflict-title-row">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" style="color: #ff9800;">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
              <h3 class="tweaq-conflict-title">Conflict Resolution Review</h3>
            </div>
            <button class="tweaq-conflict-close" title="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
              </svg>
            </button>
          </div>
          
          <div class="tweaq-conflict-content">
            <div class="tweaq-conflict-section">
              <div class="tweaq-conflict-section-label">Property</div>
              <div class="tweaq-conflict-property-name">${propertyName}</div>
              <div class="tweaq-conflict-type-badge">${conflictInfo.conflictType.replace(/_/g, ' ')}</div>
            </div>
            
            <div class="tweaq-conflict-section">
              <div class="tweaq-conflict-section-label">Conflicting Feedback (${conflictInfo.conflictingComments.length} stakeholders)</div>
              <div class="tweaq-conflict-comments">
                ${conflictInfo.conflictingComments.map((comment, i) => `
                  <div class="tweaq-conflict-comment-item">
                    <div class="tweaq-conflict-comment-header">
                      <span class="tweaq-conflict-comment-num">#${i + 1}</span>
                      <span class="tweaq-conflict-comment-text">"${this.escapeHtml(comment.text)}"</span>
                    </div>
                    <div class="tweaq-conflict-comment-suggestion">
                      → Suggested: <code>${this.escapeHtml(String(comment.suggestedValue))}</code>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div class="tweaq-conflict-section">
              <div class="tweaq-conflict-section-label">AI Resolution</div>
              <div class="tweaq-conflict-ai-choice">
                <div class="tweaq-conflict-ai-value">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="color: #4caf50;">
                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                  </svg>
                  <code>${this.escapeHtml(String(currentValue))}</code>
                </div>
                <div class="tweaq-conflict-ai-reasoning">${this.escapeHtml(conflictInfo.resolutionReason)}</div>
              </div>
            </div>
            
            ${conflictInfo.alternatives && conflictInfo.alternatives.length > 0 ? `
              <div class="tweaq-conflict-section">
                <div class="tweaq-conflict-section-label">Alternative Options</div>
                <div class="tweaq-conflict-alternatives">
                  ${conflictInfo.alternatives.map((alt, i) => `
                    <div class="tweaq-conflict-alternative" data-value="${this.escapeHtml(String(alt.value))}">
                      <div class="tweaq-conflict-alt-header">
                        <input type="radio" 
                               name="conflict-choice" 
                               id="alt-${i}" 
                               value="${this.escapeHtml(String(alt.value))}"
                               class="tweaq-conflict-radio">
                        <label for="alt-${i}" class="tweaq-conflict-alt-value">
                          <code>${this.escapeHtml(String(alt.value))}</code>
                        </label>
                        <span class="tweaq-conflict-alt-source">${alt.source}</span>
                      </div>
                      <div class="tweaq-conflict-alt-rationale">${this.escapeHtml(alt.rationale)}</div>
                    </div>
                  `).join('')}
                  
                  <div class="tweaq-conflict-alternative tweaq-conflict-custom">
                    <div class="tweaq-conflict-alt-header">
                      <input type="radio" 
                             name="conflict-choice" 
                             id="alt-custom" 
                             value="__custom__"
                             class="tweaq-conflict-radio">
                      <label for="alt-custom" class="tweaq-conflict-alt-value">Custom Value</label>
                    </div>
                    <input type="text" 
                           class="tweaq-conflict-custom-input" 
                           placeholder="Enter custom value..."
                           disabled>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="tweaq-conflict-footer">
            <button class="tweaq-conflict-btn tweaq-conflict-btn-secondary" data-action="cancel">
              Keep AI Choice
            </button>
            <button class="tweaq-conflict-btn tweaq-conflict-btn-primary" data-action="apply" disabled>
              Apply Selected
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Store edit index for later use
      modal.dataset.editIndex = editIndex;
      
      // Attach event listeners
      this.attachConflictModalListeners(modal);
      
      console.log('🔍 Conflict Resolution Modal opened for edit:', editIndex);
    }

    attachConflictModalListeners(modal) {
      // Close button
      const closeBtn = modal.querySelector('.tweaq-conflict-close');
      closeBtn?.addEventListener('click', () => {
        modal.remove();
      });

      // Backdrop click
      const backdrop = modal.querySelector('.tweaq-conflict-backdrop');
      backdrop?.addEventListener('click', () => {
        modal.remove();
      });

      // Cancel button
      const cancelBtn = modal.querySelector('[data-action="cancel"]');
      cancelBtn?.addEventListener('click', () => {
        modal.remove();
      });

      // Radio buttons
      const radioButtons = modal.querySelectorAll('.tweaq-conflict-radio');
      const applyBtn = modal.querySelector('[data-action="apply"]');
      const customInput = modal.querySelector('.tweaq-conflict-custom-input');

      radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
          // Enable apply button
          if (applyBtn) {
            applyBtn.disabled = false;
          }

          // Handle custom input
          if (radio.value === '__custom__') {
            if (customInput) {
              customInput.disabled = false;
              customInput.focus();
            }
          } else {
            if (customInput) {
              customInput.disabled = true;
            }
          }
        });
      });

      // Custom input
      if (customInput) {
        customInput.addEventListener('input', () => {
          // Enable apply button if there's content
          if (applyBtn) {
            applyBtn.disabled = customInput.value.trim() === '';
          }
        });
      }

      // Apply button
      if (applyBtn) {
        applyBtn.addEventListener('click', () => {
          const editIndex = parseInt(modal.dataset.editIndex);
          const selectedRadio = modal.querySelector('.tweaq-conflict-radio:checked');
          
          if (!selectedRadio) return;

          let newValue;
          if (selectedRadio.value === '__custom__') {
            newValue = customInput?.value.trim();
          } else {
            newValue = selectedRadio.value;
          }

          if (newValue) {
            this.applyConflictResolution(editIndex, newValue);
            modal.remove();
          }
        });
      }
    }

    applyConflictResolution(editIndex, newValue) {
      const edit = this.recordedEdits[editIndex];
      if (!edit) return;

      console.log(`✅ Applying conflict resolution: ${newValue}`);

      // Find the property being changed
      const conflictInfo = edit.metadata.conflictInfo;
      const propertyName = conflictInfo.conflictingComments[0]?.property || 'property';

      // Update the change
      const changeIndex = edit.changes.findIndex(c => c.property === propertyName);
      if (changeIndex !== -1) {
        edit.changes[changeIndex].after = newValue;
      }

      // Mark that user has reviewed the conflict
      edit.metadata.conflictInfo.userReviewed = true;
      edit.metadata.conflictInfo.finalValue = newValue;

      // Reapply to element
      if (edit.elementReference) {
        this.applyEditToElement(edit.elementReference, edit);
      }

      // Update UI
      this.renderPanel();
      this.updateAllEditIndicators();

      console.log('✅ Conflict resolution applied and page updated');
    }

    updateCommentPillPosition() {
      if (!this.selectedElement || !this.commentPill) return;

      const rect = this.selectedElement.getBoundingClientRect();
      const pillWidth = 320; // min-width from CSS
      const pillHeight = 140; // approximate height
      const gap = 12;
      const padding = 10; // padding from viewport edges
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate available space on right and left
      const spaceOnRight = viewportWidth - rect.right;
      const spaceOnLeft = rect.left;
      
      let pillLeft, pillTop;
      
      // Use fixed positioning for better overlay behavior
      this.commentPill.style.position = 'fixed';
      
      // Position horizontally - prefer right, but use left if not enough space
      if (spaceOnRight >= pillWidth + gap + padding) {
        // Position to the right (fixed positioning, so no scrollX)
        pillLeft = rect.right + gap;
      } else if (spaceOnLeft >= pillWidth + gap + padding) {
        // Position to the left
        pillLeft = rect.left - pillWidth - gap;
      } else {
        // Not enough space on either side - position within viewport bounds
        if (spaceOnRight > spaceOnLeft) {
          // Align to right edge of viewport with padding
          pillLeft = viewportWidth - pillWidth - padding;
        } else {
          // Align to left edge of viewport with padding
          pillLeft = padding;
        }
      }
      
      // Ensure pill stays within viewport horizontally
      pillLeft = Math.max(padding, pillLeft);
      pillLeft = Math.min(viewportWidth - pillWidth - padding, pillLeft);
      
      // Position vertically - start aligned with element top
      pillTop = rect.top;
      
      // Check if pill would go below viewport
      if (rect.top + pillHeight > viewportHeight) {
        // Position so bottom aligns with element bottom or viewport bottom
        pillTop = Math.max(
          padding,
          rect.bottom - pillHeight
        );
      }
      
      // Ensure pill doesn't go above viewport
      if (pillTop < padding) {
        pillTop = padding;
      }
      
      // Ensure pill doesn't go below viewport
      if (pillTop + pillHeight > viewportHeight - padding) {
        pillTop = viewportHeight - pillHeight - padding;
      }

      this.commentPill.style.left = `${pillLeft}px`;
      this.commentPill.style.top = `${pillTop}px`;
      this.commentPill.style.maxWidth = `${Math.min(pillWidth, viewportWidth - 2 * padding)}px`;
      
      // Only show comment pill in comment mode
      if (this.mode === 'comment') {
        this.commentPill.style.display = 'block';
        // Auto-focus the textarea when shown
        const textarea = this.commentPill.querySelector('.tweaq-comment-textarea');
        if (textarea) {
          setTimeout(() => textarea.focus(), 10);
        }
      } else {
        this.commentPill.style.display = 'none';
      }
    }

    hideCommentPill() {
      if (this.commentPill) {
        this.commentPill.style.display = 'none';
      }
    }

    renderToolbar() {
      const existingToolbar = this.overlayContainer.querySelector('.tweaq-overlay-toolbar');
      if (existingToolbar) {
        existingToolbar.remove();
      }

      const toolbar = document.createElement('div');
      toolbar.className = 'tweaq-overlay-toolbar';
      
      const elementName = this.getElementName();
      
      // Cursor/Select icon SVG
      const selectIcon = `
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d='M3.348 5.706c-.486-1.457.9-2.844 2.358-2.358L18.645 7.66c1.627.543 1.72 2.808.145 3.483l-4.61 1.976 6.35 6.35a.75.75 0 1 1-1.06 1.061l-6.35-6.35-1.977 4.61c-.675 1.576-2.94 1.481-3.482-.145z'/>
        </svg>
      `;

      toolbar.innerHTML = `
        <button class="tweaq-mode-toggle-btn ${this.mode === 'select' ? 'active' : ''}" title="${this.mode === 'chat' ? 'Click to select elements' : 'Back to Chat'}">
          ${selectIcon}
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

    getEditableTextContent(element) {
      // For elements with simple text content (no complex child elements)
      // Get the direct text nodes
      let textContent = '';
      
      for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          textContent += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE && 
                   (node.tagName === 'BR' || node.tagName === 'SPAN' || node.tagName === 'STRONG' || 
                    node.tagName === 'EM' || node.tagName === 'B' || node.tagName === 'I')) {
          // Include text from inline formatting elements
          textContent += node.textContent;
        }
      }
      
      // If no direct text nodes found, use innerText as fallback
      if (textContent.trim().length === 0) {
        textContent = element.innerText || element.textContent || '';
      }
      
      return textContent.trim();
    }

    toggleMode() {
      this.mode = this.mode === 'chat' ? 'select' : 'chat';
      console.log('🔄 Mode switched to:', this.mode);
      
      if (this.mode === 'chat') {
        // Clear selection when going back to chat
        this.selectedElement = null;
        this.updateOutline(null);
        this.hideSelectedIndicator();
        this.hideSelectModeIndicators();
      } else {
        // Entering select mode
        this.showSelectModeIndicators();
      }
      
      // Always render chat view when toggling - properties view only shows after selecting an element
      this.renderChatView();
    }

    showSelectModeIndicators() {
      // Add glow effect
      if (!document.querySelector('.tweaq-select-mode-glow')) {
        const glow = document.createElement('div');
        glow.className = 'tweaq-select-mode-glow';
        document.body.appendChild(glow);
      }

      // Add toast notification
      if (!document.querySelector('.tweaq-select-mode-toast')) {
        const toast = document.createElement('div');
        toast.className = 'tweaq-select-mode-toast';
        toast.textContent = 'Select an element';
        document.body.appendChild(toast);
      }
    }

    hideSelectModeIndicators() {
      // Remove glow effect
      const glow = document.querySelector('.tweaq-select-mode-glow');
      if (glow) glow.remove();

      // Remove toast notification
      const toast = document.querySelector('.tweaq-select-mode-toast');
      if (toast) toast.remove();
    }

    applyBodyMargins(panelWidth) {
      // Apply body margins both via CSS variable and inline styles
      // This ensures margins persist even on aggressive websites
      const toolbarWidth = 56;
      const marginSide = 24;
      const marginTop = 28;
      const marginBottom = 24;
      
      const marginLeft = toolbarWidth + panelWidth + marginSide;
      
      // Apply inline styles to override any website CSS
      document.body.style.setProperty('margin-top', `${marginTop}px`, 'important');
      document.body.style.setProperty('margin-left', `${marginLeft}px`, 'important');
      document.body.style.setProperty('margin-right', `${marginSide}px`, 'important');
      document.body.style.setProperty('margin-bottom', `${marginBottom}px`, 'important');
      document.body.style.setProperty('height', `calc(100vh - ${marginTop}px - ${marginBottom}px)`, 'important');
      document.body.style.setProperty('overflow-y', 'auto', 'important');
      document.body.style.setProperty('overflow-x', 'hidden', 'important');
      document.body.style.setProperty('box-sizing', 'border-box', 'important');
      document.body.style.setProperty('position', 'relative', 'important');
      document.body.style.setProperty('transition', 'none', 'important');
      
      // Also apply to html element
      document.documentElement.style.setProperty('overflow', 'hidden', 'important');
      document.documentElement.style.setProperty('height', '100vh', 'important');
      
      console.log('📏 Body margins applied:', { marginTop, marginLeft, marginRight: marginSide, marginBottom });
    }

    showPanel() {
      document.body.classList.add('tweaq-panel-open');
      setTimeout(() => {
        this.propertiesPanel.classList.add('visible');
        if (this.resizeHandle) {
          this.resizeHandle.classList.add('visible');
        }
      }, 10);
      
      // Get current panel width from localStorage or default
      let currentWidth = 320;
      try {
        const savedWidth = localStorage.getItem('tweaq-panel-width');
        if (savedWidth) {
          currentWidth = parseInt(savedWidth);
        }
      } catch (e) {
        // Ignore
      }
      
      // Update CSS variable to restore panel width
      document.documentElement.style.setProperty('--tweaq-panel-width', `${currentWidth}px`);
      
      // Apply body margins with current panel width
      this.applyBodyMargins(currentWidth);
      
      // Notify Electron app of panel width when showing
      if (window.electronAPI && window.electronAPI.updatePanelWidth) {
        window.electronAPI.updatePanelWidth(currentWidth);
      }
    }

    hidePanel() {
      // Remove body margin first to prevent content jumping
      document.body.classList.remove('tweaq-panel-open');
      // Then slide out panel
      this.propertiesPanel.classList.remove('visible');
      if (this.resizeHandle) {
        this.resizeHandle.classList.remove('visible');
      }
      
      // Update CSS variable to set panel width to 0 (this adjusts body margins)
      document.documentElement.style.setProperty('--tweaq-panel-width', '0px');
      
      // Apply body margins with panel width 0
      this.applyBodyMargins(0);
      
      // Notify Electron app that panel is closed (width = 0)
      if (window.electronAPI && window.electronAPI.updatePanelWidth) {
        window.electronAPI.updatePanelWidth(0);
      }
    }

    renderPanel() {
      if (this.mode === 'chat') {
        this.renderChatView();
      } else if (this.mode === 'tickets') {
        this.renderTicketsView();
      } else if (this.mode === 'design') {
        // Design mode - always show properties (page or element)
        this.renderProperties();
      } else if (this.mode === 'comment' && this.selectedElement) {
        // Comment mode - only show properties when element is selected
        this.renderProperties();
      } else {
        // Comment mode but no element selected yet - hide panel
        this.hidePanel();
      }
    }

    renderChatView() {
      // Render conversation messages
      const messagesHTML = this.conversationMessages.length > 0
        ? this.conversationMessages.map(msg => {
            const isUser = msg.role === 'user';
            const content = isUser ? this.escapeHtml(msg.content) : this.renderMarkdown(msg.content);
            return `
              <div class="tweaq-chat-message ${isUser ? 'user' : 'assistant'}">
                <div class="tweaq-message-content">${content}</div>
              </div>
            `;
          }).join('')
        : `
          <div class="tweaq-chat-welcome">
            <div style="font-size: 24px; margin-bottom: 8px;">💬</div>
            <p style="color: #999; font-size: 14px;">Start a conversation to make changes</p>
          </div>
        `;

      // Show confirmation UI if we have ready tickets
      const confirmationHTML = this.readyTickets && this.readyTickets.length > 0 
        ? `
          <div class="tweaq-chat-confirmation">
            <div class="tweaq-confirmation-header">Ready to create tweaqs?</div>
            <div class="tweaq-confirmation-tickets">
              ${this.readyTickets.map(ticket => `
                <div class="tweaq-confirmation-ticket">
                  <div class="tweaq-ticket-icon">⚡</div>
                  <div class="tweaq-ticket-info">
                    <div class="tweaq-ticket-instruction">${this.escapeHtml(ticket.instruction)}</div>
                    <div class="tweaq-ticket-meta">Target: ${ticket.target.identifier} • Confidence: ${(ticket.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="tweaq-confirmation-actions">
              <button class="tweaq-btn-secondary tweaq-cancel-conversation-btn">Cancel</button>
              <button class="tweaq-btn-primary tweaq-confirm-conversation-btn">Create Tweaqs</button>
            </div>
          </div>
        `
        : '';

      this.propertiesPanel.innerHTML = `
        <div class="tweaq-panel-content" style="padding: 16px; display: flex; flex-direction: column; gap: 12px; flex: 1;">
          <div class="tweaq-chat-messages-container" style="flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 200px; overflow-y: auto;">
            ${messagesHTML}
            ${this.awaitingResponse ? '<div class="tweaq-chat-loading">🤔 Thinking...</div>' : ''}
          </div>
          ${confirmationHTML}
          ${!this.readyTickets ? `
            ${this.conversationMessages.length === 0 ? `
              <div class="tweaq-chat-examples">
                <div class="tweaq-examples-label">Examples:</div>
                <div class="tweaq-example-chips">
                  <button class="tweaq-example-chip">Make the copy more friendly</button>
                  <button class="tweaq-example-chip">Condense the footer</button>
                  <button class="tweaq-example-chip">Make buttons more vibrant</button>
                </div>
              </div>
            ` : ''}
            <div class="tweaq-chat-input-wrapper">
              <textarea 
                class="tweaq-chat-input" 
                placeholder="${this.conversationMessages.length === 0 ? 'Describe the change you want to make...' : 'Type your message...'}" 
                rows="3"
                ${this.awaitingResponse ? 'disabled' : ''}
              ></textarea>
              <button class="tweaq-chat-send-btn" ${this.awaitingResponse ? 'disabled' : ''}>
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z"/>
                </svg>
              </button>
            </div>
          ` : ''}
        </div>
      `;

      // Add event listeners
      const sendBtn = this.propertiesPanel.querySelector('.tweaq-chat-send-btn');
      const input = this.propertiesPanel.querySelector('.tweaq-chat-input');
      const confirmBtn = this.propertiesPanel.querySelector('.tweaq-confirm-conversation-btn');
      const cancelBtn = this.propertiesPanel.querySelector('.tweaq-cancel-conversation-btn');

      if (sendBtn) {
        sendBtn.addEventListener('click', () => {
          this.addInstruction();
        });
      }

      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.addInstruction();
          }
        });
      }

      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          this.confirmConversation();
        });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          this.cancelConversation();
        });
      }

      this.propertiesPanel.querySelectorAll('.tweaq-example-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          if (input && !this.awaitingResponse) {
            input.value = chip.textContent;
            this.addInstruction();
          }
        });
      });
    }

    async addInstruction() {
      const input = this.propertiesPanel.querySelector('.tweaq-chat-input');
      if (!input) return;
      
      const message = input.value.trim();
      
      if (!message) return;

      // Add user message to conversation
      this.conversationMessages.push({
        role: 'user',
        content: message,
        timestamp: Date.now()
      });

      input.value = '';
      this.awaitingResponse = true;
      this.renderChatView();

      try {
        // Analyze message through conversational intelligence
        console.log('🗣️ Sending message to conversational intelligence...');
        const result = await window.electronAPI.analyzeConversationMessage({
          message,
          conversationState: this.conversationState
        });

        if (!result.success) {
          console.error('❌ Conversation analysis failed:', result.error);
          this.conversationMessages.push({
            role: 'assistant',
            content: `Sorry, I encountered an error: ${result.error}`,
            timestamp: Date.now()
          });
          this.awaitingResponse = false;
          this.renderChatView();
          return;
        }

        const analysis = result.analysis;
        
        // Update conversation state
        this.conversationState = analysis.conversationState;

        // Add AI response
        this.conversationMessages.push({
          role: 'assistant',
          content: analysis.response,
          timestamp: Date.now()
        });

        console.log(`✅ Analysis complete - Completeness: ${(analysis.completeness * 100).toFixed(1)}%`);
        console.log(`   Next Action: ${analysis.nextAction}`);

        // If ready for confirmation, create ready tickets
        if (analysis.nextAction === 'confirm') {
          this.createReadyTickets();
        }

        this.awaitingResponse = false;
        this.renderChatView();
        
        // Scroll to bottom
        const messagesContainer = this.propertiesPanel.querySelector('.tweaq-chat-messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

      } catch (error) {
        console.error('❌ Error in conversation:', error);
        this.conversationMessages.push({
          role: 'assistant',
          content: `Sorry, something went wrong: ${error.message}`,
          timestamp: Date.now()
        });
        this.awaitingResponse = false;
        this.renderChatView();
      }
    }

    createReadyTickets() {
      const { target, action } = this.conversationState.extractedInfo;
      
      if (!target || !action) {
        console.error('Cannot create tweaqs: missing target or action');
        return;
      }

      // Create ready tickets (one per target identifier)
      this.readyTickets = target.identifiers.map(identifier => {
        const specificsStr = action.specifics.join(' and ');
        return {
          instruction: `Make the ${identifier} ${specificsStr}`,
          target: {
            type: target.type,
            identifier
          },
          action: {
            type: action.type,
            specifics: action.specifics
          },
          confidence: Math.min(target.confidence, action.confidence)
        };
      });

      console.log('✅ Created ready tweaqs:', this.readyTickets);
    }

    confirmConversation() {
      if (!this.readyTickets || this.readyTickets.length === 0) return;

      console.log('✅ User confirmed conversation - creating structured tweaqs');

      // Convert ready tickets to structured edit tickets
      this.readyTickets.forEach(ticket => {
        const editTicket = {
          id: `structured_${Date.now()}_${Math.random()}`,
          type: 'structured-change',
          // Structured fields
          target: {
            identifier: ticket.target.identifier,
            type: ticket.target.type
          },
          actionType: ticket.action.type,
          specifics: ticket.action.specifics,
          instruction: ticket.instruction,
          // Legacy fields for compatibility
          description: ticket.instruction,
          selector: ticket.target.identifier,
          changes: ticket.action.specifics.map(specific => ({
            type: ticket.action.type,
            description: specific,
            instruction: ticket.instruction
          })),
          timestamp: Date.now(),
          status: 'pending',
          confidence: ticket.confidence,
          visible: true // Track if tweaq is currently visible
        };

        this.recordedEdits.push(editTicket);
      });

      // Reset conversation
      this.conversationState = null;
      this.conversationMessages = [];
      this.readyTickets = null;

      // Update edit indicators
      this.updateAllEditIndicators();

      // Render panel to update
      this.renderPanel();

      console.log(`⚡ Created ${this.recordedEdits.length} structured tweaqs from conversation`);
    }

    cancelConversation() {
      console.log('❌ User cancelled conversation');
      
      // Reset conversation
      this.conversationState = null;
      this.conversationMessages = [];
      this.readyTickets = null;

      this.renderChatView();
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    renderMarkdown(text) {
      // First escape HTML to prevent XSS
      let html = this.escapeHtml(text);
      
      // Bold: **text** or __text__
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
      
      // Italic: *text* or _text_
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
      html = html.replace(/_(.+?)_/g, '<em>$1</em>');
      
      // Inline code: `code`
      html = html.replace(/`(.+?)`/g, '<code>$1</code>');
      
      // Convert bullet points (lines starting with • or - or *)
      const lines = html.split('\n');
      let inList = false;
      const processedLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const bulletMatch = line.match(/^(\s*)[•\-\*]\s+(.+)$/);
        
        if (bulletMatch) {
          if (!inList) {
            processedLines.push('<ul style="margin: 8px 0; padding-left: 20px;">');
            inList = true;
          }
          processedLines.push(`<li style="margin: 4px 0;">${bulletMatch[2]}</li>`);
        } else {
          if (inList) {
            processedLines.push('</ul>');
            inList = false;
          }
          processedLines.push(line);
        }
      }
      
      if (inList) {
        processedLines.push('</ul>');
      }
      
      html = processedLines.join('\n');
      
      // Convert line breaks to <br> (but not inside lists)
      html = html.replace(/\n(?!<\/?(ul|li))/g, '<br>');
      
      return html;
    }

    removeInstruction(index) {
      this.naturalLanguageEdits.splice(index, 1);
      console.log('🗑️ Removed instruction at index:', index);
      
      this.renderPanel();
    }

    renderTicketsView() {
      const ticketCount = this.recordedEdits.length;
      const commentCount = this.comments ? this.comments.length : 0;
      
      // Comments conversion card (shown when there are comments)
      const commentsConversionCard = commentCount > 0 ? `
        <div class="tweaq-comments-conversion-card">
          <div class="tweaq-conversion-header">
            <div class="tweaq-conversion-icon">💬</div>
            <div class="tweaq-conversion-info">
              <h4 class="tweaq-conversion-title">${commentCount} Comment${commentCount === 1 ? '' : 's'} on Page</h4>
              <p class="tweaq-conversion-subtitle">Convert comments into actionable tweaqs</p>
            </div>
          </div>
          <button class="tweaq-conversion-button" id="tweaq-convert-comments">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5z"/>
            </svg>
            Create Tweaqs
          </button>
          <div class="tweaq-conversion-loading" id="tweaq-conversion-loading" style="display: none;">
            <div class="tweaq-loading-spinner"></div>
            <span>Analyzing comments with AI...</span>
          </div>
        </div>
      ` : '';
      
      const ticketsHTML = this.recordedEdits.length > 0
        ? this.recordedEdits.map((edit, index) => {
            const isStructuredChange = edit.type === 'structured-change';
            const hasPropertyChanges = edit.changes && edit.changes.length > 0 && 
                                      edit.changes.some(c => c.property && c.before !== undefined && c.after !== undefined);
            
            // If it's an AI-generated tweaq with actual property changes, use property ticket renderer
            if (isStructuredChange && hasPropertyChanges && edit.metadata?.generatedByAI) {
              return this.renderPropertyTicket(edit, index);
            } else if (isStructuredChange) {
              // For conversation-based structured changes without property changes
              return this.renderStructuredTicket(edit, index);
            } else {
              // For direct property edits
              return this.renderPropertyTicket(edit, index);
            }
          }).join('')
        : `
          <div class="tweaq-empty-state">
            <div style="font-size: 32px; margin-bottom: 12px;">⚡</div>
            <p style="color: #999; font-size: 14px; margin-bottom: 8px;">No tweaqs yet</p>
            <p style="color: #bbb; font-size: 12px;">Edit in Design, add Comments, or Chat to create tweaqs</p>
          </div>
        `;

      const confirmButton = this.recordedEdits.length > 0
        ? `
          <button class="tweaq-confirm-button" id="tweaq-confirm-edits">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
            </svg>
            Send ${ticketCount} ${ticketCount === 1 ? 'Tweaq' : 'Tweaqs'} to Agent
          </button>
        `
        : '';

      this.propertiesPanel.innerHTML = `
        <div class="tweaq-panel-content">
          ${commentsConversionCard}
          <div class="tweaq-tickets-list">
            ${ticketsHTML}
          </div>
        </div>
        ${confirmButton}
      `;

      // Attach delete listeners
      const deleteButtons = this.propertiesPanel.querySelectorAll('.tweaq-ticket-delete');
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.getAttribute('data-index'));
          this.deleteEdit(index);
        });
      });

      // Attach toggle visibility listeners
      const toggleButtons = this.propertiesPanel.querySelectorAll('.tweaq-ticket-toggle');
      toggleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent triggering hover
          const index = parseInt(btn.getAttribute('data-index'));
          this.toggleEditVisibility(index);
        });
      });

      // Attach target selector toggle listeners
      const targetSelectors = this.propertiesPanel.querySelectorAll('.tweaq-target-selector');
      targetSelectors.forEach(selector => {
        selector.addEventListener('click', (e) => {
          e.stopPropagation();
          selector.classList.toggle('expanded');
        });
      });

      // Attach hover listeners to ticket cards
      const ticketCards = this.propertiesPanel.querySelectorAll('.tweaq-ticket-card');
      ticketCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          const editIndex = parseInt(card.getAttribute('data-edit-index'));
          this.highlightEditElement(editIndex);
        });
        card.addEventListener('mouseleave', () => {
          this.clearEditHighlight();
        });
      });

      // Attach confirm button listener
      const confirmBtn = this.propertiesPanel.querySelector('#tweaq-confirm-edits');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          this.confirmEdits();
        });
      }

      // Attach convert comments button listener
      const convertBtn = this.propertiesPanel.querySelector('#tweaq-convert-comments');
      if (convertBtn) {
        convertBtn.addEventListener('click', () => {
          this.convertCommentsToTweaqs();
        });
      }

      // Attach conflict review button listeners
      const conflictReviewBtns = this.propertiesPanel.querySelectorAll('.tweaq-conflict-review');
      conflictReviewBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent triggering hover
          const index = parseInt(btn.getAttribute('data-index'));
          this.showConflictResolutionReview(index);
        });
      });
    }

    categorizeChange(property) {
      // Map CSS properties to change categories
      const categories = {
        'textContent': { type: 'Copy Change', icon: '✏️', color: '#667eea' },
        'color': { type: 'Color Change', icon: '🎨', color: '#f093fb' },
        'backgroundColor': { type: 'Color Change', icon: '🎨', color: '#f093fb' },
        'borderColor': { type: 'Color Change', icon: '🎨', color: '#f093fb' },
        'fontSize': { type: 'Size Change', icon: '📏', color: '#4facfe' },
        'width': { type: 'Size Change', icon: '📏', color: '#4facfe' },
        'height': { type: 'Size Change', icon: '📏', color: '#4facfe' },
        'padding': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
        'margin': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
        'paddingTop': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
        'paddingRight': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
        'paddingBottom': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
        'paddingLeft': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
        'marginTop': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
        'marginRight': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
        'marginBottom': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
        'marginLeft': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
        'fontWeight': { type: 'Style Change', icon: '💎', color: '#fa709a' },
        'textAlign': { type: 'Style Change', icon: '💎', color: '#fa709a' },
        'opacity': { type: 'Style Change', icon: '💎', color: '#fa709a' },
        'borderRadius': { type: 'Style Change', icon: '💎', color: '#fa709a' },
      };
      
      return categories[property] || { type: 'Style Change', icon: '✨', color: '#a8edea' };
    }

    generatePlainEnglishSummary(changes, elementName) {
      if (changes.length === 1) {
        const change = changes[0];
        const property = change.property;
        
        if (property === 'textContent') {
          return `Change text to "${change.after.substring(0, 30)}${change.after.length > 30 ? '...' : ''}"`;
        } else if (property === 'color' || property === 'backgroundColor') {
          return `Change ${property === 'color' ? 'text' : 'background'} color to ${change.after}`;
        } else if (property === 'fontSize') {
          return `Change font size from ${change.before} to ${change.after}`;
        } else if (property === 'fontWeight') {
          const weights = {
            '100': 'Thin', '200': 'Extra Light', '300': 'Light',
            '400': 'Regular', '500': 'Medium', '600': 'Semi Bold',
            '700': 'Bold', '800': 'Extra Bold', '900': 'Black'
          };
          return `Change font weight to ${weights[change.after] || change.after}`;
        } else if (property.includes('padding') || property.includes('margin')) {
          const type = property.includes('padding') ? 'padding' : 'margin';
          return `Adjust ${type} to ${change.after}`;
        } else {
          return `Update ${property} to ${change.after}`;
        }
      } else {
        // Multiple changes - categorize them
        const types = [...new Set(changes.map(c => this.categorizeChange(c.property).type))];
        if (types.length === 1) {
          return `${changes.length} ${types[0].toLowerCase()} updates`;
        } else {
          return `${changes.length} property changes`;
        }
      }
    }

    renderPropertyTicket(edit, index) {
      // Determine the primary change type
      const changeTypes = edit.changes.map(c => this.categorizeChange(c.property));
      const primaryType = changeTypes[0]; // Use first change's category as primary
      
      // Check if all changes are the same type
      const allSameType = changeTypes.every(ct => ct.type === primaryType.type);
      const displayType = allSameType ? primaryType : { 
        type: 'Mixed Changes', 
        icon: '🔄', 
        color: '#a8edea' 
      };
      
      // Generate plain English summary
      const summary = this.generatePlainEnglishSummary(edit.changes, edit.elementName);
      
      return `
        <div class="tweaq-ticket-card" data-edit-index="${index}">
          <div class="tweaq-ticket-card-header">
            <div class="tweaq-ticket-type-badge" style="background: ${displayType.color}20; color: ${displayType.color}; border-color: ${displayType.color}40;">
              <span class="tweaq-ticket-badge-icon">${displayType.icon}</span>
              <span class="tweaq-ticket-badge-text">${displayType.type}</span>
            </div>
            <div class="tweaq-ticket-actions">
              <button class="tweaq-ticket-toggle" data-index="${index}" title="${edit.visible !== false ? 'Hide tweaq' : 'Show tweaq'}">
                ${edit.visible !== false ? `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ` : `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                `}
              </button>
              <button class="tweaq-ticket-delete" data-index="${index}" title="Delete">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="tweaq-ticket-card-body">
            <div class="tweaq-ticket-summary">${this.escapeHtml(summary)}</div>
            
            ${edit.metadata?.hasConflicts ? `
              <div class="tweaq-conflict-indicator">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="color: #ff9800;">
                  <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
                <span class="tweaq-conflict-text">
                  Resolved ${edit.metadata.conflictInfo.conflictingComments?.length || 2} conflicting comments
                </span>
                <button class="tweaq-conflict-review" data-index="${index}" title="Review conflict resolution">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                  </svg>
                </button>
              </div>
            ` : ''}
            
            <div class="tweaq-ticket-target">
              <span class="tweaq-target-label">Target:</span>
              <code class="tweaq-target-selector">${edit.elementSelector || edit.elementName}</code>
            </div>
            
            ${edit.changes.length > 0 ? `
              <div class="tweaq-ticket-details">
                <div class="tweaq-details-header">Property Changes:</div>
                <div class="tweaq-details-list">
                  ${edit.changes.map(change => {
                    return `
                      <div class="tweaq-detail-item">
                        <div class="tweaq-detail-property">
                          <span>${change.property === 'textContent' ? 'Text Content' : change.property}</span>
                        </div>
                        <div class="tweaq-detail-change">
                          <span class="tweaq-detail-before">${this.escapeHtml(String(change.before).substring(0, 40))}${String(change.before).length > 40 ? '...' : ''}</span>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="opacity: 0.5; margin: 0 4px;">
                            <path d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                          </svg>
                          <span class="tweaq-detail-after">${this.escapeHtml(String(change.after).substring(0, 40))}${String(change.after).length > 40 ? '...' : ''}</span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    renderStructuredTicket(edit, index) {
      // For conversation-based structured changes
      const actionIcons = {
        'content': '✏️',
        'styling': '🎨',
        'layout': '📐',
        'structure': '🏗️',
        'mixed': '🔄'
      };
      const actionColors = {
        'content': '#667eea',
        'styling': '#f093fb',
        'layout': '#4facfe',
        'structure': '#43e97b',
        'mixed': '#fa709a'
      };
      
      const icon = actionIcons[edit.actionType] || '💬';
      const color = actionColors[edit.actionType] || '#667eea';
      const typeLabel = edit.actionType ? edit.actionType.charAt(0).toUpperCase() + edit.actionType.slice(1) : 'Change';
      
      return `
        <div class="tweaq-ticket-card" data-edit-index="${index}">
          <div class="tweaq-ticket-card-header">
            <div class="tweaq-ticket-type-badge" style="background: ${color}20; color: ${color}; border-color: ${color}40;">
              <span class="tweaq-ticket-badge-icon">${icon}</span>
              <span class="tweaq-ticket-badge-text">${typeLabel}</span>
            </div>
            <div class="tweaq-ticket-actions">
              <button class="tweaq-ticket-toggle" data-index="${index}" title="${edit.visible !== false ? 'Hide tweaq' : 'Show tweaq'}">
                ${edit.visible !== false ? `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ` : `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                `}
              </button>
              <button class="tweaq-ticket-delete" data-index="${index}" title="Delete">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="tweaq-ticket-card-body">
            <div class="tweaq-ticket-summary">${this.escapeHtml(edit.instruction)}</div>
            ${edit.target ? `
              <div class="tweaq-ticket-target">
                <span class="tweaq-target-label">Target:</span>
                <code class="tweaq-target-selector">${edit.target.identifier}</code>
              </div>
            ` : ''}
            
            ${edit.specifics && edit.specifics.length > 0 ? `
              <div class="tweaq-ticket-details">
                <div class="tweaq-details-header">Details:</div>
                <div class="tweaq-details-list">
                  ${edit.specifics.map(specific => `
                    <div class="tweaq-detail-item">
                      <div class="tweaq-detail-specific">• ${this.escapeHtml(specific)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    renderProperties() {
      const elementName = this.getElementName();

      this.propertiesPanel.innerHTML = `
        ${this.renderPropertiesTab()}
      `;

      // Attach input event listeners for properties
      this.attachPropertyListeners();
    }

    renderPropertiesTab() {
      const element = this.selectedElement || document.body;
      const isPage = !this.selectedElement;
      
      const rect = element.getBoundingClientRect();
      const computedStyles = window.getComputedStyle(element);
      
      const hasPendingEdits = this.pendingEdits.size > 0;
      
      return `
        <div class="tweaq-tab-content-header">
          <div class="tweaq-panel-title-row">
            <div class="tweaq-panel-title">${isPage ? 'PAGE' : 'ELEMENT'}</div>
            ${this.mode === 'design' ? `
              <button 
                class="tweaq-select-mode-toggle ${this.isSelectModeActive ? 'active' : ''}" 
                id="tweaq-select-mode-toggle"
                title="${this.isSelectModeActive ? 'Exit select mode' : 'Enter select mode'}"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1 1l4.5 11L8 8l4-2.5L1 1z"/>
                </svg>
                <span>Select</span>
              </button>
            ` : ''}
          </div>
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
      
      // Check if this is a structured change from conversation
      const isStructuredChange = edit.type === 'structured-change';
      
      if (isStructuredChange) {
        // Get action type icon and color
        const actionIcons = {
          'content': '✏️',
          'styling': '🎨',
          'layout': '📐',
          'structure': '🏗️',
          'mixed': '🔄'
        };
        const actionColors = {
          'content': '#667eea',
          'styling': '#f093fb',
          'layout': '#4facfe',
          'structure': '#43e97b',
          'mixed': '#fa709a'
        };
        
        const actionIcon = actionIcons[edit.actionType] || '💬';
        const actionColor = actionColors[edit.actionType] || '#667eea';
        
        return `
          <div class="tweaq-edit-ticket ${status} structured-change" data-edit-index="${index}">
            <div class="tweaq-ticket-header">
              <div>
                <h4 class="tweaq-ticket-element" style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 18px;">${actionIcon}</span>
                  <span style="text-transform: capitalize;">${edit.target.identifier}</span>
                </h4>
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
            
            <div style="margin-top: 12px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: ${actionColor};">
                  ${edit.actionType}
                </span>
                <span style="font-size: 11px; color: rgba(255,255,255,0.5);">•</span>
                <span style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase;">
                  ${edit.target.type}
                </span>
              </div>
              
              <div style="padding: 12px; background: rgba(255, 255, 255, 0.05); border-left: 3px solid ${actionColor}; border-radius: 6px;">
                ${edit.specifics.map(specific => `
                  <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; last-child:margin-bottom: 0;">
                    <span style="color: ${actionColor}; font-size: 14px; line-height: 1.5;">→</span>
                    <span style="color: rgba(255,255,255,0.9); font-size: 13px; line-height: 1.5;">${this.escapeHtml(specific)}</span>
                  </div>
                `).join('')}
              </div>
              
              ${edit.confidence ? `
                <div style="margin-top: 8px; font-size: 11px; color: rgba(255,255,255,0.5);">
                  Confidence: ${(edit.confidence * 100).toFixed(0)}%
                </div>
              ` : ''}
            </div>
            
            ${this.renderTicketStatus(edit)}
          </div>
        `;
      }
      
      // Regular property change ticket
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
      
      // Get gap value (for flex/grid)
      const gap = parseInt(styles.gap) || 0;
      const isFlexOrGrid = display === 'flex' || display === 'grid';
      
      // Get padding and margin values
      const paddingTop = parseInt(styles.paddingTop) || 0;
      const paddingRight = parseInt(styles.paddingRight) || 0;
      const paddingBottom = parseInt(styles.paddingBottom) || 0;
      const paddingLeft = parseInt(styles.paddingLeft) || 0;
      
      const marginTop = parseInt(styles.marginTop) || 0;
      const marginRight = parseInt(styles.marginRight) || 0;
      const marginBottom = parseInt(styles.marginBottom) || 0;
      const marginLeft = parseInt(styles.marginLeft) || 0;
      
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
          
          ${isFlexOrGrid ? `
            <div class="tweaq-property">
              <label class="tweaq-property-label">Gap</label>
              <div class="tweaq-property-value">
                <div class="tweaq-number-group">
                  <input type="number" class="tweaq-input" value="${gap}" data-property="gap" data-unit="px" placeholder="0">
                  <span class="tweaq-unit">px</span>
                </div>
              </div>
            </div>
          ` : ''}
          
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
          
          <div class="tweaq-property">
            <label class="tweaq-property-label">Padding</label>
            <div class="tweaq-property-value">
              <div class="tweaq-spacing-control" data-spacing-type="padding">
                <button class="tweaq-spacing-link-toggle" data-link-state="linked" title="Unlink sides">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 1L6 11M1 6L11 6" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </button>
                <div class="tweaq-spacing-inputs" data-mode="linked">
                  <div class="tweaq-spacing-input-group">
                    <span class="tweaq-spacing-icon">⇅</span>
                    <input type="number" class="tweaq-input tweaq-spacing-value" value="${paddingTop}" data-sides="top,bottom" data-property="paddingTop,paddingBottom" placeholder="0">
                  </div>
                  <div class="tweaq-spacing-input-group">
                    <span class="tweaq-spacing-icon">⇄</span>
                    <input type="number" class="tweaq-input tweaq-spacing-value" value="${paddingLeft}" data-sides="left,right" data-property="paddingLeft,paddingRight" placeholder="0">
                  </div>
                </div>
                <div class="tweaq-spacing-inputs tweaq-spacing-inputs-individual" data-mode="individual" style="display: none;">
                  <div class="tweaq-spacing-input-group">
                    <span class="tweaq-spacing-icon">↑</span>
                    <input type="number" class="tweaq-input tweaq-spacing-value" value="${paddingTop}" data-property="paddingTop" placeholder="0">
                  </div>
                  <div class="tweaq-spacing-input-group">
                    <span class="tweaq-spacing-icon">→</span>
                    <input type="number" class="tweaq-input tweaq-spacing-value" value="${paddingRight}" data-property="paddingRight" placeholder="0">
                  </div>
                  <div class="tweaq-spacing-input-group">
                    <span class="tweaq-spacing-icon">↓</span>
                    <input type="number" class="tweaq-input tweaq-spacing-value" value="${paddingBottom}" data-property="paddingBottom" placeholder="0">
                  </div>
                  <div class="tweaq-spacing-input-group">
                    <span class="tweaq-spacing-icon">←</span>
                    <input type="number" class="tweaq-input tweaq-spacing-value" value="${paddingLeft}" data-property="paddingLeft" placeholder="0">
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="tweaq-property">
            <label class="tweaq-property-label">Margin</label>
            <div class="tweaq-property-value">
              <div class="tweaq-spacing-control" data-spacing-type="margin">
                <button class="tweaq-spacing-link-toggle" data-link-state="linked" title="Unlink sides">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 1L6 11M1 6L11 6" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </button>
                <div class="tweaq-spacing-inputs" data-mode="linked">
                  <div class="tweaq-spacing-input-group">
                    <span class="tweaq-spacing-icon">⇅</span>
                    <input type="number" class="tweaq-input tweaq-spacing-value" value="${marginTop}" data-sides="top,bottom" data-property="marginTop,marginBottom" placeholder="0">
                  </div>
                  <div class="tweaq-spacing-input-group">
                    <span class="tweaq-spacing-icon">⇄</span>
                    <input type="number" class="tweaq-input tweaq-spacing-value" value="${marginLeft}" data-sides="left,right" data-property="marginLeft,marginRight" placeholder="0">
                  </div>
                </div>
                <div class="tweaq-spacing-inputs tweaq-spacing-inputs-individual" data-mode="individual" style="display: none;">
                  <div class="tweaq-spacing-input-group">
                    <span class="tweaq-spacing-icon">↑</span>
                    <input type="number" class="tweaq-input tweaq-spacing-value" value="${marginTop}" data-property="marginTop" placeholder="0">
                  </div>
                  <div class="tweaq-spacing-input-group">
                    <span class="tweaq-spacing-icon">→</span>
                    <input type="number" class="tweaq-input tweaq-spacing-value" value="${marginRight}" data-property="marginRight" placeholder="0">
                  </div>
                  <div class="tweaq-spacing-input-group">
                    <span class="tweaq-spacing-icon">↓</span>
                    <input type="number" class="tweaq-input tweaq-spacing-value" value="${marginBottom}" data-property="marginBottom" placeholder="0">
                  </div>
                  <div class="tweaq-spacing-input-group">
                    <span class="tweaq-spacing-icon">←</span>
                    <input type="number" class="tweaq-input tweaq-spacing-value" value="${marginLeft}" data-property="marginLeft" placeholder="0">
                  </div>
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
      
      // Get the text content - handle elements that only have text (no child elements with text)
      const textContent = this.getEditableTextContent(element);
      const hasEditableText = textContent.trim().length > 0;
      
      return `
        <div class="tweaq-property-section">
          <h4 class="tweaq-section-header">Text</h4>
          
          ${hasEditableText ? `
            <div class="tweaq-property tweaq-property-content">
              <label class="tweaq-property-label">Content</label>
              <div class="tweaq-property-value">
                <textarea class="tweaq-textarea tweaq-content-input" data-property="textContent" rows="3">${this.escapeHtml(textContent)}</textarea>
              </div>
            </div>
          ` : ''}
          
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
          
          // If display property changed, re-render panel to show/hide gap field
          if (property === 'display') {
            this.renderPanel();
          }
        });
      });

      // Handle textarea for text content with real-time updates
      const textareas = this.propertiesPanel.querySelectorAll('.tweaq-textarea');
      textareas.forEach(textarea => {
        textarea.addEventListener('input', (e) => {
          const property = e.target.dataset.property;
          const value = e.target.value;
          
          if (property === 'textContent') {
            this.applyTextContent(value);
          }
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

      // Select mode toggle button
      const selectModeToggle = document.getElementById('tweaq-select-mode-toggle');
      if (selectModeToggle) {
        selectModeToggle.addEventListener('click', () => this.toggleSelectMode());
      }

      // Spacing link toggle buttons
      const spacingToggles = this.propertiesPanel.querySelectorAll('.tweaq-spacing-link-toggle');
      spacingToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
          const control = e.target.closest('.tweaq-spacing-control');
          this.toggleSpacingMode(control);
        });
      });

      // Spacing value inputs
      const spacingInputs = this.propertiesPanel.querySelectorAll('.tweaq-spacing-value');
      spacingInputs.forEach(input => {
        input.addEventListener('change', (e) => {
          const properties = e.target.dataset.property.split(',');
          const value = e.target.value + 'px';
          
          // Apply to all properties in the data-property attribute
          properties.forEach(prop => {
            this.applyProperty(prop, value);
          });
        });
      });
    }

    toggleSpacingMode(control) {
      const toggle = control.querySelector('.tweaq-spacing-link-toggle');
      const linkedInputs = control.querySelector('[data-mode="linked"]');
      const individualInputs = control.querySelector('[data-mode="individual"]');
      const currentState = toggle.getAttribute('data-link-state');
      
      if (currentState === 'linked') {
        // Switch to individual mode
        toggle.setAttribute('data-link-state', 'unlinked');
        toggle.title = 'Link sides';
        linkedInputs.style.display = 'none';
        individualInputs.style.display = 'grid';
        
        // Update icon to show broken link
        toggle.querySelector('svg').innerHTML = '<path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5"/>';
      } else {
        // Switch to linked mode
        toggle.setAttribute('data-link-state', 'linked');
        toggle.title = 'Unlink sides';
        linkedInputs.style.display = 'grid';
        individualInputs.style.display = 'none';
        
        // Update icon to show linked
        toggle.querySelector('svg').innerHTML = '<path d="M6 1L6 11M1 6L11 6" stroke="currentColor" stroke-width="1.5"/>';
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
        elementReference: element, // Store actual DOM element reference
        visible: true, // Track if tweaq is currently visible
        status: 'pending', // pending, processing, completed, failed
        prUrl: null,
        error: null
      };

      this.recordedEdits.push(edit);
      this.pendingEdits.clear();
      this.originalValues.clear();

      // Update badge count
      this.updateRightToolbarBadge();

      // Update edit indicators
      this.updateAllEditIndicators();
      
      console.log('📍 Added indicator for element:', edit.elementName, element);

      // Render properties to show the updates
      this.renderProperties();
    }

    deleteEdit(index) {
      const edit = this.recordedEdits[index];
      if (!edit) return;

      // Revert changes if the tweaq was visible
      if (edit.visible !== false) {
        const element = edit.elementReference || this.findElementFromEdit(edit);
        if (element && document.body.contains(element)) {
          this.revertEditFromElement(element, edit);
          console.log('🗑️ Reverted changes before deleting tweaq');
        }
      }

      // Clear highlight if it was being shown
      this.clearEditHighlight();

      // Remove from array
      this.recordedEdits.splice(index, 1);
      
      // Update UI
      this.updateRightToolbarBadge();
      this.updateAllEditIndicators();
      
      if (this.mode === 'tickets') {
        this.renderTicketsView();
      } else {
        this.renderProperties();
      }
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

      // Separate property edits and structured changes
      const propertyEdits = this.recordedEdits
        .filter(edit => edit.status === 'processing' && edit.type !== 'structured-change')
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

      const naturalLanguageEdits = this.recordedEdits
        .filter(edit => edit.status === 'processing' && edit.type === 'structured-change')
        .map(edit => ({
          id: edit.id,
          type: 'natural-language',
          instruction: edit.instruction,
          // Structured information from conversation
          target: {
            identifier: edit.target.identifier,
            type: edit.target.type
          },
          actionType: edit.actionType,
          specifics: edit.specifics,
          confidence: edit.confidence,
          timestamp: edit.timestamp
        }));

      console.log('📦 Sending to Agent V5:');
      console.log('  Property edits:', propertyEdits.length);
      console.log('  Structured change requests:', naturalLanguageEdits.length);
      if (naturalLanguageEdits.length > 0) {
        naturalLanguageEdits.forEach(edit => {
          console.log(`    → ${edit.target.identifier} (${edit.actionType}): ${edit.specifics.join(', ')}`);
        });
      }

      // Send to Electron main process to trigger combined edits with Agent V5
      if (window.electronAPI && window.electronAPI.processCombinedEdits) {
        try {
          const result = await window.electronAPI.processCombinedEdits({
            visualEdits: propertyEdits,
            naturalLanguageEdits: naturalLanguageEdits,
            metadata: {
              url: window.location.href,
              timestamp: Date.now()
            }
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
          console.error('Failed to trigger Agent V5:', error);
          
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
        console.error('electronAPI.processCombinedEdits not available');
        
        this.recordedEdits.forEach(edit => {
          if (edit.status === 'processing') {
            edit.status = 'failed';
            edit.error = 'Agent integration not available';
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
      
      // If padding was changed, update the padding overlay
      if (property.startsWith('padding')) {
        this.updatePaddingOverlay(element);
      }
      
      // If gap or display was changed, update measurement overlay
      if (property === 'gap' || property === 'display') {
        this.updateMeasurementOverlay(element);
      }
    }

    applyTextContent(value) {
      const element = this.selectedElement;
      if (!element) return;
      
      // Initialize storage if needed
      if (!this.originalValues) {
        this.originalValues = new Map();
      }
      
      // Store the original text content before making the change
      if (!this.originalValues.has('textContent')) {
        const originalText = this.getEditableTextContent(element);
        this.originalValues.set('textContent', originalText);
      }
      
      // Apply the change to the element
      // For simple text elements, update textContent directly
      // For elements with child nodes, try to update only text nodes
      const hasSimpleContent = Array.from(element.childNodes).every(
        node => node.nodeType === Node.TEXT_NODE || 
                (node.nodeType === Node.ELEMENT_NODE && 
                 ['BR', 'SPAN', 'STRONG', 'EM', 'B', 'I'].includes(node.tagName))
      );
      
      if (hasSimpleContent && element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
        // Simple text node - update directly
        element.childNodes[0].textContent = value;
      } else if (element.childNodes.length === 0 || hasSimpleContent) {
        // Empty or simple element - set textContent
        element.textContent = value;
      } else {
        // Complex element - try to update first text node
        for (const node of element.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = value;
            break;
          }
        }
      }
      
      // Track the edit with before/after values
      this.pendingEdits.set('textContent', {
        before: this.originalValues.get('textContent'),
        after: value
      });
      
      console.log(`Applied textContent: "${this.originalValues.get('textContent')}" → "${value}"`, 'Pending edits:', this.pendingEdits.size);
      
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
      // Hover outline disabled - no shimmer effect needed
      // Just track the hovered element for potential future use
      if (!this.isVisible) {
        return;
      }
      
      // Only track in design mode with select active, or in comment mode
      if (this.mode === 'design' && !this.isSelectModeActive) {
        return;
      }
      
      if (this.mode !== 'design' && this.mode !== 'comment') {
        return;
      }

      const target = e.target;
      
      // Don't track overlay elements
      if (target.closest('.tweaq-overlay-container') || 
          target.closest('.tweaq-properties-panel') ||
          target.closest('.tweaq-overlay-toolbar') ||
          target.closest('.tweaq-comment-pill') ||
          target.closest('.tweaq-comment-bubble') ||
          target.closest('.tweaq-comment-thread') ||
          target.closest('.tweaq-right-toolbar') ||
          target.closest('.tweaq-element-outline') ||
          target.closest('.tweaq-selected-indicator') ||
          target.closest('.tweaq-edit-indicator')) {
        return;
      }

      this.hoveredElement = target;
      // No visual feedback on hover - shimmer removed
    }

    handleClick(e) {
      if (!this.isVisible) return;
      
      // Don't handle clicks on overlay UI elements
      if (e.target.closest('.tweaq-overlay-container') || 
          e.target.closest('.tweaq-properties-panel') ||
          e.target.closest('.tweaq-overlay-toolbar') ||
          e.target.closest('.tweaq-comment-pill') ||
          e.target.closest('.tweaq-comment-bubble') ||
          e.target.closest('.tweaq-comment-thread') ||
          e.target.closest('.tweaq-right-toolbar') ||
          e.target.closest('.tweaq-edit-indicator')) {
        return;
      }
      
      // In design mode with select mode OFF, clear any existing selection
      if (this.mode === 'design' && !this.isSelectModeActive) {
        if (this.selectedElement) {
          this.selectedElement = null;
          this.hideSelectedIndicator();
          this.updateOutline(null);
          this.renderPanel();
        }
        return;
      }
      
      // Only allow selection in design mode with select ON, or comment mode
      if (this.mode !== 'design' && this.mode !== 'comment') return;
      if (this.mode === 'design' && !this.isSelectModeActive) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Clear comment textarea when selecting a new element
      if (this.commentPill) {
        const textarea = this.commentPill.querySelector('.tweaq-comment-textarea');
        const submitBtn = this.commentPill.querySelector('.tweaq-comment-submit');
        if (textarea) textarea.value = '';
        if (submitBtn) submitBtn.disabled = true;
      }
      
      this.selectedElement = e.target;
      
      // Hide hover outline and show selected indicator
      this.updateOutline(null);
      this.updateSelectedIndicator(this.selectedElement);
      
      // Hide select mode indicators since we've selected an element
      this.hideSelectModeIndicators();
      
      // Send element data to React UI
      this.sendElementDataToReact(this.selectedElement);
      
      this.renderPanel();
    }

    handleKeyDown(e) {
      if (e.key === 'Escape') {
        // In design mode, escape toggles select mode off
        if (this.mode === 'design' && this.isSelectModeActive) {
          this.isSelectModeActive = false;
          this.hideSelectModeIndicators();
          this.selectedElement = null;
          this.hideSelectedIndicator();
          this.updateOutline(null);
          this.renderPanel();
        }
        // Note: We never close the panel with Escape
      }
    }

    updateOutline(element) {
      if (!element) {
        this.outlineElement.style.display = 'none';
        return;
      }

      const rect = element.getBoundingClientRect();
      const offsets = this.getBodyOffsets();
      const scroll = this.getScrollPosition();
      const bodyBounds = this.getBodyBounds();
      
      // Calculate outline position relative to body (after offset adjustment)
      let outlineLeft = rect.left + scroll.x - offsets.left;
      let outlineTop = rect.top + scroll.y - offsets.top;
      let outlineWidth = rect.width;
      let outlineHeight = rect.height;
      
      // Clip to body boundaries
      if (outlineLeft < bodyBounds.left) {
        outlineWidth -= (bodyBounds.left - outlineLeft);
        outlineLeft = bodyBounds.left;
      }
      if (outlineTop < bodyBounds.top) {
        outlineHeight -= (bodyBounds.top - outlineTop);
        outlineTop = bodyBounds.top;
      }
      if (outlineLeft + outlineWidth > bodyBounds.right) {
        outlineWidth = bodyBounds.right - outlineLeft;
      }
      if (outlineTop + outlineHeight > bodyBounds.bottom) {
        outlineHeight = bodyBounds.bottom - outlineTop;
      }
      
      // Only show if within bounds
      if (outlineWidth > 0 && outlineHeight > 0) {
        this.outlineElement.style.display = 'block';
        this.outlineElement.style.left = `${outlineLeft}px`;
        this.outlineElement.style.top = `${outlineTop}px`;
        this.outlineElement.style.width = `${outlineWidth}px`;
        this.outlineElement.style.height = `${outlineHeight}px`;
      } else {
        this.outlineElement.style.display = 'none';
      }
    }

    updateSelectedIndicator(element) {
      if (!element) {
        this.hideSelectedIndicator();
        return;
      }

      const rect = element.getBoundingClientRect();
      const offsets = this.getBodyOffsets();
      const scroll = this.getScrollPosition();
      const bodyBounds = this.getBodyBounds();
      
      // Calculate indicator position
      let indicatorLeft = rect.left + scroll.x - offsets.left;
      let indicatorTop = rect.top + scroll.y - offsets.top;
      let indicatorWidth = rect.width;
      let indicatorHeight = rect.height;
      
      // Clip to body boundaries
      if (indicatorLeft < bodyBounds.left) {
        indicatorWidth -= (bodyBounds.left - indicatorLeft);
        indicatorLeft = bodyBounds.left;
      }
      if (indicatorTop < bodyBounds.top) {
        indicatorHeight -= (bodyBounds.top - indicatorTop);
        indicatorTop = bodyBounds.top;
      }
      if (indicatorLeft + indicatorWidth > bodyBounds.right) {
        indicatorWidth = bodyBounds.right - indicatorLeft;
      }
      if (indicatorTop + indicatorHeight > bodyBounds.bottom) {
        indicatorHeight = bodyBounds.bottom - indicatorTop;
      }
      
      // Update main indicator only if within bounds
      if (indicatorWidth > 0 && indicatorHeight > 0) {
        this.selectedIndicator.style.display = 'block';
        this.selectedIndicator.style.left = `${indicatorLeft}px`;
        this.selectedIndicator.style.top = `${indicatorTop}px`;
        this.selectedIndicator.style.width = `${indicatorWidth}px`;
        this.selectedIndicator.style.height = `${indicatorHeight}px`;
      } else {
        this.selectedIndicator.style.display = 'none';
      }

      // Update corner handles (top-right and bottom-left)
      if (this.selectedCornerHandles.length >= 2) {
        const handleX1 = rect.left + scroll.x - offsets.left + rect.width - 5;
        const handleY1 = rect.top + scroll.y - offsets.top - 5;
        const handleX2 = rect.left + scroll.x - offsets.left - 5;
        const handleY2 = rect.top + scroll.y - offsets.top + rect.height - 5;
        
        // Top-right handle - only show if within bounds
        if (handleX1 >= bodyBounds.left && handleX1 <= bodyBounds.right && 
            handleY1 >= bodyBounds.top && handleY1 <= bodyBounds.bottom) {
          this.selectedCornerHandles[0].style.display = 'block';
          this.selectedCornerHandles[0].style.left = `${handleX1}px`;
          this.selectedCornerHandles[0].style.top = `${handleY1}px`;
        } else {
          this.selectedCornerHandles[0].style.display = 'none';
        }
        
        // Bottom-left handle - only show if within bounds
        if (handleX2 >= bodyBounds.left && handleX2 <= bodyBounds.right && 
            handleY2 >= bodyBounds.top && handleY2 <= bodyBounds.bottom) {
          this.selectedCornerHandles[1].style.display = 'block';
          this.selectedCornerHandles[1].style.left = `${handleX2}px`;
          this.selectedCornerHandles[1].style.top = `${handleY2}px`;
        } else {
          this.selectedCornerHandles[1].style.display = 'none';
        }
      }

      // Show comment pill
      this.updateCommentPillPosition();
      
      // Update padding overlay
      this.updatePaddingOverlay(element);
      
      // Update measurement overlay
      this.updateMeasurementOverlay(element);
    }

    updateMeasurementOverlay(element) {
      if (!element || element === document.body) {
        this.hideMeasurementOverlay();
        return;
      }

      console.log('📏 Updating measurement overlay for:', element);

      if (!this.measurementOverlay) {
        console.error('❌ Measurement overlay element not found!');
        return;
      }

      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      
      console.log('📐 Element rect:', { width: rect.width, height: rect.height, top: rect.top, left: rect.left });
      
      // Calculate rem values (assuming 16px base)
      const remBase = 16;
      const toRem = (px) => (px / remBase).toFixed(2);
      
      const width = rect.width;
      const height = rect.height;
      const paddingTop = parseInt(styles.paddingTop) || 0;
      const paddingRight = parseInt(styles.paddingRight) || 0;
      const paddingBottom = parseInt(styles.paddingBottom) || 0;
      const paddingLeft = parseInt(styles.paddingLeft) || 0;
      const marginTop = parseInt(styles.marginTop) || 0;
      const marginRight = parseInt(styles.marginRight) || 0;
      const marginBottom = parseInt(styles.marginBottom) || 0;
      const marginLeft = parseInt(styles.marginLeft) || 0;
      const gap = parseInt(styles.gap) || 0;
      const isFlexOrGrid = styles.display === 'flex' || styles.display === 'grid';

      this.measurementOverlay.style.display = 'block';
      console.log('✅ Measurement overlay display set to block');
      
      let html = '';
      const scroll = this.getScrollPosition();
      const scrollX = scroll.x;
      const scrollY = scroll.y;
      
      // Width measurement (top) - position above element, or below if near top
      const hasSpaceAbove = rect.top > 30;
      const widthY = hasSpaceAbove ? rect.top + scrollY - 25 : rect.bottom + scrollY + 5;
      html += `
        <div class="tweaq-measurement-line tweaq-measurement-line-h" style="left: ${rect.left + scrollX}px; top: ${widthY + 10}px; width: ${width}px;"></div>
        <div class="tweaq-measurement-cap tweaq-measurement-cap-h" style="left: ${rect.left + scrollX}px; top: ${widthY + 6}px;"></div>
        <div class="tweaq-measurement-cap tweaq-measurement-cap-h" style="left: ${rect.left + scrollX + width}px; top: ${widthY + 6}px;"></div>
        <div class="tweaq-measurement" style="left: ${rect.left + scrollX + width / 2 - 40}px; top: ${widthY + 2}px;">
          <span>${Math.round(width)}px</span>
          <span class="tweaq-measurement-secondary">${toRem(width)}rem</span>
        </div>
      `;
      
      // Height measurement (right) - position to the right, or left if near right edge
      const hasSpaceRight = (window.innerWidth - rect.right) > 100;
      const heightX = hasSpaceRight ? rect.right + scrollX + 10 : rect.left + scrollX - 90;
      html += `
        <div class="tweaq-measurement-line tweaq-measurement-line-v" style="left: ${heightX}px; top: ${rect.top + scrollY}px; height: ${height}px;"></div>
        <div class="tweaq-measurement-cap tweaq-measurement-cap-v" style="left: ${heightX - 4}px; top: ${rect.top + scrollY}px;"></div>
        <div class="tweaq-measurement-cap tweaq-measurement-cap-v" style="left: ${heightX - 4}px; top: ${rect.top + scrollY + height}px;"></div>
        <div class="tweaq-measurement" style="left: ${hasSpaceRight ? heightX + 5 : heightX - 80}px; top: ${rect.top + scrollY + height / 2 - 10}px;">
          <span>${Math.round(height)}px</span>
          <span class="tweaq-measurement-secondary">${toRem(height)}rem</span>
        </div>
      `;
      
      // Gap measurement (if flex/grid and has children)
      if (isFlexOrGrid && gap > 0 && element.children.length > 1) {
        const gapY = rect.bottom + scrollY + 5;
        html += `
          <div class="tweaq-measurement" style="left: ${rect.left + scrollX + 10}px; top: ${gapY}px;">
            <span>Gap ${gap}px</span>
            <span class="tweaq-measurement-secondary">${toRem(gap)}rem</span>
          </div>
        `;
      }
      
      this.measurementOverlay.innerHTML = html;
      console.log('📏 Measurement overlay HTML length:', html.length);
      console.log('📏 Measurement overlay element:', this.measurementOverlay);
    }

    hideMeasurementOverlay() {
      if (this.measurementOverlay) {
        this.measurementOverlay.style.display = 'none';
      }
    }

    updatePaddingOverlay(element) {
      if (!element || element === document.body) {
        this.hidePaddingOverlay();
        return;
      }

      const rect = element.getBoundingClientRect();
      const offsets = this.getBodyOffsets();
      const scroll = this.getScrollPosition();
      const styles = window.getComputedStyle(element);
      
      const paddingTop = parseInt(styles.paddingTop) || 0;
      const paddingRight = parseInt(styles.paddingRight) || 0;
      const paddingBottom = parseInt(styles.paddingBottom) || 0;
      const paddingLeft = parseInt(styles.paddingLeft) || 0;
      
      // Only show if there's padding
      if (paddingTop === 0 && paddingRight === 0 && paddingBottom === 0 && paddingLeft === 0) {
        this.hidePaddingOverlay();
        return;
      }

      this.paddingOverlay.style.display = 'block';
      
      const topEl = this.paddingOverlay.querySelector('.tweaq-padding-top');
      const rightEl = this.paddingOverlay.querySelector('.tweaq-padding-right');
      const bottomEl = this.paddingOverlay.querySelector('.tweaq-padding-bottom');
      const leftEl = this.paddingOverlay.querySelector('.tweaq-padding-left');
      
      // Position and size each padding area
      if (paddingTop > 0) {
        topEl.style.display = 'flex';
        topEl.style.left = `${rect.left + scroll.x - offsets.left}px`;
        topEl.style.top = `${rect.top + scroll.y - offsets.top}px`;
        topEl.style.width = `${rect.width}px`;
        topEl.style.height = `${paddingTop}px`;
        topEl.textContent = `${paddingTop}`;
      } else {
        topEl.style.display = 'none';
      }
      
      if (paddingRight > 0) {
        rightEl.style.display = 'flex';
        rightEl.style.left = `${rect.left + scroll.x - offsets.left + rect.width - paddingRight}px`;
        rightEl.style.top = `${rect.top + scroll.y - offsets.top}px`;
        rightEl.style.width = `${paddingRight}px`;
        rightEl.style.height = `${rect.height}px`;
        rightEl.textContent = `${paddingRight}`;
      } else {
        rightEl.style.display = 'none';
      }
      
      if (paddingBottom > 0) {
        bottomEl.style.display = 'flex';
        bottomEl.style.left = `${rect.left + scroll.x - offsets.left}px`;
        bottomEl.style.top = `${rect.top + scroll.y - offsets.top + rect.height - paddingBottom}px`;
        bottomEl.style.width = `${rect.width}px`;
        bottomEl.style.height = `${paddingBottom}px`;
        bottomEl.textContent = `${paddingBottom}`;
      } else {
        bottomEl.style.display = 'none';
      }
      
      if (paddingLeft > 0) {
        leftEl.style.display = 'flex';
        leftEl.style.left = `${rect.left + scroll.x - offsets.left}px`;
        leftEl.style.top = `${rect.top + scroll.y - offsets.top}px`;
        leftEl.style.width = `${paddingLeft}px`;
        leftEl.style.height = `${rect.height}px`;
        leftEl.textContent = `${paddingLeft}`;
      } else {
        leftEl.style.display = 'none';
      }
    }

    hidePaddingOverlay() {
      if (this.paddingOverlay) {
        this.paddingOverlay.style.display = 'none';
      }
    }

    hideSelectedIndicator() {
      if (this.selectedIndicator) {
        this.selectedIndicator.style.display = 'none';
      }
      this.selectedCornerHandles.forEach(handle => {
        handle.style.display = 'none';
      });
      // Hide comment pill
      this.hideCommentPill();
      // Hide padding overlay
      this.hidePaddingOverlay();
      // Hide measurement overlay
      this.hideMeasurementOverlay();
    }

    addEditIndicator(element, editCount = 1, allVisible = true) {
      // Don't add indicator if one already exists
      if (this.editIndicators.has(element)) {
        this.updateEditIndicator(element, editCount, allVisible);
        return;
      }

      const indicator = document.createElement('div');
      indicator.className = `tweaq-edit-indicator${allVisible ? '' : ' tweaq-hidden'}`;
      indicator.innerHTML = `
        <span class="tweaq-edit-indicator-icon">⚡</span>
        <span class="tweaq-edit-indicator-text">${editCount}</span>
        <span class="tweaq-edit-indicator-toggle">${allVisible ? '👁️' : '👁️‍🗨️'}</span>
      `;

      // Add click handler to toggle visibility
      indicator.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleElementTweaqs(element);
      });

      document.body.appendChild(indicator);
      this.editIndicators.set(element, indicator);
      
      this.positionEditIndicator(element, indicator);
      
      console.log('⚡ Created indicator for', element.tagName, 'at count:', editCount);
    }

    updateEditIndicator(element, editCount, allVisible = true) {
      const indicator = this.editIndicators.get(element);
      if (!indicator) return;

      const textElement = indicator.querySelector('.tweaq-edit-indicator-text');
      if (textElement) {
        textElement.textContent = editCount;
      }

      const toggleElement = indicator.querySelector('.tweaq-edit-indicator-toggle');
      if (toggleElement) {
        toggleElement.textContent = allVisible ? '👁️' : '👁️‍🗨️';
      }

      // Update indicator state
      if (allVisible) {
        indicator.classList.remove('tweaq-hidden');
      } else {
        indicator.classList.add('tweaq-hidden');
      }
    }

    removeEditIndicator(element) {
      const indicator = this.editIndicators.get(element);
      if (indicator) {
        indicator.remove();
        this.editIndicators.delete(element);
      }
    }

    positionEditIndicator(element, indicator) {
      const rect = element.getBoundingClientRect();
      const offsets = this.getBodyOffsets();
      const scroll = this.getScrollPosition();
      
      // Position at top-right corner of element
      const left = rect.right + scroll.x - offsets.left - 8;
      const top = rect.top + scroll.y - offsets.top - 8;
      
      indicator.style.left = `${left}px`;
      indicator.style.top = `${top}px`;
      
      console.log('📍 Positioned indicator at', { left, top, rect, element: element.tagName });
    }

    updateIndicatorPositions() {
      // Update all indicator positions on scroll/resize
      this.editIndicators.forEach((indicator, element) => {
        this.positionEditIndicator(element, indicator);
      });
      
      // Update selected element and padding overlay positions
      if (this.selectedElement) {
        this.updateSelectedIndicator(this.selectedElement);
      }
      
      // Update hover outline if an element is being hovered and no element is selected
      if (this.hoveredElement && !this.selectedElement && this.isSelectModeActive) {
        this.updateOutline(this.hoveredElement);
      }
    }

    updateAllEditIndicators() {
      // Clear all existing indicators
      this.editIndicators.forEach(indicator => indicator.remove());
      this.editIndicators.clear();

      // Count edits per element and track visibility
      const editCounts = new Map();
      const elementVisibility = new Map();
      
      this.recordedEdits.forEach(edit => {
        // Use stored element reference if available
        let element = edit.elementReference;
        
        // Fallback to finding by selector if reference not available
        if (!element || !document.body.contains(element)) {
          if (edit.elementId) {
            element = document.getElementById(edit.elementId);
          } else if (edit.elementClasses && edit.elementClasses.length > 0) {
            const selector = `${edit.element}.${edit.elementClasses.join('.')}`;
            element = document.querySelector(selector);
          } else {
            // Fallback to element selector
            try {
              element = document.querySelector(edit.elementSelector);
            } catch (e) {
              console.warn('Could not find element for indicator:', edit.elementSelector);
            }
          }
        }

        if (element && document.body.contains(element)) {
          const count = (editCounts.get(element) || 0) + 1;
          editCounts.set(element, count);
          
          // Track if ALL edits for this element are visible
          const currentVisibility = elementVisibility.get(element);
          if (currentVisibility === undefined) {
            elementVisibility.set(element, edit.visible !== false);
          } else {
            elementVisibility.set(element, currentVisibility && edit.visible !== false);
          }
        }
      });

      // Add indicators for all edited elements
      editCounts.forEach((count, element) => {
        const allVisible = elementVisibility.get(element);
        this.addEditIndicator(element, count, allVisible);
      });
      
      console.log('📍 Updated indicators for', editCounts.size, 'elements');
    }

    toggleEditVisibility(editIndex) {
      const edit = this.recordedEdits[editIndex];
      if (!edit) return;

      // Find the element
      const element = edit.elementReference || this.findElementFromEdit(edit);
      if (!element || !document.body.contains(element)) {
        console.warn('Could not find element to toggle visibility:', edit);
        return;
      }

      // Toggle visibility
      const newVisibility = edit.visible === false;
      edit.visible = newVisibility;

      console.log(`👁️ Toggling tweaq visibility - new state: ${newVisibility ? 'visible' : 'hidden'}`);

      if (newVisibility) {
        // Re-apply the changes
        this.applyEditToElement(element, edit);
      } else {
        // Revert the changes
        this.revertEditFromElement(element, edit);
      }

      // Update the indicator and re-render tickets view
      this.updateAllEditIndicators();
      this.renderTicketsView();
    }

    toggleElementTweaqs(element) {
      // Find all edits for this element
      const elementEdits = this.recordedEdits.filter(edit => {
        const editElement = edit.elementReference || this.findElementFromEdit(edit);
        return editElement === element;
      });

      if (elementEdits.length === 0) return;

      // Determine new visibility state (if ANY are visible, hide all. If all hidden, show all)
      const anyVisible = elementEdits.some(edit => edit.visible !== false);
      const newVisibility = !anyVisible;

      console.log(`👁️ Toggling ${elementEdits.length} tweaqs for element - new state: ${newVisibility ? 'visible' : 'hidden'}`);

      // Toggle each edit's visibility
      elementEdits.forEach(edit => {
        edit.visible = newVisibility;

        if (newVisibility) {
          // Re-apply the changes
          this.applyEditToElement(element, edit);
        } else {
          // Revert the changes
          this.revertEditFromElement(element, edit);
        }
      });

      // Update the indicator
      this.updateAllEditIndicators();
    }

    findElementFromEdit(edit) {
      if (edit.elementId) {
        return document.getElementById(edit.elementId);
      } else if (edit.elementClasses && edit.elementClasses.length > 0) {
        const selector = `${edit.element}.${edit.elementClasses.join('.')}`;
        return document.querySelector(selector);
      } else if (edit.elementSelector) {
        try {
          return document.querySelector(edit.elementSelector);
        } catch (e) {
          return null;
        }
      }
      return null;
    }

    applyEditToElement(element, edit) {
      if (!edit.changes) {
        console.warn('⚠️ No changes in edit to apply');
        return;
      }

      console.log('🎨 Applying', edit.changes.length, 'changes to element:', element);

      edit.changes.forEach(change => {
        console.log('  → Applying change:', change.property, '=', change.after);
        
        if (change.property === 'textContent') {
          // Handle text content
          const hasSimpleContent = Array.from(element.childNodes).every(
            node => node.nodeType === Node.TEXT_NODE || 
                    (node.nodeType === Node.ELEMENT_NODE && 
                     ['BR', 'SPAN', 'STRONG', 'EM', 'B', 'I'].includes(node.tagName))
          );
          
          if (hasSimpleContent && element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
            element.childNodes[0].textContent = change.after;
          } else if (element.childNodes.length === 0 || hasSimpleContent) {
            element.textContent = change.after;
          } else {
            for (const node of element.childNodes) {
              if (node.nodeType === Node.TEXT_NODE) {
                node.textContent = change.after;
                break;
              }
            }
          }
          console.log('  ✅ Applied text content');
        } else {
          // Handle style properties
          const property = change.property;
          let value = change.after;
          
          // Add unit if needed
          if (typeof value === 'number' || !isNaN(value)) {
            const needsUnit = ['fontSize', 'width', 'height', 'padding', 'margin', 
                              'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                              'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
                              'borderRadius', 'top', 'left', 'right', 'bottom'].includes(property);
            if (needsUnit && !String(value).match(/px|em|rem|%|vh|vw/)) {
              value = value + 'px';
            }
          }
          
          console.log('  → Setting element.style[' + property + '] =', value);
          element.style[property] = value;
          console.log('  ✅ Applied style property, result:', element.style[property]);
        }
      });

      console.log('✅ Applied tweaq to element');
    }

    revertEditFromElement(element, edit) {
      if (!edit.changes) return;

      edit.changes.forEach(change => {
        if (change.property === 'textContent') {
          // Revert text content
          const hasSimpleContent = Array.from(element.childNodes).every(
            node => node.nodeType === Node.TEXT_NODE || 
                    (node.nodeType === Node.ELEMENT_NODE && 
                     ['BR', 'SPAN', 'STRONG', 'EM', 'B', 'I'].includes(node.tagName))
          );
          
          if (hasSimpleContent && element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
            element.childNodes[0].textContent = change.before;
          } else if (element.childNodes.length === 0 || hasSimpleContent) {
            element.textContent = change.before;
          } else {
            for (const node of element.childNodes) {
              if (node.nodeType === Node.TEXT_NODE) {
                node.textContent = change.before;
                break;
              }
            }
          }
        } else {
          // Revert style properties
          const property = change.property;
          let value = change.before;
          
          // Add unit if needed
          if (typeof value === 'number' || !isNaN(value)) {
            const needsUnit = ['fontSize', 'width', 'height', 'padding', 'margin',
                              'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                              'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
                              'borderRadius', 'top', 'left', 'right', 'bottom'].includes(property);
            if (needsUnit && !String(value).match(/px|em|rem|%|vh|vw/)) {
              value = value + 'px';
            }
          }
          
          element.style[property] = value;
        }
      });

      console.log('↩️ Reverted tweaq from element');
    }

    highlightEditElement(editIndex) {
      const edit = this.recordedEdits[editIndex];
      if (!edit) return;

      // Find the element
      const element = edit.elementReference || this.findElementFromEdit(edit);
      if (!element || !document.body.contains(element)) {
        console.warn('Could not find element to highlight for edit:', edit);
        return;
      }

      // Scroll element into view if not visible
      const rect = element.getBoundingClientRect();
      const isInView = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );

      if (!isInView) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
        
        // Wait for scroll to complete before highlighting
        setTimeout(() => {
          this.showHighlight(element);
        }, 300);
      } else {
        this.showHighlight(element);
      }

      console.log('🔦 Highlighting element for edit:', edit.elementName);
    }

    showHighlight(element) {
      if (!this.hoverHighlight || !element) return;

      const rect = element.getBoundingClientRect();
      const offsets = this.getBodyOffsets();
      const scroll = this.getScrollPosition();
      const bodyBounds = this.getBodyBounds();
      
      // Calculate highlight position
      let highlightLeft = rect.left + scroll.x - offsets.left;
      let highlightTop = rect.top + scroll.y - offsets.top;
      let highlightWidth = rect.width;
      let highlightHeight = rect.height;
      
      // Clip to body boundaries
      if (highlightLeft < bodyBounds.left) {
        highlightWidth -= (bodyBounds.left - highlightLeft);
        highlightLeft = bodyBounds.left;
      }
      if (highlightTop < bodyBounds.top) {
        highlightHeight -= (bodyBounds.top - highlightTop);
        highlightTop = bodyBounds.top;
      }
      if (highlightLeft + highlightWidth > bodyBounds.right) {
        highlightWidth = bodyBounds.right - highlightLeft;
      }
      if (highlightTop + highlightHeight > bodyBounds.bottom) {
        highlightHeight = bodyBounds.bottom - highlightTop;
      }
      
      // Only show if within bounds
      if (highlightWidth > 0 && highlightHeight > 0) {
        this.hoverHighlight.style.display = 'block';
        this.hoverHighlight.style.left = `${highlightLeft}px`;
        this.hoverHighlight.style.top = `${highlightTop}px`;
        this.hoverHighlight.style.width = `${highlightWidth}px`;
        this.hoverHighlight.style.height = `${highlightHeight}px`;
      } else {
        this.hoverHighlight.style.display = 'none';
      }
    }

    clearEditHighlight() {
      if (this.hoverHighlight) {
        this.hoverHighlight.style.display = 'none';
      }
    }

    attachEventListeners() {
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('click', this.handleClick, true);
      document.addEventListener('keydown', this.handleKeyDown);
      // Listen for scroll on body since it's the scroll container
      document.body.addEventListener('scroll', this.updateIndicatorPositions, true);
      window.addEventListener('scroll', this.updateIndicatorPositions, true);
      window.addEventListener('resize', this.updateIndicatorPositions);
    }

    removeEventListeners() {
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('click', this.handleClick, true);
      document.removeEventListener('keydown', this.handleKeyDown);
      document.body.removeEventListener('scroll', this.updateIndicatorPositions, true);
      window.removeEventListener('scroll', this.updateIndicatorPositions, true);
      window.removeEventListener('resize', this.updateIndicatorPositions);
    }

    hide() {
      if (!this.isVisible || this.isHiding) return;
      
      this.isHiding = true;
      this.removeEventListeners();
      this.hidePanel();
      this.hideSelectModeIndicators();
      this.hideSelectedIndicator();
      
      // Clean up edit indicators
      this.editIndicators.forEach(indicator => indicator.remove());
      this.editIndicators.clear();
      
      // Wait for slide-out animation to complete before cleanup
      setTimeout(() => {
        if (this.overlayContainer) this.overlayContainer.remove();
        if (this.outlineElement) this.outlineElement.remove();
        if (this.selectedIndicator) this.selectedIndicator.remove();
        if (this.hoverHighlight) this.hoverHighlight.remove();
        if (this.paddingOverlay) this.paddingOverlay.remove();
        if (this.measurementOverlay) this.measurementOverlay.remove();
        this.selectedCornerHandles.forEach(handle => handle.remove());
        if (this.commentPill) this.commentPill.remove();
        if (this.rightToolbar) this.rightToolbar.remove();
        if (this.resizeHandle) this.resizeHandle.remove();
        
        this.overlayContainer = null;
        this.outlineElement = null;
        this.selectedIndicator = null;
        this.hoverHighlight = null;
        this.paddingOverlay = null;
        this.measurementOverlay = null;
        this.resizeHandle = null;
        this.selectedCornerHandles = [];
        this.propertiesPanel = null;
        this.commentPill = null;
        this.rightToolbar = null;
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
