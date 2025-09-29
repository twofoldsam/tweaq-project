import type { 
  VisualEdit, 
  ComponentStructure, 
  RepoSymbolicModel,
  ChangeIntent 
} from '../types/index.js';

/**
 * Analyzes visual changes to understand intent and scope
 */
export class VisualChangeAnalyzer {
  
  /**
   * Analyze a visual edit to understand the change intent
   */
  analyzeChangeIntent(
    visualEdit: VisualEdit, 
    symbolicRepo: RepoSymbolicModel
  ): ChangeIntent {
    console.log('🔍 Analyzing visual change intent...');
    
    // Find the target component using existing DOM mappings
    const targetComponent = this.findTargetComponent(visualEdit.element, symbolicRepo);
    
    if (!targetComponent) {
      throw new Error(`Could not find target component for element: ${visualEdit.element.selector}`);
    }
    
    // Analyze the scope of changes
    const changeScope = this.analyzeChangeScope(visualEdit.changes, targetComponent);
    
    // Find related changes that might be needed
    const dependencies = this.findRelatedChanges(changeScope, symbolicRepo);
    
    // Calculate confidence in our understanding
    const confidence = this.calculateAnalysisConfidence(visualEdit, targetComponent, symbolicRepo);
    
    return {
      id: `change-${Date.now()}`,
      type: this.categorizeChangeType(visualEdit.changes),
      description: this.generateChangeDescription(visualEdit),
      visualEdit,
      targetComponent,
      changeScope,
      relatedChanges: dependencies,
      confidence,
      riskLevel: this.assessRiskLevel(changeScope, dependencies),
      priority: this.calculatePriority(visualEdit, changeScope)
    };
  }
  
  /**
   * Find the target component using DOM mappings
   */
  private findTargetComponent(
    element: VisualEdit['element'], 
    symbolicRepo: RepoSymbolicModel
  ): ComponentStructure | null {
    console.log(`🎯 Finding target component for: ${element.selector}`);
    
    // Use existing DOM mappings from symbolic repo
    const mappings = symbolicRepo.domMappings.get(element.selector);
    
    if (mappings && mappings.length > 0) {
      // Get the most confident mapping
      const bestMapping = mappings.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      // Find the component in the symbolic repo
      const component = symbolicRepo.components.find(c => 
        c.filePath === bestMapping.filePath
      );
      
      if (component) {
        console.log(`✅ Found target component: ${component.name} (confidence: ${bestMapping.confidence})`);
        return component;
      }
    }
    
    // Fallback: try to find by class name or element type
    const fallbackComponent = this.findComponentByFallback(element, symbolicRepo);
    if (fallbackComponent) {
      console.log(`⚠️ Using fallback component mapping: ${fallbackComponent.name}`);
      return fallbackComponent;
    }
    
    console.warn(`❌ Could not find target component for: ${element.selector}`);
    return null;
  }
  
  /**
   * Analyze the scope of changes required
   */
  private analyzeChangeScope(
    changes: VisualEdit['changes'], 
    targetComponent: ComponentStructure
  ): any {
    console.log('📏 Analyzing change scope...');
    
    const scope = {
      changeType: 'minimal' as const,
      affectedProperties: [] as string[],
      estimatedLines: 0,
      complexity: 'simple' as const,
      stylingApproach: targetComponent.styling.approach
    };
    
    for (const change of changes) {
      scope.affectedProperties.push(change.property);
      
      // Estimate complexity based on change type
      if (change.category === 'layout') {
        scope.complexity = 'moderate' as any;
        scope.estimatedLines += 3;
      } else if (change.category === 'styling') {
        scope.estimatedLines += 1;
      } else if (change.category === 'structure') {
        scope.complexity = 'complex' as any;
        scope.estimatedLines += 5;
      }
    }
    
    // Determine overall change type
    if (scope.estimatedLines <= 2) {
      scope.changeType = 'minimal';
    } else if (scope.estimatedLines <= 10) {
      scope.changeType = 'moderate' as any;
    } else {
      scope.changeType = 'significant' as any;
    }
    
    console.log(`📊 Change scope: ${scope.changeType}, ~${scope.estimatedLines} lines, ${scope.complexity} complexity`);
    
    return scope;
  }
  
