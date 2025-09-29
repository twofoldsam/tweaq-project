import type {
  VisualEdit,
  ChangeIntent,
  ChangeImpactAnalysis,
  RepoSymbolicModel,
  ChangeConfidenceAssessment,
  ChangeApproach,
  ComponentStructure
} from '../types/index.js';

/**
 * Assesses confidence in change execution and selects appropriate strategies
 */
export class ChangeConfidenceEngine {
  
  /**
   * Assess overall confidence in executing a change
   */
  assessChangeConfidence(
    visualEdit: VisualEdit,
    changeIntent: ChangeIntent,
    impactAnalysis: ChangeImpactAnalysis,
    symbolicRepo: RepoSymbolicModel
  ): ChangeConfidenceAssessment {
    console.log('🎯 Assessing change confidence...');
    
    // Calculate individual confidence factors
    const factors = {
      visualClarity: this.assessVisualClarity(visualEdit),
      componentUnderstanding: this.assessComponentUnderstanding(changeIntent.targetComponent || {} as ComponentStructure, symbolicRepo),
      changeComplexity: this.assessChangeComplexity(impactAnalysis),
      contextCompleteness: this.assessContextCompleteness(symbolicRepo, changeIntent)
    };
    
    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(factors);
    
    // Select recommended approach based on confidence
    const recommendedApproach = this.selectApproachByConfidence(overallConfidence, impactAnalysis);
    
    // Generate fallback strategies
    const fallbackStrategies = this.generateFallbackStrategies(factors, recommendedApproach);
    
    // Assess risk level
    const riskLevel = this.calculateRiskLevel(overallConfidence, impactAnalysis);
    
    const assessment: ChangeConfidenceAssessment = {
      confidence: overallConfidence,
      factors,
      recommendedApproach,
      fallbackStrategies,
      riskLevel
    };
    
    console.log(`🎯 Confidence assessment: ${(overallConfidence * 100).toFixed(1)}% (${recommendedApproach})`);
    console.log(`📊 Factors: visual=${(factors.visualClarity * 100).toFixed(0)}%, component=${(factors.componentUnderstanding * 100).toFixed(0)}%, complexity=${(factors.changeComplexity * 100).toFixed(0)}%, context=${(factors.contextCompleteness * 100).toFixed(0)}%`);
    
    return assessment;
  }
  
  /**
   * Assess how clear and well-defined the visual change is
   */
  private assessVisualClarity(visualEdit: VisualEdit): number {
    let clarity = 0.5; // Base score
    
    // Clear intent description boosts confidence
    if (visualEdit.intent?.description) {
      const description = visualEdit.intent.description;
      if (description.length > 20) clarity += 0.2;
      if (description.includes('font') || description.includes('color') || description.includes('size')) {
        clarity += 0.1;
      }
    }
    
    // Well-defined changes boost confidence
    if (visualEdit.changes && visualEdit.changes.length > 0) {
      clarity += 0.2;
      
      // Simple, single-property changes are clearer
      if (visualEdit.changes.length === 1) {
        clarity += 0.1;
      }
      
      // Clear before/after values boost confidence
      const hasGoodValues = visualEdit.changes.every(change => 
        change.before && change.after && change.before !== change.after
      );
      if (hasGoodValues) {
        clarity += 0.1;
      }
    }
    
    // Clear element targeting boosts confidence
    if (visualEdit.element?.selector && visualEdit.element.selector.length > 0) {
      clarity += 0.1;
      
      // Specific selectors are better than generic ones
      if (visualEdit.element.selector.includes('#') || visualEdit.element.selector.includes('.')) {
        clarity += 0.1;
      }
    }
    
    return Math.min(clarity, 1.0);
  }
  
