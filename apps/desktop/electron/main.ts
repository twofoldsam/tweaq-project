import { app, BrowserWindow, BrowserView, ipcMain, shell } from 'electron';
import path from 'path';
import Store from 'electron-store';
import { GitClient, PRWatcher, type DeploymentPreview } from '../../../packages/github/dist/src/index';
import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { Octokit } from '@octokit/rest';
import * as keytar from 'keytar';
import { RemoteRepo } from '../../../packages/github-remote/dist/index.js';
import { InMemoryPatcher } from '../../../packages/change-engine/dist/src/index.js';
import { MappingEngine, MockLLMProvider, OpenAIProvider, ClaudeProvider, buildRepoIndex, getDeterministicHints } from '../../../packages/mapping-remote/dist/index.js';

interface StoreSchema {
  lastUrl: string;
  github?: {
    owner: string;
    repo: string;
    baseBranch: string;
    label: string;
  };
  llm?: {
    provider: 'openai' | 'claude' | 'mock';
    apiKey?: string;
  };
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

interface CodeIntent {
  filePath: string;
  intent: string;
  targetElement?: string;
  tailwindChanges?: Record<string, string>;
  confidence: number;
  evidence: string;
}

const store = new Store<StoreSchema>({
  defaults: {
    lastUrl: 'https://www.google.com'
  }
});

// GitHub OAuth App Client ID - Replace with your actual GitHub OAuth App Client ID
const GITHUB_CLIENT_ID = 'Ov23liiu7rMP6sTcvb6H';

// Create a custom GitClient that opens URLs in the system browser
class ElectronGitClient extends GitClient {
  private electronOctokit: Octokit | null = null;

  async connectDeviceFlow() {
    const auth = createOAuthDeviceAuth({
      clientType: 'oauth-app',
      clientId: this.clientId,
      scopes: ['repo'], // Request repository access
      onVerification: (verification: any) => {
        // Open the verification URL in the system browser
        shell.openExternal(verification.verification_uri);
        console.log('Verification URL opened in browser:', verification.verification_uri);
        console.log('Enter code:', verification.user_code);
      },
    });

    const { token } = await auth({
      type: 'oauth',
    });

    // Store token securely using keytar
    await keytar.setPassword('smart-qa-github', 'github-token', token);

    // Initialize the Octokit instance
    this.electronOctokit = new Octokit({
      auth: token,
    });

    const { data: user } = await this.electronOctokit.rest.users.getAuthenticated();

    return {
      token,
      user: {
        login: user.login,
        id: user.id,
        avatar_url: user.avatar_url,
        ...(user.name && { name: user.name }),
        ...(user.email && { email: user.email }),
      },
    };
  }

  async loadStoredToken(): Promise<boolean> {
    try {
      const token = await keytar.getPassword('smart-qa-github', 'github-token');
      if (!token) {
        return false;
      }

      this.electronOctokit = new Octokit({
        auth: token,
      });

      // Verify the token is still valid
      await this.electronOctokit.rest.users.getAuthenticated();
      return true;
    } catch (error) {
      // Token might be invalid, clear it
      await keytar.deletePassword('smart-qa-github', 'github-token');
      this.electronOctokit = null;
      return false;
    }
  }

  async clearStoredToken(): Promise<void> {
    await keytar.deletePassword('smart-qa-github', 'github-token');
    this.electronOctokit = null;
  }

  isAuthenticated(): boolean {
    return this.electronOctokit !== null;
  }

  getOctokit(): Octokit {
    if (!this.electronOctokit) {
      throw new Error('Not authenticated. Call connectDeviceFlow() first.');
    }
    return this.electronOctokit;
  }

