import { VisualEdit } from '../types';
import { 
  ProjectStructure, 
  ChangeAnalysis, 
  ChangeIntent, 
  StyleImpactAnalysis, 
  PRStrategy,
  PRGroup
} from '../types';

export class StrategicDecisions {
  constructor(private llmProvider: { generateText(prompt: string): Promise<string> }) {}

  /**
   * Evaluate change intents from visual edits (preserved from v1)
   */
  async evaluateChangeIntent(
    visualEdits: VisualEdit[],
    projectStructure: ProjectStructure
  ): Promise<ChangeAnalysis> {
    console.log('🎯 Evaluating change intents...');

    const prompt = this.buildChangeIntentPrompt(visualEdits, projectStructure);
    const response = await this.llmProvider.generateText(prompt);
    
    try {
      const analysis = JSON.parse(response);
      
      // Validate and enhance the analysis
      const changeIntents = await this.enhanceChangeIntents(analysis.changeIntents, projectStructure);
      
      return {
        changeIntents,
        complexity: this.calculateOverallComplexity(changeIntents),
        affectedComponents: this.extractAffectedComponents(changeIntents),
        estimatedChanges: changeIntents.length
      };
    } catch (error) {
      console.warn('⚠️ Error parsing change intent response:', error);
      
      // Fallback: Create basic change intents
      return this.createFallbackChangeAnalysis(visualEdits, projectStructure);
    }
  }

  /**
   * Analyze style impact and recommend implementation strategy (preserved from v1)
   */
  async analyzeStyleImpact(
    changeIntents: ChangeIntent[],
    projectStructure: ProjectStructure
  ): Promise<StyleImpactAnalysis> {
    console.log('🎨 Analyzing style impact...');

    const prompt = this.buildStyleImpactPrompt(changeIntents, projectStructure);
    const response = await this.llmProvider.generateText(prompt);

    try {
      const analysis = JSON.parse(response);
      
      return {
        recommendation: analysis.recommendation || 'inline',
        reasoning: analysis.reasoning || 'Default recommendation',
        impactScore: analysis.impactScore || 0.3,
        affectedComponents: analysis.affectedComponents || [],
        riskAssessment: {
          level: analysis.riskLevel || 'low',
          factors: analysis.riskFactors || []
        }
      };
    } catch (error) {
      console.warn('⚠️ Error parsing style impact response:', error);
      
      // Fallback: Conservative approach
      return this.createFallbackStyleImpact(changeIntents);
    }
  }

  /**
   * Determine PR strategy (preserved from v1)
   */
  async determinePRStrategy(
    changeIntents: ChangeIntent[],
    styleImpact: StyleImpactAnalysis
  ): Promise<PRStrategy> {
    console.log('📋 Determining PR strategy...');

    const prompt = this.buildPRStrategyPrompt(changeIntents, styleImpact);
    const response = await this.llmProvider.generateText(prompt);

    try {
      const strategy = JSON.parse(response);
      
      return {
        numberOfPRs: strategy.numberOfPRs || 1,
        prGroups: strategy.prGroups || this.createDefaultPRGroups(changeIntents),
        strategy: strategy.strategy || 'single',
        reasoning: strategy.reasoning || 'Single PR for simplicity',
        totalComplexity: this.calculateTotalComplexity(changeIntents)
      };
    } catch (error) {
      console.warn('⚠️ Error parsing PR strategy response:', error);
      
      // Fallback: Single PR strategy
      return this.createFallbackPRStrategy(changeIntents);
    }
  }

