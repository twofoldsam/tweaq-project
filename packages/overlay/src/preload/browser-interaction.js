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
        z-index: 999999;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        pointer-events: auto;
      }
      
      .tweaq-comment-bubble:hover {
        transform: scale(1.1);
      }
      
      /* Expanded comment bubble */
      .tweaq-comment-bubble.expanded {
        width: auto;
        min-width: 200px;
        max-width: 320px;
        height: auto;
        min-height: 60px;
        border-radius: 12px;
        padding: 12px;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        background: rgba(40, 40, 40, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }
      
      .tweaq-comment-bubble.expanded .comment-text {
        color: rgba(255, 255, 255, 0.9);
        font-size: 13px;
        line-height: 1.5;
        margin-top: 4px;
        word-wrap: break-word;
        white-space: normal;
      }
      
      .tweaq-comment-bubble.expanded .comment-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 8px;
      }
      
      .tweaq-comment-bubble.expanded .comment-count-badge {
        width: 20px;
        height: 20px;
        background: #FF3B30;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        flex-shrink: 0;
      }
      
      .tweaq-comment-bubble.expanded .comment-close {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.6);
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      .tweaq-comment-bubble.expanded .comment-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.9);
      }
      
      @keyframes highlight-pulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 0 rgba(10, 132, 255, 0);
        }
        50% {
          transform: scale(1.1);
          box-shadow: 0 0 20px rgba(10, 132, 255, 0.6);
        }
      }
      
      /* Tweaq indicator badges */
      .tweaq-edit-indicator {
        position: absolute;
        width: 28px;
        height: 28px;
        background: #0A84FF;
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        cursor: pointer;
        z-index: 999998;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
      }
      
      .tweaq-edit-indicator:hover {
        transform: scale(1.1);
        background: #0066CC;
      }
      
      .tweaq-edit-indicator.hidden {
        opacity: 0.4;
        background: #666;
      }
      
      /* Hide default cursor when in select mode */
      body.tweaq-select-mode * {
        cursor: crosshair !important;
      }
      
      /* Comment pill */
      .tweaq-comment-pill {
        position: fixed;
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
      
      .tweaq-comment-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .tweaq-comment-btn:disabled {
        cursor: not-allowed;
        opacity: 0.4;
      }
      
      .tweaq-comment-submit {
        color: rgba(255, 255, 255, 0.4);
      }
      
      .tweaq-comment-submit:not(:disabled) {
        color: #007acc;
      }
    `;
    document.head.appendChild(style);
  }

  class TweaqOverlay {
    constructor() {
      this.mode = 'none';
      this.isSelectModeActive = false;
      this.isCommentModeActive = false; // Toggle for comment mode (when true, can add comments; when false, allows navigation)
      this.selectedElement = null;
      this.hoveredElement = null;
      this.highlightBox = null;
      this.hoverBox = null;
      this.comments = [];
      this.commentCounter = 0;
      this.recordedEdits = [];
      this.resizeObserver = null;
      this.commentPill = null;
      
      this.init();
    }

    init() {
      injectStyles();
      this.createHighlightBoxes();
      this.createCommentPill();
      this.setupEventListeners();
      this.setupResizeObserver();
      console.log('✅ Tweaq DOM Overlay initialized');
    }

    setupResizeObserver() {
      // Create a ResizeObserver to watch for element size changes
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === this.selectedElement) {
            this.updateSelectionHighlight(this.selectedElement);
          }
        }
      });
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
          this.hideCommentPill();
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
          // Update comment pill position when scrolling
          if (this.mode === 'comment') {
            this.updateCommentPillPosition();
          }
        }
      }, true);
    }

    setMode(newMode) {
      this.mode = newMode;
      
      // Auto-enable select mode for design mode
      if (newMode === 'design') {
        this.isSelectModeActive = true;
        this.isCommentModeActive = false;
        document.body.classList.add('tweaq-select-mode');
      } else if (newMode === 'comment') {
        // In comment mode, start with comment mode active (can add comments)
        this.isCommentModeActive = true;
        this.isSelectModeActive = true; // Need select mode for highlighting
        document.body.classList.add('tweaq-select-mode');
      } else {
        this.isSelectModeActive = false;
        this.isCommentModeActive = false;
        document.body.classList.remove('tweaq-select-mode');
        this.clearHighlights();
        this.hideCommentPill();
      }
      
      // Show comment pill if in comment mode and element is selected
      if (newMode === 'comment' && this.selectedElement && this.isCommentModeActive) {
        this.updateCommentPillPosition();
      }
      
      console.log(`Mode changed to: ${newMode}, Select mode: ${this.isSelectModeActive}, Comment mode active: ${this.isCommentModeActive}`);
    }

    toggleCommentMode() {
      if (this.mode !== 'comment') return;
      
      this.isCommentModeActive = !this.isCommentModeActive;
      
      if (this.isCommentModeActive) {
        // Enable comment mode - allow selecting elements to comment
        this.isSelectModeActive = true;
        document.body.classList.add('tweaq-select-mode');
        // Show comment pill if element is already selected
        if (this.selectedElement) {
          this.updateCommentPillPosition();
        }
      } else {
        // Disable comment mode - allow normal navigation
        this.isSelectModeActive = false;
        document.body.classList.remove('tweaq-select-mode');
        this.clearHighlights();
        this.hideCommentPill();
        this.deselectElement();
      }
      
      console.log(`Comment mode ${this.isCommentModeActive ? 'enabled' : 'disabled'} (navigation mode)`);
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
      // Only show hover highlights when comment mode is active
      if (this.mode === 'comment' && !this.isCommentModeActive) return;
      if (!this.isSelectModeActive) return;
      if (e.target.closest('.tweaq-highlight-box')) return;
      if (e.target.closest('.tweaq-comment-pill')) return;
      
      const element = e.target;
      if (!element || element === document.body || element === document.documentElement) return;
      
      this.hoveredElement = element;
      this.updateHoverHighlight(element);
      
      // Send hover data to React
      this.sendElementHoverToReact(element);
    }

    handleClick(e) {
      // Check if clicking directly on a comment bubble FIRST - before any other checks
      const clickedBubble = e.target.closest('.tweaq-comment-bubble');
      if (clickedBubble) {
        console.log('💬 Comment bubble clicked, allowing bubble handler to process');
        // Don't prevent default or stop propagation - let the bubble's own click handler work
        // The bubble's handler uses capture phase and stopImmediatePropagation, so it should handle it
        return;
      }
      
      // In comment mode, only handle clicks when comment mode is active
      if (this.mode === 'comment' && !this.isCommentModeActive) {
        // Allow normal navigation - don't prevent default
        console.log('🔵 Comment mode inactive, allowing navigation');
        return;
      }
      
      if (!this.isSelectModeActive) {
        console.log('⚠️ Select mode not active, ignoring click');
        return;
      }
      if (e.target.closest('.tweaq-highlight-box')) return;
      if (e.target.closest('.tweaq-comment-pill')) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const element = e.target;
      if (!element || element === document.body || element === document.documentElement) return;
      
      console.log('🖱️ Element clicked in comment mode:', {
        mode: this.mode,
        isCommentModeActive: this.isCommentModeActive,
        isSelectModeActive: this.isSelectModeActive,
        tagName: element.tagName
      });
      
      // Stop observing previous element
      if (this.selectedElement && this.resizeObserver) {
        this.resizeObserver.unobserve(this.selectedElement);
      }
      
      // Clear comment textarea when selecting a new element
      if (this.commentPill) {
        const textarea = this.commentPill.querySelector('.tweaq-comment-textarea');
        const submitBtn = this.commentPill.querySelector('.tweaq-comment-submit');
        if (textarea) textarea.value = '';
        if (submitBtn) submitBtn.disabled = true;
      }
      
      this.selectedElement = element;
      this.updateSelectionHighlight(element);
      
      // Start observing new element for size changes
      if (this.resizeObserver) {
        this.resizeObserver.observe(element);
      }
      
      // Send element data to React
      this.sendElementDataToReact(element);
      
      // Handle comment mode - show comment pill
      if (this.mode === 'comment' && this.isCommentModeActive) {
        console.log('💬 Showing comment pill for selected element');
        this.updateCommentPillPosition();
      } else {
        console.log('⚠️ Not showing comment pill:', {
          mode: this.mode,
          isCommentModeActive: this.isCommentModeActive
        });
        this.hideCommentPill();
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
      // Stop observing when deselecting
      if (this.selectedElement && this.resizeObserver) {
        this.resizeObserver.unobserve(this.selectedElement);
      }
      
      this.selectedElement = null;
      if (this.highlightBox) this.highlightBox.style.display = 'none';
      this.hideCommentPill();
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
      // Helper to escape CSS selector special characters
      const escapeSelector = (str) => {
        // Escape special CSS characters: . # [ ] : ( ) / @ ! * + ~ ' " , > space
        return str.replace(/([\[\]\:\(\)\/\@\!\*\+\~\'\"\,\>\s])/g, '\\$1');
      };
      
      // If element has a unique ID, use it (escaped)
      if (element.id) {
        return `#${escapeSelector(element.id)}`;
      }
      
      // Try to use a simple, unique selector first
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.split(' ')
          .filter(c => c && !c.includes('tweaq'))
          .slice(0, 1); // Try with just the first class
        
        if (classes.length > 0) {
          const simpleSelector = `${element.tagName.toLowerCase()}.${escapeSelector(classes[0])}`;
          // Check if this selector is unique
          try {
            const matches = document.querySelectorAll(simpleSelector);
            if (matches.length === 1 && matches[0] === element) {
              return simpleSelector;
            }
          } catch (e) {
            // Invalid selector, continue to full path
          }
        }
      }
      
      // Generate a unique CSS selector path from root to element
      const path = [];
      let current = element;
      
      while (current && current !== document.body && current !== document.documentElement) {
        let selector = current.tagName.toLowerCase();
        
        // Add nth-child for uniqueness (more reliable than classes with special chars)
        if (current.parentElement) {
          const siblings = Array.from(current.parentElement.children);
          const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
          if (sameTagSiblings.length > 1) {
            const index = sameTagSiblings.indexOf(current);
            selector += `:nth-of-type(${index + 1})`;
          }
        }
        
        path.unshift(selector);
        current = current.parentElement;
        
        // Limit path depth to avoid extremely long selectors
        if (path.length >= 4) break;
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
          // Stop observing previous element
          if (this.selectedElement && this.resizeObserver) {
            this.resizeObserver.unobserve(this.selectedElement);
          }
          
          this.selectedElement = element;
          this.updateSelectionHighlight(element);
          
          // Start observing new element for size changes
          if (this.resizeObserver) {
            this.resizeObserver.observe(element);
          }
          
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
            // Convert kebab-case to camelCase for JavaScript style properties
            // e.g., 'background-color' -> 'backgroundColor'
            const camelCaseProperty = property.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
            element.style[camelCaseProperty] = value;
          }
          
          // Update selection highlight if this is the currently selected element
          if (this.selectedElement === element) {
            // Use requestAnimationFrame to ensure the DOM has updated
            requestAnimationFrame(() => {
              this.updateSelectionHighlight(element);
            });
          }
        });
        console.log(`✅ Applied ${property}: ${value} to ${selector}`);
      } catch (error) {
        console.error(`Failed to apply style [${property}: ${value}] to [${selector}]:`, error.message || error);
      }
    }

    // Record edit
    recordEdit(editData) {
      const edit = {
        ...editData,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        visible: true, // Track if changes are currently applied
        elementSelector: editData.element?.selector || editData.elementSelector,
      };
      this.recordedEdits.push(edit);
      
      // Render indicator on the page
      this.renderTweaqIndicator(edit, this.recordedEdits.length - 1);
      
      console.log('✅ Edit recorded:', edit);
    }

    // Delete edit by index
    deleteEdit(index) {
      if (index >= 0 && index < this.recordedEdits.length) {
        const edit = this.recordedEdits[index];
        console.log(`🗑️ Deleting edit ${index}:`, {
          selector: edit.elementSelector,
          changesCount: edit.changes?.length,
          visible: edit.visible
        });
        
        // Remove indicator from page
        if (edit.indicatorElement) {
          edit.indicatorElement.remove();
        }
        
        // Always revert changes when deleting (changes are applied when recorded)
        if (edit.elementSelector && edit.changes) {
          console.log(`🔄 Reverting ${edit.changes.length} changes...`);
          this.revertEditChanges(edit);
        }
        
        this.recordedEdits.splice(index, 1);
        
        // Update indicator numbers for remaining edits
        this.updateAllIndicatorNumbers();
        
        console.log(`✅ Deleted edit at index ${index}`);
      } else {
        console.warn(`⚠️ Cannot delete edit: invalid index ${index}`);
      }
    }

    // Highlight edit element by index
    highlightEditElement(index) {
      const edit = this.recordedEdits[index];
      if (edit && edit.elementSelector) {
        this.highlightElement(edit.elementSelector);
      }
    }

    // Get recorded edits (serialize for IPC - remove DOM references)
    getRecordedEdits() {
      console.log('🔍 getRecordedEdits called, returning:', this.recordedEdits.length, 'edits');
      
      // Return serializable version without DOM element references
      return this.recordedEdits.map(edit => {
        const { indicatorElement, element, ...serializableEdit } = edit;
        return serializableEdit;
      });
    }
    
    // Render tweaq indicator on page
    renderTweaqIndicator(edit, index) {
      try {
        const element = document.querySelector(edit.elementSelector);
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        const indicator = document.createElement('div');
        indicator.className = 'tweaq-edit-indicator';
        indicator.innerHTML = '⚡';
        indicator.style.left = `${rect.left + scrollLeft - 10}px`;
        indicator.style.top = `${rect.top + scrollTop - 10}px`;
        indicator.setAttribute('data-edit-index', index);
        indicator.title = 'Click to toggle changes';
        
        indicator.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleEditVisibility(index);
        });
        
        document.body.appendChild(indicator);
        edit.indicatorElement = indicator;
        
        console.log(`✅ Rendered tweaq indicator for edit ${index}`);
      } catch (error) {
        console.error('Failed to render tweaq indicator:', error);
      }
    }
    
    // Toggle edit visibility (show/hide changes)
    toggleEditVisibility(index) {
      const edit = this.recordedEdits[index];
      if (!edit) return;
      
      if (edit.visible) {
        this.revertEditChanges(edit);
        edit.visible = false;
        if (edit.indicatorElement) {
          edit.indicatorElement.classList.add('hidden');
        }
        console.log(`🔄 Hidden changes for edit ${index}`);
      } else {
        this.applyEditChanges(edit);
        edit.visible = true;
        if (edit.indicatorElement) {
          edit.indicatorElement.classList.remove('hidden');
        }
        console.log(`🔄 Showed changes for edit ${index}`);
      }
    }
    
    // Apply edit changes to element
    applyEditChanges(edit) {
      if (!edit.elementSelector || !edit.changes) return;
      
      try {
        const element = document.querySelector(edit.elementSelector);
        if (!element) return;
        
        edit.changes.forEach(change => {
          if (change.property === 'textContent') {
            element.textContent = change.after;
          } else {
            element.style[change.property] = change.after;
          }
        });
      } catch (error) {
        console.error('Failed to apply edit changes:', error);
      }
    }
    
    // Revert edit changes from element
    revertEditChanges(edit) {
      if (!edit.elementSelector || !edit.changes) {
        console.warn('⚠️ Cannot revert: missing selector or changes');
        return;
      }
      
      try {
        const element = document.querySelector(edit.elementSelector);
        if (!element) {
          console.warn(`⚠️ Cannot revert: element not found for selector "${edit.elementSelector}"`);
          return;
        }
        
        console.log(`🔄 Reverting changes for element:`, edit.elementSelector);
        edit.changes.forEach(change => {
          if (change.property === 'textContent') {
            console.log(`  ↩️ ${change.property}: "${change.after}" → "${change.before}"`);
            element.textContent = change.before;
          } else {
            console.log(`  ↩️ ${change.property}: ${change.after} → ${change.before}`);
            element.style[change.property] = change.before;
          }
        });
        console.log('✅ Revert complete');
      } catch (error) {
        console.error('❌ Failed to revert edit changes:', error);
      }
    }
    
    // Update indicator numbers after deletion
    updateAllIndicatorNumbers() {
      this.recordedEdits.forEach((edit, index) => {
        if (edit.indicatorElement) {
          edit.indicatorElement.setAttribute('data-edit-index', index);
        }
      });
    }
    
    // Remove all tweaq indicators
    removeAllIndicators() {
      this.recordedEdits.forEach(edit => {
        if (edit.indicatorElement) {
          edit.indicatorElement.remove();
        }
      });
    }

    // Comment functionality
    addComment(element) {
      // This method is called when element is clicked in comment mode
      // The comment pill is shown via updateCommentPillPosition()
      // Actual comment creation happens in submitComment()
    }

    updateCommentPillPosition() {
      if (!this.selectedElement || !this.commentPill) {
        console.log('⚠️ Cannot update comment pill position:', {
          hasSelectedElement: !!this.selectedElement,
          hasCommentPill: !!this.commentPill,
          mode: this.mode,
          isCommentModeActive: this.isCommentModeActive
        });
        return;
      }

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
      if (this.mode === 'comment' && this.isCommentModeActive) {
        console.log('✅ Showing comment pill:', {
          mode: this.mode,
          isCommentModeActive: this.isCommentModeActive,
          position: { left: pillLeft, top: pillTop },
          elementRect: rect
        });
        this.commentPill.style.display = 'block';
        // Auto-focus the textarea when shown
        const textarea = this.commentPill.querySelector('.tweaq-comment-textarea');
        if (textarea) {
          setTimeout(() => textarea.focus(), 10);
        }
      } else {
        console.log('⚠️ Not showing comment pill:', {
          mode: this.mode,
          isCommentModeActive: this.isCommentModeActive
        });
        this.commentPill.style.display = 'none';
      }
    }

    hideCommentPill() {
      if (this.commentPill) {
        this.commentPill.style.display = 'none';
      }
    }

    submitComment(commentText) {
      if (!this.selectedElement || !commentText.trim()) return;

      const rect = this.selectedElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      // Create a comment object with the actual text and URL
      const comment = {
        id: `comment_${Date.now()}`,
        element: this.selectedElement,
        selector: this.getElementSelector(this.selectedElement),
        elementName: this.selectedElement.tagName.toLowerCase(),
        textContent: this.selectedElement.textContent?.substring(0, 100) || '',
        url: window.location.href, // Store the URL where the comment was added
        position: {
          x: rect.left + scrollLeft,
          y: rect.top + scrollTop,
        },
        text: commentText.trim(), // Store the actual comment text
      };
      
      this.comments.push(comment);
      this.renderCommentBubble(comment);
      
      console.log('💬 Added comment:', comment);
      
      // Hide the comment pill
      this.hideCommentPill();
      
      // Deselect element
      this.deselectElement();
      
      // Notify React (if needed)
      if (window.electronAPI && typeof window.electronAPI.sendOverlayMessage === 'function') {
        // Create serializable version without DOM element references
        const serializableComment = {
          id: comment.id,
          selector: comment.selector,
          elementName: comment.elementName,
          textContent: comment.textContent,
          text: comment.text,
          url: comment.url, // Include URL
          position: comment.position
        };
        window.electronAPI.sendOverlayMessage('overlay-comment-added', serializableComment);
      }
    }

    renderCommentBubble(comment) {
      const bubble = document.createElement('div');
      bubble.className = 'tweaq-comment-bubble';
      // Show comment count (for now just 1, but could be updated to show total comments on element)
      bubble.textContent = '1';
      bubble.style.left = `${comment.position.x}px`;
      bubble.style.top = `${comment.position.y}px`;
      bubble.setAttribute('data-comment-id', comment.id);
      
      // Make bubble clickable and prevent event bubbling
      bubble.addEventListener('click', (e) => {
        // Don't toggle if clicking the close button
        if (e.target.closest('.comment-close')) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('💬 Comment bubble clicked:', comment.id);
        
        // Create a serializable version of the comment (without DOM element references)
        const serializableComment = {
          id: comment.id,
          selector: comment.selector,
          elementName: comment.elementName,
          textContent: comment.textContent,
          text: comment.text,
          position: comment.position
        };
        
        // Toggle comment expansion directly on the page
        this.toggleCommentExpansion(comment);
        
        // Notify React to open comment detail (with serializable data)
        if (window.electronAPI && typeof window.electronAPI.sendOverlayMessage === 'function') {
          window.electronAPI.sendOverlayMessage('overlay-comment-clicked', serializableComment);
        }
      }, true); // Use capture phase to handle before other listeners
      
      // Also prevent mousedown to avoid triggering selection
      bubble.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }, true);
      
      document.body.appendChild(bubble);
      comment.bubbleElement = bubble;
    }

    toggleCommentExpansion(comment) {
      if (!comment.bubbleElement) return;
      
      const bubble = comment.bubbleElement;
      const isExpanded = bubble.classList.contains('expanded');
      
      if (isExpanded) {
        // Collapse - restore original size and position
        bubble.classList.remove('expanded');
        bubble.innerHTML = '1';
        // Restore original position
        if (comment.position) {
          bubble.style.left = `${comment.position.x}px`;
          bubble.style.top = `${comment.position.y}px`;
        }
        console.log('📦 Comment bubble collapsed');
      } else {
        // Store original position if not already stored
        if (!comment.originalPosition) {
          comment.originalPosition = {
            x: bubble.style.left ? parseInt(bubble.style.left) : comment.position.x,
            y: bubble.style.top ? parseInt(bubble.style.top) : comment.position.y
          };
        }
        
        // Expand - show comment text
        bubble.classList.add('expanded');
        bubble.innerHTML = `
          <div class="comment-header">
            <div class="comment-count-badge">1</div>
            <div class="comment-close" title="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </div>
          <div class="comment-text">${this.escapeHtml(comment.text)}</div>
        `;
        
        // Add close button handler
        const closeBtn = bubble.querySelector('.comment-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.toggleCommentExpansion(comment);
          }, true);
        }
        
        // Update position to ensure it's visible after expansion
        setTimeout(() => {
          const rect = bubble.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const padding = 10;
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
          
          let newLeft = comment.originalPosition.x;
          let newTop = comment.originalPosition.y;
          
          // Adjust horizontal position if needed
          if (rect.right > viewportWidth - padding) {
            newLeft = Math.max(padding, viewportWidth - 320 - padding) - scrollLeft;
          }
          if (rect.left < padding) {
            newLeft = padding - scrollLeft;
          }
          
          // Adjust vertical position if needed
          if (rect.bottom > viewportHeight - padding) {
            newTop = Math.max(padding, viewportHeight - rect.height - padding) - scrollTop;
          }
          if (rect.top < padding) {
            newTop = padding - scrollTop;
          }
          
          bubble.style.left = `${newLeft}px`;
          bubble.style.top = `${newTop}px`;
        }, 0);
        
        console.log('📖 Comment bubble expanded');
      }
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

    loadComments(commentsData) {
      // Remove existing comments first
      this.removeAllComments();
      
      // Filter comments to only show ones for the current URL
      const currentUrl = window.location.href;
      const commentsForThisPage = commentsData.filter(commentData => commentData.url === currentUrl);
      
      console.log(`📄 Loading comments for URL: ${currentUrl}`);
      console.log(`   Total comments in session: ${commentsData.length}`);
      console.log(`   Comments for this page: ${commentsForThisPage.length}`);
      
      // Load comments from session data that match this page
      commentsForThisPage.forEach(commentData => {
        const comment = {
          id: commentData.id,
          selector: commentData.elementSelector,
          elementName: commentData.elementName,
          textContent: commentData.textContent || '',
          text: commentData.text,
          url: commentData.url,
          position: commentData.position,
          authorName: commentData.authorName
        };
        
        this.comments.push(comment);
        this.renderCommentBubble(comment);
      });
      
      console.log(`✅ Loaded ${commentsForThisPage.length} comments for current page`);
    }

    scrollToComment(commentId) {
      console.log('📍 Scrolling to comment:', commentId);
      
      // Find the comment
      const comment = this.comments.find(c => c.id === commentId);
      if (!comment) {
        console.error('❌ Comment not found:', commentId);
        return false;
      }
      
      if (!comment.bubbleElement) {
        console.error('❌ Comment bubble element not found');
        return false;
      }
      
      console.log('✅ Found comment, scrolling...');
      
      // Get the bubble's position
      const rect = comment.bubbleElement.getBoundingClientRect();
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      
      // Calculate the absolute position
      const absoluteY = rect.top + scrollY;
      const absoluteX = rect.left + scrollX;
      
      // Scroll to the comment with some offset for better visibility
      window.scrollTo({
        top: absoluteY - window.innerHeight / 2,
        left: absoluteX - 100,
        behavior: 'smooth'
      });
      
      // Wait a bit then expand the comment
      setTimeout(() => {
        if (!comment.bubbleElement.classList.contains('expanded')) {
          this.toggleCommentExpansion(comment);
        }
        
        // Add a highlight effect
        comment.bubbleElement.style.animation = 'highlight-pulse 1s ease-in-out';
        setTimeout(() => {
          if (comment.bubbleElement) {
            comment.bubbleElement.style.animation = '';
          }
        }, 1000);
      }, 500);
      
      return true;
    }

    // Apply tweaq from chat conversation
    applyTweaqFromChat(tweaqData) {
      console.log('⚡ Applying tweaq from chat:', tweaqData);
      
      const { instruction, target, action, confidence } = tweaqData;
      
      try {
        // Find target elements using the identifier
        let selector = target.identifier;
        let elements = document.querySelectorAll(selector);
        
        // If no elements found, try as a text search
        if (elements.length === 0) {
          console.log(`⚠️ No elements found for selector "${selector}", trying text search...`);
          
          // Search for elements containing the identifier text
          elements = Array.from(document.querySelectorAll('*')).filter(el => {
            const text = el.textContent?.trim().toLowerCase() || '';
            const searchText = target.identifier.toLowerCase();
            return text.includes(searchText) && el.children.length === 0; // leaf nodes only
          });
        }
        
        if (elements.length === 0) {
          console.warn(`⚠️ No elements found for tweaq: ${target.identifier}`);
          return;
        }
        
        console.log(`✅ Found ${elements.length} elements to apply tweaq`);
        
        // Apply each action specific
        action.specifics.forEach(specific => {
          const lowerSpecific = specific.toLowerCase();
          
          elements.forEach(element => {
            // Parse the specific and apply changes
            if (lowerSpecific.includes('vibrant') || lowerSpecific.includes('colorful')) {
              // Make colors more vibrant
              const currentBg = window.getComputedStyle(element).backgroundColor;
              if (currentBg && currentBg !== 'rgba(0, 0, 0, 0)' && currentBg !== 'transparent') {
                element.style.filter = 'saturate(1.5) brightness(1.1)';
              }
              element.style.backgroundColor = '#6366f1'; // Vibrant blue
              element.style.color = 'white';
            } else if (lowerSpecific.includes('friendly') || lowerSpecific.includes('casual')) {
              // Make text more friendly
              element.style.fontWeight = '500';
              if (element.textContent) {
                // Add friendly punctuation if missing
                if (!element.textContent.match(/[!?.]$/)) {
                  element.textContent = element.textContent + '!';
                }
              }
            } else if (lowerSpecific.includes('condense') || lowerSpecific.includes('compact')) {
              // Make more condensed
              element.style.padding = '8px 12px';
              element.style.margin = '4px 0';
              element.style.lineHeight = '1.4';
            } else if (lowerSpecific.includes('larger') || lowerSpecific.includes('bigger')) {
              // Make larger
              const currentSize = parseFloat(window.getComputedStyle(element).fontSize);
              element.style.fontSize = `${currentSize * 1.2}px`;
            } else if (lowerSpecific.includes('smaller')) {
              // Make smaller
              const currentSize = parseFloat(window.getComputedStyle(element).fontSize);
              element.style.fontSize = `${currentSize * 0.85}px`;
            } else if (lowerSpecific.includes('bold')) {
              element.style.fontWeight = 'bold';
            } else if (lowerSpecific.match(/color|colour/)) {
              // Extract color from specific
              const colorMatch = specific.match(/(red|blue|green|purple|orange|yellow|pink|gray|black|white)/i);
              if (colorMatch) {
                const colorMap = {
                  'red': '#ef4444',
                  'blue': '#3b82f6',
                  'green': '#22c55e',
                  'purple': '#a855f7',
                  'orange': '#f97316',
                  'yellow': '#eab308',
                  'pink': '#ec4899',
                  'gray': '#6b7280',
                  'black': '#000000',
                  'white': '#ffffff'
                };
                const colorValue = colorMap[colorMatch[1].toLowerCase()];
                if (colorValue) {
                  if (lowerSpecific.includes('background')) {
                    element.style.backgroundColor = colorValue;
                  } else {
                    element.style.color = colorValue;
                  }
                }
              }
            }
            
            // Record the edit
            const editData = {
              elementSelector: this.getElementSelector(element),
              changes: [{
                property: 'style',
                before: 'original',
                after: specific,
                description: instruction
              }],
              timestamp: Date.now(),
              source: 'chat',
              visible: true
            };
            
            this.recordEdit(editData);
          });
        });
        
        console.log(`✅ Applied tweaq to ${elements.length} elements`);
        
      } catch (error) {
        console.error('❌ Error applying tweaq from chat:', error);
      }
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
      console.log('TweaqOverlay.inject called with options:', options);
      
      if (this._instance) {
        console.log('⚠️ Instance already exists, updating mode if provided');
        // If instance exists but mode is provided, update it
        if (options.initialMode) {
          this._instance.setMode(options.initialMode);
        }
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
        this._instance.removeAllIndicators();
        this._instance = null;
      }
      
      document.querySelectorAll('.tweaq-highlight-box, .tweaq-comment-bubble, .tweaq-edit-indicator').forEach(el => el.remove());
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
    },
    
    applyStyleChange: function(selector, property, value) {
      if (this._instance) {
        this._instance.applyStyleChange(selector, property, value);
      } else {
        console.warn('⚠️ TweaqOverlay not initialized');
      }
    },
    
    restoreIndicators: function() {
      if (this._instance && this._instance.recordedEdits) {
        this._instance.recordedEdits.forEach((edit, index) => {
          // Remove old indicator if it exists
          if (edit.indicatorElement) {
            edit.indicatorElement.remove();
          }
          // Re-render indicator
          this._instance.renderTweaqIndicator(edit, index);
        });
        console.log('✅ Restored tweaq indicators');
      }
    },
    
    getRecordedEdits: function() {
      if (this._instance) {
        console.log('📦 Getting recorded edits via global method');
        return this._instance.getRecordedEdits();
      }
      console.log('❌ No instance available for getRecordedEdits');
      return [];
    },
    
    toggleCommentMode: function() {
      if (this._instance) {
        this._instance.toggleCommentMode();
        return { success: true, isCommentModeActive: this._instance.isCommentModeActive };
      }
      console.warn('⚠️ TweaqOverlay not initialized');
      return { success: false, error: 'Not initialized' };
    },
    
    getCommentModeState: function() {
      if (this._instance) {
        return { 
          success: true, 
          isCommentModeActive: this._instance.isCommentModeActive,
          mode: this._instance.mode
        };
      }
      return { success: false, error: 'Not initialized' };
    },
    
    applyTweaqFromChat: function(tweaqData) {
      if (this._instance) {
        this._instance.applyTweaqFromChat(tweaqData);
        return { success: true };
      }
      console.warn('⚠️ TweaqOverlay not initialized');
      return { success: false, error: 'Not initialized' };
    }
  };

  console.log('✅ Tweaq DOM Overlay loaded and ready');
})();
