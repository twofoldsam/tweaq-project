/**
 * Agent V5 - Claude Agentic System
 * 
 * Autonomous coding agent using Claude's tool use capabilities
 * Reuses infrastructure from Agent V2 (LocalRepo, RemoteRepo)
 */

export { ClaudeAgentV5, createClaudeAgent } from './ClaudeAgentV5';
export { ToolExecutor } from './tools/ToolExecutor';
export { ValidationBridge, createValidationBridge } from './ValidationBridge';

// Desktop app integration
export {
  createAgentFromDesktopApp,
  processVisualRequestWithAgentV5,
  canUseAgentV5,
  getAgentV5Status
} from './integration/DesktopAppIntegration';

export {
  processVisualRequestIPC,
  checkAgentV5StatusIPC,
  getClaudeApiKeyForAgent,
  getGitHubTokenForAgent
} from './integration/MainProcessIntegration';

export type {
  AgentV5Config,
  ClaudeTool,
  ToolResult,
  AgentTaskResult,
  ToolCall,
  ConversationMessage,
  ValidationResult,
  RepoContext
} from './types/index';

