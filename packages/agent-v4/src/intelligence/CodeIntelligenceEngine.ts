// Simplified code intelligence without Babel dependencies
// In production, this would use proper AST parsing
import type { 
  ChangeIntent, 
  ComponentStructure, 
  RepoSymbolicModel,
  ChangeImpactAnalysis,
  DirectChange,
  CascadeChange,
  PreservationRule,
  ValidationCheck
} from '../types/index.js';

/**
 * Analyzes code to understand change impact and requirements
 */
export class CodeIntelligenceEngine {
  
  /**
   * Analyze the impact of a change on the codebase
   */
  analyzeChangeImpact(
    intent: ChangeIntent,
    component: ComponentStructure,
    symbolicRepo: RepoSymbolicModel
  ): ChangeImpactAnalysis {
    console.log('🧠 Analyzing code change impact...');
    
    // Parse the component to understand its structure
    const syntaxTree = this.parseComponent(component);
    
    // Analyze styling context
    const stylingContext = this.analyzeStylingContext(component, symbolicRepo);
    
    // Analyze dependencies
    const dependencies = this.analyzeDependencies(component, symbolicRepo);
    
    // Identify direct changes needed
    const directChanges = this.identifyDirectChanges(intent, syntaxTree, stylingContext);
    
    // Identify cascade changes
    const cascadeChanges = this.identifyCascadeChanges(intent, dependencies, symbolicRepo);
    
    // Generate preservation rules
    const preservationRules = this.generatePreservationRules(component, syntaxTree);
    
    // Generate validation checks
    const validationChecks = this.generateValidationChecks(intent, component);
    
    // Calculate expected scope
    const expectedScope = this.calculateExpectedScope(directChanges, cascadeChanges);
    
    console.log(`🎯 Impact analysis: ${directChanges.length} direct, ${cascadeChanges.length} cascade changes`);
    
    return {
      directChanges,
      cascadeChanges,
      preservationRules,
      validationChecks,
      expectedScope
    };
  }
  
  /**
   * Parse component code (simplified without AST)
   */
  private parseComponent(component: ComponentStructure): any {
    const content = component.content || '';
    
    return {
      exports: this.findExportsSimple(content),
      imports: this.findImportsSimple(content),
      functions: this.findFunctionsSimple(content),
      jsxElements: this.findJSXElementsSimple(content),
      styleReferences: this.findStyleReferencesSimple(content)
    };
  }
  
  /**
   * Analyze styling context for the component
   */
  private analyzeStylingContext(
    component: ComponentStructure, 
    symbolicRepo: RepoSymbolicModel
  ): any {
    const context = {
      approach: component.styling.approach,
      hasDesignSystem: !!symbolicRepo.designTokens,
      designTokens: symbolicRepo.designTokens,
      customClasses: symbolicRepo.customClasses,
      cssVariables: symbolicRepo.cssVariables,
      tailwindConfig: symbolicRepo.tailwindConfig
    };
    
    console.log(`🎨 Styling context: ${context.approach}, design system: ${context.hasDesignSystem}`);
    
    return context;
  }
  
  /**
   * Analyze component dependencies
   */
  private analyzeDependencies(
    component: ComponentStructure,
    symbolicRepo: RepoSymbolicModel
  ): any {
    const dependencies = {
      imports: component.imports || [],
      usedBy: [] as string[],
      uses: [] as string[],
      styleFiles: [] as string[]
    };
    
    // Find components that use this component
    for (const otherComponent of symbolicRepo.components) {
      if (otherComponent.imports?.some(imp => imp.includes(component.name))) {
        dependencies.usedBy.push(otherComponent.name);
      }
    }
    
    // Find components this component uses
    dependencies.uses = component.imports?.filter(imp => 
      symbolicRepo.components.some(c => imp.includes(c.name))
    ) || [];
    
    console.log(`🔗 Dependencies: used by ${dependencies.usedBy.length}, uses ${dependencies.uses.length}`);
    
    return dependencies;
  }
  
  /**
   * Identify direct changes needed for the intent
   */
  private identifyDirectChanges(
    intent: ChangeIntent,
    syntaxTree: any,
    stylingContext: any
  ): DirectChange[] {
    const changes: DirectChange[] = [];
    
    if (!intent.visualEdit?.changes) {
      return changes;
    }
    
    for (const visualChange of intent.visualEdit.changes) {
      const directChange = this.createDirectChange(visualChange, stylingContext);
      if (directChange) {
        changes.push(directChange);
      }
    }
    
    console.log(`🎯 Identified ${changes.length} direct changes`);
    
    return changes;
  }
  
