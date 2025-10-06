# Agent V5 - Claude Agentic System

**Autonomous coding agent using Claude's tool use capabilities**

Agent V5 represents a paradigm shift from custom NLP pipelines to leveraging Claude's native intelligence with autonomous tool use. It reuses the proven infrastructure from Agent V2 (LocalRepo, RemoteRepo) while adding Claude's superior natural language understanding and exploratory capabilities.

## 🎯 Key Features

### 🤖 **Autonomous Exploration**
- Claude explores the codebase on its own
- Searches for all relevant files (not just one)
- Understands patterns and applies changes consistently
- Makes decisions about what to modify

### 🔧 **Tool Use**
- **read_file** - Read any file in the repository
- **write_file** - Modify files with new content
- **search_codebase** - Fast ripgrep searches across the codebase
- **list_directory** - Explore directory structure
- **run_command** - Execute shell commands (tests, linting)
- **get_file_info** - Get file metadata

### 🏗️ **Reuses Existing Infrastructure**
- `LocalRepo` from Agent V2 for cloning
- `RemoteRepo` from Agent V2 for PR creation
- Same workspace management
- Same Git workflow

### 🔍 **Validation Bridge**
- Integrates with Agent V4's validation engine
- Over-deletion prevention
- Retry with constraints if validation fails

## 🚀 Quick Start

### Installation

```bash
cd packages/agent-v5
npm install
npm run build
```

### Basic Usage

```typescript
import { createClaudeAgent } from '@tweaq/agent-v5';

// Create agent
const agent = createClaudeAgent({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  githubToken: process.env.GITHUB_TOKEN,
  repository: {
    owner: 'your-username',
    repo: 'your-repo',
    branch: 'main'
  },
  options: {
    maxTurns: 20,
    verbose: true
  }
});

// Initialize (clones repo)
await agent.initialize();

// Let Claude work autonomously
const result = await agent.processTask(
  "Make all the buttons bounce on hover",
  {
    framework: 'React',
    stylingSystem: 'Tailwind'
  }
);

// Create PR
if (result.success) {
  await agent.createPullRequest(
    result,
    'feat: Add bounce animation to buttons'
  );
}

// Cleanup
await agent.cleanup();
```

## 📖 How It Works

### 1. **Initialization**
```typescript
await agent.initialize();
```
- Clones repository locally (uses LocalRepo from Agent V2)
- Sets up Git
- Initializes tool executor

### 2. **Agentic Loop**
```typescript
const result = await agent.processTask("make all buttons bounce on hover");
```

Claude decides what to do:
```
Turn 1: Claude → "Let me search for all button components"
        Uses: search_codebase("Button", file_type: "tsx")
        Result: Found Button.tsx, IconButton.tsx, ActionButton.tsx

Turn 2: Claude → "Let me read Button.tsx to understand the structure"
        Uses: read_file("src/components/Button.tsx")
        Result: [file content]

Turn 3: Claude → "I'll add a bounce animation to the CSS"
        Uses: write_file("src/components/Button.css", [new content])
        Result: Success

Turn 4: Claude → "Let me apply the same to IconButton"
        Uses: read_file("src/components/IconButton.tsx")
        ...and so on
```

### 3. **PR Creation**
```typescript
await agent.createPullRequest(result, 'feat: Add animations');
```
- Commits changes locally
- Pushes branch to GitHub
- Creates PR via RemoteRepo (reuses Agent V2)

## 🎯 Comparison with Agent V4

| Feature | Agent V4 | Agent V5 (Claude) |
|---------|----------|-------------------|
| **Natural Language** | Keyword matching | Native understanding |
| **Exploration** | Pre-analyzed repo | Autonomous exploration |
| **Multi-file** | One at a time | Finds all instances |
| **Decision Making** | Pre-programmed | Self-directed |
| **Tool Use** | No | Yes (6 tools) |
| **Validation** | ✅ Excellent | ✅ + Agent V4's validation |
| **Code Quality** | Good | Excellent |
| **Maintainability** | 5000+ lines | ~500 lines |

## 📊 Example: "Make all buttons bounce on hover"

