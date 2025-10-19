# Claude Autonomous Code Agent - Implementation Guide

This guide explains how we built a production-ready autonomous coding agent using Claude's tool use capabilities and the Anthropic Messages API.

---

## 🎯 Overview

We created **Agent V5**, an autonomous coding agent that can:
- **Explore** codebases independently using tools
- **Understand** natural language instructions without keyword matching
- **Make decisions** about what files to modify
- **Apply changes** consistently across multiple files
- **Create PRs** automatically on GitHub

### Key Innovation: Agentic Loop with Tool Use

Instead of building custom NLP pipelines and pre-programmed workflows, we leverage Claude's native intelligence through an **agentic loop** where Claude:
1. Receives a task
2. Decides what tools to use
3. Explores the codebase
4. Makes informed changes
5. Completes the task autonomously

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│          ClaudeAgentV5 (Main Class)             │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐      ┌──────────────┐       │
│  │   LocalRepo  │      │  RemoteRepo  │       │
│  │ (Clone/Git)  │      │ (GitHub API) │       │
│  └──────────────┘      └──────────────┘       │
│                                                 │
│  ┌─────────────────────────────────────┐      │
│  │       ToolExecutor                  │      │
│  ├─────────────────────────────────────┤      │
│  │ • read_file                         │      │
│  │ • write_file                        │      │
│  │ • search_codebase (ripgrep)         │      │
│  │ • list_directory                    │      │
│  │ • run_command                       │      │
│  │ • get_file_info                     │      │
│  └─────────────────────────────────────┘      │
│                                                 │
│  ┌─────────────────────────────────────┐      │
│  │   Anthropic Messages API            │      │
│  │   (Agentic Loop)                    │      │
│  └─────────────────────────────────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📦 Core Components

### 1. ClaudeAgentV5 (Main Agent Class)

**File:** `packages/agent-v5/src/ClaudeAgentV5.ts`

**Responsibilities:**
- Manage conversation history
- Execute the agentic loop
- Initialize and cleanup repositories
- Create pull requests
- Generate summaries

**Key Methods:**
```typescript
class ClaudeAgentV5 {
  async initialize(): Promise<void>
  // Clones the repository locally
  
  async processTask(instruction: string, repoContext?: RepoContext): Promise<AgentTaskResult>
  // Main agentic loop - Claude explores and makes changes autonomously
  
  async createPullRequest(taskResult: AgentTaskResult, title?: string, body?: string): Promise<{prNumber, prUrl}>
  // Creates GitHub PR with changes
  
  async cleanup(): Promise<void>
  // Removes local clone
  
  getConversationHistory(): ConversationMessage[]
  // Returns full conversation for debugging
}
```

### 2. ToolExecutor (Tool System)

**File:** `packages/agent-v5/src/tools/ToolExecutor.ts`

**Responsibilities:**
- Define tools available to Claude
- Execute tool calls
- Handle errors gracefully
- Return formatted results

**Tools Provided:**
- `read_file` - Read any file in the repository
- `write_file` - Modify files with new content
- `search_codebase` - Fast ripgrep searches
- `list_directory` - Explore directory structure
- `run_command` - Execute shell commands (tests, linting)
- `get_file_info` - Get file metadata

### 3. Repository Management

**Using existing infrastructure from Agent V2:**
- `LocalRepo` - Clone and manage local repository
- `RemoteRepo` - GitHub API integration for PRs

**Benefits:**
- Don't reinvent the wheel
- Proven workspace management
- Reliable Git operations
- GitHub API handling

---

## 🔄 The Agentic Loop

The heart of the system is the **agentic loop** in `processTask()`:

