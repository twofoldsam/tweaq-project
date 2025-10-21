# Comment to Tweaq Conversion Feature

## Overview
This feature allows users to automatically convert comments on a webpage into actionable tweaqs (change requests) using AI (Claude). The system analyzes all comments, groups similar ones together, and generates structured tweaq objects that can be sent to the agent for implementation.

## How It Works

### 1. User Flow
1. **Add Comments**: Users add comments to elements on the page using the comment mode
2. **Switch to Tweaqs Panel**: Navigate to the 'Tweaqs' panel view
3. **See Conversion Card**: If comments exist, a conversion card appears showing the comment count
4. **Click "Create Tweaqs"**: User clicks the button to start the conversion process
5. **AI Processing**: Claude analyzes all comments and generates tweaqs
6. **Tweaqs Created**: New tweaq cards appear in the Tweaqs panel
7. **Comments Removed**: Original comment bubbles are removed from the page
8. **Ready to Send**: User can now send the tweaqs to the agent

### 2. Technical Implementation

#### Frontend (Overlay)
**File**: `/packages/overlay/src/preload/figma-style-overlay.js`

**New UI Components**:
- Conversion card that displays when comments exist
- Shows comment count and "Create Tweaqs" button
- Loading indicator during AI processing

**New Methods**:
- `convertCommentsToTweaqs()`: Main conversion handler
- `collectCommentsData()`: Collects and formats comment data with element information
- `convertTweaqToEdit()`: Converts AI-generated tweaq into a structured edit object
- `removeAllComments()`: Removes all comment bubbles and clears comment array

**CSS Styles**:
- Gradient purple card design
- Smooth animations and hover effects
- Loading spinner for AI processing

#### Backend (Electron Main Process)
**File**: `/apps/desktop/electron/main.ts`

**New IPC Handler**: `convert-comments-to-tweaqs`
- Receives comment data from overlay
- Calls Claude API with structured prompt
- Parses JSON response
- Returns tweaq objects

**Helper Function**: `buildCommentsToTweaqsPrompt()`
- Constructs comprehensive prompt for Claude
- Includes comment data, element info, and styling context
- Provides examples and guidelines for AI
- Ensures proper JSON output format

#### Preload Bridge
**File**: `/apps/desktop/electron/preload.ts`

**New API Method**: `convertCommentsToTweaqs()`
- TypeScript interface definition
- IPC bridge to main process
- Type-safe comment data passing

### 3. AI Processing

#### Prompt Design
The Claude prompt instructs the AI to:
- Analyze all comments and their context
- Group similar/duplicate comments
- Identify specific changes needed (property, value, etc.)
- Generate actionable tweaq objects
- Include original comment references

#### AI Capabilities
- **Grouping**: Combines comments asking for the same change
- **Inference**: Interprets vague comments (e.g., "make bigger" → fontSize increase)
- **Context-Aware**: Uses element info and current styles
- **Categorization**: Assigns appropriate category (copy, style, color, etc.)
- **Specificity**: Generates exact CSS values and property names

### 4. Data Structures

#### Comment Data (Sent to AI)
```javascript
{
  id: "comment_123",
  text: "Change this to blue",
  timestamp: 1234567890,
  elementSelector: "button.submit-btn",
  elementInfo: {
    tag: "button",
    id: "submit",
    classes: "submit-btn primary",
    textContent: "Submit",
    computedStyles: { /* CSS properties */ }
  },
  position: { x, y, width, height },
  relatedCommentsCount: 1
}
```

#### Tweaq Object (Returned from AI)
```javascript
{
  description: "Change button color to blue",
  elementSelector: "button.submit-btn",
  category: "color",
  changes: [
    {
      property: "backgroundColor",
      currentValue: "#28a745",
      newValue: "#0066cc",
      description: "Change background to blue"
    }
  ],
  sourceComments: ["Change this to blue"],
  commentIds: ["comment_123"]
}
```

#### Structured Edit (Internal Format)
```javascript
{
  id: "tweaq_123_abc",
  type: "structured-change",
  timestamp: 1234567890,
  description: "Change button color to blue",
  elementSelector: "button.submit-btn",
  category: "color",
  changes: [/* same as tweaq.changes */],
  sourceComments: [/* original comments */],
  metadata: {
    generatedByAI: true,
    originalCommentIds: ["comment_123"]
  }
}
```

### 5. Features & Benefits

#### Smart Grouping
- Multiple comments on the same element → single tweaq
- Similar change requests → combined into one
- Reduces redundancy and improves efficiency

#### Rich Context
- Element selector, tag, classes, ID
- Current computed styles
- Text content
- Position and dimensions
- Related comment count

#### User Experience
- Beautiful gradient card UI
- Clear call-to-action button
- Loading indicator with message
- Automatic comment cleanup
- Seamless integration with existing tweaq flow

#### Error Handling
- API key validation
- JSON parsing fallback
- User-friendly error messages
- Graceful failure states

### 6. Requirements

- **Claude API Key**: Must have `ANTHROPIC_API_KEY` environment variable set
- **Desktop App**: Feature requires Electron IPC (not available in standalone web)
- **Comments**: At least one comment must exist on the page

### 7. Future Enhancements

Potential improvements:
- Bulk action: "Accept All" or "Edit Before Creating"
- Preview tweaqs before confirming
- Confidence scores for each tweaq
- Comment thread preservation (link to generated tweaq)
- Multi-language support
- Custom AI model selection
- Tweaq templates and patterns

## Testing

### Manual Testing Steps
1. Open the desktop app
2. Navigate to any webpage
3. Enable the overlay
4. Switch to Comment mode
5. Add 2-3 comments to different elements
6. Switch to Tweaqs panel
7. Verify conversion card appears with correct count
8. Click "Create Tweaqs"
9. Wait for AI processing (loading indicator should show)
10. Verify tweaq cards appear in the panel
11. Verify comment bubbles are removed from page
12. Verify tweaqs include original comment text
13. Test sending tweaqs to agent

### Edge Cases
- No comments (card should not appear)
- Single comment (correct singular text)
- Many comments (AI should group effectively)
- Invalid element selectors (should handle gracefully)
- API failures (should show error message)

## Technical Notes

### Performance
- API call is async with loading state
- Comments processed in batch (single API call)
- UI remains responsive during processing

### Security
- API key stored in environment variables
- Comment data sanitized before sending
- JSON parsing validates AI response

### Maintainability
- Well-documented code with comments
- Modular functions (collect, convert, remove)
- Type-safe IPC communication
- Follows existing code patterns

## Files Modified

1. `/packages/overlay/src/preload/figma-style-overlay.js`
   - Added conversion card UI
   - Added conversion methods
   - Added CSS styles

2. `/apps/desktop/electron/main.ts`
   - Added IPC handler
   - Added prompt builder function

3. `/apps/desktop/electron/preload.ts`
   - Added TypeScript interface
   - Added IPC bridge method

## Dependencies

- `@anthropic-ai/sdk` (already installed)
- Claude Sonnet 4 model
- Electron IPC
- No new npm packages required

