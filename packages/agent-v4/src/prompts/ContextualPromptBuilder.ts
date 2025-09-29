import type {
  PromptContext,
  GeneratedPrompt,
  ChangeApproach,
  RepoSymbolicModel,
  ComponentStructure,
  ChangeIntent,
  ChangeConfidenceAssessment,
  ChangeImpactAnalysis
} from '../types/index.js';

/**
 * Builds contextual prompts using rich repository knowledge
 */
export class ContextualPromptBuilder {
  
  /**
   * Build an intelligent prompt with full context
   */
  buildIntelligentPrompt(context: PromptContext): GeneratedPrompt {
    console.log('🎯 Building contextual prompt...');
    
    const approach = context.confidenceAssessment.recommendedApproach;
    const promptContent = this.buildPromptForApproach(approach, context);
    
    const metadata = {
      approach,
      confidence: context.confidenceAssessment.confidence,
      contextTokens: this.estimateTokens(promptContent),
      expectedResponseTokens: this.estimateResponseTokens(context.impactAnalysis)
    };
    
    console.log(`📝 Generated ${approach} prompt (${metadata.contextTokens} tokens)`);
    
    return {
      content: promptContent,
      metadata
    };
  }
  
  /**
   * Build prompt specific to the confidence approach
   */
  private buildPromptForApproach(approach: ChangeApproach, context: PromptContext): string {
    switch (approach) {
      case 'high-confidence-direct':
        return this.buildHighConfidencePrompt(context);
        
      case 'medium-confidence-guided':
        return this.buildMediumConfidencePrompt(context);
        
      case 'low-confidence-conservative':
        return this.buildLowConfidencePrompt(context);
        
      case 'very-low-confidence-human-review':
        return this.buildHumanReviewPrompt(context);
        
      default:
        return this.buildStandardPrompt(context);
    }
  }
  
  /**
   * Build high-confidence prompt with rich context
   */
  private buildHighConfidencePrompt(context: PromptContext): string {
    const { changeIntent, symbolicRepo, targetComponent } = context;
    
    return `You are an expert ${symbolicRepo.primaryFramework} developer with deep knowledge of this codebase.

${this.buildRepositoryContext(symbolicRepo)}

${this.buildChangeContext(changeIntent, context.confidenceAssessment)}

${this.buildComponentAnalysis(targetComponent, symbolicRepo)}

${this.buildStylingContext(targetComponent, symbolicRepo)}

${this.buildCurrentCode(targetComponent)}

## INSTRUCTIONS (High Confidence Execution)

Based on the comprehensive analysis above, you have high confidence to:

1. **Apply the visual change precisely**: ${changeIntent.description}
2. **Leverage established patterns**: Use the same styling approach and component patterns shown above
3. **Maintain all functionality**: Preserve all props, exports, imports, and behavior
4. **Follow framework best practices**: Use ${symbolicRepo.primaryFramework} conventions
5. **Optimize the implementation**: Apply any obvious improvements while making the change

## EXPECTED OUTCOME
- Clean, production-ready code
- Minimal, targeted changes
- Consistent with codebase patterns
- Fully functional component

Return the complete modified file content:`;
  }
  
  /**
   * Build medium-confidence prompt with guided constraints
   */
  private buildMediumConfidencePrompt(context: PromptContext): string {
    const { changeIntent, symbolicRepo, targetComponent, impactAnalysis } = context;
    
    return `You are an expert ${symbolicRepo.primaryFramework} developer. Apply this change with guided precision.

${this.buildRepositoryContext(symbolicRepo)}

${this.buildChangeContext(changeIntent, context.confidenceAssessment)}

${this.buildImpactAnalysis(impactAnalysis)}

${this.buildComponentAnalysis(targetComponent, symbolicRepo)}

${this.buildPreservationRequirements(impactAnalysis)}

${this.buildCurrentCode(targetComponent)}

## GUIDED INSTRUCTIONS (Medium Confidence)

Follow these guided constraints carefully:

1. **Scope Limitation**: Expected ~${impactAnalysis.expectedScope.expectedLines} lines changed
2. **Change Type**: ${impactAnalysis.expectedScope.changeType} modification only
3. **Risk Management**: This is a ${impactAnalysis.expectedScope.riskLevel} risk change
4. **Preservation**: Follow all preservation requirements above
5. **Validation**: Changes will be strictly validated

## SPECIFIC REQUIREMENTS
${this.buildSpecificRequirements(changeIntent, impactAnalysis)}

## VALIDATION CHECKS
Your changes will be validated for:
${impactAnalysis.validationChecks.map(check => `- ${check.description}`).join('\n')}

Return the complete modified file content with guided precision:`;
  }
  
