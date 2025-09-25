import { contextBridge, ipcRenderer } from 'electron';
import { NodeSnapshot, SourceMapInfo, RuntimeSignals } from './cdp-helper';

// Export CDP types for use in other modules
export { NodeSnapshot, SourceMapInfo, RuntimeSignals };

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
  
  // Overlay API implementations
  injectOverlay: (options?: { initialMode?: 'measure' | 'edit' }) => ipcRenderer.invoke('inject-overlay', options),
  removeOverlay: () => ipcRenderer.invoke('remove-overlay'),
  toggleOverlay: (options?: { initialMode?: 'measure' | 'edit' }) => ipcRenderer.invoke('toggle-overlay', options),
  
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
  getAnalysisStatus: () => ipcRenderer.invoke('get-analysis-status')
} as ElectronAPI);

// TypeScript declaration for the global electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
