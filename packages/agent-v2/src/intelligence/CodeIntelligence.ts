import * as path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { 
  ProjectStructure, 
  ComponentInfo, 
  StyleFileInfo, 
  ConfigFileInfo, 
  ComponentStyling,
  PropInfo,
  DOMElementInfo
} from '../types';
import { WorkspaceManager } from '../workspace/WorkspaceManager';

export class CodeIntelligence {
  constructor(private workspace: WorkspaceManager) {}

  /**
   * Analyze the entire project structure
   */
  async analyzeProject(): Promise<ProjectStructure> {
    console.log('🧠 Analyzing project structure...');
    
    const [framework, buildSystem, packageManager, stylingSystem] = await Promise.all([
      this.detectFramework(),
      this.detectBuildSystem(),
      this.detectPackageManager(),
      this.detectStylingSystem()
    ]);

    const [components, styleFiles, configFiles] = await Promise.all([
      this.discoverComponents(),
      this.discoverStyleFiles(),
      this.discoverConfigFiles()
    ]);

    const structure: ProjectStructure = {
      framework,
      buildSystem,
      packageManager,
      stylingSystem,
      components,
      styleFiles,
      configFiles
    };

    console.log('✅ Project analysis complete:', {
      framework,
      buildSystem,
      stylingSystem,
      componentsFound: components.length,
      styleFiles: styleFiles.length
    });

    return structure;
  }

  /**
   * Detect the frontend framework being used
   */
  private async detectFramework(): Promise<ProjectStructure['framework']> {
    try {
      // Check package.json for dependencies
      const packageJsonPath = 'package.json';
      if (await this.workspace.fileExists(packageJsonPath)) {
        const packageJson = JSON.parse(await this.workspace.readFile(packageJsonPath));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        if (deps.react || deps['@types/react']) return 'react';
        if (deps.vue || deps['@vue/core']) return 'vue';
        if (deps.svelte) return 'svelte';
        if (deps['@angular/core']) return 'angular';
      }

      // Check for framework-specific files
      const files = await this.workspace.findFiles(['**/*.{tsx,jsx,vue,svelte}']);
      
      if (files.some(f => f.endsWith('.tsx') || f.endsWith('.jsx'))) return 'react';
      if (files.some(f => f.endsWith('.vue'))) return 'vue';
      if (files.some(f => f.endsWith('.svelte'))) return 'svelte';

    } catch (error) {
      console.warn('⚠️ Error detecting framework:', error);
    }

    return 'unknown';
  }

  /**
   * Detect the build system
   */
  private async detectBuildSystem(): Promise<ProjectStructure['buildSystem']> {
    try {
      const configFiles = await this.workspace.findFiles([
        'vite.config.*',
        'webpack.config.*',
        'next.config.*',
        'nuxt.config.*',
        'rollup.config.*'
      ]);

      if (configFiles.some(f => f.includes('vite.config'))) return 'vite';
      if (configFiles.some(f => f.includes('webpack.config'))) return 'webpack';
      if (configFiles.some(f => f.includes('next.config'))) return 'next';
      if (configFiles.some(f => f.includes('nuxt.config'))) return 'nuxt';
      if (configFiles.some(f => f.includes('rollup.config'))) return 'rollup';

    } catch (error) {
      console.warn('⚠️ Error detecting build system:', error);
    }

    return 'unknown';
  }

  /**
   * Detect package manager
   */
  private async detectPackageManager(): Promise<ProjectStructure['packageManager']> {
    try {
      if (await this.workspace.fileExists('pnpm-lock.yaml')) return 'pnpm';
      if (await this.workspace.fileExists('yarn.lock')) return 'yarn';
      if (await this.workspace.fileExists('package-lock.json')) return 'npm';
    } catch (error) {
      console.warn('⚠️ Error detecting package manager:', error);
    }

    return 'unknown';
  }

