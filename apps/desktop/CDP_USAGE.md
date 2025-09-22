# CDP Runtime Signals Usage

This document explains how to use the newly added CDP (Chrome DevTools Protocol) runtime signal collection functionality in the Smart QA Browser desktop app.

## Overview

The CDP functionality allows you to collect runtime information about selected DOM elements and available source maps from web pages. This is useful for debugging, analysis, and understanding how web applications are structured.

## Features

### Node Snapshot Collection
For any selected DOM element, the system collects:
- **Tag name**: The HTML tag name (e.g., 'div', 'button', 'span')
- **Attributes**: All HTML attributes as key-value pairs
- **Classes**: Array of CSS class names
- **ARIA role**: Accessibility role if present
- **Accessible name**: ARIA label, title, or other accessible name
- **Inner text hash**: A hash of the element's text content for identification
- **Bounding rectangle**: Position and size information (x, y, width, height)

### Source Map Collection
The system automatically discovers and fetches source maps from:
- **External script files**: Looks for `//# sourceMappingURL=` comments in loaded JavaScript files
- **Inline scripts**: Checks inline script tags for source map references
- **Data URLs**: Handles inline source maps encoded as data URLs
- **Relative URLs**: Properly resolves relative source map URLs against the script's base URL

For each source map found, it collects:
- **Source content**: The raw source map content
- **URL**: The resolved URL where the source map was found
- **Mappings**: Source map mappings string (if available)
- **Sources**: List of original source files (if available)
- **Sources content**: Original source code content (if available)

## How to Use

### Via the UI

1. **Open the desktop app** and navigate to any web page
2. **Click the settings button** (⚙️) in the toolbar
3. **Switch to the "CDP Test" tab**
4. **Click "Collect Runtime Signals"** to gather information from the current page

The results will be displayed in the UI and logged to the browser console for detailed inspection.

### Programmatically

The CDP functionality is exposed through the `window.electronAPI` interface:

```typescript
// Inject the CDP script into the current page
const injectResult = await window.electronAPI.injectCDP();

// Collect runtime signals (automatically selects an element if possible)
const result = await window.electronAPI.collectRuntimeSignals();

// Collect runtime signals for element at specific coordinates
const result = await window.electronAPI.collectRuntimeSignals({ x: 100, y: 200 });
```

### Direct Page Access

When the CDP script is injected, it exposes a `window.TweaqCDP` object with these methods:

```javascript
// Collect all runtime signals for the selected element
const signals = await window.TweaqCDP.collectRuntimeSignals();

// Get the currently selected element
const element = window.TweaqCDP.getSelectedElement();

// Get element at specific coordinates
const element = window.TweaqCDP.getElementAt(x, y);

// Collect just the node snapshot for a specific element
const snapshot = window.TweaqCDP.collectNodeSnapshot(element);

// Collect just the source maps
const sourcemaps = await window.TweaqCDP.collectSourceMaps();
```

## Data Structure

The `collectRuntimeSignals()` function returns an object with this structure:

```typescript
interface RuntimeSignals {
  nodeSnapshot?: {
    tagName: string;
    attributes: Record<string, string>;
    classes: string[];
    role?: string;
    accessibleName?: string;
    innerTextHash: string;
    boundingRect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  sourcemaps: Array<{
    source: string;      // Raw source map content
    url: string;         // Source map URL
    mappings?: string;   // Source map mappings
    sources?: string[];  // Original source file paths
    sourcesContent?: string[]; // Original source code
  }>;
}
```

## Example Output

When you run the CDP collection on a typical React app, you might see output like:

```javascript
{
  "nodeSnapshot": {
    "tagName": "button",
    "attributes": {
      "class": "btn btn-primary",
      "type": "button",
      "aria-label": "Submit form"
    },
    "classes": ["btn", "btn-primary"],
    "role": "button",
    "accessibleName": "Submit form",
    "innerTextHash": "a1b2c3d4",
    "boundingRect": {
      "x": 100,
      "y": 200,
      "width": 120,
      "height": 36
    }
  },
  "sourcemaps": [
    {
      "source": "{\"version\":3,\"file\":\"app.js\",...}",
      "url": "https://example.com/static/js/app.js.map",
      "mappings": "AAAA,OAAO,MAAM...",
      "sources": ["src/App.tsx", "src/components/Button.tsx"],
      "sourcesContent": ["import React from 'react'..."]
    }
  ]
}
```

## Console Logging

The CDP test component automatically logs collected information to the browser console:

- **Node snapshots** are logged with full details
- **Source map URLs** are listed for easy copying
- **Raw data** is available for programmatic access

Check the browser's developer console (F12) when using the CDP functionality to see detailed logs.

## Error Handling

The system gracefully handles various error conditions:
- **Network errors** when fetching source maps
- **Parse errors** for malformed source maps
- **Missing elements** when no element is selected
- **Access restrictions** due to CORS or other security policies

Errors are logged to the console and returned in the API response for proper handling.
