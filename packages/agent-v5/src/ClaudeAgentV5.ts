import Anthropic from '@anthropic-ai/sdk';
import simpleGit, { SimpleGit } from 'simple-git';
import { LocalRepo } from '@smart-qa/github-remote';
import { RemoteRepo } from '@smart-qa/github-remote';
import { ToolExecutor } from './tools/ToolExecutor';
import { TestingWorkflow } from './testing/TestingWorkflow';
import type {
  AgentV5Config,
  AgentTaskResult,
  ToolCall,
  ConversationMessage,
  RepoContext,
  TestingResult
} from './types/index';

/**
 * Claude Agent V5 - Autonomous Coding Agent with Tool Use
 * 
 * This agent uses Claude's tool use capabilities to autonomously explore
 * and modify codebases. It reuses infrastructure from Agent V2 (LocalRepo, RemoteRepo)
 * while adding Claude's superior natural language understanding and autonomous exploration.
 */
export class ClaudeAgentV5 {
  private config: AgentV5Config;
  private anthropic: Anthropic;
  private localRepo!: LocalRepo;
  private remoteRepo: RemoteRepo;
  private toolExecutor!: ToolExecutor;
  private git!: SimpleGit;
  private workspacePath!: string;
  private conversationHistory: ConversationMessage[] = [];
  private initialized: boolean = false;

  constructor(config: AgentV5Config) {
    this.config = config;
    this.anthropic = new Anthropic({
      apiKey: config.anthropicApiKey
    });
    this.remoteRepo = new RemoteRepo(config.githubToken);
  }

  /**
   * Initialize the agent by cloning the repository
   * Reuses LocalRepo from Agent V2
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('✅ Agent already initialized');
      return;
    }

    console.log('🤖 Initializing Claude Agent V5...');
    console.log(`📦 Repository: ${this.config.repository.owner}/${this.config.repository.repo}`);
    console.log(`🌿 Branch: ${this.config.repository.branch}`);

    // Create local repository instance (reuse Agent V2 infrastructure)
    this.localRepo = new LocalRepo({
      owner: this.config.repository.owner,
      repo: this.config.repository.repo,
      branch: this.config.repository.branch,
      token: this.config.githubToken
    });

    // Clone repository
    console.log('📥 Cloning repository...');
    await this.localRepo.clone();
    // Access the private repoPath via any
    this.workspacePath = (this.localRepo as any).repoPath;
    
    console.log(`✅ Repository cloned to: ${this.workspacePath}`);

    // Initialize git for commits
    this.git = simpleGit(this.workspacePath);

    // Initialize tool executor
    this.toolExecutor = new ToolExecutor(
      this.workspacePath,
      this.config.options?.verbose || false
    );

    this.initialized = true;
    console.log('✅ Claude Agent V5 initialized successfully\n');
  }

  /**
   * Process a task autonomously
   * Claude explores the codebase and makes changes using tools
   */
  async processTask(
    instruction: string,
    repoContext?: RepoContext
  ): Promise<AgentTaskResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('🚀 Starting autonomous task processing...');
    console.log(`📝 Instruction: "${instruction}"\n`);

    const toolCalls: ToolCall[] = [];
    const reasoning: string[] = [];
    const filesModified = new Set<string>();

    // Build initial message with context
    const initialMessage = this.buildInitialPrompt(instruction, repoContext);
    this.conversationHistory = [
      { role: 'user', content: initialMessage }
    ];

    let continueLoop = true;
    let turnCount = 0;
    const maxTurns = this.config.options?.maxTurns || 20;

    console.log('🔄 Starting agentic loop (max turns: ' + maxTurns + ')...\n');

