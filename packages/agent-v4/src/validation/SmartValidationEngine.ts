// Simplified validation without Babel dependencies
import type {
  ChangeIntent,
  ChangeConfidenceAssessment,
  ValidationResult,
  ValidationIssue,
  ValidationWarning,
  ValidationMetrics,
  PreservationRule,
  ChangeImpactAnalysis
} from '../types/index.js';

/**
 * Smart validation engine that prevents errors without restricting capability
 */
export class SmartValidationEngine {
  
  /**
   * Validate a proposed change comprehensively
   */
  async validateChange(
    originalCode: string,
    proposedCode: string,
    changeIntent: ChangeIntent,
    confidenceAssessment: ChangeConfidenceAssessment,
    impactAnalysis?: ChangeImpactAnalysis
  ): Promise<ValidationResult> {
    console.log('🔍 Starting smart validation...');
    
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Calculate validation metrics
    const metrics = this.calculateValidationMetrics(originalCode, proposedCode);
    
    // Run validation checks based on confidence level
    const validationLevel = this.getValidationLevel(confidenceAssessment);
    
    // 1. Syntax validation (always required)
    const syntaxValidation = await this.validateSyntax(proposedCode, changeIntent.targetComponent?.filePath || '');
    issues.push(...syntaxValidation.issues);
    warnings.push(...syntaxValidation.warnings);
    
    // 2. Intent alignment validation
    const intentValidation = this.validateIntentAlignment(
      originalCode,
      proposedCode,
      changeIntent,
      validationLevel
    );
    issues.push(...intentValidation.issues);
    warnings.push(...intentValidation.warnings);
    
    // 3. Preservation validation
    if (impactAnalysis?.preservationRules) {
      const preservationValidation = this.validatePreservation(
        originalCode,
        proposedCode,
        impactAnalysis.preservationRules,
        validationLevel
      );
      issues.push(...preservationValidation.issues);
      warnings.push(...preservationValidation.warnings);
    }
    
    // 4. Scope validation (critical for preventing over-deletion)
    const scopeValidation = this.validateChangeScope(
      originalCode,
      proposedCode,
      changeIntent,
      metrics,
      validationLevel
    );
    issues.push(...scopeValidation.issues);
    warnings.push(...scopeValidation.warnings);
    
    // 5. Confidence-based validation
    const confidenceValidation = this.validateByConfidence(
      proposedCode,
      confidenceAssessment,
      metrics
    );
    issues.push(...confidenceValidation.issues);
    warnings.push(...confidenceValidation.warnings);
    
    // Calculate overall validation confidence
    const validationConfidence = this.calculateValidationConfidence(
      issues,
      warnings,
      confidenceAssessment.confidence,
      metrics
    );
    
    const passed = issues.filter(i => i.severity === 'error').length === 0;
    
    console.log(`🔍 Validation complete: ${passed ? 'PASS' : 'FAIL'} (${issues.length} issues, ${warnings.length} warnings)`);
    
    return {
      passed,
      confidence: validationConfidence,
      issues,
      warnings,
      metrics
    };
  }
  
  /**
   * Validate syntax of the proposed code (simplified)
   */
  private async validateSyntax(
    code: string,
    filePath: string
  ): Promise<{ issues: ValidationIssue[]; warnings: ValidationWarning[] }> {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Simple syntax checks without full parsing
    const basicChecks = [
      { pattern: /\{[^}]*$/, message: 'Unclosed brace detected' },
      { pattern: /\([^)]*$/, message: 'Unclosed parenthesis detected' },
      { pattern: /\[[^\]]*$/, message: 'Unclosed bracket detected' },
      { pattern: /import.*from\s*$/, message: 'Incomplete import statement' },
      { pattern: /export\s*$/, message: 'Incomplete export statement' }
    ];
    
    for (const check of basicChecks) {
      if (check.pattern.test(code)) {
        issues.push({
          type: 'syntax',
          severity: 'error',
          message: check.message,
          suggestion: 'Fix the syntax error before proceeding'
        });
      }
    }
    
    if (issues.length === 0) {
      console.log('✅ Basic syntax validation passed');
    } else {
      console.log('❌ Syntax validation failed:', issues.length, 'issues');
    }
    
    return { issues, warnings };
  }
  
  /**
   * Validate that the change aligns with the visual intent
   */
  private validateIntentAlignment(
    originalCode: string,
    proposedCode: string,
    changeIntent: ChangeIntent,
    validationLevel: 'basic' | 'standard' | 'strict' | 'paranoid'
  ): { issues: ValidationIssue[]; warnings: ValidationWarning[] } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    if (!changeIntent.visualEdit?.changes) {
      return { issues, warnings };
    }
    
