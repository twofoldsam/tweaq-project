/**
 * Visual Coding Agent Integration Service
 * 
 * This service provides a clean interface for integrating the visual coding agent
 * with the Smart QA Browser application. It handles initialization, configuration,
 * and provides methods for processing visual design requests.
 */

import { 
  createVisualCodingAgent, 
  VisualCodingAgent,
  type VisualRequest, 
  type VisualResponse,
  type DesignContext,
  type DOMElement,
  type CodeChange,
  type Alternative,
  type DesignTokens,
  type Framework,
  type StylingSystem
} from './visual-coding-agent';

// Import the Claude provider directly
const { AnthropicClaudeProvider } = require('./visual-coding-agent/packages/providers/claude');

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

export interface DesignResponse {
  changes: CodeChange[];
  explanation: string;
  alternatives?: Alternative[];
  confidence: number;
  designPrinciples?: string[];
  tokensUsed?: number;
}

export class VisualCodingAgentService {
  private agent: VisualCodingAgent | null = null;
  private config: VisualCodingConfig;
  private designTokens: DesignTokens;
  private initialized = false;

  constructor(config: VisualCodingConfig) {
    this.config = config;
    this.designTokens = this.getDefaultDesignTokens();
  }

  /**
   * Initialize the visual coding agent
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const claudeProvider = new AnthropicClaudeProvider(this.config.anthropicApiKey);
      const agentConfig: any = {};
      if (this.config.repositoryPath) {
        agentConfig.repositoryPath = this.config.repositoryPath;
      }
      agentConfig.cacheAnalysis = this.config.cacheAnalysis ?? true;
      
      this.agent = createVisualCodingAgent(claudeProvider, agentConfig);
      
      this.initialized = true;
      console.log('Visual Coding Agent initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Visual Coding Agent:', error);
      throw new Error(`Failed to initialize Visual Coding Agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a visual design request
   */
  async processDesignRequest(request: DesignRequest): Promise<DesignResponse> {
    if (!this.agent) {
      throw new Error('Visual Coding Agent not initialized. Call initialize() first.');
    }

    try {
      // Convert ElementSelection to DOMElement format
      const domElement: DOMElement = {
        tagName: request.selectedElement.tagName,
        classes: request.selectedElement.classes,
        id: request.selectedElement.id,
        textContent: request.selectedElement.textContent,
        style: request.selectedElement.style,
        attributes: request.selectedElement.attributes
      };

      // Build design context
      const context: DesignContext = {
        designTokens: this.designTokens,
        framework: request.framework,
        stylingSystem: request.stylingSystem,
        fileStructure: this.getFileStructure(),
        componentPatterns: this.getComponentPatterns(),
        existingCode: request.existingCode,
        filePath: request.filePath
      };

      // Create visual request
      const visualRequest: VisualRequest = {
        description: request.description,
        element: domElement,
        context,
        framework: request.framework
      };

      // Process the request
      const response: VisualResponse = await this.agent.processRequest(visualRequest);

      return {
        changes: response.changes,
        explanation: response.explanation,
        alternatives: response.alternatives,
        confidence: response.confidence,
        designPrinciples: response.designPrinciples
      };
    } catch (error) {
      console.error('Error processing design request:', error);
      throw new Error(`Failed to process design request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update design tokens configuration
   */
  updateDesignTokens(tokens: Partial<DesignTokens>): void {
    this.designTokens = {
      ...this.designTokens,
      ...tokens
    };
  }

  /**
   * Get current design tokens
   */
  getDesignTokens(): DesignTokens {
    return { ...this.designTokens };
  }

  /**
   * Extract element information from a DOM element
   */
  static extractElementInfo(element: HTMLElement): ElementSelection {
    const computedStyle = window.getComputedStyle(element);
    const style: Record<string, string> = {};
    
    // Extract key style properties
    const importantStyles = [
      'display', 'position', 'width', 'height', 'margin', 'padding',
      'background', 'color', 'font-size', 'font-weight', 'border',
      'border-radius', 'box-shadow', 'opacity', 'transform'
    ];
    
    importantStyles.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value) {
        style[prop] = value;
      }
    });

    // Extract attributes
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
   * Generate a CSS selector for an element
   */
  private static generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    let selector = element.tagName.toLowerCase();
    
    if (element.classList.length > 0) {
      selector += '.' + Array.from(element.classList).join('.');
    }
    
    // Add nth-child if needed for uniqueness
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        child => child.tagName === element.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-child(${index})`;
      }
    }
    
    return selector;
  }

  /**
   * Check if the agent is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Clear the analysis cache
   */
  clearCache(): void {
    if (this.agent) {
      this.agent.clearAnalysisCache();
    }
  }

  /**
   * Get default design tokens based on the application's current styling
   */
  private getDefaultDesignTokens(): DesignTokens {
    return {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe', 
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Main primary color similar to #007acc
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827'
        },
        white: '#ffffff',
        black: '#000000'
      },
      typography: {
        fontSizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        },
        fontWeights: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        },
        lineHeights: {
          tight: '1.25',
          normal: '1.5',
          relaxed: '1.75'
        },
        fontFamilies: {
          sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          mono: '"SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace'
        }
      },
      spacing: {
        0: '0px',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      },
      borderRadius: {
        none: '0px',
        sm: '0.125rem',
        default: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px'
      },
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      }
    };
  }

  /**
   * Get file structure for the current project
   */
  private getFileStructure(): string[] {
    return [
      'src/',
      'src/components/',
      'src/services/',
      'src/types.d.ts',
      'src/App.tsx',
      'src/App.css',
      'src/index.css',
      'src/main.tsx'
    ];
  }

  /**
   * Get component patterns for the current project
   */
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
}

export default VisualCodingAgentService;
