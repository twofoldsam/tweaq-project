/**
 * Agent V3 Core Types
 * Two-agent system with strategic planning and code implementation
 */

// ============================================================================
// VISUAL EDIT TYPES (from existing system)
// ============================================================================

export interface VisualEdit {
  id: string;
  timestamp: number;
  sessionId?: string;
  element: {
    selector: string;
    tagName: string;
    id?: string;
    className?: string;
    textContent?: string;
    computedStyles?: Record<string, string>;
    boundingRect?: { x: number; y: number; width: number; height: number; };
    componentPath?: string;
    componentName?: string;
  };
  changes: Array<{
    property: string;
    before: string;
    after: string;
    category: 'layout' | 'typography' | 'color' | 'spacing' | 'border' | 'background' | 'animation' | 'other';
    impact: 'visual' | 'structural' | 'behavioral';
    confidence: number;
  }>;
  intent: {
    description: string;
    userAction: 'direct-edit' | 'copy-from' | 'suggested' | 'batch-operation';
    relatedEdits?: string[];
  };
  validation?: {
    applied: boolean;
    errors?: string[];
    warnings?: string[];
  };
}

// ============================================================================
// SYMBOLIC REPOSITORY REPRESENTATION
// ============================================================================

export interface SymbolicRepo {
  metadata: {
    framework: 'react' | 'vue' | 'svelte' | 'angular' | 'mixed' | 'unknown';
    buildSystem: 'vite' | 'webpack' | 'next' | 'cra' | 'unknown';
    stylingSystem: 'css' | 'scss' | 'styled-components' | 'tailwind' | 'css-modules' | 'unknown';
    packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
    hasTypeScript: boolean;
    hasStorybook: boolean;
    hasTests: boolean;
    hasDesignSystem: boolean;
  };
  
  structure: {
    components: ComponentInfo[];
    pages: PageInfo[];
    styles: StyleInfo[];
    config: ConfigInfo[];
    directories: DirectoryInfo[];
  };
  
  mappings: {
    domToComponent: Map<string, ComponentInfo>;
    componentDependencies: Map<string, string[]>;
    styleRelationships: Map<string, string[]>;
    importGraph: Map<string, string[]>;
  };
  
  analysis: {
    totalFiles: number;
    componentCount: number;
    complexityScore: number;
    lastAnalyzed: Date;
    confidence: number;
  };
}

export interface ComponentInfo {
  name: string;
  filePath: string;
  framework: 'react' | 'vue' | 'svelte' | 'angular';
  exports: string[];
  props: PropInfo[];
  styling: ComponentStyling;
  dependencies: string[];
  domElements: DOMElementInfo[];
  complexity: 'low' | 'medium' | 'high';
  isPage: boolean;
  isShared: boolean;
}

export interface PropInfo {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: any;
  description?: string;
}

export interface ComponentStyling {
  approach: 'css-classes' | 'inline-styles' | 'css-modules' | 'styled-components' | 'tailwind';
  classes: string[];
  styleFiles: string[];
  inlineStyles: Record<string, string>;
  hasCustomCSS: boolean;
  usesDesignSystem: boolean;
}

export interface DOMElementInfo {
  tagName: string;
  selector: string;
  classes: string[];
  styles: Record<string, string>;
  lineNumber?: number;
  confidence: number;
}

export interface PageInfo {
  name: string;
  filePath: string;
  route?: string;
  components: string[];
  isPublic: boolean;
}

export interface StyleInfo {
  filePath: string;
  type: 'css' | 'scss' | 'less' | 'styled-components';
  classes: Record<string, string>;
  variables: Record<string, string>;
  imports: string[];
  isGlobal: boolean;
  isDesignSystem: boolean;
}

export interface ConfigInfo {
  filePath: string;
  type: 'package.json' | 'tsconfig.json' | 'vite.config' | 'webpack.config' | 'tailwind.config' | 'other';
  content: any;
  affects: string[];
}

export interface DirectoryInfo {
  path: string;
  type: 'components' | 'pages' | 'styles' | 'utils' | 'hooks' | 'services' | 'other';
  fileCount: number;
  primaryPurpose: string;
}

// ============================================================================
// STRATEGIC DECISIONS (Agent 1 Output)
// ============================================================================

export interface StrategicDecision {
  id: string;
  type: 'component-selection' | 'styling-approach' | 'file-strategy' | 'pr-strategy';
  decision: string;
  reasoning: string;
  confidence: number;
  alternatives: Array<{
    option: string;
    pros: string[];
    cons: string[];
    score: number;
  }>;
  impact: {
    filesAffected: string[];
    componentsAffected: string[];
    riskLevel: 'low' | 'medium' | 'high';
    complexityIncrease: number;
  };
}

