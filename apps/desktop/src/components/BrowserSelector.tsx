import { useState, useEffect } from 'react';
import './BrowserSelector.css';

export type BrowserEngine = 'chromium' | 'edge' | 'firefox' | 'webkit';

export interface BrowserEngineConfig {
  engine: BrowserEngine;
  displayName: string;
  emoji: string;
  supportsEditing: boolean;
  supportsCDP: boolean;
  canInjectScripts: boolean;
  userAgent: string;
}

interface BrowserSelectorProps {
  disabled?: boolean;
}

export function BrowserSelector({ disabled = false }: BrowserSelectorProps) {
  const [currentEngine, setCurrentEngine] = useState<BrowserEngine>('chromium');
  const [availableEngines, setAvailableEngines] = useState<BrowserEngineConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<BrowserEngineConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load available engines
    const loadEngines = async () => {
      try {
        const { engines } = await window.electronAPI.browserGetAvailableEngines();
        setAvailableEngines(engines);

        const { engine } = await window.electronAPI.browserGetCurrentEngine();
        setCurrentEngine(engine);

        const config = await window.electronAPI.browserGetEngineConfig(engine);
        setCurrentConfig(config);
      } catch (error) {
        console.error('Error loading browser engines:', error);
      }
    };

    loadEngines();

    // Listen for browser engine changes
    const cleanup = window.electronAPI.onBrowserEngineChanged((data) => {
      setCurrentEngine(data.engine);
      setCurrentConfig(data.config);
      setIsLoading(false);
    });

    return cleanup;
  }, []);

  const handleBrowserChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEngine = e.target.value as BrowserEngine;
    
    if (newEngine === currentEngine) return;

    setIsLoading(true);
    
    try {
      const result = await window.electronAPI.browserSwitchEngine(newEngine);
      
      if (!result.success) {
        console.error('Failed to switch browser:', result.error);
        alert(`Failed to switch browser: ${result.error}`);
        setIsLoading(false);
      } else {
        // Ensure loading state is cleared after a short delay
        // The onBrowserEngineChanged event should also clear it, but this is a safety net
        setTimeout(() => {
          setIsLoading(false);
        }, 100);
      }
    } catch (error) {
      console.error('Error switching browser:', error);
      alert(`Error switching browser: ${error}`);
      setIsLoading(false);
    }
  };

  const handleLaunchTrueBrowser = async () => {
    if (!currentConfig || !currentConfig.supportsTrueBrowser) return;

    const engine = currentEngine as 'firefox' | 'webkit';
    const currentUrl = window.location.href; // Get current page URL

    try {
      const result = await window.electronAPI.playwrightLaunchTrueBrowser({
        engine,
        url: currentUrl
      });

      if (result.success) {
        alert(`✅ Launched true ${currentConfig.displayName} browser in separate window!`);
      } else {
        alert(`❌ Failed to launch: ${result.error}`);
      }
    } catch (error) {
      console.error('Error launching true browser:', error);
      alert(`❌ Error: ${error}`);
    }
  };

  const getCapabilityBadge = () => {
    if (!currentConfig) return null;

    if (currentConfig.supportsEditing && currentConfig.supportsCDP) {
      return <span className="capability-badge full-editing" title="Full editing support with CDP">✅ Full Editing</span>;
    } else if (currentConfig.supportsEditing && !currentConfig.supportsTrueBrowser) {
      return <span className="capability-badge limited-editing" title="Script injection editing (Chromium rendering)">⚠️ Emulated</span>;
    } else if (currentConfig.supportsTrueBrowser) {
      return (
        <>
          <span className="capability-badge limited-editing" title="Emulated in Chromium">⚠️ Emulated</span>
          <button 
            className="true-browser-button"
            onClick={handleLaunchTrueBrowser}
            title={`Launch true ${currentConfig.displayName} browser`}
          >
            🚀 Launch True Browser
          </button>
        </>
      );
    } else {
      return <span className="capability-badge read-only" title="View only mode">👁️ View Only</span>;
    }
  };

  return (
    <div className="browser-selector-container">
      <select 
        className={`browser-selector ${isLoading ? 'loading' : ''}`}
        value={currentEngine}
        onChange={handleBrowserChange}
        disabled={disabled || isLoading}
        title="Select browser engine"
      >
        {availableEngines.map((engine) => (
          <option key={engine.engine} value={engine.engine}>
            {engine.emoji} {engine.displayName}
          </option>
        ))}
      </select>
      {isLoading && <span className="loading-indicator">⏳</span>}
      {!isLoading && getCapabilityBadge()}
    </div>
  );
}

