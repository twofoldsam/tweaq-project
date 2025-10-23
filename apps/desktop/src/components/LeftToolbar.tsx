import { useState } from 'react';
import './LeftToolbar.css';

export type ToolbarMode = 'design' | 'chat' | 'comment' | 'tickets';

interface LeftToolbarProps {
  currentMode: ToolbarMode;
  onModeChange: (mode: ToolbarMode) => void;
  onSettingsClick: () => void;
}

export function LeftToolbar({ currentMode, onModeChange, onSettingsClick }: LeftToolbarProps) {
  const toolbarButtons = [
    { id: 'design' as ToolbarMode, icon: '✏️', label: 'Design' },
    { id: 'chat' as ToolbarMode, icon: '💬', label: 'Chat' },
    { id: 'comment' as ToolbarMode, icon: '💭', label: 'Comment' },
    { id: 'tickets' as ToolbarMode, icon: '🎫', label: 'Tickets' }
  ];

  return (
    <div className="left-toolbar">
      <div className="toolbar-buttons">
        {toolbarButtons.map(button => (
          <button
            key={button.id}
            className={`toolbar-button ${currentMode === button.id ? 'active' : ''}`}
            onClick={() => onModeChange(button.id)}
            title={button.label}
          >
            <span className="toolbar-button-icon">{button.icon}</span>
          </button>
        ))}
      </div>
      
      <div className="toolbar-spacer" />
      
      <div className="toolbar-bottom">
        <button
          className="toolbar-button"
          onClick={onSettingsClick}
          title="Settings"
        >
          <span className="toolbar-button-icon">⚙️</span>
        </button>
      </div>
    </div>
  );
}