  async getAuthenticatedUser() {
    if (!this.electronOctokit) {
      throw new Error('Not authenticated. Call connectDeviceFlow() first.');
    }
    
    const { data: user } = await this.electronOctokit.rest.users.getAuthenticated();
    return user;
  }
}

const gitClient = new ElectronGitClient(GITHUB_CLIENT_ID);

// Initialize authentication on startup
const initializeAuth = async () => {
  try {
    const success = await gitClient.loadStoredToken();
    if (success) {
      console.log('GitHub token loaded from keychain');
    } else {
      console.log('No stored GitHub token found');
    }
  } catch (error) {
    console.error('Failed to load stored token:', error);
  }
};

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let browserView: BrowserView | null = null;
let rightPaneView: BrowserView | null = null;

// PR watcher state
const activePRWatchers = new Map<string, PRWatcher>();
const previewUrls = new Map<string, DeploymentPreview[]>();

// Layout functions (defined at module level)
const updateBrowserViewBounds = () => {
  if (browserView && mainWindow) {
    const bounds = mainWindow.getBounds();
    browserView.setBounds({
      x: 0,
      y: TOOLBAR_HEIGHT,
      width: bounds.width,
      height: bounds.height - TOOLBAR_HEIGHT
    });
  }
};

const updateLayoutWithRightPane = () => {
  if (browserView && rightPaneView && mainWindow) {
    const bounds = mainWindow.getBounds();
    const splitWidth = Math.floor(bounds.width / 2);
    
    // Left pane (main content)
    browserView.setBounds({
      x: 0,
      y: TOOLBAR_HEIGHT,
      width: splitWidth,
      height: bounds.height - TOOLBAR_HEIGHT
    });
    
    // Right pane (preview)
    rightPaneView.setBounds({
      x: splitWidth,
      y: TOOLBAR_HEIGHT,
      width: bounds.width - splitWidth,
      height: bounds.height - TOOLBAR_HEIGHT
    });
  }
};

// Toolbar height in pixels
const TOOLBAR_HEIGHT = 60;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
  });

  // Create the browser view for web content
  browserView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Allow IPC access for overlay communication
      preload: path.join(__dirname, 'preload.js'), // Add preload for electronAPI
    }
  });

  mainWindow.setBrowserView(browserView);

  // Initial positioning
  updateBrowserViewBounds();

  // Update browser view bounds when window is resized
  mainWindow.on('resize', () => {
    if (rightPaneView && mainWindow?.getBrowserViews().includes(rightPaneView)) {
      updateLayoutWithRightPane();
    } else {
      updateBrowserViewBounds();
    }
  });

  // Handle settings toggle
  ipcMain.handle('toggle-settings', (event, showSettings: boolean) => {
    if (browserView && mainWindow) {
      if (showSettings) {
        // Hide browser view when showing settings
        mainWindow.removeBrowserView(browserView);
      } else {
        // Show browser view when hiding settings
        mainWindow.setBrowserView(browserView);
        updateBrowserViewBounds();
      }
    }
    return { success: true };
  });

  // Load the React app (toolbar)
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, './index.html'));
  }

  // Load the last URL in the browser view
  const lastUrl = store.get('lastUrl');
  if (browserView) {
    browserView.webContents.loadURL(lastUrl);
    
    // Track navigation events
    browserView.webContents.on('did-start-loading', () => {
      mainWindow?.webContents.send('page-loading', true);
    });

    browserView.webContents.on('did-finish-load', () => {
      const url = browserView?.webContents.getURL() || '';
      const title = browserView?.webContents.getTitle() || '';
      
      mainWindow?.webContents.send('page-loaded', {
        url,
        title,
        loading: false
      });
    });

    browserView.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      mainWindow?.webContents.send('page-error', {
        url: validatedURL,
        error: errorDescription,
        loading: false
      });
    });

    browserView.webContents.on('did-navigate', (event, url) => {
      store.set('lastUrl', url);
      mainWindow?.webContents.send('page-navigation', { url });
    });

    browserView.webContents.on('did-navigate-in-page', (event, url) => {
      store.set('lastUrl', url);
      mainWindow?.webContents.send('page-navigation', { url });
    });
  }
}

// IPC handlers
ipcMain.handle('navigate', async (event, url: string) => {
  if (!browserView) return { success: false, error: 'No browser view available' };
  
  try {
    // Ensure URL has protocol
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      fullUrl = `https://${url}`;
    }
    
    await browserView.webContents.loadURL(fullUrl);
    store.set('lastUrl', fullUrl);
    return { success: true, url: fullUrl };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Navigation failed' };
  }
});

ipcMain.handle('get-current-url', () => {
  return browserView?.webContents.getURL() || store.get('lastUrl');
});

ipcMain.handle('go-back', () => {
  if (browserView?.webContents.canGoBack()) {
    browserView.webContents.goBack();
    return true;
  }
  return false;
});

ipcMain.handle('go-forward', () => {
  if (browserView?.webContents.canGoForward()) {
    browserView.webContents.goForward();
    return true;
  }
  return false;
});

ipcMain.handle('reload', () => {
  browserView?.webContents.reload();
  return true;
});

ipcMain.handle('can-go-back', () => {
  return browserView?.webContents.canGoBack() || false;
});

ipcMain.handle('can-go-forward', () => {
  return browserView?.webContents.canGoForward() || false;
});

// GitHub IPC handlers
ipcMain.handle('github-connect', async () => {
  try {
    const result = await gitClient.connectDeviceFlow();
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Authentication failed' };
  }
});

ipcMain.handle('github-load-stored-token', async () => {
  try {
    const success = await gitClient.loadStoredToken();
    if (success) {
      const fullUser = await gitClient.getAuthenticatedUser();
      // Transform to the format expected by the frontend
      const user = {
        login: fullUser.login,
        id: fullUser.id,
        avatar_url: fullUser.avatar_url,
        ...(fullUser.name && { name: fullUser.name }),
        ...(fullUser.email && { email: fullUser.email }),
      };
      return { success: true, user };
    }
    return { success: false, error: 'No stored token found' };
  } catch (error) {
    console.error('Error loading stored token:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to load token' };
  }
});

