import type {
  VisualEdit,
  NaturalLanguageEdit,
  CombinedEditRequest,
  RepoSymbolicModel,
  AgentV4Config,
  FileChange,
  ChangeIntent,
  ChangeImpactAnalysis,
  ChangeConfidenceAssessment,
  ValidationResult,
  ChangeStrategy
} from './types/index.js';

import { ReasoningEngine } from './intelligence/ReasoningEngine.js';
import { NaturalLanguageAnalyzer } from './intelligence/NaturalLanguageAnalyzer.js';
import { AdaptiveChangeEngine } from './strategies/AdaptiveChangeEngine.js';
import { ContextualPromptBuilder } from './prompts/ContextualPromptBuilder.js';
import { demoLogger } from './utils/DemoLogger.js';

/**
 * Agent V4 - Intelligent coding agent with confidence-based decision making
 * Supports both visual edits and natural language instructions
 */
export class AgentV4 {
  private reasoningEngine: ReasoningEngine;
  private naturalLanguageAnalyzer: NaturalLanguageAnalyzer;
  private changeEngine: AdaptiveChangeEngine;
  private promptBuilder: ContextualPromptBuilder;
  private config: AgentV4Config;
  
  constructor(config: AgentV4Config) {
    this.config = config;
    this.reasoningEngine = new ReasoningEngine();
    this.naturalLanguageAnalyzer = new NaturalLanguageAnalyzer();
    this.changeEngine = new AdaptiveChangeEngine(config.llmProvider);
    this.promptBuilder = new ContextualPromptBuilder();
  }
  
