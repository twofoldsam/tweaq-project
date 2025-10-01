/**
 * Example UI Integration for Combined Editing Workflow
 * This shows how to add a chat interface to the overlay for natural language instructions
 */

import React, { useState } from 'react';
import type { VisualEdit, NaturalLanguageEdit, CombinedEditRequest } from '@tweaq/agent-v4';

interface EditingPanelProps {
  visualEdits: VisualEdit[];
  onSubmitAll: (request: CombinedEditRequest) => Promise<void>;
  selectedElement?: { selector: string; tagName: string };
}

export function EditingPanel({ visualEdits, onSubmitAll, selectedElement }: EditingPanelProps) {
  const [naturalLanguageEdits, setNaturalLanguageEdits] = useState<NaturalLanguageEdit[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'visual' | 'chat'>('visual');

  // Add a natural language instruction
  const handleAddInstruction = () => {
    if (!chatInput.trim()) return;

    const newEdit: NaturalLanguageEdit = {
      id: `nl_${Date.now()}`,
      type: 'natural-language',
      instruction: chatInput.trim(),
      targetElement: selectedElement,
      timestamp: Date.now(),
      context: {
        scope: selectedElement ? 'element' : 'page'
      }
    };

    setNaturalLanguageEdits(prev => [...prev, newEdit]);
    setChatInput('');
  };

  // Remove a natural language instruction
  const handleRemoveInstruction = (id: string) => {
    setNaturalLanguageEdits(prev => prev.filter(edit => edit.id !== id));
  };

  // Submit all changes
  const handleSubmit = async () => {
    const request: CombinedEditRequest = {
      visualEdits,
      naturalLanguageEdits,
      metadata: {
        sessionId: `session_${Date.now()}`,
        submittedAt: Date.now()
      }
    };

    await onSubmitAll(request);
    
    // Clear edits after successful submission
    setNaturalLanguageEdits([]);
  };

  const totalChanges = visualEdits.length + naturalLanguageEdits.length;
  const hasChanges = totalChanges > 0;

  return (
    <div className="editing-panel">
      {/* Header with tabs */}
      <div className="panel-header">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'visual' ? 'active' : ''}`}
            onClick={() => setActiveTab('visual')}
          >
            Visual Tweaks
            {visualEdits.length > 0 && (
              <span className="badge">{visualEdits.length}</span>
            )}
          </button>
          <button
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Instructions
            {naturalLanguageEdits.length > 0 && (
              <span className="badge">{naturalLanguageEdits.length}</span>
            )}
          </button>
        </div>
        
        <div className="total-changes">
          {totalChanges} {totalChanges === 1 ? 'change' : 'changes'}
        </div>
      </div>

      {/* Tab content */}
      <div className="panel-content">
        {activeTab === 'visual' ? (
          // Visual edits list
          <div className="visual-edits">
            {visualEdits.length === 0 ? (
              <div className="empty-state">
                <p>No visual tweaks yet</p>
                <p className="hint">Click elements and adjust properties in the inspector</p>
              </div>
            ) : (
              <div className="edits-list">
                {visualEdits.map(edit => (
                  <div key={edit.id} className="edit-item">
                    <div className="edit-target">{edit.element.selector}</div>
                    <div className="edit-changes">
                      {edit.changes.map((change, idx) => (
                        <div key={idx} className="change">
                          <span className="property">{change.property}</span>
                          <span className="arrow">→</span>
                          <span className="value">{change.after}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Natural language instructions
          <div className="natural-language-edits">
            <div className="chat-interface">
              {/* Instructions list */}
              <div className="instructions-list">
                {naturalLanguageEdits.length === 0 ? (
                  <div className="empty-state">
                    <p>No instructions yet</p>
                    <p className="hint">Type instructions like "Make the copy more friendly"</p>
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
                        className="remove-btn"
                        onClick={() => handleRemoveInstruction(edit.id)}
                        title="Remove instruction"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Chat input */}
              <div className="chat-input-container">
                {selectedElement && (
                  <div className="context-indicator">
                    📍 Selected: <code>{selectedElement.selector}</code>
                  </div>
                )}
                
                <div className="chat-input-wrapper">
                  <textarea
                    className="chat-input"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddInstruction();
                      }
                    }}
                    placeholder={
                      selectedElement
                        ? `Tell the agent what to do with ${selectedElement.selector}...`
                        : "Describe the change you want to make..."
                    }
                    rows={3}
                  />
                  <button
                    className="send-btn"
                    onClick={handleAddInstruction}
                    disabled={!chatInput.trim()}
                  >
                    Add Instruction
                  </button>
                </div>

                {/* Example instructions */}
                <div className="examples">
                  <div className="examples-label">Examples:</div>
                  <div className="example-chips">
                    <button
                      className="example-chip"
                      onClick={() => setChatInput("Make the copy more friendly and approachable")}
                    >
                      Make copy more friendly
                    </button>
                    <button
                      className="example-chip"
                      onClick={() => setChatInput("Condense this section to be more compact")}
                    >
                      Condense section
                    </button>
                    <button
                      className="example-chip"
                      onClick={() => setChatInput("Rework the layout to be more modern")}
                    >
                      Modernize layout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with submit button */}
      <div className="panel-footer">
        <div className="footer-info">
          <div className="change-summary">
            {visualEdits.length > 0 && (
              <span>{visualEdits.length} visual {visualEdits.length === 1 ? 'tweak' : 'tweaks'}</span>
            )}
            {visualEdits.length > 0 && naturalLanguageEdits.length > 0 && <span> + </span>}
            {naturalLanguageEdits.length > 0 && (
              <span>{naturalLanguageEdits.length} {naturalLanguageEdits.length === 1 ? 'instruction' : 'instructions'}</span>
            )}
          </div>
        </div>
        
        <button
          className="submit-btn primary"
          onClick={handleSubmit}
          disabled={!hasChanges}
        >
          {hasChanges
            ? `Submit ${totalChanges} ${totalChanges === 1 ? 'Change' : 'Changes'}`
            : 'No Changes to Submit'
          }
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
 * STYLES (Example - adapt to your design system)
 * ============================================================================ */

const styles = `
.editing-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tabs {
  display: flex;
  gap: 8px;
}

.tab {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
  position: relative;
}

.tab.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab .badge {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 6px;
  background: #3b82f6;
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.total-changes {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-state p {
  margin: 8px 0;
}

.empty-state .hint {
  font-size: 14px;
  color: #d1d5db;
}

/* Visual Edits */
.edits-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.edit-target {
  font-family: monospace;
  font-size: 12px;
  color: #3b82f6;
  margin-bottom: 8px;
}

.edit-changes {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.change .property {
  color: #6b7280;
}

.change .arrow {
  color: #d1d5db;
}

.change .value {
  font-weight: 600;
  color: #111827;
}

/* Natural Language Instructions */
.instructions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.instruction-item {
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 12px;
  background: #eff6ff;
  border-radius: 8px;
  border: 1px solid #dbeafe;
}

.instruction-content {
  flex: 1;
}

.instruction-icon {
  font-size: 18px;
  margin-bottom: 4px;
}

.instruction-text {
  font-size: 14px;
  color: #111827;
  line-height: 1.5;
  margin-bottom: 4px;
}

.instruction-target {
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
  margin-top: 4px;
}

.remove-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* Chat Input */
.chat-input-container {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.context-indicator {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  padding: 6px 10px;
  background: #f3f4f6;
  border-radius: 6px;
}

.context-indicator code {
  font-family: monospace;
  color: #3b82f6;
}

.chat-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
}

.chat-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.send-btn {
  align-self: flex-end;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #2563eb;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Examples */
.examples {
  margin-top: 12px;
}

.examples-label {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.example-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.example-chip {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.example-chip:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

/* Footer */
.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.footer-info {
  font-size: 14px;
  color: #6b7280;
}

.submit-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn.primary {
  background: #3b82f6;
  color: white;
}

.submit-btn.primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}
`;

// Export for use in your app
export default EditingPanel;