  /**
   * Create a direct change from a visual change
   */
  private createDirectChange(visualChange: any, stylingContext: any): DirectChange | null {
    const { property, before, after, category } = visualChange;
    
    // Determine how to implement this change based on styling approach
    let target: string;
    let newValue: string;
    
    switch (stylingContext.approach) {
      case 'tailwind':
        target = this.mapToTailwindClass(property, after, stylingContext);
        newValue = target;
        break;
        
      case 'styled-components':
        target = this.mapToStyledComponentsProperty(property);
        newValue = after;
        break;
        
      case 'css-modules':
        target = this.mapToCSSModulesClass(property, stylingContext);
        newValue = after;
        break;
        
      default:
        target = property;
        newValue = after;
    }
    
    return {
      type: this.categorizeChangeType(category),
      target,
      oldValue: before,
      newValue,
      confidence: this.calculateDirectChangeConfidence(property, stylingContext)
    };
  }
  
  /**
   * Identify cascade changes that might be needed
   */
  private identifyCascadeChanges(
    intent: ChangeIntent,
    dependencies: any,
    symbolicRepo: RepoSymbolicModel
  ): CascadeChange[] {
    const cascadeChanges: CascadeChange[] = [];
    
    // Check if parent components need updates
    if (dependencies.usedBy.length > 0) {
      cascadeChanges.push({
        type: 'parent-container',
        target: dependencies.usedBy.join(', '),
        reason: 'Parent components may need layout adjustments',
        required: false,
        confidence: 0.3
      });
    }
    
    // Check for design system consistency
    if (intent.visualEdit?.changes?.some(c => ['color', 'font-size', 'spacing'].includes(c.property))) {
      cascadeChanges.push({
        type: 'sibling-element',
        target: 'design-system',
        reason: 'Design system tokens may need updates for consistency',
        required: true,
        confidence: 0.8
      });
    }
    
    console.log(`🌊 Identified ${cascadeChanges.length} cascade changes`);
    
    return cascadeChanges;
  }
  
  /**
   * Generate preservation rules for the component
   */
  private generatePreservationRules(
    component: ComponentStructure,
    syntaxTree: any
  ): PreservationRule[] {
    const rules: PreservationRule[] = [];
    
    // Preserve all exports
    if (syntaxTree?.exports?.length > 0) {
      rules.push({
        type: 'exports',
        description: 'Preserve all component exports',
        pattern: /export\s+(default\s+)?(function|const|class)/,
        critical: true
      });
    }
    
    // Preserve all imports
    if (syntaxTree?.imports?.length > 0) {
      rules.push({
        type: 'imports',
        description: 'Preserve all import statements',
        pattern: /import\s+.*from\s+['"][^'"]+['"]/,
        critical: true
      });
    }
    
    // Preserve component props interface
    if (component.props && component.props.length > 0) {
      rules.push({
        type: 'interface',
        description: 'Preserve component props interface',
        pattern: /interface\s+\w+Props/,
        critical: true
      });
    }
    
    // Preserve functionality (functions, hooks, etc.)
    rules.push({
      type: 'functionality',
      description: 'Preserve all component functionality',
      pattern: /use\w+\(|function\s+\w+|const\s+\w+\s*=/,
      critical: true
    });
    
    console.log(`🛡️ Generated ${rules.length} preservation rules`);
    
    return rules;
  }
  
  /**
   * Generate validation checks for the change
   */
  private generateValidationChecks(
    intent: ChangeIntent,
    component: ComponentStructure
  ): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    // Always check syntax
    checks.push({
      type: 'syntax',
      description: 'Validate TypeScript/JavaScript syntax',
      validator: 'syntaxValidator',
      required: true
    });
    
    // Check intent alignment
    checks.push({
      type: 'intent-alignment',
      description: 'Verify changes match visual intent',
      validator: 'intentAlignmentValidator',
      required: true
    });
    
    // Check preservation
    checks.push({
      type: 'preservation',
      description: 'Verify critical code is preserved',
      validator: 'preservationValidator',
      required: true
    });
    
    // Check scope
    checks.push({
      type: 'scope',
      description: 'Verify change scope is appropriate',
      validator: 'scopeValidator',
      required: true
    });
    
    // Build check for complex components
    if (component.complexity !== 'simple') {
      checks.push({
        type: 'build',
        description: 'Verify code builds successfully',
        validator: 'buildValidator',
        required: false
      });
    }
    
    console.log(`✅ Generated ${checks.length} validation checks`);
    
    return checks;
  }
  
  /**
   * Calculate expected scope of changes
   */
  private calculateExpectedScope(
    directChanges: DirectChange[],
    cascadeChanges: CascadeChange[]
  ): any {
    const requiredCascadeChanges = cascadeChanges.filter(c => c.required);
    
    const expectedLines = directChanges.length * 2 + requiredCascadeChanges.length * 3;
    const expectedFiles = 1 + requiredCascadeChanges.length;
    
    let changeType: 'minimal' | 'moderate' | 'significant' | 'major';
    if (expectedLines <= 3) changeType = 'minimal';
    else if (expectedLines <= 10) changeType = 'moderate';
    else if (expectedLines <= 25) changeType = 'significant';
    else changeType = 'major';
    
    const riskLevel = changeType === 'minimal' ? 'low' : 
                     changeType === 'moderate' ? 'medium' : 'high';
    
    return {
      expectedLines,
      expectedFiles,
      changeType,
      riskLevel
    };
  }
  