  /**
   * Assess how well we understand the target component
   */
  private assessComponentUnderstanding(
    targetComponent: ComponentStructure,
    symbolicRepo: RepoSymbolicModel
  ): number {
    let understanding = 0.3; // Base score
    
    // Component complexity affects understanding
    switch (targetComponent.complexity) {
      case 'simple':
        understanding += 0.4;
        break;
      case 'moderate':
        understanding += 0.2;
        break;
      case 'complex':
        understanding += 0.0;
        break;
    }
    
    // Clear styling approach boosts understanding
    if (targetComponent.styling?.approach) {
      understanding += 0.2;
      
      // Some approaches are easier to work with
      if (['tailwind', 'css-modules'].includes(targetComponent.styling.approach)) {
        understanding += 0.1;
      }
    }
    
    // Good component analysis boosts understanding
    if (targetComponent.props && targetComponent.props.length > 0) {
      understanding += 0.1;
    }
    
    if (targetComponent.exports && targetComponent.exports.length > 0) {
      understanding += 0.1;
    }
    
    // Repository analysis quality affects understanding
    if (symbolicRepo.components && symbolicRepo.components.length > 50) {
      understanding += 0.1;
    }
    
    return Math.min(understanding, 1.0);
  }
  
  /**
   * Assess the complexity of the change (inverse relationship with confidence)
   */
  private assessChangeComplexity(impactAnalysis: ChangeImpactAnalysis): number {
    let simplicity = 0.8; // Start high, reduce for complexity
    
    // More direct changes reduce simplicity
    if (impactAnalysis.directChanges.length > 3) {
      simplicity -= 0.2;
    } else if (impactAnalysis.directChanges.length > 1) {
      simplicity -= 0.1;
    }
    
    // Cascade changes reduce simplicity
    const requiredCascadeChanges = impactAnalysis.cascadeChanges.filter(c => c.required);
    if (requiredCascadeChanges.length > 0) {
      simplicity -= 0.3;
    }
    
    // Expected scope affects simplicity
    switch (impactAnalysis.expectedScope.changeType) {
      case 'minimal':
        // No reduction
        break;
      case 'moderate':
        simplicity -= 0.1;
        break;
      case 'significant':
        simplicity -= 0.3;
        break;
      case 'major':
        simplicity -= 0.5;
        break;
    }
    
    // Risk level affects simplicity
    switch (impactAnalysis.expectedScope.riskLevel) {
      case 'low':
        // No reduction
        break;
      case 'medium':
        simplicity -= 0.1;
        break;
      case 'high':
        simplicity -= 0.2;
        break;
    }
    
    return Math.max(simplicity, 0.1);
  }
  
  /**
   * Assess how complete our context understanding is
   */
  private assessContextCompleteness(
    symbolicRepo: RepoSymbolicModel,
    changeIntent: ChangeIntent
  ): number {
    let completeness = 0.4; // Base score
    
    // Repository analysis quality
    completeness += (symbolicRepo.components ? symbolicRepo.components.length / 100 : 0) * 0.3;
    
    // Component count and coverage
    if (symbolicRepo.components && symbolicRepo.components.length > 10) {
      completeness += 0.1;
    }
    
    // Design system presence
    if (symbolicRepo.designTokens) {
      completeness += 0.1;
    }
    
    // Styling patterns understanding
    if (symbolicRepo.stylingPatterns) {
      completeness += 0.1;
    }
    
    // DOM mappings quality
    if (symbolicRepo.domMappings.size > 0) {
      completeness += 0.1;
    }
    
    // Transformation rules availability
    if (symbolicRepo.transformationRules.length > 0) {
      completeness += 0.1;
    }
    
    return Math.min(completeness, 1.0);
  }
  
  /**
   * Calculate overall confidence from individual factors
   */
  private calculateOverallConfidence(factors: ChangeConfidenceAssessment['factors']): number {
    // Weighted average of factors
    const weights = {
      visualClarity: 0.3,
      componentUnderstanding: 0.3,
      changeComplexity: 0.25,
      contextCompleteness: 0.15
    };
    
    const weightedSum = 
      factors.visualClarity * weights.visualClarity +
      factors.componentUnderstanding * weights.componentUnderstanding +
      factors.changeComplexity * weights.changeComplexity +
      factors.contextCompleteness * weights.contextCompleteness;
    
    return Math.min(Math.max(weightedSum, 0.1), 1.0);
  }
  