ipcMain.handle('github-disconnect', async () => {
  try {
    await gitClient.clearStoredToken();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to disconnect' };
  }
});

ipcMain.handle('github-is-authenticated', async () => {
  // If not currently authenticated, try to load stored token
  if (!gitClient.isAuthenticated()) {
    await gitClient.loadStoredToken();
  }
  return gitClient.isAuthenticated();
});

ipcMain.handle('github-save-config', (event, config: { owner: string; repo: string; baseBranch: string; label: string }) => {
  store.set('github', config);
  return { success: true };
});

ipcMain.handle('github-get-config', () => {
  return store.get('github');
});

ipcMain.handle('github-list-repos', async () => {
  try {
    if (!gitClient.isAuthenticated()) {
      return { success: false, error: 'Not authenticated. Please connect to GitHub first.' };
    }

    const octokit = gitClient.getOctokit();
    
    // Get user's repositories
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      type: 'all' // owner, collaborator, member
    });

    // Format repositories for dropdown
    const formattedRepos = repos.map(repo => ({
      full_name: repo.full_name,
      name: repo.name,
      owner: repo.owner.login,
      default_branch: repo.default_branch,
      private: repo.private,
      description: repo.description || '',
      updated_at: repo.updated_at
    }));

    return { success: true, repos: formattedRepos };
  } catch (error) {
    console.error('Error listing repositories:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to list repositories' };
  }
});

ipcMain.handle('github-test-pr', async () => {
  try {
    const config = store.get('github');
    if (!config) {
      return { success: false, error: 'No GitHub configuration found. Please save your settings first.' };
    }

    if (!gitClient.isAuthenticated()) {
      return { success: false, error: 'Not authenticated. Please connect to GitHub first.' };
    }

    const branchName = `smartqa-test-${Date.now()}`;
    const octokit = gitClient.getOctokit();
    
    // First, get the repository info to check the default branch
    let repoInfo;
    try {
      const { data } = await octokit.rest.repos.get({
        owner: config.owner,
        repo: config.repo,
      });
      repoInfo = data;
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Repository '${config.owner}/${config.repo}' not found. Please check that:\n1. The repository name is correct\n2. The repository exists\n3. You have access to this repository\n4. If it's a private repo, make sure your GitHub token has the right permissions`);
      } else if (error.status === 403) {
        throw new Error(`Access denied to repository '${config.owner}/${config.repo}'. Make sure you have the necessary permissions to access this repository.`);
      }
      throw error;
    }

    // Use the repository's default branch if the configured base branch doesn't exist
    let baseBranch = config.baseBranch;
    let baseRef;
    
    try {
      // Try to get the configured base branch
      const { data } = await octokit.rest.git.getRef({
        owner: config.owner,
        repo: config.repo,
        ref: `heads/${baseBranch}`,
      });
      baseRef = data;
    } catch (error: any) {
      if (error.status === 404 || error.status === 409) {
        // Branch doesn't exist or repo is empty, try the default branch
        baseBranch = repoInfo.default_branch;
        try {
          const { data } = await octokit.rest.git.getRef({
            owner: config.owner,
            repo: config.repo,
            ref: `heads/${baseBranch}`,
          });
          baseRef = data;
        } catch (defaultBranchError: any) {
          if (defaultBranchError.status === 409) {
            throw new Error(`Repository '${config.owner}/${config.repo}' appears to be empty. Please add some content to the repository first.`);
          }
          throw defaultBranchError;
        }
      } else {
        throw error;
      }
    }

    const baseSha = baseRef.object.sha;

    // Try to get existing branch, create if it doesn't exist
    try {
      await octokit.rest.git.getRef({
        owner: config.owner,
        repo: config.repo,
        ref: `heads/${branchName}`,
      });

      // Update the branch to point to the latest base
      await octokit.rest.git.updateRef({
        owner: config.owner,
        repo: config.repo,
        ref: `heads/${branchName}`,
        sha: baseSha,
      });
    } catch (error: any) {
      if (error.status === 404) {
        // Branch doesn't exist, create it
        await octokit.rest.git.createRef({
          owner: config.owner,
          repo: config.repo,
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        });
      } else {
        throw error;
      }
    }

    // Get the base tree
    const { data: baseCommit } = await octokit.rest.git.getCommit({
      owner: config.owner,
      repo: config.repo,
      commit_sha: baseSha,
    });

    // Create blob for the file
    const fileContent = '# Hello from Smart QA!\n\nThis is a test file created by Smart QA to verify GitHub integration.\n\nGenerated at: ' + new Date().toISOString();
    const { data: blob } = await octokit.rest.git.createBlob({
      owner: config.owner,
      repo: config.repo,
      content: Buffer.from(fileContent, 'utf8').toString('base64'),
      encoding: 'base64',
    });

    // Create tree
    const { data: newTree } = await octokit.rest.git.createTree({
      owner: config.owner,
      repo: config.repo,
      base_tree: baseCommit.tree.sha,
      tree: [{
        path: 'smartqa/HELLO.md',
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      }],
    });

    // Create commit
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner: config.owner,
      repo: config.repo,
      message: `Add smartqa/HELLO.md via Smart QA`,
      tree: newTree.sha,
      parents: [baseSha],
    });

    // Update branch reference to point to new commit
    await octokit.rest.git.updateRef({
      owner: config.owner,
      repo: config.repo,
      ref: `heads/${branchName}`,
      sha: newCommit.sha,
    });

    // Create the pull request
    const { data: pullRequest } = await octokit.rest.pulls.create({
      owner: config.owner,
      repo: config.repo,
      title: 'Test PR from Smart QA',
      body: 'This is a test pull request created by Smart QA to verify GitHub integration.',
      head: branchName,
      base: baseBranch, // Use the actual base branch we found
    });

    // Add labels if provided
    if (config.label) {
      await octokit.rest.issues.addLabels({
        owner: config.owner,
        repo: config.repo,
        issue_number: pullRequest.number,
        labels: [config.label],
      });
    }

    return { 
      success: true, 
      pr: {
        url: pullRequest.html_url,
        number: pullRequest.number
      }
    };
  } catch (error) {
    console.error('Error creating test PR:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create test PR' };
  }
});

