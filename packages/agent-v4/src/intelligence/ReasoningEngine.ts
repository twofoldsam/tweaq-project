import type {
  VisualEdit,
  RepoSymbolicModel,
  ChangeIntent,
  ChangeImpactAnalysis,
  ChangeConfidenceAssessment,
  ReasoningContext,
  ComponentStructure
} from '../types/index.js';

import { VisualChangeAnalyzer } from './VisualChangeAnalyzer.js';
import { CodeIntelligenceEngine } from './CodeIntelligenceEngine.js';
import { ChangeConfidenceEngine } from './ChangeConfidenceEngine.js';

/**
 * Core reasoning engine that orchestrates multi-modal analysis
 */
export class ReasoningEngine {
  private visualAnalyzer: VisualChangeAnalyzer;
  private codeIntelligence: CodeIntelligenceEngine;
  private confidenceEngine: ChangeConfidenceEngine;
  
  constructor() {
    this.visualAnalyzer = new VisualChangeAnalyzer();
    this.codeIntelligence = new CodeIntelligenceEngine();
    this.confidenceEngine = new ChangeConfidenceEngine();
  }
  
  /**
   * Perform comprehensive analysis of a visual change request
   */
  async analyzeChange(
    visualEdit: VisualEdit,
    symbolicRepo: RepoSymbolicModel,
    context?: Partial<ReasoningContext>
  ): Promise<{
    changeIntent: ChangeIntent;
    impactAnalysis: ChangeImpactAnalysis;
    confidenceAssessment: ChangeConfidenceAssessment;
    reasoningContext: ReasoningContext;
  }> {
    console.log('🧠 Starting comprehensive change analysis...');
    
    try {
      // Phase 1: Analyze visual change intent
      console.log('📊 Phase 1: Analyzing visual change intent...');
      const changeIntent = this.visualAnalyzer.analyzeChangeIntent(visualEdit, symbolicRepo);
      
      if (!changeIntent.targetComponent) {
        throw new Error('Could not identify target component for visual change');
      }
      
      // Phase 2: Analyze code impact
      console.log('🔍 Phase 2: Analyzing code impact...');
      const impactAnalysis = this.codeIntelligence.analyzeChangeImpact(
        changeIntent,
        changeIntent.targetComponent,
        symbolicRepo
      );
      
      // Phase 3: Assess confidence
      console.log('🎯 Phase 3: Assessing change confidence...');
      const confidenceAssessment = this.confidenceEngine.assessChangeConfidence(
        visualEdit,
        changeIntent,
        impactAnalysis,
        symbolicRepo
      );
      
      // Phase 4: Build reasoning context
      console.log('📋 Phase 4: Building reasoning context...');
      const reasoningContext = this.buildReasoningContext(
        visualEdit,
        changeIntent.targetComponent,
        symbolicRepo,
        context
      );
      
      console.log('✅ Comprehensive analysis complete');
      console.log(`📊 Summary: ${changeIntent.type} change, ${confidenceAssessment.confidence.toFixed(2)} confidence, ${confidenceAssessment.recommendedApproach} approach`);
      
      return {
        changeIntent,
        impactAnalysis,
        confidenceAssessment,
        reasoningContext
      };
      
    } catch (error) {
      console.error('❌ Change analysis failed:', error);
      throw new Error(`Change analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Validate that a proposed change aligns with the analysis
   */
  validateChangeAlignment(
    proposedCode: string,
    originalCode: string,
    changeIntent: ChangeIntent,
    impactAnalysis: ChangeImpactAnalysis,
    confidenceAssessment: ChangeConfidenceAssessment
  ): {
    aligned: boolean;
    confidence: number;
    issues: string[];
    recommendations: string[];
  } {
    console.log('🔍 Validating change alignment...');
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    let alignmentConfidence = 1.0;
    
    // Check if the change scope is reasonable
    const scopeValidation = this.validateChangeScope(
      originalCode,
      proposedCode,
      impactAnalysis.expectedScope
    );
    
    if (!scopeValidation.valid) {
      issues.push(...scopeValidation.issues);
      alignmentConfidence *= 0.5;
    }
    
    // Check if preservation rules are followed
    const preservationValidation = this.validatePreservationRules(
      originalCode,
      proposedCode,
      impactAnalysis.preservationRules
    );
    
    if (!preservationValidation.valid) {
      issues.push(...preservationValidation.issues);
      alignmentConfidence *= 0.3;
    }
    
    // Check if the change matches the visual intent
    const intentValidation = this.validateVisualIntent(
      proposedCode,
      changeIntent.visualEdit || {} as VisualEdit
    );
    
    if (!intentValidation.valid) {
      issues.push(...intentValidation.issues);
      alignmentConfidence *= 0.6;
    }
    
    // Generate recommendations based on confidence level
    if (confidenceAssessment.confidence < 0.6) {
      recommendations.push('Consider using a more conservative approach due to low confidence');
    }
    
    if (issues.length > 0) {
      recommendations.push('Review and address the identified issues before proceeding');
    }
    
    const aligned = issues.length === 0 && alignmentConfidence > 0.7;
    
    console.log(`🎯 Alignment validation: ${aligned ? 'PASS' : 'FAIL'} (confidence: ${alignmentConfidence.toFixed(2)})`);
    
    return {
      aligned,
      confidence: alignmentConfidence,
      issues,
      recommendations
    };
  }
  
  /**
   * Build comprehensive reasoning context
   */
  private buildReasoningContext(
    visualEdit: VisualEdit,
    targetComponent: ComponentStructure,
    symbolicRepo: RepoSymbolicModel,
    additionalContext?: Partial<ReasoningContext>
  ): ReasoningContext {
    return {
      visualEdit,
      targetComponent,
      symbolicRepo,
      changeHistory: additionalContext?.changeHistory || [],
      userPreferences: additionalContext?.userPreferences || {
        riskTolerance: 'moderate',
        changeStyle: 'minimal',
        reviewPreference: 'low-confidence-only'
      }
    };
  }
  
  /**
   * Validate that the change scope is reasonable
   */
  private validateChangeScope(
    originalCode: string,
    proposedCode: string,
    expectedScope: any
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    const originalLines = originalCode.split('\n').length;
    const proposedLines = proposedCode.split('\n').length;
    const actualLinesChanged = Math.abs(proposedLines - originalLines);
    
    // Check if the actual change is much larger than expected
    if (actualLinesChanged > expectedScope.expectedLines * 3) {
      issues.push(`Change scope exceeded: expected ~${expectedScope.expectedLines} lines, got ${actualLinesChanged} lines`);
    }
    
    // Check for massive deletions (the original problem)
    const deletedLines = Math.max(0, originalLines - proposedLines);
    if (deletedLines > originalLines * 0.5) {
      issues.push(`Excessive code deletion detected: ${deletedLines} lines deleted (${((deletedLines / originalLines) * 100).toFixed(1)}% of original)`);
    }
    
    // For minimal changes, be extra strict
    if (expectedScope.changeType === 'minimal' && actualLinesChanged > 5) {
      issues.push(`Minimal change exceeded reasonable scope: ${actualLinesChanged} lines changed`);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Validate that preservation rules are followed
   */
  private validatePreservationRules(
    originalCode: string,
    proposedCode: string,
    preservationRules: any[]
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    for (const rule of preservationRules) {
      if (rule.critical) {
        const preserved = this.checkPreservationRule(originalCode, proposedCode, rule);
        if (!preserved) {
          issues.push(`Critical preservation rule violated: ${rule.description}`);
        }
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Check if a specific preservation rule is followed
   */
  private checkPreservationRule(
    originalCode: string,
    proposedCode: string,
    rule: any
  ): boolean {
    const pattern = rule.pattern;
    
    if (pattern instanceof RegExp) {
      const originalMatches = originalCode.match(pattern);
      const proposedMatches = proposedCode.match(pattern);
      
      // For critical rules, all matches should be preserved
      if (rule.critical) {
        return originalMatches?.length === proposedMatches?.length;
      }
      
      // For non-critical rules, at least some matches should be preserved
      return (proposedMatches?.length || 0) > 0;
    }
    
    // String pattern matching
    if (typeof pattern === 'string') {
      return proposedCode.includes(pattern);
    }
    
    return true;
  }
  
  /**
   * Validate that the change matches the visual intent
   */
  private validateVisualIntent(
    proposedCode: string,
    visualEdit: VisualEdit
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check if the visual changes are reflected in the code
    for (const change of visualEdit.changes || []) {
      const intentReflected = this.checkIntentReflection(proposedCode, change);
      if (!intentReflected) {
        issues.push(`Visual intent not reflected: ${change.property} change from "${change.before}" to "${change.after}"`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Check if a visual change is reflected in the proposed code
   */
  private checkIntentReflection(proposedCode: string, change: any): boolean {
    // This is a simplified check - in production, this would be more sophisticated
    const { property, after } = change;
    
    // Check for direct property mentions
    if (proposedCode.includes(property) && proposedCode.includes(after)) {
      return true;
    }
    
    // Check for common CSS-in-JS patterns
    const camelCaseProperty = property.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
    if (proposedCode.includes(camelCaseProperty) && proposedCode.includes(after)) {
      return true;
    }
    
    // Check for Tailwind classes (simplified)
    if (property === 'font-size' && proposedCode.includes('text-')) {
      return true;
    }
    
    if (property === 'color' && proposedCode.includes('text-')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get analysis summary for logging/debugging
   */
  getAnalysisSummary(
    changeIntent: ChangeIntent,
    impactAnalysis: ChangeImpactAnalysis,
    confidenceAssessment: ChangeConfidenceAssessment
  ): string {
    return `
🧠 REASONING ENGINE ANALYSIS SUMMARY
=====================================

📊 Change Intent:
   Type: ${changeIntent.type}
   Description: ${changeIntent.description}
   Target: ${changeIntent.targetComponent?.name}
   Risk Level: ${changeIntent.riskLevel}
   Priority: ${changeIntent.priority}

🔍 Impact Analysis:
   Direct Changes: ${impactAnalysis.directChanges.length}
   Cascade Changes: ${impactAnalysis.cascadeChanges.length}
   Expected Scope: ${impactAnalysis.expectedScope.changeType}
   Expected Lines: ${impactAnalysis.expectedScope.expectedLines}

🎯 Confidence Assessment:
   Overall: ${(confidenceAssessment.confidence * 100).toFixed(1)}%
   Visual Clarity: ${(confidenceAssessment.factors.visualClarity * 100).toFixed(0)}%
   Component Understanding: ${(confidenceAssessment.factors.componentUnderstanding * 100).toFixed(0)}%
   Change Complexity: ${(confidenceAssessment.factors.changeComplexity * 100).toFixed(0)}%
   Context Completeness: ${(confidenceAssessment.factors.contextCompleteness * 100).toFixed(0)}%
   
   Recommended Approach: ${confidenceAssessment.recommendedApproach}
   Risk Level: ${confidenceAssessment.riskLevel}
   
=====================================
    `.trim();
  }
}
