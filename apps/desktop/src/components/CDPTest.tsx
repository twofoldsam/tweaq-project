import React, { useState } from 'react';
import './CDPTest.css';

interface CDPTestProps {
  // Optional props can be added here
}

const CDPTest: React.FC<CDPTestProps> = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCollectSignals = async () => {
    setIsCollecting(true);
    setError(null);
    
    try {
      // First ensure CDP is injected
      const injectResult = await window.electronAPI.injectCDP();
      if (!injectResult.success) {
        throw new Error(injectResult.error || 'Failed to inject CDP');
      }

      // Collect runtime signals
      const result = await window.electronAPI.collectRuntimeSignals();
      if (result.success && result.data) {
        setLastResult(result.data);
        
        // Log to console for easy inspection
        console.log('=== CDP Runtime Signals ===');
        console.log('Node Snapshot:', result.data.nodeSnapshot);
        console.log('Source Maps:', result.data.sourcemaps);
        
        // Log source map URLs specifically as requested
        if (result.data.sourcemaps.length > 0) {
          console.log('=== Source Map URLs ===');
          result.data.sourcemaps.forEach((sm, index) => {
            console.log(`${index + 1}. ${sm.url}`);
          });
        } else {
          console.log('No source maps found on current page');
        }
      } else {
        throw new Error(result.error || 'Failed to collect runtime signals');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('CDP Error:', errorMessage);
    } finally {
      setIsCollecting(false);
    }
  };

  const formatNodeSnapshot = (snapshot: any) => {
    if (!snapshot) return 'No element selected';
    
    return (
      <div className="node-snapshot">
        <div><strong>Tag:</strong> {snapshot.tagName}</div>
        <div><strong>Classes:</strong> {snapshot.classes.join(', ') || 'none'}</div>
        <div><strong>Role:</strong> {snapshot.role || 'none'}</div>
        <div><strong>Accessible Name:</strong> {snapshot.accessibleName || 'none'}</div>
        <div><strong>Inner Text Hash:</strong> {snapshot.innerTextHash}</div>
        <div><strong>Attributes:</strong> {Object.keys(snapshot.attributes).length} attributes</div>
        <div><strong>Position:</strong> ({snapshot.boundingRect?.x}, {snapshot.boundingRect?.y})</div>
        <div><strong>Size:</strong> {snapshot.boundingRect?.width} × {snapshot.boundingRect?.height}</div>
      </div>
    );
  };

  return (
    <div className="cdp-test">
      <h3>CDP Runtime Signals Test</h3>
      <p>
        This tool collects runtime information about the selected element and available source maps.
        Click the button below to collect signals from the current page.
      </p>
      
      <button 
        onClick={handleCollectSignals} 
        disabled={isCollecting}
        className="collect-button"
      >
        {isCollecting ? 'Collecting...' : 'Collect Runtime Signals'}
      </button>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {lastResult && (
        <div className="results">
          <h4>Last Collection Results:</h4>
          
          <div className="result-section">
            <h5>Selected Element:</h5>
            {formatNodeSnapshot(lastResult.nodeSnapshot)}
          </div>

          <div className="result-section">
            <h5>Source Maps Found: {lastResult.sourcemaps.length}</h5>
            {lastResult.sourcemaps.length > 0 ? (
              <ul className="sourcemap-list">
                {lastResult.sourcemaps.map((sm: any, index: number) => (
                  <li key={index} className="sourcemap-item">
                    <div><strong>URL:</strong> {sm.url}</div>
                    {sm.sources && (
                      <div><strong>Sources:</strong> {sm.sources.length} files</div>
                    )}
                    {sm.mappings && (
                      <div><strong>Mappings:</strong> {sm.mappings.length} characters</div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No source maps found on the current page.</p>
            )}
          </div>

          <div className="result-section">
            <h5>Raw Data (check console for full details):</h5>
            <pre className="raw-data">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CDPTest;
