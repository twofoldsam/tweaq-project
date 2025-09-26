/**
 * Agent V3 - Two-Agent System for Visual Coding
 * Entry point for the package
 */

// Main orchestrator
export { AgentV3, createAgentV3 } from './AgentV3';
export type { AgentV3Config } from './AgentV3';

// Individual agents
export { Agent1_StrategicPlanning } from './agents/Agent1_StrategicPlanning';
export { Agent2_CodingImplementation } from './agents/Agent2_CodingImplementation';

// Analysis system
export { SymbolicRepoBuilder } from './analysis/SymbolicRepoBuilder';

// Types
export type * from './types';

// Validation utilities
export { validateVisualEdits } from './AgentV3';