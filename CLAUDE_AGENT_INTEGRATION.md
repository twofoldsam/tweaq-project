# Claude Agent Integration - Real Agentic System

## 🎯 The Difference

### ❌ What You Have Now (Basic LLM):
```typescript
// Just text in, text out
const response = await claude.generateText(prompt);
```

### ✅ What You Want (Claude Agent with Tools):
```typescript
// Multi-turn agentic loop with tools
const agent = new ClaudeAgent({
  tools: ['read_file', 'write_file', 'search_codebase']
});

// Claude autonomously:
// 1. Searches for all button components
// 2. Reads relevant files
// 3. Analyzes styling patterns
// 4. Makes changes
// 5. Validates its own work
const result = await agent.run("make all buttons bounce on hover");
```

---

## 🏗️ **Option 1: Anthropic Messages API with Tool Use (Recommended)**

This gives you full control while leveraging Claude's agentic capabilities.

### Implementation

```typescript
// packages/agent-v5/src/ClaudeAgenticSystem.ts

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ClaudeAgenticSystem {
  private anthropic: Anthropic;
  private workspacePath: string;
  private conversationHistory: any[] = [];

  constructor(apiKey: string, workspacePath: string) {
    this.anthropic = new Anthropic({ apiKey });
    this.workspacePath = workspacePath;
  }

  /**
   * Define tools that Claude can use
   */
  private getTools() {
    return [
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
      },
      {
        name: 'write_file',
        description: 'Write content to a file in the repository',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' },
            content: { type: 'string', description: 'File content' }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'search_codebase',
        description: 'Search the codebase for patterns using ripgrep',
        input_schema: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Regex pattern to search' },
            file_type: { type: 'string', description: 'File extension (e.g., tsx, css)' },
            context_lines: { type: 'number', description: 'Lines of context to include' }
          },
          required: ['pattern']
        }
      },
      {
        name: 'list_directory',
        description: 'List files in a directory',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path' }
          },
          required: ['path']
        }
      },
      {
        name: 'run_validation',
        description: 'Run validation checks on the changes',
        input_schema: {
          type: 'object',
          properties: {
            files: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Files to validate' 
            }
          },
          required: ['files']
        }
      }
    ];
  }

  /**
   * Execute a tool call
   */
  private async executeTool(toolName: string, toolInput: any): Promise<any> {
    console.log(`🔧 Executing tool: ${toolName}`, toolInput);

    switch (toolName) {
      case 'read_file':
        return await this.readFile(toolInput.path);

      case 'write_file':
        return await this.writeFile(toolInput.path, toolInput.content);

      case 'search_codebase':
        return await this.searchCodebase(
          toolInput.pattern,
          toolInput.file_type,
          toolInput.context_lines
        );

      case 'list_directory':
        return await this.listDirectory(toolInput.path);

      case 'run_validation':
        return await this.runValidation(toolInput.files);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Main agentic loop - let Claude autonomously work
   */
  async processTask(instruction: string, repoContext: any): Promise<{
    success: boolean;
    filesModified: string[];
    reasoning: string[];
    toolCalls: any[];
    conversation: any[];
  }> {
    console.log('🤖 Starting Claude agentic processing...');
    console.log(`📝 Instruction: ${instruction}`);

    const toolCalls: any[] = [];
    const reasoning: string[] = [];
    const filesModified: string[] = [];

    // Initial message with rich context
    const initialMessage = `You are an expert coding agent working on a codebase.

## Repository Context
${JSON.stringify(repoContext, null, 2)}

## Task
${instruction}

## Your Capabilities
You have access to tools to:
- Read files
- Write files
- Search the codebase
- List directories
- Run validation checks

## Approach
1. First, explore the codebase to understand the structure
2. Find all relevant components/files
3. Make targeted changes
4. Validate your changes
5. Provide a summary

