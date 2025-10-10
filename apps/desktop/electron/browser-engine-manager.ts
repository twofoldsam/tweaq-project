import { BrowserView, BrowserWindow } from 'electron';
import * as path from 'path';

/**
 * Browser Engine Types
 */
export type BrowserEngine = 'chromium' | 'edge' | 'firefox' | 'webkit';

/**
 * Browser Engine Configuration
 */
export interface BrowserEngineConfig {
  engine: BrowserEngine;
  displayName: string;
  emoji: string;
  supportsEditing: boolean;
  supportsCDP: boolean;
  canInjectScripts: boolean;
  userAgent: string;
  supportsTrueBrowser: boolean; // Can launch as true browser via Playwright
}

/**
 * Browser Engine Configurations
 */
export const BROWSER_CONFIGS: Record<BrowserEngine, BrowserEngineConfig> = {
  chromium: {
    engine: 'chromium',
    displayName: 'Chrome',
    emoji: '🌐',
    supportsEditing: true,
    supportsCDP: true,
    canInjectScripts: true,
    supportsTrueBrowser: false,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  edge: {
    engine: 'edge',
    displayName: 'Edge',
    emoji: '🔷',
    supportsEditing: true,
    supportsCDP: true,
    canInjectScripts: true,
    supportsTrueBrowser: false,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
  },
  firefox: {
    engine: 'firefox',
    displayName: 'Firefox',
    emoji: '🦊',
    supportsEditing: true, // Via script injection, but note it's emulated
    supportsCDP: false, // CDP is Chrome-specific, but we can still inject scripts
    canInjectScripts: true,
    supportsTrueBrowser: true, // Can launch true Firefox via Playwright
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
  },
  webkit: {
    engine: 'webkit',
    displayName: 'Safari',
    emoji: '🧭',
    supportsEditing: true, // Via script injection, but note it's emulated
    supportsCDP: false, // CDP is Chrome-specific, but we can still inject scripts
    canInjectScripts: true,
    supportsTrueBrowser: true, // Can launch true Safari via Playwright
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  }
};

/**
 * Browser Engine Manager
 * Manages multiple browser views for different browser engines
 */
export class BrowserEngineManager {
  private browserViews: Map<BrowserEngine, BrowserView> = new Map();
  private currentEngine: BrowserEngine = 'chromium';
  private mainWindow: BrowserWindow | null = null;
  private preloadPath: string;
  private toolbarHeight: number;
  private eventSetupCallback: ((view: BrowserView) => void) | null = null;
  
  constructor(preloadPath: string, toolbarHeight: number = 60) {
    this.preloadPath = preloadPath;
    this.toolbarHeight = toolbarHeight;
  }

  /**
   * Set a callback to setup events on new browser views
   */
  setEventSetupCallback(callback: (view: BrowserView) => void): void {
    this.eventSetupCallback = callback;
  }

  /**
   * Set the main window reference
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Create a browser view for a specific engine
   */
  private createBrowserView(engine: BrowserEngine): BrowserView {
    const config = BROWSER_CONFIGS[engine];
    
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Allow IPC access for overlay communication
        preload: this.preloadPath
      }
    });

    // Set user agent after creation
    view.webContents.setUserAgent(config.userAgent);

    // Store the engine type for later reference
    (view as any)._browserEngine = engine;
    
    console.log(`Created browser view for ${config.displayName} (${engine})`);
    
    // Setup event handlers for this view (only called once per view)
    if (this.eventSetupCallback) {
      this.eventSetupCallback(view);
      console.log(`Setup event handlers for ${config.displayName}`);
    }
    
    return view;
  }

  /**
   * Get or create a browser view for an engine
   */
  getBrowserView(engine: BrowserEngine): BrowserView {
    let view = this.browserViews.get(engine);
    
    if (!view) {
      view = this.createBrowserView(engine);
      this.browserViews.set(engine, view);
    }
    
    return view;
  }

  /**
   * Get the current browser view
   */
  getCurrentBrowserView(): BrowserView | null {
    return this.browserViews.get(this.currentEngine) || null;
  }

  /**
   * Get the current browser engine
   */
  getCurrentEngine(): BrowserEngine {
    return this.currentEngine;
  }

  /**
   * Get browser engine configuration
   */
  getEngineConfig(engine: BrowserEngine): BrowserEngineConfig {
    return BROWSER_CONFIGS[engine];
  }

  /**
   * Switch to a different browser engine
   */
  async switchEngine(newEngine: BrowserEngine, currentUrl?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.mainWindow) {
      return { success: false, error: 'Main window not set' };
    }

    try {
      // Get the current URL if not provided
      if (!currentUrl) {
        const currentView = this.getCurrentBrowserView();
        if (currentView) {
          currentUrl = currentView.webContents.getURL();
        }
      }

      // Remove current browser view
      const currentView = this.getCurrentBrowserView();
      if (currentView && this.mainWindow.getBrowserViews().includes(currentView)) {
        this.mainWindow.removeBrowserView(currentView);
      }

      // Update current engine
      this.currentEngine = newEngine;

      // Get or create new browser view
      const newView = this.getBrowserView(newEngine);

      // Add to window
      this.mainWindow.setBrowserView(newView);

      // Update bounds
      this.updateBrowserViewBounds();

      // Load the URL in the new view if available
      if (currentUrl && currentUrl !== 'about:blank' && currentUrl !== '') {
        await newView.webContents.loadURL(currentUrl);
      }

      const config = this.getEngineConfig(newEngine);
      console.log(`Switched to ${config.displayName} (${newEngine})`);

      return { success: true };
    } catch (error) {
      console.error('Error switching browser engine:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to switch browser' 
      };
    }
  }

  /**
   * Update browser view bounds
   */
  updateBrowserViewBounds(): void {
    if (!this.mainWindow) return;

    const currentView = this.getCurrentBrowserView();
    if (!currentView) return;

    const { width, height } = this.mainWindow.getBounds();
    currentView.setBounds({
      x: 0,
      y: this.toolbarHeight,
      width: width,
      height: height - this.toolbarHeight
    });
  }

  /**
   * Update bounds for layout with right pane (split view)
   */
  updateLayoutWithRightPane(rightPaneView: BrowserView): void {
    if (!this.mainWindow) return;

    const currentView = this.getCurrentBrowserView();
    if (!currentView) return;

    const { width, height } = this.mainWindow.getBounds();
    const mainViewWidth = Math.floor(width * 0.5);
    const rightViewWidth = width - mainViewWidth;

    // Left pane - current browser view
    currentView.setBounds({
      x: 0,
      y: this.toolbarHeight,
      width: mainViewWidth,
      height: height - this.toolbarHeight
    });

    // Right pane - preview
    rightPaneView.setBounds({
      x: mainViewWidth,
      y: this.toolbarHeight,
      width: rightViewWidth,
      height: height - this.toolbarHeight
    });
  }

  /**
   * Navigate current browser to URL
   */
  async navigate(url: string): Promise<{ success: boolean; error?: string; url?: string }> {
    const currentView = this.getCurrentBrowserView();
    if (!currentView) {
      return { success: false, error: 'No browser view available' };
    }

    try {
      // Ensure URL has protocol
      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
        fullUrl = `https://${url}`;
      }

      await currentView.webContents.loadURL(fullUrl);
      return { success: true, url: fullUrl };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Navigation failed' 
      };
    }
  }

  /**
   * Initialize with the default browser (chromium)
   */
  initialize(): BrowserView {
    const view = this.getBrowserView(this.currentEngine);
    return view;
  }

  /**
   * Cleanup all browser views
   */
  cleanup(): void {
    for (const [engine, view] of this.browserViews.entries()) {
      try {
        if (this.mainWindow && this.mainWindow.getBrowserViews().includes(view)) {
          this.mainWindow.removeBrowserView(view);
        }
        (view.webContents as any).destroy();
      } catch (error) {
        console.error(`Error cleaning up ${engine} view:`, error);
      }
    }
    this.browserViews.clear();
  }

  /**
   * Get all available browser engines
   */
  getAvailableEngines(): BrowserEngineConfig[] {
    return Object.values(BROWSER_CONFIGS);
  }
}

