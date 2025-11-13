import { useState, useEffect, useRef } from 'react';
import './App.css';
import { GitHubSettings } from './components/GitHubSettings';
import { LeftToolbar, ToolbarMode } from './components/LeftToolbar';
import { LeftPanel } from './components/LeftPanel';
import { SessionPanel } from './components/SessionPanel';
import { SessionCreationModal, JoinSessionModal } from './components/SessionModals';
import { SessionReportModal } from './components/SessionReportModal';
import { ReportPage } from './components/ReportPage';
import { getSessionService } from './services/SessionService';

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
  const [tweaqCount, setTweaqCount] = useState(0); // Track number of recorded tweaqs
  const [isCommentModeActive, setIsCommentModeActive] = useState(true); // Comment mode toggle state
  const [githubAuthState, setGithubAuthState] = useState<{
    isAuthenticated: boolean;
    user: GitHubUser | null;
    loading: boolean;
  }>({
    isAuthenticated: false,
    user: null,
    loading: true
  });
  
  // Session management state
  const [sessionState, setSessionState] = useState<{
    sessionId: string | null;
    shareLink: string | null;
    homeUrl: string | null;
    isOwner: boolean;
    participants: Array<{ id: string; name: string; color: string; joinedAt: number }>;
  }>({
    sessionId: null,
    shareLink: null,
    homeUrl: null,
    isOwner: false,
    participants: []
  });
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showJoinSessionModal, setShowJoinSessionModal] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [showSessionReportModal, setShowSessionReportModal] = useState(false);
  const [sessionReport, setSessionReport] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportPage, setShowReportPage] = useState(false);
  const [reportReadyNotification, setReportReadyNotification] = useState<{sessionId: string; report: any} | null>(null);
  const [completedSessions, setCompletedSessions] = useState<Array<{
    id: string;
    homeUrl: string;
    createdAt: number;
    endedAt?: number;
    commentCount: number;
    participantCount: number;
    ownerId: string;
  }>>([]);
  const [selectedCompletedSessionId, setSelectedCompletedSessionId] = useState<string | null>(null);
  const [viewingCompletedSession, setViewingCompletedSession] = useState<{
    sessionId: string;
    homeUrl: string;
    comments: any[];
  } | null>(null);

  // Hide BrowserView when modals are open
  useEffect(() => {
    if (showCreateSessionModal || showJoinSessionModal || showSessionReportModal) {
      window.electronAPI.toggleModal(true);
    } else {
      window.electronAPI.toggleModal(false);
    }
  }, [showCreateSessionModal, showJoinSessionModal, showSessionReportModal]);
  
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

    // Check for existing session state
    const checkSessionState = async () => {
      try {
        // Session state is managed in renderer via SessionService
        // We'll check WebSocket connection status instead
        const sessionService = getSessionService();
        if (sessionService.isConnected()) {
          // Session is active, but we need to get session info from service
          // This will be handled when we restore session state
        }
      } catch (error) {
        console.error('Error checking session state:', error);
      }
    };

    checkSessionState();

    // Set up session event listeners (these are now handled via SessionService in renderer)
    // The IPC events are no longer needed since WebSocket is in renderer

    // Handle session link received from protocol handler
    const unsubscribeSessionLink = window.electronAPI.onSessionLinkReceived?.((sessionId) => {
      console.log('🔗 Session link received:', sessionId);
      // Store session ID to pre-fill the modal
      (window as any).pendingSessionId = sessionId;
      // Hide browser view and show join modal
      window.electronAPI.toggleModal(true);
      setShowJoinSessionModal(true);
    });

    // Fetch initial tweaq count once
    const fetchInitialTweaqCount = async () => {
      try {
        const result = await window.electronAPI.overlayGetRecordedEdits();
        if (result.success && result.edits) {
          const count = result.edits.length;
          console.log('📊 Initial tweaq count:', count);
          setTweaqCount(count);
        }
      } catch (error) {
        console.error('Failed to fetch initial tweaq count:', error);
      }
    };

    fetchInitialTweaqCount();

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
      unsubscribeSessionLink?.();
    };
  }, []);

  // Listen for comments added in the overlay and send to session manager
  useEffect(() => {
    const handleCommentAdded = (comment: any) => {
      console.log('💬 Comment added in overlay:', comment);
      
      // If there's an active session, send the comment to the session manager
      if (sessionState.sessionId) {
        const sessionService = getSessionService();
        sessionService.addComment({
          elementSelector: comment.selector,
          elementName: comment.elementName,
          text: comment.text,
          url: comment.url, // Include URL
          position: comment.position,
          textContent: comment.textContent
        });
        console.log(`✅ Comment sent to session manager for URL: ${comment.url}`);
      } else {
        console.log('ℹ️ No active session - comment not sent to server');
      }
    };
    
    // Set up listener if the API exists
    if (window.electronAPI.onOverlayMessage) {
      const cleanup = window.electronAPI.onOverlayMessage('overlay-comment-added', handleCommentAdded);
      return cleanup;
    }
  }, [sessionState.sessionId]);

  // Clear comments when no session is active or selected
  useEffect(() => {
    const clearCommentsIfNeeded = async () => {
      const hasActiveSession = sessionState.sessionId !== null;
      const hasSelectedSession = selectedCompletedSessionId !== null;
      
      if (!hasActiveSession && !hasSelectedSession) {
        console.log('🗑️ No active or selected session - clearing comments from page');
        await window.electronAPI.overlayRemoveAllComments();
      }
    };
    
    clearCommentsIfNeeded();
  }, [sessionState.sessionId, selectedCompletedSessionId]);

  // Update browser view layout when panel visibility changes
  useEffect(() => {
    const showSessionPanel = sessionState.sessionId && sessionState.isOwner;
    const shouldShowSessionPanel = toolbarMode === 'comment' || showSessionPanel;
    const effectivePanelWidth = (toolbarMode === 'comment' || isPanelVisible) ? panelWidth : 0;
    console.log('🔄 Updating BrowserView layout:', { 
      toolbarMode,
      showSessionPanel, 
      shouldShowSessionPanel,
      isPanelVisible, 
      panelWidth, 
      effectivePanelWidth,
      sessionId: sessionState.sessionId,
      isOwner: sessionState.isOwner
    });
    window.electronAPI.updatePanelWidth(effectivePanelWidth, toolbarMode === 'comment' ? false : true);
  }, [sessionState.sessionId, sessionState.isOwner, toolbarMode, isPanelVisible, panelWidth]);

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
    console.log('🔄 handleModeChange called with mode:', mode);
    setToolbarMode(mode);
    // In comment mode, always show the session panel (empty or with data)
    // For other modes, show regular panel unless session panel is active
    const showSessionPanel = sessionState.sessionId && sessionState.isOwner;
    const panelVisible = mode === 'comment' ? true : (showSessionPanel ? true : (mode !== 'comment'));
    setIsPanelVisible(panelVisible);
    
    // Update browser view layout - always use panelWidth in comment mode or when panel is visible
    const effectivePanelWidth = (mode === 'comment' || panelVisible) ? panelWidth : 0;
    window.electronAPI.updatePanelWidth(effectivePanelWidth, mode === 'comment' ? false : true);
    
    // Send mode change to BrowserView overlay
    try {
      console.log('📤 Calling overlaySetMode with:', mode);
      const result = await window.electronAPI.overlaySetMode(mode);
      console.log('📥 overlaySetMode result:', result);
      
      // If entering comment mode, get initial state
      if (mode === 'comment') {
        const state = await window.electronAPI.overlayGetCommentModeState();
        console.log('📊 Comment mode state:', state);
        if (state.success && state.isCommentModeActive !== undefined) {
          setIsCommentModeActive(state.isCommentModeActive);
        }
      } else {
        setIsCommentModeActive(false);
      }
    } catch (error) {
      console.error('❌ Failed to set overlay mode:', error);
    }
  };

  const handleToggleCommentMode = async () => {
    try {
      const result = await window.electronAPI.overlayToggleCommentMode();
      if (result.success && result.isCommentModeActive !== undefined) {
        setIsCommentModeActive(result.isCommentModeActive);
      }
    } catch (error) {
      console.error('Failed to toggle comment mode:', error);
    }
  };

  const handlePanelWidthChange = (width: number) => {
    setPanelWidth(width);
    // Update browser view if session panel OR regular panel is visible
    const showSessionPanel = sessionState.sessionId && sessionState.isOwner;
    const shouldShowSessionPanel = toolbarMode === 'comment' || showSessionPanel;
    if (shouldShowSessionPanel || isPanelVisible) {
      window.electronAPI.updatePanelWidth(width, toolbarMode === 'comment' ? false : true);
    }
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  // Session management handlers
  const handleCreateSession = async (homeUrl: string, ownerName: string) => {
    try {
      console.log('Creating session with:', { homeUrl, ownerName });
      const result = await window.electronAPI.sessionCreate({ homeUrl, ownerName });
      console.log('Session create result:', result);
      
      if (result.success && result.session) {
        // Connect WebSocket in renderer process
        const sessionService = getSessionService();
        await sessionService.joinSession(result.session.id, ownerName, true); // true = isOwner
        
        const newSessionState = {
          sessionId: result.session.id,
          shareLink: result.session.shareLink || `tweaq://session/${result.session.id}`,
          homeUrl: result.session.homeUrl || homeUrl,
          isOwner: sessionService.isSessionOwner(), // Get ownership from service (set by server)
          participants: [{ id: 'owner', name: ownerName, color: '#0A84FF', joinedAt: Date.now() }]
        };
        
        console.log('Setting session state:', newSessionState);
        setSessionState(newSessionState);
        setSessionStartTime(Date.now());
        
        // BrowserView will be updated automatically by useEffect when sessionState changes
        // But ensure immediate update for responsiveness
        console.log('📍 Session created, BrowserView will update via useEffect');
        
        // Set up WebSocket event listeners
        setupSessionEventListeners(sessionService);
        
        // Navigate to home URL
        setUrlInput(homeUrl);
        await window.electronAPI.navigate(homeUrl);
      } else {
        throw new Error(result.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  };

  const handleJoinSession = async (sessionId: string, name: string) => {
    try {
      const result = await window.electronAPI.sessionJoin({ sessionId, name });
      if (result.success) {
        // Connect WebSocket in renderer process
        const sessionService = getSessionService();
        await sessionService.joinSession(sessionId, name);
        
        // Get session info
        const infoResult = await window.electronAPI.sessionGetInfo(sessionId);
        if (infoResult.success && infoResult.session) {
          setSessionState(prev => ({
            ...prev,
            sessionId,
            shareLink: `tweaq://session/${sessionId}`,
            homeUrl: infoResult.session!.homeUrl,
            isOwner: sessionService.isSessionOwner(), // Get ownership from service (set by server)
            participants: []
          }));
          setSessionStartTime(Date.now());
          
          // Set up WebSocket event listeners
          setupSessionEventListeners(sessionService);
          
          // Navigate to session home URL
          setUrlInput(infoResult.session!.homeUrl);
          await window.electronAPI.navigate(infoResult.session!.homeUrl);
        }
      } else {
        throw new Error(result.error || 'Failed to join session');
      }
    } catch (error) {
      console.error('Failed to join session:', error);
      throw error;
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session? All participants will be disconnected.')) {
      return;
    }

    try {
      console.log('🛑 Ending session...');
      const sessionService = getSessionService();
      const currentSessionId = sessionState.sessionId;
      
      console.log(`📤 Sending end-session request for session: ${currentSessionId}`);
      sessionService.endSession();
      
      // Don't disconnect immediately - wait for server to process
      // The disconnect will happen when we receive the session-ended event
      
      const result = await window.electronAPI.sessionEnd();
      if (result.success) {
        console.log('✅ Session end request successful, waiting for session-ended event...');
        // Session state will be cleared when session-ended event fires
      } else {
        console.error('❌ Failed to end session:', result.error);
        alert(result.error || 'Failed to end session');
      }
    } catch (error) {
      console.error('❌ Failed to end session:', error);
      alert('Failed to end session');
    }
  };

  const handleLeaveSession = async () => {
    try {
      const sessionService = getSessionService();
      sessionService.disconnect();
      
      await window.electronAPI.sessionLeave();
      setSessionState({
        sessionId: null,
        shareLink: null,
        homeUrl: null,
        isOwner: false,
        participants: []
      });
      setSessionStartTime(null);
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  };

  // Fetch completed sessions
  const fetchCompletedSessions = async () => {
    try {
      const sessionService = getSessionService();
      const sessions = await sessionService.getCompletedSessions();
      setCompletedSessions(sessions);
      console.log(`📋 Loaded ${sessions.length} completed sessions`);
    } catch (error) {
      console.error('Failed to fetch completed sessions:', error);
    }
  };

  // Handle selecting a completed session
  const handleSelectCompletedSession = async (sessionId: string | null) => {
    if (!sessionId) {
      setSelectedCompletedSessionId(null);
      setViewingCompletedSession(null);
      // Clear comments from overlay
      await window.electronAPI.overlayRemoveAllComments();
      return;
    }

    try {
      const sessionService = getSessionService();
      const sessionInfo = await sessionService.getSessionInfo(sessionId);
      
      setSelectedCompletedSessionId(sessionId);
      setViewingCompletedSession({
        sessionId: sessionInfo.id,
        homeUrl: sessionInfo.homeUrl,
        comments: sessionInfo.comments || []
      });

      // Navigate to session URL
      window.electronAPI.navigate(sessionInfo.homeUrl);
      setUrlInput(sessionInfo.homeUrl);

      // Wait for page to load, then load comments
      setTimeout(async () => {
        try {
          if (sessionInfo.comments && sessionInfo.comments.length > 0) {
            await window.electronAPI.overlayLoadComments(sessionInfo.comments);
            console.log(`✅ Loaded ${sessionInfo.comments.length} comments from session`);
          }
        } catch (error) {
          console.error('❌ Failed to load comments:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to load completed session:', error);
      alert('Failed to load session');
    }
  };

  // Reload comments when navigating to a different page within a viewed session
  useEffect(() => {
    if (!viewingCompletedSession || !viewingCompletedSession.comments.length) {
      return;
    }

    console.log('📋 Setting up page navigation listener for completed session');
    
    const reloadComments = async (url: string) => {
      console.log('🔄 Page changed:', url);
      console.log('   Viewing completed session:', viewingCompletedSession.sessionId);
      console.log('   Total comments in session:', viewingCompletedSession.comments.length);
      
      try {
        // Small delay to ensure page is loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reload comments - the overlay will filter by URL
        await window.electronAPI.overlayLoadComments(viewingCompletedSession.comments);
        console.log('✅ Comments reloaded for new page');
      } catch (error) {
        console.error('❌ Failed to reload comments:', error);
      }
    };
    
    // Listen for both page navigation and page load events
    const cleanupNavigation = window.electronAPI.onPageNavigation((data) => {
      reloadComments(data.url);
    });
    
    const cleanupLoaded = window.electronAPI.onPageLoaded((data) => {
      reloadComments(data.url);
    });

    return () => {
      cleanupNavigation();
      cleanupLoaded();
    };
  }, [viewingCompletedSession]);

  // Handle viewing report for a completed session
  const handleViewReport = async (sessionId: string) => {
    try {
      setIsGeneratingReport(true);
      const sessionService = getSessionService();
      const report = await sessionService.getSessionReport(sessionId);
      
      setSessionReport(report);
      setShowReportPage(true);
      setIsGeneratingReport(false);
    } catch (error) {
      setIsGeneratingReport(false);
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    }
  };

  // Handle clicking on a comment in the panel
  const handleCommentClick = async (comment: any) => {
    console.log('📍 Comment clicked:', comment);
    
    // Check if we need to navigate to a different page
    const currentUrl = pageState.url;
    const commentUrl = comment.url;
    
    if (currentUrl !== commentUrl) {
      console.log(`🔄 Navigating from ${currentUrl} to ${commentUrl}`);
      
      // Navigate to the comment's page
      await window.electronAPI.navigate(commentUrl);
      setUrlInput(commentUrl);
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Scroll to and expand the comment
    try {
      await window.electronAPI.overlayScrollToComment(comment.id);
      console.log('✅ Scrolled to and expanded comment');
    } catch (error) {
      console.error('❌ Failed to scroll to comment:', error);
    }
  };

  // Set up WebSocket event listeners
  const setupSessionEventListeners = (sessionService: ReturnType<typeof getSessionService>) => {
    sessionService.on('participant-joined', (participant) => {
      setSessionState(prev => ({
        ...prev,
        participants: [...prev.participants, participant]
      }));
    });

    sessionService.on('participant-left', (participantId) => {
      setSessionState(prev => ({
        ...prev,
        participants: prev.participants.filter(p => p.id !== participantId)
      }));
    });

    sessionService.on('comment-added', (comment) => {
      // Handle comment added - will integrate with comment system later
      console.log('Comment added:', comment);
    });

    sessionService.on('url-changed', (url) => {
      // Notify main process to navigate
      window.electronAPI.sendOverlayMessage?.('session-url-changed', url);
      setUrlInput(url);
      window.electronAPI.navigate(url);
    });

    sessionService.on('session-ended', async (data) => {
      console.log('📥 Session ended event received');
      console.log('📊 Session data:', {
        sessionId: data.sessionId,
        homeUrl: data.homeUrl,
        commentsCount: data.comments?.length || 0,
        participantsCount: data.participants?.length || 0
      });
      
      const endedSessionId = data.sessionId;
      
      // Clear active session state FIRST so the panel can re-render to show completed sessions
      console.log('🔄 Clearing session state...');
      setSessionState({
        sessionId: null,
        shareLink: null,
        homeUrl: null,
        isOwner: false,
        participants: []
      });
      setSessionStartTime(null);
      console.log('✅ Session state cleared');
      
      // Refresh completed sessions list
      console.log('🔄 Fetching completed sessions...');
      await fetchCompletedSessions();
      console.log('✅ Completed sessions fetched');
      
      // DON'T auto-select the completed session - just show the list
      console.log('✅ Session ended - showing list view');
    });
  };

  // Calculate effective panel width
  // In comment mode, always show session panel (empty or with data)
  // Otherwise, show regular panel or session panel based on state
  const showSessionPanel = sessionState.sessionId && sessionState.isOwner;
  const shouldShowSessionPanel = toolbarMode === 'comment' || showSessionPanel;
  const effectivePanelWidth = (toolbarMode === 'comment' || isPanelVisible) ? panelWidth : 0;

  // If showing report page, render only that
  if (showReportPage && sessionReport) {
    return (
      <ReportPage
        report={sessionReport}
        onClose={() => {
          setShowReportPage(false);
          setSessionReport(null);
        }}
      />
    );
  }

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
        tweaqCount={tweaqCount}
      />
      {/* Show session panel in comment mode, or when session is active */}
      {shouldShowSessionPanel ? (
        <div 
          className="left-panel visible"
          style={{ width: `${panelWidth}px`, left: '56px' }}
        >
          <SessionPanel
            sessionId={sessionState.sessionId || null}
            shareLink={sessionState.shareLink || null}
            homeUrl={sessionState.homeUrl || null}
            participants={sessionState.participants}
            onEndSession={sessionState.sessionId ? handleEndSession : undefined}
            onCopyLink={() => {}}
            onCreateSession={toolbarMode === 'comment' ? () => {
              window.electronAPI.toggleModal(true);
              setShowCreateSessionModal(true);
            } : undefined}
            onJoinSession={toolbarMode === 'comment' ? () => {
              window.electronAPI.toggleModal(true);
              setShowJoinSessionModal(true);
            } : undefined}
            startTime={sessionStartTime || undefined}
            completedSessions={completedSessions}
            selectedCompletedSessionId={selectedCompletedSessionId}
            sessionComments={viewingCompletedSession?.comments || []}
            onSelectCompletedSession={handleSelectCompletedSession}
            onViewReport={handleViewReport}
            onCommentClick={handleCommentClick}
          />
        </div>
      ) : (
        <LeftPanel
          mode={toolbarMode}
          width={panelWidth}
          onWidthChange={handlePanelWidthChange}
          visible={isPanelVisible && !showSettings}
          onTweaqCountChange={setTweaqCount}
        />
      )}
      
      {hasNavigated && (
      <header className="toolbar" style={{ marginLeft: `calc(56px + ${effectivePanelWidth}px + 24px)` }}>
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
              {toolbarMode === 'comment' && (
                <button
                  type="button"
                  className={`comment-mode-toggle ${isCommentModeActive ? 'active' : ''}`}
                  onClick={handleToggleCommentMode}
                  title={isCommentModeActive ? 'Click to navigate (exit comment mode)' : 'Click to add comments'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    {isCommentModeActive ? (
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    ) : (
                      <path d="M3.348 5.706c-.486-1.457.9-2.844 2.358-2.358L18.645 7.66c1.627.543 1.72 2.808.145 3.483l-4.61 1.976 6.35 6.35a.75.75 0 1 1-1.06 1.061l-6.35-6.35-1.977 4.61c-.675 1.576-2.94 1.481-3.482-.145z"/>
                    )}
                  </svg>
                  <span>{isCommentModeActive ? 'Comment' : 'Navigate'}</span>
                </button>
              )}
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
              
              {sessionState.sessionId && (
                <div className="session-indicator" title={`Session: ${sessionState.sessionId}`}>
                  <span className="session-dot"></span>
                  <span>Session Active</span>
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
      
      
      <main className="content" style={{ marginLeft: `calc(56px + ${effectivePanelWidth}px + 24px)` }}>
        {showSettings && (
          <GitHubSettings 
            authState={githubAuthState}
            onAuthStateChange={setGithubAuthState}
          />
        )}
      </main>

      {/* Session Modals */}
      {showCreateSessionModal && (
        <SessionCreationModal
          currentUrl={pageState.url || urlInput}
          onClose={() => {
            setShowCreateSessionModal(false);
            // Show browser view again
            window.electronAPI.toggleModal(false);
          }}
          onCreate={async (homeUrl, ownerName) => {
            await handleCreateSession(homeUrl, ownerName);
            // Show browser view again
            window.electronAPI.toggleModal(false);
          }}
        />
      )}

      {showJoinSessionModal && (
        <JoinSessionModal
          sessionIdFromLink={(window as any).pendingSessionId}
          onClose={() => {
            setShowJoinSessionModal(false);
            // Clear pending session ID
            delete (window as any).pendingSessionId;
            // Show browser view again
            window.electronAPI.toggleModal(false);
          }}
          onJoin={async (sessionId, name) => {
            await handleJoinSession(sessionId, name);
            // Clear pending session ID
            delete (window as any).pendingSessionId;
            // Show browser view again
            window.electronAPI.toggleModal(false);
          }}
        />
      )}

      {showSessionReportModal && sessionReport && (
        <SessionReportModal
          report={sessionReport}
          onClose={() => {
            setShowSessionReportModal(false);
            setSessionReport(null);
            window.electronAPI.toggleModal(false);
          }}
        />
      )}

      {/* Report Generation Loading Overlay */}
      {/* Report Generation Overlay - only shown when generating report on demand */}
      {isGeneratingReport && (
        <div className="report-generation-overlay">
          <div className="report-generation-content">
            <div className="report-generation-spinner"></div>
            <h3>Generating Report</h3>
            <p>Analyzing comments and generating insights...</p>
          </div>
        </div>
      )}

      {/* Report Ready Notification */}
      {reportReadyNotification && (
        <div className="report-ready-notification">
          <div className="report-notification-content">
            <div className="report-notification-icon">✓</div>
            <div className="report-notification-text">
              <strong>Report Ready!</strong>
              <span>Your session report has been generated.</span>
            </div>
            <button
              className="report-notification-button"
              onClick={() => {
                setSessionReport(reportReadyNotification.report);
                setShowReportPage(true);
                setReportReadyNotification(null);
              }}
            >
              View Report
            </button>
            <button
              className="report-notification-close"
              onClick={() => setReportReadyNotification(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;