  // Helper methods for simple text-based analysis
  private findExportsSimple(content: string): string[] {
    const exports: string[] = [];
    
    if (content.includes('export default')) {
      exports.push('default');
    }
    if (content.includes('export ') && !content.includes('export default')) {
      exports.push('named');
    }
    
    return exports;
  }
  
  private findImportsSimple(content: string): string[] {
    const imports: string[] = [];
    const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
    
    if (importMatches) {
      importMatches.forEach(match => {
        const moduleMatch = match.match(/from\s+['"]([^'"]+)['"]/);
        if (moduleMatch) {
          imports.push(moduleMatch[1]);
        }
      });
    }
    
    return imports;
  }
  
  private findFunctionsSimple(content: string): string[] {
    const functions: string[] = [];
    
    // Find function declarations
    const functionMatches = content.match(/function\s+(\w+)/g);
    if (functionMatches) {
      functionMatches.forEach(match => {
        const nameMatch = match.match(/function\s+(\w+)/);
        if (nameMatch) {
          functions.push(nameMatch[1]);
        }
      });
    }
    
    // Find arrow functions
    const arrowMatches = content.match(/const\s+(\w+)\s*=/g);
    if (arrowMatches) {
      arrowMatches.forEach(match => {
        const nameMatch = match.match(/const\s+(\w+)/);
        if (nameMatch) {
          functions.push(nameMatch[1]);
        }
      });
    }
    
    return functions;
  }
  
  private findJSXElementsSimple(content: string): string[] {
    const elements: string[] = [];
    const jsxMatches = content.match(/<(\w+)/g);
    
    if (jsxMatches) {
      jsxMatches.forEach(match => {
        const elementMatch = match.match(/<(\w+)/);
        if (elementMatch) {
          elements.push(elementMatch[1]);
        }
      });
    }
    
    return elements;
  }
  
  private findStyleReferencesSimple(content: string): string[] {
    const styles: string[] = [];
    
    if (content.includes('className')) {
      styles.push('className');
    }
    if (content.includes('style=')) {
      styles.push('style');
    }
    
    return styles;
  }
  
  // Helper methods for styling approaches
  private mapToTailwindClass(property: string, value: string, context: any): string {
    // Simple mapping - in production, this would use the Tailwind config
    const mappings: Record<string, (val: string) => string> = {
      'font-size': (val) => `text-${this.mapFontSizeToTailwind(val)}`,
      'color': (val) => `text-${this.mapColorToTailwind(val)}`,
      'background-color': (val) => `bg-${this.mapColorToTailwind(val)}`,
      'margin': (val) => `m-${this.mapSpacingToTailwind(val)}`,
      'padding': (val) => `p-${this.mapSpacingToTailwind(val)}`
    };
    
    return mappings[property]?.(value) || `${property}-${value}`;
  }
  
  private mapToStyledComponentsProperty(property: string): string {
    // Convert CSS property to camelCase for styled-components
    return property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }
  
  private mapToCSSModulesClass(property: string, context: any): string {
    // Generate a class name for CSS modules
    return `${property.replace(/-/g, '_')}_class`;
  }
  
  private categorizeChangeType(category: string): 'style' | 'structure' | 'content' | 'props' {
    const mappings: Record<string, 'style' | 'structure' | 'content' | 'props'> = {
      'styling': 'style',
      'layout': 'structure',
      'content': 'content',
      'props': 'props'
    };
    
    return mappings[category] || 'style';
  }
  
  private calculateDirectChangeConfidence(property: string, stylingContext: any): number {
    // Higher confidence for simple styling properties
    const simpleProperties = ['color', 'font-size', 'margin', 'padding'];
    if (simpleProperties.includes(property)) {
      return 0.9;
    }
    
    // Medium confidence for layout properties
    const layoutProperties = ['display', 'flex-direction', 'align-items'];
    if (layoutProperties.includes(property)) {
      return 0.7;
    }
    
    return 0.5;
  }
  
  // Tailwind mapping helpers
  private mapFontSizeToTailwind(fontSize: string): string {
    const mappings: Record<string, string> = {
      '12px': 'xs',
      '14px': 'sm',
      '16px': 'base',
      '18px': 'lg',
      '20px': 'xl',
      '24px': '2xl'
    };
    
    return mappings[fontSize] || 'base';
  }
  
  private mapColorToTailwind(color: string): string {
    // Simple color mapping - in production, this would be more sophisticated
    if (color.startsWith('#')) {
      return 'gray-500'; // Default fallback
    }
    
    return color.replace(/[^a-zA-Z0-9]/g, '-');
  }
  
  private mapSpacingToTailwind(spacing: string): string {
    const mappings: Record<string, string> = {
      '4px': '1',
      '8px': '2',
      '12px': '3',
      '16px': '4',
      '20px': '5',
      '24px': '6'
    };
    
    return mappings[spacing] || '4';
  }
}
