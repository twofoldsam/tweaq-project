// RemoteRepo type - we'll use any for now to avoid circular dependencies
type RemoteRepo = any;
import {
  RepoSymbolicModel,
  AnalysisOptions,
  AnalysisResult,
  ComponentStructure
} from './types.js';
import { ReactAnalyzer } from './analyzers/react-analyzer.js';
import { VueAnalyzer } from './analyzers/vue-analyzer.js';
import { SvelteAnalyzer } from './analyzers/svelte-analyzer.js';
import { CSSAnalyzer } from './analyzers/css-analyzer.js';
import { RuleGenerator } from './rule-generator.js';
import { RepoCache } from './cache.js';

export class RepoAnalyzer {
  private reactAnalyzer: ReactAnalyzer;
  private vueAnalyzer: VueAnalyzer;
  private svelteAnalyzer: SvelteAnalyzer;
  private cssAnalyzer: CSSAnalyzer;
  private ruleGenerator: RuleGenerator;
  private cache: RepoCache;

  constructor() {
    this.reactAnalyzer = new ReactAnalyzer();
    this.vueAnalyzer = new VueAnalyzer();
    this.svelteAnalyzer = new SvelteAnalyzer();
    this.cssAnalyzer = new CSSAnalyzer();
    this.ruleGenerator = new RuleGenerator();
    this.cache = new RepoCache();
  }

