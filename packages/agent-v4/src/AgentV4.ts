import type {
  VisualEdit,
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
import { AdaptiveChangeEngine } from './strategies/AdaptiveChangeEngine.js';
import { ContextualPromptBuilder } from './prompts/ContextualPromptBuilder.js';
import { demoLogger } from './utils/DemoLogger.js';

/**
 * Agent V4 - Intelligent coding agent with confidence-based decision making
 */
export class AgentV4 {
  private reasoningEngine: ReasoningEngine;
  private changeEngine: AdaptiveChangeEngine;
  private promptBuilder: ContextualPromptBuilder;
  private config: AgentV4Config;
  
  constructor(config: AgentV4Config) {
    this.config = config;
    this.reasoningEngine = new ReasoningEngine();
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