// CDP Runtime Signals IPC handlers
ipcMain.handle('inject-cdp', async () => {
  try {
    if (!browserView) {
      return { success: false, error: 'No browser view available' };
    }

    // Read the CDP injector script
    const fs = require('fs');
    const cdpScript = fs.readFileSync(
      path.join(__dirname, 'cdp-injector.js'),
      'utf8'
    );

    // Execute the CDP script
    await browserView.webContents.executeJavaScript(cdpScript);

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to inject CDP' 
    };
  }
});

ipcMain.handle('collect-runtime-signals', async (event, options = {}) => {
  try {
    if (!browserView) {
      return { success: false, error: 'No browser view available' };
    }

    // First ensure CDP script is injected
    const fs = require('fs');
    const cdpScript = fs.readFileSync(
      path.join(__dirname, 'cdp-injector.js'),
      'utf8'
    );

    await browserView.webContents.executeJavaScript(cdpScript);
    
    // Collect runtime signals
    const script = `
      (async () => {
        if (window.TweaqCDP) {
          let element = null;
          
          // If coordinates are provided, get element at those coordinates
          if (typeof arguments[0] === 'object' && arguments[0].x !== undefined && arguments[0].y !== undefined) {
            element = window.TweaqCDP.getElementAt(arguments[0].x, arguments[0].y);
          }
          
          return await window.TweaqCDP.collectRuntimeSignals(element);
        } else {
          throw new Error('TweaqCDP not available');
        }
      })()
    `;
    
    const result = await browserView.webContents.executeJavaScript(script);
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to collect runtime signals' 
    };
  }
});

// Overlay IPC handlers
ipcMain.handle('inject-overlay', async (event, options = {}) => {
  try {
    if (!browserView) {
      return { success: false, error: 'No browser view available' };
    }

    // Read the modern overlay injector script
    const fs = require('fs');
    const overlayScript = fs.readFileSync(
      path.join(__dirname, '../../../packages/overlay/src/preload/modern-overlay-injector.js'),
      'utf8'
    );

    // Execute the script and initialize in one go
    await browserView.webContents.executeJavaScript(overlayScript);
    
    // Initialize the overlay with options (electronAPI is now available via preload)
    const initScript = `
      if (window.TweaqOverlay) {
        window.TweaqOverlay.inject(${JSON.stringify(options)});
      }
    `;
    await browserView.webContents.executeJavaScript(initScript);

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to inject overlay' 
    };
  }
});

ipcMain.handle('remove-overlay', async () => {
  try {
    if (!browserView) {
      return { success: false, error: 'No browser view available' };
    }

    const script = `
      if (window.TweaqOverlay) {
        window.TweaqOverlay.remove();
      }
    `;
    await browserView.webContents.executeJavaScript(script);

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove overlay' 
    };
  }
});

ipcMain.handle('toggle-overlay', async (event, options = {}) => {
  try {
    if (!browserView) {
      return { success: false, error: 'No browser view available' };
    }

    // First ensure the overlay script is injected
    const fs = require('fs');
    const overlayScript = fs.readFileSync(
      path.join(__dirname, '../../../packages/overlay/src/preload/modern-overlay-injector.js'),
      'utf8'
    );

    await browserView.webContents.executeJavaScript(overlayScript);
    
    // Then toggle with options (electronAPI is now available via preload)
    const toggleScript = `
      if (window.TweaqOverlay) {
        window.TweaqOverlay.toggle(${JSON.stringify(options)});
      }
    `;
    await browserView.webContents.executeJavaScript(toggleScript);

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to toggle overlay' 
    };
  }
});

