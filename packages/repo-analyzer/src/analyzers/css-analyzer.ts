// RemoteRepo type - we'll use any for now to avoid circular dependencies
type RemoteRepo = any;
import {
  StylingPattern,
  VisualMapping,
  TailwindConfig,
  CSSProperties,
  ComponentStyling
} from '../types.js';

interface CSSAnalysisResult {
  approach: ComponentStyling['approach'];
  tailwindConfig: TailwindConfig | undefined;
  variables: Map<string, string>;
  customClasses: Map<string, CSSProperties>;
  fontSize: StylingPattern;
  color: StylingPattern;
  spacing: StylingPattern;
  layout: StylingPattern;
}

export class CSSAnalyzer {
  async analyzePatterns(
    remoteRepo: RemoteRepo,
    config: { owner: string; repo: string; baseBranch: string },
    files: Array<{ path: string; type: string }>
  ): Promise<CSSAnalysisResult> {
    
    console.log('🎨 Analyzing CSS patterns...');
    
    // Find configuration files
    const tailwindConfig = await this.findTailwindConfig(remoteRepo, config, files);
    const cssFiles = files.filter(f => ['css', 'scss', 'sass'].includes(f.type));
    
    // Analyze CSS variables
    const variables = await this.extractCSSVariables(remoteRepo, config, cssFiles);
    
    // Analyze custom classes
    const customClasses = await this.extractCustomClasses(remoteRepo, config, cssFiles);
    
    // Determine primary styling approach
    const approach = await this.determineStylingApproach(tailwindConfig, cssFiles);
    
    // Build styling patterns
    const fontSize = await this.buildFontSizePattern(tailwindConfig, variables, customClasses);
    const color = await this.buildColorPattern(tailwindConfig, variables, customClasses);
    const spacing = await this.buildSpacingPattern(tailwindConfig, variables, customClasses);
    const layout = await this.buildLayoutPattern(tailwindConfig, variables, customClasses);
    
    return {
      approach,
      tailwindConfig,
      variables,
      customClasses,
      fontSize,
      color,
      spacing,
      layout
    };
  }

  private async findTailwindConfig(
    remoteRepo: RemoteRepo,
    config: { owner: string; repo: string; baseBranch: string },
    files: Array<{ path: string; type: string }>
  ): Promise<TailwindConfig | undefined> {
    
    const configFiles = files.filter(f => 
      f.path.includes('tailwind.config') && 
      ['js', 'ts', 'mjs'].includes(f.type)
    );
    
    if (configFiles.length === 0) {
      console.log('📝 No Tailwind config found');
      return undefined;
    }
    
    try {
      const configContent = await remoteRepo.readFile({
        owner: config.owner,
        repo: config.repo,
        path: configFiles[0]?.path,
        ref: config.baseBranch
      });
      
      console.log(`📋 Found Tailwind config: ${configFiles[0]?.path}`);
      return this.parseTailwindConfig(configContent);
    } catch (error) {
      console.warn('⚠️ Failed to read Tailwind config:', error instanceof Error ? error.message : String(error));
      return undefined;
    }
  }

  private parseTailwindConfig(_content: string): TailwindConfig {
    // Basic Tailwind config parsing
    // In a real implementation, we'd use a proper JS parser
    
    const defaultFontSizes = {
      'xs': '12px',
      'sm': '14px',
      'base': '16px',
      'lg': '18px',
      'xl': '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
      '6xl': '60px'
    };
    
    const defaultColors = {
      'slate-50': '#f8fafc',
      'slate-100': '#f1f5f9',
      'slate-200': '#e2e8f0',
      'slate-300': '#cbd5e1',
      'slate-400': '#94a3b8',
      'slate-500': '#64748b',
      'slate-600': '#475569',
      'slate-700': '#334155',
      'slate-800': '#1e293b',
      'slate-900': '#0f172a'
    };
    
    const defaultSpacing = {
      '0': '0px',
      '1': '4px',
      '2': '8px',
      '3': '12px',
      '4': '16px',
      '5': '20px',
      '6': '24px',
      '8': '32px',
      '10': '40px',
      '12': '48px',
      '16': '64px',
      '20': '80px',
      '24': '96px'
    };
    
    return {
      theme: {
        fontSize: defaultFontSizes,
        colors: defaultColors,
        spacing: defaultSpacing
      },
      customClasses: [],
      plugins: []
    };
  }

  private async extractCSSVariables(
    remoteRepo: RemoteRepo,
    config: { owner: string; repo: string; baseBranch: string },
    cssFiles: Array<{ path: string; type: string }>
  ): Promise<Map<string, string>> {
    
    const variables = new Map<string, string>();
    
    for (const file of cssFiles.slice(0, 5)) { // Limit to avoid too many requests
      try {
        const content = await remoteRepo.readFile({
          owner: config.owner,
          repo: config.repo,
          path: file.path,
          ref: config.baseBranch
        });
        
        // Extract CSS custom properties
        const variableRegex = /--([a-zA-Z0-9-_]+):\s*([^;]+);/g;
        let match;
        
        while ((match = variableRegex.exec(content)) !== null) {
          const varName = match[1];
          const varValue = match[2]?.trim();
          if (varName && varValue) {
            variables.set(`--${varName}`, varValue);
            console.log(`🎨 Found CSS variable: --${varName}: ${varValue}`);
          }
        }
        
        } catch (error) {
          console.warn(`⚠️ Failed to read CSS file ${file?.path || 'unknown'}:`, error instanceof Error ? error.message : String(error));
        }
    }
    
    return variables;
  }