  /**
   * Build low-confidence prompt with conservative constraints
   */
  private buildLowConfidencePrompt(context: PromptContext): string {
    const { changeIntent, symbolicRepo, targetComponent, impactAnalysis } = context;
    
    return `You are an expert ${symbolicRepo.primaryFramework} developer. Apply this change with MAXIMUM CAUTION.

⚠️ **LOW CONFIDENCE SCENARIO** ⚠️
This change has low confidence (${(context.confidenceAssessment.confidence * 100).toFixed(1)}%). Be extremely conservative.

${this.buildRepositoryContext(symbolicRepo)}

${this.buildChangeContext(changeIntent, context.confidenceAssessment)}

${this.buildComponentAnalysis(targetComponent, symbolicRepo)}

## CRITICAL CONSTRAINTS (Low Confidence)

🚨 **STRICT LIMITATIONS**:
- Maximum ${Math.min(impactAnalysis.expectedScope.expectedLines, 5)} lines changed
- NO structural modifications
- NO new dependencies or imports
- NO functionality changes
- ONLY the minimal change required

🛡️ **PRESERVATION REQUIREMENTS** (CRITICAL):
${impactAnalysis.preservationRules
  .filter(rule => rule.critical)
  .map(rule => `- ${rule.description} (MUST PRESERVE)`)
  .join('\n')}

${this.buildCurrentCode(targetComponent)}

## CONSERVATIVE INSTRUCTIONS

1. **Minimal Change Only**: Apply the smallest possible modification
2. **Preserve Everything**: Keep all existing code structure intact
3. **No Assumptions**: If unclear, prefer NO change over wrong change
4. **Exact Match**: Only change what directly relates to: ${changeIntent.description}
5. **Safety First**: When in doubt, be more conservative

## CHANGE TO APPLY
${this.buildMinimalChangeDescription(changeIntent)}

**Remember**: This is a low-confidence scenario. Err on the side of caution.

Return the complete file with minimal, conservative modifications:`;
  }
  
  /**
   * Build human review prompt
   */
  private buildHumanReviewPrompt(context: PromptContext): string {
    const { changeIntent, symbolicRepo, targetComponent, confidenceAssessment } = context;
    
    return `You are an expert ${symbolicRepo.primaryFramework} developer creating a change proposal for human review.

## CHANGE PROPOSAL GENERATION

This change has very low confidence (${(confidenceAssessment.confidence * 100).toFixed(1)}%) and requires human review.

${this.buildRepositoryContext(symbolicRepo)}

${this.buildChangeContext(changeIntent, confidenceAssessment)}

${this.buildComponentAnalysis(targetComponent, symbolicRepo)}

## CONFIDENCE FACTORS
${this.buildConfidenceFactors(confidenceAssessment)}

${this.buildCurrentCode(targetComponent)}

## INSTRUCTIONS (Proposal Generation)

Create a detailed change proposal that includes:

1. **Analysis Summary**: What you understand about the change
2. **Proposed Approach**: How you would implement it
3. **Risk Assessment**: What could go wrong
4. **Alternative Options**: Different ways to implement
5. **Recommendation**: Your suggested approach

Format as comments in the code with the original code preserved below.

Return a proposal document with the original code intact:`;
  }
  
  /**
   * Build standard prompt (fallback)
   */
  private buildStandardPrompt(context: PromptContext): string {
    const { changeIntent, symbolicRepo, targetComponent } = context;
    
    return `You are an expert ${symbolicRepo.primaryFramework} developer.

## CHANGE REQUEST
${changeIntent.description}

## REPOSITORY CONTEXT
- Framework: ${symbolicRepo.primaryFramework}
- Styling: ${symbolicRepo.stylingApproach}

## TARGET COMPONENT
${targetComponent.name} (${targetComponent.filePath})

## CURRENT CODE
\`\`\`${this.getFileExtension(targetComponent.filePath)}
${targetComponent.content || ''}
\`\`\`

## INSTRUCTIONS
Apply the requested change while maintaining all existing functionality.

Return the complete modified file:`;
  }
  
