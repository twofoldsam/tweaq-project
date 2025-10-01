# 🗣️ Conversational Intelligence System

A standalone system that handles natural, multi-turn conversation to gather sufficient detail **before** sending tickets to the agent for execution.

## Overview

The Conversational Intelligence System sits **between** the user and the agent:

```
User Input → Conversational Intelligence → Ready Tickets → Agent V4 → Code Changes
              (Natural conversation)        (Complete info)   (Execution)
```

## Key Features

### 1. **Natural, Flexible Conversation**
- Accepts freeform user responses
- Handles multi-part answers: *"Both warmer colors and casual language"*
- Builds understanding over multiple turns
- No rigid templates or forms

### 2. **Information Extraction**
- **Target**: What part of the page (hero, buttons, footer, etc.)
- **Action**: What type of change (content, styling, layout, structure)
- **Specifics**: Concrete details (casual language, warmer colors, 20px padding)

### 3. **Completeness Scoring**
- Calculates readiness score (0-1) based on extracted information
- **≥ 0.8**: Ready to create tickets (confirmation mode)
- **0.4-0.8**: Partial info, ask clarifying questions
- **< 0.4**: Very vague, need major clarification

### 4. **Intelligent Questions**
- Adapts questions based on what's missing
- Provides contextual suggestions
- Confirms understanding before creating tickets

## Example Conversation

```
👤 USER: "Make it more friendly"
   [Completeness: 50% - Missing: target, specifics]

🤖 AI: "I'd be happy to help! Which part of the page would you 
      like to change?"
      💡 hero section, buttons, footer, navigation

👤 USER: "Hero and buttons"
   [Completeness: 70% - Has target, missing action specifics]

🤖 AI: "Got it! What would you like to change about the hero 
      and buttons?"

👤 USER: "Both warmer colours and casual language"
   [Completeness: 92.5% - Ready! ✅]

🤖 AI: "Perfect! I'll make the following changes:
      • hero: warmer colors and casual language
      • buttons: warmer colors and casual language
      
      Ready to create these tickets?"

👤 USER: [Confirms]

✅ 2 TICKETS CREATED:
   1. "Make the hero warmer colors and casual language"
   2. "Make the buttons warmer colors and casual language"
```

## Usage

### Basic Setup

```typescript
import { ConversationalIntelligence } from '@tweaq/agent-v4';

const convo = new ConversationalIntelligence(llmProvider);
```

### Start a Conversation

```typescript
// User's initial message
const state = convo.startConversation("Make it more friendly");

// Analyze the message
const analysis = await convo.analyzeMessage("Make it more friendly", state);

console.log(analysis.completeness);  // 0.5
console.log(analysis.nextAction);    // "clarify"
console.log(analysis.response);      // AI's question
console.log(analysis.suggestions);   // ["hero section", "buttons", ...]
```

### Continue the Conversation

```typescript
// User responds
const analysis2 = await convo.analyzeMessage("Hero and buttons", state);

// State automatically merges new information
console.log(state.extractedInfo.target);  // { identifiers: ["hero", "buttons"], ... }
console.log(analysis2.completeness);      // 0.7
console.log(analysis2.nextAction);        // "clarify" (still needs specifics)
```

### Create Tickets When Ready

```typescript
// After user provides all info and confirms
convo.markReady(state);
const tickets = convo.createTickets(state);

// tickets = [
//   {
//     instruction: "Make the hero warmer colors and casual language",
//     target: { type: "section", identifier: "hero" },
//     action: { type: "mixed", specifics: ["warmer colors", "casual language"] },
//     confidence: 0.9
//   },
//   {
//     instruction: "Make the buttons warmer colors and casual language",
//     ...
//   }
// ]
```

### Send Tickets to Agent

```typescript
// These tickets now have enough detail for Agent V4
for (const ticket of tickets) {
  const nlEdit: NaturalLanguageEdit = {
    id: `nl_${Date.now()}`,
    type: 'natural-language',
    instruction: ticket.instruction,
    targetElement: {
      selector: ticket.target.identifier,
      tagName: ticket.target.identifier,
    }
  };
  
  // Send to Agent V4 for execution
  await agentV4.processCombinedEdits({
    visualEdits: [],
    naturalLanguageEdits: [nlEdit],
    metadata: { ... }
  });
}
```

## Integration with Overlay UI

### 1. Replace Direct Instruction Input

**Before:**
```jsx
<input 
  placeholder="Add an instruction..." 
  onSubmit={(text) => createTicket(text)}  // Direct to ticket
/>
```

