import React, { useState } from 'react';
import './ChatPanel.css';

interface NaturalLanguageEdit {
  id: string;
  type: 'natural-language';
  instruction: string;
  targetElement?: {
    selector: string;
    tagName: string;
    className?: string;
  };
  context?: {
    scope?: 'element' | 'component' | 'section' | 'page';
    userIntent?: string;
  };
  timestamp: number;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElement?: {
    selector: string;
    tagName: string;
    className?: string;
  };
  naturalLanguageEdits: NaturalLanguageEdit[];
  onAddInstruction: (instruction: string) => void;
  onRemoveInstruction: (id: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  selectedElement,
  naturalLanguageEdits,
  onAddInstruction,
  onRemoveInstruction
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim()) return;
    onAddInstruction(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const exampleInstructions = [
    "Make the copy more friendly",
    "Condense this section",
    "Rework the layout to be more modern"
  ];

  if (!isOpen) return null;

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <div className="chat-panel-title">
          💬 Instructions
          {naturalLanguageEdits.length > 0 && (
            <span className="chat-panel-badge">{naturalLanguageEdits.length}</span>
          )}
        </div>
        <button className="chat-panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="chat-panel-content">
        {/* Instructions List */}
        <div className="instructions-list">
          {naturalLanguageEdits.length === 0 ? (
            <div className="empty-state">
              <p>💡 No instructions yet</p>
              <p className="hint">Tell the agent what you want to change</p>
            </div>
          ) : (
            naturalLanguageEdits.map(edit => (
              <div key={edit.id} className="instruction-item">
                <div className="instruction-content">
                  <div className="instruction-icon">💬</div>
                  <div className="instruction-text">{edit.instruction}</div>
                  {edit.targetElement && (
                    <div className="instruction-target">
                      → {edit.targetElement.selector}
                    </div>
                  )}
                </div>
                <button
                  className="instruction-remove"
                  onClick={() => onRemoveInstruction(edit.id)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Context Indicator */}
        {selectedElement && (
          <div className="context-indicator">
            📍 Selected: <code>{selectedElement.selector}</code>
          </div>
        )}

        {/* Chat Input */}
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedElement
                ? `What should I do with ${selectedElement.selector}?`
                : "Describe the change you want to make..."
            }
            rows={3}
          />
          <button
            className="chat-send-btn"
            onClick={handleSubmit}
            disabled={!input.trim()}
          >
            Add Instruction
          </button>
        </div>

        {/* Examples */}
        <div className="examples">
          <div className="examples-label">Examples:</div>
          <div className="example-chips">
            {exampleInstructions.map((example, i) => (
              <button
                key={i}
                className="example-chip"
                onClick={() => setInput(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;

