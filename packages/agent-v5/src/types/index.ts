/**
 * Configuration for Claude Agent V5
 */
export interface AgentV5Config {
  anthropicApiKey: string;
  githubToken: string;
  repository: {
    owner: string;
    repo: string;
    branch: string;
  };
  options?: {
    maxTurns?: number;
    model?: string;
    temperature?: number;
    verbose?: boolean;
    enableTesting?: boolean;
    buildCommand?: string;
    testUrl?: string;
  };
}

/**
 * Tool definition for Claude
 */
export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * Tool execution result
 */
export interface ToolResult {
  success: boolean;
  output?: any;
  error?: string;
}

/**
 * Testing result from automated validation
 */
export interface TestingResult {
  success: boolean;
  passed: boolean;
  evidence: {
    screenshots: Array<{
      timestamp: number;
      description: string;
      dataUrl: string;
    }>;
    logs: string[];
    cdpSignals?: any;
    buildOutput?: string;
    validationResults: Array<{
      name: string;
      passed: boolean;
      severity: 'error' | 'warning' | 'info';
      message: string;
      details?: any;
    }>;
  };
  summary: string;
  error?: string;
}

/**
 * Agent task result
 */
export interface AgentTaskResult {
  success: boolean;
  filesModified: string[];
  reasoning: string[];
  toolCalls: ToolCall[];
  conversation: ConversationMessage[];
  summary: string;
  validation?: ValidationResult;
  testing?: TestingResult;
  error?: string;
}

/**
 * Tool call record
 */
export interface ToolCall {
  tool: string;
  input: any;
  result: any;
  timestamp: number;
}

/**
 * Conversation message
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: any;
}

/**
 * Validation result (from Agent V4)
 */
export interface ValidationResult {
  passed: boolean;
  confidence: number;
  issues: Array<{
    type: string;
    severity: 'error' | 'warning';
    message: string;
  }>;
  warnings: Array<{
    type: string;
    message: string;
  }>;
  metrics: {
    linesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    filesModified: number;
    changeRatio: number;
    complexityDelta: number;
  };
}

/**
 * Repository context for the agent
 */
export interface RepoContext {
  framework?: string;
  stylingSystem?: string;
  components?: any[];
  projectStructure?: any;
  dependencies?: Record<string, string>;
}

