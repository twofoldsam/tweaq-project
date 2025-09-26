// Import VisualEdit from agent-core or define it locally
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
    rollbackData?: Record<string, string>;
  };
}

// ============================================================================
// WORKSPACE TYPES
// ============================================================================

export interface AgentWorkspace {
  id: string;
  localPath: string;
  remoteOrigin: {
    owner: string;
    repo: string;
    branch: string;
  };
  currentBranch: string;
  isClean: boolean;
}

export interface WorkspaceConfig {
  owner: string;
  repo: string;
  baseBranch?: string;
  githubToken: string;
  workingDirectory?: string;
}

// ============================================================================
// CODE INTELLIGENCE TYPES
// ============================================================================

export interface ProjectStructure {
  framework: 'react' | 'vue' | 'svelte' | 'angular' | 'unknown';
  buildSystem: 'vite' | 'webpack' | 'next' | 'nuxt' | 'rollup' | 'unknown';
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
  stylingSystem: 'css' | 'scss' | 'tailwind' | 'styled-components' | 'emotion' | 'css-modules' | 'unknown';
  components: ComponentInfo[];
  styleFiles: StyleFileInfo[];
  configFiles: ConfigFileInfo[];
}

export interface ComponentInfo {
  name: string;
  filePath: string;
  framework: string;
  exports: string[];
  props: PropInfo[];
  styling: ComponentStyling;
  dependencies: string[];
  domElements: DOMElementInfo[];
}

export interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}

export interface ComponentStyling {
  approach: 'inline' | 'css-modules' | 'styled-components' | 'tailwind' | 'css-classes';
  classes: string[];
  styleFiles: string[];
  inlineStyles: Record<string, any>;
}

export interface StyleFileInfo {
  filePath: string;
  type: 'css' | 'scss' | 'less' | 'stylus';
  classes: string[];
  variables: Record<string, string>;
  imports: string[];
}

export interface DOMElementInfo {
  tagName: string;
  selector: string;
  classes: string[];
  styles: Record<string, string>;
  lineNumber?: number;
}

export interface ConfigFileInfo {
  filePath: string;
  type: 'package.json' | 'tsconfig.json' | 'vite.config' | 'webpack.config' | 'tailwind.config' | 'other';
  content: any;
}

// ============================================================================
// AGENT DECISION TYPES (Preserved from v1)
// ============================================================================

export interface ChangeAnalysis {
  changeIntents: ChangeIntent[];
  complexity: 'simple' | 'medium' | 'complex';
  affectedComponents: string[];
  estimatedChanges: number;
}

export interface ChangeIntent {
  id: string;
  description: string;
  targetComponent: ComponentInfo;
  changeType: 'style' | 'content' | 'structure' | 'behavior';
  complexity: number; // 0-1 scale
  implementationStrategy: ImplementationStrategy;
  changes: PropertyChange[];
}

export interface ImplementationStrategy {
  approach: 'inline' | 'css-file' | 'css-modules' | 'styled-components' | 'new-component';
  reasoning: string;
  affectedFiles: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PropertyChange {
  property: string;
  before: string;
  after: string;
  category: 'layout' | 'typography' | 'color' | 'spacing' | 'border' | 'background' | 'animation' | 'other';
  impact: 'visual' | 'structural' | 'behavioral';
  confidence: number;
}

export interface StyleImpactAnalysis {
  recommendation: 'inline' | 'css-file' | 'css-modules' | 'styled-components';
  reasoning: string;
  impactScore: number; // 0-1, how much this change affects other components
  affectedComponents: string[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

export interface PRStrategy {
  numberOfPRs: number;
  prGroups: PRGroup[];
  strategy: 'single' | 'component-based' | 'feature-based';
  reasoning: string;
  totalComplexity: number;
}

export interface PRGroup {
  id: string;
  title: string;
  description: string;
  changes: ChangeIntent[];
  priority: 'high' | 'medium' | 'low';
  dependencies: string[]; // IDs of other PR groups this depends on
}

// ============================================================================
// EXECUTION TYPES
// ============================================================================

export interface ExecutionPlan {
  id: string;
  changeAnalysis: ChangeAnalysis;
  styleImpactAnalysis: StyleImpactAnalysis;
  prStrategy: PRStrategy;
  steps: ExecutionStep[];
  branchName: string;
  estimatedDuration: number; // minutes
}

export interface ExecutionStep {
  id: string;
  type: 'file-modify' | 'file-create' | 'file-delete' | 'dependency-install' | 'test-run';
  description: string;
  targetFile: string;
  action: FileAction;
  dependencies: string[]; // Step IDs this depends on
}

export interface FileAction {
  type: 'modify' | 'create' | 'delete';
  filePath: string;
  content?: string;
  modifications?: CodeModification[];
}

export interface CodeModification {
  type: 'replace' | 'insert' | 'delete';
  location: {
    line?: number;
    column?: number;
    selector?: string; // CSS selector or AST selector
  };
  oldContent?: string;
  newContent?: string;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  syntaxValid: boolean;
  buildsSuccessfully: boolean;
  testsPass: boolean;
  lintingPasses: boolean;
  issues: ValidationIssue[];
  score: number; // 0-1 overall quality score
}

export interface ValidationIssue {
  type: 'syntax' | 'build' | 'test' | 'lint' | 'runtime';
  severity: 'error' | 'warning' | 'info';
  file: string;
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
}

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface FileChange {
  filePath: string;
  action: 'modify' | 'create' | 'delete';
  oldContent?: string;
  newContent?: string;
  diff?: string;
}

export interface PRResult {
  success: boolean;
  prUrl?: string;
  prNumber?: number;
  branchName: string;
  commitSha: string;
  filesChanged: string[];
  validation: ValidationResult;
  error?: string;
}

export interface AgentResult {
  success: boolean;
  workspace: AgentWorkspace;
  executionPlan: ExecutionPlan;
  fileChanges: FileChange[];
  validation: ValidationResult;
  prResult?: PRResult | undefined;
  error?: string;
  metadata: {
    processingTime: number;
    decisionsCount: number;
    changesCount: number;
  };
}

// ============================================================================
// AGENT CONFIGURATION
// ============================================================================

export interface AgentV2Config {
  workspace: {
    owner: string;
    repo: string;
    baseBranch: string;
    githubToken: string;
  };
  llmProvider: {
    generateText(prompt: string): Promise<string>;
  };
  validation?: {
    runTests?: boolean;
    runLinting?: boolean;
    buildCheck?: boolean;
  };
  prSettings?: {
    autoMerge?: boolean;
    reviewRequired?: boolean;
    branchNaming?: string; // Template like "agent/{timestamp}-{description}"
  };
  maxIterations?: number;
  confidenceThreshold?: number;
}