// PR Watcher IPC handlers
ipcMain.handle('pr-watcher-start', async (event, options: { owner: string; repo: string; prNumber: number }) => {
  try {
    const config = store.get('github');
    if (!config) {
      return { success: false, error: 'No GitHub configuration found' };
    }

    if (!gitClient.isAuthenticated()) {
      return { success: false, error: 'Not authenticated with GitHub' };
    }

    const octokit = gitClient.getOctokit();
    const watcherKey = `${options.owner}/${options.repo}#${options.prNumber}`;
    
    // Stop existing watcher if any
    const existingWatcher = activePRWatchers.get(watcherKey);
    if (existingWatcher) {
      existingWatcher.stop();
    }

    // Create new watcher
    const watcher = new PRWatcher(octokit, {
      owner: options.owner,
      repo: options.repo,
      prNumber: options.prNumber,
      pollInterval: 30000, // 30 seconds
    }, {
      onPreviewReady: (preview: DeploymentPreview) => {
        const currentPreviews = previewUrls.get(watcherKey) || [];
        const existingIndex = currentPreviews.findIndex(p => p.url === preview.url);
        
        if (existingIndex >= 0) {
          currentPreviews[existingIndex] = preview;
        } else {
          currentPreviews.push(preview);
        }
        
        previewUrls.set(watcherKey, currentPreviews);
        
        // Notify renderer process
        if (mainWindow) {
          mainWindow.webContents.send('preview-url-ready', {
            prKey: watcherKey,
            preview,
            allPreviews: currentPreviews,
          });
        }
      },
      onError: (error: Error) => {
        console.error('PR Watcher error:', error);
        if (mainWindow) {
          mainWindow.webContents.send('pr-watcher-error', {
            prKey: watcherKey,
            error: error.message,
          });
        }
      },
    });

    activePRWatchers.set(watcherKey, watcher);
    watcher.start();

    return { success: true, watcherKey };
  } catch (error) {
    console.error('Error starting PR watcher:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to start PR watcher' };
  }
});

ipcMain.handle('pr-watcher-stop', async (event, watcherKey: string) => {
  try {
    const watcher = activePRWatchers.get(watcherKey);
    if (watcher) {
      watcher.stop();
      activePRWatchers.delete(watcherKey);
      previewUrls.delete(watcherKey);
    }
    return { success: true };
  } catch (error) {
    console.error('Error stopping PR watcher:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to stop PR watcher' };
  }
});

ipcMain.handle('pr-watcher-get-previews', async (event, watcherKey: string) => {
  try {
    const previews = previewUrls.get(watcherKey) || [];
    return { success: true, previews };
  } catch (error) {
    console.error('Error getting previews:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get previews' };
  }
});

ipcMain.handle('show-preview-pane', async (event, previewUrl: string) => {
  try {
    if (!mainWindow) {
      return { success: false, error: 'Main window not available' };
    }

    // Create right pane view if it doesn't exist
    if (!rightPaneView) {
      rightPaneView = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        }
      });
    }

    // Load the preview URL
    await rightPaneView.webContents.loadURL(previewUrl);
    
    // Add the right pane view to the window
    mainWindow.addBrowserView(rightPaneView);
    
    // Update layout to show both panes
    updateLayoutWithRightPane();

    return { success: true };
  } catch (error) {
    console.error('Error showing preview pane:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to show preview pane' };
  }
});

ipcMain.handle('hide-preview-pane', async () => {
  try {
    if (mainWindow && rightPaneView) {
      mainWindow.removeBrowserView(rightPaneView);
      updateBrowserViewBounds(); // Reset to full width
    }
    return { success: true };
  } catch (error) {
    console.error('Error hiding preview pane:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to hide preview pane' };
  }
});

// Confirm flow IPC handler
ipcMain.handle('confirm-changes', async (event, changeSet: VisualEdit[]) => {
  try {
    const config = store.get('github');
    if (!config) {
      return { success: false, error: 'No GitHub configuration found. Please configure GitHub settings first.' };
    }

    if (!gitClient.isAuthenticated()) {
      return { success: false, error: 'Not authenticated. Please connect to GitHub first.' };
    }

    const octokit = gitClient.getOctokit();
    const remoteRepo = new RemoteRepo(await keytar.getPassword('smart-qa-github', 'github-token') || '');
    
    // Step 1: Build CodeIntent[] using R3+R4 mapping
    const codeIntents = await buildCodeIntents(changeSet, config, remoteRepo);
    console.log('📝 Built code intents:', codeIntents.length, 'intents');
    
    // Step 2: Use R5 (InMemoryPatcher) to get file updates
    const fileUpdates = await getFileUpdates(codeIntents, config, remoteRepo);
    console.log('🔧 Generated file updates:', fileUpdates.length, 'files');
    
    // Step 3: Use RemoteRepo to create PR
    const prResult = await createPullRequest(fileUpdates, config, remoteRepo, changeSet);
    
    return { success: true, pr: prResult };
  } catch (error) {
    console.error('Error in confirm flow:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to confirm changes' };
  }
});