  /**
   * Build LLM prompt for change intent evaluation
   */
  private buildChangeIntentPrompt(visualEdits: VisualEdit[], projectStructure: ProjectStructure): string {
    const editsDescription = visualEdits.map((edit, index) => {
      const element = edit.element || {};
      const changes = edit.changes || [];
      
      return `Edit ${index + 1}:
- Element: ${element.tagName || 'Unknown'} (${element.selector || 'no selector'})
- Classes: ${element.className || 'none'}
- Changes: ${changes.map(c => `${c.property}: ${c.before} → ${c.after}`).join(', ')}
- Intent: ${edit.intent?.description || 'No description'}`;
    }).join('\n\n');

    return `You are an expert frontend developer analyzing visual design changes. Break down these changes into discrete, actionable change intents.

**Project Context:**
- Framework: ${projectStructure.framework}
- Styling System: ${projectStructure.stylingSystem}
- Build System: ${projectStructure.buildSystem}
- Components Found: ${projectStructure.components.length}

**Visual Changes:**
${editsDescription}

**Available Components:**
${projectStructure.components.slice(0, 10).map(c => 
  `- ${c.name} (${c.filePath}) - ${c.styling.approach} styling, ${c.domElements.length} DOM elements`
).join('\n')}

**Instructions:**
Analyze each visual edit and create change intents. For each intent, determine:
1. Which component needs to be modified
2. What type of change (style/content/structure)
3. Implementation approach (inline/css-file/css-modules/styled-components)
4. Complexity score (0-1)
5. Specific property changes needed

Return a JSON object with this structure:
{
  "changeIntents": [
    {
      "id": "unique-id",
      "description": "Clear description of what needs to change",
      "targetComponentName": "ComponentName",
      "changeType": "style|content|structure|behavior",
      "complexity": 0.5,
      "implementationApproach": "inline|css-file|css-modules|styled-components",
      "reasoning": "Why this approach was chosen",
      "propertyChanges": [
        {
          "property": "color",
          "before": "blue",
          "after": "red",
          "category": "color",
          "impact": "visual",
          "confidence": 0.9
        }
      ]
    }
  ]
}`;
  }

  /**
   * Build LLM prompt for style impact analysis
   */
  private buildStyleImpactPrompt(changeIntents: ChangeIntent[], projectStructure: ProjectStructure): string {
    const intentsDescription = changeIntents.map(intent => 
      `- ${intent.description} (${intent.targetComponent?.name || 'Unknown component'}, complexity: ${intent.complexity})`
    ).join('\n');

    return `Analyze the impact of these style changes and recommend the best implementation approach.

**Project Context:**
- Framework: ${projectStructure.framework}
- Styling System: ${projectStructure.stylingSystem}
- Components: ${projectStructure.components.length} total

**Planned Changes:**
${intentsDescription}

**Component Styling Approaches Currently Used:**
${projectStructure.components.slice(0, 5).map(c => 
  `- ${c.name}: ${c.styling.approach} (${c.styling.classes.length} classes)`
).join('\n')}

**Analysis Required:**
1. Should changes be made inline or in separate style files?
2. Will these changes affect other components?
3. What's the risk level of the proposed changes?
4. Which components might be affected by global style changes?

Return JSON:
{
  "recommendation": "inline|css-file|css-modules|styled-components",
  "reasoning": "Detailed explanation of why this approach is best",
  "impactScore": 0.5,
  "affectedComponents": ["ComponentA", "ComponentB"],
  "riskLevel": "low|medium|high",
  "riskFactors": ["Factor 1", "Factor 2"]
}`;
  }

  /**
   * Build LLM prompt for PR strategy
   */
  private buildPRStrategyPrompt(changeIntents: ChangeIntent[], styleImpact: StyleImpactAnalysis): string {
    const intentsDescription = changeIntents.map(intent => 
      `- ${intent.description} (${intent.targetComponent?.name || 'Unknown'}, complexity: ${intent.complexity})`
    ).join('\n');

    return `Determine the optimal pull request strategy for these changes.

**Changes to Implement:**
${intentsDescription}

**Style Impact Analysis:**
- Recommendation: ${styleImpact.recommendation}
- Impact Score: ${styleImpact.impactScore}
- Risk Level: ${styleImpact.riskAssessment.level}
- Affected Components: ${styleImpact.affectedComponents.join(', ')}

**Decision Criteria:**
1. Should all changes go in one PR or be split?
2. Are changes independent or do they depend on each other?
3. What's the complexity and risk of each group?
4. How should PRs be prioritized?

Return JSON:
{
  "numberOfPRs": 1,
  "strategy": "single|component-based|feature-based",
  "reasoning": "Why this strategy was chosen",
  "prGroups": [
    {
      "id": "pr-1",
      "title": "PR Title",
      "description": "What this PR accomplishes",
      "changeIntentIds": ["intent-1", "intent-2"],
      "priority": "high|medium|low",
      "dependencies": []
    }
  ]
}`;
  }

