/**
 * Symbolic Repository Builder
 * Creates comprehensive symbolic representation of repositories
 */

import { RepoAnalyzer, RepoSymbolicModel } from '@smart-qa/repo-analyzer/dist/index.js';
import { RemoteRepo } from '@smart-qa/github-remote/dist/index.js';
import { 
  SymbolicRepo, 
  ComponentInfo, 
  StyleInfo, 
  ConfigInfo,
  DirectoryInfo,
  RepoAnalysisConfig,
  RepoAnalysisResult,
  DOMElementInfo,
  ComponentStyling,
  PropInfo
} from '../types';

export class SymbolicRepoBuilder {
  private repoAnalyzer: RepoAnalyzer;
  private remoteRepo: RemoteRepo;
  private config: RepoAnalysisConfig;

  constructor(config: RepoAnalysisConfig) {
    this.config = config;
    this.repoAnalyzer = new RepoAnalyzer();
    this.remoteRepo = new RemoteRepo(config.githubToken);
  }

  /**
   * Build comprehensive symbolic representation of repository
   */
  async buildSymbolicRepo(): Promise<RepoAnalysisResult> {
    const startTime = Date.now();
    console.log('🔍 Starting comprehensive repository analysis...');

    try {
      // Phase 1: Use existing RepoAnalyzer for base analysis
      console.log('📊 Phase 1: Base repository analysis...');
      const baseAnalysis = await this.repoAnalyzer.analyzeRepository(
        this.remoteRepo,
        {
          owner: this.config.owner,
          repo: this.config.repo,
          baseBranch: this.config.baseBranch
        },
        {
          cacheEnabled: this.config.cacheEnabled,
          analysisDepth: this.config.analysisDepth === 'basic' ? 'shallow' : this.config.analysisDepth,
          parallelProcessing: true
        }
      );

      if (!baseAnalysis.success || !baseAnalysis.model) {
        throw new Error(`Base analysis failed: ${baseAnalysis.errors.join(', ')}`);
      }

      // Phase 2: Enhance with symbolic representation
      console.log('🧠 Phase 2: Building symbolic representation...');
      const symbolicRepo = await this.enhanceWithSymbolicData(baseAnalysis.model);

      // Phase 3: Create component mappings
      console.log('🗺️ Phase 3: Creating component mappings...');
      await this.buildComponentMappings(symbolicRepo, baseAnalysis.model);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Symbolic repository analysis completed in ${processingTime}ms`);

      return {
        success: true,
        symbolicRepo,
        analysisTime: processingTime,
        filesAnalyzed: symbolicRepo.structure.components.length + symbolicRepo.structure.styles.length,
        confidence: this.calculateConfidence(symbolicRepo),
        errors: [],
        warnings: []
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Symbolic repository analysis failed:', error);

      return {
        success: false,
        analysisTime: processingTime,
        filesAnalyzed: 0,
        confidence: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      };
    }
  }

  /**
   * Enhance base analysis with symbolic data
   */
  private async enhanceWithSymbolicData(baseModel: RepoSymbolicModel): Promise<SymbolicRepo> {
    const symbolicRepo: SymbolicRepo = {
      metadata: {
        framework: baseModel.primaryFramework,
        buildSystem: this.detectBuildSystem(baseModel),
        stylingSystem: this.detectStylingSystem(baseModel),
        packageManager: this.detectPackageManager(baseModel),
        hasTypeScript: true, // Assume TypeScript for now
        hasStorybook: this.detectStorybook(baseModel),
        hasTests: this.detectTests(baseModel),
        hasDesignSystem: this.detectDesignSystem(baseModel)
      },

      structure: {
        components: this.enhanceComponents(baseModel.components),
        pages: this.identifyPages(baseModel.components),
        styles: this.enhanceStyles(baseModel),
        config: this.enhanceConfigs(baseModel),
        directories: this.analyzeDirectories(baseModel)
      },

      mappings: {
        domToComponent: new Map(),
        componentDependencies: new Map(),
        styleRelationships: new Map(),
        importGraph: new Map()
      },

      analysis: {
        totalFiles: baseModel.components.length,
        componentCount: baseModel.components.length,
        complexityScore: this.calculateComplexity(baseModel),
        lastAnalyzed: new Date(),
        confidence: 0.85 // Will be calculated properly
      }
    };

    return symbolicRepo;
  }

  /**
   * Enhance component information with additional intelligence
   */
  private enhanceComponents(baseComponents: any[]): ComponentInfo[] {
    return baseComponents.map(comp => ({
      name: comp.name,
      filePath: comp.filePath,
      framework: comp.framework,
      exports: comp.exports || [],
      props: this.extractProps(comp),
      styling: this.enhanceComponentStyling(comp),
      dependencies: comp.dependencies || [],
      domElements: this.enhanceDOMElements(comp.domElements || []),
      complexity: this.assessComponentComplexity(comp),
      isPage: this.isPageComponent(comp),
      isShared: this.isSharedComponent(comp)
    }));
  }

  /**
   * Extract and enhance prop information
   */
  private extractProps(component: any): PropInfo[] {
    // This would analyze TypeScript interfaces, PropTypes, etc.
    // For now, return basic structure
    return component.props || [];
  }

  /**
   * Enhance component styling information
   */
  private enhanceComponentStyling(component: any): ComponentStyling {
    const styling = component.styling || {};
    
    return {
      approach: styling.approach || 'css-classes',
      classes: styling.classes || [],
      styleFiles: styling.styleFiles || [],
      inlineStyles: styling.inlineStyles || {},
      hasCustomCSS: (styling.styleFiles?.length || 0) > 0,
      usesDesignSystem: this.usesDesignSystem(styling)
    };
  }

  /**
   * Enhance DOM element information with better intelligence
   */
  private enhanceDOMElements(domElements: any[]): DOMElementInfo[] {
    return domElements.map(el => ({
      tagName: el.tagName,
      selector: this.generateBetterSelector(el),
      classes: el.classes || [],
      styles: el.styles || {},
      lineNumber: el.lineNumber,
      confidence: this.calculateElementConfidence(el)
    }));
  }

  /**
   * Generate better CSS selectors for DOM elements
   */
  private generateBetterSelector(element: any): string {
    const tagName = element.tagName?.toLowerCase() || 'div';
    const classes = element.classes || [];
    const id = element.id;

    if (id) {
      return `#${id}`;
    }

    if (classes.length > 0) {
      return `${tagName}.${classes.join('.')}`;
    }

    return tagName;
  }

