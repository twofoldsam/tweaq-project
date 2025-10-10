import { BrowserWindow, nativeImage } from 'electron';
import { Browser, Page, chromium, firefox, webkit } from 'playwright';

export type PlaywrightEngine = 'firefox' | 'webkit';

export interface PlaywrightBrowserConfig {
  engine: PlaywrightEngine;
  displayName: string;
  emoji: string;
  supportsEditing: boolean;
  isReadOnly: true; // Always read-only for Playwright browsers
}

export const PLAYWRIGHT_CONFIGS: Record<PlaywrightEngine, PlaywrightBrowserConfig> = {
  firefox: {
    engine: 'firefox',
    displayName: 'Firefox (True)',
    emoji: '🦊',
    supportsEditing: false,
    isReadOnly: true
  },
  webkit: {
    engine: 'webkit',
    displayName: 'Safari (True)',
    emoji: '🧭',
    supportsEditing: false,
    isReadOnly: true
  }
};

interface BrowserInstance {
  browser: Browser;
  page: Page;
  screenshotDataUrl: string | null;
}

/**
 * Playwright Browser Manager
 * Manages true Firefox and WebKit browsers via Playwright
 * These browsers render in a separate process and are displayed via screenshots
 */
export class PlaywrightBrowserManager {
  private browserInstances: Map<PlaywrightEngine, BrowserInstance> = new Map();
  private currentEngine: PlaywrightEngine | null = null;
  private mainWindow: BrowserWindow | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private screenshotRefreshRate: number = 100; // ms

  /**
   * Set the main window reference
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Launch a Playwright browser
   */
  private async launchBrowser(engine: PlaywrightEngine): Promise<BrowserInstance> {
    let browser: Browser;

    console.log(`Launching Playwright ${engine}...`);

    switch (engine) {
      case 'firefox':
        browser = await firefox.launch({
          headless: false, // Show the browser for debugging
        });
        break;
      case 'webkit':
        browser = await webkit.launch({
          headless: false,
        });
        break;
    }

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    console.log(`✅ Playwright ${engine} launched successfully`);

    return {
      browser,
      page,
      screenshotDataUrl: null,
    };
  }

  /**
   * Get or create a Playwright browser instance
   */
  async getBrowserInstance(engine: PlaywrightEngine): Promise<BrowserInstance> {
    let instance = this.browserInstances.get(engine);

    if (!instance) {
      instance = await this.launchBrowser(engine);
      this.browserInstances.set(engine, instance);
    }

    return instance;
  }

  /**
   * Navigate to a URL in the Playwright browser
   */
  async navigate(engine: PlaywrightEngine, url: string): Promise<{ success: boolean; error?: string }> {
    try {
      const instance = await this.getBrowserInstance(engine);

      // Ensure URL has protocol
      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = `https://${url}`;
      }

      await instance.page.goto(fullUrl, { waitUntil: 'domcontentloaded' });

      console.log(`Navigated Playwright ${engine} to ${fullUrl}`);

      return { success: true };
    } catch (error) {
      console.error(`Error navigating Playwright ${engine}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Navigation failed',
      };
    }
  }

  /**
   * Capture a screenshot of the current page
   */
  async captureScreenshot(engine: PlaywrightEngine): Promise<string | null> {
    try {
      const instance = this.browserInstances.get(engine);
      if (!instance) return null;

      const screenshot = await instance.page.screenshot({ type: 'png' });
      const dataUrl = `data:image/png;base64,${screenshot.toString('base64')}`;

      instance.screenshotDataUrl = dataUrl;

      return dataUrl;
    } catch (error) {
      console.error(`Error capturing screenshot for ${engine}:`, error);
      return null;
    }
  }

  /**
   * Start continuous screenshot updates for live preview
   */
  async startScreenshotUpdates(engine: PlaywrightEngine): Promise<void> {
    this.stopScreenshotUpdates();

    this.currentEngine = engine;

    this.updateInterval = setInterval(async () => {
      if (this.currentEngine === engine) {
        const dataUrl = await this.captureScreenshot(engine);
        if (dataUrl && this.mainWindow) {
          // Send screenshot to renderer
          this.mainWindow.webContents.send('playwright-screenshot-update', {
            engine,
            dataUrl,
          });
        }
      }
    }, this.screenshotRefreshRate);

    console.log(`Started screenshot updates for ${engine}`);
  }

  /**
   * Stop screenshot updates
   */
  stopScreenshotUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.currentEngine = null;
      console.log('Stopped screenshot updates');
    }
  }

  /**
   * Get current page title
   */
  async getPageTitle(engine: PlaywrightEngine): Promise<string> {
    try {
      const instance = this.browserInstances.get(engine);
      if (!instance) return '';

      return await instance.page.title();
    } catch (error) {
      return '';
    }
  }

  /**
   * Get current URL
   */
  getCurrentUrl(engine: PlaywrightEngine): string {
    const instance = this.browserInstances.get(engine);
    return instance?.page.url() || '';
  }

  /**
   * Go back in history
   */
  async goBack(engine: PlaywrightEngine): Promise<boolean> {
    try {
      const instance = this.browserInstances.get(engine);
      if (!instance) return false;

      await instance.page.goBack({ waitUntil: 'domcontentloaded' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Go forward in history
   */
  async goForward(engine: PlaywrightEngine): Promise<boolean> {
    try {
      const instance = this.browserInstances.get(engine);
      if (!instance) return false;

      await instance.page.goForward({ waitUntil: 'domcontentloaded' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reload the page
   */
  async reload(engine: PlaywrightEngine): Promise<boolean> {
    try {
      const instance = this.browserInstances.get(engine);
      if (!instance) return false;

      await instance.page.reload({ waitUntil: 'domcontentloaded' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if can go back
   */
  canGoBack(engine: PlaywrightEngine): boolean {
    // Playwright doesn't expose history directly, so we'll assume true if page exists
    const instance = this.browserInstances.get(engine);
    return !!instance;
  }

  /**
   * Check if can go forward
   */
  canGoForward(engine: PlaywrightEngine): boolean {
    // Playwright doesn't expose history directly, so we'll assume true if page exists
    const instance = this.browserInstances.get(engine);
    return !!instance;
  }

  /**
   * Close a browser instance
   */
  async closeBrowser(engine: PlaywrightEngine): Promise<void> {
    const instance = this.browserInstances.get(engine);
    if (instance) {
      await instance.browser.close();
      this.browserInstances.delete(engine);
      console.log(`Closed Playwright ${engine}`);
    }
  }

  /**
   * Cleanup all browser instances
   */
  async cleanup(): Promise<void> {
    this.stopScreenshotUpdates();

    for (const [engine, instance] of this.browserInstances.entries()) {
      try {
        await instance.browser.close();
        console.log(`Cleaned up Playwright ${engine}`);
      } catch (error) {
        console.error(`Error cleaning up ${engine}:`, error);
      }
    }

    this.browserInstances.clear();
  }

  /**
   * Get available Playwright engines
   */
  getAvailableEngines(): PlaywrightBrowserConfig[] {
    return Object.values(PLAYWRIGHT_CONFIGS);
  }

  /**
   * Get engine configuration
   */
  getEngineConfig(engine: PlaywrightEngine): PlaywrightBrowserConfig {
    return PLAYWRIGHT_CONFIGS[engine];
  }
}

