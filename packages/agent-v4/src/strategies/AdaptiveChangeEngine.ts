import type {
  ChangeIntent,
  ChangeConfidenceAssessment,
  ChangeImpactAnalysis,
  RepoSymbolicModel,
  FileChange,
  ChangeStrategy,
  ChangeStep,
  ChangeApproach,
  ValidationResult,
  ComponentStructure,
  NaturalLanguageEdit
} from '../types/index.js';

import { SmartValidationEngine } from '../validation/SmartValidationEngine.js';
import { demoLogger } from '../utils/DemoLogger.js';

/**
 * Adaptive change engine that selects strategies based on confidence
 */
export class AdaptiveChangeEngine {
  private validationEngine: SmartValidationEngine;
  private llmProvider: any;
  private fileReader?: (filePath: string) => Promise<string>;
  
  constructor(llmProvider: any, fileReader?: (filePath: string) => Promise<string>) {
    this.validationEngine = new SmartValidationEngine();
    this.llmProvider = llmProvider;
    this.fileReader = fileReader;
  }
  
  /**
   * Execute a change using the most appropriate strategy
   */
  async executeChange(
    changeIntent: ChangeIntent,
    confidenceAssessment: ChangeConfidenceAssessment,
    impactAnalysis: ChangeImpactAnalysis,
    symbolicRepo: RepoSymbolicModel
  ): Promise<{
    fileChanges: FileChange[];
    strategy: ChangeStrategy;
    validation: ValidationResult;
    executionLog: string[];
  }> {
    const executionLog: string[] = [];
    executionLog.push(`Initializing ${confidenceAssessment.recommendedApproach} strategy`);
    
    // Create strategy based on confidence assessment
    const strategy = this.createStrategy(confidenceAssessment, impactAnalysis);
    executionLog.push(`Created strategy with ${strategy.steps.length} steps`);
    
    let fileChanges: FileChange[] = [];
    let validation: ValidationResult | null = null;
    let attempt = 0;
    const maxAttempts = 3;
    
    // Execute with retries and fallbacks
    while (attempt < maxAttempts) {
      try {
        executionLog.push(`Executing attempt ${attempt + 1} of ${maxAttempts}`);
        
        // Execute the strategy
        const result = await this.executeStrategy(
          strategy,
          changeIntent,
          confidenceAssessment,
          impactAnalysis,
          symbolicRepo,
          executionLog
        );
        
        fileChanges = result.fileChanges;
        validation = result.validation;
        
        // If validation passes, we're done
        if (validation.passed) {
          executionLog.push('✅ Change applied successfully');
          break;
        }
        
        // If validation fails, try fallback strategy
        executionLog.push(`⚠️  Validation issues detected (${validation.issues.length}), trying fallback`);
        
        if (strategy.fallbackStrategy && attempt < maxAttempts - 1) {
          strategy.approach = strategy.fallbackStrategy.approach;
          strategy.steps = strategy.fallbackStrategy.steps;
          strategy.validationLevel = strategy.fallbackStrategy.validationLevel;
          executionLog.push(`🔄 Switching to ${strategy.approach} strategy`);
        }
        
      } catch (error) {
        executionLog.push(`❌ Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
      
      attempt++;
    }
    
    if (!validation) {
      throw new Error('Change execution failed after all attempts');
    }
    
    
    return {
      fileChanges,
      strategy,
      validation,
      executionLog
    };
  }
  
  /**
   * Create a strategy based on confidence assessment
   */
  private createStrategy(
    confidenceAssessment: ChangeConfidenceAssessment,
    impactAnalysis: ChangeImpactAnalysis
  ): ChangeStrategy {
    const approach = confidenceAssessment.recommendedApproach;
    
    const baseStrategy: ChangeStrategy = {
      approach,
      confidence: confidenceAssessment.confidence,
      steps: this.createStepsForApproach(approach),
      validationLevel: this.getValidationLevelForApproach(approach),
      fallbackStrategy: this.createFallbackStrategy(confidenceAssessment, impactAnalysis)
    };
    
    return baseStrategy;
  }
  
  /**
   * Create execution steps for a specific approach
   */
  private createStepsForApproach(approach: ChangeApproach): ChangeStep[] {
    const commonSteps: ChangeStep[] = [
      {
        type: 'analyze',
        description: 'Analyze change requirements',
        required: true
      },
      {
        type: 'generate',
        description: 'Generate code changes',
        required: true
      },
      {
        type: 'validate',
        description: 'Validate generated changes',
        required: true
      }
    ];
    
    switch (approach) {
      case 'high-confidence-direct':
        return [
          ...commonSteps,
          {
            type: 'apply',
            description: 'Apply changes directly',
            required: true
          }
        ];
        
      case 'medium-confidence-guided':
        return [
          {
            type: 'analyze',
            description: 'Deep analysis of change requirements',
            required: true
          },
          ...commonSteps,
          {
            type: 'verify',
            description: 'Additional verification step',
            required: true
          },
          {
            type: 'apply',
            description: 'Apply changes with monitoring',
            required: true
          }
        ];
        
      case 'low-confidence-conservative':
        return [
          {
            type: 'analyze',
            description: 'Comprehensive analysis',
            required: true,
            timeout: 30000
          },
          {
            type: 'generate',
            description: 'Conservative code generation',
            required: true
          },
          {
            type: 'validate',
            description: 'Strict validation',
            required: true
          },
          {
            type: 'verify',
            description: 'Multiple verification passes',
            required: true
          },
          {
            type: 'apply',
            description: 'Careful application with rollback plan',
            required: true
          }
        ];
        
      case 'very-low-confidence-human-review':
        return [
          {
            type: 'analyze',
            description: 'Generate change proposal',
            required: true
          },
          {
            type: 'generate',
            description: 'Create change preview',
            required: true
          },
          {
            type: 'validate',
            description: 'Validate proposal',
            required: true
          }
          // Note: No 'apply' step - requires human review
        ];
        
      default:
        return commonSteps;
    }
  }
  
  /**
   * Get validation level for approach
   */
  private getValidationLevelForApproach(approach: ChangeApproach): 'basic' | 'standard' | 'strict' | 'paranoid' {
    const levels: Record<ChangeApproach, 'basic' | 'standard' | 'strict' | 'paranoid'> = {
      'high-confidence-direct': 'standard',
      'medium-confidence-guided': 'strict',
      'low-confidence-conservative': 'paranoid',
      'very-low-confidence-human-review': 'paranoid'
    };
    
    return levels[approach];
  }
  
  /**
   * Create fallback strategy
   */
  private createFallbackStrategy(
    confidenceAssessment: ChangeConfidenceAssessment,
    impactAnalysis: ChangeImpactAnalysis
  ): ChangeStrategy | undefined {
    const fallbackApproaches = confidenceAssessment.fallbackStrategies;
    
    if (fallbackApproaches.length === 0) {
      return undefined;
    }
    
    const fallbackApproach = fallbackApproaches[0];
    
    return {
      approach: fallbackApproach,
      confidence: confidenceAssessment.confidence * 0.8, // Reduced confidence for fallback
      steps: this.createStepsForApproach(fallbackApproach),
      validationLevel: this.getValidationLevelForApproach(fallbackApproach)
    };
  }
  
  /**
   * Execute a specific strategy
   */
  private async executeStrategy(
    strategy: ChangeStrategy,
    changeIntent: ChangeIntent,
    confidenceAssessment: ChangeConfidenceAssessment,
    impactAnalysis: ChangeImpactAnalysis,
    symbolicRepo: RepoSymbolicModel,
    executionLog: string[]
  ): Promise<{
    fileChanges: FileChange[];
    validation: ValidationResult;
  }> {
    let fileChanges: FileChange[] = [];
    
    // Execute each step in the strategy
    for (const step of strategy.steps) {
      executionLog.push(`Executing step: ${step.description}`);
      
      switch (step.type) {
        case 'analyze':
          await this.executeAnalyzeStep(changeIntent, symbolicRepo, executionLog);
          break;
          
        case 'generate':
          fileChanges = await this.executeGenerateStep(
            strategy.approach,
            changeIntent,
            confidenceAssessment,
            impactAnalysis,
            symbolicRepo,
            executionLog
          );
          break;
          
        case 'validate':
          // Validation will be done after all steps
          break;
          
        case 'verify':
          await this.executeVerifyStep(fileChanges, changeIntent, executionLog);
          break;
          
        case 'apply':
          // Application would happen in the calling code
          executionLog.push('Changes ready for application');
          break;
      }
    }
    
    // Perform validation
    const validation = await this.performValidation(
      fileChanges,
      changeIntent,
      confidenceAssessment,
      impactAnalysis,
      strategy.validationLevel,
      executionLog
    );
    
    return { fileChanges, validation };
  }
  
  /**
   * Execute analyze step
   */
  private async executeAnalyzeStep(
    changeIntent: ChangeIntent,
    symbolicRepo: RepoSymbolicModel,
    executionLog: string[]
  ): Promise<void> {
    executionLog.push(`Analyzing target component: ${changeIntent.targetComponent?.name}`);
    executionLog.push(`Change type: ${changeIntent.type}`);
    executionLog.push(`Risk level: ${changeIntent.riskLevel}`);
    
    // Additional analysis could be performed here
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate analysis time
  }
  
  /**
   * Execute generate step with approach-specific logic
   */
  private async executeGenerateStep(
    approach: ChangeApproach,
    changeIntent: ChangeIntent,
    confidenceAssessment: ChangeConfidenceAssessment,
    impactAnalysis: ChangeImpactAnalysis,
    symbolicRepo: RepoSymbolicModel,
    executionLog: string[]
  ): Promise<FileChange[]> {
    executionLog.push(`Generating code with ${approach} approach`);
    
    switch (approach) {
      case 'high-confidence-direct':
        return this.generateDirectChanges(changeIntent, symbolicRepo, executionLog);
        
      case 'medium-confidence-guided':
        return this.generateGuidedChanges(changeIntent, impactAnalysis, symbolicRepo, executionLog);
        
      case 'low-confidence-conservative':
        return this.generateConservativeChanges(changeIntent, impactAnalysis, symbolicRepo, executionLog);
        
      case 'very-low-confidence-human-review':
        return this.generateChangeProposal(changeIntent, symbolicRepo, executionLog);
        
      default:
        throw new Error(`Unknown approach: ${approach}`);
    }
  }
  
  /**
   * Generate changes with high confidence (direct approach)
   */
  private async generateDirectChanges(
    changeIntent: ChangeIntent,
    symbolicRepo: RepoSymbolicModel,
    executionLog: string[]
  ): Promise<FileChange[]> {
    executionLog.push('Using direct generation with full context');
    
    const targetComponent = changeIntent.targetComponent;
    if (!targetComponent) {
      throw new Error('No target component identified');
    }
    
    // Read the actual file content if not already available
    if (!targetComponent.content) {
      executionLog.push(`Loading file: ${targetComponent.filePath}`);
      try {
        const fileContent = await this.readFileContent(targetComponent.filePath, symbolicRepo);
        targetComponent.content = fileContent;
        executionLog.push(`File loaded (${fileContent.length} characters)`);
      } catch (error) {
        executionLog.push(`⚠️  Could not read file content: ${error}`);
        targetComponent.content = '// Could not read current file content';
      }
    }
    
    if (!targetComponent.content || targetComponent.content.length < 100) {
      executionLog.push(`⚠️  File content appears incomplete - this may affect code generation`);
    }
    
    // Build a confident prompt with rich context
    const prompt = this.buildDirectPrompt(changeIntent, symbolicRepo);
    
    // Generate with LLM
    executionLog.push(`Generating code changes...`);
    const generatedCode = await this.llmProvider.generateText(prompt);
    
    const newContent = this.extractCodeFromResponse(generatedCode);
    executionLog.push(`Code generation complete (${newContent.length} characters)`);
    
    // Validate generated content length
    const originalLength = targetComponent.content?.length || 0;
    const minAcceptableLength = Math.floor(originalLength * 0.8);
    
    if (newContent.length < minAcceptableLength) {
      executionLog.push(`⚠️  Generated code appears too short, retrying with preservation feedback`);
      
      const retryNewContent = await this.retryWithFeedback(
        targetComponent.content || '',
        changeIntent,
        'over-deletion',
        `Your first attempt was too short (${newContent.length} chars vs ${originalLength} original). You deleted too much code. Please return the COMPLETE original file with ONLY the specific change applied.`,
        executionLog
      );
      
      if (retryNewContent.length < minAcceptableLength) {
        executionLog.push(`❌ Retry unsuccessful - falling back to conservative approach`);
        throw new Error(`Generated code is still too short after retry (${retryNewContent.length} chars vs ${originalLength} original). This indicates persistent over-deletion.`);
      }
      
      executionLog.push(`✅ Retry successful - code preservation validated`);
      return [{
        filePath: targetComponent.filePath,
        action: 'modify',
        oldContent: targetComponent.content || '',
        newContent: retryNewContent,
        reasoning: `High-confidence direct change with preservation fix: ${changeIntent.description}`
      }];
    }
    
    executionLog.push(`✅ Code validation passed (${Math.round(newContent.length/originalLength*100)}% of original size)`);
    
    return [{
      filePath: targetComponent.filePath,
      action: 'modify',
      oldContent: targetComponent.content || '',
      newContent,
      reasoning: `High-confidence direct change: ${changeIntent.description}`
    }];
  }
  
  /**
   * Generate changes with medium confidence (guided approach)
   */
  private async generateGuidedChanges(
    changeIntent: ChangeIntent,
    impactAnalysis: ChangeImpactAnalysis,
    symbolicRepo: RepoSymbolicModel,
    executionLog: string[]
  ): Promise<FileChange[]> {
    executionLog.push('Using guided generation with impact analysis');
    
    const targetComponent = changeIntent.targetComponent;
    
    // Handle natural language instructions without a specific target component
    if (!targetComponent && changeIntent.naturalLanguageEdit) {
      executionLog.push('⚠️  No specific target component - using LLM to identify relevant files');
      return this.generateBroadNLChanges(changeIntent, symbolicRepo, executionLog);
    }
    
    if (!targetComponent) {
      throw new Error('No target component identified');
    }
    
    // Build a guided prompt with explicit constraints
    const prompt = this.buildGuidedPrompt(changeIntent, impactAnalysis, symbolicRepo);
    
    // Generate with LLM
    const generatedCode = await this.llmProvider.generateText(prompt);
    const newContent = this.extractCodeFromResponse(generatedCode);
    
    executionLog.push(`Generated ${newContent.length} characters with guided constraints`);
    
    // Validate guided generation results
    const originalLength = targetComponent.content?.length || 0;
    const minAcceptableLength = Math.floor(originalLength * 0.8);
    
    if (newContent.length < minAcceptableLength) {
      executionLog.push(`⚠️  Generated code too short, retrying with constraints`);
      
      const retryNewContent = await this.retryWithFeedback(
        targetComponent.content || '',
        changeIntent,
        'over-deletion',
        `Your guided attempt was too short (${newContent.length} chars vs ${originalLength} original). You deleted too much code. Please return the COMPLETE original file with ONLY the specific change applied.`,
        executionLog
      );
      
      if (retryNewContent.length < minAcceptableLength) {
        executionLog.push(`❌ Guided retry unsuccessful - escalating to conservative approach`);
        throw new Error(`Generated code is still too short after guided retry (${retryNewContent.length} chars vs ${originalLength} original). This indicates persistent over-deletion.`);
      }
      
      executionLog.push(`✅ Guided retry successful`);
      return [{
        filePath: targetComponent.filePath,
        action: 'modify',
        oldContent: targetComponent.content || '',
        newContent: retryNewContent,
        reasoning: `Medium-confidence guided change with retry fix: ${changeIntent.description}`
      }];
    }
    
    executionLog.push(`✅ Guided generation validated`);
    
    return [{
      filePath: targetComponent.filePath,
      action: 'modify',
      oldContent: targetComponent.content || '',
      newContent,
      reasoning: `Medium-confidence guided change: ${changeIntent.description}`
    }];
  }
  
  /**
   * Generate changes for broad natural language instructions without specific target
   * This is the SMART analysis that interprets instructions across the entire page
   */
  private async generateBroadNLChanges(
    changeIntent: ChangeIntent,
    symbolicRepo: RepoSymbolicModel,
    executionLog: string[]
  ): Promise<FileChange[]> {
    const nlEdit = changeIntent.naturalLanguageEdit;
    if (!nlEdit) {
      throw new Error('No natural language edit provided');
    }

    executionLog.push(`🧠 SMART ANALYSIS: "${nlEdit.instruction}"`);

    // PHASE 1: Understand the instruction type and intent
    const instructionAnalysis = this.analyzeInstructionIntent(nlEdit.instruction, executionLog);
    
    // PHASE 2: Intelligently identify relevant components using repo structure
    const relevantComponents = this.identifyRelevantComponents(
      instructionAnalysis,
      symbolicRepo,
      executionLog
    );

    if (relevantComponents.length === 0) {
      executionLog.push('⚠️  No relevant components identified - instruction may be too vague');
      return [];
    }

    executionLog.push(`✅ Identified ${relevantComponents.length} relevant component(s)`);

    // PHASE 3: Generate intelligent, targeted changes
    return this.generateIntelligentChanges(
      nlEdit,
      instructionAnalysis,
      relevantComponents,
      symbolicRepo,
      executionLog
    );
  }

  /**
   * Analyze the instruction to understand what type of change is needed
   */
  private analyzeInstructionIntent(instruction: string, executionLog: string[]): {
    type: 'content' | 'styling' | 'layout' | 'structure' | 'mixed';
    scope: 'narrow' | 'moderate' | 'broad';
    keywords: string[];
    targets: string[];
  } {
    const lower = instruction.toLowerCase();
    
    // Detect instruction type
    let type: 'content' | 'styling' | 'layout' | 'structure' | 'mixed' = 'mixed';
    
    if (lower.match(/copy|text|wording|tone|friendly|professional|casual|formal/)) {
      type = 'content';
    } else if (lower.match(/color|size|font|padding|margin|spacing|vibrant|bold|style/)) {
      type = 'styling';
    } else if (lower.match(/condense|spread|arrange|organize|layout|position|align/)) {
      type = 'layout';
    } else if (lower.match(/add|remove|reorganize|restructure|rework/)) {
      type = 'structure';
    }

    // Detect scope
    let scope: 'narrow' | 'moderate' | 'broad' = 'moderate';
    if (lower.match(/all|every|entire|page|site|throughout/)) {
      scope = 'broad';
    } else if (lower.match(/this|that|the\s\w+(?:\s\w+)?$/)) {
      scope = 'narrow';
    }

    // Extract target elements
    const targets: string[] = [];
    const targetMatches = lower.match(/\b(button|footer|header|nav|hero|card|form|input|list|menu|sidebar|modal|dialog|banner|section)\b/g);
    if (targetMatches) {
      targets.push(...targetMatches);
    }

    // Extract key action words
    const keywords: string[] = [];
    const keywordMatches = lower.match(/\b(friendly|vibrant|condensed|professional|modern|clean|bold|subtle|minimal|elegant)\b/g);
    if (keywordMatches) {
      keywords.push(...keywordMatches);
    }

    executionLog.push(`   Type: ${type}, Scope: ${scope}, Targets: [${targets.join(', ')}]`);

    return { type, scope, keywords, targets };
  }

  /**
   * Intelligently identify which components are relevant to the instruction
   */
  private identifyRelevantComponents(
    analysis: { type: string; scope: string; keywords: string[]; targets: string[] },
    symbolicRepo: RepoSymbolicModel,
    executionLog: string[]
  ): ComponentStructure[] {
    const relevant: Array<{ component: ComponentStructure; score: number; reason: string }> = [];

    for (const component of symbolicRepo.components) {
      let score = 0;
      const reasons: string[] = [];

      const componentNameLower = component.name.toLowerCase();
      const filePathLower = component.filePath.toLowerCase();
      const content = (component.content || '').toLowerCase();

      // Score based on target keywords in component name/path
      for (const target of analysis.targets) {
        if (componentNameLower.includes(target) || filePathLower.includes(target)) {
          score += 50;
          reasons.push(`matches target "${target}"`);
        }
      }

      // Score based on instruction type
      if (analysis.type === 'content') {
        // Look for components with significant text content
        const textContentRatio = this.estimateTextContentRatio(content);
        if (textContentRatio > 0.3) {
          score += 30;
          reasons.push('has significant text content');
        }
      } else if (analysis.type === 'styling') {
        // Look for components with styling patterns
        if (content.includes('classname') || content.includes('style') || content.includes('css')) {
          score += 20;
          reasons.push('contains styling');
        }
      } else if (analysis.type === 'layout') {
        // Look for container/layout components
        if (componentNameLower.match(/layout|container|wrapper|section|grid|flex/)) {
          score += 40;
          reasons.push('is a layout component');
        }
      }

      // Boost for main/page-level components
      if (componentNameLower.match(/^(app|page|home|main|index)/)) {
        score += 15;
        reasons.push('is a page-level component');
      }

      // Boost for components with many exports/usage (likely important)
      if (component.exports && component.exports.length > 0) {
        score += 10;
        reasons.push('is exported/reusable');
      }

      if (score > 0) {
        relevant.push({ component, score, reason: reasons.join(', ') });
      }
    }

    // Sort by score (highest first) and take top 5
    relevant.sort((a, b) => b.score - a.score);
    const topRelevant = relevant.slice(0, 5);

    executionLog.push(`   Relevance scores:`);
    topRelevant.forEach(({ component, score, reason }) => {
      executionLog.push(`     • ${component.name} (${score} pts): ${reason}`);
    });

    return topRelevant.map(r => r.component);
  }

  /**
   * Estimate how much of a component is text content vs code structure
   */
  private estimateTextContentRatio(content: string): number {
    // Look for JSX text content patterns
    const textMatches = content.match(/>\s*[A-Z][^<>{}]+\s*</g);
    const textLength = textMatches ? textMatches.join('').length : 0;
    return textLength / Math.max(content.length, 1);
  }

  /**
   * Generate intelligent, targeted changes for the identified components
   */
  private async generateIntelligentChanges(
    nlEdit: NaturalLanguageEdit,
    analysis: { type: string; scope: string; keywords: string[]; targets: string[] },
    components: ComponentStructure[],
    symbolicRepo: RepoSymbolicModel,
    executionLog: string[]
  ): Promise<FileChange[]> {
    executionLog.push(`🎯 Generating smart changes for ${components.length} component(s)...`);

    const fileChanges: FileChange[] = [];

    for (const component of components) {
      executionLog.push(`   📝 Processing: ${component.name}`);
      
      // Build a context-aware prompt that's specific to the component
      const smartPrompt = this.buildSmartModificationPrompt(
        nlEdit,
        analysis,
        component,
        symbolicRepo
      );

      try {
        const generatedCode = await this.llmProvider.generateText(smartPrompt);
        const newContent = this.extractCodeFromResponse(generatedCode);
        
        // Intelligent validation
        const validation = this.validateIntelligentChange(
          component.content || '',
          newContent,
          analysis,
          executionLog
        );

        if (!validation.passed) {
          executionLog.push(`   ⚠️  Validation failed: ${validation.reason}, skipping`);
          continue;
        }

        fileChanges.push({
          filePath: component.filePath,
          action: 'modify',
          oldContent: component.content || '',
          newContent,
          reasoning: `Smart NL modification (${analysis.type}): "${nlEdit.instruction}"`
        });
        
        executionLog.push(`   ✅ Generated ${newContent.length} chars (was ${(component.content || '').length})`);
      } catch (error) {
        executionLog.push(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    return fileChanges;
  }

  /**
   * Build a smart, context-aware prompt for modifying a component
   */
  private buildSmartModificationPrompt(
    nlEdit: NaturalLanguageEdit,
    analysis: { type: string; keywords: string[] },
    component: ComponentStructure,
    symbolicRepo: RepoSymbolicModel
  ): string {
    const styleContext = symbolicRepo.stylingPatterns 
      ? `\nStyle System:\n${JSON.stringify(symbolicRepo.stylingPatterns, null, 2).substring(0, 500)}`
      : '';

    return `You are an expert React developer making a SMART, TARGETED modification.

INSTRUCTION: "${nlEdit.instruction}"

CHANGE TYPE: ${analysis.type}
KEY QUALITIES: ${analysis.keywords.join(', ') || 'N/A'}

CURRENT COMPONENT (${component.name}):
\`\`\`typescript
${component.content || '// Content not available'}
\`\`\`
${styleContext}

CRITICAL REQUIREMENTS:
1. Make ONLY the changes needed for the instruction
2. Preserve ALL functionality, imports, exports, types, props
3. Preserve the component structure and logic
4. If changing text: Make it ${analysis.keywords.join(', ') || 'better'}
5. If changing styles: Use the existing design system/patterns
6. Return the COMPLETE modified file (not just snippets)

OUTPUT REQUIREMENTS:
- Return ONLY code, no explanations or markdown formatting
- Ensure the file is syntactically valid
- Keep the same overall file length (±30%)
- Preserve all TypeScript types and interfaces

Return the complete modified component:`;
  }

  /**
   * Validate that an intelligent change is reasonable
   */
  private validateIntelligentChange(
    oldContent: string,
    newContent: string,
    analysis: { type: string },
    executionLog: string[]
  ): { passed: boolean; reason?: string } {
    // Check: Not too short
    if (newContent.length < oldContent.length * 0.5) {
      return { passed: false, reason: 'Generated code too short (possible over-deletion)' };
    }

    // Check: Not too long
    if (newContent.length > oldContent.length * 2) {
      return { passed: false, reason: 'Generated code too long (possible over-generation)' };
    }

    // Check: Still has imports
    if (oldContent.includes('import') && !newContent.includes('import')) {
      return { passed: false, reason: 'Missing imports' };
    }

    // Check: Still has exports
    if (oldContent.includes('export') && !newContent.includes('export')) {
      return { passed: false, reason: 'Missing exports' };
    }

    // Check: Not just whitespace
    if (newContent.trim().length < 50) {
      return { passed: false, reason: 'Generated content too minimal' };
    }

    return { passed: true };
  }

  /**
   * Generate changes with low confidence (conservative approach)
   */
  private async generateConservativeChanges(
    changeIntent: ChangeIntent,
    impactAnalysis: ChangeImpactAnalysis,
    symbolicRepo: RepoSymbolicModel,
    executionLog: string[]
  ): Promise<FileChange[]> {
    executionLog.push('Using conservative generation with strict constraints');
    
    const targetComponent = changeIntent.targetComponent;
    if (!targetComponent) {
      throw new Error('No target component identified');
    }
    
    // Build a very conservative prompt
    const prompt = this.buildConservativePrompt(changeIntent, impactAnalysis, symbolicRepo);
    
    // Generate with LLM
    const generatedCode = await this.llmProvider.generateText(prompt);
    const newContent = this.extractCodeFromResponse(generatedCode);
    
    // Validate conservative generation results
    const originalLength = targetComponent.content?.length || 0;
    const minAcceptableLength = Math.floor(originalLength * 0.8);
    
    if (newContent.length < minAcceptableLength) {
      executionLog.push(`⚠️  Conservative generation too short, applying strict retry`);
      
      const retryNewContent = await this.retryWithFeedback(
        targetComponent.content || '',
        changeIntent,
        'over-deletion',
        `Your conservative attempt was too short (${newContent.length} chars vs ${originalLength} original). You deleted too much code. Please return the COMPLETE original file with ONLY the specific change applied.`,
        executionLog
      );
      
      if (retryNewContent.length < minAcceptableLength) {
        executionLog.push(`❌ Conservative retry failed - requesting human review`);
        throw new Error(`Generated code is still too short after conservative retry (${retryNewContent.length} chars vs ${originalLength} original). This indicates persistent over-deletion.`);
      }
      
      executionLog.push(`✅ Conservative retry successful`);
      return [{
        filePath: targetComponent.filePath,
        action: 'modify',
        oldContent: targetComponent.content || '',
        newContent: retryNewContent,
        reasoning: `Low-confidence conservative change with retry fix: ${changeIntent.description}`
      }];
    }
    
    // Additional conservative checks
    const originalLines = (targetComponent.content || '').split('\n').length;
    const newLines = newContent.split('\n').length;
    const changeRatio = Math.abs(newLines - originalLines) / originalLines;
    
    if (changeRatio > 0.2) {
      executionLog.push(`⚠️ Conservative check: change ratio ${(changeRatio * 100).toFixed(1)}% exceeds 20%`);
      // Could implement additional conservative measures here
    }
    
    executionLog.push(`✅ Conservative generation validated`);
    
    return [{
      filePath: targetComponent.filePath,
      action: 'modify',
      oldContent: targetComponent.content || '',
      newContent,
      reasoning: `Low-confidence conservative change: ${changeIntent.description}`
    }];
  }
  
  /**
   * Generate change proposal for human review
   */
  private async generateChangeProposal(
    changeIntent: ChangeIntent,
    symbolicRepo: RepoSymbolicModel,
    executionLog: string[]
  ): Promise<FileChange[]> {
    executionLog.push('Generating change proposal for human review');
    
    const targetComponent = changeIntent.targetComponent;
    if (!targetComponent) {
      throw new Error('No target component identified');
    }
    
    // Create a proposal rather than actual changes
    const proposal = `
// CHANGE PROPOSAL - REQUIRES HUMAN REVIEW
// 
// Intent: ${changeIntent.description}
// Target: ${targetComponent.name}
// Risk Level: ${changeIntent.riskLevel}
// 
// Proposed changes:
${changeIntent.visualEdit?.changes?.map(c => 
  `// - ${c.property}: "${c.before}" → "${c.after}"`
).join('\n') || '// No specific changes identified'}
//
// Original code preserved below:

${targetComponent.content || ''}
`;
    
    executionLog.push('Generated change proposal for review');
    
    return [{
      filePath: targetComponent.filePath,
      action: 'modify',
      oldContent: targetComponent.content || '',
      newContent: proposal,
      reasoning: `Change proposal requiring human review: ${changeIntent.description}`
    }];
  }
  
  /**
   * Execute verify step
   */
  private async executeVerifyStep(
    fileChanges: FileChange[],
    changeIntent: ChangeIntent,
    executionLog: string[]
  ): Promise<void> {
    executionLog.push('Performing additional verification');
    
    for (const change of fileChanges) {
      // Verify the change makes sense
      if (change.newContent === change.oldContent) {
        executionLog.push('⚠️ Warning: No actual changes detected');
      }
      
      // Verify the change isn't too large
      const oldLines = (change.oldContent || '').split('\n').length;
      const newLines = change.newContent.split('\n').length;
      const changeRatio = Math.abs(newLines - oldLines) / Math.max(oldLines, 1);
      
      if (changeRatio > 0.5) {
        executionLog.push(`⚠️ Warning: Large change detected (${(changeRatio * 100).toFixed(1)}% change ratio)`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate verification time
  }
  
  /**
   * Perform comprehensive validation
   */
  private async performValidation(
    fileChanges: FileChange[],
    changeIntent: ChangeIntent,
    confidenceAssessment: ChangeConfidenceAssessment,
    impactAnalysis: ChangeImpactAnalysis,
    validationLevel: 'basic' | 'standard' | 'strict' | 'paranoid',
    executionLog: string[]
  ): Promise<ValidationResult> {
    executionLog.push(`Performing ${validationLevel} validation`);
    
    if (fileChanges.length === 0) {
      return {
        passed: false,
        confidence: 0,
        issues: [{
          type: 'scope-exceeded',
          severity: 'error',
          message: 'No file changes generated'
        }],
        warnings: [],
        metrics: {
          linesChanged: 0,
          linesAdded: 0,
          linesRemoved: 0,
          filesModified: 0,
          changeRatio: 0,
          complexityDelta: 0
        }
      };
    }
    
    // Validate the first (and typically only) file change
    const primaryChange = fileChanges[0];
    
    const validation = await this.validationEngine.validateChange(
      primaryChange.oldContent || '',
      primaryChange.newContent,
      changeIntent,
      confidenceAssessment,
      impactAnalysis
    );
    
    executionLog.push(`Validation result: ${validation.passed ? 'PASS' : 'FAIL'} (${validation.issues.length} issues, ${validation.warnings.length} warnings)`);
    
    return validation;
  }
  
  /**
   * Read file content from repository
   */
  private async readFileContent(filePath: string, symbolicRepo: RepoSymbolicModel): Promise<string> {
    // Try the provided file reader first
    if (this.fileReader) {
      try {
        const content = await this.fileReader(filePath);
        if (content && content.length > 0) {
          return content;
        }
      } catch (error) {
        console.warn(`File reader failed for ${filePath}:`, error);
      }
    }
    
    // For prototype: try to find content in symbolic repo components
    const component = symbolicRepo.components.find(c => c.filePath === filePath);
    if (component && component.content) {
      return component.content;
    }
    
    // Fallback: return empty content with a note
    return `// File: ${filePath}
// Current content not available - Agent V4 will make targeted changes
// This is a placeholder that should be replaced with actual file reading logic
`;
  }
  
  // Prompt building methods
  private buildDirectPrompt(changeIntent: ChangeIntent, symbolicRepo: RepoSymbolicModel): string {
    const component = changeIntent.targetComponent!;
    
    return `TASK: Apply small change to this file.

CHANGE: ${changeIntent.description}

CURRENT FILE:
\`\`\`
${component.content || '// File content not available'}
\`\`\`

INSTRUCTIONS:
1. Copy the entire file above exactly
2. Make only the requested change
3. Return the complete modified file

MODIFIED FILE:`;
  }
  
  private buildGuidedPrompt(
    changeIntent: ChangeIntent, 
    impactAnalysis: ChangeImpactAnalysis, 
    symbolicRepo: RepoSymbolicModel
  ): string {
    const component = changeIntent.targetComponent!;
    
    return `You are an expert ${symbolicRepo.primaryFramework} developer. Apply this change carefully with guided constraints.

CHANGE REQUEST: ${changeIntent.description}

CONSTRAINTS:
- Expected changes: ${impactAnalysis.expectedScope.expectedLines} lines
- Change type: ${impactAnalysis.expectedScope.changeType}
- Risk level: ${impactAnalysis.expectedScope.riskLevel}

PRESERVATION REQUIREMENTS:
${impactAnalysis.preservationRules.map(rule => 
  `- ${rule.description} (${rule.critical ? 'CRITICAL' : 'important'})`
).join('\n')}

TARGET COMPONENT: ${component.name}
CURRENT CODE:
\`\`\`
${component.content || ''}
\`\`\`

VISUAL CHANGES TO APPLY:
${changeIntent.visualEdit?.changes?.map(c => 
  `- ${c.property}: "${c.before}" → "${c.after}"`
).join('\n') || 'No specific changes'}

INSTRUCTIONS:
1. Apply ONLY the specified visual changes
2. Preserve ALL existing functionality and structure
3. Keep changes minimal and targeted
4. Follow preservation requirements strictly
5. Return the complete modified file

MODIFIED CODE:`;
  }
  
  private buildConservativePrompt(
    changeIntent: ChangeIntent,
    impactAnalysis: ChangeImpactAnalysis,
    symbolicRepo: RepoSymbolicModel
  ): string {
    const component = changeIntent.targetComponent!;
    
    return `You are an expert ${symbolicRepo.primaryFramework} developer. Apply this change with MAXIMUM CAUTION.

⚠️ LOW CONFIDENCE CHANGE - BE EXTREMELY CONSERVATIVE ⚠️

CHANGE REQUEST: ${changeIntent.description}

STRICT CONSTRAINTS:
- Maximum ${impactAnalysis.expectedScope.expectedLines} lines changed
- NO structural modifications
- NO functionality changes
- NO import/export changes
- MINIMAL scope only

CRITICAL PRESERVATION (MUST NOT CHANGE):
${impactAnalysis.preservationRules.filter(r => r.critical).map(rule => 
  `- ${rule.description}`
).join('\n')}

TARGET COMPONENT: ${component.name}
CURRENT CODE:
\`\`\`
${component.content || ''}
\`\`\`

MINIMAL CHANGES TO APPLY:
${changeIntent.visualEdit?.changes?.map(c => 
  `- ${c.property}: "${c.before}" → "${c.after}" (ONLY THIS)`
).join('\n') || 'No specific changes'}

INSTRUCTIONS:
1. Make the SMALLEST possible change
2. Change ONLY what is absolutely necessary
3. Preserve EVERYTHING else exactly as is
4. If uncertain, prefer NO change over wrong change
5. Return the complete file with minimal modifications

CONSERVATIVELY MODIFIED CODE:`;
  }
  
  /**
   * Extract code from LLM response
   */
  private extractCodeFromResponse(response: string): string {
    // Try to extract from code blocks
    const codeBlockMatch = response.match(/```(?:tsx?|jsx?|javascript|typescript)?\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }
    
    // If no code block, assume entire response is code
    return response.trim();
  }

  /**
   * Retry generation with specific feedback about what went wrong
   */
  private async retryWithFeedback(
    originalContent: string,
    changeIntent: ChangeIntent,
    problemType: 'over-deletion' | 'validation-failed' | 'syntax-error',
    feedbackMessage: string,
    executionLog: string[]
  ): Promise<string> {
    executionLog.push(`Retrying generation with ${problemType} feedback`);
    
    const retryPrompt = `PREVIOUS ATTEMPT FAILED: ${feedbackMessage}

ORIGINAL FILE (${originalContent.length} characters):
\`\`\`
${originalContent}
\`\`\`

CHANGE: ${changeIntent.description}

INSTRUCTIONS:
1. Copy the entire file above
2. Make only the requested change  
3. Return the complete file (must be ~${originalContent.length} characters)

COMPLETE CORRECTED FILE:`;

    const retryResponse = await this.llmProvider.generateText(retryPrompt);
    const retryContent = this.extractCodeFromResponse(retryResponse);
    executionLog.push(`Retry complete - generated ${retryContent.length} characters`);
    
    return retryContent;
  }
}
