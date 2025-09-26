/**
 * Agent Core Package Entry Point
 */

import { AutonomousAgent } from './agent';
import type { AgentConfig } from './types';

export { AutonomousAgent } from './agent';
export * from './types';
export * from './actions';

// Convenience factory function
export function createAutonomousAgent(config: AgentConfig) {
  return new AutonomousAgent(config);
}