    // Check each visual change is reflected in the code
    for (const visualChange of changeIntent.visualEdit.changes) {
      const reflected = this.checkVisualChangeReflection(proposedCode, visualChange);
      
      if (!reflected.found) {
        const severity = validationLevel === 'paranoid' ? 'error' : 'warning';
        const issue: ValidationIssue = {
          type: 'intent-mismatch',
          severity,
          message: `Visual change not reflected in code: ${visualChange.property} "${visualChange.before}" → "${visualChange.after}"`,
          suggestion: reflected.suggestion
        };
        
        if (severity === 'error') {
          issues.push(issue);
        } else {
          warnings.push({
            type: 'intent-alignment',
            message: issue.message,
            suggestion: issue.suggestion
          });
        }
      }
    }
    
    console.log(`🎯 Intent alignment: ${issues.length} issues, ${warnings.length} warnings`);
    
    return { issues, warnings };
  }
  
  /**
   * Validate that critical code is preserved
   */
  private validatePreservation(
    originalCode: string,
    proposedCode: string,
    preservationRules: PreservationRule[],
    validationLevel: 'basic' | 'standard' | 'strict' | 'paranoid'
  ): { issues: ValidationIssue[]; warnings: ValidationWarning[] } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    for (const rule of preservationRules) {
      const preserved = this.checkPreservationRule(originalCode, proposedCode, rule);
      
      if (!preserved) {
        const severity = rule.critical ? 'error' : 'warning';
        const issue: ValidationIssue = {
          type: 'preservation-violation',
          severity,
          message: `Preservation rule violated: ${rule.description}`,
          suggestion: `Ensure ${rule.description.toLowerCase()} are maintained in the code`
        };
        
        if (severity === 'error') {
          issues.push(issue);
        } else {
          warnings.push({
            type: 'preservation',
            message: issue.message,
            suggestion: issue.suggestion
          });
        }
      }
    }
    
    console.log(`🛡️ Preservation check: ${issues.length} issues, ${warnings.length} warnings`);
    
    return { issues, warnings };
  }
  
  /**
   * Validate the scope of changes (critical for preventing over-deletion)
   */
  private validateChangeScope(
    originalCode: string,
    proposedCode: string,
    changeIntent: ChangeIntent,
    metrics: ValidationMetrics,
    validationLevel: 'basic' | 'standard' | 'strict' | 'paranoid'
  ): { issues: ValidationIssue[]; warnings: ValidationWarning[] } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    // This is the key validation that prevents the over-deletion problem!
    
    // 1. Check for excessive deletions
    const deletionThreshold = this.getDeletionThreshold(changeIntent, validationLevel);
    if (metrics.linesRemoved > deletionThreshold) {
      issues.push({
        type: 'scope-exceeded',
        severity: 'error',
        message: `Excessive code deletion detected: ${metrics.linesRemoved} lines removed (threshold: ${deletionThreshold})`,
        suggestion: 'Review the change to ensure only necessary code is being removed'
      });
    }
    
    // 2. Check change ratio
    const changeRatioThreshold = this.getChangeRatioThreshold(changeIntent, validationLevel);
    if (metrics.changeRatio > changeRatioThreshold) {
      const severity = validationLevel === 'paranoid' ? 'error' : 'warning';
      const issue: ValidationIssue = {
        type: 'scope-exceeded',
        severity,
        message: `Change ratio exceeded: ${(metrics.changeRatio * 100).toFixed(1)}% of file changed (threshold: ${(changeRatioThreshold * 100).toFixed(1)}%)`,
        suggestion: 'Consider if such a large change is necessary for the visual intent'
      };
      
      if (severity === 'error') {
        issues.push(issue);
      } else {
        warnings.push({
          type: 'scope',
          message: issue.message,
          suggestion: issue.suggestion
        });
      }
    }
    
    // 3. Check for minimal changes that became large
    if (changeIntent.type === 'styling' && metrics.linesChanged > 10) {
      warnings.push({
        type: 'scope',
        message: `Simple styling change resulted in ${metrics.linesChanged} lines changed`,
        suggestion: 'Verify this change scope is appropriate for a styling modification'
      });
    }
    
    // 4. Check for font-size changes that affect too much (the original problem!)
    if (this.isFontSizeChange(changeIntent) && metrics.linesRemoved > 5) {
      issues.push({
        type: 'scope-exceeded',
        severity: 'error',
        message: `Font size change should not remove ${metrics.linesRemoved} lines of code`,
        suggestion: 'Font size changes should be minimal and targeted'
      });
    }
    
    console.log(`📏 Scope validation: ${issues.length} issues, ${warnings.length} warnings`);
    
    return { issues, warnings };
  }
  
  /**
   * Validate based on confidence level
   */
  private validateByConfidence(
    proposedCode: string,
    confidenceAssessment: ChangeConfidenceAssessment,
    metrics: ValidationMetrics
  ): { issues: ValidationIssue[]; warnings: ValidationWarning[] } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    // For low confidence changes, be extra strict
    if (confidenceAssessment.confidence < 0.5) {
      if (metrics.changeRatio > 0.3) {
        issues.push({
          type: 'scope-exceeded',
          severity: 'error',
          message: `Low confidence change (${(confidenceAssessment.confidence * 100).toFixed(1)}%) with high change ratio (${(metrics.changeRatio * 100).toFixed(1)}%)`,
          suggestion: 'Use a more conservative approach for low confidence changes'
        });
      }
      
      if (metrics.linesRemoved > 10) {
        issues.push({
          type: 'scope-exceeded',
          severity: 'error',
          message: `Low confidence change should not remove ${metrics.linesRemoved} lines`,
          suggestion: 'Reduce the scope of changes for low confidence scenarios'
        });
      }
    }
    
    // For high-risk changes, require extra validation
    if (confidenceAssessment.riskLevel === 'high' || confidenceAssessment.riskLevel === 'critical') {
      if (metrics.complexityDelta > 5) {
        warnings.push({
          type: 'complexity',
          message: `High-risk change increases complexity significantly`,
          suggestion: 'Consider breaking this into smaller, safer changes'
        });
      }
    }
    
    console.log(`🎯 Confidence-based validation: ${issues.length} issues, ${warnings.length} warnings`);
    
    return { issues, warnings };
  }
  
  /**
   * Calculate comprehensive validation metrics
   */
  private calculateValidationMetrics(originalCode: string, proposedCode: string): ValidationMetrics {
    const originalLines = originalCode.split('\n');
    const proposedLines = proposedCode.split('\n');
    
    const linesAdded = Math.max(0, proposedLines.length - originalLines.length);
    const linesRemoved = Math.max(0, originalLines.length - proposedLines.length);
    const linesChanged = linesAdded + linesRemoved;
    
    const changeRatio = originalLines.length > 0 ? linesChanged / originalLines.length : 0;
    
    // Simple complexity metric (number of functions, classes, etc.)
    const originalComplexity = this.calculateCodeComplexity(originalCode);
    const proposedComplexity = this.calculateCodeComplexity(proposedCode);
    const complexityDelta = proposedComplexity - originalComplexity;
    
    return {
      linesChanged,
      linesAdded,
      linesRemoved,
      filesModified: 1,
      changeRatio,
      complexityDelta
    };
  }
  
  /**
   * Calculate a simple code complexity metric
   */
  private calculateCodeComplexity(code: string): number {
    let complexity = 0;
    
    // Count functions
    complexity += (code.match(/function\s+\w+/g) || []).length;
    complexity += (code.match(/const\s+\w+\s*=/g) || []).length;
    complexity += (code.match(/=>\s*{/g) || []).length;
    
    // Count control structures
    complexity += (code.match(/if\s*\(/g) || []).length;
    complexity += (code.match(/for\s*\(/g) || []).length;
    complexity += (code.match(/while\s*\(/g) || []).length;
    
    // Count JSX elements
    complexity += (code.match(/<\w+/g) || []).length;
    
    return complexity;
  }
  
  /**
   * Check if a visual change is reflected in the proposed code
   */
  private checkVisualChangeReflection(
    proposedCode: string,
    visualChange: any
  ): { found: boolean; suggestion?: string } {
    const { property, after } = visualChange;
    
    // Direct property check
    if (proposedCode.includes(property) && proposedCode.includes(after)) {
      return { found: true };
    }
    
    // CSS-in-JS property check
    const camelCaseProperty = property.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
    if (proposedCode.includes(camelCaseProperty) && proposedCode.includes(after)) {
      return { found: true };
    }
    
    // Tailwind class check
    if (this.checkTailwindReflection(proposedCode, property, after)) {
      return { found: true };
    }
    
    return {
      found: false,
      suggestion: `Ensure the ${property} change to "${after}" is reflected in the code`
    };
  }
  
  /**
   * Check if a Tailwind class reflects the visual change
   */
  private checkTailwindReflection(code: string, property: string, value: string): boolean {
    const tailwindMappings: Record<string, string[]> = {
      'font-size': ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'],
      'color': ['text-red', 'text-blue', 'text-green', 'text-gray'],
      'background-color': ['bg-red', 'bg-blue', 'bg-green', 'bg-gray']
    };
    
    const possibleClasses = tailwindMappings[property] || [];
    return possibleClasses.some(cls => code.includes(cls));
  }
  
  /**
   * Check if a preservation rule is followed
   */
  private checkPreservationRule(
    originalCode: string,
    proposedCode: string,
    rule: PreservationRule
  ): boolean {
    if (rule.pattern instanceof RegExp) {
      const originalMatches = originalCode.match(rule.pattern);
      const proposedMatches = proposedCode.match(rule.pattern);
      
      if (rule.critical) {
        // All matches must be preserved for critical rules
        return (originalMatches?.length || 0) === (proposedMatches?.length || 0);
      } else {
        // At least some matches should be preserved for non-critical rules
        return (proposedMatches?.length || 0) > 0;
      }
    }
    
    if (typeof rule.pattern === 'string') {
      return proposedCode.includes(rule.pattern);
    }
    
    return true;
  }
  
  /**
   * Get deletion threshold based on change intent and validation level
   */
  private getDeletionThreshold(
    changeIntent: ChangeIntent,
    validationLevel: 'basic' | 'standard' | 'strict' | 'paranoid'
  ): number {
    let baseThreshold = 10;
    
    // Adjust based on change type
    if (changeIntent.type === 'styling') {
      baseThreshold = 3;
    } else if (changeIntent.type === 'layout') {
      baseThreshold = 8;
    } else if (changeIntent.type === 'structure') {
      baseThreshold = 15;
    }
    
    // Adjust based on validation level
    const multipliers = {
      'basic': 2.0,
      'standard': 1.5,
      'strict': 1.0,
      'paranoid': 0.5
    };
    
    return Math.floor(baseThreshold * multipliers[validationLevel]);
  }
  
  /**
   * Get change ratio threshold based on change intent and validation level
   */
  private getChangeRatioThreshold(
    changeIntent: ChangeIntent,
    validationLevel: 'basic' | 'standard' | 'strict' | 'paranoid'
  ): number {
    let baseThreshold = 0.3;
    
    // Adjust based on change type
    if (changeIntent.type === 'styling') {
      baseThreshold = 0.1;
    } else if (changeIntent.type === 'layout') {
      baseThreshold = 0.2;
    } else if (changeIntent.type === 'structure') {
      baseThreshold = 0.4;
    }
    
    // Adjust based on validation level
    const multipliers = {
      'basic': 2.0,
      'standard': 1.5,
      'strict': 1.0,
      'paranoid': 0.7
    };
    
    return baseThreshold * multipliers[validationLevel];
  }
  
  /**
   * Check if this is a font-size change (the original problem case)
   */
  private isFontSizeChange(changeIntent: ChangeIntent): boolean {
    return changeIntent.visualEdit?.changes?.some(change => 
      change.property === 'font-size'
    ) || false;
  }
  
  /**
   * Get validation level based on confidence assessment
   */
  private getValidationLevel(
    confidenceAssessment: ChangeConfidenceAssessment
  ): 'basic' | 'standard' | 'strict' | 'paranoid' {
    if (confidenceAssessment.confidence >= 0.8 && confidenceAssessment.riskLevel === 'low') {
      return 'standard';
    } else if (confidenceAssessment.confidence >= 0.6) {
      return 'strict';
    } else {
      return 'paranoid';
    }
  }
  
  /**
   * Calculate overall validation confidence
   */
  private calculateValidationConfidence(
    issues: ValidationIssue[],
    warnings: ValidationWarning[],
    originalConfidence: number,
    metrics: ValidationMetrics
  ): number {
    let confidence = originalConfidence;
    
    // Reduce confidence for each error
    const errors = issues.filter(i => i.severity === 'error');
    confidence -= errors.length * 0.2;
    
    // Reduce confidence for warnings
    confidence -= warnings.length * 0.05;
    
    // Reduce confidence for large changes
    if (metrics.changeRatio > 0.5) {
      confidence -= 0.2;
    }
    
    return Math.max(confidence, 0.1);
  }
}
