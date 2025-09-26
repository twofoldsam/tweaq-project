/**
 * Determine PR Strategy Action
 * 
 * Decides how to organize changes into pull requests:
 * - Should changes be combined into one PR or split into multiple?
 * - How to group related changes together
 * - Optimal PR size and complexity management
 */

import { BaseAction } from './base';
import { AgentContext, PRStrategy } from '../types';

export class DeterminePRStrategyAction extends BaseAction {
  readonly type = 'determine-pr-strategy';
  readonly name = 'Determine PR Strategy';
  readonly description = 'Decide how to organize changes into pull requests for optimal review and deployment';
  readonly priority = 80;
  override readonly dependencies = ['evaluate-change-intent', 'evaluate-repo-structure'];

  protected override canExecuteImpl(context: AgentContext): boolean {
    return !!(context.changeIntents && 
           context.changeIntents.length > 0 && 
           context.styleImpactAnalysis && 
           context.styleImpactAnalysis.length > 0);
  }

  protected override async executeImpl(context: AgentContext): Promise<{
    data: PRStrategy;
    reasoning: string;
  }> {
    const prompt = this.buildStrategyPrompt(context);
    
    const systemMessage = `You are a senior engineering manager and technical lead with expertise in:

1. Code review best practices and PR sizing
2. Risk management and deployment strategies
3. Team productivity and development workflows
4. Change management and rollback considerations

Your goal is to optimize for:
- Reviewability (PRs should be easy to review)
- Risk mitigation (separate risky changes)
- Logical grouping (related changes together)
- Development velocity (not too many small PRs)

Provide strategic recommendations with clear reasoning.`;

    const llmResponse = await this.callLLM(context, prompt, systemMessage);
    const strategy = this.parseJSONResponse<PRStrategy>(llmResponse);

    // Validate and adjust strategy if needed
    const validatedStrategy = this.validateStrategy(strategy, context);

    // Store strategy in context
    context.prStrategy = validatedStrategy;
    context.currentState.decisions['prStrategy'] = validatedStrategy;

    const reasoning = this.buildReasoningText(validatedStrategy, context);

    return {
      data: validatedStrategy,
      reasoning
    };
  }

  private buildStrategyPrompt(context: AgentContext): string {
    const changeIntents = context.changeIntents || [];
    const styleAnalyses = context.styleImpactAnalysis || [];

    const changesDescription = changeIntents.map((intent, index) => {
      const analysis = styleAnalyses[index];
      return `Change ${index + 1} (${intent.id}):
- Description: ${intent.description}
- Complexity: ${intent.complexity}
- Scope: ${intent.scope}
- Risk Level: ${analysis?.riskLevel || 'unknown'}
- Recommendation: ${analysis?.recommendation || 'unknown'}
- Affected Components: ${analysis?.affectedComponents?.length || 0}
- Global Impact: ${analysis?.globalStyleChanges ? 'Yes' : 'No'}`;
    }).join('\n\n');

    return `Determine the optimal pull request strategy for these changes:

**Changes to Implement:**
${changesDescription}

**Repository Context:**
- Framework: ${context.repository?.framework || 'unknown'}
- Total Components: ${context.repository?.components?.length || 0}
- Styling System: ${context.repository?.stylingSystem || 'unknown'}

**Strategic Considerations:**
1. **PR Size**: Optimal PR size is 200-400 lines of code for good reviewability
2. **Risk Management**: High-risk changes should be isolated
3. **Logical Grouping**: Related changes should be grouped together
4. **Dependencies**: Changes that depend on each other should be in the same PR or ordered correctly
5. **Rollback Strategy**: Consider how easy it would be to rollback each PR

**Decision Criteria:**
- Combine changes if they're closely related and low-risk
- Separate changes if they have different risk levels or affect different areas
- Consider reviewer cognitive load - don't mix complex logic changes with simple styling
- Think about deployment and testing implications

**Response Format (JSON):**
{
  "numberOfPRs": 2,
  "prGroups": [
    {
      "id": "pr-1",
      "changeIntents": ["change-1", "change-2"],
      "title": "Update button styling and colors",
      "description": "Low-risk styling updates for primary buttons",
      "reasoning": "These changes are related, low-risk, and affect the same component family"
    }
  ],
  "totalComplexity": 0.6
}

**Guidelines:**
- Single PR: If all changes are simple, related, and low-risk
- Multiple PRs: If changes have different risk levels, affect different areas, or are complex
- Consider the human reviewer: What would be easiest to understand and approve?`;
  }