```typescript
async processTask(instruction: string, repoContext?: RepoContext): Promise<AgentTaskResult> {
  // 1. Build initial prompt with task and context
  const initialMessage = this.buildInitialPrompt(instruction, repoContext);
  this.conversationHistory = [{ role: 'user', content: initialMessage }];

  let continueLoop = true;
  let turnCount = 0;
  const maxTurns = 20; // Safety limit

  // 2. Agentic loop - Claude decides what to do
  while (continueLoop && turnCount < maxTurns) {
    turnCount++;

    // 3. Call Claude with tools
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      temperature: 0,
      tools: this.toolExecutor.getTools(),
      messages: this.conversationHistory
    });

    // 4. Process response
    if (response.stop_reason === 'end_turn') {
      // Claude is done - task complete!
      continueLoop = false;
    } 
    else if (response.stop_reason === 'tool_use') {
      // Claude wants to use tools
      const toolResults: any[] = [];

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          // Execute the tool
          const result = await this.toolExecutor.execute(block.name, block.input);
          
          // Track file modifications
          if (block.name === 'write_file') {
            filesModified.add(block.input.path);
          }

          // Add result to conversation
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result.output, null, 2)
          });
        }
      }

      // 5. Add assistant message and tool results to history
      this.conversationHistory.push({ role: 'assistant', content: response.content });
      this.conversationHistory.push({ role: 'user', content: toolResults });
      
      // Loop continues - Claude will see results and decide next action
    }
  }

  return {
    success: filesModified.size > 0,
    filesModified: Array.from(filesModified),
    reasoning,
    toolCalls,
    conversation: this.conversationHistory
  };
}
```

### Flow Example: "Make all buttons bounce on hover"

```
Turn 1:
  Claude: "Let me search for all button components"
  Tool: search_codebase("Button", file_type: "tsx")
  Result: Found Button.tsx, IconButton.tsx, ActionButton.tsx

Turn 2:
  Claude: "Let me read Button.tsx to understand the structure"
  Tool: read_file("src/components/Button.tsx")
  Result: [file content showing Tailwind CSS classes]

Turn 3:
  Claude: "I see this uses Tailwind. Let me check the config"
  Tool: read_file("tailwind.config.js")
  Result: [config content]

Turn 4:
  Claude: "I'll add a bounce animation to Button.tsx"
  Tool: write_file("src/components/Button.tsx", [updated content])
  Result: Success

Turn 5-7:
  Claude: Applies same pattern to IconButton.tsx and ActionButton.tsx
  
Turn 8:
  Claude: "Task complete. I've added bounce animations to all 3 button components."
  Stop reason: end_turn
  ✅ Done!
```

---

## 🛠️ Tool Implementation

Each tool follows a standard pattern:

```typescript
// Tool definition for Claude
{
  name: 'read_file',
  description: 'Read the contents of a file from the repository',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The file path relative to repository root'
      }
    },
    required: ['path']
  }
}

// Tool execution
private async readFile(filePath: string): Promise<string> {
  const fullPath = path.join(this.workspacePath, filePath);
  const content = await fs.readFile(fullPath, 'utf-8');
  return content;
}
```

**Key Principles:**
1. **Clear descriptions** - Help Claude understand when to use the tool
2. **Structured schemas** - Define exactly what parameters are needed
3. **Error handling** - Return meaningful errors, not crashes
4. **Efficient execution** - Use fast tools (ripgrep for search)

---

## 🎯 System Prompt Strategy

The initial prompt is critical for guiding Claude's behavior:

```typescript
private buildInitialPrompt(instruction: string, repoContext?: RepoContext): string {
  return `You are Claude, an expert autonomous coding agent working on a GitHub repository.

## Your Mission
${instruction}

## Repository Information
- Owner/Repo: ${owner}/${repo}
- Branch: ${branch}
- Local Path: ${workspacePath}

## Your Capabilities
You have access to these tools:
- read_file - Read any file
- write_file - Modify files
- search_codebase - Fast ripgrep searches
- list_directory - Explore structure
- run_command - Run tests/linting
- get_file_info - Get file metadata

