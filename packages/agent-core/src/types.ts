/**
 * Agent Core Types
 * 
 * Defines the core interfaces and types for the autonomous agent system
 */

// Optimized Visual Edit structure - now the primary interface
export interface VisualEdit {
  id: string;
  timestamp: number;
  sessionId?: string;
  
  // Enhanced element context
  element: {
    selector: string;
    tagName: string;
    id?: string;
    className?: string;
    textContent?: string;
    computedStyles?: Record<string, string>;
    boundingRect?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    // Component context
    componentPath?: string;
    componentName?: string;
  };
  
  // Enhanced changes with categorization
  changes: Array<{
    property: string;
    before: string;
    after: string;
    category: 'layout' | 'typography' | 'color' | 'spacing' | 'border' | 'background' | 'animation' | 'other';
    impact: 'visual' | 'structural' | 'behavioral';
    confidence: number;
  }>;
  
  // User intent context
  intent: {
    description: string;
    userAction: 'direct-edit' | 'copy-from' | 'suggested' | 'batch-operation';
    relatedEdits?: string[];
  };
  
  // Validation context
  validation?: {
    applied: boolean;
    errors?: string[];
    warnings?: string[];
    rollbackData?: Record<string, string>;
  };
}

export interface VisualEditSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  edits: VisualEdit[];
  
  // Session context
  context: {
    url: string;
    viewport: { width: number; height: number };
    userAgent: string;
    framework?: string;
    stylingSystem?: string;
  };
  
  // User workflow patterns
  workflow?: {
    totalEditTime: number;
    editSequence: string[]; // Order of edit IDs
    batchOperations: Array<{
      type: 'multi-select' | 'copy-paste' | 'bulk-change';
      editIds: string[];
    }>;
  };
}

export interface Repository {
  path: string;
  structure: FileStructure;
  framework: string;
  stylingSystem: 'vanilla-css' | 'tailwind' | 'styled-components' | 'css-modules';
  components: ComponentInfo[];
}

export interface FileStructure {
  components: string[];
  styles: string[];
  pages: string[];
  utils: string[];
}

export interface ComponentInfo {
  name: string;
  path: string;
  dependencies: string[];
  styleFiles: string[];
  usedBy: string[];
}

export interface ChangeIntent {
  id: string;
  description: string;
  targetElement: VisualEdit['element'];
  changes: VisualEdit['changes'];
  complexity: 'simple' | 'moderate' | 'complex';
  scope: 'component' | 'global' | 'multiple-components';
  
  // Enhanced context
  category: 'styling' | 'layout' | 'content' | 'interaction' | 'structure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[]; // Other change intent IDs this depends on
  conflicts?: string[]; // Change intent IDs this conflicts with
  
  // User intent analysis
  userGoal?: {
    description: string;
    confidence: number;
    alternatives?: string[];
  };
  
  // Technical analysis
  technicalDetails?: {
    affectedFiles: string[];
    estimatedComplexity: number;
    riskFactors: string[];
    testingRequirements: string[];
  };
}

export interface StyleImpactAnalysis {
  changeIntentId: string;
  affectedComponents: string[];
  globalStyleChanges: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: 'inline' | 'style-file' | 'new-class' | 'css-variable' | 'component-prop';
  reasoning: string;
  
  // Enhanced analysis
  cascadeEffects?: {
    directlyAffected: string[];
    indirectlyAffected: string[];
    potentialBreaking: string[];
  };
  
  performanceImpact?: {
    bundleSize: 'increase' | 'decrease' | 'neutral';
    renderPerformance: 'improve' | 'degrade' | 'neutral';
    cacheInvalidation: boolean;
  };
  
  maintainabilityScore?: number; // 0-1 scale
  accessibilityImpact?: {
    colorContrast?: 'improve' | 'degrade' | 'neutral';
    focusability?: 'improve' | 'degrade' | 'neutral';
    screenReader?: 'improve' | 'degrade' | 'neutral';
  };
}

export interface PRStrategy {
  numberOfPRs: number;
  prGroups: Array<{
    id: string;
    changeIntents: string[];
    title: string;
    description: string;
    reasoning: string;
    
    // Enhanced PR context
    priority: 'low' | 'medium' | 'high';
    estimatedReviewTime: number; // minutes
    riskLevel: 'low' | 'medium' | 'high';
    dependencies: string[]; // Other PR group IDs
    testingStrategy: string[];
    rollbackPlan: string;
  }>;
  totalComplexity: number;
  
