// Tweaq Browser Interaction Script
// 
// This script is injected into web pages to enable DOM interaction:
// - Element selection and highlighting (blue hover, red selection borders)
// - Extracting element data (tag, classes, computed styles, unique selectors)
// - Applying style changes from the design panel
// - Communicating with Electron app via window.electronAPI
//
// The actual UI (LeftPanel, design panel, etc.) lives in the Electron app,
// not overlayed on the page. This script just handles browser-side interactions.

(function() {
  'use strict';

  // Check if already initialized - EARLY EXIT
  if (window.TweaqOverlay && window.TweaqOverlay._initialized) {
    console.log('⚠️ TweaqOverlay already loaded, skipping initialization');
    return;
  }

  // Cleanup old overlay elements
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

  // Inject minimal styles for highlighting only
  function injectStyles() {
    if (document.getElementById('tweaq-overlay-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'tweaq-overlay-styles';
    style.textContent = `
      /* Tweaq Overlay - Minimal Styles for DOM Interaction */
      
      /* Element highlighting */
      .tweaq-highlight-box {
        position: absolute;
        pointer-events: none;
        z-index: 999997;
        border: 2px solid #0A84FF;
        background: rgba(10, 132, 255, 0.1);
        transition: all 0.1s ease-out;
      }
      
      .tweaq-highlight-box.hover {
        border-color: #0A84FF;
        background: rgba(10, 132, 255, 0.15);
      }
      
      .tweaq-highlight-box.selected {
        border-color: #FF3B30;
        border-width: 2px;
        background: rgba(255, 59, 48, 0.1);
      }
      
      /* Comment bubbles */
      .tweaq-comment-bubble {
        position: absolute;
        width: 24px;
        height: 24px;
        background: #FF3B30;
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        cursor: pointer;
        z-index: 999998;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s ease;
      }
      
      .tweaq-comment-bubble:hover {
        transform: scale(1.1);
      }
      
      /* Hide default cursor when in select mode */
      body.tweaq-select-mode * {
        cursor: crosshair !important;
      }
    `;
    document.head.appendChild(style);
  }

  class TweaqOverlay {
    constructor() {
      this.mode = 'none';
      this.isSelectModeActive = false;
      this.selectedElement = null;
      this.hoveredElement = null;
      this.highlightBox = null;
      this.hoverBox = null;
      this.comments = [];
      this.commentCounter = 0;
      this.recordedEdits = [];
      
      this.init();
    }

    init() {
      injectStyles();
      this.createHighlightBoxes();
      this.setupEventListeners();
      console.log('✅ Tweaq DOM Overlay initialized');
    }

    createHighlightBoxes() {
      // Hover highlight
      this.hoverBox = document.createElement('div');
      this.hoverBox.className = 'tweaq-highlight-box hover';
      this.hoverBox.style.display = 'none';
      document.body.appendChild(this.hoverBox);

      // Selection highlight
      this.highlightBox = document.createElement('div');
      this.highlightBox.className = 'tweaq-highlight-box selected';
      this.highlightBox.style.display = 'none';
      document.body.appendChild(this.highlightBox);
    }

    setupEventListeners() {
      // Mouse move for hover detection
      document.addEventListener('mousemove', this.handleMouseMove.bind(this), true);
      
      // Click for element selection
      document.addEventListener('click', this.handleClick.bind(this), true);
      
      // Escape to deselect
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.selectedElement) {
          this.deselectElement();
        }
      });
      
      // Scroll to update highlight positions
      document.addEventListener('scroll', () => {
        if (this.hoveredElement) {
          this.updateHoverHighlight(this.hoveredElement);
        }
        if (this.selectedElement) {
          this.updateSelectionHighlight(this.selectedElement);
        }
      }, true);
    }

    setMode(newMode) {
      this.mode = newMode;
      
      // Auto-enable select mode for design and comment modes
      if (newMode === 'design' || newMode === 'comment') {
        this.isSelectModeActive = true;
        document.body.classList.add('tweaq-select-mode');
      } else {
        this.isSelectModeActive = false;
        document.body.classList.remove('tweaq-select-mode');
        this.clearHighlights();
      }
      
      console.log(`Mode changed to: ${newMode}, Select mode: ${this.isSelectModeActive}`);
    }

    toggleSelectMode() {
      this.isSelectModeActive = !this.isSelectModeActive;
      
      if (this.isSelectModeActive) {
        document.body.classList.add('tweaq-select-mode');
      } else {
        document.body.classList.remove('tweaq-select-mode');
        this.clearHighlights();
      }
      
      console.log(`Select mode: ${this.isSelectModeActive}`);
    }

    handleMouseMove(e) {
      if (!this.isSelectModeActive) return;
      if (e.target.closest('.tweaq-highlight-box')) return;
      
      const element = e.target;
      if (!element || element === document.body || element === document.documentElement) return;
      
      this.hoveredElement = element;
      this.updateHoverHighlight(element);
      
      // Send hover data to React
      this.sendElementHoverToReact(element);
    }

    handleClick(e) {
      if (!this.isSelectModeActive) return;
      if (e.target.closest('.tweaq-highlight-box')) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const element = e.target;
      if (!element || element === document.body || element === document.documentElement) return;
      
      this.selectedElement = element;
      this.updateSelectionHighlight(element);
      
      // Send element data to React
      this.sendElementDataToReact(element);
      
      // Handle comment mode
      if (this.mode === 'comment') {
        this.addComment(element);
      }
    }

    updateHoverHighlight(element) {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      this.hoverBox.style.display = 'block';
      this.hoverBox.style.left = `${rect.left + scrollLeft}px`;
      this.hoverBox.style.top = `${rect.top + scrollTop}px`;
      this.hoverBox.style.width = `${rect.width}px`;
      this.hoverBox.style.height = `${rect.height}px`;
    }

    updateSelectionHighlight(element) {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      this.highlightBox.style.display = 'block';
      this.highlightBox.style.left = `${rect.left + scrollLeft}px`;
      this.highlightBox.style.top = `${rect.top + scrollTop}px`;
      this.highlightBox.style.width = `${rect.width}px`;
      this.highlightBox.style.height = `${rect.height}px`;
    }

    clearHighlights() {
      if (this.hoverBox) this.hoverBox.style.display = 'none';
      if (this.highlightBox) this.highlightBox.style.display = 'none';
      this.hoveredElement = null;
    }

    deselectElement() {
      this.selectedElement = null;
      if (this.highlightBox) this.highlightBox.style.display = 'none';
    }

    sendElementDataToReact(element) {
      if (!element || !window.electronAPI) return;
      
      try {
        const computedStyle = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
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
            marginTop: computedStyle.marginTop,
            marginRight: computedStyle.marginRight,
            marginBottom: computedStyle.marginBottom,
            marginLeft: computedStyle.marginLeft,
            padding: computedStyle.padding,
            paddingTop: computedStyle.paddingTop,
            paddingRight: computedStyle.paddingRight,
            paddingBottom: computedStyle.paddingBottom,
            paddingLeft: computedStyle.paddingLeft,
            gap: computedStyle.gap,
            // Typography
            fontSize: computedStyle.fontSize,
            fontFamily: computedStyle.fontFamily,
            fontWeight: computedStyle.fontWeight,
            lineHeight: computedStyle.lineHeight,
            textAlign: computedStyle.textAlign,
            color: computedStyle.color,
            // Background
            backgroundColor: computedStyle.backgroundColor,
            // Border
            border: computedStyle.border,
            borderRadius: computedStyle.borderRadius,
            // Effects
            opacity: computedStyle.opacity,
            boxShadow: computedStyle.boxShadow,
          },
          rect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
          },
          selector: this.getElementSelector(element)
        };
        
        if (window.electronAPI && typeof window.electronAPI.sendOverlayMessage === 'function') {
          window.electronAPI.sendOverlayMessage('overlay-element-selected', elementData);
        }
        
        console.log('📤 Sent element data to React:', elementData);
      } catch (error) {
        console.error('Failed to send element data:', error);
      }
    }

    sendElementHoverToReact(element) {
      if (!element || !window.electronAPI) return;
      
      try {
        const rect = element.getBoundingClientRect();
        const hoverData = {
          tagName: element.tagName.toLowerCase(),
          id: element.id || '',
          className: element.className || '',
          rect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
          }
        };
        
        if (window.electronAPI && typeof window.electronAPI.sendOverlayMessage === 'function') {
          window.electronAPI.sendOverlayMessage('overlay-element-hovered', hoverData);
        }
      } catch (error) {
        // Silent fail for hover - happens frequently
      }
    }

    getElementSelector(element) {
      // If element has a unique ID, use it
      if (element.id) {
        return `#${element.id}`;
      }
      
      // Generate a unique CSS selector path from root to element
      const path = [];
      let current = element;
      
      while (current && current !== document.body && current !== document.documentElement) {
        let selector = current.tagName.toLowerCase();
        
        // Add classes if available (excluding tweaq classes)
        if (current.className && typeof current.className === 'string') {
          const classes = current.className.split(' ')
            .filter(c => c && !c.includes('tweaq'))
            .slice(0, 2); // Use first 2 classes for specificity
          if (classes.length > 0) {
            selector += '.' + classes.join('.');
          }
        }
        
        // Add nth-child to ensure uniqueness
        if (current.parentElement) {
          const siblings = Array.from(current.parentElement.children);
          const index = siblings.indexOf(current);
          if (siblings.length > 1) {
            selector += `:nth-child(${index + 1})`;
          }
        }
        
        path.unshift(selector);
        current = current.parentElement;
        
        // Limit path depth to avoid extremely long selectors
        if (path.length >= 5) break;
      }
      
      return path.join(' > ');
    }

    // Highlight element by selector (for hover from React)
    highlightElement(selector) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          this.selectedElement = element;
          this.updateSelectionHighlight(element);
        }
      } catch (error) {
        console.error('Failed to highlight element:', error);
      }
    }

    // Programmatically select an element by selector and send data to React
    selectElementBySelector(selector) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          this.selectedElement = element;
          this.updateSelectionHighlight(element);
          this.sendElementDataToReact(element);
          console.log(`✅ Programmatically selected element: ${selector}`);
        } else {
          console.warn(`⚠️ Element not found: ${selector}`);
        }
      } catch (error) {
        console.error('Failed to select element:', error);
      }
    }

    // Clear highlight
    clearEditHighlight() {
      this.deselectElement();
    }

    // Apply style change to element
    applyStyleChange(selector, property, value) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (property === 'textContent') {
            element.textContent = value;
          } else {
            element.style[property] = value;
          }
        });
        console.log(`✅ Applied ${property}: ${value} to ${selector}`);
      } catch (error) {
        console.error('Failed to apply style:', error);
      }
    }

    // Record edit
    recordEdit(editData) {
      this.recordedEdits.push({
        ...editData,
        id: Date.now(),
        timestamp: new Date().toISOString(),
      });
      console.log('✅ Edit recorded:', editData);
    }

    // Delete edit by index
    deleteEdit(index) {
      if (index >= 0 && index < this.recordedEdits.length) {
        this.recordedEdits.splice(index, 1);
        console.log(`✅ Deleted edit at index ${index}`);
      }
    }

    // Highlight edit element by index
    highlightEditElement(index) {
      const edit = this.recordedEdits[index];
      if (edit && edit.elementSelector) {
        this.highlightElement(edit.elementSelector);
      }
    }

    // Get recorded edits
    getRecordedEdits() {
      return this.recordedEdits;
    }

    // Comment functionality
    addComment(element) {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      const comment = {
        id: ++this.commentCounter,
        element: element,
        selector: this.getElementSelector(element),
        elementName: element.tagName.toLowerCase(),
        textContent: element.textContent?.substring(0, 100) || '',
        position: {
          x: rect.left + scrollLeft,
          y: rect.top + scrollTop,
        },
        text: '', // Will be filled by React
      };
      
      this.comments.push(comment);
      this.renderCommentBubble(comment);
      
      // Notify React
      if (window.electronAPI && typeof window.electronAPI.sendOverlayMessage === 'function') {
        window.electronAPI.sendOverlayMessage('overlay-comment-added', comment);
      }
    }

    renderCommentBubble(comment) {
      const bubble = document.createElement('div');
      bubble.className = 'tweaq-comment-bubble';
      bubble.textContent = comment.id;
      bubble.style.left = `${comment.position.x}px`;
      bubble.style.top = `${comment.position.y}px`;
      bubble.setAttribute('data-comment-id', comment.id);
      
      bubble.addEventListener('click', (e) => {
        e.stopPropagation();
        // Notify React to open comment detail
        if (window.electronAPI && typeof window.electronAPI.sendOverlayMessage === 'function') {
          window.electronAPI.sendOverlayMessage('overlay-comment-clicked', comment);
        }
      });
      
      document.body.appendChild(bubble);
      comment.bubbleElement = bubble;
    }

    collectCommentsData() {
      return this.comments.map(c => ({
        id: c.id,
        text: c.text,
        selector: c.selector,
        elementName: c.elementName,
        textContent: c.textContent,
      }));
    }

    removeAllComments() {
      this.comments.forEach(comment => {
        if (comment.bubbleElement) {
          comment.bubbleElement.remove();
        }
      });
      this.comments = [];
      this.commentCounter = 0;
      console.log('✅ All comments removed');
    }

    // Escape HTML for safety
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Create global instance
  window.TweaqOverlay = {
    _initialized: true,
    _instance: null,
    
    inject: function(options = {}) {
      console.log('TweaqOverlay.inject called');
      
      if (this._instance) {
        console.log('⚠️ Instance already exists, reusing it');
        return;
      }
      
      this._instance = new TweaqOverlay();
      
      if (options.initialMode) {
        this._instance.setMode(options.initialMode);
      }
      
      console.log('✅ Tweaq Overlay injected');
    },
    
    remove: function() {
      if (this._instance) {
        this._instance.clearHighlights();
        this._instance = null;
      }
      
      document.querySelectorAll('.tweaq-highlight-box, .tweaq-comment-bubble').forEach(el => el.remove());
      document.getElementById('tweaq-overlay-styles')?.remove();
      document.body.classList.remove('tweaq-select-mode');
      
      console.log('✅ Tweaq Overlay removed');
    },
    
    selectElement: function(selector) {
      if (this._instance) {
        this._instance.selectElementBySelector(selector);
      } else {
        console.warn('⚠️ TweaqOverlay not initialized');
      }
    }
  };

  console.log('✅ Tweaq DOM Overlay loaded and ready');
})();
