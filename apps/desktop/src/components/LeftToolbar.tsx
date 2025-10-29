import './LeftToolbar.css';
import designIcon from '../assets/design-icon.svg';
import chatIcon from '../assets/chat-icon.svg';
import commentIcon from '../assets/comment-icon.svg';
import tweaqIcon from '../assets/tweaq-icon.svg';
import settingsIcon from '../assets/settings-icon.svg';
import designIconFilled from '../assets/design-icon-filled.svg';
import chatIconFilled from '../assets/chat-icon-filled.svg';
import commentIconFilled from '../assets/comment-icon-filled.svg';
import tweaqIconFilled from '../assets/tweaq-icon-filled.svg';
import settingsIconFilled from '../assets/settings-icon-filled.svg';

export type ToolbarMode = 'design' | 'chat' | 'comment' | 'tickets';

interface LeftToolbarProps {
  currentMode: ToolbarMode;
  onModeChange: (mode: ToolbarMode) => void;
  onSettingsClick: () => void;
  tweaqCount?: number;
}

export function LeftToolbar({ currentMode, onModeChange, onSettingsClick, tweaqCount = 0 }: LeftToolbarProps) {
  console.log('🎯 LeftToolbar rendered with tweaqCount:', tweaqCount);
  
  const toolbarButtons = [
    { id: 'design' as ToolbarMode, label: 'Design', svgPath: designIcon, svgPathFilled: designIconFilled },
    { id: 'chat' as ToolbarMode, label: 'Chat', svgPath: chatIcon, svgPathFilled: chatIconFilled },
    { id: 'comment' as ToolbarMode, label: 'Comment', svgPath: commentIcon, svgPathFilled: commentIconFilled },
    { id: 'tickets' as ToolbarMode, label: 'Tweaqs', svgPath: tweaqIcon, svgPathFilled: tweaqIconFilled }
  ];

  return (
    <div className="left-toolbar">
      <div className="toolbar-buttons">
        {toolbarButtons.map(button => {
          const isActive = currentMode === button.id;
          const iconSrc = isActive ? button.svgPathFilled : button.svgPath;
          const showBadge = button.id === 'tickets' && tweaqCount > 0;
          
          if (button.id === 'tickets') {
            console.log('🎫 Tweaqs button: showBadge =', showBadge, ', tweaqCount =', tweaqCount);
          }
          
          return (
            <button
              key={button.id}
              className={`toolbar-button ${isActive ? 'active' : ''}`}
              onClick={() => onModeChange(button.id)}
              title={button.label}
            >
              <img src={iconSrc} alt={button.label} className="toolbar-button-svg" />
              <span className="toolbar-button-label">{button.label}</span>
              {showBadge && <span className="toolbar-badge">{tweaqCount}</span>}
            </button>
          );
        })}
      </div>
      
      <div className="toolbar-spacer" />
      
      <div className="toolbar-bottom">
        <button
          className="toolbar-button"
          onClick={onSettingsClick}
          title="Settings"
        >
          <img src={settingsIcon} alt="Settings" className="toolbar-button-svg" />
          <span className="toolbar-button-label">Settings</span>
        </button>
      </div>
    </div>
  );
}

