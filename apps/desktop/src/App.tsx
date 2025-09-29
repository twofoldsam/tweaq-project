import { useState, useEffect, useRef } from 'react';
import './App.css';
import { GitHubSettings } from './components/GitHubSettings';
import CDPTest from './components/CDPTest';
import { LLMSettings } from './components/LLMSettings';
import VisualCodingAgent from './components/VisualCodingAgent';

interface PageState {
  url: string;
  title: string;
  loading: boolean;
  error?: string;
  favicon?: string;
  httpStatus?: number;
  loadTime?: number;
}

function App() {
  const [pageState, setPageState] = useState<PageState>({
    url: '',
    title: '',
    loading: false
  });
  const [urlInput, setUrlInput] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'github' | 'cdp' | 'llm' | 'visual-agent'>('visual-agent');
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
    // Initialize current URL
    window.electronAPI.getCurrentUrl().then(url => {
      setPageState(prev => ({ ...prev, url }));
      setUrlInput(url);
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

  return (
    <div className="app">
      <header className="toolbar">
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
        )}

        {showSettings && (
          <div className="settings-title">
            <div className="settings-tabs">
              <button 
                className={`tab-button ${activeTab === 'visual-agent' ? 'active' : ''} primary-tab`}
                onClick={() => setActiveTab('visual-agent')}
              >
                🎨 Visual Agent
              </button>
              <button 
                className={`tab-button ${activeTab === 'github' ? 'active' : ''}`}
                onClick={() => setActiveTab('github')}
              >
                GitHub Settings
              </button>
              <button 
                className={`tab-button ${activeTab === 'llm' ? 'active' : ''}`}
                onClick={() => setActiveTab('llm')}
              >
                LLM Settings
              </button>
              <button 
                className={`tab-button ${activeTab === 'cdp' ? 'active' : ''}`}
                onClick={() => setActiveTab('cdp')}
              >
                CDP Test
              </button>
            </div>
          </div>
        )}

        <div className="status-area">
          {!showSettings && (
            <button 
              className="overlay-button"
              onClick={async () => {
                await window.electronAPI.toggleOverlay({ initialMode: 'measure' });
              }}
              title="Toggle Design Overlay (Ctrl+Shift+I)"
            >
              📐
            </button>
          )}
          
          <button 
            className={`settings-button ${showSettings ? 'active' : ''}`}
            onClick={async () => {
              const newShowSettings = !showSettings;
              setShowSettings(newShowSettings);
              await window.electronAPI.toggleSettings(newShowSettings);
            }}
            title="Visual Coding Agent & Settings"
          >
            ⚙️
          </button>

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
      
      <main className="content">
        {showSettings && activeTab === 'github' && (
          <GitHubSettings 
            authState={githubAuthState}
            onAuthStateChange={setGithubAuthState}
          />
        )}
        {showSettings && activeTab === 'cdp' && <CDPTest />}
        {showSettings && activeTab === 'llm' && <LLMSettings />}
        {showSettings && activeTab === 'visual-agent' && (
          <VisualCodingAgent 
            onClose={() => setShowSettings(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;