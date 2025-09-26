/**
 * Evaluate Repository Structure Action
 * 
 * Analyzes the repository structure to determine:
 * - Whether changes should be made inline or in style files
 * - Impact on other components if changes are made in shared styles
 * - Best approach for each change intent
 */

import { BaseAction } from './base';
import { AgentContext, StyleImpactAnalysis } from '../types';

export class EvaluateRepoStructureAction extends BaseAction {
  readonly type = 'evaluate-repo-structure';
  readonly name = 'Evaluate Repository Structure';
  readonly description = 'Analyze repository structure to determine optimal change implementation strategy';
  readonly priority = 90;
  override readonly dependencies = ['evaluate-change-intent'];

  protected override canExecuteImpl(context: AgentContext): boolean {
    return context.changeIntents && context.changeIntents.length > 0;
  }

  protected override async executeImpl(context: AgentContext): Promise<{
    data: StyleImpactAnalysis[];
    reasoning: string;
  }> {
    const analyses: StyleImpactAnalysis[] = [];
    
    for (const changeIntent of context.changeIntents) {
      const analysis = await this.analyzeChangeImpact(changeIntent, context);
      analyses.push(analysis);
    }

    // Store analysis results in context
    context.styleImpactAnalysis = analyses;
    context.currentState.decisions['repoStructureAnalysis'] = {
      analyses,
      recommendations: this.generateRecommendations(analyses)
    };

    const reasoning = this.buildReasoningText(analyses);

    return {
      data: analyses,
      reasoning
    };
  }

  private async analyzeChangeImpact(
    changeIntent: any, 
    context: AgentContext
  ): Promise<StyleImpactAnalysis> {
    const prompt = this.buildImpactAnalysisPrompt(changeIntent, context);
    
    const systemMessage = `You are a senior frontend architect analyzing code structure and styling decisions. Your expertise includes:

1. Component architecture and styling strategies
2. CSS specificity and cascade implications
3. Maintainability vs. performance trade-offs
4. Risk assessment for style changes

Provide detailed analysis with clear recommendations and reasoning.`;

    const llmResponse = await this.callLLM(context, prompt, systemMessage);
    
    return this.parseJSONResponse<StyleImpactAnalysis>(llmResponse);
  }

  private buildImpactAnalysisPrompt(changeIntent: any, context: AgentContext): string {
    const repoInfo = context.repository;
    const relatedComponents = this.findRelatedComponents(changeIntent, context);

    return `Analyze the impact of implementing this change in the repository:

**Change Intent:**
- ID: ${changeIntent.id}
- Description: ${changeIntent.description}
- Target: ${changeIntent.targetElement?.tagName} ${changeIntent.targetElement?.className ? `(.${changeIntent.targetElement.className})` : ''}
- Complexity: ${changeIntent.complexity}
- Scope: ${changeIntent.scope}

**Changes to Make:**
${changeIntent.changes?.map((c: any) => `- ${c.property}: ${c.before} → ${c.after}`).join('\n') || 'No specific changes listed'}

**Repository Structure:**
- Framework: ${repoInfo.framework}
- Styling System: ${repoInfo.stylingSystem}
- Total Components: ${repoInfo.components?.length || 0}
- Style Files: ${repoInfo.structure?.styles?.length || 0}

**Potentially Related Components:**
${relatedComponents.map(c => `- ${c.name} (${c.path})`).join('\n') || 'None identified'}

**Analysis Required:**
1. Should this change be made inline in the component or in a separate style file?
2. If made in a style file, which components might be affected?
3. What's the risk level of this change?
4. What's the recommended implementation approach?

**Consider:**
- CSS specificity and cascade effects
- Component reusability and maintainability
- Performance implications
- Risk of breaking existing functionality
- Styling system conventions (${repoInfo.stylingSystem})

**Response Format (JSON):**
{
  "affectedComponents": ["ComponentA", "ComponentB"],
  "globalStyleChanges": true|false,
  "riskLevel": "low|medium|high",
  "recommendation": "inline|style-file|new-class",
  "reasoning": "Detailed explanation of the recommendation including trade-offs and considerations"
}

Be specific about WHY you're making each recommendation.`;
  }

  private findRelatedComponents(changeIntent: any, context: AgentContext): any[] {
    // Simple implementation - in a real system, this would use more sophisticated analysis
    const targetClasses = changeIntent.targetElement?.className?.split(/\s+/) || [];
    
    return context.repository.components?.filter((component: any) => {
      // Check if component might use similar class names
      return targetClasses.some((className: string) => 
        component.name.toLowerCase().includes(className.toLowerCase()) ||
        component.path.includes(className)
      );
    }) || [];
  }

  private generateRecommendations(analyses: StyleImpactAnalysis[]): any {
    const highRiskChanges = analyses.filter(a => a.riskLevel === 'high');
    const globalChanges = analyses.filter(a => a.globalStyleChanges);
    const inlineRecommended = analyses.filter(a => a.recommendation === 'inline');

    return {
      summary: `Analyzed ${analyses.length} changes: ${highRiskChanges.length} high-risk, ${globalChanges.length} global impact, ${inlineRecommended.length} recommended for inline implementation`,
      risks: highRiskChanges.map(a => a.reasoning),
      globalImpacts: globalChanges.length,
      recommendedApproach: this.determineOverallApproach(analyses)
    };
  }

  private determineOverallApproach(analyses: StyleImpactAnalysis[]): string {
    const approaches = analyses.map(a => a.recommendation);
    const counts = approaches.reduce((acc, approach) => {
      acc[approach] = (acc[approach] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommon = Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0];

    if (!mostCommon) {
      return 'No clear approach determined';
    }

    return `Primary approach: ${mostCommon[0]} (${mostCommon[1]}/${analyses.length} changes)`;
  }

  private buildReasoningText(analyses: StyleImpactAnalysis[]): string {
    const summary = this.generateRecommendations(analyses);
    const riskBreakdown = analyses.reduce((acc, a) => {
      acc[a.riskLevel] = (acc[a.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return `Repository structure analysis completed. ${summary.summary}. Risk breakdown: ${Object.entries(riskBreakdown).map(([level, count]) => `${count} ${level}`).join(', ')}.`;
  }
}
