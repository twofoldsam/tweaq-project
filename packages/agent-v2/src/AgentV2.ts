import { VisualEdit } from './types';
import { 
  AgentV2Config, 
  AgentResult, 
  ProjectStructure, 
  ChangeAnalysis,
  StyleImpactAnalysis,
  PRStrategy,
  ExecutionPlan,
  PRResult
} from './types';
import { WorkspaceManager } from './workspace/WorkspaceManager';
import { CodeIntelligence } from './intelligence/CodeIntelligence';
import { StrategicDecisions } from './actions/StrategicDecisions';
import { CodeGenerator } from './actions/CodeGenerator';
import { Validator } from './actions/Validator';
import { PRManager } from './git/PRManager';

export class AgentV2 {
  private workspace: WorkspaceManager;
  private codeIntelligence: CodeIntelligence;
  private strategicDecisions: StrategicDecisions;
  private codeGenerator: CodeGenerator;
  private validator: Validator;
  private prManager: PRManager;

  /**
   * Static factory method to create AgentV2 instances
   */
  static create(config: AgentV2Config): AgentV2 {
    return new AgentV2(config);
  }

  constructor(private config: AgentV2Config) {
    // Create repo config from workspace config
    const repoConfig = {
      owner: config.workspace.owner,
      repo: config.workspace.repo,
      baseBranch: config.workspace.baseBranch,
      githubToken: config.workspace.githubToken
    };

    this.workspace = new WorkspaceManager(repoConfig);
    this.codeIntelligence = new CodeIntelligence(''); // Will be set during workspace setup
    this.strategicDecisions = new StrategicDecisions(config.llmProvider);
    this.codeGenerator = new CodeGenerator(config.llmProvider, this.workspace);
    this.validator = new Validator('', {} as any); // Will be set during processing
    this.prManager = new PRManager(repoConfig, null as any, ''); // Will be set during processing
  }

  /**
   * Main entry point - process visual edits and create PR
   */
  async processVisualEdits(visualEdits: VisualEdit[]): Promise<AgentResult> {
    const startTime = Date.now();
    console.log('🚀 AgentV2 starting to process visual edits...');

    try {
      // Phase 1: Setup Workspace
      console.log('\n📁 Phase 1: Setting up workspace...');
      const workspace = await this.workspace.createWorkspace(this.config.workspace);
      
      // Phase 2: Analyze Project Structure
      console.log('\n🧠 Phase 2: Analyzing project structure...');
      const projectStructure = await this.codeIntelligence.analyzeProject();
      
      // Phase 3: Create Working Branch
      console.log('\n🌿 Phase 3: Creating working branch...');
      const branchDescription = this.generateBranchDescription(visualEdits);
      await this.workspace.createWorkingBranch(branchDescription);
      
      // Phase 4: Strategic Decision Making
      console.log('\n🎯 Phase 4: Making strategic decisions...');
      const changeAnalysis = await this.strategicDecisions.evaluateChangeIntent(visualEdits, projectStructure);
      
      const styleImpactAnalysis = await this.strategicDecisions.analyzeStyleImpact(
        changeAnalysis.changeIntents, 
        projectStructure
      );
      
      await this.strategicDecisions.determinePRStrategy(
        changeAnalysis.changeIntents,
        styleImpactAnalysis
      );

      // Phase 5: Create Execution Plan
      console.log('\n📋 Phase 5: Creating execution plan...');
      const executionPlan = await this.codeGenerator.createExecutionPlan(
        changeAnalysis.changeIntents,
        styleImpactAnalysis,
        projectStructure
      );

      // Phase 6: Generate Code Changes
      console.log('\n🔧 Phase 6: Generating code changes...');
      const fileChanges = await this.codeGenerator.generateChanges(executionPlan, projectStructure);

      // Phase 7: Validate Changes
      console.log('\n🔍 Phase 7: Validating changes...');
      const validation = await this.validator.validateChanges(fileChanges, projectStructure);

      // Phase 8: Create Pull Request(s)
      let prResults: PRResult[] = [];
      if (validation.score >= this.config.confidenceThreshold) {
        console.log('\n🚀 Phase 8: Creating pull request(s)...');
        prResults = await this.prManager.createPullRequests(executionPlan, fileChanges, validation);
      } else {
        console.log('\n⚠️ Phase 8: Skipping PR creation due to low validation score');
      }

      // Phase 9: Cleanup (if configured)
      console.log('\n🧹 Phase 9: Cleaning up...');
      if (!this.config.workspace.workingDirectory) {
        // Only cleanup if we created a temporary workspace
        await this.workspace.cleanup();
      }

      const processingTime = Date.now() - startTime;
      console.log(`\n✅ AgentV2 completed in ${processingTime}ms`);

      return {
        success: true,
        workspace,
        executionPlan,
        fileChanges,
        validation,
        prResult: prResults[0] || undefined, // Return first PR result
        metadata: {
          processingTime,
          decisionsCount: changeAnalysis.changeIntents.length,
          changesCount: fileChanges.length
        }
      };

    } catch (error) {
      console.error('❌ AgentV2 failed:', error);
      
      // Cleanup on error
      try {
        await this.workspace.cleanup();
      } catch (cleanupError) {
        console.warn('⚠️ Cleanup failed:', cleanupError);
      }

      return {
        success: false,
        workspace: this.workspace.getCurrentWorkspace()!,
        executionPlan: {} as ExecutionPlan,
        fileChanges: [],
        validation: {
          syntaxValid: false,
          buildsSuccessfully: false,
          testsPass: false,
          lintingPasses: false,
          issues: [{
            type: 'runtime',
            severity: 'error',
            file: 'agent',
            message: error instanceof Error ? error.message : 'Unknown error'
          }],
          score: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime,
          decisionsCount: 0,
          changesCount: 0
        }
      };
    }
  }