export interface ComponentSelectionDecision extends StrategicDecision {
  type: 'component-selection';
  selectedComponent: ComponentInfo;
  rejectedComponents: Array<{
    component: ComponentInfo;
    reason: string;
  }>;
}

export interface StylingApproachDecision extends StrategicDecision {
  type: 'styling-approach';
  approach: 'inline' | 'css-file' | 'css-module' | 'styled-component' | 'design-system';
  targetFiles: string[];
  cascadeEffects: string[];
}

export interface PRStrategyDecision extends StrategicDecision {
  type: 'pr-strategy';
  numberOfPRs: number;
  prGroups: Array<{
    title: string;
    description: string;
    tickets: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
}

// ============================================================================
// IMPLEMENTATION TICKETS (Agent 1 → Agent 2)
// ============================================================================

export interface ImplementationTicket {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  
  context: {
    visualEdit: VisualEdit;
    targetComponent: ComponentInfo;
    strategicDecisions: StrategicDecision[];
    repositoryContext: {
      framework: string;
      stylingSystem: string;
      relatedComponents: ComponentInfo[];
      affectedFiles: string[];
    };
  };
  
  implementation: {
    approach: 'inline' | 'css-file' | 'css-module' | 'styled-component' | 'design-system' | 'new-component';
    filesToRead: string[];
    filesToModify: string[];
    expectedChanges: ExpectedChange[];
    complexity: 'low' | 'medium' | 'high';
    estimatedTime: number; // in minutes
  };
  
  validation: {
    testsToRun: string[];
    buildRequired: boolean;
    lintingRequired: boolean;
    reviewRequired: boolean;
    rollbackPlan: string;
  };
  
  metadata: {
    createdBy: 'agent-1';
    createdAt: Date;
    assignedTo?: 'agent-2';
    status: 'created' | 'assigned' | 'in-progress' | 'completed' | 'failed';
    retryCount: number;
  };
}

export interface ExpectedChange {
  filePath: string;
  changeType: 'modify' | 'create' | 'delete';
  description: string;
  codeSnippet?: string;
  lineRange?: { start: number; end: number };
  dependencies: string[];
}

// ============================================================================
// AGENT INTERFACES
// ============================================================================

export interface Agent1Config {
  llmProvider: {
    generateText: (prompt: string) => Promise<string>;
  };
  symbolicRepo: SymbolicRepo;
  maxDecisionTime: number; // in ms
  confidenceThreshold: number;
}

export interface Agent2Config {
  llmProvider: {
    generateText: (prompt: string) => Promise<string>;
  };
  githubAccess: {
    readFiles: (paths: string[]) => Promise<Map<string, string>>;
    writeFiles: (changes: FileChange[]) => Promise<void>;
    createPR: (branch: string, title: string, body: string) => Promise<PRResult>;
  };
  workspace: {
    owner: string;
    repo: string;
    baseBranch: string;
  };
  maxImplementationTime: number; // in ms
}

export interface FileChange {
  filePath: string;
  action: 'modify' | 'create' | 'delete';
  oldContent?: string;
  newContent: string;
  reasoning: string;
}

export interface PRResult {
  success: boolean;
  prUrl?: string;
  branchName: string;
  commitSha?: string;
  error?: string;
}

// ============================================================================
// AGENT RESULTS
// ============================================================================

export interface Agent1Result {
  success: boolean;
  decisions: StrategicDecision[];
  tickets: ImplementationTicket[];
  reasoning: string;
  confidence: number;
  processingTime: number;
  error?: string;
}

export interface Agent2Result {
  success: boolean;
  implementedTickets: ImplementationTicket[];
  fileChanges: FileChange[];
  prResults: PRResult[];
  validation: {
    syntaxValid: boolean;
    testsPass: boolean;
    buildSucceeds: boolean;
    issues: string[];
  };
  processingTime: number;
  error?: string;
}

export interface AgentV3Result {
  success: boolean;
  agent1Result: Agent1Result;
  agent2Result: Agent2Result;
  totalProcessingTime: number;
  prUrls: string[];
  summary: string;
  error?: string;
}

// ============================================================================
// REPOSITORY ANALYSIS TYPES
// ============================================================================

export interface RepoAnalysisConfig {
  owner: string;
  repo: string;
  baseBranch: string;
  githubToken: string;
  analysisDepth: 'basic' | 'comprehensive' | 'deep' | 'shallow';
  cacheEnabled: boolean;
  maxFiles: number;
}

export interface RepoAnalysisResult {
  success: boolean;
  symbolicRepo?: SymbolicRepo;
  analysisTime: number;
  filesAnalyzed: number;
  confidence: number;
  errors: string[];
  warnings: string[];
}