  private async extractCustomClasses(
    _remoteRepo: RemoteRepo,
    _config: { owner: string; repo: string; baseBranch: string },
    _cssFiles: Array<{ path: string; type: string }>
  ): Promise<Map<string, CSSProperties>> {
    
    const customClasses = new Map<string, CSSProperties>();
    
    // This would involve parsing CSS files and extracting class definitions
    // For now, return empty map
    console.log('📝 Custom class extraction not yet implemented');
    
    return customClasses;
  }

  private async determineStylingApproach(
    tailwindConfig?: TailwindConfig,
    cssFiles: Array<{ path: string; type: string }> = []
  ): Promise<ComponentStyling['approach']> {
    
    if (tailwindConfig) {
      return 'tailwind';
    }
    
    if (cssFiles.some(f => f.path.includes('module'))) {
      return 'css-modules';
    }
    
    return 'vanilla-css';
  }

  private async buildFontSizePattern(
    tailwindConfig?: TailwindConfig,
    variables?: Map<string, string>,
    customClasses?: Map<string, CSSProperties>
  ): Promise<StylingPattern> {
    
    const values = new Map<string, VisualMapping>();
    
    if (tailwindConfig?.theme.fontSize) {
      Object.entries(tailwindConfig.theme.fontSize).forEach(([className, pixelValue]) => {
        values.set(pixelValue, {
          cssValue: pixelValue,
          className: `text-${className}`,
          confidence: 0.9
        });
      });
    }
    
    // Add common font sizes not in Tailwind
    const commonSizes = [
      { px: '31px', className: 'text-[31px]', confidence: 0.8 },
      { px: '28px', className: 'text-[28px]', confidence: 0.8 },
      { px: '22px', className: 'text-[22px]', confidence: 0.8 }
    ];
    
    commonSizes.forEach(size => {
      if (!values.has(size.px)) {
        values.set(size.px, {
          cssValue: size.px,
          className: size.className,
          confidence: size.confidence
        });
      }
    });
    
    return {
      property: 'font-size',
      values,
      customClasses: customClasses || new Map(),
      variables: variables || new Map()
    };
  }

  private async buildColorPattern(
    tailwindConfig?: TailwindConfig,
    variables?: Map<string, string>,
    customClasses?: Map<string, CSSProperties>
  ): Promise<StylingPattern> {
    
    const values = new Map<string, VisualMapping>();
    
    if (tailwindConfig?.theme.colors) {
      Object.entries(tailwindConfig.theme.colors).forEach(([className, hexValue]) => {
        values.set(hexValue, {
          cssValue: hexValue,
          className: `text-${className}`,
          confidence: 0.9
        });
      });
    }
    
    return {
      property: 'color',
      values,
      customClasses: customClasses || new Map(),
      variables: variables || new Map()
    };
  }

  private async buildSpacingPattern(
    tailwindConfig?: TailwindConfig,
    variables?: Map<string, string>,
    customClasses?: Map<string, CSSProperties>
  ): Promise<StylingPattern> {
    
    const values = new Map<string, VisualMapping>();
    
    if (tailwindConfig?.theme.spacing) {
      Object.entries(tailwindConfig.theme.spacing).forEach(([className, pixelValue]) => {
        // Map to various spacing utilities
        values.set(pixelValue, {
          cssValue: pixelValue,
          className: `p-${className}`, // Could be m-, p-, w-, h-, etc.
          confidence: 0.8
        });
      });
    }
    
    return {
      property: 'spacing',
      values,
      customClasses: customClasses || new Map(),
      variables: variables || new Map()
    };
  }

  private async buildLayoutPattern(
    _tailwindConfig?: TailwindConfig,
    variables?: Map<string, string>,
    customClasses?: Map<string, CSSProperties>
  ): Promise<StylingPattern> {
    
    const values = new Map<string, VisualMapping>();
    
    // Common layout patterns
    const layoutMappings = [
      { css: 'display: flex', className: 'flex', confidence: 0.95 },
      { css: 'display: grid', className: 'grid', confidence: 0.95 },
      { css: 'display: block', className: 'block', confidence: 0.9 },
      { css: 'display: inline', className: 'inline', confidence: 0.9 }
    ];
    
    layoutMappings.forEach(mapping => {
      values.set(mapping.css, {
        cssValue: mapping.css,
        className: mapping.className,
        confidence: mapping.confidence
      });
    });
    
    return {
      property: 'layout',
      values,
      customClasses: customClasses || new Map(),
      variables: variables || new Map()
    };
  }
}
