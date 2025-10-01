# Combined Editing Workflow - Visual + Natural Language

Agent V4 now supports a powerful **combined editing workflow** that allows users to make both **direct visual tweaks** and **natural language instructions** in the same session, then submit them all together for intelligent processing.

## 🎯 Overview

### The Workflow

```
User Session:
┌─────────────────────────────────────────┐
│ 1. Visual Tweaks (Direct Manipulation) │
│    • Change button color to #3B82F6    │
│    • Increase font size to 18px        │
│    • Add 20px padding                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 2. Natural Language Instructions (Chat)│
│    • "Make the copy more friendly"     │
│    • "Condense the footer"             │
│    • "Rework the hero section layout"  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 3. Submit All Changes Together          │
│    → Agent analyzes all changes         │
│    → Creates unified execution plan     │
│    → Generates code for all changes     │
│    → Creates single PR with everything  │
└─────────────────────────────────────────┘
```

## 📦 New Types

### NaturalLanguageEdit

```typescript
interface NaturalLanguageEdit {
  id: string;
  type: 'natural-language';
  instruction: string;  // e.g., "Make the copy more friendly"
  targetElement?: {
    selector: string;
    tagName: string;
    className?: string;
    textContent?: string;
  };
  context?: {
    currentState?: string;
    userIntent?: string;
    scope?: 'element' | 'component' | 'section' | 'page';
  };
  timestamp?: number;
}
```

### CombinedEditRequest

```typescript
interface CombinedEditRequest {
  visualEdits: VisualEdit[];
  naturalLanguageEdits: NaturalLanguageEdit[];
  metadata?: {
    sessionId?: string;
    submittedAt?: number;
    context?: string;
  };
}
```

## 🚀 Usage Example

```typescript
import { AgentV4, CombinedEditRequest } from '@tweaq/agent-v4';

// Create agent
const agent = new AgentV4(config);

// Build combined request
const request: CombinedEditRequest = {
  // Visual edits from direct manipulation
  visualEdits: [
    {
      id: 'edit_1',
      element: { selector: '.btn-primary', tagName: 'button' },
      changes: [
        { 
          property: 'background-color', 
          before: '#1F2937', 
          after: '#3B82F6',
          category: 'styling',
          impact: 'low'
        },
        {
          property: 'font-size',
          before: '14px',
          after: '16px',
          category: 'styling',
          impact: 'low'
        }
      ]
    },
    {
      id: 'edit_2',
      element: { selector: '.hero h1', tagName: 'h1' },
      changes: [
        {
          property: 'font-size',
          before: '32px',
          after: '48px',
          category: 'styling',
          impact: 'medium'
        }
      ]
    }
  ],
  
  // Natural language instructions from chat
  naturalLanguageEdits: [
    {
      id: 'nl_1',
      type: 'natural-language',
      instruction: 'Make the hero copy more friendly and approachable',
      targetElement: {
        selector: '.hero',
        tagName: 'section'
      },
      context: {
        scope: 'section'
      }
    },
    {
      id: 'nl_2',
      type: 'natural-language',
      instruction: 'Condense the footer to be more compact',
      targetElement: {
        selector: 'footer',
        tagName: 'footer'
      },
      context: {
        scope: 'component'
      }
    }
  ],
  
  metadata: {
    sessionId: 'session_123',
    submittedAt: Date.now()
  }
};

// Process combined request
const result = await agent.processCombinedEdits(request, symbolicRepo);

if (result.success) {
  console.log('✅ All changes applied successfully!');
  console.log(result.summary);
  console.log(`Files modified: ${result.fileChanges.length}`);
} else {
  console.log('❌ Issues found:', result.execution.validation.issues);
}
```

## 🧠 How It Works

### Phase 1: Analysis

Agent V4 analyzes both types of edits:

**Visual Edits:**
- Direct property mapping (e.g., `font-size: 14px → 18px`)
- High confidence (concrete values)
- Component identification via selector

**Natural Language Edits:**
- Intent analysis (what does "more friendly" mean?)
- Change type inference (content, layout, styling)
- Confidence assessment based on instruction clarity
- Component inference from context

### Phase 2: Unified Planning

The agent creates a **unified execution plan**:

```typescript
{
  changeIntents: [
    // Visual edits converted to intents
    { type: 'styling-modification', confidence: 0.9, ... },
    { type: 'styling-modification', confidence: 0.9, ... },
    
    // Natural language converted to intents
    { type: 'content-modification', confidence: 0.7, ... },
    { type: 'layout-modification', confidence: 0.75, ... }
  ],
  overallConfidence: 0.82,  // Weighted average
  overallRisk: 'medium',    // Highest risk level
  recommendedApproach: 'medium-confidence-guided',
  groupedByComponent: {
    'Button': [intent1, intent2],
    'Hero': [intent3],
    'Footer': [intent4]
  }
}
```

### Phase 3: Execution

The agent executes all changes:

1. Groups changes by component
2. Executes changes to each component
3. Applies appropriate strategy based on overall confidence
4. Validates all changes together
5. Creates a single PR with all modifications

### Phase 4: Summary

Provides a comprehensive summary:

```
🤖 AGENT V4 COMBINED EXECUTION SUMMARY
======================================

📋 COMBINED CHANGE REQUEST
  Visual Edits: 2
  • .btn-primary: 2 property changes
  • .hero h1: 1 property changes
  
  Natural Language Instructions: 2
  • "Make the hero copy more friendly and approachable"
  • "Condense the footer to be more compact"

🧠 UNIFIED ANALYSIS
  Total Changes Analyzed: 4
  Overall Confidence: 82.0%
  Approach: medium-confidence-guided

⚡ EXECUTION RESULTS
  Files Modified: 3
  Validation: ✅ PASSED
  Lines Changed: 27

🎯 OUTCOME
✅ All changes executed successfully
```

