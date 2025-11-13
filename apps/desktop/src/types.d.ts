type BrowserEngine = 'chromium' | 'edge' | 'firefox' | 'webkit';

interface BrowserEngineConfig {
  engine: BrowserEngine;
  displayName: string;
  emoji: string;
  supportsEditing: boolean;
  supportsCDP: boolean;
  canInjectScripts: boolean;
  userAgent: string;
  supportsTrueBrowser: boolean;
}

interface GitHubConfig {
  owner: string;
  repo: string;
  baseBranch: string;
  label: string;
}

interface VisualEdit {
  id: string;
  timestamp: number;
  element: {
    selector: string;
    tagName: string;
    id: string | undefined;
    className: string | undefined;
  };
  changes: {
    property: string;
    before: string;
    after: string;
  }[];
}

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name?: string;
  email?: string;
}

interface ElectronAPI {
  navigate: (url: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  getCurrentUrl: () => Promise<string>;
  goBack: () => Promise<boolean>;
  goForward: () => Promise<boolean>;
  reload: () => Promise<boolean>;
  canGoBack: () => Promise<boolean>;
  canGoForward: () => Promise<boolean>;
  onPageNavigation: (callback: (data: { url: string }) => void) => () => void;
  onPageLoading: (callback: (loading: boolean) => void) => () => void;
  onPageLoaded: (callback: (data: { url: string; title: string; loading: boolean }) => void) => () => void;
  onPageError: (callback: (data: { url: string; error: string; loading: boolean }) => void) => () => void;
  
  // GitHub API
  githubConnect: () => Promise<{ success: boolean; user?: GitHubUser; error?: string }>;
  githubLoadStoredToken: () => Promise<{ success: boolean; user?: GitHubUser; error?: string }>;
  githubDisconnect: () => Promise<{ success: boolean; error?: string }>;
  githubIsAuthenticated: () => Promise<boolean>;
  githubSaveConfig: (config: GitHubConfig) => Promise<{ success: boolean; error?: string }>;
  githubGetConfig: () => Promise<GitHubConfig | undefined>;
  githubListRepos: () => Promise<{ success: boolean; repos?: Array<{ full_name: string; name: string; owner: string; default_branch: string; private: boolean; description: string; updated_at: string }>; error?: string }>;
  githubTestPR: () => Promise<{ success: boolean; pr?: { url: string; number: number }; error?: string }>;
  toggleSettings: (showSettings: boolean) => Promise<{ success: boolean }>;
  
  // Modal visibility toggle
  toggleModal: (showModal: boolean) => Promise<{ success: boolean }>;
  
  // Overlay API
  toggleOverlay: (options?: { initialMode?: 'measure' | 'edit' }) => Promise<{ success: boolean; error?: string }>;
  updatePanelWidth: (width: number, animated?: boolean) => void;
  onPanelWidthChanged?: (callback: (width: number) => void) => () => void;
  overlaySetMode: (mode: string) => Promise<{ success: boolean; error?: string }>;
  overlayToggleSelectMode: () => Promise<{ success: boolean; error?: string }>;
  overlayToggleCommentMode: () => Promise<{ success: boolean; isCommentModeActive?: boolean; error?: string }>;
  overlayGetCommentModeState: () => Promise<{ success: boolean; isCommentModeActive?: boolean; mode?: string; error?: string }>;
  overlayHighlightElement: (selector: string) => Promise<{ success: boolean; error?: string }>;
  overlayApplyStyle: (selector: string, property: string, value: string) => Promise<{ success: boolean; error?: string }>;
  overlayRecordEdit: (editData: any) => Promise<{ success: boolean; error?: string }>;
  overlayGetRecordedEdits: () => Promise<{ success: boolean; edits?: any[]; error?: string }>;
  overlayDeleteEdit: (index: number) => Promise<{ success: boolean; error?: string }>;
  overlayHighlightEdit: (index: number) => Promise<{ success: boolean; error?: string }>;
  overlayClearHighlight: () => Promise<{ success: boolean; error?: string }>;
  convertCommentsToTweaqs: (commentsData: any[]) => Promise<{ success: boolean; tweaqs?: any[]; error?: string }>;
  overlayGetComments: () => Promise<{ success: boolean; comments?: any[]; error?: string }>;
  overlayRemoveAllComments: () => Promise<{ success: boolean; error?: string }>;
  overlayScrollToComment: (commentId: string) => Promise<{ success: boolean; error?: string }>;
  overlayLoadComments: (commentsData: any[]) => Promise<{ success: boolean; error?: string }>;
  onElementSelected?: (callback: (data: any) => void) => () => void;
  onElementHovered?: (callback: (data: any) => void) => () => void;
  sendOverlayMessage?: (channel: string, data: any) => void;
  onOverlayMessage?: (channel: string, callback: (data: any) => void) => () => void;
  
  // PR Watcher API
  prWatcherStart: (options: { owner: string; repo: string; prNumber: number }) => Promise<{ success: boolean; watcherKey?: string; error?: string }>;
  prWatcherStop: (watcherKey: string) => Promise<{ success: boolean; error?: string }>;
  prWatcherGetPreviews: (watcherKey: string) => Promise<{ success: boolean; previews?: Array<{ url: string; provider: string; status: string; environment?: string }>; error?: string }>;
  showPreviewPane: (previewUrl: string) => Promise<{ success: boolean; error?: string }>;
  hidePreviewPane: () => Promise<{ success: boolean; error?: string }>;
  onPreviewUrlReady: (callback: (data: { prKey: string; preview: any; allPreviews: any[] }) => void) => () => void;
  onPRWatcherError: (callback: (data: { prKey: string; error: string }) => void) => () => void;
  
  // Confirm flow API
  confirmChanges: (changeSet: VisualEdit[]) => Promise<{ success: boolean; pr?: { url: string; number: number }; error?: string }>;
  
  // LLM Configuration API
  llmSaveConfig: (config: { provider: string; apiKey?: string }) => Promise<{ success: boolean; error?: string }>;
  llmGetConfig: () => Promise<{ provider: string; hasApiKey?: boolean }>;
  llmTestConnection: () => Promise<{ success: boolean; message?: string; error?: string }>;
  
  // Environment variables
  getEnvVar: (key: string) => Promise<string | undefined>;
  
  // Visual Coding Agent
  initializeVisualAgent: (config: any) => Promise<{ success: boolean; error?: string }>;
  processVisualRequest: (request: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // Repository Analysis API
  analyzeRepository: () => Promise<{ success: boolean; model?: any; error?: string }>;
  reAnalyzeRepository: () => Promise<{ success: boolean; model?: any; error?: string }>;
  getAnalysisStatus: () => Promise<{ hasAnalysis: boolean; repoId?: string; analyzedAt?: Date; componentsCount?: number; rulesCount?: number }>;

  // Codex API
  codexOpenSetup: () => Promise<{ success: boolean; error?: string }>;
  codexMarkConnected: () => Promise<{ success: boolean; error?: string }>;
  codexGetStatus: () => Promise<{ enabled: boolean; connectedAt: string | null }>;
  
  // Browser Engine Switching API
  browserGetCurrentEngine: () => Promise<{ engine: BrowserEngine }>;
  browserGetAvailableEngines: () => Promise<{ engines: BrowserEngineConfig[] }>;
  browserSwitchEngine: (engine: BrowserEngine) => Promise<{ success: boolean; error?: string }>;
  browserGetEngineConfig: (engine: BrowserEngine) => Promise<BrowserEngineConfig | null>;
  onBrowserEngineChanged: (callback: (data: { engine: BrowserEngine; config: BrowserEngineConfig }) => void) => () => void;
  
  // Playwright True Browser API
  playwrightLaunchTrueBrowser: (data: { engine: 'firefox' | 'webkit'; url?: string }) => Promise<{ success: boolean; error?: string }>;
  playwrightNavigate: (data: { engine: 'firefox' | 'webkit'; url: string }) => Promise<{ success: boolean; error?: string }>;
  playwrightCloseBrowser: (engine: 'firefox' | 'webkit') => Promise<{ success: boolean; error?: string }>;
  
  // Session Management API
  sessionCreate: (data: { homeUrl: string; ownerName?: string }) => Promise<{ success: boolean; session?: any; error?: string }>;
  sessionJoin: (data: { sessionId: string; name: string }) => Promise<{ success: boolean; error?: string }>;
  sessionLeave: () => Promise<{ success: boolean; error?: string }>;
  sessionEnd: () => Promise<{ success: boolean; error?: string }>;
  sessionGetInfo: (sessionId: string) => Promise<{ success: boolean; session?: any; error?: string }>;
  sessionGetReport: (sessionId: string) => Promise<{ success: boolean; report?: any; error?: string }>;
  sessionGetState: () => Promise<{ success: boolean; sessionId?: string; participantId?: string; isOwner?: boolean; isConnected?: boolean; error?: string }>;
  sessionUpdateCursor: (cursor: { x: number; y: number; elementSelector?: string }) => Promise<{ success: boolean; error?: string }>;
  sessionAddComment: (comment: { elementSelector: string; elementName: string; text: string; position: { x: number; y: number } }) => Promise<{ success: boolean; error?: string }>;
  sessionEditComment: (data: { commentId: string; text: string }) => Promise<{ success: boolean; error?: string }>;
  sessionDeleteComment: (commentId: string) => Promise<{ success: boolean; error?: string }>;
  sessionChangeUrl: (url: string) => Promise<{ success: boolean; error?: string }>;
  onSessionParticipantJoined: (callback: (participant: any) => void) => () => void;
  onSessionParticipantLeft: (callback: (participantId: string) => void) => () => void;
  onSessionCommentAdded: (callback: (comment: any) => void) => () => void;
  onSessionCommentEdited: (callback: (comment: any) => void) => () => void;
  onSessionCommentDeleted: (callback: (commentId: string) => void) => () => void;
  onSessionCursorUpdate: (callback: (data: any) => void) => () => void;
  onSessionUrlChanged: (callback: (url: string) => void) => () => void;
  onSessionEnded: (callback: (report: any) => void) => () => void;
  onSessionLinkReceived: (callback: (sessionId: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
