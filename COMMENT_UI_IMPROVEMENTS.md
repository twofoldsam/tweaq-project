# Comment Feature UI/UX Improvements

## Overview
This document describes the improvements made to the commenting feature's UI and UX.

## Changes Made

### 1. **Dark Mode Design**
- Replaced light mode styling with dark mode as the default
- Background: Dark semi-transparent `rgba(40, 40, 40, 0.95)` with blur effect
- Textarea: Dark background `rgba(255, 255, 255, 0.08)` with white text
- Border: Subtle white border `rgba(255, 255, 255, 0.15)`
- Enhanced shadow for better visual hierarchy

### 2. **Simplified UX**
- **Removed collapsed state**: Comment field now always appears expanded when an element is selected
- **Auto-focus**: Textarea is automatically focused when the comment pill appears, allowing users to start typing immediately
- **Removed Cancel button**: Simplified the interface by removing the cancel button
- **Icon-only submit button**: Replaced text+icon button with a clean icon-only send button

### 3. **Visual Feedback**
- **Disabled state**: Send icon appears greyed out (`rgba(255, 255, 255, 0.4)`) when textarea is empty
- **Active state**: Send icon becomes blue (`#007acc`) when text is entered
- **Hover effects**: Subtle background change on hover for better interactivity
- **Focus state**: Enhanced focus ring on textarea with blue accent color

### 4. **Improved Interactions**
- Send button is disabled until user types content
- Tooltip shows "Type a comment to send" when disabled
- Tooltip changes to "Send comment (⌘+Enter)" when active
- Escape key clears the textarea instead of collapsing the field
- Enter + Cmd/Ctrl sends the comment (existing behavior preserved)

## Files Modified

1. **`/packages/overlay/src/components/CommentPill.tsx`**
   - Removed `isExpanded` state
   - Removed collapsed view rendering
   - Removed Cancel button from expanded view
   - Simplified submit button to icon-only
   - Removed hint text
   - Auto-focus textarea on mount

2. **`/packages/overlay/src/styles/overlay.css`**
   - Replaced light mode styles with dark mode as default
   - Removed collapsed state styles
   - Updated textarea styles for dark theme
   - Simplified button styles
   - Removed cancel button styles
   - Made submit button icon-only with proper sizing

3. **`/packages/overlay/src/preload/figma-style-overlay.js`**
   - Updated `createCommentPill()` to create expanded state by default
   - Removed `expandCommentPill()` and `collapseCommentPill()` methods
   - Added `setupCommentPillListeners()` to handle all event listeners
   - Updated `updateCommentPillPosition()` to auto-focus textarea when shown
   - Simplified comment submission flow

## User Experience Benefits

1. **Faster workflow**: No need to click to expand the comment field - it's ready immediately
2. **Less clicks**: Removed unnecessary cancel button and collapse/expand interaction
3. **Better visibility**: Dark mode matches the overall interface design
4. **Clear feedback**: Visual states clearly indicate when the send button is active
5. **Keyboard-friendly**: Auto-focus enables immediate typing without mouse interaction

## Technical Notes

- All changes are backwards compatible
- No breaking changes to the API or event handlers
- Responsive design maintained (mobile breakpoints preserved)
- TypeScript compilation successful with no errors
- All existing keyboard shortcuts preserved (Cmd+Enter to send, Escape to clear)

