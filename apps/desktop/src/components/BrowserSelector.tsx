import { useState, useEffect, useRef } from 'react';
import './BrowserSelector.css';
import chromeIcon from '../assets/browsers/chrome.svg';
import edgeIcon from '../assets/browsers/edge.svg';
import firefoxIcon from '../assets/browsers/firefox.svg';
import safariIcon from '../assets/browsers/safari.svg';

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

const browserIcons: Record<BrowserEngine, string> = {
  chromium: chromeIcon,
  edge: edgeIcon,
  firefox: firefoxIcon,
  webkit: safariIcon,
};

export function BrowserSelector({ disabled = false }: BrowserSelectorProps) {
  const [currentEngine, setCurrentEngine] = useState<BrowserEngine>('chromium');
  const [availableEngines, setAvailableEngines] = useState<BrowserEngineConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<BrowserEngineConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleBrowserChange = async (newEngine: BrowserEngine) => {
    if (newEngine === currentEngine) {
      setIsDropdownOpen(false);
      return;
    }

    setIsLoading(true);
    setIsDropdownOpen(false);
    
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

  return (
    <div className="browser-selector-container" ref={dropdownRef}>
      <button 
        className={`browser-icon-button ${isLoading ? 'loading' : ''}`}
        onClick={() => !disabled && !isLoading && setIsDropdownOpen(!isDropdownOpen)}
        disabled={disabled || isLoading}
        title={`Current browser: ${currentConfig?.displayName || currentEngine}`}
      >
        <img 
          src={browserIcons[currentEngine]} 
          alt={currentConfig?.displayName || currentEngine}
          className="browser-icon"
        />
        {isLoading && <span className="loading-spinner">⏳</span>}
      </button>

      {isDropdownOpen && (
        <div className="browser-dropdown">
          {availableEngines.map((engine) => (
            <button
              key={engine.engine}
              className={`browser-dropdown-item ${engine.engine === currentEngine ? 'active' : ''}`}
              onClick={() => handleBrowserChange(engine.engine)}
            >
              <img 
                src={browserIcons[engine.engine]} 
                alt={engine.displayName}
                className="browser-icon-small"
              />
              <span className="browser-name">{engine.displayName}</span>
              {engine.engine === currentEngine && <span className="checkmark">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

