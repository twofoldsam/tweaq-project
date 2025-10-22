/**
 * Integration module for Tweaq Desktop App
 * Uses existing GitHub OAuth and Anthropic API key from the app
 */

import { ClaudeAgentV5, createClaudeAgent } from '../ClaudeAgentV5';
import type { AgentV5Config, AgentTaskResult, RepoContext } from '../types/index';

/**
 * Configuration extracted from the desktop app
 */
export interface DesktopAppConfig {
  githubToken: string;
  anthropicApiKey: string;
  repository: {
    owner: string;
    repo: string;
    branch: string;
  };
  repoContext?: RepoContext;
}

/**
 * Create Agent V5 using credentials from the desktop app
 * 
 * Usage in main.ts:
 * ```typescript
 * const githubToken = await keytar.getPassword('smart-qa-github', 'github-token');
 * const anthropicApiKey = await getClaudeApiKey(); // existing helper
 * 
 * const agent = await createAgentFromDesktopApp({
 *   githubToken,
 *   anthropicApiKey,
 *   repository: { owner, repo, branch }
 * });
 * ```
 */
export async function createAgentFromDesktopApp(
  config: DesktopAppConfig
): Promise<ClaudeAgentV5> {
  
  // Validate credentials
  if (!config.githubToken) {
    throw new Error('GitHub token not available. Please authenticate via GitHub OAuth.');
  }
  
  if (!config.anthropicApiKey) {
    throw new Error('Anthropic API key not available. Please configure in LLM settings.');
  }

  // Create Agent V5 config using app credentials
  const agentConfig: AgentV5Config = {
    anthropicApiKey: config.anthropicApiKey,
    githubToken: config.githubToken,
    repository: config.repository,
    options: {
      maxTurns: 20,
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0,
      verbose: true,
      enableTesting: true,
      buildCommand: 'npm run build'
    }
  };

  // Create and initialize agent
  const agent = createClaudeAgent(agentConfig);
  await agent.initialize();

  console.log('✅ Agent V5 initialized with desktop app credentials');
  console.log(`   Repository: ${config.repository.owner}/${config.repository.repo}`);
  console.log(`   Branch: ${config.repository.branch}`);

  return agent;
}

/**
 * Process a visual request using Agent V5
 * This is the main entry point for the desktop app
 */
export async function processVisualRequestWithAgentV5(params: {
  instruction: string;
  githubToken: string;
  anthropicApiKey: string;
  repository: {
    owner: string;
    repo: string;
    branch: string;
  };
  repoContext?: RepoContext;
}): Promise<{
  success: boolean;
  result?: AgentTaskResult;
  prUrl?: string;
  prNumber?: number;
  error?: string;
}> {
  
  let agent: ClaudeAgentV5 | null = null;

  try {
    // Create agent
    const config: DesktopAppConfig = {
      githubToken: params.githubToken,
      anthropicApiKey: params.anthropicApiKey,
      repository: params.repository
    };
    if (params.repoContext) {
      config.repoContext = params.repoContext;
    }
    agent = await createAgentFromDesktopApp(config);

    // Process the task
    console.log(`🚀 Processing task with Agent V5: "${params.instruction}"`);
    const result = await agent.processTask(params.instruction, params.repoContext);

    if (!result.success) {
      return {
        success: false,
        result,
        error: 'Task completed but no files were modified'
      };
    }

    // Create PR with automated testing
    console.log('📝 Creating pull request...');
    const pr = await agent.createPullRequest(
      result,
      `feat: ${params.instruction.substring(0, 50)}`,
      `Changes made by Claude Agent V5\n\n**Task:** ${params.instruction}`,
      {
        runTests: true,
        requireTestsPass: false  // Don't block PR, but include test results
      }
    );

    return {
      success: true,
      result,
      prUrl: pr.prUrl,
      prNumber: pr.prNumber
    };

  } catch (error) {
    console.error('❌ Agent V5 processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    // Always cleanup
    if (agent) {
      await agent.cleanup();
    }
  }
}

/**
 * Check if Agent V5 can be used (credentials available)
 */
export async function canUseAgentV5(
  githubToken: string | null,
  anthropicApiKey: string | null
): Promise<{ canUse: boolean; reason?: string }> {
  
  if (!githubToken) {
    return {
      canUse: false,
      reason: 'GitHub authentication required. Please sign in via OAuth.'
    };
  }

  if (!anthropicApiKey) {
    return {
      canUse: false,
      reason: 'Anthropic API key required. Please configure in LLM settings.'
    };
  }

  return { canUse: true };
}

/**
 * Get agent status for UI display
 */
export function getAgentV5Status(
  githubToken: string | null,
  anthropicApiKey: string | null
): {
  available: boolean;
  githubAuth: boolean;
  anthropicKey: boolean;
  message: string;
} {
  
  const githubAuth = !!githubToken;
  const anthropicKey = !!anthropicApiKey;
  const available = githubAuth && anthropicKey;

  let message = '';
  if (available) {
    message = '✅ Agent V5 ready to use';
  } else {
    const missing: string[] = [];
    if (!githubAuth) missing.push('GitHub authentication');
    if (!anthropicKey) missing.push('Anthropic API key');
    message = `⚠️  Missing: ${missing.join(', ')}`;
  }

  return {
    available,
    githubAuth,
    anthropicKey,
    message
  };
}