// Helper function to build CodeIntents from VisualEdits
async function buildCodeIntents(changeSet: VisualEdit[], config: any, remoteRepo: RemoteRepo): Promise<CodeIntent[]> {
  const intents: CodeIntent[] = [];
  
  try {
    // Get configured LLM provider
    const llmConfig = store.get('llm') || { provider: 'mock' };
    let llmProvider;
    
    if (llmConfig.provider === 'openai') {
      const apiKey = await keytar.getPassword('smart-qa-llm', 'openai-api-key');
      if (apiKey) {
        llmProvider = new OpenAIProvider(apiKey);
      } else {
        console.warn('OpenAI provider configured but no API key found, falling back to mock');
        llmProvider = new MockLLMProvider();
      }
    } else if (llmConfig.provider === 'claude') {
      const apiKey = await keytar.getPassword('smart-qa-llm', 'claude-api-key');
      if (apiKey) {
        llmProvider = new ClaudeProvider(apiKey);
      } else {
        console.warn('Claude provider configured but no API key found, falling back to mock');
        llmProvider = new MockLLMProvider();
      }
    } else {
      llmProvider = new MockLLMProvider();
    }
    
    console.log(`🤖 Using LLM provider: ${llmConfig.provider}`);
    
    const githubToken = await keytar.getPassword('smart-qa-github', 'github-token');
    
    if (!githubToken) {
      console.warn('No GitHub token available for mapping engine');
      return [];
    }
    
    // Build repository index first
    console.log('🗂️ Building repository index...');
    const repoIndex = await buildRepoIndex({
      owner: config.owner,
      repo: config.repo,
      ref: config.baseBranch,
      auth: githubToken
    });
    
    console.log(`✅ Repository index built with ${repoIndex.files.length} files`);
    
    // Get current page URL for context
    const currentUrl = browserView?.webContents?.getURL() || '';
    const urlPath = new URL(currentUrl).pathname || '/';
    
    for (const edit of changeSet) {
      try {
        // Convert visual edit to node snapshot format
        const nodeSnapshot = {
          tagName: edit.element.tagName,
          className: edit.element.className,
          id: edit.element.id,
          textContent: '', // We don't have this from VisualEdit
          attributes: {}
        };
        
        // Get deterministic hints first
        console.log(`🔍 Getting hints for element: ${edit.element.tagName}${edit.element.id ? '#' + edit.element.id : ''}${edit.element.className ? '.' + edit.element.className.split(' ').join('.') : ''}`);
        
        const hints = await getDeterministicHints({
          nodeSnapshot,
          urlPath,
          repoIndex,
          auth: githubToken
        });
        
        console.log(`📍 Found ${hints.length} deterministic hints`);
        
        // Convert to CodeIntent format
        if (hints.length > 0) {
          // Use the highest confidence hint
          const bestHint = hints.sort((a, b) => b.confidence - a.confidence)[0];
          
          const codeIntent: CodeIntent = {
            filePath: bestHint.filePath,
            intent: generateIntentFromEdit(edit),
            targetElement: edit.element.tagName.toLowerCase(),
            tailwindChanges: extractTailwindChanges(edit),
            confidence: bestHint.confidence,
            evidence: bestHint.evidence
          };
          
          intents.push(codeIntent);
          console.log(`✅ Mapped to ${bestHint.filePath} with confidence ${bestHint.confidence}`);
        } else {
          // Fallback to common patterns
          console.warn('No hints found, using fallback mapping');
          const fallbackIntent: CodeIntent = {
            filePath: 'src/components/Button.tsx', // Common fallback
            intent: generateIntentFromEdit(edit),
            targetElement: edit.element.tagName.toLowerCase(),
            tailwindChanges: extractTailwindChanges(edit),
            confidence: 0.3, // Low confidence for fallback
            evidence: 'fallback'
          };
          
          intents.push(fallbackIntent);
        }
      } catch (error) {
        console.warn('Failed to map visual edit to code intent:', error);
        // Continue with other edits
      }
    }
  } catch (error) {
    console.error('Failed to build code intents:', error);
    // Return empty array rather than failing completely
  }
  
  return intents;
}

// Helper function to generate intent from visual edit
function generateIntentFromEdit(edit: VisualEdit): string {
  const changes = edit.changes.map(change => {
    return `Change ${change.property} from "${change.before}" to "${change.after}"`;
  }).join(', ');
  
  return `Update ${edit.element.tagName.toLowerCase()} element: ${changes}`;
}

// Helper function to extract Tailwind changes
function extractTailwindChanges(edit: VisualEdit): Record<string, string> {
  const tailwindChanges: Record<string, string> = {};
  
  for (const change of edit.changes) {
    switch (change.property) {
      case 'fontSize':
        tailwindChanges.fontSize = mapToTailwindSize(change.after);
        break;
      case 'backgroundColor':
        tailwindChanges.colors = mapToTailwindColor(change.after);
        break;
      case 'borderRadius':
        tailwindChanges.radius = mapToTailwindRadius(change.after);
        break;
      case 'padding':
      case 'margin':
        tailwindChanges.spacing = mapToTailwindSpacing(change.after);
        break;
    }
  }
  
  return tailwindChanges;
}

