/**
 * Multiplayer Cursors Module
 * Handles real-time cursor tracking and rendering for collaborative sessions
 */

(function() {
  'use strict';

  // Cursor tracking state
  const participants = new Map(); // participantId -> { name, color, cursor }
  const cursorElements = new Map(); // participantId -> DOM element
  let isSessionActive = false;
  let lastCursorUpdate = 0;
  const CURSOR_UPDATE_THROTTLE = 50; // ms

  /**
   * Initialize multiplayer cursor system
   */
  function init() {
    console.log('🎯 Initializing multiplayer cursor system');
    
    // Inject cursor styles
    injectStyles();
    
    // Listen for mouse movements to send cursor position
    document.addEventListener('mousemove', handleMouseMove, true);
    
    // Listen for messages from main process
    if (window.electronAPI && window.electronAPI.onOverlayMessage) {
      window.electronAPI.onOverlayMessage('cursor-update', handleCursorUpdate);
      window.electronAPI.onOverlayMessage('cursor-remove', handleCursorRemove);
      window.electronAPI.onOverlayMessage('session-participants-update', handleParticipantsUpdate);
      window.electronAPI.onOverlayMessage('session-ended', handleSessionEnded);
    }
    
    console.log('✅ Multiplayer cursor system initialized');
  }

  /**
   * Inject CSS styles for cursors
   */
  function injectStyles() {
    if (document.getElementById('tweaq-multiplayer-cursor-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'tweaq-multiplayer-cursor-styles';
    style.textContent = `
      .tweaq-participant-cursor {
        position: absolute;
        pointer-events: none;
        z-index: 999999;
        transition: transform 0.1s ease-out;
        will-change: transform;
      }

      .tweaq-cursor-icon {
        width: 20px;
        height: 20px;
        position: relative;
      }

      .tweaq-cursor-icon svg {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
      }

      .tweaq-cursor-label {
        position: absolute;
        top: 22px;
        left: 2px;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        color: white;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      }

      .tweaq-participant-cursor.idle {
        opacity: 0.5;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle mouse move - send cursor position to session
   */
  function handleMouseMove(e) {
    if (!isSessionActive) return;

    const now = Date.now();
    if (now - lastCursorUpdate < CURSOR_UPDATE_THROTTLE) {
      return;
    }
    lastCursorUpdate = now;

    // Get element under cursor
    const target = document.elementFromPoint(e.clientX, e.clientY);
    let elementSelector;
    
    if (target && !target.closest('.tweaq-participant-cursor')) {
      elementSelector = generateSelector(target);
    }

    // Send cursor position to main process
    if (window.electronAPI && window.electronAPI.sendOverlayMessage) {
      window.electronAPI.sendOverlayMessage('overlay-cursor-move', {
        x: e.pageX,
        y: e.pageY,
        elementSelector
      });
    }
  }

  /**
   * Generate CSS selector for element
   */
  function generateSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        const classes = Array.from(current.classList)
          .filter(c => !c.startsWith('tweaq-'))
          .slice(0, 2)
          .join('.');
        if (classes) {
          selector += `.${classes}`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
      
      if (path.length >= 3) break;
    }
    
    return path.join(' > ');
  }

  /**
   * Handle cursor update from other participant
   */
  function handleCursorUpdate(data) {
    const { participantId, cursor } = data;
    
    // Don't show cursor if no position data
    if (!cursor || cursor.x === undefined || cursor.y === undefined) {
      return;
    }

    // Get participant info
    const participant = participants.get(participantId);
    if (!participant) {
      return;
    }

    // Update cursor position
    participant.cursor = cursor;
    participant.lastUpdate = Date.now();
    
    // Create or update cursor element
    updateCursorElement(participantId, participant);
  }

  /**
   * Handle cursor removal
   */
  function handleCursorRemove(data) {
    const { participantId } = data;
    removeCursorElement(participantId);
    participants.delete(participantId);
  }

  /**
   * Handle participants update
   */
  function handleParticipantsUpdate(participantsList) {
    console.log('👥 Participants updated:', participantsList);
    
    isSessionActive = participantsList.length > 0;
    
    // Update participants map
    const newParticipantIds = new Set();
    
    participantsList.forEach(p => {
      newParticipantIds.add(p.id);
      
      if (!participants.has(p.id)) {
        participants.set(p.id, {
          id: p.id,
          name: p.name,
          color: p.color,
          cursor: null,
          lastUpdate: Date.now()
        });
      } else {
        // Update existing participant info
        const existing = participants.get(p.id);
        existing.name = p.name;
        existing.color = p.color;
      }
    });
    
    // Remove participants that are no longer in the session
    for (const [participantId] of participants) {
      if (!newParticipantIds.has(participantId)) {
        removeCursorElement(participantId);
        participants.delete(participantId);
      }
    }
  }

  /**
   * Handle session ended
   */
  function handleSessionEnded() {
    console.log('🏁 Session ended - cleaning up cursors');
    isSessionActive = false;
    
    // Remove all cursors
    for (const [participantId] of participants) {
      removeCursorElement(participantId);
    }
    participants.clear();
  }

  /**
   * Create or update cursor element for participant
   */
  function updateCursorElement(participantId, participant) {
    let cursorEl = cursorElements.get(participantId);
    
    if (!cursorEl) {
      // Create new cursor element
      cursorEl = document.createElement('div');
      cursorEl.className = 'tweaq-participant-cursor';
      cursorEl.innerHTML = `
        <div class="tweaq-cursor-icon">
          <svg viewBox="0 0 24 24" fill="${participant.color}" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.5 3.21V20.8l6.48-5.3 2.57 7.23 1.66-.63-2.57-7.23 7.02-.63L5.5 3.21z"/>
          </svg>
        </div>
        <div class="tweaq-cursor-label" style="background-color: ${participant.color}">
          ${participant.name}
        </div>
      `;
      document.body.appendChild(cursorEl);
      cursorElements.set(participantId, cursorEl);
    }
    
    // Update cursor position
    const { x, y } = participant.cursor;
    cursorEl.style.transform = `translate(${x}px, ${y}px)`;
    
    // Remove idle class if cursor just moved
    cursorEl.classList.remove('idle');
    
    // Set idle after 2 seconds of no movement
    clearTimeout(cursorEl._idleTimeout);
    cursorEl._idleTimeout = setTimeout(() => {
      cursorEl.classList.add('idle');
    }, 2000);
  }

  /**
   * Remove cursor element for participant
   */
  function removeCursorElement(participantId) {
    const cursorEl = cursorElements.get(participantId);
    if (cursorEl) {
      cursorEl.remove();
      cursorElements.delete(participantId);
    }
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.__tweaqMultiplayerCursors = {
    participants,
    cursorElements,
    isSessionActive: () => isSessionActive
  };
})();


