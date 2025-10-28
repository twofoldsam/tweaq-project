import { useState, useEffect } from 'react';
import './LeftPanel.css';
import './PropertyInputs.css';
import { ToolbarMode } from './LeftToolbar';
import { 
  ColorInput, 
  NumberInput, 
  SelectInput, 
  SpacingInput, 
  TextContentInput,
  parseNumberValue 
} from './PropertyInputs';

interface ElementData {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  properties: Record<string, string>;
  selector: string;
}

interface LeftPanelProps {
  mode: ToolbarMode;
  width: number;
  onWidthChange: (width: number) => void;
  visible: boolean;
}

interface RecordedEdit {
  id: string;
  timestamp: number;
  elementName: string;
  changes: Array<{
    property: string;
    before: string;
    after: string;
  }>;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  type?: 'property-change' | 'structured-change';
  actionType?: string;
  target?: {
    identifier: string;
    type: string;
  };
  specifics?: Array<{
    field: string;
    value: string;
  }>;
  prUrl?: string;
  error?: string;
  metadata?: {
    generatedByAI?: boolean;
  };
}

export function LeftPanel({ mode, width, onWidthChange, visible }: LeftPanelProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [editedProperties, setEditedProperties] = useState<Record<string, string>>({});
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [recordedEdits, setRecordedEdits] = useState<RecordedEdit[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isConvertingComments, setIsConvertingComments] = useState(false);

  // Helper function to categorize property changes
  const categorizeChange = (property: string) => {
    const categories: Record<string, { type: string; icon: string; color: string }> = {
      'textContent': { type: 'Copy Change', icon: '✏️', color: '#667eea' },
      'color': { type: 'Color Change', icon: '🎨', color: '#f093fb' },
      'backgroundColor': { type: 'Color Change', icon: '🎨', color: '#f093fb' },
      'borderColor': { type: 'Color Change', icon: '🎨', color: '#f093fb' },
      'fontSize': { type: 'Size Change', icon: '📏', color: '#4facfe' },
      'width': { type: 'Size Change', icon: '📏', color: '#4facfe' },
      'height': { type: 'Size Change', icon: '📏', color: '#4facfe' },
      'padding': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'margin': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'paddingTop': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'paddingRight': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'paddingBottom': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'paddingLeft': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'marginTop': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'marginRight': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'marginBottom': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'marginLeft': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'fontWeight': { type: 'Style Change', icon: '💎', color: '#fa709a' },
    };
    return categories[property] || { type: 'Style Change', icon: '✨', color: '#a8edea' };
  };

  // Helper function to generate plain English summary
  const generateSummary = (changes: any[], elementName: string) => {
    if (changes.length === 1) {
      const change = changes[0];
      const property = change.property;
      
      if (property === 'textContent') {
        return `Change text to "${change.after.substring(0, 30)}${change.after.length > 30 ? '...' : ''}"`;
      } else if (property === 'color' || property === 'backgroundColor') {
        return `Change ${property === 'color' ? 'text' : 'background'} color to ${change.after}`;
      } else if (property === 'fontSize') {
        return `Change font size from ${change.before} to ${change.after}`;
      } else if (property.includes('padding') || property.includes('margin')) {
        const type = property.includes('padding') ? 'padding' : 'margin';
        return `Adjust ${type} to ${change.after}`;
      } else {
        return `Update ${property} to ${change.after}`;
      }
    } else {
      const types = [...new Set(changes.map(c => categorizeChange(c.property).type))];
      if (types.length === 1) {
        return `${changes.length} ${types[0].toLowerCase()} updates`;
      } else {
        return `${changes.length} property changes`;
      }
    }
  };
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [readyTickets, setReadyTickets] = useState<any[]>([]);
  const [isSelectModeActive, setIsSelectModeActive] = useState(true); // Default to true for design mode

  useEffect(() => {
    // Listen for element selection from BrowserView
    const cleanup = window.electronAPI.onElementSelected?.((data: ElementData) => {
      console.log('Element selected in React:', data);
      setSelectedElement(data);
      setEditedProperties({}); // Reset edits when new element selected
      setHasPendingChanges(false);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Auto-select body element when in design mode with nothing selected
  useEffect(() => {
    const selectBodyElement = async () => {
      if (mode === 'design' && !selectedElement && visible) {
        try {
          // Request body element selection
          await window.electronAPI.overlaySelectElement('body');
        } catch (error) {
          console.error('Failed to auto-select body element:', error);
        }
      }
    };

    selectBodyElement();
  }, [mode, visible]);

  useEffect(() => {
    // Fetch recorded edits and comments when switching to tickets mode
    if (mode === 'tickets') {
      fetchRecordedEdits();
      fetchComments();
    }
  }, [mode]);

  const fetchComments = async () => {
    try {
      const result = await window.electronAPI.overlayGetComments();
      if (result.success && result.comments) {
        setComments(result.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchRecordedEdits = async () => {
    try {
      const result = await window.electronAPI.overlayGetRecordedEdits();
      if (result.success && result.edits) {
        setRecordedEdits(result.edits);
      }
    } catch (error) {
      console.error('Failed to fetch recorded edits:', error);
    }
  };

  const handleDeleteTicket = async (index: number) => {
    try {
      const result = await window.electronAPI.overlayDeleteEdit(index);
      if (result.success) {
        // Refresh the list
        await fetchRecordedEdits();
      }
    } catch (error) {
      console.error('Failed to delete ticket:', error);
    }
  };

  const handleConvertComments = async () => {
    setIsConvertingComments(true);
    try {
      console.log('Converting comments to tweaqs...');
      
      // Get comments data from the overlay
      const commentsResult = await window.electronAPI.overlayGetComments();
      if (!commentsResult.success || !commentsResult.comments || commentsResult.comments.length === 0) {
        alert('No comments found to convert');
        return;
      }

      // Call Claude to analyze comments and generate tweaqs
      const result = await window.electronAPI.convertCommentsToTweaqs(commentsResult.comments);
      
      if (result.success && result.tweaqs) {
        console.log('✅ Received tweaqs from LLM:', result.tweaqs);
        
        // Convert each tweaq into a recorded edit and add to BrowserView
        for (const tweaq of result.tweaqs) {
          const editData = convertTweaqToEdit(tweaq);
          if (editData) {
            await window.electronAPI.overlayRecordEdit(editData);
          }
        }
        
        // Remove all comments from the page
        await window.electronAPI.overlayRemoveAllComments();
        
        // Refresh the edits and comments lists
        await fetchRecordedEdits();
        await fetchComments();
        
        console.log('✅ Successfully converted comments to tweaqs');
      } else {
        console.error('Failed to convert comments:', result.error);
        alert(`Failed to convert comments to tweaqs: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to convert comments:', error);
      alert('An error occurred while converting comments.');
    } finally {
      setIsConvertingComments(false);
    }
  };

  const convertTweaqToEdit = (tweaq: any) => {
    try {
      // Convert LLM-generated tweaq into edit format
      const categoryToActionType: Record<string, string> = {
        'copy': 'content',
        'style': 'styling',
        'layout': 'layout',
        'color': 'styling',
        'spacing': 'layout',
        'size': 'layout',
        'visibility': 'styling'
      };
      
      const actionType = categoryToActionType[tweaq.category] || 'mixed';
      
      // Create specifics array from changes
      const specifics: Array<{ field: string; value: string }> = [];
      if (tweaq.changes && Array.isArray(tweaq.changes)) {
        tweaq.changes.forEach((change: any) => {
          if (change.description) {
            specifics.push({ field: change.property || 'change', value: change.description });
          } else {
            const propName = change.property === 'textContent' ? 'text' : change.property;
            specifics.push({
              field: propName,
              value: `${change.currentValue || 'current'} → ${change.newValue}`
            });
          }
        });
      }
      
      // Build the edit object
      return {
        type: 'structured-change',
        actionType: actionType,
        target: tweaq.target,
        instruction: tweaq.instruction,
        specifics: specifics,
        sourceComments: tweaq.sourceComments || [],
        reasoning: tweaq.reasoning,
        confidence: tweaq.confidence,
        changes: tweaq.changes || [],
        metadata: {
          generatedByAI: true,
          category: tweaq.category
        }
      };
    } catch (error) {
      console.error('Failed to convert tweaq to edit:', error);
      return null;
    }
  };

  const handleSendToAgent = async () => {
    try {
      // TODO: Implement sending to Agent V4
      console.log('Sending tweaqs to Agent V4...');
      // This would trigger the PR creation workflow
    } catch (error) {
      console.error('Failed to send to agent:', error);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      // TODO: Call conversational intelligence API
      console.log('Sending chat message:', userMessage);
      // Simulate response
      setTimeout(() => {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'This is a placeholder response. The conversational intelligence API will be integrated here.'
        }]);
        setIsChatLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to send chat message:', error);
      setIsChatLoading(false);
    }
  };

  const handleConfirmTweaqs = () => {
    // Convert ready tickets to recorded edits
    if (readyTickets && readyTickets.length > 0) {
      console.log('Confirming tweaqs:', readyTickets);
      // TODO: Convert to recorded edits
      setReadyTickets([]);
    }
  };

  const handleCancelTweaqs = () => {
    setReadyTickets([]);
  };

  const handleToggleSelectMode = async () => {
    const newState = !isSelectModeActive;
    setIsSelectModeActive(newState);
    
    try {
      // Toggle select mode in the BrowserView overlay
      await window.electronAPI.overlayToggleSelectMode();
      
      // If disabling select mode, clear the selected element
      if (!newState) {
        setSelectedElement(null);
        setEditedProperties({});
        setHasPendingChanges(false);
      }
    } catch (error) {
      console.error('Failed to toggle select mode:', error);
    }
  };

  const handleTicketHover = async (index: number) => {
    try {
      // Highlight the element in the BrowserView
      await window.electronAPI.overlayHighlightEdit(index);
    } catch (error) {
      console.error('Failed to highlight element:', error);
    }
  };

  const handleTicketLeave = async () => {
    try {
      // Clear the highlight in the BrowserView
      await window.electronAPI.overlayClearHighlight();
    } catch (error) {
      console.error('Failed to clear highlight:', error);
    }
  };

  // Simple markdown renderer (supports bold, italic, code, links)
  const renderMarkdown = (text: string) => {
    let html = text;
    
    // Code blocks ```code```
    html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic *text*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
    
    return html;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
    
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(280, Math.min(800, startWidth + deltaX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  const handlePropertyChange = async (property: string, value: string) => {
    if (!selectedElement) return;

    // Update local state
    setEditedProperties(prev => ({ ...prev, [property]: value }));
    setHasPendingChanges(true);

    // Apply change live to the element in BrowserView
    try {
      await window.electronAPI.overlayApplyStyle(selectedElement.selector, property, value);
    } catch (error) {
      console.error('Failed to apply style:', error);
    }
  };

  const handleRecordEdit = async () => {
    if (!selectedElement || !hasPendingChanges) return;

    const changes = Object.entries(editedProperties).map(([property, after]) => ({
      property,
      before: selectedElement.properties[property] || '',
      after
    }));

    try {
      await window.electronAPI.overlayRecordEdit({
        element: selectedElement,
        changes
      });

      // Reset state after recording
      setEditedProperties({});
      setHasPendingChanges(false);

      console.log('Edit recorded successfully');
    } catch (error) {
      console.error('Failed to record edit:', error);
    }
  };

  const getCurrentValue = (property: string) => {
    return editedProperties[property] || selectedElement?.properties[property] || '';
  };

  const getRect = () => {
    // Parse width and height from properties if available
    const width = parseNumberValue(getCurrentValue('width'));
    const height = parseNumberValue(getCurrentValue('height'));
    return { width, height };
  };

  const hasTextContent = () => {
    return selectedElement?.textContent && selectedElement.textContent.trim().length > 0;
  };

  const isFlexOrGrid = () => {
    const display = getCurrentValue('display');
    return display === 'flex' || display === 'grid';
  };

  const renderPanelContent = () => {
    switch (mode) {
      case 'design':
        if (selectedElement) {
          const rect = getRect();
          
          return (
            <div className="panel-content">
              {/* Element Header */}
              <div className="element-header-section">
                <div className="element-info">
                  <div className="element-tag">
                    &lt;{selectedElement.tagName}&gt;
                    {selectedElement.id && <span className="element-id">#{selectedElement.id}</span>}
                    {selectedElement.className && (
                      <span className="element-class">.{selectedElement.className.split(' ')[0]}</span>
                    )}
                  </div>
                  {selectedElement.textContent && (
                    <div className="element-text">{selectedElement.textContent}</div>
                  )}
                </div>
                
                <div className="header-actions">
                  <button 
                    className={`select-mode-toggle ${isSelectModeActive ? 'active' : ''}`}
                    onClick={handleToggleSelectMode}
                    title={isSelectModeActive ? 'Exit select mode' : 'Enter select mode'}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M1 1l4.5 11L8 8l4-2.5L1 1z"/>
                    </svg>
                    <span>Select</span>
                  </button>
                  
                  {hasPendingChanges && (
                    <button 
                      className="record-button"
                      onClick={handleRecordEdit}
                      title="Record this edit"
                    >
                      ✓ Record
                    </button>
                  )}
                </div>
              </div>
              
              {/* Design Section */}
              <div className="properties-section">
                <h3 className="section-header">Design</h3>
                <ColorInput
                  label="Fill"
                  value={getCurrentValue('backgroundColor')}
                  property="backgroundColor"
                  onChange={handlePropertyChange}
                />
                <NumberInput
                  label="Corner Radius"
                  value={parseNumberValue(getCurrentValue('borderRadius'))}
                  property="borderRadius"
                  unit="px"
                  onChange={handlePropertyChange}
                />
              </div>

              {/* Layout Section */}
              <div className="properties-section">
                <h3 className="section-header">Layout</h3>
                <SelectInput
                  label="Position"
                  value={getCurrentValue('position')}
                  property="position"
                  options={[
                    { value: 'static', label: 'Static' },
                    { value: 'relative', label: 'Relative' },
                    { value: 'absolute', label: 'Absolute' },
                    { value: 'fixed', label: 'Fixed' },
                    { value: 'sticky', label: 'Sticky' }
                  ]}
                  onChange={handlePropertyChange}
                />
                <SelectInput
                  label="Display"
                  value={getCurrentValue('display')}
                  property="display"
                  options={[
                    { value: 'block', label: 'Block' },
                    { value: 'inline', label: 'Inline' },
                    { value: 'inline-block', label: 'Inline Block' },
                    { value: 'flex', label: 'Flex' },
                    { value: 'grid', label: 'Grid' },
                    { value: 'none', label: 'None' }
                  ]}
                  onChange={handlePropertyChange}
                />
                {isFlexOrGrid() && (
                  <NumberInput
                    label="Gap"
                    value={parseNumberValue(getCurrentValue('gap'))}
                    property="gap"
                    unit="px"
                    onChange={handlePropertyChange}
                  />
                )}
                <div className="property-row">
                  <label className="property-name">Size:</label>
                  <div className="dimension-grid">
                    <NumberInput
                      label=""
                      value={rect.width}
                      property="width"
                      unit="W"
                      readonly
                      onChange={handlePropertyChange}
                    />
                    <NumberInput
                      label=""
                      value={rect.height}
                      property="height"
                      unit="H"
                      readonly
                      onChange={handlePropertyChange}
                    />
                  </div>
                </div>
                <SpacingInput
                  label="Padding"
                  values={{
                    top: parseNumberValue(getCurrentValue('paddingTop')),
                    right: parseNumberValue(getCurrentValue('paddingRight')),
                    bottom: parseNumberValue(getCurrentValue('paddingBottom')),
                    left: parseNumberValue(getCurrentValue('paddingLeft'))
                  }}
                  properties={{
                    top: 'paddingTop',
                    right: 'paddingRight',
                    bottom: 'paddingBottom',
                    left: 'paddingLeft'
                  }}
                  onChange={handlePropertyChange}
                />
                <SpacingInput
                  label="Margin"
                  values={{
                    top: parseNumberValue(getCurrentValue('marginTop')),
                    right: parseNumberValue(getCurrentValue('marginRight')),
                    bottom: parseNumberValue(getCurrentValue('marginBottom')),
                    left: parseNumberValue(getCurrentValue('marginLeft'))
                  }}
                  properties={{
                    top: 'marginTop',
                    right: 'marginRight',
                    bottom: 'marginBottom',
                    left: 'marginLeft'
                  }}
                  onChange={handlePropertyChange}
                />
              </div>

              {/* Text Section - only show if element has text */}
              {hasTextContent() && (
                <div className="properties-section">
                  <h3 className="section-header">Text</h3>
                  <TextContentInput
                    label="Content"
                    value={selectedElement.textContent}
                    property="textContent"
                    onChange={handlePropertyChange}
                  />
                  <NumberInput
                    label="Size"
                    value={parseNumberValue(getCurrentValue('fontSize'))}
                    property="fontSize"
                    unit="px"
                    onChange={handlePropertyChange}
                  />
                  <SelectInput
                    label="Weight"
                    value={getCurrentValue('fontWeight')}
                    property="fontWeight"
                    options={[
                      { value: '100', label: 'Thin' },
                      { value: '200', label: 'Extra Light' },
                      { value: '300', label: 'Light' },
                      { value: '400', label: 'Regular' },
                      { value: '500', label: 'Medium' },
                      { value: '600', label: 'Semi Bold' },
                      { value: '700', label: 'Bold' },
                      { value: '800', label: 'Extra Bold' },
                      { value: '900', label: 'Black' }
                    ]}
                    onChange={handlePropertyChange}
                  />
                  <ColorInput
                    label="Color"
                    value={getCurrentValue('color')}
                    property="color"
                    onChange={handlePropertyChange}
                  />
                  <SelectInput
                    label="Align"
                    value={getCurrentValue('textAlign')}
                    property="textAlign"
                    options={[
                      { value: 'left', label: 'Left' },
                      { value: 'center', label: 'Center' },
                      { value: 'right', label: 'Right' },
                      { value: 'justify', label: 'Justify' }
                    ]}
                    onChange={handlePropertyChange}
                  />
                </div>
              )}

              {/* Effects Section */}
              <div className="properties-section">
                <h3 className="section-header">Effects</h3>
                <NumberInput
                  label="Opacity"
                  value={Math.round(parseFloat(getCurrentValue('opacity') || '1') * 100)}
                  property="opacity"
                  unit="%"
                  min={0}
                  max={100}
                  onChange={handlePropertyChange}
                />
                {getCurrentValue('boxShadow') && getCurrentValue('boxShadow') !== 'none' && (
                  <div className="property-row">
                    <label className="property-name">Shadow:</label>
                    <input
                      type="text"
                      value={getCurrentValue('boxShadow')}
                      onChange={(e) => handlePropertyChange('boxShadow', e.target.value)}
                      className="property-input"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        }
        return (
          <div className="panel-content">
            <div className="design-empty-state">
              <div className="empty-state-header">
                <h2>Design Mode</h2>
                <button 
                  className={`select-mode-toggle ${isSelectModeActive ? 'active' : ''}`}
                  onClick={handleToggleSelectMode}
                  title={isSelectModeActive ? 'Exit select mode' : 'Enter select mode'}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1 1l4.5 11L8 8l4-2.5L1 1z"/>
                  </svg>
                  <span>Select</span>
                </button>
              </div>
              <p>
                {isSelectModeActive 
                  ? 'Click on any element on the page to view and edit its properties.'
                  : 'Enable select mode to choose an element.'}
              </p>
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="panel-content chat-view">
            {/* Messages Container */}
            <div className="chat-messages-container">
              {chatMessages.length === 0 ? (
                <div className="chat-welcome">
                  <div className="chat-welcome-icon">💬</div>
                  <p className="chat-welcome-text">Start a conversation to make changes</p>
                  
                  {/* Example Chips */}
                  <div className="chat-examples">
                    <div className="examples-label">Examples:</div>
                    <div className="example-chips">
                      <button className="example-chip" onClick={() => setChatInput('Make the copy more friendly')}>
                        Make the copy more friendly
                      </button>
                      <button className="example-chip" onClick={() => setChatInput('Condense the footer')}>
                        Condense the footer
                      </button>
                      <button className="example-chip" onClick={() => setChatInput('Make buttons more vibrant')}>
                        Make buttons more vibrant
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role}`}>
                    <div 
                      className="message-content"
                      dangerouslySetInnerHTML={{ __html: msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content }}
                    />
                  </div>
                ))
              )}
              
              {/* Loading indicator */}
              {isChatLoading && (
                <div className="chat-loading">
                  <div className="spinner"></div>
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {/* Confirmation UI for Ready Tweaqs */}
            {readyTickets && readyTickets.length > 0 && (
              <div className="chat-confirmation">
                <div className="confirmation-header">Ready to create tweaqs?</div>
                <div className="confirmation-tickets">
                  {readyTickets.map((ticket, i) => (
                    <div key={i} className="confirmation-ticket">
                      <div className="confirmation-ticket-icon">⚡</div>
                      <div className="confirmation-ticket-info">
                        <div className="confirmation-ticket-instruction">{ticket.instruction}</div>
                        <div className="confirmation-ticket-meta">
                          Target: {ticket.target?.identifier} • Confidence: {Math.round((ticket.confidence || 0) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="confirmation-actions">
                  <button className="btn-secondary" onClick={handleCancelTweaqs}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleConfirmTweaqs}>
                    Create Tweaqs
                  </button>
                </div>
              </div>
            )}

            {/* Chat Input */}
            {!readyTickets || readyTickets.length === 0 ? (
              <div className="chat-input-wrapper">
                <textarea
                  className="chat-input"
                  placeholder={chatMessages.length === 0 ? 'Describe the change you want to make...' : 'Type your message...'}
                  rows={3}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  disabled={isChatLoading}
                />
                <button 
                  className="chat-send-btn"
                  onClick={handleSendChatMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                >
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z"/>
                  </svg>
                </button>
              </div>
            ) : null}
          </div>
        );
      case 'comment':
        // Comment mode shows the same properties panel as Design when an element is selected
        if (selectedElement) {
          const rect = getRect();
          
          return (
            <div className="panel-content">
              {/* Element Header */}
              <div className="element-header-section">
                <div className="element-info">
                  <div className="element-tag">
                    &lt;{selectedElement.tagName}&gt;
                    {selectedElement.id && <span className="element-id">#{selectedElement.id}</span>}
                    {selectedElement.className && (
                      <span className="element-class">.{selectedElement.className.split(' ')[0]}</span>
                    )}
                  </div>
                  {selectedElement.textContent && (
                    <div className="element-text">{selectedElement.textContent}</div>
                  )}
                </div>
              </div>
              
              {/* Comment Panel - TODO: Add comment input and display */}
              <div className="comment-section">
                <h3 className="section-header">Add Comment</h3>
                <textarea
                  className="comment-textarea"
                  placeholder="Add a comment about this element..."
                  rows={4}
                />
                <button className="comment-submit-btn">
                  Submit Comment
                </button>
              </div>
              
              {/* Show element properties below comment input */}
              <div className="properties-section">
                <h3 className="section-header">Element Properties</h3>
                {Object.entries(selectedElement.properties).slice(0, 8).map(([key, value]) => (
                  <div key={key} className="property-row">
                    <span className="property-name">{key}:</span>
                    <span className="property-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className="panel-content">
            <h2>Comments</h2>
            <p>Click on any element on the page to add a comment.</p>
          </div>
        );
      case 'tickets':
        const ticketCount = recordedEdits.length;
        const commentCount = comments.length;
        
        const renderTicketStatus = (edit: RecordedEdit) => {
          const status = edit.status || 'pending';
          
          if (status === 'pending') return null;
          
          if (status === 'processing') {
            return (
              <div className="ticket-status processing">
                <div className="ticket-status-badge">
                  <div className="spinner"></div>
                  Processing
                </div>
                <span className="ticket-status-text">Agent V4 is analyzing and creating PR...</span>
              </div>
            );
          }
          
          if (status === 'completed') {
            return (
              <div className="ticket-status completed">
                <div className="ticket-status-badge">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                  </svg>
                  Completed
                </div>
                {edit.prUrl && (
                  <a href={edit.prUrl} className="pr-link" target="_blank" rel="noopener noreferrer">
                    View Pull Request
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M3.75 2a.75.75 0 000 1.5h7.19L1.22 13.22a.75.75 0 101.06 1.06L12 4.56v7.19a.75.75 0 001.5 0v-9a.75.75 0 00-.75-.75h-9z"/>
                    </svg>
                  </a>
                )}
              </div>
            );
          }
          
          if (status === 'failed') {
            return (
              <div className="ticket-status failed">
                <div className="ticket-status-badge">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z"/>
                  </svg>
                  Failed
                </div>
                {edit.error && <p className="ticket-error">{edit.error}</p>}
              </div>
            );
          }
          
          return null;
        };
        
        return (
          <div className="panel-content">
            {/* Comments Conversion Card */}
            {commentCount > 0 && (
              <div className="comments-conversion-card">
                <div className="conversion-header">
                  <div className="conversion-icon">💬</div>
                  <div className="conversion-info">
                    <h4 className="conversion-title">
                      {commentCount} Comment{commentCount !== 1 ? 's' : ''} on Page
                    </h4>
                    <p className="conversion-subtitle">Convert comments into actionable tweaqs</p>
                  </div>
                </div>
                {isConvertingComments ? (
                  <div className="conversion-loading">
                    <div className="spinner"></div>
                    <span>Analyzing comments with AI...</span>
                  </div>
                ) : (
                  <button className="conversion-button" onClick={handleConvertComments}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5z"/>
                    </svg>
                    Create Tweaqs
                  </button>
                )}
              </div>
            )}
            
            {/* Tickets List */}
            {ticketCount === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">⚡</div>
                <h3>No tweaqs yet</h3>
                <p>Edit in Design, add Comments, or Chat to create tweaqs</p>
              </div>
            ) : (
              <div className="tickets-list">
                {recordedEdits.map((edit, index) => {
                  const status = edit.status || 'pending';
                  
                  // Determine the change type
                  const changeTypes = edit.changes.map((c: any) => categorizeChange(c.property));
                  const primaryType = changeTypes[0];
                  const allSameType = changeTypes.every((ct: any) => ct.type === primaryType.type);
                  const displayType = allSameType ? primaryType : { 
                    type: 'Mixed Changes', 
                    icon: '🔄', 
                    color: '#a8edea' 
                  };
                  
                  const summary = generateSummary(edit.changes, edit.elementName);
                  
                  return (
                    <div 
                      key={edit.id} 
                      className={`ticket-card ${status}`}
                      onMouseEnter={() => handleTicketHover(index)}
                      onMouseLeave={handleTicketLeave}
                    >
                      <div className="ticket-card-header">
                        <div 
                          className="ticket-type-badge" 
                          style={{
                            background: `${displayType.color}20`,
                            color: displayType.color,
                            borderColor: `${displayType.color}40`
                          }}
                        >
                          <span className="ticket-badge-icon">{displayType.icon}</span>
                          <span className="ticket-badge-text">{displayType.type}</span>
                        </div>
                        <div className="ticket-actions">
                          {status === 'pending' && (
                            <button 
                              className="ticket-delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTicket(index);
                              }}
                              title="Delete"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="ticket-card-body">
                        <div className="ticket-summary">{summary}</div>
                        
                        <div className="ticket-target">
                          <span className="target-label">TARGET:</span>
                          <code className="target-selector">{edit.elementSelector || edit.elementName}</code>
                        </div>
                        
                        {edit.changes && edit.changes.length > 0 && (
                          <div className="ticket-details">
                            <div className="details-header">PROPERTY CHANGES:</div>
                            <div className="details-list">
                              {edit.changes.map((change: any, i: number) => (
                                <div key={i} className="detail-item">
                                  <div className="detail-property">
                                    {change.property === 'textContent' ? 'TEXT CONTENT' : change.property.toUpperCase()}
                                  </div>
                                  <div className="detail-change">
                                    <span className="detail-before">
                                      {String(change.before).substring(0, 40)}{String(change.before).length > 40 ? '...' : ''}
                                    </span>
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{opacity: 0.5, margin: '0 4px'}}>
                                      <path d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                                    </svg>
                                    <span className="detail-after">
                                      {String(change.after).substring(0, 40)}{String(change.after).length > 40 ? '...' : ''}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Status Indicator */}
                      {renderTicketStatus(edit)}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Send to Agent Button */}
            {ticketCount > 0 && (
              <button className="send-tweaqs-button" onClick={handleSendToAgent}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                </svg>
                Send {ticketCount} {ticketCount === 1 ? 'Tweaq' : 'Tweaqs'} to Agent
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div 
        className={`left-panel ${visible ? 'visible' : ''} ${isResizing ? 'resizing' : ''}`}
        style={{ width: `${width}px`, left: '56px' }}
      >
        {mode !== 'design' && (
          <div className="panel-header">
            <h3>{mode.charAt(0).toUpperCase() + mode.slice(1)}</h3>
          </div>
        )}
        {renderPanelContent()}
      </div>
      
      <div
        className={`panel-resize-handle ${visible ? 'visible' : ''}`}
        style={{ left: `${56 + width}px` }}
        onMouseDown={handleMouseDown}
      >
        <div className="resize-handle-indicator" />
      </div>
    </>
  );
}

