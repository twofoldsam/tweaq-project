import { contextBridge, ipcRenderer } from 'electron';
import { NodeSnapshot, SourceMapInfo, RuntimeSignals } from './cdp-helper';

// Export CDP types for use in other modules
export { NodeSnapshot, SourceMapInfo, RuntimeSignals };

// Browser Engine types
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

export interface GitHubConfig {
  owner: string;
  repo: string;
  baseBranch: string;
  label: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name?: string;
  email?: string;
}

export interface ElectronAPI {
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
  injectOverlay: (options?: { initialMode?: 'measure' | 'edit' }) => Promise<{ success: boolean; error?: string }>;
  removeOverlay: () => Promise<{ success: boolean; error?: string }>;
  toggleOverlay: (options?: { initialMode?: 'measure' | 'edit' }) => Promise<{ success: boolean; error?: string }>;
  
  // CDP Runtime Signals API
  injectCDP: () => Promise<{ success: boolean; error?: string }>;
  collectRuntimeSignals: (options?: { x?: number; y?: number }) => Promise<{ success: boolean; data?: RuntimeSignals; error?: string }>;
  
  // PR Watcher API
  prWatcherStart: (options: { owner: string; repo: string; prNumber: number }) => Promise<{ success: boolean; watcherKey?: string; error?: string }>;
  prWatcherStop: (watcherKey: string) => Promise<{ success: boolean; error?: string }>;
  prWatcherGetPreviews: (watcherKey: string) => Promise<{ success: boolean; previews?: Array<{ url: string; provider: string; status: string; environment?: string }>; error?: string }>;
  showPreviewPane: (previewUrl: string) => Promise<{ success: boolean; error?: string }>;
  hidePreviewPane: () => Promise<{ success: boolean; error?: string }>;
  onPreviewUrlReady: (callback: (data: { prKey: string; preview: any; allPreviews: any[] }) => void) => () => void;
  onPRWatcherError: (callback: (data: { prKey: string; error: string }) => void) => () => void;
  
  // Confirm changes API
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
  
  // Agent V4 - Visual Edits to PR
  triggerAgentV4: (data: { edits: any[]; url: string }) => Promise<{ success: boolean; pr?: { url: string; number: number }; error?: string }>;
  
  // Conversational Intelligence API
  analyzeConversationMessage: (data: { message: string; conversationState?: any }) => Promise<{ success: boolean; analysis?: any; error?: string }>;
  
  // Comments to Tweaqs Conversion API
  convertCommentsToTweaqs: (commentsData: any[]) => Promise<{ success: boolean; tweaqs?: any[]; error?: string }>;
  
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

export interface VisualEdit {
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

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (url: string) => ipcRenderer.invoke('navigate', url),
  
  getCurrentUrl: () => ipcRenderer.invoke('get-current-url'),
  
  goBack: () => ipcRenderer.invoke('go-back'),
  
  goForward: () => ipcRenderer.invoke('go-forward'),
  
  reload: () => ipcRenderer.invoke('reload'),
  
  canGoBack: () => ipcRenderer.invoke('can-go-back'),
  
  canGoForward: () => ipcRenderer.invoke('can-go-forward'),
  
  onPageNavigation: (callback: (data: { url: string }) => void) => {
    const listener = (_event: any, data: { url: string }) => callback(data);
    ipcRenderer.on('page-navigation', listener);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('page-navigation', listener);
    };
  },
  
