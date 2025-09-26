# Visual Coding Agent Integration

This document describes the integration of the Visual Coding Agent into the Smart QA Browser application.

## Overview

The Visual Coding Agent is a sophisticated AI-powered tool that translates natural language design requests into precise code changes. It uses Claude AI to understand design intent and generate appropriate modifications to React components.

## Features

- **Element Selection**: Interactive element selection with visual highlighting
- **Natural Language Processing**: Describe changes in plain English
- **Code Generation**: Generates specific code changes with explanations
- **Design Token Integration**: Uses your existing design system
- **Alternative Suggestions**: Provides multiple approaches when possible
- **Confidence Scoring**: Shows how confident the AI is about suggestions

## Setup

### Prerequisites

1. **Anthropic API Key**: You need an Anthropic API key to use Claude AI
2. **Environment Variables**: Set `ANTHROPIC_API_KEY` in your environment

### Environment Configuration

Add to your `.env` file or environment:
```bash
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
```

## Usage

### Accessing the Visual Coding Agent

1. Open the Smart QA Browser application
2. Click the settings button (⚙️) in the toolbar
3. Click on the "Visual Agent" tab
4. The agent will automatically initialize with your API key

### Using the Agent

1. **Select an Element**:
   - Click "Select Element" button
   - Move your mouse over any element on the page
   - Click to select the element you want to modify
   - Press ESC to cancel selection

2. **Describe Changes**:
   - Enter a natural language description of what you want to change
   - Examples:
     - "Make this button bigger and more prominent"
     - "Change the color to blue"
     - "Add more spacing around this text"
     - "Make this look more modern"

3. **Generate Changes**:
   - Click "Generate Changes" to process your request
   - The agent will analyze the element and context
   - Review the suggested changes and explanation

4. **Apply Changes**:
   - Review the code changes in the preview
   - Click "Apply Changes" to implement them
   - (Note: Currently shows changes in console - file system integration coming soon)

## Architecture

### Service Layer

**VisualCodingAgentService** (`src/services/VisualCodingAgentService.ts`)
- Main integration service that wraps the visual coding agent
- Handles initialization, configuration, and request processing
- Provides type-safe interfaces for the React components
- Manages design tokens and project context

### UI Components

**VisualCodingAgent** (`src/components/VisualCodingAgent.tsx`)
- Main React component for the agent interface
- Handles element selection with interactive overlay
- Provides forms for description input and results display
- Manages agent lifecycle and error states

### Integration Points

The agent is integrated into the main application through:
- **App.tsx**: Added as a new tab in the settings panel
- **Electron IPC**: Environment variable access through main process
- **Design System**: Automatic detection of existing design tokens

## API Reference

### VisualCodingAgentService

```typescript
class VisualCodingAgentService {
  // Initialize the service with configuration
  async initialize(): Promise<void>
  
  // Process a design request
  async processDesignRequest(request: DesignRequest): Promise<DesignResponse>
  
  // Update design tokens
  updateDesignTokens(tokens: Partial<DesignTokens>): void
  
  // Extract element information from DOM
  static extractElementInfo(element: HTMLElement): ElementSelection
}
```

### Request/Response Types

```typescript
interface DesignRequest {
  description: string;           // Natural language description
  selectedElement: ElementSelection;
  framework: Framework;          // 'react' | 'vue' | 'svelte'
  stylingSystem: StylingSystem;  // 'tailwind' | 'css-modules' | etc.
  existingCode?: string;
  filePath?: string;
}

interface DesignResponse {
  changes: CodeChange[];         // Specific code modifications
  explanation: string;           // Human-readable explanation
  alternatives?: Alternative[];  // Alternative approaches
  confidence: number;           // 0-1 confidence score
  designPrinciples?: string[];  // Applied design principles
}
```

## Design Tokens

The agent automatically detects and uses your existing design system:

```typescript
interface DesignTokens {
  colors: Record<string, string | Record<string, string>>;
  typography: {
    fontSizes: Record<string, string>;
    fontWeights: Record<string, string>;
    lineHeights: Record<string, string>;
    fontFamilies: Record<string, string>;
  };
  spacing: Record<string, string>;
  shadows: Record<string, string>;
  borderRadius: Record<string, string>;
  breakpoints: Record<string, string>;
}
```

## Example Usage

Here's a typical workflow:

1. **Navigate to a page** with UI elements you want to modify
2. **Open Visual Agent** from the settings panel
3. **Select a button** that needs to be more prominent
4. **Describe the change**: "Make this button larger, use the primary color, and add more padding"
5. **Review the suggestion**:
   ```css
   .button {
     padding: 16px 32px; /* increased from 8px 16px */
     background-color: #007acc; /* changed from #6b7280 */
     font-size: 16px; /* increased from 14px */
     font-weight: 600; /* increased from 400 */
   }
   ```
6. **Apply the changes** to see the result

## Troubleshooting

### Common Issues

**"Agent not initialized"**
- Check that `ANTHROPIC_API_KEY` is set in your environment
- Verify the API key is valid
- Check the console for initialization errors

**"Element selection not working"**
- Make sure you're clicking on actual page elements
- Try refreshing the page if overlays seem stuck
- Press ESC to cancel selection and try again

**"No changes generated"**
- Try being more specific in your description
- Make sure the selected element is appropriate for the requested change
- Check that the element has existing styles to modify

### Debug Information

The service logs detailed information to the browser console:
- Initialization status
- Element selection details
- API request/response data
- Error messages with stack traces

## Limitations

### Current Limitations

1. **File System Integration**: Changes are currently displayed but not automatically applied to files
2. **Framework Detection**: Currently hardcoded to React - auto-detection coming soon
3. **Styling System**: Currently assumes vanilla CSS - Tailwind/other system detection planned
4. **Cross-Origin**: Element selection only works on same-origin pages

### Planned Improvements

1. **Direct File Modification**: Automatically apply changes to source files
2. **Git Integration**: Create commits/PRs for changes
3. **Framework Detection**: Auto-detect React/Vue/Svelte
4. **Styling System Detection**: Auto-detect Tailwind, styled-components, etc.
5. **Batch Operations**: Select and modify multiple elements at once
6. **Undo/Redo**: History management for changes

## Contributing

To extend the Visual Coding Agent:

1. **Service Extensions**: Add new methods to `VisualCodingAgentService`
2. **UI Enhancements**: Modify `VisualCodingAgent.tsx` and `.css` files
3. **Type Definitions**: Update interfaces in the service file
4. **Design Tokens**: Extend the default design token structure

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify environment configuration
3. Test with simple elements and descriptions first
4. Review the API key permissions and quotas

The Visual Coding Agent represents a new paradigm in web development - where designers and developers can collaborate through natural language to create better user interfaces.
