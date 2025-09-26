/**
 * Agent 1: Strategic Planning Agent
 * Makes high-level decisions and creates detailed implementation tickets
 */

import {
  VisualEdit,
  SymbolicRepo,
  Agent1Config,
  Agent1Result,
  StrategicDecision,
  ComponentSelectionDecision,
  StylingApproachDecision,
  PRStrategyDecision,
  ImplementationTicket,
  ComponentInfo,
  ExpectedChange
} from '../types';

export class Agent1_StrategicPlanning {
  private config: Agent1Config;
  private symbolicRepo: SymbolicRepo;

  constructor(config: Agent1Config) {
    this.config = config;
    this.symbolicRepo = config.symbolicRepo;
  }

  /**
   * Main entry point: Process visual edits and create implementation plan
   */
  async processVisualEdits(visualEdits: VisualEdit[]): Promise<Agent1Result> {
    const startTime = Date.now();
    console.log(`🧠 Agent 1: Processing ${visualEdits.length} visual edits...`);

    try {
      // Phase 1: Analyze each visual edit and make strategic decisions
      console.log('📊 Phase 1: Strategic analysis...');
      const decisions: StrategicDecision[] = [];

      for (const edit of visualEdits) {
        const editDecisions = await this.analyzeVisualEdit(edit);
        decisions.push(...editDecisions);
      }

      // Phase 2: Create implementation tickets based on decisions
      console.log('🎫 Phase 2: Creating implementation tickets...');
      const tickets = await this.createImplementationTickets(visualEdits, decisions);

      // Phase 3: Generate overall reasoning and confidence
      const reasoning = this.generateReasoning(decisions, tickets);
      const confidence = this.calculateConfidence(decisions, tickets);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Agent 1 completed in ${processingTime}ms with ${tickets.length} tickets`);

      return {
        success: true,
        decisions,
        tickets,
        reasoning,
        confidence,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Agent 1 failed:', error);

      return {
        success: false,
        decisions: [],
        tickets: [],
        reasoning: 'Strategic planning failed due to error',
        confidence: 0,
        processingTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Analyze a single visual edit and make strategic decisions
   */
  private async analyzeVisualEdit(visualEdit: VisualEdit): Promise<StrategicDecision[]> {
    console.log(`🔍 Analyzing visual edit: ${visualEdit.intent.description}`);

    const decisions: StrategicDecision[] = [];

    // Decision 1: Component Selection
    const componentDecision = await this.selectTargetComponent(visualEdit);
    decisions.push(componentDecision);

    // Decision 2: Styling Approach
    const stylingDecision = await this.decideStylingApproach(visualEdit, componentDecision);
    decisions.push(stylingDecision);

    // Decision 3: Impact Assessment
    const impactDecision = await this.assessImpact(visualEdit, componentDecision, stylingDecision);
    decisions.push(impactDecision);

    return decisions;
  }

  /**
   * Select the best target component for the visual edit
   */
  private async selectTargetComponent(visualEdit: VisualEdit): Promise<ComponentSelectionDecision> {
    console.log('🎯 Selecting target component...');

    // Find potential components based on DOM mapping
    const potentialComponents = this.findPotentialComponents(visualEdit);
    
    if (potentialComponents.length === 0) {
      throw new Error(`No components found for selector: ${visualEdit.element.selector}`);
    }

    // Use LLM to make intelligent component selection
    const prompt = this.buildComponentSelectionPrompt(visualEdit, potentialComponents);
    const llmResponse = await this.config.llmProvider.generateText(prompt);
    
    let selectionData;
    try {
      selectionData = JSON.parse(llmResponse);
    } catch (e) {
      console.warn('Failed to parse LLM response, using fallback selection');
      selectionData = {
        selectedComponent: potentialComponents[0]?.name || 'unknown',
        reasoning: 'Fallback selection - first available component',
        confidence: 0.5
      };
    }

    const selectedComponent = potentialComponents.find(c => c.name === selectionData.selectedComponent) 
                             || potentialComponents[0];
    
    if (!selectedComponent) {
      throw new Error('No suitable component found for selection');
    }

    const rejectedComponents = potentialComponents
      .filter(c => c !== selectedComponent)
      .map(c => ({
        component: c,
        reason: `Not selected: ${selectionData.reasoning || 'Lower priority'}`
      }));

    return {
      id: `component-selection-${Date.now()}`,
      type: 'component-selection',
      decision: `Selected component: ${selectedComponent.name}`,
      reasoning: selectionData.reasoning || 'Component selection based on DOM mapping and context',
      confidence: selectionData.confidence || 0.7,
      alternatives: potentialComponents.map(c => ({
        option: c.name,
        pros: [`File path: ${c.filePath}`, `Complexity: ${c.complexity}`],
        cons: c === selectedComponent ? [] : ['Not the best match for this edit'],
        score: c === selectedComponent ? 1.0 : 0.5
      })),
      impact: {
        filesAffected: [selectedComponent.filePath],
        componentsAffected: [selectedComponent.name],
        riskLevel: selectedComponent.complexity === 'high' ? 'high' : 'low',
        complexityIncrease: 0.1
      },
      selectedComponent,
      rejectedComponents
    };
  }

  /**
   * Decide on the styling approach for the edit
   */
  private async decideStylingApproach(
    visualEdit: VisualEdit, 
    componentDecision: ComponentSelectionDecision
  ): Promise<StylingApproachDecision> {
    console.log('🎨 Deciding styling approach...');

    const component = componentDecision.selectedComponent;
    const prompt = this.buildStylingApproachPrompt(visualEdit, component);
    const llmResponse = await this.config.llmProvider.generateText(prompt);

    let approachData;
    try {
      approachData = JSON.parse(llmResponse);
    } catch (e) {
      console.warn('Failed to parse styling approach, using fallback');
      approachData = {
        approach: 'inline',
        reasoning: 'Fallback to inline styling',
        confidence: 0.5
      };
    }

    const targetFiles = this.determineTargetFiles(approachData.approach, component);
    const cascadeEffects = await this.analyzeCascadeEffects(approachData.approach, component);

    return {
      id: `styling-approach-${Date.now()}`,
      type: 'styling-approach',
      decision: `Use ${approachData.approach} styling approach`,
      reasoning: approachData.reasoning || 'Styling approach based on component structure and project patterns',
      confidence: approachData.confidence || 0.7,
      alternatives: [
        {
          option: 'inline',
          pros: ['Quick implementation', 'No external dependencies'],
          cons: ['Not reusable', 'Hard to maintain'],
          score: approachData.approach === 'inline' ? 1.0 : 0.3
        },
        {
          option: 'css-file',
          pros: ['Reusable', 'Better separation of concerns'],
          cons: ['More complex', 'Potential cascade effects'],
          score: approachData.approach === 'css-file' ? 1.0 : 0.7
        },
        {
          option: 'design-system',
          pros: ['Consistent', 'Scalable'],
          cons: ['Complex implementation', 'May not exist'],
          score: approachData.approach === 'design-system' ? 1.0 : 0.5
        }
      ],
      impact: {
        filesAffected: targetFiles,
        componentsAffected: [component.name, ...cascadeEffects],
        riskLevel: cascadeEffects.length > 2 ? 'high' : 'low',
        complexityIncrease: cascadeEffects.length * 0.1
      },
      approach: approachData.approach,
      targetFiles,
      cascadeEffects
    };
  }

  /**
   * Assess the overall impact of the changes
   */
  private async assessImpact(
    visualEdit: VisualEdit,
    componentDecision: ComponentSelectionDecision,
    stylingDecision: StylingApproachDecision
  ): Promise<StrategicDecision> {
    console.log('📊 Assessing change impact...');

    const allAffectedFiles = new Set([
      ...componentDecision.impact.filesAffected,
      ...stylingDecision.impact.filesAffected
    ]);

    const allAffectedComponents = new Set([
      ...componentDecision.impact.componentsAffected,
      ...stylingDecision.impact.componentsAffected
    ]);

    const totalComplexityIncrease = componentDecision.impact.complexityIncrease + 
                                   stylingDecision.impact.complexityIncrease;

    const riskLevel = this.calculateOverallRisk(componentDecision, stylingDecision);

    return {
      id: `impact-assessment-${Date.now()}`,
      type: 'file-strategy',
      decision: `Impact: ${allAffectedFiles.size} files, ${allAffectedComponents.size} components`,
      reasoning: `Change will affect ${allAffectedFiles.size} files with ${riskLevel} risk level`,
      confidence: 0.8,
      alternatives: [],
      impact: {
        filesAffected: Array.from(allAffectedFiles),
        componentsAffected: Array.from(allAffectedComponents),
        riskLevel,
        complexityIncrease: totalComplexityIncrease
      }
    };
  }

  /**
   * Create detailed implementation tickets based on decisions
   */
  private async createImplementationTickets(
    visualEdits: VisualEdit[],
    decisions: StrategicDecision[]
  ): Promise<ImplementationTicket[]> {
    console.log('🎫 Creating implementation tickets...');

    const tickets: ImplementationTicket[] = [];

    for (const visualEdit of visualEdits) {
      const editDecisions = decisions.filter(d => 
        d.id.includes(visualEdit.id) || d.impact.filesAffected.length > 0
      );

      const componentDecision = editDecisions.find(d => d.type === 'component-selection') as ComponentSelectionDecision;
      const stylingDecision = editDecisions.find(d => d.type === 'styling-approach') as StylingApproachDecision;

      if (!componentDecision || !stylingDecision) {
        console.warn(`Missing decisions for visual edit ${visualEdit.id}`);
        continue;
      }

      const ticket = await this.createTicketForEdit(visualEdit, componentDecision, stylingDecision);
      tickets.push(ticket);
    }

    // Create PR strategy decision
    const prStrategyDecision = await this.createPRStrategy(tickets);
    decisions.push(prStrategyDecision);

    return tickets;
  }

  /**
   * Create a detailed implementation ticket for a visual edit
   */
  private async createTicketForEdit(
    visualEdit: VisualEdit,
    componentDecision: ComponentSelectionDecision,
    stylingDecision: StylingApproachDecision
  ): Promise<ImplementationTicket> {
    const component = componentDecision.selectedComponent;
    const approach = stylingDecision.approach;

    const filesToRead = this.determineFilesToRead(component, approach);
    const filesToModify = this.determineFilesToModify(component, approach);
    const expectedChanges = await this.generateExpectedChanges(visualEdit, component, approach);

    return {
      id: `ticket-${visualEdit.id}-${Date.now()}`,
      title: `Implement: ${visualEdit.intent.description}`,
      description: this.generateTicketDescription(visualEdit, componentDecision, stylingDecision),
      priority: this.determineTicketPriority(visualEdit, componentDecision, stylingDecision),

      context: {
        visualEdit,
        targetComponent: component,
        strategicDecisions: [componentDecision, stylingDecision],
        repositoryContext: {
          framework: this.symbolicRepo.metadata.framework,
          stylingSystem: this.symbolicRepo.metadata.stylingSystem,
          relatedComponents: this.findRelatedComponents(component),
          affectedFiles: filesToModify
        }
      },

      implementation: {
        approach,
        filesToRead,
        filesToModify,
        expectedChanges,
        complexity: this.assessImplementationComplexity(visualEdit, component, approach),
        estimatedTime: this.estimateImplementationTime(visualEdit, component, approach)
      },

      validation: {
        testsToRun: this.determineRequiredTests(component),
        buildRequired: true,
        lintingRequired: true,
        reviewRequired: this.requiresReview(visualEdit, component, approach),
        rollbackPlan: `Revert changes to ${filesToModify.join(', ')}`
      },

      metadata: {
        createdBy: 'agent-1',
        createdAt: new Date(),
        status: 'created',
        retryCount: 0
      }
    };
  }

  // Helper methods for component selection and analysis

  private findPotentialComponents(visualEdit: VisualEdit): ComponentInfo[] {
    const selector = visualEdit.element.selector;
    const tagName = visualEdit.element.tagName;
    const className = visualEdit.element.className;

    // Look for exact matches first
    const exactMatch = this.symbolicRepo.mappings.domToComponent.get(selector);
    if (exactMatch) {
      return [exactMatch];
    }

    // Look for partial matches
    const potentialComponents: ComponentInfo[] = [];

    // Check all components for potential matches
    for (const component of this.symbolicRepo.structure.components) {
      for (const domElement of component.domElements) {
        if (this.isElementMatch(domElement, visualEdit.element)) {
          potentialComponents.push(component);
          break;
        }
      }
    }

    // If no matches found, return components that might contain the element
    if (potentialComponents.length === 0) {
      return this.symbolicRepo.structure.components.filter(c => 
        c.domElements.some(el => el.tagName.toLowerCase() === tagName.toLowerCase())
      ).slice(0, 3); // Limit to top 3 candidates
    }

    return potentialComponents;
  }

  private isElementMatch(domElement: any, targetElement: any): boolean {
    // Check for tag name match
    if (domElement.tagName?.toLowerCase() !== targetElement.tagName?.toLowerCase()) {
      return false;
    }

    // Check for class matches
    const domClasses = new Set(domElement.classes || []);
    const targetClasses = targetElement.className?.split(' ').filter(Boolean) || [];
    
    const classMatches = targetClasses.filter(cls => domClasses.has(cls));
    return classMatches.length > 0;
  }

  // Prompt building methods

  private buildComponentSelectionPrompt(visualEdit: VisualEdit, components: ComponentInfo[]): string {
    return `You are a strategic planning agent selecting the best component to modify for a visual edit.

VISUAL EDIT:
- Description: ${visualEdit.intent.description}
- Target Element: ${visualEdit.element.tagName} (selector: ${visualEdit.element.selector})
- Changes: ${visualEdit.changes.map(c => `${c.property}: ${c.before} → ${c.after}`).join(', ')}

AVAILABLE COMPONENTS:
${components.map((c, i) => `${i + 1}. ${c.name}
   - File: ${c.filePath}
   - Complexity: ${c.complexity}
   - Styling: ${c.styling.approach}
   - DOM Elements: ${c.domElements.length}
`).join('\n')}

REPOSITORY CONTEXT:
- Framework: ${this.symbolicRepo.metadata.framework}
- Styling System: ${this.symbolicRepo.metadata.stylingSystem}

Select the best component and provide reasoning. Return JSON:
{
  "selectedComponent": "ComponentName",
  "reasoning": "Why this component is the best choice",
  "confidence": 0.8
}`;
  }

  private buildStylingApproachPrompt(visualEdit: VisualEdit, component: ComponentInfo): string {
    return `You are deciding the best styling approach for implementing a visual change.

VISUAL EDIT:
- Description: ${visualEdit.intent.description}
- Changes: ${visualEdit.changes.map(c => `${c.property}: ${c.before} → ${c.after} (${c.category})`).join(', ')}

TARGET COMPONENT:
- Name: ${component.name}
- File: ${component.filePath}
- Current Styling: ${component.styling.approach}
- Style Files: ${component.styling.styleFiles.join(', ') || 'none'}
- Uses Design System: ${component.styling.usesDesignSystem}

REPOSITORY CONTEXT:
- Framework: ${this.symbolicRepo.metadata.framework}
- Styling System: ${this.symbolicRepo.metadata.stylingSystem}
- Has Design System: ${this.symbolicRepo.metadata.hasDesignSystem}

AVAILABLE APPROACHES:
1. "inline" - Add styles directly to the component
2. "css-file" - Create/modify separate CSS file
3. "css-module" - Use CSS modules approach
4. "design-system" - Use existing design system tokens

Choose the best approach considering:
- Consistency with existing codebase
- Maintainability and reusability
- Impact on other components
- Project styling conventions

Return JSON:
{
  "approach": "inline|css-file|css-module|design-system",
  "reasoning": "Detailed explanation of why this approach is best",
  "confidence": 0.8
}`;
  }

  // Helper methods for ticket creation

  private generateTicketDescription(
    visualEdit: VisualEdit,
    componentDecision: ComponentSelectionDecision,
    stylingDecision: StylingApproachDecision
  ): string {
    return `Implement visual change: ${visualEdit.intent.description}

**Strategic Decisions:**
- Target Component: ${componentDecision.selectedComponent.name} (${componentDecision.reasoning})
- Styling Approach: ${stylingDecision.approach} (${stylingDecision.reasoning})

**Visual Changes:**
${visualEdit.changes.map(c => `- ${c.property}: ${c.before} → ${c.after} (${c.category}, ${c.impact})`).join('\n')}

**Implementation Context:**
- Framework: ${this.symbolicRepo.metadata.framework}
- Styling System: ${this.symbolicRepo.metadata.stylingSystem}
- Risk Level: ${stylingDecision.impact.riskLevel}
- Files Affected: ${stylingDecision.impact.filesAffected.length}`;
  }

  // Additional helper methods (simplified for brevity)

  private determineTargetFiles(approach: string, component: ComponentInfo): string[] {
    switch (approach) {
      case 'inline':
        return [component.filePath];
      case 'css-file':
        return [component.filePath, ...component.styling.styleFiles];
      case 'design-system':
        return [component.filePath, 'src/styles/design-system.css'];
      default:
        return [component.filePath];
    }
  }

  private async analyzeCascadeEffects(approach: string, component: ComponentInfo): Promise<string[]> {
    // Simplified cascade analysis
    return approach === 'css-file' ? ['RelatedComponent1', 'RelatedComponent2'] : [];
  }

  private calculateOverallRisk(
    componentDecision: ComponentSelectionDecision,
    stylingDecision: StylingApproachDecision
  ): 'low' | 'medium' | 'high' {
    const risks = [componentDecision.impact.riskLevel, stylingDecision.impact.riskLevel];
    if (risks.includes('high')) return 'high';
    if (risks.includes('medium')) return 'medium';
    return 'low';
  }

  private async createPRStrategy(tickets: ImplementationTicket[]): Promise<PRStrategyDecision> {
    // Simplified PR strategy - could be enhanced with LLM
    const numberOfPRs = tickets.length > 3 ? 2 : 1;
    
    return {
      id: `pr-strategy-${Date.now()}`,
      type: 'pr-strategy',
      decision: `Create ${numberOfPRs} PR(s) for ${tickets.length} tickets`,
      reasoning: `Grouping based on complexity and file overlap`,
      confidence: 0.8,
      alternatives: [],
      impact: {
        filesAffected: [],
        componentsAffected: [],
        riskLevel: 'low',
        complexityIncrease: 0
      },
      numberOfPRs,
      prGroups: [{
        title: 'Visual Updates',
        description: 'Implementation of visual changes',
        tickets: tickets.map(t => t.id),
        priority: 'medium'
      }]
    };
  }

  // Additional helper methods (simplified implementations)

  private determineFilesToRead(component: ComponentInfo, approach: string): string[] {
    return [component.filePath, ...component.styling.styleFiles];
  }

  private determineFilesToModify(component: ComponentInfo, approach: string): string[] {
    return approach === 'inline' ? [component.filePath] : [component.filePath, ...component.styling.styleFiles];
  }

  private async generateExpectedChanges(
    visualEdit: VisualEdit,
    component: ComponentInfo,
    approach: string
  ): Promise<ExpectedChange[]> {
    return [{
      filePath: component.filePath,
      changeType: 'modify',
      description: `Apply ${visualEdit.intent.description}`,
      dependencies: []
    }];
  }

  private determineTicketPriority(
    visualEdit: VisualEdit,
    componentDecision: ComponentSelectionDecision,
    stylingDecision: StylingApproachDecision
  ): 'high' | 'medium' | 'low' {
    return stylingDecision.impact.riskLevel === 'high' ? 'high' : 'medium';
  }

  private findRelatedComponents(component: ComponentInfo): ComponentInfo[] {
    // Find components that might be affected by changes to this component
    return this.symbolicRepo.structure.components.filter(c => 
      c !== component && c.dependencies.includes(component.name)
    ).slice(0, 3);
  }

  private assessImplementationComplexity(
    visualEdit: VisualEdit,
    component: ComponentInfo,
    approach: string
  ): 'low' | 'medium' | 'high' {
    if (component.complexity === 'high' || approach === 'design-system') return 'high';
    if (visualEdit.changes.length > 3 || approach === 'css-file') return 'medium';
    return 'low';
  }

  private estimateImplementationTime(
    visualEdit: VisualEdit,
    component: ComponentInfo,
    approach: string
  ): number {
    // Estimate in minutes
    const baseTime = 15;
    const complexityMultiplier = component.complexity === 'high' ? 2 : 1;
    const approachMultiplier = approach === 'design-system' ? 1.5 : 1;
    
    return Math.round(baseTime * complexityMultiplier * approachMultiplier);
  }

  private determineRequiredTests(component: ComponentInfo): string[] {
    return [`${component.name}.test.tsx`];
  }

  private requiresReview(visualEdit: VisualEdit, component: ComponentInfo, approach: string): boolean {
    return component.complexity === 'high' || approach === 'design-system' || visualEdit.changes.length > 5;
  }

  private generateReasoning(decisions: StrategicDecision[], tickets: ImplementationTicket[]): string {
    return `Strategic analysis completed with ${decisions.length} decisions leading to ${tickets.length} implementation tickets. Key decisions include component selection, styling approach, and impact assessment.`;
  }

  private calculateConfidence(decisions: StrategicDecision[], tickets: ImplementationTicket[]): number {
    const avgDecisionConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;
    const ticketComplexityPenalty = tickets.filter(t => t.implementation.complexity === 'high').length * 0.1;
    
    return Math.max(0.1, avgDecisionConfidence - ticketComplexityPenalty);
  }
}