  /**
   * Enhance change intents with component information
   */
  private async enhanceChangeIntents(
    changeIntents: any[], 
    projectStructure: ProjectStructure
  ): Promise<ChangeIntent[]> {
    return changeIntents.map((intent, index) => {
      // Find the target component
      const targetComponent = projectStructure.components.find(c => 
        c.name === intent.targetComponentName || 
        c.filePath.includes(intent.targetComponentName)
      ) || projectStructure.components[0] || {
        name: 'Unknown',
        filePath: 'src/components/Unknown.tsx',
        framework: 'react',
        exports: [],
        props: [],
        styling: { approach: 'css-classes', classes: [], styleFiles: [], inlineStyles: {} },
        dependencies: [],
        domElements: []
      };

      return {
        id: intent.id || `intent-${index}`,
        description: intent.description || 'Visual modification',
        targetComponent,
        changeType: intent.changeType || 'style',
        complexity: Math.max(0, Math.min(1, intent.complexity || 0.5)),
        implementationStrategy: {
          approach: intent.implementationApproach || 'inline',
          reasoning: intent.reasoning || 'Default approach',
          affectedFiles: [targetComponent.filePath],
          riskLevel: intent.complexity > 0.7 ? 'high' : intent.complexity > 0.4 ? 'medium' : 'low'
        },
        changes: intent.propertyChanges || []
      };
    });
  }

  /**
   * Calculate overall complexity
   */
  private calculateOverallComplexity(changeIntents: ChangeIntent[]): 'simple' | 'medium' | 'complex' {
    const avgComplexity = changeIntents.reduce((sum, intent) => sum + intent.complexity, 0) / changeIntents.length;
    
    if (avgComplexity < 0.3) return 'simple';
    if (avgComplexity < 0.7) return 'medium';
    return 'complex';
  }

  /**
   * Extract affected components
   */
  private extractAffectedComponents(changeIntents: ChangeIntent[]): string[] {
    return [...new Set(changeIntents.map(intent => intent.targetComponent.name))];
  }

  /**
   * Calculate total complexity for PR strategy
   */
  private calculateTotalComplexity(changeIntents: ChangeIntent[]): number {
    return changeIntents.reduce((sum, intent) => sum + intent.complexity, 0);
  }

  /**
   * Create fallback change analysis when LLM fails
   */
  private createFallbackChangeAnalysis(
    visualEdits: VisualEdit[], 
    projectStructure: ProjectStructure
  ): ChangeAnalysis {
    const changeIntents: ChangeIntent[] = visualEdits.map((edit, index) => ({
      id: `fallback-intent-${index}`,
      description: edit.intent?.description || `Visual change to ${edit.element?.tagName || 'element'}`,
      targetComponent: projectStructure.components[0] || {
        name: 'Unknown',
        filePath: 'src/components/Unknown.tsx',
        framework: 'react',
        exports: [],
        props: [],
        styling: { approach: 'css-classes', classes: [], styleFiles: [], inlineStyles: {} },
        dependencies: [],
        domElements: []
      },
      changeType: 'style',
      complexity: 0.5,
      implementationStrategy: {
        approach: 'inline',
        reasoning: 'Fallback strategy',
        affectedFiles: [],
        riskLevel: 'medium'
      },
      changes: edit.changes || []
    }));

    return {
      changeIntents,
      complexity: 'medium',
      affectedComponents: ['Unknown'],
      estimatedChanges: visualEdits.length
    };
  }

  /**
   * Create fallback style impact analysis
   */
  private createFallbackStyleImpact(changeIntents: ChangeIntent[]): StyleImpactAnalysis {
    return {
      recommendation: 'inline',
      reasoning: 'Conservative approach for safety',
      impactScore: 0.3,
      affectedComponents: changeIntents.map(intent => intent.targetComponent?.name || 'Unknown'),
      riskAssessment: {
        level: 'low',
        factors: ['Limited scope', 'Inline changes']
      }
    };
  }

  /**
   * Create fallback PR strategy
   */
  private createFallbackPRStrategy(changeIntents: ChangeIntent[]): PRStrategy {
    return {
      numberOfPRs: 1,
      prGroups: this.createDefaultPRGroups(changeIntents),
      strategy: 'single',
      reasoning: 'Single PR for simplicity',
      totalComplexity: this.calculateTotalComplexity(changeIntents)
    };
  }

  /**
   * Create default PR groups
   */
  private createDefaultPRGroups(changeIntents: ChangeIntent[]): PRGroup[] {
    return [{
      id: 'pr-main',
      title: 'Visual Design Updates',
      description: `Update visual design elements (${changeIntents.length} changes)`,
      changes: changeIntents,
      priority: 'medium',
      dependencies: []
    }];
  }
}
