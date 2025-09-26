/**
 * Visual Coding Agent Integration Service
 * 
 * This service provides a clean interface for integrating the visual coding agent
 * with the Smart QA Browser application. It handles initialization, configuration,
 * and provides methods for processing visual design requests.
 * 
 * The agent runs in the Electron main process via IPC to avoid CommonJS/ES module issues.
 */

// ===== TYPE DEFINITIONS =====

export type Framework = 'react' | 'vue' | 'svelte';
export type StylingSystem = 'tailwind' | 'css-modules' | 'styled-components' | 'vanilla-css' | 'mui' | 'chakra' | 'ant-design';

export interface VisualCodingConfig {
  anthropicApiKey: string;
  repositoryPath?: string;
  cacheAnalysis?: boolean;
}

export interface ElementSelection {
  element: HTMLElement;
  selector: string;
  tagName: string;
  classes: string[];
  id?: string;
  textContent?: string;
  style?: Record<string, string>;
  attributes?: Record<string, string>;
}

export interface DesignRequest {
  description: string;
  selectedElement: ElementSelection;
  framework: Framework;
  stylingSystem: StylingSystem;
  existingCode?: string;
  filePath?: string;
}

export interface CodeChange {
  filePath: string;
  oldContent: string;
  newContent: string;
  reasoning: string;
  changeType: 'modify' | 'create' | 'delete';
}

export interface Alternative {
  description: string;
  changes: CodeChange[];
  tradeoffs: string;
  confidence: number;
}

export interface DesignResponse {
  changes: CodeChange[];
  explanation: string;
  alternatives?: Alternative[];
  confidence: number;
  designPrinciples?: string[];
  tokensUsed?: number;
}

export interface DesignTokens {
  colors: Record<string, Record<string, string>>;
  spacing: Record<string, string>;
  typography: {
    fontSizes: Record<string, string>;
    fontWeights: Record<string, string>;
    lineHeights: Record<string, string>;
    fontFamilies: Record<string, string>;
  };
  shadows: Record<string, string>;
  borderRadius: Record<string, string>;
  breakpoints: Record<string, string>;
}

// ===== MAIN SERVICE CLASS =====

export class VisualCodingAgentService {
  private config: VisualCodingConfig;
  private designTokens: DesignTokens;
  private initialized = false;

  constructor(config: VisualCodingConfig) {
    this.config = config;
    this.designTokens = this.getDefaultDesignTokens();
  }

  // ===== INITIALIZATION =====

  /**
   * Initialize the visual coding agent via IPC to main process
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const result = await (window as any).electronAPI?.initializeVisualAgent?.(this.config);
      
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to initialize Visual Coding Agent');
      }

      this.initialized = true;
      console.log('✅ Visual Coding Agent initialized successfully via IPC');
    } catch (error) {
      console.error('Failed to initialize Visual Coding Agent:', error);
      throw new Error(`Failed to initialize Visual Coding Agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===== CORE PROCESSING METHODS =====

  /**
   * Process visual edits from the overlay system (main integration point)
   */
  async processVisualEdits(visualEdits: any[], context?: any): Promise<DesignResponse> {
    if (!this.initialized) {
      throw new Error('Visual Coding Agent not initialized. Call initialize() first.');
    }

    try {
      const description = this.generateDescriptionFromEdits(visualEdits);
      const selectedElement = this.extractElementFromEdits(visualEdits);

      const designContext = {
        designTokens: this.designTokens,
        framework: 'react' as Framework,
        stylingSystem: 'vanilla-css' as StylingSystem,
        fileStructure: this.getFileStructure(),
        componentPatterns: this.getComponentPatterns(),
        existingCode: context?.existingCode,
        filePath: context?.filePath,
        symbolicContext: context?.symbolicContext
      };

      const result = await (window as any).electronAPI?.processVisualRequest?.({
        description,
        selectedElement,
        context: designContext,
        framework: 'react' as Framework
      });

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to process visual request');
      }

      return {
        changes: result.data.changes,
        explanation: result.data.explanation,
        alternatives: result.data.alternatives,
        confidence: result.data.confidence,
        designPrinciples: result.data.designPrinciples
      };
    } catch (error) {
      console.error('Error processing visual edits:', error);
      throw new Error(`Failed to process visual edits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a direct visual design request (for UI usage)
   */
  async processDesignRequest(request: DesignRequest): Promise<DesignResponse> {
    if (!this.initialized) {
      throw new Error('Visual Coding Agent not initialized. Call initialize() first.');
    }

    try {
      const domElement = {
        tagName: request.selectedElement.tagName,
        classes: request.selectedElement.classes,
        id: request.selectedElement.id,
        textContent: request.selectedElement.textContent,
        style: request.selectedElement.style,
        attributes: request.selectedElement.attributes
      };

      const context = {
        designTokens: this.designTokens,
        framework: request.framework,
        stylingSystem: request.stylingSystem,
        fileStructure: this.getFileStructure(),
        componentPatterns: this.getComponentPatterns(),
        existingCode: request.existingCode,
        filePath: request.filePath
      };

      const visualRequest = {
        description: request.description,
        element: domElement,
        context,
        framework: request.framework
      };

      const result = await (window as any).electronAPI?.processVisualRequest?.(visualRequest);
      
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to process visual request');
      }

      return {
        changes: result.data.changes,
        explanation: result.data.explanation,
        alternatives: result.data.alternatives,
        confidence: result.data.confidence,
        designPrinciples: result.data.designPrinciples
      };
    } catch (error) {
      console.error('Error processing design request:', error);
      throw new Error(`Failed to process design request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Extract element information from a DOM element
   */
  extractElementInfo(element: HTMLElement): ElementSelection {
    const style: Record<string, string> = {};
    const computedStyle = window.getComputedStyle(element);
    Array.from(computedStyle).forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value) {
        style[prop] = value;
      }
    });

