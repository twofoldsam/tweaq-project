// Re-export types that we need (avoiding external dependencies for now)
export interface VisualEdit {
  id: string;
  element: {
    tagName: string;
    selector: string;
    className?: string;
  };
  changes: Array<{
    property: string;
    before: string;
    after: string;
    category: 'styling' | 'layout' | 'structure' | 'content';
    impact: 'low' | 'medium' | 'high';
  }>;
  intent?: {
    description: string;
  };
}

export interface ComponentStructure {
  name: string;
  filePath: string;
  framework: string;
  complexity: 'simple' | 'moderate' | 'complex';
  exports?: string[];
  imports?: string[];
  props?: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
  styling: {
    approach: 'tailwind' | 'css-modules' | 'styled-components' | 'css' | 'scss';
    classes?: string[];
    customProperties?: string[];
    inlineStyles: boolean;
  };
  content?: string;
}

export interface RepoSymbolicModel {
  repoId: string;
  analyzedAt: Date;
  version: string;
  primaryFramework: 'react' | 'vue' | 'svelte' | 'angular' | 'mixed';
  frameworkVersions: Record<string, string>;
  stylingApproach: 'tailwind' | 'css-modules' | 'styled-components' | 'css' | 'scss' | 'mixed';
  tailwindConfig?: any;
  cssVariables: Map<string, string>;
  customClasses: Map<string, any>;
  components: ComponentStructure[];
  componentPatterns: {
    filePattern: RegExp;
    importPatterns: string[];
    exportPatterns: string[];
    namingConvention: 'PascalCase' | 'camelCase' | 'kebab-case';
  };
  stylingPatterns: {
    fontSize: { property: string; values: Record<string, number>; confidence: number };
    color: { property: string; values: Record<string, number>; confidence: number };
    spacing: { property: string; values: Record<string, number>; confidence: number };
    layout: { property: string; values: Record<string, number>; confidence: number };
  };
  domMappings: Map<string, Array<{
    filePath: string;
    componentName: string;
    confidence: number;
    elementType: string;
    selector: string;
  }>>;
  transformationRules: any[];
  designTokens?: {
    colors?: Record<string, string>;
    spacing?: Record<string, string>;
    typography?: Record<string, string>;
  };
  librariesDetected?: string[];
  fileHashes: Map<string, string>;
  lastModified: Date;
  analysis: {
    totalFiles: number;
    componentCount: number;
    complexityScore: number;
    lastAnalyzed: Date;
    confidence: number;
  };
}

export interface ChangeIntent {
  id: string;
  type: string;
  description: string;
  visualEdit?: VisualEdit;
  targetComponent?: ComponentStructure;
  changeScope?: any;
  relatedChanges?: any[];
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high';
}

export interface FileChange {
  filePath: string;
  action: 'create' | 'modify' | 'delete';
  oldContent?: string;
  newContent: string;
  reasoning?: string;
}

// ============================================================================
// CORE INTELLIGENCE TYPES
// ============================================================================