  // Helper methods for building prompt sections
  
  private buildRepositoryContext(symbolicRepo: RepoSymbolicModel): string {
    return `## REPOSITORY CONTEXT (High Confidence)

**Framework**: ${symbolicRepo.primaryFramework} ${symbolicRepo.frameworkVersions[symbolicRepo.primaryFramework] || ''}
**Styling System**: ${symbolicRepo.stylingApproach}
**Components**: ${symbolicRepo.components.length} analyzed components
**Design System**: ${symbolicRepo.designTokens ? '✅ Available' : '❌ Not detected'}
**Analysis Confidence**: ${(symbolicRepo.analysis.confidence * 100).toFixed(1)}%

**Component Patterns**:
${this.describeComponentPatterns(symbolicRepo)}

**Styling Patterns**:
${this.describeStylingPatterns(symbolicRepo)}`;
  }
  
  private buildChangeContext(changeIntent: ChangeIntent, confidenceAssessment: ChangeConfidenceAssessment): string {
    return `## CHANGE CONTEXT (Confidence: ${(confidenceAssessment.confidence * 100).toFixed(1)}%)

**Intent**: ${changeIntent.description}
**Type**: ${changeIntent.type}
**Priority**: ${changeIntent.priority}
**Risk Level**: ${changeIntent.riskLevel}
**Approach**: ${confidenceAssessment.recommendedApproach}

**Visual Changes**:
${changeIntent.visualEdit?.changes?.map(change => 
  `- **${change.property}**: \`${change.before}\` → \`${change.after}\` (${change.category})`
).join('\n') || 'No specific visual changes defined'}

