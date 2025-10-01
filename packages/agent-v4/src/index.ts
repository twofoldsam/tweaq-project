// Main exports
export { AgentV4, createAgentV4, defaultAgentV4Config } from './AgentV4.js';

// Core intelligence exports
export { ReasoningEngine } from './intelligence/ReasoningEngine.js';
export { NaturalLanguageAnalyzer } from './intelligence/NaturalLanguageAnalyzer.js';
export { VisualChangeAnalyzer } from './intelligence/VisualChangeAnalyzer.js';
export { CodeIntelligenceEngine } from './intelligence/CodeIntelligenceEngine.js';
export { ChangeConfidenceEngine } from './intelligence/ChangeConfidenceEngine.js';

// Validation exports
export { SmartValidationEngine } from './validation/SmartValidationEngine.js';

// Strategy exports
export { AdaptiveChangeEngine } from './strategies/AdaptiveChangeEngine.js';

// Prompt exports
export { ContextualPromptBuilder } from './prompts/ContextualPromptBuilder.js';

// Conversation exports (standalone conversational intelligence)
export { ConversationalIntelligence } from './conversation/index.js';
export type {
  ConversationState,
  ConversationMessage,
  ConversationAnalysis,
  ReadyTicket
} from './conversation/index.js';

// Type exports
export * from './types/index.js';