### Agent V4 Approach:
```
1. Keyword match "bounce" → behavior-modification
2. Find ONE Button component
3. Generic LLM prompt
4. Claude generates code (hasn't explored)
5. Validation
```

### Agent V5 Approach:
```
Turn 1: Search for "Button" components
        → Found 5 components

Turn 2-6: Read each component
          → Understand patterns

Turn 7: Read tailwind.config.js
        → See no bounce animation exists

Turn 8-12: Write animation to all components
           → Consistent pattern applied

Turn 13: Self-validation
         → "Changes look good"
```

**Result:** Finds ALL buttons, applies consistently, uses existing patterns.

## 🔍 Validation Integration

```typescript
import { createValidationBridge } from '@tweaq/agent-v5';

const validator = createValidationBridge();

// Validate after task
const validation = await validator.validate(result, {
  maxFiles: 10,
  maxLinesPerFile: 100,
  preventOverdeletion: true
});

// Or validate with retry
const { result, validation } = await validator.validateWithRetry(
  agent,
  result,
  originalInstruction,
  expectedScope
);
```

## 🛠️ Configuration

```typescript
interface AgentV5Config {
  anthropicApiKey: string;
  githubToken: string;
  repository: {
    owner: string;
    repo: string;
    branch: string;
  };
  options?: {
    maxTurns?: number;        // Default: 20
    model?: string;           // Default: claude-3-5-sonnet-20241022
    temperature?: number;     // Default: 0
    verbose?: boolean;        // Default: false
  };
}
```

## 🧪 Testing

```bash
# Set environment variables
export ANTHROPIC_API_KEY="your-key"
export GITHUB_TOKEN="your-token"
export REPO_OWNER="your-username"
export REPO_NAME="your-repo"
export REPO_BRANCH="main"

# Run demo
npm run test
```

## 📝 API Reference

### `createClaudeAgent(config)`
Creates a new Claude agent instance.

### `agent.initialize()`
Clones the repository and sets up the workspace.

### `agent.processTask(instruction, repoContext?)`
Processes a task autonomously. Returns `AgentTaskResult`.

### `agent.createPullRequest(taskResult, title?, body?)`
Creates a GitHub pull request with the changes.

### `agent.cleanup()`
Cleans up the local clone.

### `agent.getConversationHistory()`
Returns the full conversation history for debugging.

## 🎉 Benefits Over Custom Agent

### ✅ **Better Natural Language Understanding**
- Understands "bounce", "modern", "professional", "accessible"
- No keyword matching needed
- Handles complex, ambiguous instructions

### ✅ **Autonomous Exploration**
- Finds ALL relevant files
- Explores directory structure
- Discovers patterns automatically

### ✅ **Less Code to Maintain**
- ~500 lines vs 5000+ lines
- No custom NLP pipelines
- No prompt builders

### ✅ **Better Results**
- Consistent changes across files
- Uses existing patterns
- Considers edge cases

### ✅ **Still Safe**
- Validation bridge to Agent V4
- Over-deletion prevention
- Retry with constraints

## 🔄 Migration from Agent V4

```typescript
// Agent V4
const agentV4 = new AgentV4(config);
const result = await agentV4.processVisualEdits(visualEdits, symbolicRepo);

// Agent V5
const agentV5 = createClaudeAgent(config);
await agentV5.initialize();
const result = await agentV5.processTask(
  "make all buttons bounce on hover",
  { framework: 'React', stylingSystem: 'Tailwind' }
);
```

## 🚧 Roadmap

- [ ] Full Agent V4 validation engine integration
- [ ] Multi-repository support
- [ ] Conversation memory across tasks
- [ ] Custom tool definitions
- [ ] Integration with Tweaq desktop app
- [ ] Benchmark suite comparing with Agent V4

## 📚 Learn More

- [Claude Agent Integration](../CLAUDE_AGENT_INTEGRATION.md) - Deep dive into how it works
- [Claude Agent Comparison](../CLAUDE_AGENT_COMPARISON.md) - Comparison with Agent V4
- [GitHub Access](../CLAUDE_AGENT_GITHUB_ACCESS.md) - How it accesses repositories

---

**Agent V5 represents the future of Tweaq's coding agent - leveraging Claude's native intelligence while keeping the safety and validation you've built.**