    // Agentic loop - Claude decides what to do next
    while (continueLoop && turnCount < maxTurns) {
      turnCount++;
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔄 Turn ${turnCount}/${maxTurns}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      try {
        // Trim conversation history to prevent token bloat (keep last 10 messages)
        const trimmedHistory = this.conversationHistory.length > 10 
          ? this.conversationHistory.slice(-10) 
          : this.conversationHistory;

        // Call Claude with tools
        const response = await this.anthropic.messages.create({
          model: this.config.options?.model || 'claude-sonnet-4-5-20250929',
          max_tokens: 8192,
          temperature: this.config.options?.temperature || 0,
          tools: this.toolExecutor.getTools(),
          messages: trimmedHistory as any
        });

        console.log(`📊 Stop reason: ${response.stop_reason}`);

        // Process response
        if (response.stop_reason === 'end_turn') {
          // Claude is done
          const textContent = response.content.find((c: any) => c.type === 'text');
          if (textContent && 'text' in textContent) {
            reasoning.push(textContent.text);
            console.log(`\n💭 Claude's final response:\n${textContent.text}\n`);
          }
          continueLoop = false;
          console.log('✅ Claude completed the task');
        } 
        else if (response.stop_reason === 'tool_use') {
          // Claude wants to use tools
          const toolResults: any[] = [];

          for (const block of response.content) {
            if (block.type === 'text' && 'text' in block) {
              reasoning.push(block.text);
              console.log(`💭 Claude: ${block.text}`);
            } 
            else if (block.type === 'tool_use') {
              console.log(`\n🔧 Tool: ${block.name}`);
              console.log(`   Input: ${JSON.stringify(block.input, null, 2)}`);
              
              // Execute the tool
              const result = await this.toolExecutor.execute(block.name, block.input as any);
              
              // Record tool call
              toolCalls.push({
                tool: block.name,
                input: block.input,
                result: result.output,
                timestamp: Date.now()
              });

              // Track file modifications
              if (block.name === 'write_file' && result.success) {
                filesModified.add((block.input as any).path);
              }

              // Format result for Claude
              let resultContent: string;
              if (result.success) {
                console.log(`   ✅ Success`);
                resultContent = JSON.stringify(result.output, null, 2);
              } else {
                console.log(`   ❌ Error: ${result.error}`);
                resultContent = `Error: ${result.error}`;
              }

              // Add tool result to conversation
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: resultContent
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

      } catch (error) {
        console.error(`\n❌ Error in turn ${turnCount}:`, error);
        
        // Handle rate limit errors with retry
        if (error instanceof Error && error.message.includes('rate_limit_error')) {
          // Try to get retry-after from error (Anthropic provides this)
          let waitTime = 90000; // Default: 90 seconds
          
          // Check if error has headers with retry-after
          if ((error as any).headers && (error as any).headers['retry-after']) {
            const retryAfter = parseInt((error as any).headers['retry-after'], 10);
            if (!isNaN(retryAfter)) {
              waitTime = (retryAfter + 5) * 1000; // Add 5 seconds buffer
            }
          }
          
          console.warn(`⏸️  Rate limit hit. Waiting ${Math.ceil(waitTime / 1000)} seconds before retrying...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          turnCount--; // Retry this turn
          continue;
        }
        
        return {
          success: false,
          filesModified: [],
          reasoning,
          toolCalls,
          conversation: this.conversationHistory,
          summary: 'Task failed due to error',
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    if (turnCount >= maxTurns) {
      console.warn('\n⚠️  Max turns reached - agent may not be complete');
    }

    // Generate summary
    const summary = this.generateSummary(
      instruction,
      Array.from(filesModified),
      reasoning,
      toolCalls,
      turnCount
    );

    console.log('\n' + summary);

    return {
      success: turnCount < maxTurns && filesModified.size > 0,
      filesModified: Array.from(filesModified),
      reasoning,
      toolCalls,
      conversation: this.conversationHistory,
      summary
    };
  }

  /**
   * Run automated tests on changes
   */
  async testChanges(taskResult: AgentTaskResult): Promise<TestingResult> {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }

    console.log('\n🧪 Running automated tests...');

    const testingWorkflow = new TestingWorkflow({
      workspacePath: this.workspacePath,
      buildCommand: this.config.options?.buildCommand || 'npm run build',
      testUrl: this.config.options?.testUrl,
      verbose: this.config.options?.verbose
    });

    const testResult = await testingWorkflow.runTests(taskResult.filesModified);
    
    // Update task result with testing data
    taskResult.testing = testResult;

    return testResult;
  }

  /**
   * Create a pull request with the changes
   * Optionally runs tests before creating PR
   */
  async createPullRequest(
    taskResult: AgentTaskResult,
    prTitle?: string,
    prBody?: string,
    options?: {
      runTests?: boolean;
      requireTestsPass?: boolean;
    }
  ): Promise<{ prNumber: number; prUrl: string }> {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }

    console.log('\n📝 Creating pull request...');

    if (taskResult.filesModified.length === 0) {
      throw new Error('No files were modified - nothing to commit');
    }

    // Run tests if requested
    const shouldTest = options?.runTests ?? this.config.options?.enableTesting ?? false;
    
    if (shouldTest) {
      console.log('\n🧪 Running tests before creating PR...');
      const testResult = await this.testChanges(taskResult);
      
      if (options?.requireTestsPass && !testResult.passed) {
        throw new Error(
          `Tests failed - PR not created. ${testResult.evidence.validationResults.filter(v => !v.passed && v.severity === 'error').length} critical errors found.`
        );
      }

      console.log(testResult.summary);
    }

    // Create feature branch
    const branchName = `Tweaq-${Date.now()}`;
    console.log(`🌿 Creating branch: ${branchName}`);
    await this.git.checkoutLocalBranch(branchName);

    // Stage all changes
    console.log('📦 Staging changes...');
    await this.git.add('.');

    // Commit
    const commitMessage = prTitle || `feat: ${taskResult.reasoning[0]?.substring(0, 50) || 'Changes by Claude Agent'}`;
    console.log(`💾 Committing: ${commitMessage}`);
    await this.git.commit(commitMessage);

    // Push branch
    console.log('⬆️  Pushing branch to GitHub...');
    await this.git.push('origin', branchName, ['--set-upstream']);

    // Create PR using RemoteRepo (reuse Agent V2 infrastructure)
    console.log('🔀 Creating pull request...');
    
    const prResponse = await this.remoteRepo.openPR({
      owner: this.config.repository.owner,
      repo: this.config.repository.repo,
      title: prTitle || commitMessage,
      body: prBody || this.generatePRBody(taskResult),
      head: branchName,
      base: this.config.repository.branch
    });

    console.log(`✅ Pull request created: #${prResponse.number}`);
    console.log(`🔗 URL: ${prResponse.html_url}`);

    return {
      prNumber: prResponse.number,
      prUrl: prResponse.html_url
    };
  }

  /**
   * Cleanup - delete local clone
   */
  async cleanup(): Promise<void> {
    if (this.localRepo) {
      console.log('🧹 Cleaning up workspace...');
      await this.localRepo.cleanup();
      this.initialized = false;
      console.log('✅ Cleanup complete');
    }
  }

  /**
   * Get conversation history for debugging
   */
  getConversationHistory(): ConversationMessage[] {
    return this.conversationHistory;
  }

  // Private helper methods

  private buildInitialPrompt(instruction: string, repoContext?: RepoContext): string {
    let prompt = `You are Claude, an expert autonomous coding agent working on a GitHub repository.

## Your Mission
${instruction}

## Repository Information
- Owner/Repo: ${this.config.repository.owner}/${this.config.repository.repo}
- Branch: ${this.config.repository.branch}
- Local Path: ${this.workspacePath}
`;

    if (repoContext) {
      prompt += `\n## Repository Context`;
      if (repoContext.framework) {
        prompt += `\n- Framework: ${repoContext.framework}`;
      }
      if (repoContext.stylingSystem) {
        prompt += `\n- Styling System: ${repoContext.stylingSystem}`;
      }
      if (repoContext.components && repoContext.components.length > 0) {
        prompt += `\n- Components: ${repoContext.components.length} components analyzed`;
      }
    }

    prompt += `

## Your Capabilities
You have access to these tools:
- **read_file**: Read any file in the repository
- **write_file**: Modify files
- **search_codebase**: Search for patterns using ripgrep (fast)
- **list_directory**: Explore directory structure
- **run_command**: Run commands like npm test, npm run lint
- **get_file_info**: Get file metadata

## CRITICAL: Scope of Changes

**ONLY modify the specific components/elements mentioned in the task.**

- If the task references a specific element (e.g., "For p.text-lg.md:text-xl...", "change the button in Header.tsx"), ONLY change that exact element
- Do NOT make global changes unless explicitly instructed (e.g., "change ALL buttons", "update everywhere")
- When a specific selector or component is mentioned, that is the ONLY thing to modify

### Decision Making for Styling Changes

When making style changes, follow this priority:

1. **Use existing framework styles if they match exactly**
   - If changing fontSize from 24px to 30px in a Tailwind project, check if an existing class like \`text-3xl\` = 30px
   - If it matches, use that class (e.g., replace \`lg:text-2xl\` with \`lg:text-3xl\`)

2. **Apply inline/arbitrary values if no exact match exists**
   - If no existing class matches the target value, use arbitrary values (e.g., \`lg:text-[30px]\`)
   - This ensures ONLY the specific element is affected

3. **Never modify global configuration unless task says "change everywhere" or "update globally"**
   - DO NOT modify tailwind.config.js, CSS variables, or theme files for specific component changes
   - These affect the entire application and should only be touched for explicit global changes

### Examples:

**Task:** "For Button.tsx, change fontSize from 14px to 16px"
- ✅ Modify ONLY Button.tsx
- ✅ Use existing class if \`text-base\` = 16px, otherwise use \`text-[16px]\`
- ❌ DON'T modify tailwind.config.js
- ❌ DON'T change other components

**Task:** "Change ALL button fontSize to 16px"
- ✅ Find all button components
- ✅ Modify each one consistently
- ✅ Consider global config if it makes sense

**Task:** "Make the hero section text larger"
- ✅ Find hero section component(s)
- ✅ Modify ONLY hero text
- ❌ DON'T change text sizes elsewhere

## Your Approach
1. **Identify Scope**: Determine if change is for one specific element or multiple
2. **Explore First**: Use search_codebase to find the exact component(s) mentioned
3. **Read Before Writing**: Understand existing implementation
4. **Choose Method**: Decide between existing style, inline style, or (rarely) global config
5. **Apply Targeted Change**: Modify ONLY what was requested
6. **Complete the Task**: After making changes, you're DONE!

## CRITICAL: Complete Tasks Efficiently

- **Make the change, then STOP** - Don't overthink or verify endlessly
- Once you've written the file with the requested change, the task is complete
- You don't need to re-read files or verify changes multiple times
- Trust that your changes are correct and finish the task

## Important Guidelines
- **Be surgical, not sweeping** - Only change what's explicitly requested
- **Be decisive and efficient** - Make the change and complete the task quickly
- Read the task carefully to understand the intended scope
- Use existing framework features when they match exactly
- Preserve all other functionality and styles
- When in doubt, make the change MORE specific, not more global

**Start by identifying exactly what component(s) need to be changed, find them, make the change, and finish.**
`;

    return prompt;
  }

  private generateSummary(
    instruction: string,
    filesModified: string[],
    reasoning: string[],
    toolCalls: ToolCall[],
    turnCount: number
  ): string {
    const toolStats = toolCalls.reduce((acc, call) => {
      acc[call.tool] = (acc[call.tool] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 CLAUDE AGENT V5 - TASK SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 TASK
  ${instruction}

🎯 RESULTS
  Status: ${filesModified.length > 0 ? '✅ SUCCESS' : '⚠️  NO CHANGES'}
  Files Modified: ${filesModified.length}
  ${filesModified.length > 0 ? filesModified.map(f => `    - ${f}`).join('\n  ') : ''}

🔧 TOOL USAGE
  Total Tool Calls: ${toolCalls.length}
  Turns Used: ${turnCount}
  ${Object.entries(toolStats).map(([tool, count]) => `  - ${tool}: ${count}x`).join('\n  ')}

💭 REASONING STEPS
  ${reasoning.length} reasoning steps recorded
  ${reasoning.slice(0, 3).map((r, i) => `  ${i + 1}. ${r.substring(0, 100)}${r.length > 100 ? '...' : ''}`).join('\n  ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }

  private generatePRBody(taskResult: AgentTaskResult): string {
    let body = `## Changes Made by Claude Agent V5

**Task:** ${taskResult.reasoning[0] || 'Automated changes'}

### Files Modified
${taskResult.filesModified.map(f => `- \`${f}\``).join('\n')}

### Tool Usage
- **Total tool calls:** ${taskResult.toolCalls.length}
- **Search operations:** ${taskResult.toolCalls.filter(c => c.tool === 'search_codebase').length}
- **Files read:** ${taskResult.toolCalls.filter(c => c.tool === 'read_file').length}
- **Files written:** ${taskResult.toolCalls.filter(c => c.tool === 'write_file').length}

### Agent Reasoning
${taskResult.reasoning.slice(0, 5).map((r, i) => `${i + 1}. ${r}`).join('\n\n')}
`;

    // Add testing results if available
    if (taskResult.testing) {
      const { testing } = taskResult;
      const checks = testing.evidence.validationResults;
      const passed = checks.filter(c => c.passed).length;
      const failed = checks.filter(c => !c.passed).length;
      const errors = checks.filter(c => !c.passed && c.severity === 'error').length;

      body += `

---

## 🧪 Automated Testing Results

**Overall Status:** ${testing.passed ? '✅ All checks passed' : errors > 0 ? '❌ Some checks failed' : '⚠️ Warnings present'}

| Status | Check | Result |
|--------|-------|--------|
${checks.map(c => `| ${c.passed ? '✅' : c.severity === 'error' ? '❌' : '⚠️'} | ${c.name} | ${c.message} |`).join('\n')}

**Summary:** ${passed} passed, ${failed} failed (${errors} critical errors)

<details>
<summary>View Test Logs</summary>

\`\`\`
${testing.evidence.logs.slice(0, 20).join('\n')}
\`\`\`

</details>
`;
    }

    body += `

---

🤖 *This PR was created autonomously by Claude Agent V5*
${taskResult.testing ? '\n🧪 *Changes were automatically tested before PR creation*' : ''}
`;

    return body;
  }
}

// Factory function
export function createClaudeAgent(config: AgentV5Config): ClaudeAgentV5 {
  return new ClaudeAgentV5(config);
}

