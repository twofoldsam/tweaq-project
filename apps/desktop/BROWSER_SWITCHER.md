# Browser Switcher Feature

## Overview

The Browser Switcher feature allows users to test web applications across different browser engines directly within the Smart QA Browser desktop application. Users can switch between Chrome, Edge, Firefox, and Safari using a dropdown in the toolbar.

## Features

### Supported Browsers

1. **🌐 Chrome (Chromium)**
   - Native Chromium rendering
   - ✅ Full editing support
   - ✅ CDP (Chrome DevTools Protocol) support
   - ✅ Script injection support
   - Status: **Full Editing**

2. **🔷 Edge**
   - Native Chromium rendering with Edge user-agent
   - ✅ Full editing support
   - ✅ CDP support
   - ✅ Script injection support
   - Status: **Full Editing**

3. **🦊 Firefox**
   - Chromium rendering with Firefox user-agent
   - ✅ Editing support (via script injection)
   - ❌ No CDP support (Chrome-specific)
   - ✅ Script injection support
   - Status: **⚠️ Emulated** (using Chromium engine)

4. **🧭 Safari (WebKit)**
   - Chromium rendering with Safari user-agent
   - ✅ Editing support (via script injection)
   - ❌ No CDP support (Chrome-specific)
   - ✅ Script injection support
   - Status: **⚠️ Emulated** (using Chromium engine)

## Technical Implementation

### Architecture

The browser switcher is built using:

1. **BrowserEngineManager** (`apps/desktop/electron/browser-engine-manager.ts`)
   - Manages multiple BrowserView instances
   - Handles switching between browser engines
   - Maintains separate views for each browser
   - Sets appropriate user-agent strings

2. **BrowserSelector Component** (`apps/desktop/src/components/BrowserSelector.tsx`)
   - UI dropdown for browser selection
   - Displays current browser with emoji
   - Shows capability badges (Full Editing, Emulated, View Only)
   - Handles browser switching logic

3. **IPC Communication** (Updated in `preload.ts` and `main.ts`)
   - `browser-get-current-engine`: Get current browser
   - `browser-get-available-engines`: List all browsers
   - `browser-switch-engine`: Switch to a different browser
   - `browser-get-engine-config`: Get browser capabilities
   - `browser-engine-changed`: Event when browser changes

### User-Agent Emulation

Since Electron is built on Chromium, true multi-engine rendering is not possible. The implementation uses:

- **Chrome/Edge**: Native Chromium with appropriate user-agents
- **Firefox/Safari**: Chromium rendering with Firefox/Safari user-agents

This approach is useful for:
- Testing user-agent-based feature detection
- Responsive design testing
- General cross-browser compatibility checks

⚠️ **Note**: This does NOT test actual Firefox or Safari rendering engines. For true cross-browser testing, consider integrating Playwright in a future enhancement.

## Usage

### For End Users

1. **Open the application** and navigate to any URL
2. **Locate the browser selector** dropdown in the toolbar (between navigation controls and URL bar)
3. **Select a browser** from the dropdown:
   - 🌐 Chrome
   - 🔷 Edge
   - 🦊 Firefox
   - 🧭 Safari
4. **Wait for the switch** - the current page will reload in the selected browser
5. **Check the capability badge** to understand what features are available:
   - ✅ **Full Editing**: All editing features available
   - ⚠️ **Emulated**: Using Chromium engine with browser-specific user-agent
   - 👁️ **View Only**: Read-only mode (not currently used)

### State Management

- The current URL is preserved when switching browsers
- Each browser view is cached for performance
- Navigation events are properly wired to the active browser
- The app remembers the last browser used (via store)

## Limitations

### Current Limitations

1. **Engine Emulation**: Firefox and Safari use Chromium rendering with different user-agents
2. **Browser-Specific Bugs**: Cannot test actual engine-specific bugs
3. **CSS Rendering**: May not match true Firefox/Safari rendering
4. **JavaScript APIs**: Uses Chromium's implementations, not native Firefox/Safari APIs

