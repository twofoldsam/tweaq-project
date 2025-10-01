import type {
  NaturalLanguageEdit,
  ChangeIntent,
  RepoSymbolicModel,
  ComponentStructure
} from '../types/index.js';

/**
 * Analyzes natural language instructions and converts them to structured change intents
 */
export class NaturalLanguageAnalyzer {
  
  /**
   * Analyze a natural language instruction and create a change intent
   */
  analyzeNaturalLanguageInstruction(
    nlEdit: NaturalLanguageEdit,
    symbolicRepo: RepoSymbolicModel
  ): ChangeIntent {
    console.log('🗣️ Analyzing natural language instruction:', nlEdit.instruction);
    
    // Determine the type of change from the instruction
    const changeType = this.inferChangeType(nlEdit.instruction);
    
    // Find the target component
    const targetComponent = this.findTargetComponent(nlEdit, symbolicRepo);
    
    // Assess the complexity and scope
    const complexity = this.assessComplexity(nlEdit.instruction);
    
    // Determine confidence based on instruction clarity
    const confidence = this.assessInstructionConfidence(nlEdit, targetComponent);
    
    // Determine risk level
    const riskLevel = this.assessRiskLevel(changeType, complexity, nlEdit.context?.scope);
    
    // Determine priority
    const priority = this.determinePriority(changeType, nlEdit.context?.scope);
    
    const changeIntent: ChangeIntent = {
      id: `intent_nl_${nlEdit.id}`,
      type: changeType,
      description: nlEdit.instruction,
      naturalLanguageEdit: nlEdit,
      targetComponent,
      confidence,
      riskLevel,
      priority,
      instructionType: 'natural-language'
    };
    
    console.log(`🎯 Natural language analysis complete: ${changeType} (confidence: ${confidence.toFixed(2)})`);
    
    return changeIntent;
  }
  
  /**
   * Infer the type of change from the instruction text
   */
  private inferChangeType(instruction: string): string {
    const lower = instruction.toLowerCase();
    
    // Content changes
    if (this.matchesPatterns(lower, [
      'copy', 'text', 'wording', 'message', 'label', 'title', 'heading',
      'friendly', 'professional', 'casual', 'formal', 'tone'
    ])) {
      return 'content-modification';
    }
    
    // Layout changes
    if (this.matchesPatterns(lower, [
      'condense', 'compact', 'spacing', 'spread', 'arrange', 'layout',
      'stack', 'align', 'position', 'move', 'reorder'
    ])) {
      return 'layout-modification';
    }
    
    // Styling changes
    if (this.matchesPatterns(lower, [
      'color', 'style', 'look', 'appearance', 'visual', 'theme',
      'font', 'size', 'bold', 'italic'
    ])) {
      return 'styling-modification';
    }
    
    // Structural changes
    if (this.matchesPatterns(lower, [
      'add', 'remove', 'delete', 'insert', 'create', 'component',
      'element', 'section', 'restructure'
    ])) {
      return 'structure-modification';
    }
    
    // Behavioral changes
    if (this.matchesPatterns(lower, [
      'click', 'hover', 'interact', 'action', 'behavior', 'function',
      'link', 'button', 'form', 'submit'
    ])) {
      return 'behavior-modification';
    }
    
    // Default to general modification
    return 'general-modification';
  }
  