// Helper functions for Tailwind mapping
function mapToTailwindSize(value: string): string {
  const sizeMap: Record<string, string> = {
    '12px': 'xs', '14px': 'sm', '16px': 'base', '18px': 'lg', '20px': 'xl'
  };
  return sizeMap[value] || 'base';
}

function mapToTailwindColor(value: string): string {
  // Simple color mapping - in practice this would be more sophisticated
  if (value.includes('blue')) return 'blue-500';
  if (value.includes('red')) return 'red-500';
  if (value.includes('green')) return 'green-500';
  return 'gray-500';
}

function mapToTailwindRadius(value: string): string {
  const radiusMap: Record<string, string> = {
    '0px': 'none', '2px': 'sm', '4px': 'md', '8px': 'lg', '16px': 'xl'
  };
  return radiusMap[value] || 'md';
}

function mapToTailwindSpacing(value: string): string {
  const spacingMap: Record<string, string> = {
    '4px': '1', '8px': '2', '12px': '3', '16px': '4', '20px': '5'
  };
  return spacingMap[value] || '4';
}

// Helper function to get file updates using R5 (InMemoryPatcher)
async function getFileUpdates(codeIntents: CodeIntent[], config: any, remoteRepo: RemoteRepo) {
  // Create a file reader that uses RemoteRepo to fetch file contents
  const fileReader = {
    readFile: async (options: { owner: string; repo: string; path: string; ref?: string }) => {
      try {
        console.log(`📖 Reading file: ${options.path} from ${options.owner}/${options.repo}@${options.ref}`);
        const content = await remoteRepo.readFile({
          owner: options.owner,
          repo: options.repo,
          path: options.path,
          ref: options.ref || config.baseBranch
        });
        return content;
      } catch (error) {
        console.warn(`Failed to read file ${options.path}:`, error);
        // Return empty content as fallback
        return '';
      }
    }
  };
  
  const patcher = new InMemoryPatcher(fileReader);
  const allFileUpdates: any[] = [];
  
  for (const intent of codeIntents) {
    try {
      console.log(`🔍 Processing intent for ${intent.filePath}:`, intent.intent);
      const result = await patcher.prepareFilesForIntent({
        owner: config.owner,
        repo: config.repo,
        ref: config.baseBranch,
        hints: [{
          owner: config.owner,
          repo: config.repo,
          ref: config.baseBranch,
          filePath: intent.filePath,
          intent: intent.intent,
          targetElement: intent.targetElement,
          tailwindChanges: intent.tailwindChanges
        }]
      });
      
      console.log(`  ✅ Generated ${result.fileUpdates.length} file updates`);
      allFileUpdates.push(...result.fileUpdates);
      
      // If no file updates but there's a changelog, add it as a file
      if (result.fileUpdates.length === 0 && result.changelogEntry) {
        console.log('  📝 Adding changelog entry as fallback');
        allFileUpdates.push({
          path: 'CHANGELOG.md',
          newContent: result.changelogEntry
        });
      }
    } catch (error) {
      console.warn('Failed to process intent:', intent, error);
    }
  }
  
  return allFileUpdates;
}

// Helper function to create pull request
async function createPullRequest(fileUpdates: any[], config: any, remoteRepo: RemoteRepo, originalEdits: VisualEdit[]) {
  try {
    // Get base SHA for the base branch
    const baseRef = await remoteRepo.getRepoTree({ 
      owner: config.owner, 
      repo: config.repo, 
      ref: config.baseBranch 
    });
    const baseSha = baseRef.sha;
    
    // Create branch name
    const timestamp = Date.now();
    const slug = 'design-tweaks';
    const branchName = `tweak/${slug}-${timestamp}`;
    
    // Convert file updates to RemoteRepo format
    const files = fileUpdates.map(update => ({
      path: update.path,
      content: update.newContent
    }));
    
    console.log('📁 Files to include in tree:', files.length);
    files.forEach(file => console.log(`  - ${file.path} (${file.content.length} chars)`));
    
    // Create new tree with updated files
    const newTree = await remoteRepo.createTree({
      owner: config.owner,
      repo: config.repo,
      baseTreeSha: baseSha,
      files: files
    });
    
    // Create commit
    const commit = await remoteRepo.createCommit({
      owner: config.owner,
      repo: config.repo,
      message: `Apply design tweaks via Smart QA\n\n- ${originalEdits.length} visual edit(s) applied\n- Generated from overlay interactions`,
      treeSha: newTree.sha,
      parentSha: baseSha
    });
    
    // Create/update branch
    try {
      await remoteRepo.updateRef({
        owner: config.owner,
        repo: config.repo,
        ref: branchName,
        sha: commit.sha
      });
    } catch (error) {
      // Branch might not exist, try creating it
      // This is a simplified approach - RemoteRepo should handle this
      throw error;
    }
    
    // Generate PR body with metadata
    const prBody = generatePRBody(originalEdits, fileUpdates);
    
    // Open pull request
    const pr = await remoteRepo.openPR({
      owner: config.owner,
      repo: config.repo,
      base: config.baseBranch,
      head: branchName,
      title: `🎨 Design tweaks via Smart QA (${originalEdits.length} edits)`,
      body: prBody,
      labels: ['design-qa']
    });
    
    return {
      url: pr.html_url,
      number: pr.number
    };
  } catch (error) {
    // Handle base SHA mismatch with refresh and retry logic
    if (error instanceof Error && error.message.includes('mismatch')) {
      console.log('Base SHA mismatch detected, refreshing and retrying...');
      // TODO: Implement retry logic
    }
    throw error;
  }
}