**Start by searching the codebase to find all button components.**`;

    this.conversationHistory = [
      { role: 'user', content: initialMessage }
    ];

    let continueLoop = true;
    let turnCount = 0;
    const maxTurns = 20; // Prevent infinite loops

    // Agentic loop - Claude decides what to do next
    while (continueLoop && turnCount < maxTurns) {
      turnCount++;
      console.log(`\n🔄 Turn ${turnCount}/${maxTurns}`);

      // Call Claude with tools
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        tools: this.getTools(),
        messages: this.conversationHistory
      });

      console.log(`📊 Stop reason: ${response.stop_reason}`);

      // Process response
      if (response.stop_reason === 'end_turn') {
        // Claude is done - extract final response
        const textContent = response.content.find((c: any) => c.type === 'text');
        if (textContent) {
          reasoning.push(textContent.text);
        }
        continueLoop = false;
        console.log('✅ Claude finished the task');
      } 
      else if (response.stop_reason === 'tool_use') {
        // Claude wants to use tools
        const toolResults: any[] = [];

        for (const block of response.content) {
          if (block.type === 'text') {
            reasoning.push(block.text);
            console.log(`💭 Claude: ${block.text}`);
          } 
          else if (block.type === 'tool_use') {
            console.log(`🔧 Tool call: ${block.name}`);
            
            // Execute the tool
            const result = await this.executeTool(block.name, block.input);
            
            toolCalls.push({
              tool: block.name,
              input: block.input,
              result
            });

            // Track file modifications
            if (block.name === 'write_file') {
              filesModified.push(block.input.path);
            }

            // Add tool result to conversation
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result, null, 2)
            });
          }
        }

        // Add assistant message and tool results to history
        this.conversationHistory.push({
          role: 'assistant',
          content: response.content
        });

        this.conversationHistory.push({
          role: 'user',
          content: toolResults
        });
      }
      else {
        // Unexpected stop reason
        console.warn(`⚠️  Unexpected stop reason: ${response.stop_reason}`);
        continueLoop = false;
      }
    }

    if (turnCount >= maxTurns) {
      console.warn('⚠️  Max turns reached - agent may not be complete');
    }

    return {
      success: turnCount < maxTurns && filesModified.length > 0,
      filesModified: [...new Set(filesModified)],
      reasoning,
      toolCalls,
      conversation: this.conversationHistory
    };
  }

  // Tool implementations

  private async readFile(path: string): Promise<string> {
    try {
      const fullPath = `${this.workspacePath}/${path}`;
      const content = await fs.readFile(fullPath, 'utf-8');
      console.log(`  ✅ Read ${path} (${content.length} chars)`);
      return content;
    } catch (error) {
      console.error(`  ❌ Failed to read ${path}:`, error);
      return `Error reading file: ${error}`;
    }
  }

  private async writeFile(path: string, content: string): Promise<{ success: boolean; message: string }> {
    try {
      const fullPath = `${this.workspacePath}/${path}`;
      await fs.writeFile(fullPath, content, 'utf-8');
      console.log(`  ✅ Wrote ${path} (${content.length} chars)`);
      return { success: true, message: `Successfully wrote ${path}` };
    } catch (error) {
      console.error(`  ❌ Failed to write ${path}:`, error);
      return { success: false, message: `Error: ${error}` };
    }
  }

  private async searchCodebase(
    pattern: string, 
    fileType?: string, 
    contextLines: number = 3
  ): Promise<{ results: any[]; count: number }> {
    try {
      let cmd = `rg "${pattern}" ${this.workspacePath}`;
      if (fileType) {
        cmd += ` -t ${fileType}`;
      }
      cmd += ` -C ${contextLines} --json`;

      const { stdout } = await execAsync(cmd);
      
      // Parse ripgrep JSON output
      const results = stdout
        .trim()
        .split('\n')
        .filter(line => line)
        .map(line => JSON.parse(line))
        .filter(item => item.type === 'match');

      console.log(`  ✅ Found ${results.length} matches for "${pattern}"`);
      return { results, count: results.length };
    } catch (error: any) {
      // ripgrep returns exit code 1 when no matches found
      if (error.code === 1) {
        console.log(`  ℹ️  No matches found for "${pattern}"`);
        return { results: [], count: 0 };
      }
      console.error(`  ❌ Search failed:`, error);
      return { results: [], count: 0 };
    }
  }

  private async listDirectory(path: string): Promise<{ files: string[]; directories: string[] }> {
    try {
      const fullPath = `${this.workspacePath}/${path}`;
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      
      const files = entries.filter(e => e.isFile()).map(e => e.name);
      const directories = entries.filter(e => e.isDirectory()).map(e => e.name);

      console.log(`  ✅ Listed ${path}: ${files.length} files, ${directories.length} dirs`);
      return { files, directories };
    } catch (error) {
      console.error(`  ❌ Failed to list ${path}:`, error);
      return { files: [], directories: [] };
    }
  }

  private async runValidation(files: string[]): Promise<{
    passed: boolean;
    issues: any[];
    metrics: any;
  }> {
    // Use your existing validation engine
    console.log(`  🔍 Validating ${files.length} files...`);
    
    // Import your validation engine
    // const validator = new SmartValidationEngine();
    // return await validator.validate(files);
    
    // For now, mock validation
    return {
      passed: true,
      issues: [],
      metrics: {
        filesChecked: files.length,
        linesChanged: 0
      }
    };
  }

  /**
   * Get conversation history for debugging/logging
   */
  getConversationHistory() {
    return this.conversationHistory;
  }
}
```

### Usage

```typescript
import { ClaudeAgenticSystem } from './packages/agent-v5/src/ClaudeAgenticSystem';

// Initialize
const claudeAgent = new ClaudeAgenticSystem(
  process.env.ANTHROPIC_API_KEY!,
  '/path/to/workspace'
);

// Let Claude work autonomously
const result = await claudeAgent.processTask(
  "make all the buttons bounce on hover",
  {
    framework: 'React',
    stylingSystem: 'Tailwind',
    components: symbolicRepo.components
  }
);

console.log('📊 Results:');
console.log(`  Files modified: ${result.filesModified.length}`);
console.log(`  Tool calls: ${result.toolCalls.length}`);
console.log(`  Reasoning steps: ${result.reasoning.length}`);

// Still use YOUR validation as safety net
const validation = await yourValidationEngine.validate(result.filesModified);
if (!validation.passed) {
  console.log('⚠️  Validation failed - changes may need review');
}
```