  /**
   * Build component mappings for DOM elements
   */
  private async buildComponentMappings(symbolicRepo: SymbolicRepo, baseModel: RepoSymbolicModel): Promise<void> {
    console.log('🗺️ Building DOM to component mappings...');

    // Use existing domMappings from base model
    if (baseModel.domMappings) {
      for (const [selector, mappings] of baseModel.domMappings.entries()) {
        const bestMapping = mappings.sort((a, b) => b.confidence - a.confidence)[0];
        if (bestMapping) {
          const component = symbolicRepo.structure.components.find(c => 
            c.filePath === bestMapping.filePath && c.name === bestMapping.componentName
          );
          if (component) {
            symbolicRepo.mappings.domToComponent.set(selector, component);
          }
        }
      }
    }

    console.log(`✅ Created ${symbolicRepo.mappings.domToComponent.size} DOM mappings`);
  }

  // Helper methods for detection and analysis

  private detectBuildSystem(model: RepoSymbolicModel): SymbolicRepo['metadata']['buildSystem'] {
    // Logic to detect build system from package.json, config files, etc.
    return 'unknown';
  }

  private detectStylingSystem(model: RepoSymbolicModel): SymbolicRepo['metadata']['stylingSystem'] {
    // Logic to detect styling approach
    return 'unknown';
  }

  private detectPackageManager(model: RepoSymbolicModel): SymbolicRepo['metadata']['packageManager'] {
    // Logic to detect package manager
    return 'npm';
  }

  private detectStorybook(model: RepoSymbolicModel): boolean {
    // Check for Storybook configuration
    return false;
  }

  private detectTests(model: RepoSymbolicModel): boolean {
    // Check for test files and configuration
    return false;
  }

  private detectDesignSystem(model: RepoSymbolicModel): boolean {
    // Check for design system indicators
    return false;
  }

  private identifyPages(components: any[]): any[] {
    // Identify which components are pages
    return [];
  }

  private enhanceStyles(model: RepoSymbolicModel): StyleInfo[] {
    // Enhance style file information
    return [];
  }

  private enhanceConfigs(model: RepoSymbolicModel): ConfigInfo[] {
    // Enhance configuration file information
    return [];
  }

  private analyzeDirectories(model: RepoSymbolicModel): DirectoryInfo[] {
    // Analyze directory structure and purpose
    return [];
  }

  private calculateComplexity(model: RepoSymbolicModel): number {
    // Calculate overall repository complexity
    return 0.5;
  }

  private assessComponentComplexity(component: any): 'low' | 'medium' | 'high' {
    // Assess individual component complexity
    return 'medium';
  }

  private isPageComponent(component: any): boolean {
    // Determine if component is a page
    return component.filePath.includes('/pages/') || component.filePath.includes('/routes/');
  }

  private isSharedComponent(component: any): boolean {
    // Determine if component is shared/reusable
    return component.filePath.includes('/components/') || component.filePath.includes('/shared/');
  }

  private usesDesignSystem(styling: any): boolean {
    // Check if component uses design system
    return false;
  }

  private calculateElementConfidence(element: any): number {
    // Calculate confidence in DOM element mapping
    let confidence = 0.5;
    
    if (element.id) confidence += 0.3;
    if (element.classes?.length > 0) confidence += 0.2;
    if (element.lineNumber) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private calculateConfidence(symbolicRepo: SymbolicRepo): number {
    // Calculate overall confidence in symbolic representation
    const factors = [
      symbolicRepo.structure.components.length > 0 ? 0.3 : 0,
      symbolicRepo.mappings.domToComponent.size > 0 ? 0.3 : 0,
      symbolicRepo.metadata.framework !== 'unknown' ? 0.2 : 0,
      symbolicRepo.metadata.stylingSystem !== 'unknown' ? 0.2 : 0
    ];

    return factors.reduce((sum, factor) => sum + factor, 0);
  }
}