  /**
   * Find related changes that might be needed
   */
  private findRelatedChanges(changeScope: any, symbolicRepo: RepoSymbolicModel): any[] {
    console.log('🔗 Finding related changes...');
    
    const relatedChanges = [];
    
    // Check for responsive design implications
    if (changeScope.affectedProperties.includes('font-size')) {
      relatedChanges.push({
        type: 'responsive',
        reason: 'Font size changes may need responsive adjustments',
        confidence: 0.7,
        required: false
      });
    }
    
    // Check for design system implications
    if (symbolicRepo.designTokens && changeScope.affectedProperties.some((prop: any) => 
      ['color', 'font-size', 'spacing'].includes(prop)
    )) {
      relatedChanges.push({
        type: 'design-system',
        reason: 'Change may affect design system consistency',
        confidence: 0.8,
        required: true
      });
    }
    
    console.log(`🔗 Found ${relatedChanges.length} related changes`);
    
    return relatedChanges;
  }
  
  /**
   * Calculate confidence in our analysis
   */
  private calculateAnalysisConfidence(
    visualEdit: VisualEdit,
    targetComponent: ComponentStructure,
    symbolicRepo: RepoSymbolicModel
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence for clear visual edits
    if (visualEdit.intent?.description && visualEdit.intent.description.length > 10) {
      confidence += 0.2;
    }
    
    // Boost confidence for well-understood components
    if (targetComponent.complexity === 'simple') {
      confidence += 0.2;
    } else if (targetComponent.complexity === 'moderate') {
      confidence += 0.1;
    }
    
    // Boost confidence for simple changes
    if (visualEdit.changes.length === 1 && visualEdit.changes[0].category === 'styling') {
      confidence += 0.2;
    }
    
    // Boost confidence for good symbolic repo coverage
    if (symbolicRepo.components && symbolicRepo.components.length > 50) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Categorize the type of change
   */
  private categorizeChangeType(changes: VisualEdit['changes']): string {
    if (changes.length === 1) {
      return changes[0].category;
    }
    
    const categories = new Set(changes.map(c => c.category));
    
    if (categories.has('structure')) return 'structure';
    if (categories.has('layout')) return 'layout';
    if (categories.has('styling')) return 'styling';
    
    return 'mixed';
  }
  
  /**
   * Generate a human-readable description of the change
   */
  private generateChangeDescription(visualEdit: VisualEdit): string {
    if (visualEdit.intent?.description) {
      return visualEdit.intent.description;
    }
    
    const changes = visualEdit.changes.map(c => 
      `${c.property}: ${c.before} → ${c.after}`
    ).join(', ');
    
    return `Update ${visualEdit.element.tagName} (${changes})`;
  }
  
  /**
   * Assess the risk level of the change
   */
  private assessRiskLevel(changeScope: any, relatedChanges: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (changeScope.complexity === 'complex') return 'high';
    if (changeScope.changeType === 'significant') return 'medium';
    if (relatedChanges.some(c => c.required)) return 'medium';
    
    return 'low';
  }
  
  /**
   * Calculate change priority
   */
  private calculatePriority(visualEdit: VisualEdit, changeScope: any): 'low' | 'medium' | 'high' {
    // Simple heuristic for now
    if (changeScope.changeType === 'minimal') return 'high';
    if (changeScope.changeType === 'moderate') return 'medium';
    return 'low';
  }
  
  /**
   * Fallback component finding logic
   */
  private findComponentByFallback(
    element: VisualEdit['element'],
    symbolicRepo: RepoSymbolicModel
  ): ComponentStructure | null {
    // Try to match by class names
    const classNames = element.className?.split(' ') || [];
    
    for (const component of symbolicRepo.components) {
      // Check if component uses any of the same class names
      const componentClasses = component.styling.classes || [];
      const hasMatchingClass = classNames.some(cls => 
        componentClasses.some(compCls => compCls.includes(cls))
      );
      
      if (hasMatchingClass) {
        return component;
      }
    }
    
    return null;
  }
}