  /**
   * Process visual edits with enhanced component discovery
   */
  async processVisualEditsWithComponentMapping(
    visualEdits: VisualEdit[]
  ): Promise<AgentResult> {
    console.log('🔍 Enhanced processing with component mapping...');
    
    // First, setup workspace and analyze project
    await this.workspace.createWorkspace(this.config.workspace);
    const projectStructure = await this.codeIntelligence.analyzeProject();
    
    // Enhance visual edits with component mapping
    const enhancedEdits = await this.enhanceVisualEditsWithComponents(visualEdits, projectStructure);
    
    // Continue with normal processing
    return this.processVisualEdits(enhancedEdits);
  }

  /**
   * Enhance visual edits with component mapping
   */
  private async enhanceVisualEditsWithComponents(
    visualEdits: VisualEdit[],
    projectStructure: ProjectStructure
  ): Promise<VisualEdit[]> {
    const enhancedEdits: VisualEdit[] = [];
    
    for (const edit of visualEdits) {
      const component = await this.codeIntelligence.findComponentForElement(
        edit.element,
        projectStructure
      );
      
      const enhancedEdit: VisualEdit = {
        ...edit,
        element: {
          ...edit.element,
          componentPath: component?.filePath || undefined,
          componentName: component?.name || undefined
        }
      };
      
      enhancedEdits.push(enhancedEdit);
    }
    
    return enhancedEdits;
  }

  /**
   * Generate branch description from visual edits
   */
  private generateBranchDescription(visualEdits: VisualEdit[]): string {
    if (visualEdits.length === 1) {
      return visualEdits[0].intent?.description || 'visual-update';
    }
    
    const uniqueElements = new Set(visualEdits.map(edit => edit.element.tagName));
    if (uniqueElements.size === 1) {
      const tagName = Array.from(uniqueElements)[0];
      return `update-${tagName?.toLowerCase() || 'element'}-styling`;
    }
    
    return `${visualEdits.length}-visual-updates`;
  }

  /**
   * Get current workspace status
   */
  getCurrentWorkspace() {
    return this.workspace.getCurrentWorkspace();
  }

  /**
   * Validate configuration
   */
  static validateConfig(config: AgentV2Config): string[] {
    const errors: string[] = [];
    
    if (!config.workspace.owner) errors.push('workspace.owner is required');
    if (!config.workspace.repo) errors.push('workspace.repo is required');
    if (!config.workspace.githubToken) errors.push('workspace.githubToken is required');
    if (!config.llmProvider) errors.push('llmProvider is required');
    if (!config.llmProvider.generateText) errors.push('llmProvider.generateText is required');
    
    if (config.confidenceThreshold < 0 || config.confidenceThreshold > 1) {
      errors.push('confidenceThreshold must be between 0 and 1');
    }
    
    if (config.maxIterations < 1) {
      errors.push('maxIterations must be at least 1');
    }
    
    return errors;
  }

  /**
   * Create agent with validated configuration
   */
  static create(config: AgentV2Config): AgentV2 {
    const errors = AgentV2.validateConfig(config);
    if (errors.length > 0) {
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }
    
    return new AgentV2(config);
  }

  /**
   * Get agent capabilities and status
   */
  getCapabilities() {
    return {
      supportedFrameworks: ['react', 'vue', 'svelte', 'angular'],
      supportedBuildSystems: ['vite', 'webpack', 'next', 'nuxt', 'rollup'],
      supportedStylingSystems: ['css', 'scss', 'tailwind', 'styled-components', 'emotion', 'css-modules'],
      features: {
        codeIntelligence: true,
        strategicDecisionMaking: true,
        syntaxValidation: true,
        buildValidation: true,
        testValidation: true,
        lintingValidation: true,
        prCreation: true,
        workspaceManagement: true
      },
      currentWorkspace: this.workspace.getCurrentWorkspace()
    };
  }

  /**
   * Dry run - analyze what would be changed without making actual changes
   */
  async dryRun(visualEdits: VisualEdit[]): Promise<{
    projectStructure: ProjectStructure;
    changeAnalysis: ChangeAnalysis;
    styleImpactAnalysis: StyleImpactAnalysis;
    prStrategy: PRStrategy;
    executionPlan: ExecutionPlan;
  }> {
    console.log('🔍 Running dry run analysis...');
    
    // Setup temporary workspace for analysis
    await this.workspace.createWorkspace(this.config.workspace);
    
    try {
      const projectStructure = await this.codeIntelligence.analyzeProject();
      const changeAnalysis = await this.strategicDecisions.evaluateChangeIntent(visualEdits, projectStructure);
      const styleImpactAnalysis = await this.strategicDecisions.analyzeStyleImpact(
        changeAnalysis.changeIntents,
        projectStructure
      );
      const prStrategy = await this.strategicDecisions.determinePRStrategy(
        changeAnalysis.changeIntents,
        styleImpactAnalysis
      );
      const executionPlan = await this.codeGenerator.createExecutionPlan(
        changeAnalysis.changeIntents,
        styleImpactAnalysis,
        projectStructure
      );

      return {
        projectStructure,
        changeAnalysis,
        styleImpactAnalysis,
        prStrategy,
        executionPlan
      };
    } finally {
      // Always cleanup dry run workspace
      await this.workspace.cleanup();
    }
  }
}