**After:**
```jsx
<ConversationalChat 
  onTicketsReady={(tickets) => addToEdits(tickets)}
/>
```

### 2. Chat Component

```tsx
function ConversationalChat({ onTicketsReady }) {
  const [state, setState] = useState<ConversationState | null>(null);
  const [messages, setMessages] = useState<Array<{ role, content }>>([]);

  const handleUserMessage = async (text: string) => {
    if (!state) {
      // Start new conversation
      const newState = convo.startConversation(text);
      setState(newState);
    }
    
    // Analyze message
    const analysis = await convo.analyzeMessage(text, state);
    
    // Add messages to UI
    setMessages([
      ...messages,
      { role: 'user', content: text },
      { role: 'assistant', content: analysis.response }
    ]);
    
    // If ready, show confirmation
    if (analysis.nextAction === 'confirm') {
      setShowConfirm(true);
    }
  };

  const handleConfirm = () => {
    convo.markReady(state);
    const tickets = convo.createTickets(state);
    onTicketsReady(tickets);  // Send to main overlay
  };

  return (
    <div className="chat-panel">
      <Messages messages={messages} />
      <Input onSubmit={handleUserMessage} />
      {showConfirm && <ConfirmButton onClick={handleConfirm} />}
    </div>
  );
}
```

### 3. Convert Tickets to Edit Tickets

```typescript
// In your overlay's addToEdits function
function addReadyTickets(tickets: ReadyTicket[]) {
  tickets.forEach(ticket => {
    const editTicket = {
      id: `nl_${Date.now()}`,
      type: 'natural-language-instruction',
      instruction: ticket.instruction,
      description: ticket.instruction,
      targetElement: {
        selector: ticket.target.identifier,
        type: ticket.target.type
      },
      changes: [{
        type: 'natural-language',
        instruction: ticket.instruction,
        specifics: ticket.action.specifics
      }],
      timestamp: Date.now(),
      status: 'pending',
      confidence: ticket.confidence
    };
    
    recordedEdits.push(editTicket);
  });
  
  // Switch to Edits tab to show new tickets
  currentTab = 'edits';
  renderPanel();
}
```

## Benefits

### For Users
- **Natural conversation** - No need to learn specific syntax
- **Guided experience** - System asks helpful questions
- **Flexible responses** - Can answer in multiple ways
- **Clear confirmation** - See exactly what will change before committing

### For the System
- **Better quality inputs** - Agent only receives complete, actionable instructions
- **Fewer failures** - No more vague requests that fail execution
- **Multi-target support** - Automatically splits "hero and buttons" into 2 tickets
- **Confidence tracking** - Knows how certain it is about the request

## Architecture

```
┌─────────────────────────────────────────┐
│     Conversational Intelligence          │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  1. Information Extraction         │ │
│  │     (LLM parses user message)      │ │
│  └────────────────────────────────────┘ │
│                 ↓                        │
│  ┌────────────────────────────────────┐ │
│  │  2. Context Merging                │ │
│  │     (Accumulates across turns)     │ │
│  └────────────────────────────────────┘ │
│                 ↓                        │
│  ┌────────────────────────────────────┐ │
│  │  3. Completeness Scoring           │ │
│  │     (0-1 score, what's missing?)   │ │
│  └────────────────────────────────────┘ │
│                 ↓                        │
│  ┌────────────────────────────────────┐ │
│  │  4. Response Generation            │ │
│  │     (Question or confirmation)     │ │
│  └────────────────────────────────────┘ │
│                 ↓                        │
│  ┌────────────────────────────────────┐ │
│  │  5. Ticket Creation                │ │
│  │     (When ready & confirmed)       │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                 ↓
         Ready Tickets
                 ↓
┌─────────────────────────────────────────┐
│           Agent V4 Execution             │
│  (Smart component targeting & changes)   │
└─────────────────────────────────────────┘
```

## Next Steps

1. **Integrate into Overlay UI** - Replace current chat input with conversational system
2. **Add Conversation History** - Store past conversations per session
3. **Improve Extraction** - Fine-tune LLM prompts for better parsing
4. **Add Edit Capability** - Allow user to modify tickets before confirming
5. **Multi-Modal Context** - Let user reference selected elements in conversation

## Testing

Run the demo:
```bash
node test-conversational-intelligence.mjs
```

This demonstrates a complete 3-turn conversation from vague input to ready tickets.

