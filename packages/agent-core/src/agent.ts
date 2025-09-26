/**
 * Autonomous Agent Core
 * 
 * The main agent class that orchestrates intelligent decision-making
 * for visual coding changes
 */

import { 
  AgentConfig, 
  AgentContext, 
  AgentAction, 
  AgentDecision,
  VisualEdit,
  AgentState 
} from './types';

import {
  RetrieveFileContextAction,
  EvaluateChangeIntentAction,
  EvaluateRepoStructureAction,
  DeterminePRStrategyAction
} from './actions';

export class AutonomousAgent {
  private config: AgentConfig;
  private actions: Map<string, AgentAction> = new Map();
  private context: AgentContext;

  constructor(config: AgentConfig) {
    this.config = config;
    this.context = this.initializeContext();
    this.registerActions();
  }

  /**
   * Main entry point - process a visual request with autonomous decision-making
   */
  async processVisualRequest(visualEdits: VisualEdit[]): Promise<{
    success: boolean;
    context: AgentContext;
    finalState: AgentState;
    error?: string;
  }> {
    try {
      console.log('🤖 Starting autonomous agent processing...');
      
      // Initialize context with the visual edits
      this.context.visualEdits = visualEdits;
      
      // Extract file contexts from visual edits if available
      const fileContexts = (visualEdits[0] as any)?.fileContexts;
      if (fileContexts && Array.isArray(fileContexts)) {
        this.context.fileContexts = fileContexts;
        console.log(`📖 Loaded ${fileContexts.length} file contexts for agent processing`);
      }
      this.context.currentState = {
        phase: 'analyzing',
        progress: 0,
        decisions: {}
      };

      // Execute the agent workflow
      await this.executeWorkflow();

      console.log('✅ Autonomous agent processing completed successfully');
      
      return {
        success: true,
        context: this.context,
        finalState: this.context.currentState
      };

    } catch (error) {
      console.error('❌ Autonomous agent processing failed:', error);
      
      this.context.currentState = {
        ...this.context.currentState,
        phase: 'error'
      };

      return {
        success: false,
        context: this.context,
        finalState: this.context.currentState,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute the main agent workflow with decision-making
   */
  private async executeWorkflow(): Promise<void> {
    const maxIterations = this.config.maxIterations || 10;
    let iteration = 0;

    while (!this.isWorkflowComplete() && iteration < maxIterations) {
      iteration++;
      console.log(`🔄 Agent iteration ${iteration}/${maxIterations}`);

      // Determine next action to take
      const nextAction = await this.selectNextAction();
      
      if (!nextAction) {
        console.log('🏁 No more actions available, workflow complete');
        break;
      }

      // Execute the selected action
      const result = await nextAction.execute(this.context);
      
      // Update context with the result
      this.context.history.push(result);
      this.updateProgress();

      console.log(`📊 Action completed: ${nextAction.name} (${result.success ? 'success' : 'failed'})`);
      
      if (!result.success) {
        console.warn(`⚠️ Action failed: ${result.error}`);
        // Continue with other actions unless this was critical
      }
    }

    if (iteration >= maxIterations) {
      console.warn('⚠️ Agent reached maximum iterations');
    }

    this.context.currentState.phase = 'completed';
    this.context.currentState.progress = 100;
  }

  /**
   * Intelligent action selection using LLM decision-making
   */
  private async selectNextAction(): Promise<AgentAction | null> {
    // Get all available actions
    const availableActions = this.getAvailableActions();
    
    if (availableActions.length === 0) {
      return null;
    }

    // If only one action available, select it
    if (availableActions.length === 1) {
      return availableActions[0] || null;
    }

    // Use LLM to make intelligent decision about which action to take next
    try {
      const decision = await this.makeActionDecision(availableActions);
      const selectedAction = availableActions.find(a => a.type === decision.action) || null;
      
      if (selectedAction) {
        console.log(`🎯 Agent selected: ${selectedAction.name} (confidence: ${decision.confidence})`);
        console.log(`💭 Reasoning: ${decision.reasoning}`);
      }
      return selectedAction;
    } catch (error) {
      console.warn('⚠️ LLM decision-making failed, falling back to priority-based selection:', error);
    }

    // Fallback to priority-based selection
    return availableActions.sort((a, b) => b.priority - a.priority)[0] || null;
  }

  /**
   * Use LLM to make intelligent decisions about which action to take next
   */
  private async makeActionDecision(availableActions: AgentAction[]): Promise<AgentDecision> {
    const prompt = this.buildDecisionPrompt(availableActions);
    
    const systemMessage = `You are an autonomous agent coordinator responsible for making strategic decisions about code generation workflows.

Your expertise includes:
1. Software development best practices
2. Risk assessment and mitigation
3. Workflow optimization
4. Strategic planning for code changes

Make decisions that optimize for quality, safety, and efficiency.`;

    const response = await this.callLLM(prompt, systemMessage);
    
    return this.parseJSONResponse<AgentDecision>(response);
  }

  private buildDecisionPrompt(availableActions: AgentAction[]): string {
    const actionsDescription = availableActions.map(action => 
      `- ${action.type}: ${action.description} (Priority: ${action.priority})`
    ).join('\n');

    const completedActions = this.context.history
      .filter(r => r.success)
      .map(r => r.actionType);

    const currentDecisions = Object.entries(this.context.currentState.decisions)
      .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2).substring(0, 200)}...`)
      .join('\n');

    return `You are coordinating an autonomous agent workflow for visual code generation. Decide which action to take next.

**Current Context:**
- Visual Edits: ${this.context.visualEdits?.length || 0} changes to process
- Repository: ${this.context.repository?.framework || 'unknown'} project
- Completed Actions: ${completedActions.join(', ') || 'none'}
- Current Phase: ${this.context.currentState.phase}

**Available Actions:**
${actionsDescription}

**Current Decisions Made:**
${currentDecisions || 'None yet'}

**Decision Criteria:**
1. Follow logical workflow order (analysis before implementation)
2. Ensure all dependencies are satisfied
3. Optimize for quality and safety
4. Consider the current context and what information is needed next

**Response Format (JSON):**
{
  "action": "action-type-to-execute",
  "reasoning": "Clear explanation of why this action was selected",
  "confidence": 0.95,
  "alternatives": [
    {
      "action": "alternative-action",
      "reasoning": "Why this could also be valid",
      "confidence": 0.75
    }
  ]
}

Select the most appropriate next action based on the current workflow state.`;
  }

  /**
   * Get all actions that can currently be executed
   */
  private getAvailableActions(): AgentAction[] {
    return Array.from(this.actions.values())
      .filter(action => action.canExecute(this.context))
      .filter(action => !this.isActionCompleted(action.type));
  }

  /**
   * Check if an action has already been completed successfully
   */
  private isActionCompleted(actionType: string): boolean {
    return this.context.history.some(
      result => result.actionType === actionType && result.success
    );
  }

  /**
   * Check if the workflow is complete
   */
  private isWorkflowComplete(): boolean {
    // Workflow is complete when all core actions have been executed successfully
    const coreActions = ['evaluate-change-intent', 'evaluate-repo-structure', 'determine-pr-strategy'];
    
    return coreActions.every(actionType => this.isActionCompleted(actionType));
  }

  /**
   * Update progress based on completed actions
   */
  private updateProgress(): void {
    const totalCoreActions = 3; // Core evaluation actions
    const completedCoreActions = ['evaluate-change-intent', 'evaluate-repo-structure', 'determine-pr-strategy']
      .filter(actionType => this.isActionCompleted(actionType)).length;

    this.context.currentState.progress = Math.round((completedCoreActions / totalCoreActions) * 100);

    // Update phase based on progress
    if (completedCoreActions === 0) {
      this.context.currentState.phase = 'analyzing';
    } else if (completedCoreActions < totalCoreActions) {
      this.context.currentState.phase = 'planning';
    } else {
      this.context.currentState.phase = 'executing';
    }
  }

  /**
   * Initialize the agent context
   */
  private initializeContext(): AgentContext {
    return {
      visualEdits: [],
      repository: this.config.repository,
      changeIntents: [],
      currentState: {
        phase: 'analyzing',
        progress: 0,
        decisions: {}
      },
      history: [],
      llmProvider: this.config.llmProvider
    };
  }

  /**
   * Register all available actions
   */
  private registerActions(): void {
    const actions = [
      new RetrieveFileContextAction(),
      new EvaluateChangeIntentAction(),
      new EvaluateRepoStructureAction(),
      new DeterminePRStrategyAction()
    ];

    for (const action of actions) {
      this.actions.set(action.type, action);
    }

    console.log(`🔧 Registered ${actions.length} agent actions`);
  }

  /**
   * Helper method to call LLM
   */
  private async callLLM(prompt: string, systemMessage?: string): Promise<string> {
    if (!this.config.llmProvider) {
      throw new Error('LLM provider not configured');
    }

    // This will be adapted to work with the existing LLM infrastructure
    const response = await this.config.llmProvider.generateText({
      messages: [
        ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
        { role: 'user', content: prompt }
      ]
    });

    return response;
  }

  /**
   * Helper method to parse JSON responses
   */
  private parseJSONResponse<T>(response: string): T {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      
      return JSON.parse((jsonString || response).trim());
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the current agent context (for debugging/inspection)
   */
  getContext(): AgentContext {
    return { ...this.context };
  }

  /**
   * Get available action types
   */
  getAvailableActionTypes(): string[] {
    return Array.from(this.actions.keys());
  }
}