  /**
   * Detect styling system
   */
  private async detectStylingSystem(): Promise<ProjectStructure['stylingSystem']> {
    try {
      // Check for Tailwind
      if (await this.workspace.fileExists('tailwind.config.js') || 
          await this.workspace.fileExists('tailwind.config.ts')) {
        return 'tailwind';
      }

      // Check package.json for styling dependencies
      if (await this.workspace.fileExists('package.json')) {
        const packageJson = JSON.parse(await this.workspace.readFile('package.json'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        if (deps['styled-components']) return 'styled-components';
        if (deps['@emotion/react'] || deps['@emotion/styled']) return 'emotion';
        if (deps.sass || deps.scss) return 'scss';
      }

      // Check for CSS modules pattern
      const cssModuleFiles = await this.workspace.findFiles(['**/*.module.{css,scss}']);
      if (cssModuleFiles.length > 0) return 'css-modules';

      // Default to CSS
      const cssFiles = await this.workspace.findFiles(['**/*.{css,scss}']);
      if (cssFiles.length > 0) return 'css';

    } catch (error) {
      console.warn('⚠️ Error detecting styling system:', error);
    }

    return 'unknown';
  }

  /**
   * Discover all components in the project
   */
  async discoverComponents(): Promise<ComponentInfo[]> {
    console.log('🔍 Discovering components...');
    
    const componentFiles = await this.workspace.findFiles([
      '**/*.{tsx,jsx,vue,svelte}',
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/build/**'
    ]);

    const components: ComponentInfo[] = [];

    for (const filePath of componentFiles) {
      try {
        const component = await this.analyzeComponent(filePath);
        if (component) {
          components.push(component);
        }
      } catch (error) {
        console.warn(`⚠️ Error analyzing component ${filePath}:`, error);
      }
    }

    console.log(`✅ Discovered ${components.length} components`);
    return components;
  }

  /**
   * Analyze a single component file
   */
  async analyzeComponent(filePath: string): Promise<ComponentInfo | null> {
    const content = await this.workspace.readFile(filePath);
    const ext = path.extname(filePath);

    // For now, focus on React components (.tsx, .jsx)
    if (!['.tsx', '.jsx'].includes(ext)) {
      return null; // TODO: Add support for Vue, Svelte
    }

    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      });

      let componentName = path.basename(filePath, ext);
      const exports: string[] = [];
      const props: PropInfo[] = [];
      const dependencies: string[] = [];
      const domElements: DOMElementInfo[] = [];

      traverse(ast, {
        // Find component exports
        ExportDefaultDeclaration(path: any) {
          if (t.isIdentifier(path.node.declaration)) {
            componentName = path.node.declaration.name;
          } else if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
            componentName = path.node.declaration.id.name;
          }
          exports.push('default');
        },

        ExportNamedDeclaration(path: any) {
          if (path.node.specifiers) {
            path.node.specifiers.forEach((spec: any) => {
              if (t.isExportSpecifier(spec) && t.isIdentifier(spec.exported)) {
                exports.push(spec.exported.name);
              }
            });
          }
        },

        // Find imports (dependencies)
        ImportDeclaration(path: any) {
          if (t.isStringLiteral(path.node.source)) {
            dependencies.push(path.node.source.value);
          }
        },

        // Find JSX elements and their attributes
        JSXElement(path: any) {
          const element = path.node;
          if (t.isJSXIdentifier(element.openingElement.name)) {
            const tagName = element.openingElement.name.name;
            const classes: string[] = [];
            const styles: Record<string, string> = {};

            // Extract className and style attributes
            element.openingElement.attributes.forEach((attr: any) => {
              if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
                if (attr.name.name === 'className' && t.isStringLiteral(attr.value)) {
                  classes.push(...attr.value.value.split(' ').filter(Boolean));
                } else if (attr.name.name === 'style' && t.isJSXExpressionContainer(attr.value)) {
                  // TODO: Parse inline styles from JSX expression
                }
              }
            });

            domElements.push({
              tagName,
              selector: `${tagName.toLowerCase()}${classes.length > 0 ? '.' + classes.join('.') : ''}`,
              classes,
              styles,
              lineNumber: element.loc?.start.line
            });
          }
        },

        // Find component props (function parameters)
        FunctionDeclaration(path: any) {
          if (path.node.id?.name === componentName && path.node.params.length > 0) {
            const propsParam = path.node.params[0];
            if (t.isIdentifier(propsParam) && propsParam.typeAnnotation) {
              // TODO: Parse TypeScript type annotations for props
            }
          }
        }
      });

      // Analyze component styling
      const styling = await this.analyzeComponentStyling(filePath, content, domElements);

      return {
        name: componentName,
        filePath,
        framework: 'react', // TODO: Make dynamic based on file analysis
        exports,
        props,
        styling,
        dependencies,
        domElements
      };

    } catch (error) {
      console.warn(`⚠️ Failed to parse component ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Analyze component styling approach
   */
  private async analyzeComponentStyling(
    _filePath: string, 
    content: string, 
    domElements: DOMElementInfo[]
  ): Promise<ComponentStyling> {
    const classes = domElements.flatMap(el => el.classes);
    const styleFiles: string[] = [];
    let approach: ComponentStyling['approach'] = 'css-classes';

    // Check for CSS/SCSS imports
    const importMatches = content.match(/import\s+['"`]([^'"`]+\.s?css)['"`]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const stylePath = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
        if (stylePath) {
          styleFiles.push(stylePath);
        }
      });
    }

    // Detect styling approach
    if (content.includes('styled-components') || content.includes('styled.')) {
      approach = 'styled-components';
    } else if (content.includes('.module.css') || content.includes('.module.scss')) {
      approach = 'css-modules';
    } else if (classes.some(cls => cls.includes('w-') || cls.includes('h-') || cls.includes('bg-'))) {
      approach = 'tailwind';
    } else if (content.includes('style={{')) {
      approach = 'inline';
    }

    return {
      approach,
      classes: [...new Set(classes)],
      styleFiles,
      inlineStyles: {} // TODO: Extract inline styles from JSX
    };
  }