## CRITICAL: Scope of Changes
**ONLY modify the specific components/elements mentioned in the task.**
- Be surgical, not sweeping
- Read before writing
- Use existing framework features when they match
- When in doubt, make changes MORE specific, not more global

## Your Approach
1. Identify exact scope from instruction
2. Search for relevant files
3. Read and understand existing code
4. Make targeted changes
5. Complete efficiently - don't overthink

**Start by identifying exactly what needs to be changed.**`;
}
```

**Key Elements:**
1. **Clear mission** - What Claude needs to accomplish
2. **Available tools** - What capabilities Claude has
3. **Critical constraints** - Prevent overreach (e.g., "only modify specific components")
4. **Approach guidance** - Suggest a workflow
5. **Context** - Repository info, framework details

---

## 📋 TypeScript Types

**File:** `packages/agent-v5/src/types/index.ts`

```typescript
export interface AgentV5Config {
  anthropicApiKey: string;
  githubToken: string;
  repository: {
    owner: string;
    repo: string;
    branch: string;
  };
  options?: {
    maxTurns?: number;        // Default: 20
    model?: string;           // Default: claude-sonnet-4-5
    temperature?: number;     // Default: 0
    verbose?: boolean;        // Default: false
  };
}

export interface AgentTaskResult {
  success: boolean;
  filesModified: string[];
  reasoning: string[];
  toolCalls: ToolCall[];
  conversation: ConversationMessage[];
  summary: string;
  error?: string;
}

export interface ToolCall {
  tool: string;
  input: any;
  result: any;
  timestamp: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: any;
}

export interface RepoContext {
  framework?: string;        // e.g., "React"
  stylingSystem?: string;    // e.g., "Tailwind"
  components?: any[];
}

export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolResult {
  success: boolean;
  output?: any;
  error?: string;
}
```

---

## 🚀 Usage Example

```typescript
import { createClaudeAgent } from '@your-package/agent-v5';

// 1. Create agent
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

// 2. Initialize (clones repo)
await agent.initialize();

// 3. Let Claude work autonomously
const result = await agent.processTask(
  "Make all the buttons bounce on hover",
  {
    framework: 'React',
    stylingSystem: 'Tailwind'
  }
);

console.log(`✅ Modified ${result.filesModified.length} files`);
console.log(`🔧 Used ${result.toolCalls.length} tool calls`);
console.log(`💭 Reasoning: ${result.reasoning[0]}`);

// 4. Create PR if successful
if (result.success) {
  const pr = await agent.createPullRequest(
    result,
    'feat: Add bounce animation to buttons',
    'Automated changes by Claude Agent V5'
  );
  console.log(`🔀 PR created: ${pr.prUrl}`);
}

// 5. Cleanup
await agent.cleanup();
```

---

## 🔌 Desktop App Integration

For Electron/desktop apps, we created IPC handlers for easy integration:

**File:** `packages/agent-v5/src/integration/MainProcessIntegration.ts`

### Main Process (Electron)

```typescript
import { 
  processVisualRequestIPC,
  checkAgentV5StatusIPC 
} from '@your-package/agent-v5/dist/integration/MainProcessIntegration';

// Add IPC handlers
ipcMain.handle('process-visual-request-agent-v5', async (event, request) => {
  return await processVisualRequestIPC(request);
});

ipcMain.handle('check-agent-v5-status', async () => {
  return await checkAgentV5StatusIPC();
});
```

### Renderer Process (React)

```typescript
// Check if Agent V5 is available
const status = await window.electronAPI.invoke('check-agent-v5-status');

if (status.available) {
  // Process with Agent V5
  const result = await window.electronAPI.invoke('process-visual-request-agent-v5', {
    instruction: "make all the buttons bounce on hover",
    owner: "username",
    repo: "repo-name",
    branch: "main",
    repoContext: {
      framework: "React",
      stylingSystem: "Tailwind"
    }
  });

  if (result.success) {
    console.log(`✅ PR created: ${result.prUrl}`);
    console.log(`📁 Files modified: ${result.filesModified}`);
  }
}
```