    const attributes: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr && attr.name !== 'class' && attr.name !== 'id') {
        attributes[attr.name] = attr.value;
      }
    }

    return {
      element,
      selector: this.generateSelector(element),
      tagName: element.tagName.toLowerCase(),
      classes: Array.from(element.classList),
      id: element.id || undefined,
      textContent: element.textContent?.trim() || undefined,
      style,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined
    } as ElementSelection;
  }

  /**
   * Update design tokens configuration
   */
  updateDesignTokens(tokens: Partial<DesignTokens>): void {
    this.designTokens = { ...this.designTokens, ...tokens };
  }

  /**
   * Get current design context
   */
  async getDesignContext(): Promise<any> {
    return {
      framework: 'react',
      stylingSystem: 'tailwind',
      designTokens: this.designTokens,
      componentPatterns: this.getComponentPatterns(),
      fileStructure: this.getFileStructure(),
      existingCode: '',
      filePath: '',
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private generateDescriptionFromEdits(visualEdits: any[]): string {
    if (visualEdits.length === 0) return 'Apply visual changes';
    
    const changes = visualEdits.flatMap(edit => edit.changes || []);
    const descriptions = changes.map(change => {
      const property = change.property;
      const from = change.before;
      const to = change.after;
      
      if (property.includes('color')) {
        return `change ${property} from ${from} to ${to}`;
      } else if (property.includes('size') || property.includes('width') || property.includes('height')) {
        return `adjust ${property} from ${from} to ${to}`;
      } else if (property.includes('margin') || property.includes('padding')) {
        return `modify spacing (${property}) from ${from} to ${to}`;
      } else {
        return `update ${property} from ${from} to ${to}`;
      }
    });
    
    return `Apply the following changes: ${descriptions.join(', ')}`;
  }

  private extractElementFromEdits(visualEdits: any[]): any {
    if (visualEdits.length === 0) {
      return {
        tagName: 'div',
        classes: [],
        textContent: 'Unknown element'
      };
    }
    
    const firstEdit = visualEdits[0];
    return {
      tagName: firstEdit.element?.tagName || 'div',
      classes: firstEdit.element?.className ? firstEdit.element.className.split(' ') : [],
      id: firstEdit.element?.id,
      textContent: firstEdit.element?.textContent
    };
  }

  private generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }
    let selector = element.tagName.toLowerCase();
    if (element.classList.length > 0) {
      selector += `.${Array.from(element.classList).join('.')}`;
    }
    return selector;
  }

  private getFileStructure(): string[] {
    return [
      'src/components/',
      'src/pages/',
      'src/styles/',
      'src/utils/',
      'src/App.tsx',
      'src/index.css',
      'src/main.tsx'
    ];
  }

  private getComponentPatterns(): Record<string, any> {
    return {
      namingConvention: 'PascalCase',
      fileExtension: '.tsx',
      exportStyle: 'named',
      propsInterface: 'TypeScript interfaces',
      stylingApproach: 'CSS classes with vanilla CSS',
      commonProps: {
        className: 'string',
        children: 'React.ReactNode',
        onClick: '() => void',
        disabled: 'boolean'
      }
    };
  }

  private getDefaultDesignTokens(): DesignTokens {
    return {
      colors: {
        primary: { 500: '#3b82f6', 600: '#2563eb' },
        secondary: { 500: '#6366f1', 600: '#4f46e5' },
        gray: { 100: '#f3f4f6', 600: '#4b5563' }
      },
      spacing: {
        '1': '0.25rem', '2': '0.5rem', '3': '0.75rem', '4': '1rem', 
        '5': '1.25rem', '6': '1.5rem', '8': '2rem', '10': '2.5rem', 
        '12': '3rem', '16': '4rem'
      },
      typography: {
        fontSizes: {
          xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', 
          xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem'
        },
        fontWeights: {
          normal: '400', medium: '500', semibold: '600', bold: '700'
        },
        lineHeights: {
          none: '1', tight: '1.25', snug: '1.375', normal: '1.5', 
          relaxed: '1.625', loose: '2'
        },
        fontFamilies: {
          sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
          serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
          mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        }
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      },
      borderRadius: {
        none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', 
        xl: '0.75rem', full: '9999px'
      },
      breakpoints: {
        sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px'
      }
    };
  }
}

export default VisualCodingAgentService;