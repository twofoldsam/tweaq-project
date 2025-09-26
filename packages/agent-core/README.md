# Agent Core

An autonomous agent system for intelligent visual coding decisions. This package transforms the linear Visual Coding Agent workflow into a strategic, decision-making agent that can evaluate changes, analyze repository structure, and determine optimal PR strategies.

## Overview

The Agent Core provides an autonomous agent that makes intelligent decisions about how to implement visual design changes. Instead of a simple linear workflow, the agent can:

1. **Evaluate Change Intent** - Analyze visual edits to understand what changes are needed
2. **Evaluate Repository Structure** - Determine the best implementation strategy (inline vs styles)  
3. **Determine PR Strategy** - Decide how to organize changes into pull requests

## Key Features

### 🤖 **Autonomous Decision Making**
- LLM-powered action selection
- Strategic planning based on context
- Intelligent workflow orchestration

### 🎯 **Strategic Actions**
- **Change Intent Analysis**: Breaks down complex visual changes into actionable intents
- **Repository Impact Assessment**: Evaluates how changes affect the codebase structure
- **PR Strategy Planning**: Determines optimal pull request organization

### 🔄 **Iterative Workflow**
- Multi-step decision process
- Context-aware action selection
- Fallback mechanisms for robustness

## Architecture

```
AutonomousAgent
├── Actions (Decision-making steps)
│   ├── EvaluateChangeIntentAction
│   ├── EvaluateRepoStructureAction
│   └── DeterminePRStrategyAction
├── Context (Shared state)
│   ├── Visual edits
│   ├── Repository info
│   ├── Change intents
│   ├── Style impact analysis
│   └── PR strategy
└── LLM Integration (Decision support)
    ├── Action selection
    ├── Strategic analysis
    └── Reasoning generation
```

## Usage

### Basic Usage

```typescript
import { createAutonomousAgent } from '@tweaq/agent-core';

const agent = createAutonomousAgent({
  llmProvider: yourLLMProvider,
  repository: {
    path: '/path/to/repo',
    framework: 'react',
    stylingSystem: 'vanilla-css',
    structure: { /* ... */ },
    components: [ /* ... */ ]
  }
});

const result = await agent.processVisualRequest(visualEdits);

console.log('Agent decisions:', {
  changeIntents: result.context.changeIntents,
  prStrategy: result.context.prStrategy,
  phase: result.finalState.phase
});
```

### Integration with Existing Systems

The agent is designed to integrate seamlessly with the existing Visual Coding Agent:

```typescript
// In main.ts
async function processVisualRequestWithAutonomousAgent(request: any) {
  const agent = createAutonomousAgent(agentConfig);
  const result = await agent.processVisualRequest(visualEdits);
  
  // Convert results back to expected format
  return {
    changes: generateCodeChanges(result.context),
    explanation: result.context.prStrategy?.reasoning,
    confidence: calculateConfidence(result.context)
  };
}
```

## Actions

### 1. Evaluate Change Intent Action

**Purpose**: Analyzes visual edits to identify distinct changes and their scope.

**Decisions Made**:
- How many distinct changes need to be made?
- Are multiple components affected?
- What's the complexity of each change?

**Output**: Array of `ChangeIntent` objects with scope and complexity analysis.

### 2. Evaluate Repository Structure Action  

**Purpose**: Determines optimal implementation strategy for each change.

**Decisions Made**:
- Should changes be made inline or in style files?
- Will style changes affect other components?
- What's the risk level of each approach?

**Output**: `StyleImpactAnalysis` with recommendations and risk assessment.

### 3. Determine PR Strategy Action

**Purpose**: Decides how to organize changes into pull requests.

**Decisions Made**:
- Should changes be combined into one PR or split?
- How to group related changes?
- What's the optimal PR size and complexity?

**Output**: `PRStrategy` with PR groupings and reasoning.

## Configuration

```typescript
interface AgentConfig {
  llmProvider: LLMProvider;           // AI provider for decisions
  repository: Repository;             // Repository context
  maxIterations?: number;             // Max workflow iterations (default: 10)
  confidenceThreshold?: number;       // Decision confidence threshold (default: 0.7)
  enableParallelActions?: boolean;    // Enable parallel action execution
}
```

## Decision Examples

### Change Intent Analysis
```
Input: "Change button color from blue to red and increase padding"

Agent Decision:
- Change Intent 1: Color modification (simple, component-scoped)
- Change Intent 2: Spacing adjustment (simple, component-scoped)
- Recommendation: Can be combined, low complexity
```

### Repository Structure Analysis
```
Input: Button color change in shared component

Agent Decision:
- Risk Level: Medium (affects 15+ components)
- Recommendation: Create new CSS class rather than inline
- Reasoning: Maintains consistency, easier to revert
```

### PR Strategy
```
Input: 3 changes - button styling, header layout, footer text

Agent Decision:
- PR 1: Button styling (low risk, isolated)
- PR 2: Header + footer (UI consistency, related changes)
- Reasoning: Separate styling from layout for easier review
```

## Integration Points

The agent integrates with existing Tweaq infrastructure:

- **LLM Providers**: Uses existing OpenAI/Claude infrastructure
- **Repository Analysis**: Leverages repo-analyzer package
- **GitHub Integration**: Works with existing PR creation flow
- **Visual Overlay**: Processes edits from the overlay system

## Error Handling

The agent includes robust error handling:

- **Graceful Degradation**: Falls back to original workflow if agent fails
- **Action Retry**: Can retry failed actions with different strategies
- **Comprehensive Logging**: Detailed logs for debugging and monitoring

## Future Enhancements

- **Code Generation Actions**: Direct code modification capabilities
- **Testing Actions**: Automatic test generation and validation
- **Performance Actions**: Performance optimization recommendations
- **Documentation Actions**: Automatic documentation updates
- **Multi-Repository Support**: Cross-repository change coordination

## Development

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

### Development Mode
```bash
npm run dev
```

## Contributing

When adding new actions:

1. Extend `BaseAction` class
2. Implement required methods (`canExecute`, `executeImpl`)
3. Add to action registry in `agent.ts`
4. Update types and exports
5. Add comprehensive tests

The agent is designed to be extensible - new actions can be added easily to expand the decision-making capabilities.
