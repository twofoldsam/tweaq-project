# Enhanced Edit Mode Preview

This document describes the enhanced two-layer preview system for the Tweaq overlay edit mode.

## Overview

The enhanced preview system provides two distinct preview layers:

1. **Inline Preview** (existing) - Direct manipulation of element styles for instant feedback
2. **Adapter CSS Preview** (new) - Generated CSS override layer that approximates the final code change using adapter rules

## Features

### Preview Source Toggle
- **Inline**: Instant preview by directly modifying element styles
- **Adapter CSS**: Preview using generated CSS rules (Tailwind first, with fallback to raw CSS)

### View Modes
- **Before**: Show original element state
- **After**: Show modified element state  
- **Split**: Side-by-side comparison with draggable scrubber

### Confidence Display
- **High**: Exact Tailwind class matches or well-known CSS patterns
- **Medium**: Approximate matches or arbitrary value classes
- **Low**: Raw CSS fallback or uncertain mappings

## Technical Implementation

### CSS Adapter System

The `cssAdapter.ts` utility provides:

- **Tailwind Mapping**: Converts CSS properties to Tailwind classes
- **Confidence Scoring**: Rates the accuracy of each mapping
- **CSS Generation**: Creates scoped CSS rules from mappings
- **Style Injection**: Manages `<style id="__smartqa-override">` tags

Example usage:
```typescript
import { createAdapterPreview, generateAdapterCSS, injectAdapterCSS } from '@tweaq/overlay';

const preview = createAdapterPreview(selector, pendingEdits);
const css = generateAdapterCSS(preview);
injectAdapterCSS(css);
```

### Preview Controls Component

The `PreviewControls` component provides:

- Source toggle (Inline vs Adapter CSS)
- View mode selection (Before/After/Split)
- Draggable split scrubber
- Confidence chip display

```typescript
import { PreviewControls } from '@tweaq/overlay';

<PreviewControls
  previewState={previewState}
  onPreviewSourceChange={handleSourceChange}
  onViewModeChange={handleViewModeChange}
  onSplitPositionChange={handleSplitChange}
  confidence="high"
/>
```

### GitHub Integration

Enhanced preview accuracy through repository context detection:

```typescript
import { detectProjectContext, createEnhancedAdapterPreview } from '@tweaq/overlay';

// Detect project context
const context = await detectProjectContext('owner', 'repo', 'main');

// Create enhanced preview with context
const preview = await createEnhancedAdapterPreview(
  selector, 
  pendingEdits, 
  { githubContext: context }
);
```

The GitHub integration provides:

- **Project Type Detection**: React, Vue, Angular, or vanilla
- **CSS Framework Detection**: Tailwind, Bootstrap, Material-UI, etc.
- **Enhanced Mappings**: Framework-specific class suggestions
- **Pull Request Generation**: Automated diff creation for code changes

## CSS Framework Support

### Tailwind CSS (Primary)
- Direct class mapping for common properties
- Arbitrary value classes for custom values
- High confidence for exact matches

### Bootstrap
- Converts Tailwind-style mappings to Bootstrap equivalents
- Utility class suggestions where applicable

### Material-UI
- Theme-based style suggestions
- Component-aware mappings

### Raw CSS (Fallback)
- Standard CSS property/value pairs
- Used when framework-specific mappings aren't available

## Confidence Scoring

The confidence system rates mapping accuracy:

### High Confidence (Green)
- Exact Tailwind class matches
- Well-known CSS patterns
- Framework-specific mappings with context

### Medium Confidence (Yellow)  
- Approximate Tailwind matches
- Arbitrary value classes
- Partial framework mappings

### Low Confidence (Red)
- Raw CSS fallback
- Unknown property patterns
- Missing framework context

## View Mode Implementation

### Before Mode
- Restores original element styles
- Removes all preview modifications
- Shows baseline state

### After Mode
- Applies all pending modifications
- Uses selected preview source (inline/adapter)
- Shows final intended state

### Split Mode
- Visual overlay with gradient split
- Draggable scrubber for position control
- Real-time comparison view

## Usage Examples

### Basic Enhanced Preview

```typescript
import { EditPanel } from '@tweaq/overlay';

<EditPanel
  elementInfo={elementInfo}
  selectedElement={element}
  pendingEdits={pendingEdits}
  onPropertyChange={handlePropertyChange}
  onRecordEdit={handleRecordEdit}
  onResetChanges={handleResetChanges}
  onClose={handleClose}
  elementSelector="#my-element"
/>
```

### With GitHub Context

```typescript
import { 
  detectProjectContext, 
  createEnhancedAdapterPreview,
  GitHubIntegrationExample 
} from '@tweaq/overlay';

// Detect context
const context = await detectProjectContext('user', 'repo');

// Use in component
<GitHubIntegrationExample
  owner="user"
  repo="repo"
  branch="main"
  visualEdits={visualEdits}
/>
```

## CSS Classes Reference

### Preview Controls
- `.tweaq-preview-controls` - Main container
- `.tweaq-preview-toggle` - Source toggle buttons
- `.tweaq-view-mode-toggle` - View mode buttons
- `.tweaq-split-scrubber` - Split view scrubber
- `.tweaq-confidence-chip` - Confidence indicator

### Enhanced Edit Panel
- `.tweaq-edit-panel` - Main panel container
- `.tweaq-section-changed` - Highlighted changed sections
- `.tweaq-view-mode-overlay` - View mode visual overlays

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance Considerations

- CSS injection is debounced to prevent excessive DOM manipulation
- Original styles are cached to avoid repeated computations
- Framework detection uses lightweight API calls with caching
- Split view overlays use CSS transforms for smooth performance

## Future Enhancements

- **Real-time Collaboration**: Share preview states across team members
- **A/B Testing Integration**: Compare multiple design variations
- **Design System Integration**: Validate changes against design tokens
- **Accessibility Preview**: Show how changes affect screen readers
- **Performance Impact**: Estimate CSS bundle size changes
