import React, { useState, useCallback } from 'react';
import type { PreviewControlsProps, ConfidenceLevel } from '../types';

const PreviewControls: React.FC<PreviewControlsProps> = ({
  previewState,
  onPreviewSourceChange,
  onViewModeChange,
  onSplitPositionChange,
  confidence = 'medium',
}) => {
  const [, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (previewState.viewMode !== 'split') return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect();
      if (!rect) return;
      
      const percentage = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 0), 100);
      onSplitPositionChange(percentage);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [previewState.viewMode, onSplitPositionChange]);

  const getConfidenceColor = (level: ConfidenceLevel): string => {
    switch (level) {
      case 'high': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConfidenceLabel = (level: ConfidenceLevel): string => {
    switch (level) {
      case 'high': return 'High';
      case 'medium': return 'Med';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };

  return (
    <div className="tweaq-preview-controls">
      {/* Preview Source Toggle */}
      <div className="tweaq-preview-source-group">
        <span className="tweaq-preview-label">Preview Source:</span>
        <div className="tweaq-preview-toggle">
          <button
            className={`tweaq-preview-toggle-btn ${previewState.source === 'inline' ? 'active' : ''}`}
            onClick={() => onPreviewSourceChange('inline')}
            title="Instant preview by directly modifying element styles"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            Inline
          </button>
          <button
            className={`tweaq-preview-toggle-btn ${previewState.source === 'adapter' ? 'active' : ''}`}
            onClick={() => onPreviewSourceChange('adapter')}
            title="Preview using generated CSS rules (Tailwind first)"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3z"/>
              <path d="M4 5h8v1H4V5zm0 2h8v1H4V7zm0 2h6v1H4V9z" fill="white"/>
            </svg>
            Adapter CSS
          </button>
        </div>
      </div>

      {/* View Mode Controls */}
      <div className="tweaq-view-mode-group">
        <span className="tweaq-preview-label">View Mode:</span>
        <div className="tweaq-view-mode-toggle">
          <button
            className={`tweaq-view-mode-btn ${previewState.viewMode === 'before' ? 'active' : ''}`}
            onClick={() => onViewModeChange('before')}
            title="Show original state"
          >
            Before
          </button>
          <button
            className={`tweaq-view-mode-btn ${previewState.viewMode === 'after' ? 'active' : ''}`}
            onClick={() => onViewModeChange('after')}
            title="Show modified state"
          >
            After
          </button>
          <button
            className={`tweaq-view-mode-btn ${previewState.viewMode === 'split' ? 'active' : ''}`}
            onClick={() => onViewModeChange('split')}
            title="Show side-by-side comparison"
          >
            Split
          </button>
        </div>
      </div>

      {/* Split View Scrubber */}
      {previewState.viewMode === 'split' && (
        <div className="tweaq-split-scrubber-container">
          <span className="tweaq-preview-label">Split Position:</span>
          <div 
            className="tweaq-split-scrubber"
            onMouseDown={handleMouseDown}
          >
            <div className="tweaq-split-track">
              <div 
                className="tweaq-split-handle"
                style={{ left: `${previewState.splitPosition}%` }}
              />
            </div>
            <div className="tweaq-split-labels">
              <span className="tweaq-split-label-left">Before</span>
              <span className="tweaq-split-label-right">After</span>
            </div>
          </div>
        </div>
      )}

      {/* Confidence Chip (only for Adapter CSS) */}
      {previewState.source === 'adapter' && (
        <div className="tweaq-confidence-group">
          <span className="tweaq-preview-label">Mapping Confidence:</span>
          <div 
            className="tweaq-confidence-chip"
            style={{ 
              backgroundColor: getConfidenceColor(confidence),
              color: 'white'
            }}
            title={`Confidence level: ${getConfidenceLabel(confidence)} - How accurately the adapter CSS represents the intended changes`}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
              <path d="M6.5 7.5A1.5 1.5 0 0 1 8 6h.5a.5.5 0 0 1 0 1H8a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 1-1 0V7.5z"/>
              <path d="M8 10.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z"/>
            </svg>
            {getConfidenceLabel(confidence)}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewControls;