  /**
   * Main entry point - process visual edits intelligently
   */
  async processVisualEdits(
    visualEdits: VisualEdit[],
    symbolicRepo: RepoSymbolicModel
  ): Promise<{
    success: boolean;
    fileChanges: FileChange[];
    analysis: {
      changeIntent: ChangeIntent;
      impactAnalysis: ChangeImpactAnalysis;
      confidenceAssessment: ChangeConfidenceAssessment;
    };
    execution: {
      strategy: ChangeStrategy;
      validation: ValidationResult;
      executionLog: string[];
    };
    summary: string;
    error?: string;
  }> {
    demoLogger.showWorkflowOverview();
    
    try {
      // Phase 1: Comprehensive Analysis
      demoLogger.startPhase('1', 'Analyzing Visual Changes & Understanding Intent');
      const analysisResult = await this.performComprehensiveAnalysis(visualEdits[0], symbolicRepo);
      demoLogger.completePhase('SUCCESS');
      
      // Phase 2: Intelligent Execution  
      demoLogger.startPhase('2', 'Executing Changes with Intelligent Validation');
      const executionResult = await this.performIntelligentExecution(
        analysisResult.changeIntent,
        analysisResult.confidenceAssessment,
        analysisResult.impactAnalysis,
        symbolicRepo
      );
      demoLogger.completePhase('SUCCESS');
      
      // Phase 3: Generate Summary
      demoLogger.startPhase('3', 'Generating Summary & Creating Pull Request');
      const summary = this.generateExecutionSummary(
        analysisResult,
        executionResult
      );
      demoLogger.completePhase('SUCCESS');
      
      const success = executionResult.validation.passed;
      
      // Final summary
      demoLogger.summary('Processing Results', [
        { label: 'Status', value: success ? 'SUCCESS' : 'COMPLETED WITH ISSUES' },
        { label: 'Files Changed', value: executionResult.fileChanges.length },
        { label: 'Confidence Level', value: `${Math.round(analysisResult.confidenceAssessment.confidence * 100)}%` },
        { label: 'Strategy Used', value: analysisResult.confidenceAssessment.recommendedApproach },
        { label: 'Validation Issues', value: executionResult.validation.issues.length }
      ]);
      
      return {
        success,
        fileChanges: executionResult.fileChanges,
        analysis: analysisResult,
        execution: executionResult,
        summary
      };
      
    } catch (error) {
      demoLogger.error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        fileChanges: [],
        analysis: {} as any,
        execution: {} as any,
        summary: 'Processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * NEW: Process combined edit request - visual edits + natural language instructions
   * This is the main entry point for the new chat + visual editing workflow
   */
  async processCombinedEdits(
    request: CombinedEditRequest,
    symbolicRepo: RepoSymbolicModel
  ): Promise<{
    success: boolean;
    fileChanges: FileChange[];
    analyses: Array<{
      changeIntent: ChangeIntent;
      impactAnalysis: ChangeImpactAnalysis;
      confidenceAssessment: ChangeConfidenceAssessment;
    }>;
    execution: {
      strategy: ChangeStrategy;
      validation: ValidationResult;
      executionLog: string[];
    };
    summary: string;
    error?: string;
  }> {
    console.log('🚀 Processing combined edit request...');
    console.log(`📊 Visual edits: ${request.visualEdits.length}, Natural language: ${request.naturalLanguageEdits.length}`);
    
    demoLogger.showWorkflowOverview();
    
    try {
      // Phase 1: Analyze ALL edits (both visual and natural language)
      demoLogger.startPhase('1', 'Analyzing All Changes (Visual + Natural Language)');
      const analyses = await this.analyzeAllEdits(request, symbolicRepo);
      demoLogger.completePhase('SUCCESS');
      
      // Phase 2: Create unified execution plan
      demoLogger.startPhase('2', 'Creating Unified Execution Plan');
      const unifiedPlan = this.createUnifiedPlan(analyses);
      demoLogger.completePhase('SUCCESS');
      
      // Phase 3: Execute all changes
      demoLogger.startPhase('3', 'Executing All Changes with Validation');
      const executionResult = await this.executeUnifiedPlan(unifiedPlan, symbolicRepo);
      demoLogger.completePhase('SUCCESS');
      
      // Phase 4: Generate summary
      demoLogger.startPhase('4', 'Generating Summary & Creating Pull Request');
      const summary = this.generateCombinedExecutionSummary(analyses, executionResult, request);
      demoLogger.completePhase('SUCCESS');
      
      const success = executionResult.validation.passed;
      
      // Final summary
      demoLogger.summary('Combined Processing Results', [
        { label: 'Status', value: success ? 'SUCCESS' : 'COMPLETED WITH ISSUES' },
        { label: 'Visual Edits', value: request.visualEdits.length },
        { label: 'Natural Language', value: request.naturalLanguageEdits.length },
        { label: 'Files Changed', value: executionResult.fileChanges.length },
        { label: 'Validation Issues', value: executionResult.validation.issues.length }
      ]);
      
      return {
        success,
        fileChanges: executionResult.fileChanges,
        analyses,
        execution: executionResult,
        summary
      };
      
    } catch (error) {
      demoLogger.error(`Combined processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        fileChanges: [],
        analyses: [],
        execution: {} as any,
        summary: 'Combined processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Perform comprehensive analysis of the visual change
   */
  private async performComprehensiveAnalysis(
    visualEdit: VisualEdit,
    symbolicRepo: RepoSymbolicModel
  ): Promise<{
    changeIntent: ChangeIntent;
    impactAnalysis: ChangeImpactAnalysis;
    confidenceAssessment: ChangeConfidenceAssessment;
  }> {
    demoLogger.step('Understanding visual change requirements...');
    
    const analysisResult = await this.reasoningEngine.analyzeChange(
      visualEdit,
      symbolicRepo
    );
    
    demoLogger.step('Analysis complete');
    demoLogger.metric('Change Type', analysisResult.changeIntent.type);
    demoLogger.metric('Target Component', analysisResult.changeIntent.targetComponent?.name || 'Unknown');
    demoLogger.metric('Confidence Level', `${Math.round(analysisResult.confidenceAssessment.confidence * 100)}%`);
    demoLogger.decision(`Selected strategy: ${analysisResult.confidenceAssessment.recommendedApproach}`, analysisResult.confidenceAssessment.confidence);
    
    return {
      changeIntent: analysisResult.changeIntent,
      impactAnalysis: analysisResult.impactAnalysis,
      confidenceAssessment: analysisResult.confidenceAssessment
    };
  }
  
  /**
   * Perform intelligent execution based on analysis
   */
  private async performIntelligentExecution(
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
    demoLogger.step(`Applying ${confidenceAssessment.recommendedApproach} strategy...`);
    demoLogger.step('Generating code changes with AI assistance...');
    
    // Execute the change with adaptive strategy
    const executionResult = await this.changeEngine.executeChange(
      changeIntent,
      confidenceAssessment,
      impactAnalysis,
      symbolicRepo
    );
    
    demoLogger.step('Validating generated code...');
    if (executionResult.validation.passed) {
      demoLogger.success(`Code changes validated successfully`);
    } else {
      demoLogger.warning(`Validation found ${executionResult.validation.issues.length} issues`);
    }
    demoLogger.metric('Files Modified', executionResult.fileChanges.length);
    
    return executionResult;
  }
  
  /**
   * Generate execution summary
   */
  private generateExecutionSummary(
    analysis: {
      changeIntent: ChangeIntent;
      impactAnalysis: ChangeImpactAnalysis;
      confidenceAssessment: ChangeConfidenceAssessment;
    },
    execution: {
      fileChanges: FileChange[];
      strategy: ChangeStrategy;
      validation: ValidationResult;
      executionLog: string[];
    }
  ): string {
    const { changeIntent, confidenceAssessment, impactAnalysis } = analysis;
    const { fileChanges, strategy, validation } = execution;
    
    return `
🤖 AGENT V4 EXECUTION SUMMARY
============================

📋 CHANGE REQUEST
  Intent: ${changeIntent.description}
  Type: ${changeIntent.type}
  Target: ${changeIntent.targetComponent?.name}
  Priority: ${changeIntent.priority}

🧠 INTELLIGENCE ANALYSIS
  Confidence: ${(confidenceAssessment.confidence * 100).toFixed(1)}%
  Approach: ${confidenceAssessment.recommendedApproach}
  Risk Level: ${confidenceAssessment.riskLevel}
  
  Confidence Factors:
  • Visual Clarity: ${(confidenceAssessment.factors.visualClarity * 100).toFixed(0)}%
  • Component Understanding: ${(confidenceAssessment.factors.componentUnderstanding * 100).toFixed(0)}%
  • Change Complexity: ${(confidenceAssessment.factors.changeComplexity * 100).toFixed(0)}%
  • Context Completeness: ${(confidenceAssessment.factors.contextCompleteness * 100).toFixed(0)}%

📊 IMPACT ANALYSIS
  Expected Scope: ${impactAnalysis.expectedScope.changeType}
  Expected Lines: ${impactAnalysis.expectedScope.expectedLines}
  Direct Changes: ${impactAnalysis.directChanges.length}
  Cascade Changes: ${impactAnalysis.cascadeChanges.length}

⚡ EXECUTION RESULTS
  Strategy: ${strategy.approach}
  Files Modified: ${fileChanges.length}
  Validation: ${validation.passed ? '✅ PASSED' : '❌ FAILED'}
  
  Actual Changes:
  • Lines Changed: ${validation.metrics.linesChanged}
  • Lines Added: ${validation.metrics.linesAdded}
  • Lines Removed: ${validation.metrics.linesRemoved}
  • Change Ratio: ${(validation.metrics.changeRatio * 100).toFixed(1)}%

🔍 VALIDATION RESULTS
  Issues: ${validation.issues.length} (${validation.issues.filter(i => i.severity === 'error').length} errors)
  Warnings: ${validation.warnings.length}
  Confidence: ${(validation.confidence * 100).toFixed(1)}%

${validation.issues.length > 0 ? `
❌ ISSUES FOUND:
${validation.issues.map(issue => `  • ${issue.type}: ${issue.message}`).join('\n')}
` : ''}

${validation.warnings.length > 0 ? `
⚠️ WARNINGS:
${validation.warnings.map(warning => `  • ${warning.type}: ${warning.message}`).join('\n')}
` : ''}

🎯 OUTCOME
${validation.passed 
  ? `✅ Change executed successfully with ${confidenceAssessment.recommendedApproach} approach`
  : `❌ Change validation failed - ${validation.issues.filter(i => i.severity === 'error').length} critical issues found`
}

============================
    `.trim();
  }
  
  /**
   * Dry run - analyze what would be changed without making actual changes
   */
  async dryRun(
    visualEdits: VisualEdit[],
    symbolicRepo: RepoSymbolicModel
  ): Promise<{
    analysis: {
      changeIntent: ChangeIntent;
      impactAnalysis: ChangeImpactAnalysis;
      confidenceAssessment: ChangeConfidenceAssessment;
    };
    preview: {
      approach: string;
      expectedChanges: string[];
      risks: string[];
      recommendations: string[];
    };
  }> {
    console.log('🔍 Performing dry run analysis...');
    
    const analysisResult = await this.performComprehensiveAnalysis(visualEdits[0], symbolicRepo);
    
    const preview = {
      approach: analysisResult.confidenceAssessment.recommendedApproach,
      expectedChanges: this.generateExpectedChanges(analysisResult.impactAnalysis),
      risks: this.generateRiskAssessment(analysisResult.confidenceAssessment),
      recommendations: this.generateRecommendations(analysisResult.confidenceAssessment, analysisResult.impactAnalysis)
    };
    
    return {
      analysis: analysisResult,
      preview
    };
  }
  
  /**
   * Get agent capabilities and status
   */
  getCapabilities(): {
    intelligence: string[];
    strategies: string[];
    validation: string[];
    features: string[];
  } {
    return {
      intelligence: [
        'Visual change analysis',
        'Code impact analysis',
        'Confidence assessment',
        'Multi-modal reasoning'
      ],
      strategies: [
        'High-confidence direct execution',
        'Medium-confidence guided execution',
        'Low-confidence conservative execution',
        'Human review proposal generation'
      ],
      validation: [
        'Syntax validation',
        'Intent alignment validation',
        'Preservation validation',
        'Scope validation',
        'Confidence-based validation'
      ],
      features: [
        'Adaptive strategy selection',
        'Contextual prompt building',
        'Smart validation engine',
        'Comprehensive analysis',
        'Execution logging'
      ]
    };
  }
  
  // Helper methods
  
  private generateExpectedChanges(impactAnalysis: ChangeImpactAnalysis): string[] {
    const changes: string[] = [];
    
    changes.push(`${impactAnalysis.expectedScope.changeType} change affecting ~${impactAnalysis.expectedScope.expectedLines} lines`);
    
    impactAnalysis.directChanges.forEach(change => {
      changes.push(`${change.type} modification: ${change.target}`);
    });
    
    const requiredCascadeChanges = impactAnalysis.cascadeChanges.filter(c => c.required);
    if (requiredCascadeChanges.length > 0) {
      changes.push(`${requiredCascadeChanges.length} related changes required`);
    }
    
    return changes;
  }
  
  private generateRiskAssessment(confidenceAssessment: ChangeConfidenceAssessment): string[] {
    const risks: string[] = [];
    
    if (confidenceAssessment.riskLevel === 'high' || confidenceAssessment.riskLevel === 'critical') {
      risks.push(`${confidenceAssessment.riskLevel} risk change`);
    }
    
    if (confidenceAssessment.confidence < 0.6) {
      risks.push('Low confidence in change execution');
    }
    
    if (confidenceAssessment.factors.visualClarity < 0.5) {
      risks.push('Unclear visual intent');
    }
    
    if (confidenceAssessment.factors.componentUnderstanding < 0.5) {
      risks.push('Limited component understanding');
    }
    
    if (risks.length === 0) {
      risks.push('Low risk change');
    }
    
    return risks;
  }
  
  private generateRecommendations(
    confidenceAssessment: ChangeConfidenceAssessment,
    impactAnalysis: ChangeImpactAnalysis
  ): string[] {
    const recommendations: string[] = [];
    
    if (confidenceAssessment.confidence < 0.5) {
      recommendations.push('Consider providing more specific visual guidance');
    }
    
    if (impactAnalysis.expectedScope.riskLevel === 'high') {
      recommendations.push('Consider breaking this into smaller changes');
    }
    
    if (confidenceAssessment.factors.contextCompleteness < 0.7) {
      recommendations.push('Repository analysis could be improved for better results');
    }
    
    if (confidenceAssessment.recommendedApproach === 'very-low-confidence-human-review') {
      recommendations.push('Human review is recommended before applying changes');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Change is ready for execution');
    }
    
    return recommendations;
  }

  // ============================================================================
  // COMBINED EDITS PROCESSING (Visual + Natural Language)
  // ============================================================================

  /**
   * Analyze all edits (both visual and natural language)
   */
  private async analyzeAllEdits(
    request: CombinedEditRequest,
    symbolicRepo: RepoSymbolicModel
  ): Promise<Array<{
    changeIntent: ChangeIntent;
    impactAnalysis: ChangeImpactAnalysis;
    confidenceAssessment: ChangeConfidenceAssessment;
  }>> {
    const analyses: Array<{
      changeIntent: ChangeIntent;
      impactAnalysis: ChangeImpactAnalysis;
      confidenceAssessment: ChangeConfidenceAssessment;
    }> = [];

    // Analyze visual edits
    for (const visualEdit of request.visualEdits) {
      demoLogger.step(`Analyzing visual edit: ${visualEdit.element.selector}`);
      const analysis = await this.performComprehensiveAnalysis(visualEdit, symbolicRepo);
      analyses.push(analysis);
    }

    // Analyze natural language edits
    for (const nlEdit of request.naturalLanguageEdits) {
      demoLogger.step(`Analyzing instruction: "${nlEdit.instruction}"`);
      
      // Use natural language analyzer to create change intent
      const changeIntent = this.naturalLanguageAnalyzer.analyzeNaturalLanguageInstruction(
        nlEdit,
        symbolicRepo
      );

      // Use reasoning engine for impact analysis (if we have a target component)
      if (changeIntent.targetComponent) {
        const impactAnalysis = this.reasoningEngine['codeIntelligence'].analyzeChangeImpact(
          changeIntent,
          changeIntent.targetComponent,
          symbolicRepo
        );

        const confidenceAssessment = this.reasoningEngine['confidenceEngine'].assessChangeConfidence(
          { id: nlEdit.id, element: nlEdit.targetElement || {} as any, changes: [] },
          changeIntent,
          impactAnalysis,
          symbolicRepo
        );

        analyses.push({
          changeIntent,
          impactAnalysis,
          confidenceAssessment
        });

        console.log(this.naturalLanguageAnalyzer.getSummary(changeIntent));
      } else {
        // Create a basic analysis for instructions without clear target
        console.log('⚠️ No target component found - will use LLM to interpret broadly');
        
        const impactAnalysis: ChangeImpactAnalysis = {
          directChanges: [],
          cascadeChanges: [],
          preservationRules: [],
          validationChecks: [],
          expectedScope: {
            expectedLines: 10,
            expectedFiles: 1,
            changeType: 'moderate',
            riskLevel: changeIntent.riskLevel
          }
        };

        const confidenceAssessment: ChangeConfidenceAssessment = {
          confidence: changeIntent.confidence,
          factors: {
            visualClarity: 0.5,
            componentUnderstanding: 0.4,
            changeComplexity: 0.6,
            contextCompleteness: 0.5
          },
          recommendedApproach: changeIntent.confidence > 0.6 ? 'medium-confidence-guided' : 'low-confidence-conservative',
          fallbackStrategies: ['low-confidence-conservative', 'very-low-confidence-human-review'],
          riskLevel: changeIntent.riskLevel
        };

        analyses.push({
          changeIntent,
          impactAnalysis,
          confidenceAssessment
        });
      }
    }

    demoLogger.metric('Total Analyses', analyses.length);
    return analyses;
  }

  /**
   * Create a unified execution plan from multiple analyses
   */
  private createUnifiedPlan(
    analyses: Array<{
      changeIntent: ChangeIntent;
      impactAnalysis: ChangeImpactAnalysis;
      confidenceAssessment: ChangeConfidenceAssessment;
    }>
  ): {
    changeIntents: ChangeIntent[];
    overallConfidence: number;
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    recommendedApproach: string;
    groupedByComponent: Map<string, ChangeIntent[]>;
  } {
    demoLogger.step('Creating unified execution plan...');

    const changeIntents = analyses.map(a => a.changeIntent);
    
    // Calculate overall confidence (weighted average)
    const overallConfidence = analyses.reduce((sum, a) => 
      sum + a.confidenceAssessment.confidence, 0
    ) / analyses.length;

    // Determine overall risk (highest risk level)
    const riskLevels = ['low', 'medium', 'high', 'critical'];
    const overallRisk = analyses.reduce((maxRisk, a) => {
      const currentRiskIndex = riskLevels.indexOf(a.confidenceAssessment.riskLevel);
      const maxRiskIndex = riskLevels.indexOf(maxRisk);
      return currentRiskIndex > maxRiskIndex ? a.confidenceAssessment.riskLevel : maxRisk;
    }, 'low' as 'low' | 'medium' | 'high' | 'critical');

    // Determine recommended approach (most conservative)
    const approaches = analyses.map(a => a.confidenceAssessment.recommendedApproach);
    const recommendedApproach = this.selectMostConservativeApproach(approaches);

    // Group changes by target component
    const groupedByComponent = new Map<string, ChangeIntent[]>();
    for (const intent of changeIntents) {
      const componentName = intent.targetComponent?.name || 'unspecified';
      const existing = groupedByComponent.get(componentName) || [];
      existing.push(intent);
      groupedByComponent.set(componentName, existing);
    }

    demoLogger.metric('Overall Confidence', `${(overallConfidence * 100).toFixed(1)}%`);
    demoLogger.metric('Overall Risk', overallRisk);
    demoLogger.metric('Components Affected', groupedByComponent.size);
    demoLogger.decision(`Unified approach: ${recommendedApproach}`, overallConfidence);

    return {
      changeIntents,
      overallConfidence,
      overallRisk,
      recommendedApproach,
      groupedByComponent
    };
  }

  /**
   * Select the most conservative approach from a list
   */
  private selectMostConservativeApproach(approaches: string[]): string {
    const conservativeOrder = [
      'very-low-confidence-human-review',
      'low-confidence-conservative',
      'medium-confidence-guided',
      'high-confidence-direct'
    ];

    for (const conservative of conservativeOrder) {
      if (approaches.includes(conservative)) {
        return conservative;
      }
    }

    return 'medium-confidence-guided';
  }

  /**
   * Execute unified plan (all changes together)
   */
  private async executeUnifiedPlan(
    plan: {
      changeIntents: ChangeIntent[];
      overallConfidence: number;
      overallRisk: 'low' | 'medium' | 'high' | 'critical';
      recommendedApproach: string;
      groupedByComponent: Map<string, ChangeIntent[]>;
    },
    symbolicRepo: RepoSymbolicModel
  ): Promise<{
    fileChanges: FileChange[];
    strategy: ChangeStrategy;
    validation: ValidationResult;
    executionLog: string[];
  }> {
    const executionLog: string[] = [];
    const allFileChanges: FileChange[] = [];

    executionLog.push(`Executing ${plan.changeIntents.length} changes with ${plan.recommendedApproach} approach`);

    // Execute changes grouped by component
    for (const [componentName, intents] of plan.groupedByComponent.entries()) {
      executionLog.push(`\nProcessing component: ${componentName} (${intents.length} changes)`);
      
      // For now, execute each intent separately
      // In future, could batch changes to the same file
      for (const intent of intents) {
        try {
          // Create a mock confidence assessment for execution
          const confidenceAssessment: ChangeConfidenceAssessment = {
            confidence: plan.overallConfidence,
            factors: {
              visualClarity: 0.7,
              componentUnderstanding: intent.targetComponent ? 0.8 : 0.5,
              changeComplexity: 0.6,
              contextCompleteness: 0.7
            },
            recommendedApproach: plan.recommendedApproach as any,
            fallbackStrategies: ['low-confidence-conservative'],
            riskLevel: plan.overallRisk
          };

          // Create a mock impact analysis
          const impactAnalysis: ChangeImpactAnalysis = {
            directChanges: [],
            cascadeChanges: [],
            preservationRules: [
              { type: 'functionality', description: 'Preserve all functionality', pattern: '', critical: true },
              { type: 'imports', description: 'Preserve imports', pattern: /^import\s/, critical: true },
              { type: 'exports', description: 'Preserve exports', pattern: /^export\s/, critical: true }
            ],
            validationChecks: [],
            expectedScope: {
              expectedLines: 10,
              expectedFiles: 1,
              changeType: 'moderate',
              riskLevel: plan.overallRisk
            }
          };

          const result = await this.performIntelligentExecution(
            intent,
            confidenceAssessment,
            impactAnalysis,
            symbolicRepo
          );

          allFileChanges.push(...result.fileChanges);
          executionLog.push(...result.executionLog);

        } catch (error) {
          executionLog.push(`❌ Error executing change: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      }
    }

    // Create unified validation
    const validation = this.createUnifiedValidation(allFileChanges, plan);

    return {
      fileChanges: allFileChanges,
      strategy: {
        approach: plan.recommendedApproach as any,
        confidence: plan.overallConfidence,
        steps: [],
        validationLevel: 'strict'
      },
      validation,
      executionLog
    };
  }

  /**
   * Create unified validation result
   */
  private createUnifiedValidation(
    fileChanges: FileChange[],
    plan: { overallConfidence: number; overallRisk: string }
  ): ValidationResult {
    // Simple validation for combined changes
    return {
      passed: fileChanges.length > 0,
      confidence: plan.overallConfidence,
      issues: [],
      warnings: [],
      metrics: {
        linesChanged: fileChanges.reduce((sum, fc) => {
          const oldLines = (fc.oldContent || '').split('\n').length;
          const newLines = fc.newContent.split('\n').length;
          return sum + Math.abs(newLines - oldLines);
        }, 0),
        linesAdded: 0,
        linesRemoved: 0,
        filesModified: fileChanges.length,
        changeRatio: 0,
        complexityDelta: 0
      }
    };
  }

  /**
   * Generate summary for combined edit execution
   */
  private generateCombinedExecutionSummary(
    analyses: Array<{
      changeIntent: ChangeIntent;
      impactAnalysis: ChangeImpactAnalysis;
      confidenceAssessment: ChangeConfidenceAssessment;
    }>,
    execution: {
      fileChanges: FileChange[];
      strategy: ChangeStrategy;
      validation: ValidationResult;
      executionLog: string[];
    },
    request: CombinedEditRequest
  ): string {
    const visualCount = request.visualEdits.length;
    const nlCount = request.naturalLanguageEdits.length;
    
    const visualChanges = request.visualEdits
      .map(v => `  • ${v.element.selector}: ${v.changes.length} property changes`)
      .join('\n');

    const nlChanges = request.naturalLanguageEdits
      .map(nl => `  • "${nl.instruction}"`)
      .join('\n');

    return `
🤖 AGENT V4 COMBINED EXECUTION SUMMARY
======================================

📋 COMBINED CHANGE REQUEST
  Visual Edits: ${visualCount}
${visualChanges}
  
  Natural Language Instructions: ${nlCount}
${nlChanges}

🧠 UNIFIED ANALYSIS
  Total Changes Analyzed: ${analyses.length}
  Overall Confidence: ${(execution.strategy.confidence * 100).toFixed(1)}%
  Approach: ${execution.strategy.approach}

⚡ EXECUTION RESULTS
  Files Modified: ${execution.fileChanges.length}
  Validation: ${execution.validation.passed ? '✅ PASSED' : '❌ FAILED'}
  Lines Changed: ${execution.validation.metrics.linesChanged}

🎯 OUTCOME
${execution.validation.passed 
  ? `✅ All changes executed successfully`
  : `❌ Validation failed - ${execution.validation.issues.length} issues found`
}

======================================
    `.trim();
  }
}

// Factory function for easy creation
export function createAgentV4(config: AgentV4Config): AgentV4 {
  return new AgentV4(config);
}

// Default configuration
export const defaultAgentV4Config: Partial<AgentV4Config> = {
  confidenceThresholds: {
    highConfidence: 0.8,
    mediumConfidence: 0.6,
    lowConfidence: 0.4
  },
  validation: {
    enableSyntaxCheck: true,
    enableIntentAlignment: true,
    enablePreservationCheck: true,
    enableScopeCheck: true,
    enableBuildCheck: false,
    strictMode: false
  },
  strategies: {
    maxRetries: 3,
    fallbackEnabled: true,
    humanReviewThreshold: 0.3
  },
  performance: {
    maxContextTokens: 8000,
    parallelValidation: true,
    cacheEnabled: true
  }
};
