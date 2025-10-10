# UI Improvements - Clean Browser Interface

## Overview
Redesigned the Smart QA Browser interface to match the clean, subtle aesthetic of modern browsers like Dia Browser.

## Changes Made

### 1. ShadCN Components Integration
- ✅ Installed ShadCN dependencies (class-variance-authority, clsx, tailwind-merge, lucide-react)
- ✅ Configured Tailwind CSS with design tokens
- ✅ Created reusable Button component with variants (default, ghost, subtle)
- ✅ Set up utility functions for className merging

### 2. New UI Design
- ✅ **QA Button**: Subtle text button with icon in the top right that launches the Visual Coding Agent
  - Shows "QA" text with a message icon
  - Clean, minimal design with subtle hover states
  - Active state shows blue highlight
  - Opens the QA/Edit panel when clicked

- ✅ **Settings Icon**: Small icon button to the right of QA button
  - Gear icon for settings
  - Opens settings view with tabs (GitHub, LLM, CDP)
  - Consistent styling with QA button
  - Automatically closes QA panel when opened

### 3. Improved User Experience
- ✅ Separated QA panel from settings view
- ✅ Better state management between QA and Settings modes
- ✅ Cleaner visual hierarchy
- ✅ Removed Visual Agent tab from settings (now accessed via QA button)
- ✅ Status indicators (favicon, loading, etc.) only show when QA panel and settings are closed

### 4. Styling Updates
- ✅ Added subtle hover effects
- ✅ Active state indicators with blue accent color
- ✅ Dark mode support
- ✅ Smooth transitions and animations
- ✅ Consistent spacing and sizing

## Files Modified

### Core Files
- `apps/desktop/src/App.tsx` - Main application logic and UI structure
- `apps/desktop/src/App.css` - Updated styles for new buttons
- `apps/desktop/src/index.css` - Integrated Tailwind CSS

### New Files
- `apps/desktop/src/components/ui/button.tsx` - ShadCN Button component
- `apps/desktop/src/lib/utils.ts` - Utility functions for className merging
- `apps/desktop/tailwind.config.js` - Tailwind configuration
- `apps/desktop/postcss.config.js` - PostCSS configuration

## Design Principles

1. **Subtle & Clean**: Buttons are transparent by default, only showing background on hover
2. **Contextual**: Status information only appears when relevant
3. **Consistent**: All interactive elements follow the same design language
4. **Accessible**: Clear hover and active states for all interactive elements
5. **Modern**: Smooth transitions and contemporary styling

## Browser Comparison

### Before
- Large settings button with emoji
- All features in one settings view
- Visual clutter with multiple buttons

### After (Dia Browser-style)
- Subtle "QA" text button
- Clean settings icon
- Minimal visual footprint
- Clear separation of concerns

## Usage

### Opening QA Panel
Click the "QA" button in the top right corner → Opens Visual Coding Agent

### Opening Settings
Click the settings icon (gear) → Opens settings view with tabs

### Navigation
- QA and Settings are mutually exclusive
- Opening one automatically closes the other
- Browser navigation is disabled when either is open

## Testing

Build and run the desktop app to see the new UI:
```bash
cd apps/desktop
npm run dev
```

## Future Enhancements

Potential improvements:
- [ ] Keyboard shortcuts for QA and Settings
- [ ] Animation when panels slide in/out
- [ ] Customizable button positions
- [ ] More ShadCN components as needed