  /**
   * Generate CSS selector from tag name and classes
   */
  private generateSelector(tagName: string, classes: string[]): string {
    let selector = tagName.toLowerCase();
    if (classes.length > 0) {
      selector += '.' + classes.join('.');
    }
    return selector;
  }

  /**
   * Discover style files
   */
  async discoverStyleFiles(): Promise<StyleFileInfo[]> {
    const styleFiles = await this.workspace.findFiles([
      '**/*.{css,scss,less,stylus}',
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/build/**'
    ]);

    const styleInfos: StyleFileInfo[] = [];

    for (const filePath of styleFiles) {
      try {
        const content = await this.workspace.readFile(filePath);
        const ext = path.extname(filePath).slice(1) as StyleFileInfo['type'] || 'css';
        
        // Extract CSS classes and variables (basic parsing)
        const classes = this.extractCSSClasses(content);
        const variables = this.extractCSSVariables(content);
        const imports = this.extractCSSImports(content);

        styleInfos.push({
          filePath,
          type: ext,
          classes,
          variables,
          imports
        });
      } catch (error) {
        console.warn(`⚠️ Error analyzing style file ${filePath}:`, error);
      }
    }

    return styleInfos;
  }

  /**
   * Extract CSS class names from content
   */
  private extractCSSClasses(content: string): string[] {
    const classRegex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
    const classes: string[] = [];
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }

    return [...new Set(classes)];
  }

  /**
   * Extract CSS variables from content
   */
  private extractCSSVariables(content: string): Record<string, string> {
    const variableRegex = /--([a-zA-Z_-][a-zA-Z0-9_-]*)\s*:\s*([^;]+);/g;
    const variables: Record<string, string> = {};
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      variables[match[1]] = match[2].trim();
    }

    return variables;
  }

  /**
   * Extract CSS imports from content
   */
  private extractCSSImports(content: string): string[] {
    const importRegex = /@import\s+['"`]([^'"`]+)['"`]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Discover configuration files
   */
  async discoverConfigFiles(): Promise<ConfigFileInfo[]> {
    const configPatterns = [
      'package.json',
      'tsconfig.json',
      'vite.config.*',
      'webpack.config.*',
      'tailwind.config.*',
      '.babelrc*',
      '.eslintrc*',
      'prettier.config.*'
    ];

    const configFiles = await this.workspace.findFiles(configPatterns);
    const configs: ConfigFileInfo[] = [];

    for (const filePath of configFiles) {
      try {
        const content = await this.workspace.readFile(filePath);
        let parsedContent: any;

        // Parse JSON files
        if (filePath.endsWith('.json')) {
          parsedContent = JSON.parse(content);
        } else {
          // For JS/TS config files, we'd need more sophisticated parsing
          parsedContent = { raw: content };
        }

        let type: ConfigFileInfo['type'] = 'other';
        if (filePath.includes('package.json')) type = 'package.json';
        else if (filePath.includes('tsconfig.json')) type = 'tsconfig.json';
        else if (filePath.includes('vite.config')) type = 'vite.config';
        else if (filePath.includes('webpack.config')) type = 'webpack.config';
        else if (filePath.includes('tailwind.config')) type = 'tailwind.config';

        configs.push({
          filePath,
          type,
          content: parsedContent
        });
      } catch (error) {
        console.warn(`⚠️ Error parsing config file ${filePath}:`, error);
      }
    }

    return configs;
  }

  /**
   * Find the best matching component for a DOM element
   */
  async findComponentForElement(
    element: { tagName: string; className?: string; selector?: string },
    projectStructure: ProjectStructure
  ): Promise<ComponentInfo | null> {
    const elementClasses = element.className?.split(' ').filter(Boolean) || [];
    const elementTag = element.tagName?.toLowerCase() || '';
    
    let bestMatch: ComponentInfo | null = null;
    let bestScore = 0;

    for (const component of projectStructure.components) {
      let score = 0;

      // Check DOM elements in component
      for (const domEl of component.domElements) {
        // Tag name match
        if (domEl.tagName.toLowerCase() === elementTag) {
          score += 0.3;
        }

        // Class name matches
        const commonClasses = domEl.classes.filter(cls => elementClasses.includes(cls));
        score += commonClasses.length * 0.2;

        // Selector match
        if (element.selector && domEl.selector === element.selector) {
          score += 0.5;
        }
      }

      // Component styling classes match
      const commonStylingClasses = component.styling.classes.filter(cls => 
        elementClasses.includes(cls)
      );
      score += commonStylingClasses.length * 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = component;
      }
    }

    // Only return if confidence is reasonable
    return bestScore > 0.3 ? bestMatch : null;
  }
}