  /**
   * Select the best approach based on confidence level
   */
  private selectApproachByConfidence(
    confidence: number,
    impactAnalysis: ChangeImpactAnalysis
  ): ChangeApproach {
    // High confidence: direct execution
    if (confidence >= 0.8 && impactAnalysis.expectedScope.riskLevel === 'low') {
      return 'high-confidence-direct';
    }
    
    // Medium-high confidence: guided execution
    if (confidence >= 0.6 && impactAnalysis.expectedScope.riskLevel !== 'high') {
      return 'medium-confidence-guided';
    }
    
    // Low-medium confidence: conservative approach
    if (confidence >= 0.4) {
      return 'low-confidence-conservative';
    }
    
    // Very low confidence: human review required
    return 'very-low-confidence-human-review';
  }
  
  /**
   * Generate fallback strategies based on confidence factors
   */
  private generateFallbackStrategies(
    factors: ChangeConfidenceAssessment['factors'],
    primaryApproach: ChangeApproach
  ): ChangeApproach[] {
    const fallbacks: ChangeApproach[] = [];
    
    // Always have a more conservative fallback
    switch (primaryApproach) {
      case 'high-confidence-direct':
        fallbacks.push('medium-confidence-guided');
        fallbacks.push('low-confidence-conservative');
        break;
        
      case 'medium-confidence-guided':
        fallbacks.push('low-confidence-conservative');
        fallbacks.push('very-low-confidence-human-review');
        break;
        
      case 'low-confidence-conservative':
        fallbacks.push('very-low-confidence-human-review');
        break;
        
      case 'very-low-confidence-human-review':
        // No fallback - this is the most conservative
        break;
    }
    
    // If visual clarity is low, add human review as fallback
    if (factors.visualClarity < 0.5 && !fallbacks.includes('very-low-confidence-human-review')) {
      fallbacks.push('very-low-confidence-human-review');
    }
    
    return fallbacks;
  }
  
  /**
   * Calculate risk level based on confidence and impact
   */
  private calculateRiskLevel(
    confidence: number,
    impactAnalysis: ChangeImpactAnalysis
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Start with impact analysis risk level
    let riskLevel = impactAnalysis.expectedScope.riskLevel;
    
    // Adjust based on confidence
    if (confidence < 0.4) {
      // Low confidence increases risk
      if (riskLevel === 'low') riskLevel = 'medium';
      else if (riskLevel === 'medium') riskLevel = 'high';
      // else if (riskLevel === 'high') riskLevel = 'high'; // Already at max
    } else if (confidence > 0.8) {
      // High confidence can reduce risk slightly
      if (riskLevel === 'high') riskLevel = 'medium';
      else if (riskLevel === 'medium') riskLevel = 'low';
    }
    
    // Required cascade changes increase risk
    const requiredCascadeChanges = impactAnalysis.cascadeChanges.filter(c => c.required);
    if (requiredCascadeChanges.length > 2) {
      if (riskLevel === 'low') riskLevel = 'medium';
      else if (riskLevel === 'medium') riskLevel = 'high';
    }
    
    return riskLevel;
  }
  
  /**
   * Get confidence threshold for a specific approach
   */
  getConfidenceThreshold(approach: ChangeApproach): number {
    const thresholds: Record<ChangeApproach, number> = {
      'high-confidence-direct': 0.8,
      'medium-confidence-guided': 0.6,
      'low-confidence-conservative': 0.4,
      'very-low-confidence-human-review': 0.0
    };
    
    return thresholds[approach];
  }
  
  /**
   * Check if confidence meets threshold for approach
   */
  meetsConfidenceThreshold(confidence: number, approach: ChangeApproach): boolean {
    return confidence >= this.getConfidenceThreshold(approach);
  }
  
  /**
   * Get recommended validation level based on confidence
   */
  getRecommendedValidationLevel(confidence: number): 'basic' | 'standard' | 'strict' | 'paranoid' {
    if (confidence >= 0.8) return 'standard';
    if (confidence >= 0.6) return 'strict';
    if (confidence >= 0.4) return 'paranoid';
    return 'paranoid';
  }
}