## 🎨 Natural Language Capabilities

### What the Agent Can Interpret

#### Content Changes
- "Make the copy more friendly"
- "Rewrite this to be professional"
- "Simplify the wording"
- "Make the heading more exciting"

#### Layout Changes
- "Make the footer more condensed"
- "Spread out the navigation items"
- "Stack these elements vertically"
- "Center align the hero content"

#### Styling Changes
- "Make the colors warmer"
- "Increase the visual prominence"
- "Make this look more modern"
- "Add more breathing room"

#### Structural Changes (Advanced)
- "Rework the hero section layout"
- "Reorganize the navigation"
- "Simplify the form structure"

### Instruction Quality

**High Confidence Instructions:**
```typescript
"Change the button text to 'Get Started'"  // Specific
"Make the font bold"                        // Clear
"Increase spacing by 10px"                  // Concrete
```

**Medium Confidence Instructions:**
```typescript
"Make the copy more friendly"              // Interpretive
"Condense the footer"                      // Direction without specifics
"Improve the visual hierarchy"             // Subjective
```

**Low Confidence Instructions:**
```typescript
"Make it better"                           // Vague
"Fix the design"                           // Unclear
"Update the styling somehow"               // No direction
```

## 🔄 Integration with Existing UI

### Step 1: Add Chat Interface to Overlay

```typescript
// In overlay UI
const [naturalLanguageEdits, setNaturalLanguageEdits] = useState<NaturalLanguageEdit[]>([]);
const [chatInput, setChatInput] = useState('');

const handleAddInstruction = () => {
  const newEdit: NaturalLanguageEdit = {
    id: `nl_${Date.now()}`,
    type: 'natural-language',
    instruction: chatInput,
    targetElement: state.selectedElement ? {
      selector: generateSelector(state.selectedElement.element),
      tagName: state.selectedElement.element.tagName.toLowerCase()
    } : undefined,
    timestamp: Date.now()
  };
  
  setNaturalLanguageEdits(prev => [...prev, newEdit]);
  setChatInput('');
};
```

### Step 2: Combine and Submit

```typescript
const handleSubmitAll = async () => {
  const combinedRequest: CombinedEditRequest = {
    visualEdits: visualEdits,
    naturalLanguageEdits: naturalLanguageEdits,
    metadata: {
      sessionId: currentSessionId,
      submittedAt: Date.now()
    }
  };
  
  // Send to electron main process
  const result = await window.electronAPI.processCombinedEdits(combinedRequest);
  
  if (result.success) {
    console.log('✅ PR created:', result.pr.url);
  }
};
```

### Step 3: Backend Handler

```typescript
// In electron main.ts
ipcMain.handle('process-combined-edits', async (event, request: CombinedEditRequest) => {
  // Initialize Agent V4
  const agent = new AgentV4(config);
  
  // Get symbolic repo
  const symbolicRepo = await getSymbolicRepo();
  
  // Process combined edits
  const result = await agent.processCombinedEdits(request, symbolicRepo);
  
  if (result.success) {
    // Create PR with all changes
    const pr = await createPullRequest(result.fileChanges, result.summary);
    return { success: true, pr };
  }
  
  return { success: false, error: result.error };
});
```

## 📊 Examples

### Example 1: Quick Polish

```typescript
// Visual tweaks
visualEdits: [
  { property: 'padding', before: '12px', after: '16px' },
  { property: 'border-radius', before: '4px', after: '8px' }
]

// Natural language
naturalLanguageEdits: [
  { instruction: "Make the button text more action-oriented" }
]

// Result: One PR with padding, border, and text changes
```

### Example 2: Hero Redesign

```typescript
// Visual tweaks
visualEdits: [
  { property: 'font-size', before: '32px', after: '48px' },
  { property: 'color', before: '#333', after: '#111' },
  { property: 'margin-bottom', before: '16px', after: '24px' }
]

// Natural language
naturalLanguageEdits: [
  { 
    instruction: "Rework the hero copy to emphasize speed and reliability",
    targetElement: { selector: '.hero .copy' }
  },
  {
    instruction: "Make the layout more spacious and modern",
    targetElement: { selector: '.hero' }
  }
]

// Result: Comprehensive hero redesign in one PR
```

### Example 3: Footer Cleanup

```typescript
// Visual tweaks
visualEdits: [
  { property: 'padding', before: '40px', after: '24px' },
  { property: 'font-size', before: '14px', after: '12px' }
]

// Natural language
naturalLanguageEdits: [
  { instruction: "Condense the footer to be more compact" },
  { instruction: "Simplify the footer links organization" }
]

// Result: Compact, clean footer in one PR
```

## 🎯 Benefits

1. **Flexibility**: Users can mix precise visual tweaks with higher-level instructions
2. **Efficiency**: Submit everything at once, get one PR
3. **Intelligence**: Agent understands context between visual and natural language edits
4. **Safety**: Unified validation across all changes
5. **Traceability**: Single PR contains all related changes

## 🚧 Future Enhancements

- **Interactive clarification**: Agent asks for clarification on vague instructions
- **Smart grouping**: Automatically group related visual + NL edits
- **Preview mode**: Show interpretation of NL instructions before execution
- **Learning**: Agent learns from user feedback on NL interpretations
- **Multi-file coordination**: NL instructions that span multiple components

## 📝 Summary

The combined editing workflow enables a powerful new interaction model:
- **Small tweaks**: Direct visual manipulation (fast, precise)
- **Bigger changes**: Natural language (flexible, high-level)
- **Together**: Submit as one cohesive change set

This gives users the best of both worlds: precision when needed, flexibility when preferred.