### Credential Management

The integration automatically finds credentials from:
1. **GitHub token** - From OAuth (stored in keytar)
2. **Anthropic API key** - From config file, env vars, or UI settings

**No new authentication needed!**

```typescript
// Automatically finds GitHub token
export async function getGitHubTokenForAgent(): Promise<string | null> {
  return await keytar.getPassword('smart-qa-github', 'github-token');
}

// Automatically finds Anthropic API key (priority order)
export async function getClaudeApiKeyForAgent(): Promise<string | null> {
  // 1. Environment variables
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  
  // 2. Config file
  const llmConfig = require('./llm-config.js');
  if (llmConfig.claude?.apiKey) return llmConfig.claude.apiKey;
  
  // 3. UI settings (keytar)
  return await keytar.getPassword('smart-qa-llm', 'claude-api-key');
}
```

---

## 🎨 Key Design Decisions

### 1. **Reuse, Don't Rebuild**
- Used existing `LocalRepo` and `RemoteRepo` from Agent V2
- Didn't reinvent Git operations or GitHub API integration
- Focused effort on the agentic loop

### 2. **Tool-Based Architecture**
- Each capability is a tool Claude can use
- Easy to add new tools
- Claude decides when to use each tool

### 3. **Conversation History**
- Keep full conversation for debugging
- Trim to last 10 messages to prevent token bloat
- Each turn includes reasoning for transparency

### 4. **Safety Limits**
- Max turns (20) to prevent infinite loops
- Rate limit handling with retry
- Scoped instructions to prevent overreach

### 5. **Temperature = 0**
- Deterministic behavior
- Consistent results
- Reduces randomness in code changes

### 6. **Verbose Logging**
- Track every tool call
- Show Claude's reasoning
- Make debugging easy

---

## 📊 Comparison with Traditional Approaches

| Aspect | Traditional Agent | Claude Agentic Agent |
|--------|-------------------|----------------------|
| **NLP** | Custom keyword matching | Native understanding |
| **Exploration** | Pre-analyzed repo | Autonomous with tools |
| **Decision Making** | Pre-programmed workflow | Self-directed |
| **Multi-file Changes** | Complex orchestration | Natural exploration |
| **Maintainability** | 5000+ lines custom code | ~500 lines integration |
| **Understanding** | Limited to patterns | Understands intent |
| **Flexibility** | Rigid workflows | Adapts to task |

---

## 🔧 Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.31.0",
    "simple-git": "^3.19.0",
    "@your-package/github-remote": "workspace:*",
    "keytar": "^7.9.0" // For credential management
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

---

## 📝 File Structure

```
packages/agent-v5/
├── src/
│   ├── ClaudeAgentV5.ts           # Main agent class
│   ├── tools/
│   │   └── ToolExecutor.ts        # Tool definitions and execution
│   ├── types/
│   │   └── index.ts               # TypeScript types
│   ├── integration/
│   │   ├── DesktopAppIntegration.ts      # Core integration
│   │   └── MainProcessIntegration.ts     # IPC handlers for Electron
│   └── index.ts                   # Public API
├── dist/                          # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎯 Best Practices

### 1. **Clear Instructions**
```typescript
// ❌ Vague
"update the styling"

