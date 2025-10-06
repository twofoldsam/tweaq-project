/**
 * IPC Handler for Electron Main Process
 * Drop-in replacement for existing agent processing
 */

import { processVisualRequestWithAgentV5, getAgentV5Status } from './DesktopAppIntegration';
import type { RepoContext } from '../types/index';

// Lazy load keytar to avoid module resolution issues
let keytar: any;
function getKeytar() {
  if (!keytar) {
    keytar = require('keytar');
  }
  return keytar;
}

/**
 * Get Claude API key from various sources
 * This mirrors the existing getClaudeApiKey() function in main.ts
 */
export async function getClaudeApiKeyForAgent(): Promise<string | null> {
  try {
    // 1. Try environment variables
    const envKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (envKey) {
      console.log('🔑 Using Anthropic API key from environment variable');
      return envKey;
    }

    // 2. Try config file
    try {
      const path = require('path');
      const llmConfigPath = path.join(__dirname, '../../../..', 'llm-config.js');
      delete require.cache[require.resolve(llmConfigPath)];
      const llmConfig = require(llmConfigPath);
      
      if (llmConfig.claude?.enabled && llmConfig.claude?.apiKey) {
        console.log('🔑 Using Anthropic API key from llm-config.js');
        return llmConfig.claude.apiKey;
      }
    } catch (error) {
      // Config file doesn't exist or can't be loaded
    }

    // 3. Try UI settings (keytar)
    const apiKey = await getKeytar().getPassword('smart-qa-llm', 'claude-api-key');
    if (apiKey) {
      console.log('🔑 Using Anthropic API key from UI settings');
      return apiKey;
    }

    console.warn('⚠️  No Anthropic API key found');
    return null;

  } catch (error) {
    console.error('❌ Failed to get Anthropic API key:', error);
    return null;
  }
}

/**
 * Get GitHub token from keytar
 */
export async function getGitHubTokenForAgent(): Promise<string | null> {
  try {
    const token = await getKeytar().getPassword('smart-qa-github', 'github-token');
    if (token) {
      console.log('🔑 Using GitHub token from OAuth authentication');
      return token;
    }
    
    console.warn('⚠️  No GitHub token found. User needs to authenticate.');
    return null;

  } catch (error) {
    console.error('❌ Failed to get GitHub token:', error);
    return null;
  }
}

/**
 * IPC Handler: process-visual-request-agent-v5
 * 
 * Add this to your main.ts:
 * ```typescript
 * ipcMain.handle('process-visual-request-agent-v5', async (event, request) => {
 *   return await processVisualRequestIPC(request);
 * });
 * ```
 */
export async function processVisualRequestIPC(request: {
  instruction: string;
  owner: string;
  repo: string;
  branch: string;
  repoContext?: RepoContext;
  githubToken?: string;
  anthropicApiKey?: string;
}): Promise<{
  success: boolean;
  prUrl?: string;
  prNumber?: number;
  filesModified?: string[];
  toolCalls?: number;
  reasoning?: string[];
  error?: string;
}> {
  
  console.log('🤖 IPC: Process visual request with Agent V5');
  console.log(`   Instruction: "${request.instruction}"`);
  console.log(`   Repository: ${request.owner}/${request.repo}`);

  try {
    // Use credentials passed from main.ts, or try to get them
    let githubToken = request.githubToken;
    let anthropicApiKey = request.anthropicApiKey;

    if (!githubToken) {
      githubToken = await getGitHubTokenForAgent() || undefined;
    }
    
    if (!anthropicApiKey) {
      anthropicApiKey = await getClaudeApiKeyForAgent() || undefined;
    }

    if (!githubToken) {
      return {
        success: false,
        error: 'GitHub authentication required. Please sign in via OAuth in the app.'
      };
    }

    if (!anthropicApiKey) {
      return {
        success: false,
        error: 'Anthropic API key required. Please configure in LLM Settings.'
      };
    }

    // Process with Agent V5
    const processParams: any = {
      instruction: request.instruction,
      githubToken,
      anthropicApiKey,
      repository: {
        owner: request.owner,
        repo: request.repo,
        branch: request.branch
      }
    };
    if (request.repoContext) {
      processParams.repoContext = request.repoContext;
    }
    const result = await processVisualRequestWithAgentV5(processParams);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Task failed'
      };
    }

    // Return success with details
    const response: any = {
      success: true,
      filesModified: result.result?.filesModified || [],
      toolCalls: result.result?.toolCalls.length || 0,
      reasoning: result.result?.reasoning || []
    };
    
    if (result.prUrl) response.prUrl = result.prUrl;
    if (result.prNumber) response.prNumber = result.prNumber;
    
    return response;

  } catch (error) {
    console.error('❌ IPC handler failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * IPC Handler: check-agent-v5-status
 * 
 * Add this to your main.ts:
 * ```typescript
 * ipcMain.handle('check-agent-v5-status', async () => {
 *   return await checkAgentV5StatusIPC();
 * });
 * ```
 */
export async function checkAgentV5StatusIPC(): Promise<{
  available: boolean;
  githubAuth: boolean;
  anthropicKey: boolean;
  message: string;
}> {
  
  const githubToken = await getGitHubTokenForAgent();
  const anthropicApiKey = await getClaudeApiKeyForAgent();

  return getAgentV5Status(githubToken, anthropicApiKey);
}

