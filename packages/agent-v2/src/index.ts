// Main Agent V2 exports
export { AgentV2 } from './AgentV2';

// Core types
export * from './types';

// Workspace management
export { WorkspaceManager } from './workspace/WorkspaceManager';

// Code intelligence
export { CodeIntelligence } from './intelligence/CodeIntelligence';

// Strategic decisions
export { StrategicDecisions } from './actions/StrategicDecisions';

// Code generation
export { CodeGenerator } from './actions/CodeGenerator';

// Validation
export { Validator } from './actions/Validator';

// PR management
export { PRManager } from './git/PRManager';

// Factory function for easy instantiation
import { AgentV2 } from './AgentV2';
import { AgentV2Config } from './types';

/**
 * Create a new AgentV2 instance with validated configuration
 */
export function createAgentV2(config: AgentV2Config): AgentV2 {
  return AgentV2.create(config);
}

/**
 * Create AgentV2 with OpenAI provider
 */
export function createAgentV2WithOpenAI(config: Omit<AgentV2Config, 'llmProvider'> & {
  openaiApiKey: string;
  model?: string;
}): AgentV2 {
  const llmProvider = {
    async generateText(prompt: string): Promise<string> {
      // This would integrate with OpenAI API
      // For now, return a placeholder
      console.log('🤖 LLM Provider called with prompt length:', prompt.length);
      return JSON.stringify({
        changeIntents: [],
        reasoning: "Placeholder response from OpenAI provider"
      });
    }
  };

  return AgentV2.create({
    ...config,
    llmProvider
  });
}

/**
 * Create AgentV2 with Claude provider
 */
export function createAgentV2WithClaude(config: Omit<AgentV2Config, 'llmProvider'> & {
  claudeApiKey: string;
  model?: string;
}): AgentV2 {
  const llmProvider = {
    async generateText(prompt: string): Promise<string> {
      // This would integrate with Claude API
      // For now, return a placeholder
      console.log('🤖 LLM Provider called with prompt length:', prompt.length);
      return JSON.stringify({
        changeIntents: [],
        reasoning: "Placeholder response from Claude provider"
      });
    }
  };

  return AgentV2.create({
    ...config,
    llmProvider
  });
}

/**
 * Utility function to validate visual edits before processing
 */
export function validateVisualEdits(visualEdits: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(visualEdits)) {
    errors.push('visualEdits must be an array');
    return { valid: false, errors };
  }
  
  if (visualEdits.length === 0) {
    errors.push('visualEdits array cannot be empty');
    return { valid: false, errors };
  }
  
  for (let i = 0; i < visualEdits.length; i++) {
    const edit = visualEdits[i];
    
    if (!edit.id) {
      errors.push(`visualEdit[${i}] missing required field: id`);
    }
    
    if (!edit.element) {
      errors.push(`visualEdit[${i}] missing required field: element`);
    } else {
      if (!edit.element.tagName) {
        errors.push(`visualEdit[${i}].element missing required field: tagName`);
      }
    }
    
    if (!edit.intent) {
      errors.push(`visualEdit[${i}] missing required field: intent`);
    } else {
      if (!edit.intent.description) {
        errors.push(`visualEdit[${i}].intent missing required field: description`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Default configuration values
 */
export const DEFAULT_AGENT_CONFIG: Partial<AgentV2Config> = {
  validation: {
    runTests: true,
    runLinting: true,
    buildCheck: true
  },
  prSettings: {
    autoMerge: false,
    reviewRequired: true,
    branchNaming: 'agent/{timestamp}-{description}'
  },
  maxIterations: 5,
  confidenceThreshold: 0.7
};

/**
 * Merge user config with defaults
 */
export function mergeWithDefaults(userConfig: Partial<AgentV2Config>): AgentV2Config {
  return {
    ...DEFAULT_AGENT_CONFIG,
    ...userConfig
  } as AgentV2Config;
}