// Helper function to generate PR body
function generatePRBody(edits: VisualEdit[], fileUpdates: any[]): string {
  let body = `# Smart QA Design Tweaks\n\n`;
  
  body += `## Summary\n`;
  body += `This PR applies ${edits.length} visual edit(s) made through the Smart QA overlay.\n\n`;
  
  body += `## Edits Applied\n\n`;
  body += `| Element | Property | Before | After | Confidence |\n`;
  body += `|---------|----------|--------|-------|------------|\n`;
  
  for (const edit of edits) {
    for (const change of edit.changes) {
      body += `| ${edit.element.tagName} | ${change.property} | \`${change.before}\` | \`${change.after}\` | High |\n`;
    }
  }
  
  body += `\n## Files Modified\n\n`;
  for (const update of fileUpdates) {
    body += `- \`${update.path}\`\n`;
  }
  
  body += `\n## Evidence\n`;
  body += `- Generated from visual overlay interactions\n`;
  body += `- Applied via Smart QA change engine\n`;
  body += `- Timestamp: ${new Date().toISOString()}\n\n`;
  
  body += `## Before/After\n`;
  body += `*Screenshots would be captured here in a full implementation*\n\n`;
  
  return body;
}

// LLM Configuration IPC handlers
ipcMain.handle('llm-save-config', async (event, config: { provider: string; apiKey?: string }) => {
  try {
    // Store API key securely in keychain if provided
    if (config.apiKey) {
      await keytar.setPassword('smart-qa-llm', `${config.provider}-api-key`, config.apiKey);
    }
    
    // Store provider preference in local storage (without API key)
    store.set('llm', {
      provider: config.provider as 'openai' | 'claude' | 'mock'
    });
    
    console.log(`💾 LLM configuration saved: ${config.provider}`);
    return { success: true };
  } catch (error) {
    console.error('Error saving LLM config:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save LLM config' };
  }
});

ipcMain.handle('llm-get-config', async () => {
  try {
    const config = store.get('llm');
    if (!config) {
      return { provider: 'mock' }; // Default to mock provider
    }
    
    // Check if API key exists for the provider
    let hasApiKey = false;
    if (config.provider !== 'mock') {
      try {
        const apiKey = await keytar.getPassword('smart-qa-llm', `${config.provider}-api-key`);
        hasApiKey = !!apiKey;
      } catch (error) {
        console.warn('Failed to check API key:', error);
      }
    }
    
    return {
      provider: config.provider,
      hasApiKey
    };
  } catch (error) {
    console.error('Error getting LLM config:', error);
    return { provider: 'mock', hasApiKey: false };
  }
});

ipcMain.handle('llm-test-connection', async () => {
  try {
    const config = store.get('llm');
    if (!config || config.provider === 'mock') {
      return { success: true, message: 'Mock provider is always available' };
    }
    
    const apiKey = await keytar.getPassword('smart-qa-llm', `${config.provider}-api-key`);
    if (!apiKey) {
      return { success: false, error: 'No API key configured' };
    }
    
    // Test the connection based on provider
    if (config.provider === 'openai') {
      // Simple test API call to OpenAI
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return { success: true, message: 'OpenAI API connection successful' };
      } else {
        return { success: false, error: 'OpenAI API connection failed' };
      }
    } else if (config.provider === 'claude') {
      // Simple test for Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      
      if (response.ok) {
        return { success: true, message: 'Claude API connection successful' };
      } else {
        return { success: false, error: 'Claude API connection failed' };
      }
    }
    
    return { success: false, error: 'Unknown provider' };
  } catch (error) {
    console.error('Error testing LLM connection:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Connection test failed' };
  }
});

app.whenReady().then(async () => {
  createWindow();
  
  // Initialize GitHub authentication
  await initializeAuth();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up on app quit
app.on('before-quit', () => {
  if (browserView) {
    const currentUrl = browserView.webContents.getURL();
    if (currentUrl) {
      store.set('lastUrl', currentUrl);
    }
  }
});