  private validateStrategy(strategy: PRStrategy, context: AgentContext): PRStrategy {
    const changeIntents = context.changeIntents || [];
    
    // Ensure all change intents are accounted for
    const allIntentIds = changeIntents.map(c => c.id);
    const assignedIntentIds = strategy.prGroups.flatMap(group => group.changeIntents);
    
    const unassignedIntents = allIntentIds.filter(id => !assignedIntentIds.includes(id));
    
    if (unassignedIntents.length > 0) {
      console.warn('Some change intents were not assigned to PRs:', unassignedIntents);
      
      // Create a catch-all PR for unassigned intents
      strategy.prGroups.push({
        id: `pr-${strategy.prGroups.length + 1}`,
        changeIntents: unassignedIntents,
        title: 'Additional changes',
        description: 'Remaining changes that were not initially grouped',
        reasoning: 'Catch-all for unassigned change intents',
        priority: 'medium',
        estimatedReviewTime: 15,
        riskLevel: 'low',
        dependencies: [],
        testingStrategy: ['unit-tests'],
        rollbackPlan: 'Standard rollback procedure'
      });
      
      strategy.numberOfPRs = strategy.prGroups.length;
    }

    // Validate PR complexity
    strategy.totalComplexity = this.calculateTotalComplexity(strategy, context);

    return strategy;
  }

  private calculateTotalComplexity(strategy: PRStrategy, context: AgentContext): number {
    const changeIntents = context.changeIntents || [];
    const styleAnalyses = context.styleImpactAnalysis || [];

    let totalComplexity = 0;
    let totalChanges = 0;

    for (const group of strategy.prGroups) {
      for (const intentId of group.changeIntents) {
        const intent = changeIntents.find((c: any) => c.id === intentId);
        const analysis = styleAnalyses.find((_: any, index: number) => 
          changeIntents[index]?.id === intentId
        );

        if (intent && analysis) {
          // Complexity scoring
          let score = 0;
          
          switch (intent.complexity) {
            case 'simple': score += 0.2; break;
            case 'moderate': score += 0.5; break;
            case 'complex': score += 1.0; break;
          }

          switch (analysis.riskLevel) {
            case 'low': score += 0.1; break;
            case 'medium': score += 0.3; break;
            case 'high': score += 0.6; break;
          }

          if (analysis.globalStyleChanges) score += 0.2;
          if (analysis.affectedComponents.length > 3) score += 0.3;

          totalComplexity += score;
          totalChanges++;
        }
      }
    }

    return totalChanges > 0 ? totalComplexity / totalChanges : 0;
  }

  private buildReasoningText(strategy: PRStrategy, _context: AgentContext): string {
    const avgComplexity = strategy.totalComplexity;
    const complexityLevel = avgComplexity < 0.3 ? 'low' : avgComplexity < 0.7 ? 'moderate' : 'high';

    let reasoning = `Determined optimal strategy: ${strategy.numberOfPRs} pull request${strategy.numberOfPRs > 1 ? 's' : ''} with ${complexityLevel} overall complexity (${avgComplexity.toFixed(2)}).`;

    if (strategy.numberOfPRs === 1) {
      reasoning += ' All changes can be safely combined due to their related nature and manageable complexity.';
    } else {
      reasoning += ` Changes separated to optimize for reviewability and risk management.`;
      
      const riskSeparation = strategy.prGroups.some(group => 
        group.reasoning.toLowerCase().includes('risk')
      );
      
      if (riskSeparation) {
        reasoning += ' High-risk changes isolated for safer deployment.';
      }
    }

    return reasoning;
  }
}
