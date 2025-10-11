import { useState, useEffect } from 'react';
import VisualCodingAgentService, { 
  type DesignRequest, 
  type DesignResponse, 
  type ElementSelection,
  type VisualCodingConfig 
} from '../services/VisualCodingAgentService';
import './VisualCodingAgent.css';

interface VisualCodingAgentProps {
  onClose?: () => void;
}

interface SelectedElementInfo {
  element: ElementSelection;
  boundingRect: DOMRect;
}

export function VisualCodingAgent({ onClose }: VisualCodingAgentProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [service, setService] = useState<VisualCodingAgentService | null>(null);
  const [description, setDescription] = useState('');
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [response, setResponse] = useState<DesignResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Refs for future overlay management
  // const overlayRef = useRef<HTMLDivElement>(null);
  // const highlightRef = useRef<HTMLDivElement>(null);

  // Initialize the service
  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      // For now, use mock implementation regardless of API key
      // This allows the UI to work while we resolve integration issues
      const config: VisualCodingConfig = {
        anthropicApiKey: 'mock-key-for-demo',
        cacheAnalysis: true
      };

      const newService = new VisualCodingAgentService(config);
      await newService.initialize();
      
      setService(newService);
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize agent');
    } finally {
      setIsInitializing(false);
    }
  };

  // Element selection functionality
  const startElementSelection = () => {
    setIsSelecting(true);
    setSelectedElement(null);
    setError(null);
    
    // Add overlay for element selection
    const overlay = document.createElement('div');
    overlay.className = 'visual-agent-selection-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10000;
      cursor: crosshair;
      pointer-events: all;
    `;
    
    const highlight = document.createElement('div');
    highlight.className = 'visual-agent-highlight';
    highlight.style.cssText = `
      position: absolute;
      border: 2px solid #007acc;
      background: rgba(0, 122, 204, 0.1);
      pointer-events: none;
      z-index: 10001;
      transition: all 0.1s ease;
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(highlight);

    let currentTarget: HTMLElement | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === overlay || target === highlight) return;

      currentTarget = target;
      const rect = target.getBoundingClientRect();
      
      highlight.style.left = rect.left + 'px';
      highlight.style.top = rect.top + 'px';
      highlight.style.width = rect.width + 'px';
      highlight.style.height = rect.height + 'px';
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (currentTarget) {
        const elementInfo = VisualCodingAgentService.extractElementInfo(currentTarget);
        const boundingRect = currentTarget.getBoundingClientRect();
        
        setSelectedElement({
          element: elementInfo,
          boundingRect
        });
      }
      
      cleanup();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
      }
    };

    const cleanup = () => {
      setIsSelecting(false);
      overlay.remove();
      highlight.remove();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleEscape);
    };

    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleEscape);
  };

  const processDesignRequest = async () => {
    if (!service || !selectedElement || !description.trim()) {
      setError('Please select an element and provide a description');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResponse(null);

    try {
      const request: DesignRequest = {
        description: description.trim(),
        selectedElement: selectedElement.element,
        framework: 'react', // Detected from the project
        stylingSystem: 'vanilla-css', // Based on the current setup
        filePath: 'src/App.tsx' // Default for now
      };

      const result = await service.processDesignRequest(request);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyChanges = async (changes: any[]) => {
    // This would integrate with your file system or editor
    // For now, we'll just show the changes
    console.log('Applying changes:', changes);
    alert('Changes would be applied here. Check console for details.');
  };

  const clearSelection = () => {
    setSelectedElement(null);
    setResponse(null);
    setError(null);
  };

  if (isInitializing) {
    return (
      <div className="visual-agent-container">
        <div className="visual-agent-header">
          <h2>Visual Coding Agent</h2>
          {onClose && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>
        <div className="visual-agent-loading">
          <div className="spinner"></div>
          <p>Initializing Visual Coding Agent...</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="visual-agent-container">
        <div className="visual-agent-header">
          <h2>Visual Coding Agent</h2>
          {onClose && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>
        <div className="visual-agent-error">
          <p>Agent not initialized</p>
          {error && <p className="error-message">{error}</p>}
          <button onClick={initializeService} className="retry-button">
            Retry Initialization
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="visual-agent-container">
      <div className="visual-agent-header">
        <h2>Visual Coding Agent</h2>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>

      <div className="visual-agent-content">
        {/* Welcome Message */}
        {!selectedElement && !response && (
          <div className="welcome-section">
            <h3>🎨 Welcome to Visual Coding Agent!</h3>
            <p>Transform any UI element using natural language. Here's how:</p>
            <ol>
              <li><strong>Navigate</strong> to any webpage in the browser above</li>
              <li><strong>Select an element</strong> by clicking the button below</li>
              <li><strong>Describe your changes</strong> in plain English</li>
              <li><strong>Get AI-powered code suggestions</strong> instantly!</li>
            </ol>
            <div className="example-requests">
              <h4>Try requests like:</h4>
              <ul>
                <li>"Make this button bigger and blue"</li>
                <li>"Add more spacing around this text"</li>
                <li>"Make this look more modern"</li>
                <li>"Change the font to be bold"</li>
              </ul>
            </div>
          </div>
        )}

        {/* Element Selection */}
        <div className="selection-section">
          <h3>1. Select Element</h3>
          <div className="selection-controls">
            <button 
              className={`select-button ${isSelecting ? 'selecting' : ''}`}
              onClick={startElementSelection}
              disabled={isSelecting || isProcessing}
            >
              {isSelecting ? '🎯 Selecting... (ESC to cancel)' : '🖱️ Select Element'}
            </button>
            {selectedElement && (
              <button 
                className="clear-button"
                onClick={clearSelection}
                disabled={isProcessing}
              >
                Clear Selection
              </button>
            )}
          </div>
          
          {/* Select Mode Indicator */}
          {isSelecting && !selectedElement && (
            <div className="select-mode-indicator">
              <div className="indicator-content">
                <span className="indicator-icon">🎯</span>
                <div className="indicator-text">
                  <strong>Select Mode Active</strong>
                  <p>Click on any element in the webpage to select it. Press ESC to cancel.</p>
                </div>
              </div>
            </div>
          )}
          
          {selectedElement && (
            <div className="selected-element-info">
              <h4>Selected: {selectedElement.element.tagName}</h4>
              <div className="element-details">
                {selectedElement.element.id && (
                  <span className="element-id">#{selectedElement.element.id}</span>
                )}
                {selectedElement.element.classes.length > 0 && (
                  <span className="element-classes">
                    .{selectedElement.element.classes.join('.')}
                  </span>
                )}
                {selectedElement.element.textContent && (
                  <span className="element-text">
                    "{selectedElement.element.textContent.substring(0, 50)}..."
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Description Input */}
        <div className="description-section">
          <h3>2. Describe Changes</h3>
          <textarea
            className="description-input"
            placeholder="Describe what you want to change about this element... (e.g., 'make this button bigger and more prominent', 'change the color to blue', 'add more spacing around this text')"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isProcessing}
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        <div className="action-section">
          <button
            className="process-button"
            onClick={processDesignRequest}
            disabled={!selectedElement || !description.trim() || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Generate Changes'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-section">
            <p className="error-message">{error}</p>
          </div>
        )}

        {/* Results */}
        {response && (
          <div className="results-section">
            <h3>Suggested Changes</h3>
            
            <div className="confidence-indicator">
              <span>Confidence: {Math.round(response.confidence * 100)}%</span>
            </div>

            <div className="explanation">
              <h4>Explanation</h4>
              <p>{response.explanation}</p>
            </div>

            {response.designPrinciples && response.designPrinciples.length > 0 && (
              <div className="design-principles">
                <h4>Design Principles</h4>
                <ul>
                  {response.designPrinciples.map((principle, index) => (
                    <li key={index}>{principle}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="changes-list">
              <h4>Code Changes</h4>
              {response.changes.map((change, index) => (
                <div key={index} className="change-item">
                  <div className="change-header">
                    <span className="file-path">{change.filePath}</span>
                    <span className={`change-type ${change.changeType}`}>
                      {change.changeType}
                    </span>
                  </div>
                  <div className="change-reasoning">{change.reasoning}</div>
                  <div className="change-preview">
                    <button
                      className="toggle-preview"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? 'Hide' : 'Show'} Code Preview
                    </button>
                    {showPreview && (
                      <div className="code-diff">
                        <div className="old-code">
                          <h5>Before:</h5>
                          <pre><code>{change.oldContent}</code></pre>
                        </div>
                        <div className="new-code">
                          <h5>After:</h5>
                          <pre><code>{change.newContent}</code></pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {response.alternatives && response.alternatives.length > 0 && (
              <div className="alternatives-section">
                <h4>Alternative Approaches</h4>
                {response.alternatives.map((alt, index) => (
                  <div key={index} className="alternative-item">
                    <h5>{alt.description}</h5>
                    <p className="tradeoffs">{alt.tradeoffs}</p>
                    <span className="alt-confidence">
                      Confidence: {Math.round(alt.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="apply-section">
              <button
                className="apply-button"
                onClick={() => applyChanges(response.changes)}
              >
                Apply Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisualCodingAgent;