### What Works

- ✅ User-agent detection
- ✅ Responsive design testing
- ✅ Basic compatibility testing
- ✅ Visual editing and overlay features
- ✅ CDP features (Chrome/Edge only)
- ✅ Script injection across all browsers

## Future Enhancements

### Phase 2: Playwright Integration

For true cross-browser testing, consider integrating Playwright:

```typescript
// Future implementation concept
import { chromium, firefox, webkit } from 'playwright';

async function createRealBrowser(engine: 'firefox' | 'webkit') {
  const browser = await playwright[engine].launch();
  const page = await browser.newPage();
  
  // Capture screenshots and display in Electron
  // Make these views read-only or with limited editing
}
```

Benefits:
- True Firefox and Safari rendering
- Accurate cross-browser testing
- Real engine-specific bug detection

Challenges:
- More complex architecture
- Performance overhead
- Limited or no editing capabilities
- Requires separate browser installations

### Phase 3: Advanced Features

- **Network throttling** per browser
- **Device emulation** specific to each browser
- **Screenshot comparison** across browsers
- **Automated testing** workflows
- **Performance profiling** per browser

## Development

### Adding a New Browser

To add support for a new browser:

1. **Update `BROWSER_CONFIGS`** in `browser-engine-manager.ts`:
```typescript
newbrowser: {
  engine: 'newbrowser',
  displayName: 'New Browser',
  emoji: '🆕',
  supportsEditing: true,
  supportsCDP: false,
  canInjectScripts: true,
  userAgent: 'Mozilla/5.0 ...'
}
```

2. **Update the `BrowserEngine` type** in all files:
```typescript
type BrowserEngine = 'chromium' | 'edge' | 'firefox' | 'webkit' | 'newbrowser';
```

3. The UI will automatically pick up the new browser from the config

### Testing

To test the browser switcher:

1. **Build the application**: `npm run build`
2. **Run the app**: `npm run start` or `npm run dev`
3. **Switch between browsers** and verify:
   - Current URL is preserved
   - Capability badge is correct
   - Editing features work as expected
   - CDP features work for Chrome/Edge only

## API Reference

### BrowserEngineManager

```typescript
class BrowserEngineManager {
  // Initialize the manager
  constructor(preloadPath: string, toolbarHeight: number)
  
  // Set the main window
  setMainWindow(window: BrowserWindow): void
  
  // Get or create a browser view
  getBrowserView(engine: BrowserEngine): BrowserView
  
  // Get current browser view
  getCurrentBrowserView(): BrowserView | null
  
  // Get current engine
  getCurrentEngine(): BrowserEngine
  
  // Switch to a different engine
  switchEngine(newEngine: BrowserEngine, currentUrl?: string): Promise<Result>
  
  // Navigate to a URL
  navigate(url: string): Promise<Result>
  
  // Update view bounds
  updateBrowserViewBounds(): void
}
```

### Electron API

```typescript
interface ElectronAPI {
  // Get current browser engine
  browserGetCurrentEngine(): Promise<{ engine: BrowserEngine }>
  
  // Get all available engines
  browserGetAvailableEngines(): Promise<{ engines: BrowserEngineConfig[] }>
  
  // Switch to a different engine
  browserSwitchEngine(engine: BrowserEngine): Promise<{ success: boolean; error?: string }>
  
  // Get engine configuration
  browserGetEngineConfig(engine: BrowserEngine): Promise<BrowserEngineConfig | null>
  
  // Listen for engine changes
  onBrowserEngineChanged(callback: (data) => void): () => void
}
```

## Troubleshooting

### Browser doesn't switch
- Check console for errors
- Ensure the URL is valid
- Try reloading the application

### Editing features don't work
- Check the capability badge
- CDP features only work with Chrome/Edge
- Script injection should work on all browsers

### Performance issues
- The app caches browser views for performance
- Try closing unused views (future enhancement)
- Reduce the number of simultaneous browser views

## Credits

Implemented as part of the Smart QA Browser MVP Phase 1.

