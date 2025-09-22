import React from 'react';
import { ToolbarProps, OverlayMode } from '../types';

const Toolbar: React.FC<ToolbarProps> = ({ mode, onModeToggle, onClose }) => {
  const handleModeToggle = () => {
    const newMode: OverlayMode = mode === 'measure' ? 'edit' : 'measure';
    onModeToggle(newMode);
  };

  return (
    <div className="tweaq-overlay-toolbar">
      <div className="tweaq-toolbar-content">
        <div className="tweaq-mode-toggle">
          <button
            className={`tweaq-mode-btn ${mode === 'measure' ? 'active' : ''}`}
            onClick={handleModeToggle}
            title="Switch to Measure mode"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2h12v1H2V2zm0 11h12v1H2v-1zM2 2v12h1V2H2zm11 0v12h1V2h-1zM5 5h6v1H5V5zm0 2h6v1H5V7zm0 2h4v1H5V9z"/>
            </svg>
            Measure
          </button>
          <button
            className={`tweaq-mode-btn ${mode === 'edit' ? 'active' : ''}`}
            onClick={handleModeToggle}
            title="Switch to Edit mode"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.854 2.854a.5.5 0 0 0-.708-.708L10.5 3.793 12.207 5.5l1.647-1.646zm-.708.708L3.5 11.207v1.293h1.293l8.646-8.646L11.793 2.207z"/>
            </svg>
            Edit
          </button>
        </div>
        
        <div className="tweaq-current-mode">
          <span className="tweaq-mode-indicator">
            {mode === 'measure' ? '📏' : '✏️'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </span>
        </div>

        <button 
          className="tweaq-close-btn"
          onClick={onClose}
          title="Close overlay"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