  onPageLoading: (callback: (loading: boolean) => void) => {
    const listener = (_event: any, loading: boolean) => callback(loading);
    ipcRenderer.on('page-loading', listener);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('page-loading', listener);
    };
  },
  
  onPageLoaded: (callback: (data: { url: string; title: string; loading: boolean }) => void) => {
    const listener = (_event: any, data: { url: string; title: string; loading: boolean }) => callback(data);
    ipcRenderer.on('page-loaded', listener);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('page-loaded', listener);
    };
  },
  
  onPageError: (callback: (data: { url: string; error: string; loading: boolean }) => void) => {
    const listener = (_event: any, data: { url: string; error: string; loading: boolean }) => callback(data);
    ipcRenderer.on('page-error', listener);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('page-error', listener);
    };
  },

  // GitHub API implementations
  githubConnect: () => ipcRenderer.invoke('github-connect'),
  githubLoadStoredToken: () => ipcRenderer.invoke('github-load-stored-token'),
  githubDisconnect: () => ipcRenderer.invoke('github-disconnect'),
  githubIsAuthenticated: () => ipcRenderer.invoke('github-is-authenticated'),
  githubSaveConfig: (config: GitHubConfig) => ipcRenderer.invoke('github-save-config', config),
  githubGetConfig: () => ipcRenderer.invoke('github-get-config'),
  githubListRepos: () => ipcRenderer.invoke('github-list-repos'),
  githubTestPR: () => ipcRenderer.invoke('github-test-pr'),
  toggleSettings: (showSettings: boolean) => ipcRenderer.invoke('toggle-settings', showSettings),
  
  // Modal visibility toggle
  toggleModal: (showModal: boolean) => ipcRenderer.invoke('toggle-modal', showModal),
  
  // Overlay API implementations
  injectOverlay: (options?: { initialMode?: 'measure' | 'edit' }) => ipcRenderer.invoke('inject-overlay', options),
  removeOverlay: () => ipcRenderer.invoke('remove-overlay'),
  toggleOverlay: (options?: { initialMode?: 'measure' | 'edit' }) => ipcRenderer.invoke('toggle-overlay', options),
  overlaySetMode: (mode: string) => ipcRenderer.invoke('overlay-set-mode', mode),
  overlayToggleSelectMode: () => ipcRenderer.invoke('overlay-toggle-select-mode'),
  overlayToggleCommentMode: () => ipcRenderer.invoke('overlay-toggle-comment-mode'),
  overlayGetCommentModeState: () => ipcRenderer.invoke('overlay-get-comment-mode-state'),
  overlaySelectElement: (selector: string) => ipcRenderer.invoke('overlay-select-element', selector),
  overlayHighlightElement: (selector: string) => ipcRenderer.invoke('overlay-highlight-element', selector),
  onElementSelected: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('element-selected', listener);
    return () => ipcRenderer.removeListener('element-selected', listener);
  },
  onElementHovered: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('element-hovered', listener);
    return () => ipcRenderer.removeListener('element-hovered', listener);
  },
  
  // CDP Runtime Signals API implementations
  injectCDP: () => ipcRenderer.invoke('inject-cdp'),
  collectRuntimeSignals: (options?: { x?: number; y?: number }) => ipcRenderer.invoke('collect-runtime-signals', options),
  
  // PR Watcher API implementations
  prWatcherStart: (options: { owner: string; repo: string; prNumber: number }) => ipcRenderer.invoke('pr-watcher-start', options),
  prWatcherStop: (watcherKey: string) => ipcRenderer.invoke('pr-watcher-stop', watcherKey),
  prWatcherGetPreviews: (watcherKey: string) => ipcRenderer.invoke('pr-watcher-get-previews', watcherKey),
  showPreviewPane: (previewUrl: string) => ipcRenderer.invoke('show-preview-pane', previewUrl),
  hidePreviewPane: () => ipcRenderer.invoke('hide-preview-pane'),
  
  onPreviewUrlReady: (callback: (data: { prKey: string; preview: any; allPreviews: any[] }) => void) => {
    const listener = (_event: any, data: { prKey: string; preview: any; allPreviews: any[] }) => callback(data);
    ipcRenderer.on('preview-url-ready', listener);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('preview-url-ready', listener);
    };
  },
  
  onPRWatcherError: (callback: (data: { prKey: string; error: string }) => void) => {
    const listener = (_event: any, data: { prKey: string; error: string }) => callback(data);
    ipcRenderer.on('pr-watcher-error', listener);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('pr-watcher-error', listener);
    };
  },
  
  // Confirm flow API implementations
  confirmChanges: (changeSet: any[]) => ipcRenderer.invoke('confirm-changes', changeSet),
  
  // LLM Configuration API implementations
  llmSaveConfig: (config: { provider: string; apiKey?: string }) => ipcRenderer.invoke('llm-save-config', config),
  llmGetConfig: () => ipcRenderer.invoke('llm-get-config'),
  llmTestConnection: () => ipcRenderer.invoke('llm-test-connection'),
  
  // Repository Analysis API implementations
  analyzeRepository: () => ipcRenderer.invoke('analyze-repository'),
  reAnalyzeRepository: () => ipcRenderer.invoke('re-analyze-repository'),
  getAnalysisStatus: () => ipcRenderer.invoke('get-analysis-status')
  ,
  // Codex helpers
  codexOpenSetup: () => ipcRenderer.invoke('codex-open-setup'),
  codexMarkConnected: () => ipcRenderer.invoke('codex-mark-connected'),
  codexGetStatus: () => ipcRenderer.invoke('codex-get-status'),
  
  // Environment variables
  getEnvVar: (key: string) => ipcRenderer.invoke('get-env-var', key),
  
  // Visual Coding Agent
  initializeVisualAgent: (config: any) => ipcRenderer.invoke('initialize-visual-agent', config),
  processVisualRequest: (request: any) => ipcRenderer.invoke('process-visual-request', request),
  
  // Panel width updates
  updatePanelWidth: (width: number, animated?: boolean) => ipcRenderer.send('update-panel-width', width, animated !== false),
  onPanelWidthChanged: (callback: (width: number) => void) => {
    const listener = (_: any, width: number) => callback(width);
    ipcRenderer.on('panel-width-changed', listener);
    return () => ipcRenderer.removeListener('panel-width-changed', listener);
  },
  
  // Overlay element selection and editing
  sendOverlayMessage: (channel: string, data: any) => ipcRenderer.send(channel, data),
  onOverlayMessage: (channel: string, callback: (data: any) => void) => {
    const listener = (_: any, data: any) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  executeScript: (script: string) => ipcRenderer.invoke('execute-script', script),
  overlayApplyStyle: (selector: string, property: string, value: string) => ipcRenderer.invoke('overlay-apply-style', selector, property, value),
  overlayRecordEdit: (editData: any) => ipcRenderer.invoke('overlay-record-edit', editData),
  overlayGetRecordedEdits: () => ipcRenderer.invoke('overlay-get-recorded-edits'),
  overlayDeleteEdit: (index: number) => ipcRenderer.invoke('overlay-delete-edit', index),
  overlayHighlightEdit: (index: number) => ipcRenderer.invoke('overlay-highlight-edit', index),
  overlayClearHighlight: () => ipcRenderer.invoke('overlay-clear-highlight'),
  overlayGetComments: () => ipcRenderer.invoke('overlay-get-comments'),
    overlayRemoveAllComments: () => ipcRenderer.invoke('overlay-remove-all-comments'),
    overlayScrollToComment: (commentId: string) => ipcRenderer.invoke('overlay-scroll-to-comment', commentId),
  overlayLoadComments: (commentsData: any[]) => ipcRenderer.invoke('overlay-load-comments', commentsData),
  
  // Agent V4 - Visual Edits to PR
  triggerAgentV4: (data: { edits: any[]; url: string }) => ipcRenderer.invoke('trigger-agent-v4', data),
  
  // Agent V4 - Combined Edits (Visual + Natural Language) to PR
  processCombinedEdits: (request: any) => ipcRenderer.invoke('process-combined-edits', request),
  
  // Conversational Intelligence API implementations
  analyzeConversationMessage: (data: { message: string; conversationState?: any }) => ipcRenderer.invoke('analyze-conversation-message', data),
  
  // Comments to Tweaqs Conversion API implementations
  convertCommentsToTweaqs: (commentsData: any[]) => ipcRenderer.invoke('convert-comments-to-tweaqs', commentsData),
  
  // Browser Engine Switching API implementations
  browserGetCurrentEngine: () => ipcRenderer.invoke('browser-get-current-engine'),
  browserGetAvailableEngines: () => ipcRenderer.invoke('browser-get-available-engines'),
  browserSwitchEngine: (engine: BrowserEngine) => ipcRenderer.invoke('browser-switch-engine', engine),
  browserGetEngineConfig: (engine: BrowserEngine) => ipcRenderer.invoke('browser-get-engine-config', engine),
  onBrowserEngineChanged: (callback: (data: { engine: BrowserEngine; config: BrowserEngineConfig }) => void) => {
    const listener = (_event: any, data: { engine: BrowserEngine; config: BrowserEngineConfig }) => callback(data);
    ipcRenderer.on('browser-engine-changed', listener);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('browser-engine-changed', listener);
    };
  },
  
  // Playwright True Browser API implementations
  playwrightLaunchTrueBrowser: (data: { engine: 'firefox' | 'webkit'; url?: string }) => ipcRenderer.invoke('playwright-launch-true-browser', data),
  playwrightNavigate: (data: { engine: 'firefox' | 'webkit'; url: string }) => ipcRenderer.invoke('playwright-navigate', data),
  playwrightCloseBrowser: (engine: 'firefox' | 'webkit') => ipcRenderer.invoke('playwright-close-browser', engine),
  
  // Session Management API
  sessionCreate: (data: { homeUrl: string; ownerName?: string }) => ipcRenderer.invoke('session-create', data),
  sessionJoin: (data: { sessionId: string; name: string }) => ipcRenderer.invoke('session-join', data),
  sessionLeave: () => ipcRenderer.invoke('session-leave'),
  sessionEnd: () => ipcRenderer.invoke('session-end'),
  sessionGetInfo: (sessionId: string) => ipcRenderer.invoke('session-get-info', sessionId),
  sessionGetReport: (sessionId: string) => ipcRenderer.invoke('session-get-report', sessionId),
  sessionGetState: () => ipcRenderer.invoke('session-get-state'),
  sessionUpdateCursor: (cursor: { x: number; y: number; elementSelector?: string }) => ipcRenderer.invoke('session-update-cursor', cursor),
  sessionAddComment: (comment: { elementSelector: string; elementName: string; text: string; position: { x: number; y: number } }) => ipcRenderer.invoke('session-add-comment', comment),
  sessionEditComment: (data: { commentId: string; text: string }) => ipcRenderer.invoke('session-edit-comment', data),
  sessionDeleteComment: (commentId: string) => ipcRenderer.invoke('session-delete-comment', commentId),
  sessionChangeUrl: (url: string) => ipcRenderer.invoke('session-change-url', url),
  onSessionParticipantJoined: (callback: (participant: any) => void) => {
    const listener = (_event: any, participant: any) => callback(participant);
    ipcRenderer.on('session-participant-joined', listener);
    return () => ipcRenderer.removeListener('session-participant-joined', listener);
  },
  onSessionParticipantLeft: (callback: (participantId: string) => void) => {
    const listener = (_event: any, participantId: string) => callback(participantId);
    ipcRenderer.on('session-participant-left', listener);
    return () => ipcRenderer.removeListener('session-participant-left', listener);
  },
  onSessionCommentAdded: (callback: (comment: any) => void) => {
    const listener = (_event: any, comment: any) => callback(comment);
    ipcRenderer.on('session-comment-added', listener);
    return () => ipcRenderer.removeListener('session-comment-added', listener);
  },
  onSessionCommentEdited: (callback: (comment: any) => void) => {
    const listener = (_event: any, comment: any) => callback(comment);
    ipcRenderer.on('session-comment-edited', listener);
    return () => ipcRenderer.removeListener('session-comment-edited', listener);
  },
  onSessionCommentDeleted: (callback: (commentId: string) => void) => {
    const listener = (_event: any, commentId: string) => callback(commentId);
    ipcRenderer.on('session-comment-deleted', listener);
    return () => ipcRenderer.removeListener('session-comment-deleted', listener);
  },
  onSessionCursorUpdate: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('session-cursor-update', listener);
    return () => ipcRenderer.removeListener('session-cursor-update', listener);
  },
  onSessionUrlChanged: (callback: (url: string) => void) => {
    const listener = (_event: any, url: string) => callback(url);
    ipcRenderer.on('session-url-changed', listener);
    return () => ipcRenderer.removeListener('session-url-changed', listener);
  },
  onSessionEnded: (callback: (report: any) => void) => {
    const listener = (_event: any, report: any) => callback(report);
    ipcRenderer.on('session-ended', listener);
    return () => ipcRenderer.removeListener('session-ended', listener);
  },
  onSessionLinkReceived: (callback: (sessionId: string) => void) => {
    const listener = (_event: any, sessionId: string) => callback(sessionId);
    ipcRenderer.on('session-link-received', listener);
    return () => ipcRenderer.removeListener('session-link-received', listener);
  }
} as ElectronAPI);

// TypeScript declaration for the global electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
