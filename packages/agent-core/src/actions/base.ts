/**
 * Base Action Implementation
 * 
 * Provides the abstract base class for all agent actions
 */

import { AgentAction, AgentContext, AgentActionResult } from '../types';

export abstract class BaseAction implements AgentAction {
  abstract readonly type: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly priority: number;
  readonly dependencies?: string[];

  constructor(dependencies?: string[]) {
    this.dependencies = dependencies || [];
  }

  /**
   * Default implementation checks if dependencies are satisfied
   */
  canExecute(context: AgentContext): boolean {
    // Check if dependencies are satisfied
    if (this.dependencies && this.dependencies.length > 0) {
      const completedActions = context.history
        .filter(result => result.success)
        .map(result => result.actionType);
      
      return this.dependencies.every(dep => completedActions.includes(dep));
    }
    
    return this.canExecuteImpl(context);
  }

  /**
   * Implementation-specific execution check
   * Override this in subclasses for custom logic
   */
  protected canExecuteImpl(_context: AgentContext): boolean {
    return true;
  }

  /**
   * Execute the action
   */
  async execute(context: AgentContext): Promise<AgentActionResult> {
    const startTime = new Date();
    
    try {
      console.log(`🤖 Executing action: ${this.name}`);
      
      const result = await this.executeImpl(context);
      
      return {
        actionType: this.type,
        success: true,
        data: result.data,
        reasoning: result.reasoning || '',
        timestamp: startTime
      };
    } catch (error) {
      console.error(`❌ Action ${this.name} failed:`, error);
      
      return {
        actionType: this.type,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: startTime
      };
    }
  }

  /**
   * Implementation-specific execution logic
   * Override this in subclasses
   */
  protected abstract executeImpl(context: AgentContext): Promise<{
    data?: any;
    reasoning?: string;
  }>;

  /**
   * Helper method to call LLM for decision making
   */
  protected async callLLM(
    context: AgentContext, 
    prompt: string, 
    systemMessage?: string
  ): Promise<string> {
    if (!context.llmProvider) {
      throw new Error('LLM provider not available in context');
    }

    try {
      // This will be adapted to work with the existing LLM infrastructure
      const response = await context.llmProvider.generateText({
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt }
        ]
      });

      return response;
    } catch (error) {
      console.error('LLM call failed:', error);
      throw new Error(`LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper method to parse JSON response from LLM
   */
  protected parseJSONResponse<T>(response: string): T {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      
      return JSON.parse((jsonString || response).trim());
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
