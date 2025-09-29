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

      /* Record Edit Button */
      .tweaq-record-edit-btn {
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        margin: 0;
        padding: 16px 24px;
        background: linear-gradient(to top, rgba(28, 28, 30, 1) 70%, rgba(28, 28, 30, 0));
        border: none;
        display: flex;
        justify-content: center;
      }

      .tweaq-record-edit-btn button {
        width: 100%;
        padding: 12px 20px;
        background: linear-gradient(135deg, #007AFF, #0051D5);
        color: #ffffff;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .tweaq-record-edit-btn button:hover {
        background: linear-gradient(135deg, #0051D5, #003D99);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .tweaq-record-edit-btn button:active {
        transform: translateY(0);
        box-shadow: 0 1px 4px rgba(0, 122, 255, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .tweaq-record-edit-btn button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
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
      }

      .tweaq-edit-ticket:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
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
        padding: 6px 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        border-left: 2px solid #007AFF;
      }

      .tweaq-ticket-change-property {
        color: #64D2FF;
        font-weight: 600;
      }

      .tweaq-ticket-change-value {
        color: #FFD60A;
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
      this.currentTab = 'properties'; // 'properties' or 'edits'
      
      this.overlayContainer = null;
      this.outlineElement = null;
      this.propertiesPanel = null;
      
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
      
      // Show panel immediately with page properties
      this.showPanel();
      this.renderProperties();
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
      
      toolbar.innerHTML = `
        <span class="tweaq-selection-name">${elementName}</span>
        <button class="tweaq-close-btn" title="Close inspector">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
          </svg>
        </button>
      `;

      toolbar.addEventListener('click', (e) => {
        if (e.target.closest('.tweaq-close-btn')) {
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
          <div class="tweaq-element-name">${this.getElementName()}</div>
        </div>
        
        <div class="tweaq-panel-content">
          ${this.renderDesignSection(element, rect, computedStyles)}
          ${this.renderLayoutSection(element, rect, computedStyles)}
          ${this.renderTextSection(element, computedStyles)}
          ${this.renderEffectsSection(element, computedStyles)}
        </div>
        
        ${hasPendingEdits ? `
          <div class="tweaq-record-edit-btn">
            <button id="tweaq-record-edit">
              📝 Record Edit
            </button>
          </div>
        ` : ''}
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

      return `
        <div class="tweaq-panel-content">
          <div class="tweaq-edits-list">
            ${this.recordedEdits.map((edit, index) => this.renderEditTicket(edit, index)).join('')}
          </div>
        </div>
        
        <div class="tweaq-confirm-edits-section">
          <div class="tweaq-confirm-edits-info">
            <p><strong>${this.recordedEdits.length}</strong> edit${this.recordedEdits.length === 1 ? '' : 's'} ready to be converted into a PR using Agent V4.</p>
          </div>
          <button class="tweaq-confirm-edits-btn" id="tweaq-confirm-edits">
            ✅ Confirm & Create PR
          </button>
        </div>
      `;
    }

    renderEditTicket(edit, index) {
      const timestamp = new Date(edit.timestamp).toLocaleString();
      
      return `
        <div class="tweaq-edit-ticket" data-edit-index="${index}">
          <div class="tweaq-ticket-header">
            <div>
              <h4 class="tweaq-ticket-element">${edit.elementName}</h4>
              <p class="tweaq-ticket-timestamp">${timestamp}</p>
            </div>
            <button class="tweaq-ticket-delete" data-delete-index="${index}" title="Delete edit">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z"/>
              </svg>
            </button>
          </div>
          <div class="tweaq-ticket-changes">
            ${edit.changes.map(change => `
              <div class="tweaq-ticket-change">
                <span class="tweaq-ticket-change-property">${change.property}</span>: 
                <span class="tweaq-ticket-change-value">${change.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
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

      // Record edit button
      const recordBtn = document.getElementById('tweaq-record-edit');
      if (recordBtn) {
        recordBtn.addEventListener('click', () => this.recordCurrentEdits());
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

      this.pendingEdits.forEach((value, property) => {
        changes.push({
          property,
          value
        });
      });

      const edit = {
        elementName: this.getElementName(),
        elementSelector: this.generateElementSelector(element),
        timestamp: Date.now(),
        changes,
        element: element.tagName.toLowerCase(),
        elementId: element.id || null,
        elementClasses: Array.from(element.classList)
      };

      this.recordedEdits.push(edit);
      this.pendingEdits.clear();

      // Switch to edits tab to show the newly recorded edit
      this.currentTab = 'edits';
      this.renderProperties();
    }

    deleteEdit(index) {
      this.recordedEdits.splice(index, 1);
      this.renderProperties();
    }

    async confirmEdits() {
      if (this.recordedEdits.length === 0) return;

      // Prepare edits for Agent V4
      const editsForAgent = this.recordedEdits.map(edit => ({
        selector: edit.elementSelector,
        element: edit.element,
        elementId: edit.elementId,
        elementClasses: edit.elementClasses,
        changes: edit.changes.reduce((acc, change) => {
          acc[change.property] = change.value;
          return acc;
        }, {})
      }));

      // Send to Electron main process to trigger Agent V4
      if (window.electronAPI && window.electronAPI.triggerAgentV4) {
        try {
          await window.electronAPI.triggerAgentV4({
            edits: editsForAgent,
            url: window.location.href
          });
          
          // Clear recorded edits after successful submission
          this.recordedEdits = [];
          this.renderProperties();
        } catch (error) {
          console.error('Failed to trigger Agent V4:', error);
          alert('Failed to create PR. Check console for details.');
        }
      } else {
        console.error('electronAPI.triggerAgentV4 not available');
        alert('Agent V4 integration not available');
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
      if (!this.selectedElement) {
        // If no element selected, apply to body
        document.body.style[property] = value;
      } else {
        this.selectedElement.style[property] = value;
      }
      
      // Track the edit
      this.pendingEdits.set(property, {
        element: this.selectedElement || document.body,
        property,
        value,
        timestamp: Date.now()
      });
      
      console.log(`Applied ${property}: ${value}`);
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
      if (!this.isVisible) return;
      
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
      if (!this.isVisible) return;
      
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
      this.renderProperties();
      this.renderToolbar();
    }

    handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (this.selectedElement) {
          // First escape: deselect element
          this.selectedElement = null;
          this.updateOutline(null);
          this.renderProperties();
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
