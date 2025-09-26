/**
 * Evaluate Change Intent Action
 * 
 * Analyzes the visual edits to determine:
 * - How many distinct changes need to be made
 * - Whether multiple components are affected
 * - The complexity and scope of each change
 */

import { BaseAction } from './base';
import { AgentContext, ChangeIntent, VisualEdit } from '../types';

export class EvaluateChangeIntentAction extends BaseAction {
  readonly type = 'evaluate-change-intent';
  readonly name = 'Evaluate Change Intent';
  readonly description = 'Analyze visual edits to identify distinct changes and their scope';
  readonly priority = 100; // Highest priority - must run first

  protected override canExecuteImpl(context: AgentContext): boolean {
    return context.visualEdits && context.visualEdits.length > 0;
    // Note: fileContexts are optional - we can work with or without them
  }

  protected async executeImpl(context: AgentContext): Promise<{
    data: ChangeIntent[];
    reasoning: string;
  }> {
    const prompt = this.buildAnalysisPrompt(context.visualEdits, context.repository, context);
    
    const systemMessage = `You are an expert code analysis agent. Your job is to analyze visual design changes and break them down into discrete, actionable change intents.

For each change intent, consider:
1. What specific component/element is being modified
2. What type of change is being made (styling, content, structure)
3. How complex the change is (simple property change vs structural modification)
4. Whether the change affects just one component or multiple components

Be thorough but concise. Focus on actionable insights.`;

    const llmResponse = await this.callLLM(context, prompt, systemMessage);
    const analysisResult = this.parseJSONResponse<{
      changeIntents: ChangeIntent[];
      summary: string;
      totalComplexity: number;
    }>(llmResponse);

    // Update context with the analysis results
    context.changeIntents = analysisResult.changeIntents;
    context.currentState.decisions['changeIntentAnalysis'] = analysisResult;

    const reasoning = `Identified ${analysisResult.changeIntents.length} distinct change intents. ${analysisResult.summary}`;

    return {
      data: analysisResult.changeIntents,
      reasoning
    };
  }

  private buildAnalysisPrompt(visualEdits: VisualEdit[], repository: any, context: AgentContext): string {
    const editsDescription = visualEdits.map((edit, index) => {
      const element = edit.element || {};
      const changes = edit.changes || [];
      
      return `Edit ${index + 1}:
- Target: ${(element as any).tagName || 'unknown'} ${(element as any).className ? `(.${(element as any).className.replace(/\s+/g, '.')})` : ''} ${(element as any).id ? `(#${(element as any).id})` : ''}
- Changes: ${changes.map(c => `${c.property}: ${c.before} → ${c.after}`).join(', ')}`;
    }).join('\n\n');

    return `Analyze these visual design changes and break them down into discrete change intents:

**Visual Edits:**
${editsDescription}

**Repository Context:**
- Framework: ${repository?.framework || 'unknown'}
- Styling System: ${repository?.stylingSystem || 'unknown'}
- Components: ${repository?.components?.length || 0} detected

${this.buildFileContextSection(visualEdits, context)}

**Analysis Required:**
1. Identify each distinct change that needs to be made
2. Determine if changes affect single or multiple components
3. Assess the complexity of each change
4. Group related changes together

**Response Format (JSON):**
{
  "changeIntents": [
    {
      "id": "unique-id",
      "description": "Clear description of what needs to change",
      "targetElement": {
        "tagName": "div",
        "className": "button primary",
        "id": "submit-btn"
      },
      "changes": [
        {
          "property": "background-color",
          "before": "#blue",
          "after": "#red"
        }
      ],
      "complexity": "simple|moderate|complex",
      "scope": "component|global|multiple-components"
    }
  ],
  "summary": "Brief overview of the analysis",
  "totalComplexity": 0.7
}

Focus on being precise and actionable. Each change intent should be clear enough for a developer to implement.`;
  }
  
  private buildFileContextSection(_visualEdits: VisualEdit[], context: AgentContext): string {
    if (!context.fileContexts || context.fileContexts.length === 0) {
      return '**Current Code Context:** Not available';
    }
    
    const contextSections = context.fileContexts
      .filter(fc => fc.content.length > 0) // Only include successfully retrieved files
      .map(fc => {
        const preview = fc.content.length > 500 
          ? fc.content.substring(0, 500) + '...[truncated]'
          : fc.content;
          
        return `**${fc.filePath}** (${fc.componentName}, confidence: ${fc.mappingConfidence}):
\`\`\`tsx
${preview}
\`\`\``;
      });
    
    if (contextSections.length === 0) {
      return '**Current Code Context:** Files could not be retrieved';
    }
    
    return `**Current Code Context:**
${contextSections.join('\n\n')}

This context shows the actual code that will be modified. Consider the current implementation when analyzing change complexity and scope.`;
  }
}