---

## 🎯 **Why This Is Better Than Your Current System**

### Current System (Agent V4):
```
User: "make buttons bounce"
  ↓
NaturalLanguageAnalyzer: keyword match "bounce" → "behavior-modification"
  ↓
Find ONE component (Button.tsx)
  ↓
Generic LLM prompt
  ↓
Claude generates code (blind - hasn't explored codebase)
  ↓
Your validation
```

### Agentic System:
```
User: "make buttons bounce"
  ↓
Claude Agent: "Let me search for all button components"
  ↓ [uses search_codebase tool]
Claude: "Found Button.tsx, IconButton.tsx, ActionButton.tsx"
  ↓ [uses read_file tool multiple times]
Claude: "I see you're using Tailwind. Let me check your config..."
  ↓ [uses read_file on tailwind.config.js]
Claude: "You don't have a bounce animation. I'll add one and apply it."
  ↓ [uses write_file tool]
Claude: "Changes complete. Let me validate..."
  ↓ [uses run_validation tool]
Claude: "All checks passed. Summary: Modified 4 files, added bounce animation."
  ↓
Your validation (safety net)
```

---

## 📊 **Comparison**

| Feature | Current Agent V4 | Claude Agentic |
|---------|------------------|----------------|
| NLP Understanding | ❌ Keyword matching | ✅ Native understanding |
| Codebase Exploration | 🟡 Pre-analyzed repo | ✅ Agent explores on-demand |
| Multi-file Changes | 🟡 One component at a time | ✅ Finds all instances |
| Self-directed | ❌ Pre-programmed flow | ✅ Agent decides what to do |
| Tool Use | ❌ No tools | ✅ Read, write, search, validate |
| Context Awareness | 🟡 Static context | ✅ Dynamic exploration |
| Validation | ✅ Strong validation | 🟡 + Your validation on top |
| Maintainability | ❌ 5000+ lines custom code | ✅ ~500 lines integration |

---

## 🚀 **Recommended Architecture**

### Hybrid: Claude Agent + Your Validation

```typescript
async function processVisualEdit(instruction: string, repo: RepoContext) {
  
  // 1. Let Claude agent work autonomously
  const claudeAgent = new ClaudeAgenticSystem(apiKey, workspacePath);
  
  const agentResult = await claudeAgent.processTask(instruction, {
    framework: repo.framework,
    stylingSystem: repo.stylingSystem,
    components: repo.components
  });

  console.log(`🤖 Claude made ${agentResult.filesModified.length} changes`);
  console.log(`🧠 Reasoning:`, agentResult.reasoning);

  // 2. Apply YOUR validation (safety net)
  const validation = await smartValidationEngine.validate({
    filesModified: agentResult.filesModified,
    intent: instruction,
    expectedScope: {
      maxFiles: 10,
      maxLinesPerFile: 100,
      preventOverdeletion: true  // YOUR killer feature
    }
  });

  // 3. If validation fails, ask Claude to be more conservative
  if (!validation.passed) {
    console.log('⚠️  Validation failed, asking Claude to retry conservatively...');
    
    // Add validation feedback to conversation
    const retryResult = await claudeAgent.processTask(
      `The previous changes failed validation: ${validation.issues.join(', ')}. 
       Please make more conservative changes that address only: ${instruction}`,
      repo
    );

    return retryResult;
  }

  // 4. Create PR with your existing system
  return await createPR(agentResult.filesModified);
}
```

---

## 💡 **Next Steps**

1. **Install Anthropic SDK**
   ```bash
   npm install @anthropic-ai/sdk
   ```

2. **Create prototype** (`packages/agent-v5/`)
   - Implement `ClaudeAgenticSystem.ts`
   - Keep your validation engine
   - Keep workspace management

3. **Test on original problem**
   - "Change font-size from 14px to 16px"
   - See if Claude's exploration prevents over-deletion
   - See if your validation catches any issues

4. **Benchmark**
   - Compare quality: Agent V4 vs Claude Agentic
   - Measure cost (token usage)
   - Measure speed

5. **Decide**
   - Full agent vs hybrid
   - What to keep from Agent V4

---

## 🎉 **The Answer to Your Question**

**YES - You CAN integrate with the actual Claude agent system (not just API calls).**

The agentic approach with tool use is:
- ✅ Much more powerful than keyword matching
- ✅ Self-directed and exploratory
- ✅ Multi-turn reasoning
- ✅ Better natural language understanding
- ✅ Can validate its own work

But you should KEEP:
- ✅ Your validation engine (over-deletion prevention)
- ✅ Your confidence assessment (for risk management)
- ✅ Your workspace/PR system

This hybrid approach gets you the best of both worlds.