**Target Element**: \`${changeIntent.visualEdit?.element?.tagName || 'unknown'}\` (selector: \`${changeIntent.visualEdit?.element?.selector || 'unknown'}\`)`;
  }
  
  private buildComponentAnalysis(targetComponent: ComponentStructure, symbolicRepo: RepoSymbolicModel): string {
    return `## COMPONENT ANALYSIS

**Component**: ${targetComponent.name}
**File**: ${targetComponent.filePath}
**Complexity**: ${targetComponent.complexity}
**Framework**: ${targetComponent.framework}

**Styling Approach**: ${targetComponent.styling.approach}
**CSS Classes**: ${targetComponent.styling.classes?.join(', ') || 'None detected'}
**Inline Styles**: ${targetComponent.styling.inlineStyles ? 'Yes' : 'No'}

**Props**: ${targetComponent.props?.length || 0} defined
${targetComponent.props?.map(prop => `- ${prop.name}: ${prop.type}${prop.required ? ' (required)' : ''}`).join('\n') || ''}

**Exports**: ${targetComponent.exports?.join(', ') || 'default'}
**Imports**: ${targetComponent.imports?.length || 0} dependencies`;
  }
  
  private buildStylingContext(targetComponent: ComponentStructure, symbolicRepo: RepoSymbolicModel): string {
    let context = `## STYLING CONTEXT\n\n**Approach**: ${targetComponent.styling.approach}\n`;
    
    if (symbolicRepo.designTokens) {
      context += `\n**Design Tokens Available**:\n`;
      if (symbolicRepo.designTokens.colors) {
        context += `- Colors: ${Object.keys(symbolicRepo.designTokens.colors).slice(0, 5).join(', ')}${Object.keys(symbolicRepo.designTokens.colors).length > 5 ? '...' : ''}\n`;
      }
      if (symbolicRepo.designTokens.spacing) {
        context += `- Spacing: ${Object.keys(symbolicRepo.designTokens.spacing).slice(0, 5).join(', ')}${Object.keys(symbolicRepo.designTokens.spacing).length > 5 ? '...' : ''}\n`;
      }
      if (symbolicRepo.designTokens.typography) {
        context += `- Typography: ${Object.keys(symbolicRepo.designTokens.typography).slice(0, 5).join(', ')}${Object.keys(symbolicRepo.designTokens.typography).length > 5 ? '...' : ''}\n`;
      }
    }
    
    if (symbolicRepo.tailwindConfig) {
      context += `\n**Tailwind Configuration**: Available\n`;
    }
    
    if (symbolicRepo.cssVariables.size > 0) {
      const variables = Array.from(symbolicRepo.cssVariables.keys()).slice(0, 5);
      context += `\n**CSS Variables**: ${variables.join(', ')}${symbolicRepo.cssVariables.size > 5 ? '...' : ''}\n`;
    }
    
    return context;
  }
  
  private buildImpactAnalysis(impactAnalysis: ChangeImpactAnalysis): string {
    return `## IMPACT ANALYSIS

**Expected Scope**: ${impactAnalysis.expectedScope.changeType} (${impactAnalysis.expectedScope.expectedLines} lines)
**Risk Level**: ${impactAnalysis.expectedScope.riskLevel}

**Direct Changes**: ${impactAnalysis.directChanges.length}
${impactAnalysis.directChanges.map(change => 
  `- ${change.type}: ${change.target} (confidence: ${(change.confidence * 100).toFixed(0)}%)`
).join('\n')}

**Cascade Changes**: ${impactAnalysis.cascadeChanges.length}
${impactAnalysis.cascadeChanges.map(change => 
  `- ${change.type}: ${change.reason} (${change.required ? 'required' : 'optional'})`
).join('\n')}`;
  }
  
  private buildPreservationRequirements(impactAnalysis: ChangeImpactAnalysis): string {
    const criticalRules = impactAnalysis.preservationRules.filter(rule => rule.critical);
    const importantRules = impactAnalysis.preservationRules.filter(rule => !rule.critical);
    
    let content = `## PRESERVATION REQUIREMENTS\n\n`;
    
    if (criticalRules.length > 0) {
      content += `**CRITICAL (Must Preserve)**:\n`;
      content += criticalRules.map(rule => `- ${rule.description}`).join('\n');
      content += '\n\n';
    }
    
    if (importantRules.length > 0) {
      content += `**Important**:\n`;
      content += importantRules.map(rule => `- ${rule.description}`).join('\n');
    }
    
    return content;
  }
  
  private buildCurrentCode(targetComponent: ComponentStructure): string {
    return `## CURRENT CODE

**File**: ${targetComponent.filePath}

\`\`\`${this.getFileExtension(targetComponent.filePath)}
${targetComponent.content || '// No content available'}
\`\`\``;
  }
  
  private buildSpecificRequirements(changeIntent: ChangeIntent, impactAnalysis: ChangeImpactAnalysis): string {
    const requirements: string[] = [];
    
    // Add requirements based on change type
    if (changeIntent.type === 'styling') {
      requirements.push('Focus only on styling properties');
      requirements.push('Do not modify component structure');
    }
    
    if (changeIntent.type === 'layout') {
      requirements.push('Modify layout properties carefully');
      requirements.push('Consider responsive implications');
    }
    
    // Add requirements based on visual changes
    changeIntent.visualEdit?.changes?.forEach(change => {
      if (change.property === 'font-size') {
        requirements.push('Update font-size property only');
        requirements.push('Consider line-height adjustments if needed');
      }
      
      if (change.property === 'color') {
        requirements.push('Update color property only');
        requirements.push('Ensure sufficient contrast');
      }
    });
    
    return requirements.map(req => `- ${req}`).join('\n');
  }
  
  private buildMinimalChangeDescription(changeIntent: ChangeIntent): string {
    if (!changeIntent.visualEdit?.changes) {
      return `Apply: ${changeIntent.description}`;
    }
    
    return changeIntent.visualEdit.changes.map(change => 
      `**${change.property}**: Change from \`${change.before}\` to \`${change.after}\` ONLY`
    ).join('\n');
  }
  
  private buildConfidenceFactors(confidenceAssessment: ChangeConfidenceAssessment): string {
    const factors = confidenceAssessment.factors;
    
    return `**Visual Clarity**: ${(factors.visualClarity * 100).toFixed(0)}% - ${this.getFactorDescription('visual', factors.visualClarity)}
**Component Understanding**: ${(factors.componentUnderstanding * 100).toFixed(0)}% - ${this.getFactorDescription('component', factors.componentUnderstanding)}
**Change Complexity**: ${(factors.changeComplexity * 100).toFixed(0)}% - ${this.getFactorDescription('complexity', factors.changeComplexity)}
**Context Completeness**: ${(factors.contextCompleteness * 100).toFixed(0)}% - ${this.getFactorDescription('context', factors.contextCompleteness)}

**Overall Risk**: ${confidenceAssessment.riskLevel}
**Fallback Strategies**: ${confidenceAssessment.fallbackStrategies.join(', ')}`;
  }
  
  private getFactorDescription(type: string, value: number): string {
    const level = value > 0.8 ? 'Excellent' : value > 0.6 ? 'Good' : value > 0.4 ? 'Fair' : 'Poor';
    
    const descriptions = {
      visual: {
        'Excellent': 'Clear visual intent with specific changes',
        'Good': 'Well-defined visual changes',
        'Fair': 'Somewhat clear visual intent',
        'Poor': 'Unclear or vague visual changes'
      },
      component: {
        'Excellent': 'Component fully analyzed and understood',
        'Good': 'Component well understood',
        'Fair': 'Component partially understood',
        'Poor': 'Component poorly understood'
      },
      complexity: {
        'Excellent': 'Very simple change',
        'Good': 'Simple change',
        'Fair': 'Moderate complexity',
        'Poor': 'High complexity change'
      },
      context: {
        'Excellent': 'Complete repository context available',
        'Good': 'Good repository context',
        'Fair': 'Partial repository context',
        'Poor': 'Limited repository context'
      }
    };
    
    const typeDescriptions = descriptions[type as keyof typeof descriptions];
    if (typeDescriptions && typeof typeDescriptions === 'object') {
      return (typeDescriptions as any)[level] || level;
    }
    return level;
  }
  
  private describeComponentPatterns(symbolicRepo: RepoSymbolicModel): string {
    const patterns = symbolicRepo.componentPatterns;
    
    return `- File Pattern: ${patterns.filePattern.source}
- Naming Convention: ${patterns.namingConvention}
- Import Patterns: ${patterns.importPatterns.slice(0, 3).join(', ')}${patterns.importPatterns.length > 3 ? '...' : ''}
- Export Patterns: ${patterns.exportPatterns.slice(0, 3).join(', ')}${patterns.exportPatterns.length > 3 ? '...' : ''}`;
  }
  
  private describeStylingPatterns(symbolicRepo: RepoSymbolicModel): string {
    const patterns = symbolicRepo.stylingPatterns;
    
    let description = '';
    
    if (patterns.fontSize) {
      const fontSizes = Object.keys(patterns.fontSize.values).slice(0, 5);
      description += `- Font Sizes: ${fontSizes.join(', ')}${Object.keys(patterns.fontSize.values).length > 5 ? '...' : ''}\n`;
    }
    
    if (patterns.color) {
      const colors = Object.keys(patterns.color.values).slice(0, 5);
      description += `- Colors: ${colors.join(', ')}${Object.keys(patterns.color.values).length > 5 ? '...' : ''}\n`;
    }
    
    if (patterns.spacing) {
      const spacing = Object.keys(patterns.spacing.values).slice(0, 5);
      description += `- Spacing: ${spacing.join(', ')}${Object.keys(patterns.spacing.values).length > 5 ? '...' : ''}\n`;
    }
    
    return description || '- No specific patterns detected';
  }
  
  private getFileExtension(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    const mappings: Record<string, string> = {
      'tsx': 'tsx',
      'jsx': 'jsx',
      'ts': 'typescript',
      'js': 'javascript'
    };
    
    return mappings[ext || ''] || 'javascript';
  }
  
  private estimateTokens(content: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(content.length / 4);
  }
  
  private estimateResponseTokens(impactAnalysis: ChangeImpactAnalysis): number {
    // Estimate based on expected scope
    const baseTokens = 500; // Base response size
    const scopeMultiplier = {
      'minimal': 1,
      'moderate': 2,
      'significant': 3,
      'major': 4
    };
    
    return baseTokens * (scopeMultiplier[impactAnalysis.expectedScope.changeType] || 1);
  }
}