// ✅ Specific
"For Button.tsx, change the font-size from 14px to 16px and add a bounce animation on hover"
```

### 2. **Provide Context**
```typescript
const result = await agent.processTask(
  "Update button styles",
  {
    framework: 'React',           // Helps Claude understand tech stack
    stylingSystem: 'Tailwind',    // Guides styling approach
    components: symbolicRepo.components  // Context about codebase
  }
);
```

### 3. **Handle Errors Gracefully**
```typescript
try {
  const result = await agent.processTask(instruction);
  if (!result.success) {
    console.error('Task failed:', result.error);
    // Optionally retry with more specific instructions
  }
} catch (error) {
  console.error('Agent error:', error);
} finally {
  await agent.cleanup(); // Always cleanup
}
```

### 4. **Monitor Tool Usage**
```typescript
console.log(`Tool calls: ${result.toolCalls.length}`);
console.log(`Search operations: ${result.toolCalls.filter(c => c.tool === 'search_codebase').length}`);
console.log(`Files read: ${result.toolCalls.filter(c => c.tool === 'read_file').length}`);
console.log(`Files written: ${result.toolCalls.filter(c => c.tool === 'write_file').length}`);
```

### 5. **Use Verbose Mode During Development**
```typescript
const agent = createClaudeAgent({
  // ...
  options: {
    verbose: true  // See all tool calls and results
  }
});
```

---

## 🚦 Rate Limiting

Claude API has rate limits. The agent handles this automatically:

```typescript
if (error.message.includes('rate_limit_error')) {
  let waitTime = 90000; // Default: 90 seconds
  
  // Use retry-after header if available
  if (error.headers?.['retry-after']) {
    waitTime = (parseInt(error.headers['retry-after']) + 5) * 1000;
  }
  
  console.warn(`⏸️  Rate limit hit. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
  await new Promise(resolve => setTimeout(resolve, waitTime));
  turnCount--; // Retry this turn
  continue;
}
```

---

## 🎉 Benefits Over Custom Agents

### 1. **Superior Understanding**
- Understands "bounce", "modern", "professional", "accessible"
- No keyword dictionaries needed
- Handles ambiguous instructions

### 2. **Autonomous Exploration**
- Finds ALL relevant files, not just one
- Explores directory structure
- Discovers patterns automatically

### 3. **Less Code to Maintain**
- ~500 lines vs 5000+ lines
- No custom NLP pipelines
- No complex prompt builders

### 4. **Better Results**
- Consistent changes across files
- Uses existing patterns
- Considers edge cases

### 5. **Self-Improving**
- Claude gets smarter over time
- No need to retrain or update rules
- Benefits from Anthropic's improvements

---

## 🔮 Future Enhancements

1. **Memory Across Tasks**
   - Remember previous interactions
   - Learn from feedback

2. **Custom Tools**
   - Allow users to define their own tools
   - Domain-specific capabilities

3. **Multi-Repository Support**
   - Work across multiple repos
   - Cross-repo refactoring

4. **Validation Integration**
   - Built-in code validation
   - Retry with constraints if validation fails

5. **Conversation UI**
   - Show Claude's thought process in real-time
   - Allow user intervention

---

## 📚 Additional Resources

- [Anthropic Messages API Docs](https://docs.anthropic.com/claude/docs/messages-api)
- [Tool Use Guide](https://docs.anthropic.com/claude/docs/tool-use)
- [Agent V5 README](./packages/agent-v5/README.md)
- [Integration Guide](./packages/agent-v5/DESKTOP_APP_INTEGRATION.md)

---

## ✅ Summary

This implementation shows how to build a production-ready autonomous coding agent by:

1. **Using Claude's tool use** instead of custom NLP
2. **Implementing an agentic loop** where Claude explores and decides
3. **Providing powerful tools** (read, write, search, run commands)
4. **Reusing existing infrastructure** (LocalRepo, RemoteRepo)
5. **Adding safety constraints** (max turns, scoped instructions)
6. **Integrating seamlessly** with desktop apps

The result is a powerful, maintainable agent that can understand natural language, explore codebases autonomously, and make intelligent decisions about code changes.

**Total code: ~500 lines of integration + Claude's intelligence = Production-ready autonomous coding agent**

---

*This implementation is currently deployed in the Tweaq desktop application, processing visual edits and creating GitHub PRs autonomously.*