  /**
   * Check if text matches any of the given patterns
   */
  private matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }
  
  /**
   * Find the target component based on the natural language edit
   */
  private findTargetComponent(
    nlEdit: NaturalLanguageEdit,
    symbolicRepo: RepoSymbolicModel
  ): ComponentStructure | undefined {
    // If a specific element is targeted, find its component
    if (nlEdit.targetElement?.selector) {
      const selector = nlEdit.targetElement.selector;
      
      // Look up in DOM mappings
      const mappings = symbolicRepo.domMappings.get(selector);
      if (mappings && mappings.length > 0) {
        const bestMapping = mappings[0]; // Highest confidence
        const component = symbolicRepo.components.find(
          c => c.filePath === bestMapping.filePath
        );
        if (component) {
          console.log(`✅ Found target component: ${component.name}`);
          return component;
        }
      }
    }
    
    // Try to infer from instruction context
    const componentName = this.inferComponentFromInstruction(nlEdit.instruction);
    if (componentName) {
      const component = symbolicRepo.components.find(
        c => c.name.toLowerCase().includes(componentName.toLowerCase())
      );
      if (component) {
        console.log(`✅ Inferred target component: ${component.name}`);
        return component;
      }
    }
    
    // Check for scope-based targeting
    if (nlEdit.context?.scope) {
      return this.findComponentByScope(nlEdit.context.scope, nlEdit.instruction, symbolicRepo);
    }
    
    console.log('⚠️ Could not determine specific target component');
    return undefined;
  }
  
  /**
   * Try to infer component name from instruction
   */
  private inferComponentFromInstruction(instruction: string): string | null {
    const lower = instruction.toLowerCase();
    
    // Common component names
    const componentKeywords = [
      'header', 'footer', 'sidebar', 'navigation', 'nav', 'menu',
      'button', 'card', 'modal', 'form', 'input', 'table',
      'hero', 'banner', 'gallery', 'carousel'
    ];
    
    for (const keyword of componentKeywords) {
      if (lower.includes(keyword)) {
        return keyword;
      }
    }
    
    return null;
  }
  
  /**
   * Find component based on scope
   */
  private findComponentByScope(
    scope: string,
    instruction: string,
    symbolicRepo: RepoSymbolicModel
  ): ComponentStructure | undefined {
    const lower = instruction.toLowerCase();
    
    // Match components by name patterns
    if (scope === 'component') {
      const componentName = this.inferComponentFromInstruction(instruction);
      if (componentName) {
        return symbolicRepo.components.find(
          c => c.name.toLowerCase().includes(componentName)
        );
      }
    }
    
    // For section or page scope, return the first relevant component
    // In a real implementation, this would be more sophisticated
    return symbolicRepo.components[0];
  }
  
  /**
   * Assess the complexity of the instruction
   */
  private assessComplexity(instruction: string): 'simple' | 'moderate' | 'complex' {
    const words = instruction.split(/\s+/).length;
    const hasMultipleClauses = instruction.includes(',') || instruction.includes('and');
    const hasConditions = /if|when|unless|depending/.test(instruction.toLowerCase());
    
    if (words < 5 && !hasMultipleClauses) {
      return 'simple';
    }
    
    if (words < 15 && !hasConditions) {
      return 'moderate';
    }
    
    return 'complex';
  }
  
  /**
   * Assess confidence in understanding the instruction
   */
  private assessInstructionConfidence(
    nlEdit: NaturalLanguageEdit,
    targetComponent?: ComponentStructure
  ): number {
    let confidence = 0.7; // Base confidence for natural language
    
    // Boost confidence if we have a clear target
    if (targetComponent) {
      confidence += 0.15;
    }
    
    // Boost confidence if instruction is specific
    if (this.isSpecificInstruction(nlEdit.instruction)) {
      confidence += 0.1;
    }
    
    // Reduce confidence for vague instructions
    if (this.isVagueInstruction(nlEdit.instruction)) {
      confidence -= 0.2;
    }
    
    // Boost confidence if we have context
    if (nlEdit.context?.currentState || nlEdit.context?.userIntent) {
      confidence += 0.1;
    }
    
    return Math.max(0.3, Math.min(0.9, confidence));
  }
  
  /**
   * Check if instruction is specific
   */
  private isSpecificInstruction(instruction: string): boolean {
    const specificIndicators = [
      /\d+px/, /\d+%/, /#[0-9a-f]{6}/i, // Specific values
      'bold', 'italic', 'underline', // Specific styles
      'red', 'blue', 'green', 'black', 'white', // Specific colors
      'center', 'left', 'right', // Specific alignment
    ];
    
    return specificIndicators.some(pattern => 
      typeof pattern === 'string' 
        ? instruction.toLowerCase().includes(pattern)
        : pattern.test(instruction)
    );
  }
  
  /**
   * Check if instruction is vague
   */
  private isVagueInstruction(instruction: string): boolean {
    const vagueWords = [
      'better', 'nicer', 'improve', 'enhance', 'fix', 'update',
      'something', 'somehow', 'maybe', 'sort of', 'kind of'
    ];
    
    return vagueWords.some(word => instruction.toLowerCase().includes(word));
  }
  
  /**
   * Assess the risk level of the change
   */
  private assessRiskLevel(
    changeType: string,
    complexity: 'simple' | 'moderate' | 'complex',
    scope?: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Content and styling changes are generally lower risk
    if (changeType === 'content-modification' || changeType === 'styling-modification') {
      return complexity === 'complex' ? 'medium' : 'low';
    }
    
    // Layout changes are medium risk
    if (changeType === 'layout-modification') {
      return complexity === 'complex' ? 'high' : 'medium';
    }
    
    // Structural changes are higher risk
    if (changeType === 'structure-modification') {
      return complexity === 'simple' ? 'medium' : 'high';
    }
    
    // Behavioral changes are highest risk
    if (changeType === 'behavior-modification') {
      return complexity === 'simple' ? 'high' : 'critical';
    }
    
    // Page-level changes are higher risk
    if (scope === 'page') {
      return 'high';
    }
    
    return 'medium';
  }
  
  /**
   * Determine the priority of the change
   */
  private determinePriority(changeType: string, scope?: string): 'low' | 'medium' | 'high' {
    // Content changes are often high priority (user-facing)
    if (changeType === 'content-modification') {
      return 'high';
    }
    
    // Styling and layout are medium priority
    if (changeType === 'styling-modification' || changeType === 'layout-modification') {
      return 'medium';
    }
    
    // Structural changes depend on scope
    if (changeType === 'structure-modification') {
      return scope === 'page' ? 'high' : 'medium';
    }
    
    return 'medium';
  }
  
  /**
   * Get a summary of the natural language analysis
   */
  getSummary(changeIntent: ChangeIntent): string {
    return `
🗣️ Natural Language Analysis
─────────────────────────────
Instruction: "${changeIntent.naturalLanguageEdit?.instruction}"
Type: ${changeIntent.type}
Confidence: ${(changeIntent.confidence * 100).toFixed(1)}%
Risk: ${changeIntent.riskLevel}
Priority: ${changeIntent.priority}
Target: ${changeIntent.targetComponent?.name || 'Unspecified'}
    `.trim();
  }
}