  /**
   * Analyze a repository and create symbolic representation
   */
  async analyzeRepository(
    remoteRepo: RemoteRepo,
    config: { owner: string; repo: string; baseBranch: string },
    options: Partial<AnalysisOptions> = {}
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const repoId = `${config.owner}/${config.repo}`;
    
    console.log(`🔍 Starting deep analysis of repository: ${repoId}`);
    
    // Check cache first
    if (options.cacheEnabled !== false) {
      const cached = await this.cache.get(repoId);
      if (cached && await this.isCacheValid(cached, remoteRepo)) {
        console.log('📦 Using cached analysis');
        return {
          success: true,
          model: cached,
          errors: [],
          warnings: [],
          stats: {
            filesAnalyzed: 0,
            componentsFound: cached.components.length,
            rulesGenerated: cached.transformationRules.length,
            processingTime: 0
          }
        };
      }
    }

    const analysisOptions: AnalysisOptions = {
      includeNodeModules: false,
      maxFileSize: 1024 * 1024, // 1MB
      supportedExtensions: ['.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte', '.css', '.scss', '.sass'],
      analysisDepth: 'comprehensive',
      cacheEnabled: true,
      parallelProcessing: true,
      ...options
    };

    try {
      // Phase 1: Discover all relevant files
      console.log('📂 Phase 1: Discovering files...');
      const files = await this.discoverFiles(remoteRepo, config, analysisOptions);
      console.log(`📁 Found ${files.length} relevant files`);

      // Phase 2: Analyze framework and architecture
      console.log('🏗️ Phase 2: Analyzing architecture...');
      const frameworkInfo = await this.analyzeFramework(files);
      console.log(`🎯 Primary framework: ${frameworkInfo.primary}`);

      // Phase 3: Analyze components
      console.log('⚛️ Phase 3: Analyzing components...');
      const components = await this.analyzeComponents(remoteRepo, config, files, frameworkInfo);
      console.log(`🧩 Found ${components.length} components`);

      // Phase 4: Analyze styling patterns
      console.log('🎨 Phase 4: Analyzing styling patterns...');
      const stylingPatterns = await this.cssAnalyzer.analyzePatterns(remoteRepo, config, files);
      console.log(`🎨 Identified ${Object.keys(stylingPatterns.fontSize.values).length} font-size patterns`);

      // Phase 5: Generate DOM-to-component mappings
      console.log('🗺️ Phase 5: Creating DOM mappings...');
      const domMappings = await this.generateDOMMappings(components);
      console.log(`🎯 Created ${domMappings.size} DOM mappings`);

      // Phase 6: Generate transformation rules
      console.log('📋 Phase 6: Generating transformation rules...');
      const transformationRules = await this.ruleGenerator.generateRules(
        components,
        stylingPatterns,
        domMappings
      );
      console.log(`⚡ Generated ${transformationRules.length} transformation rules`);

      // Create symbolic model
      const model: RepoSymbolicModel = {
        repoId,
        analyzedAt: new Date(),
        version: '1.0.0',
        primaryFramework: frameworkInfo.primary,
        frameworkVersions: frameworkInfo.versions,
        stylingApproach: stylingPatterns.approach,
        tailwindConfig: stylingPatterns.tailwindConfig,
        cssVariables: stylingPatterns.variables,
        customClasses: stylingPatterns.customClasses,
        components,
        componentPatterns: frameworkInfo.patterns,
        stylingPatterns: {
          fontSize: stylingPatterns.fontSize,
          color: stylingPatterns.color,
          spacing: stylingPatterns.spacing,
          layout: stylingPatterns.layout
        },
        domMappings,
        transformationRules,
        fileHashes: new Map(), // TODO: Implement file hashing
        lastModified: new Date()
      };

      // Cache the result
      if (options.cacheEnabled !== false) {
        await this.cache.set(repoId, model);
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Analysis complete in ${processingTime}ms`);

      return {
        success: true,
        model,
        errors: [],
        warnings: [],
        stats: {
          filesAnalyzed: files.length,
          componentsFound: components.length,
          rulesGenerated: transformationRules.length,
          processingTime
        }
      };

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      return {
        success: false,
        errors: [{
          file: 'repository',
          message: error instanceof Error ? error.message : String(error),
          severity: 'error' as const
        }],
        warnings: [],
        stats: {
          filesAnalyzed: 0,
          componentsFound: 0,
          rulesGenerated: 0,
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  private async discoverFiles(
    remoteRepo: RemoteRepo,
    config: { owner: string; repo: string; baseBranch: string },
    options: AnalysisOptions
  ): Promise<Array<{ path: string; size: number; type: string }>> {
    const tree = await remoteRepo.getTree({
      owner: config.owner,
      repo: config.repo,
      tree_sha: config.baseBranch,
      recursive: true
    });

    return tree.tree
      .filter((item: any) => item.type === 'blob')
      .filter((item: any) => {
        const ext = '.' + item.path!.split('.').pop();
        return options.supportedExtensions.includes(ext);
      })
      .filter((item: any) => !options.includeNodeModules && !item.path!.includes('node_modules'))
      .filter((item: any) => item.size! <= options.maxFileSize)
      .map((item: any) => ({
        path: item.path!,
        size: item.size!,
        type: item.path!.split('.').pop()!
      }));
  }

  private async analyzeFramework(files: Array<{ path: string; type: string }>) {
    const extensions = files.map(f => f.type);
    const hasReact = extensions.some(ext => ['tsx', 'jsx'].includes(ext));
    const hasVue = extensions.includes('vue');
    const hasSvelte = extensions.includes('svelte');

    let primary: 'react' | 'vue' | 'svelte' | 'mixed' = 'react';
    if (hasVue && hasReact) primary = 'mixed';
    else if (hasVue) primary = 'vue';
    else if (hasSvelte) primary = 'svelte';

    return {
      primary,
      versions: {}, // TODO: Extract from package.json
      patterns: {
        filePattern: /\.(tsx|jsx|vue|svelte)$/,
        importPatterns: ['import', 'from'],
        exportPatterns: ['export default', 'export'],
        namingConvention: 'PascalCase' as const
      }
    };
  }

  private async analyzeComponents(
    remoteRepo: RemoteRepo,
    config: { owner: string; repo: string; baseBranch: string },
    files: Array<{ path: string; type: string }>,
    _frameworkInfo: any
  ): Promise<ComponentStructure[]> {
    const components: ComponentStructure[] = [];
    const componentFiles = files.filter(f => 
      ['tsx', 'jsx', 'vue', 'svelte'].includes(f.type)
    );

    for (const file of componentFiles) {
      try {
        const content = await remoteRepo.readFile({
          owner: config.owner,
          repo: config.repo,
          path: file.path,
          ref: config.baseBranch
        });

        let component: ComponentStructure | null = null;

        if (['tsx', 'jsx'].includes(file.type)) {
          component = await this.reactAnalyzer.analyzeComponent(content, file.path);
        } else if (file.type === 'vue') {
          component = await this.vueAnalyzer.analyzeComponent(content, file.path);
        } else if (file.type === 'svelte') {
          component = await this.svelteAnalyzer.analyzeComponent(content, file.path);
        }

        if (component) {
          components.push(component);
        }
        } catch (error) {
          console.warn(`⚠️ Failed to analyze ${file.path}:`, error instanceof Error ? error.message : String(error));
        }
    }

    return components;
  }

  private async generateDOMMappings(components: ComponentStructure[]) {
    const mappings = new Map();
    
    for (const component of components) {
      for (const element of component.domElements) {
        const selector = element.selector;
        if (!mappings.has(selector)) {
          mappings.set(selector, []);
        }
        
        mappings.get(selector).push({
          componentName: component.name,
          filePath: component.filePath,
          selector,
          confidence: this.calculateMappingConfidence(element, component),
          context: {
            lineNumber: element.lineNumber,
            parentComponent: component.name
          }
        });
      }
    }

    return mappings;
  }

  private calculateMappingConfidence(element: any, _component: ComponentStructure): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for unique selectors
    if (element.attributes.id) confidence += 0.3;
    if (element.classes.length > 2) confidence += 0.2;
    
    // Higher confidence for semantic elements
    if (['header', 'nav', 'main', 'footer'].includes(element.tagName)) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  private async isCacheValid(cached: RepoSymbolicModel, _remoteRepo: RemoteRepo): Promise<boolean> {
    // Simple time-based cache validation for now
    const hoursSinceAnalysis = (Date.now() - cached.analyzedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceAnalysis < 24; // Cache valid for 24 hours
  }
}