export interface ChangeConfidenceAssessment {
  confidence: number; // 0-1 scale
  factors: {
    visualClarity: number;
    componentUnderstanding: number;
    changeComplexity: number;
    contextCompleteness: number;
  };
  recommendedApproach: ChangeApproach;
  fallbackStrategies: ChangeApproach[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export type ChangeApproach = 
  | 'high-confidence-direct'
  | 'medium-confidence-guided'
  | 'low-confidence-conservative'
  | 'very-low-confidence-human-review';

export interface ChangeImpactAnalysis {
  directChanges: DirectChange[];
  cascadeChanges: CascadeChange[];
  preservationRules: PreservationRule[];
  validationChecks: ValidationCheck[];
  expectedScope: ChangeScope;
}

export interface DirectChange {
  type: 'style' | 'structure' | 'content' | 'props';
  target: string; // CSS selector or component property
  oldValue: string;
  newValue: string;
  confidence: number;
}

export interface CascadeChange {
  type: 'related-component' | 'parent-container' | 'child-element' | 'sibling-element';
  target: string;
  reason: string;
  required: boolean;
  confidence: number;
}

export interface PreservationRule {
  type: 'functionality' | 'interface' | 'imports' | 'exports' | 'structure';
  description: string;
  pattern: string | RegExp;
  critical: boolean;
}

export interface ValidationCheck {
  type: 'syntax' | 'intent-alignment' | 'preservation' | 'scope' | 'build';
  description: string;
  validator: string; // Function name or validation rule
  required: boolean;
}

export interface ChangeScope {
  expectedLines: number;
  expectedFiles: number;
  changeType: 'minimal' | 'moderate' | 'significant' | 'major';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  passed: boolean;
  confidence: number;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  metrics: ValidationMetrics;
}

export interface ValidationIssue {
  type: 'syntax' | 'intent-mismatch' | 'preservation-violation' | 'scope-exceeded';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: {
    line: number;
    column: number;
    file: string;
  };
  suggestion?: string;
}

export interface ValidationWarning {
  type: string;
  message: string;
  suggestion?: string;
}

export interface ValidationMetrics {
  linesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  filesModified: number;
  changeRatio: number; // percentage of file changed
  complexityDelta: number; // change in code complexity
}

// ============================================================================
// REASONING ENGINE TYPES
// ============================================================================

export interface ReasoningContext {
  visualEdit: VisualEdit;
  targetComponent: ComponentStructure;
  symbolicRepo: RepoSymbolicModel;
  changeHistory?: ChangeHistoryEntry[];
  userPreferences?: UserPreferences;
}

export interface ChangeHistoryEntry {
  timestamp: Date;
  visualEdit: VisualEdit;
  approach: ChangeApproach;
  confidence: number;
  success: boolean;
  issues?: string[];
}

export interface UserPreferences {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  changeStyle: 'minimal' | 'comprehensive';
  reviewPreference: 'always' | 'low-confidence-only' | 'never';
}

// ============================================================================
// STRATEGY TYPES
// ============================================================================

export interface ChangeStrategy {
  approach: ChangeApproach;
  confidence: number;
  steps: ChangeStep[];
  validationLevel: 'basic' | 'standard' | 'strict' | 'paranoid';
  fallbackStrategy?: ChangeStrategy;
}

export interface ChangeStep {
  type: 'analyze' | 'generate' | 'validate' | 'apply' | 'verify';
  description: string;
  required: boolean;
  timeout?: number;
}

// ============================================================================
// PROMPT BUILDING TYPES
// ============================================================================

export interface PromptContext {
  changeIntent: ChangeIntent;
  confidenceAssessment: ChangeConfidenceAssessment;
  impactAnalysis: ChangeImpactAnalysis;
  symbolicRepo: RepoSymbolicModel;
  targetComponent: ComponentStructure;
  relatedComponents?: ComponentStructure[];
}

export interface GeneratedPrompt {
  content: string;
  metadata: {
    approach: ChangeApproach;
    confidence: number;
    contextTokens: number;
    expectedResponseTokens: number;
  };
}

// ============================================================================
// AGENT V4 CONFIGURATION
// ============================================================================

export interface AgentV4Config {
  // LLM Configuration
  llmProvider: any; // LLM provider instance
  
  // Confidence Thresholds
  confidenceThresholds: {
    highConfidence: number; // 0.8
    mediumConfidence: number; // 0.6
    lowConfidence: number; // 0.4
  };
  
  // Validation Configuration
  validation: {
    enableSyntaxCheck: boolean;
    enableIntentAlignment: boolean;
    enablePreservationCheck: boolean;
    enableScopeCheck: boolean;
    enableBuildCheck: boolean;
    strictMode: boolean;
  };
  
  // Strategy Configuration
  strategies: {
    maxRetries: number;
    fallbackEnabled: boolean;
    humanReviewThreshold: number;
  };
  
  // Performance Configuration
  performance: {
    maxContextTokens: number;
    parallelValidation: boolean;
    cacheEnabled: boolean;
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// All types are defined above and exported individually