  // Strategic considerations
  deploymentStrategy?: {
    canParallel: boolean;
    recommendedOrder: string[];
    rollbackDependencies: Record<string, string[]>;
  };
  
  reviewStrategy?: {
    suggestedReviewers: Record<string, string[]>; // PR ID -> reviewer types
    reviewCheckpoints: string[];
    automatedChecks: string[];
  };
}

export interface AgentContext {
  // Input data
  visualEdits: VisualEdit[];
  session?: VisualEditSession;
  repository: Repository;
  
  // File context (retrieved early in the process)
  fileContexts?: Array<{
    filePath: string;
    content: string;
    componentName: string;
    mappingConfidence: number;
  }>;
  
  // Analysis results
  changeIntents: ChangeIntent[];
  styleImpactAnalysis?: StyleImpactAnalysis[];
  prStrategy?: PRStrategy;
  
  // Agent state
  currentState: AgentState;
  history: AgentActionResult[];
  llmProvider?: any;
  
  // Enhanced context
  userContext?: {
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
    preferences: {
      prSize: 'small' | 'medium' | 'large';
      riskTolerance: 'conservative' | 'moderate' | 'aggressive';
      reviewStyle: 'detailed' | 'summary';
    };
    previousSessions?: string[]; // Session IDs for learning
  };
  
  projectContext?: {
    codebase: {
      size: 'small' | 'medium' | 'large';
      complexity: 'simple' | 'moderate' | 'complex';
      testCoverage: number;
      deploymentFrequency: 'daily' | 'weekly' | 'monthly';
    };
    team: {
      size: number;
      reviewerAvailability: 'high' | 'medium' | 'low';
      domainExpertise: string[];
    };
  };
}

export interface AgentState {
  phase: 'analyzing' | 'planning' | 'executing' | 'completed' | 'error';
  currentAction?: string;
  progress: number;
  decisions: Record<string, any>;
  
  // Enhanced state tracking
  startTime?: number;
  estimatedCompletion?: number;
  qualityScore?: number; // 0-1 scale of decision quality
  confidenceScore?: number; // 0-1 scale of agent confidence
}

export interface AgentActionResult {
  actionType: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
  reasoning?: string;
  
  // Enhanced result tracking
  executionTime?: number;
  qualityMetrics?: {
    accuracy: number;
    completeness: number;
    efficiency: number;
  };
  
  learningData?: {
    inputPatterns: string[];
    outputPatterns: string[];
    successFactors: string[];
    improvementAreas: string[];
  };
}

export interface AgentAction {
  type: string;
  name: string;
  description: string;
  
  /**
   * Check if this action can be executed given the current context
   */
  canExecute(context: AgentContext): boolean;
  
  /**
   * Execute the action and return the result
   */
  execute(context: AgentContext): Promise<AgentActionResult>;
  
  /**
   * Priority for action selection (higher = more important)
   */
  priority: number;
  
  /**
   * Dependencies - actions that must complete before this one
   */
  dependencies?: string[];
  
  // Enhanced action metadata
  estimatedDuration?: number; // milliseconds
  resourceRequirements?: {
    llmCalls: number;
    memoryUsage: 'low' | 'medium' | 'high';
    computeIntensive: boolean;
  };
}

export interface AgentDecision {
  action: string;
  reasoning: string;
  confidence: number;
  alternatives: Array<{
    action: string;
    reasoning: string;
    confidence: number;
  }>;
  
  // Enhanced decision context
  decisionFactors?: {
    contextFactors: string[];
    riskFactors: string[];
    opportunityFactors: string[];
  };
  
  expectedOutcome?: {
    successProbability: number;
    potentialIssues: string[];
    mitigationStrategies: string[];
  };
}

export interface AgentConfig {
  llmProvider: any;
  repository: Repository;
  maxIterations?: number;
  confidenceThreshold?: number;
  enableParallelActions?: boolean;
  
  // Enhanced configuration
  learningMode?: boolean;
  debugMode?: boolean;
  
  qualityThresholds?: {
    minConfidence: number;
    maxComplexity: number;
    maxRiskLevel: 'low' | 'medium' | 'high';
  };
  
  preferences?: {
    prStrategy: 'conservative' | 'aggressive' | 'balanced';
    codeStyle: 'strict' | 'flexible';
    performancePriority: 'high' | 'medium' | 'low';
  };
}