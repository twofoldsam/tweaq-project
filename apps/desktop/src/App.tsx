import { useState, useEffect, useRef } from 'react';
import './App.css';
import { GitHubSettings } from './components/GitHubSettings';
import { LeftToolbar, ToolbarMode } from './components/LeftToolbar';
import { LeftPanel } from './components/LeftPanel';

interface PageState {
  url: string;
  title: string;
  loading: boolean;
  error: string | undefined;
  favicon?: string;
  httpStatus?: number;
  loadTime?: number;
}

function App() {
  const [pageState, setPageState] = useState<PageState>({
    url: '',
    title: '',
    loading: false,
    error: undefined
  });
  const [urlInput, setUrlInput] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false); // Track if user has navigated
  const [panelWidth, setPanelWidth] = useState(320); // Track QA panel width (default)
  const [toolbarMode, setToolbarMode] = useState<ToolbarMode>('chat'); // Current toolbar mode
  const [isPanelVisible, setIsPanelVisible] = useState(true); // Panel visibility
  const [githubAuthState, setGithubAuthState] = useState<{
    isAuthenticated: boolean;
    user: GitHubUser | null;
    loading: boolean;
  }>({
    isAuthenticated: false,
    user: null,
    loading: true
  });
  const loadStartTime = useRef<number>(0);

  useEffect(() => {
    // Send initial panel width to Electron on mount
    window.electronAPI.updatePanelWidth(panelWidth);
    
    // Initialize current URL
    window.electronAPI.getCurrentUrl().then(url => {
      setPageState(prev => ({ ...prev, url }));
      setUrlInput(url);
      // Check if we have a URL that's not the default
      if (url && url !== 'https://www.google.com' && url !== 'about:blank' && url !== '') {
        setHasNavigated(true);
      }
    });

    // Initialize GitHub authentication state
    const checkGithubAuth = async () => {
      try {
        // First check if we're authenticated (this will also try to load stored token)
        const authenticated = await window.electronAPI.githubIsAuthenticated();
        
        if (authenticated) {
          // If authenticated, get the user info from the stored token
          const result = await window.electronAPI.githubLoadStoredToken();
          if (result.success && result.user) {
            setGithubAuthState({
              isAuthenticated: true,
              user: result.user,
              loading: false
            });
            console.log('GitHub authentication restored from stored credentials');
          } else {
            // Authentication failed, clear state
            setGithubAuthState({
              isAuthenticated: false,
              user: null,
              loading: false
            });
          }
        } else {
          setGithubAuthState({
            isAuthenticated: false,
            user: null,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error checking GitHub auth:', error);
        setGithubAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    };

    checkGithubAuth();

    // Listen for panel width changes
    const cleanupPanelWidth = window.electronAPI.onPanelWidthChanged?.((width) => {
      setPanelWidth(width);
    });

    // Update navigation state
    const updateNavigationState = async () => {
      const [back, forward] = await Promise.all([
        window.electronAPI.canGoBack(),
        window.electronAPI.canGoForward()
      ]);
      setCanGoBack(back);
      setCanGoForward(forward);
    };

    updateNavigationState();

    // Set up event listeners
    const cleanupNavigation = window.electronAPI.onPageNavigation((data) => {
      setPageState(prev => ({ ...prev, url: data.url }));
      setUrlInput(data.url);
      updateNavigationState();
    });

    const cleanupLoading = window.electronAPI.onPageLoading((loading) => {
      if (loading) {
        loadStartTime.current = Date.now();
      }
      setPageState(prev => ({ 
        ...prev, 
        loading,
        error: loading ? undefined : prev.error // Clear error when starting new load
      }));
    });

    const cleanupLoaded = window.electronAPI.onPageLoaded((data) => {
      const loadTime = loadStartTime.current ? Date.now() - loadStartTime.current : 0;
      
      setPageState(prev => ({ 
        ...prev, 
        url: data.url,
        title: data.title,
        loading: data.loading,
        loadTime,
        error: undefined
      }));
      
      setUrlInput(data.url);
      updateNavigationState();
      
      // Try to get favicon
      const favicon = `${new URL(data.url).origin}/favicon.ico`;
      setPageState(prev => ({ ...prev, favicon }));
    });

    const cleanupError = window.electronAPI.onPageError((data) => {
      setPageState(prev => ({ 
        ...prev, 
        url: data.url,
        loading: data.loading,
        error: data.error
      }));
      updateNavigationState();
    });


    // Cleanup listeners on unmount
    return () => {
      cleanupNavigation();
      cleanupLoading();
      cleanupLoaded();
      cleanupError();
      if (cleanupPanelWidth) cleanupPanelWidth();
    };
  }, []);

  const handleNavigate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const result = await window.electronAPI.navigate(urlInput.trim());
    if (!result.success && result.error) {
      setPageState(prev => ({ 
        ...prev, 
        error: result.error,
        loading: false 
      }));
    } else {
      setHasNavigated(true); // Mark that user has navigated
    }
  };

  const handleBack = () => {
    window.electronAPI.goBack();
  };

  const handleForward = () => {
    window.electronAPI.goForward();
  };

  const handleReload = () => {
    window.electronAPI.reload();
  };

  const formatLoadTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const handleModeChange = async (mode: ToolbarMode) => {
    setToolbarMode(mode);
    setIsPanelVisible(true); // Show panel when mode changes
    
    // Send mode change to BrowserView overlay
    try {
      await window.electronAPI.overlaySetMode(mode);
    } catch (error) {
      console.error('Failed to set overlay mode:', error);
    }
  };

  const handlePanelWidthChange = (width: number) => {
    setPanelWidth(width);
    // Notify main process of width change
    window.electronAPI.updatePanelWidth(width);
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div 
      className={`app qa-mode ${!hasNavigated ? 'initial-state' : ''}`}
      style={{
        '--panel-width': `${panelWidth}px`
      } as React.CSSProperties}
    >
      {/* Left toolbar and panel */}
      <LeftToolbar
        currentMode={toolbarMode}
        onModeChange={handleModeChange}
        onSettingsClick={handleSettingsClick}
      />
      <LeftPanel
        mode={toolbarMode}
        width={panelWidth}
        onWidthChange={handlePanelWidthChange}
        visible={isPanelVisible && !showSettings}
      />
      
      {hasNavigated && (
      <header className="toolbar" style={{ marginLeft: `calc(56px + ${panelWidth}px + 24px)` }}>
        <div className="navigation-controls">
          <button 
            className="nav-button" 
            onClick={handleBack}
            disabled={!canGoBack || showSettings}
            title="Go back"
          >
            ←
          </button>
          <button 
            className="nav-button" 
            onClick={handleForward}
            disabled={!canGoForward || showSettings}
            title="Go forward"
          >
            →
          </button>
          <button 
            className="nav-button" 
            onClick={handleReload}
            disabled={showSettings}
            title="Reload"
          >
            ↻
          </button>
        </div>

        {!showSettings && (
          <>
            <form className="url-bar" onSubmit={handleNavigate}>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URL..."
                className="url-input"
              />
              <button type="submit" className="go-button">Go</button>
            </form>
          </>
        )}

        {showSettings && (
          <div className="settings-title">
            <h1>Settings</h1>
          </div>
        )}

        <div className="status-area">
          {!showSettings && (
            <>
              {pageState.favicon && (
                <img 
                  src={pageState.favicon} 
                  alt="favicon" 
                  className="favicon"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              
              {pageState.loading && (
                <div className="loading-indicator" title="Loading...">
                  <div className="spinner"></div>
                </div>
              )}
              
              {pageState.error && (
                <div className="error-indicator" title={pageState.error}>
                  ⚠️
                </div>
              )}
              
              {!pageState.loading && !pageState.error && pageState.loadTime && (
                <div className="load-time" title="Page load time">
                  {formatLoadTime(pageState.loadTime)}
                </div>
              )}
              
              {pageState.title && (
                <div className="page-title" title={pageState.title}>
                  {pageState.title}
                </div>
              )}
            </>
          )}
        </div>
      </header>
      )}
      
      {!hasNavigated && !showSettings && (
        <div className="initial-center">
          <form className="centered-url-bar" onSubmit={handleNavigate}>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL to start browsing..."
              className="centered-url-input"
              autoFocus
            />
            <button type="submit" className="centered-go-button">Go</button>
          </form>
        </div>
      )}
      
      
      <main className="content" style={{ marginLeft: `calc(56px + ${panelWidth}px + 24px)` }}>
        {showSettings && (
          <GitHubSettings 
            authState={githubAuthState}
            onAuthStateChange={setGithubAuthState}
          />
        )}
      </main>
    </div>
  );
}

export default App;