/**
 * Visual validation result for a specific element or page
 */
export interface VisualValidation {
  passed: boolean;
  element?: {
    tagName: string;
    classes: string[];
    text: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    computedStyles?: Record<string, string>;
  };
  screenshot?: string; // Base64 data URL
  message: string;
  timestamp: number;
}

/**
 * Visual Validator
 * 
 * Uses Playwright and CDP to validate visual changes in the application
 * 
 * Note: Requires playwright to be installed:
 * npm install playwright
 */
export class VisualValidator {
  private browser: any = null;
  private page: any = null;

  /**
   * Initialize the browser for visual testing
   */
  async initialize(): Promise<void> {
    console.log('🎨 Initializing visual validator...');
    
    // Dynamically import playwright to avoid hard dependency
    const { chromium } = await import('playwright');
    
    this.browser = await chromium.launch({
      headless: true,
      args: ['--disable-web-security'] // For testing local apps
    });

    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 }
    });

    this.page = await context.newPage();
    
    console.log('   ✅ Visual validator ready');
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Visual validator not initialized');
    }

    console.log(`   Navigating to ${url}...`);
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Capture a screenshot of the entire page
   */
  async captureScreenshot(description: string = 'Page screenshot'): Promise<{
    dataUrl: string;
    description: string;
    timestamp: number;
  }> {
    if (!this.page) {
      throw new Error('Visual validator not initialized');
    }

    const screenshot = await this.page.screenshot({ type: 'png', fullPage: true });
    const dataUrl = `data:image/png;base64,${screenshot.toString('base64')}`;

    return {
      dataUrl,
      description,
      timestamp: Date.now()
    };
  }

  /**
   * Find element by selector and validate it
   */
  async validateElement(selector: string, expectedProps?: {
    text?: string;
    visible?: boolean;
    styles?: Record<string, string>;
  }): Promise<VisualValidation> {
    if (!this.page) {
      throw new Error('Visual validator not initialized');
    }

    try {
      const element = await this.page.$(selector);
      
      if (!element) {
        return {
          passed: false,
          message: `Element not found: ${selector}`,
          timestamp: Date.now()
        };
      }

      // Get element info
      const tagName = await element.evaluate((el: Element) => el.tagName.toLowerCase());
      const classes = await element.evaluate((el: Element) => Array.from(el.classList));
      const text = await element.evaluate((el: Element) => el.textContent?.trim() || '');
      const boundingBox = await element.boundingBox();

      // Get computed styles if requested
      let computedStyles: Record<string, string> | undefined;
      if (expectedProps?.styles) {
        const styleKeys = Object.keys(expectedProps.styles);
        computedStyles = await element.evaluate((el: Element, keys: string[]) => {
          const styles = (window as Window).getComputedStyle(el);
          const result: Record<string, string> = {};
          keys.forEach((key: string) => {
            result[key] = styles.getPropertyValue(key);
          });
          return result;
        }, styleKeys);
      }

      // Capture element screenshot
      const screenshot = await element.screenshot({ type: 'png' });
      const screenshotDataUrl = `data:image/png;base64,${screenshot.toString('base64')}`;

      // Validate expectations
      let passed = true;
      const messages: string[] = [];

      if (expectedProps?.text && !text.includes(expectedProps.text)) {
        passed = false;
        messages.push(`Expected text "${expectedProps.text}" not found. Got: "${text}"`);
      }

      if (expectedProps?.visible !== undefined) {
        const isVisible = boundingBox !== null;
        if (isVisible !== expectedProps.visible) {
          passed = false;
          messages.push(`Element visibility mismatch. Expected: ${expectedProps.visible}, Got: ${isVisible}`);
        }
      }

      if (expectedProps?.styles && computedStyles) {
        for (const [key, expectedValue] of Object.entries(expectedProps.styles)) {
          const actualValue = computedStyles[key];
          if (actualValue !== expectedValue) {
            passed = false;
            messages.push(`Style ${key}: expected "${expectedValue}", got "${actualValue}"`);
          }
        }
      }

      return {
        passed,
        element: {
          tagName,
          classes,
          text,
          boundingBox: boundingBox || { x: 0, y: 0, width: 0, height: 0 },
          computedStyles
        },
        screenshot: screenshotDataUrl,
        message: passed 
          ? `Element validated successfully: ${selector}`
          : messages.join('; '),
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        passed: false,
        message: `Error validating element: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Execute CDP commands to collect runtime signals
   */
  async collectRuntimeSignals(selector?: string): Promise<any> {
    if (!this.page) {
      throw new Error('Visual validator not initialized');
    }

    // Inject CDP helper script
    await this.page.addScriptTag({
      content: `
        window.collectNodeSnapshot = function(element) {
          const attributes = {};
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            attributes[attr.name] = attr.value;
          }
          
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);
          
          return {
            tagName: element.tagName.toLowerCase(),
            attributes,
            classes: Array.from(element.classList),
            text: element.textContent?.trim(),
            boundingRect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            },
            computedStyles: {
              fontSize: styles.fontSize,
              color: styles.color,
              backgroundColor: styles.backgroundColor,
              padding: styles.padding,
              margin: styles.margin,
              display: styles.display
            }
          };
        };
      `
    });

    if (selector) {
      // Collect for specific element
      return await this.page.evaluate((sel: string) => {
        const element = (document as Document).querySelector(sel);
        if (!element) return null;
        return ((window as Window) as any).collectNodeSnapshot(element);
      }, selector);
    }

    return null;
  }

  /**
   * Validate page accessibility
   */
  async validateAccessibility(): Promise<{
    passed: boolean;
    issues: Array<{ severity: string; message: string }>;
  }> {
    if (!this.page) {
      throw new Error('Visual validator not initialized');
    }

    // Run basic accessibility checks
    const issues = await this.page.evaluate(() => {
      const results: Array<{ severity: string; message: string }> = [];
      const doc = document as Document;
      
      // Check for images without alt text
      const images = doc.querySelectorAll('img:not([alt])');
      if (images.length > 0) {
        results.push({
          severity: 'warning',
          message: `Found ${images.length} images without alt text`
        });
      }

      // Check for buttons without accessible names
      const buttons = doc.querySelectorAll('button:not([aria-label]):not([title])');
      const buttonsWithoutText = Array.from(buttons).filter(
        (btn: Element) => !(btn as HTMLElement).textContent?.trim()
      );
      if (buttonsWithoutText.length > 0) {
        results.push({
          severity: 'warning',
          message: `Found ${buttonsWithoutText.length} buttons without accessible names`
        });
      }

      // Check for proper heading hierarchy
      const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const levels = headings.map((h: Element) => parseInt((h as HTMLElement).tagName[1]));
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) {
          results.push({
            severity: 'warning',
            message: 'Heading hierarchy skips levels'
          });
          break;
        }
      }

      return results;
    });

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Cleanup - close browser
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('   🧹 Visual validator cleaned up');
    }
  }
}

