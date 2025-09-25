/**
 * Core types for repository symbolic analysis
 */

export interface CSSProperties {
  [property: string]: string | number;
}

export interface VisualMapping {
  cssValue: string;
  className: string;
  confidence: number;
}

export interface ComponentStructure {
  name: string;
  filePath: string;
  exportType: 'default' | 'named';
  framework: 'react' | 'vue' | 'svelte';
  props: ComponentProp[];
  slots?: ComponentSlot[];
  styling: ComponentStyling;
  domElements: DOMElementInfo[];
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue: string | undefined;
}

export interface ComponentSlot {
  name: string;
  props?: ComponentProp[];
}

export interface ComponentStyling {
  approach: 'tailwind' | 'css-modules' | 'styled-components' | 'vanilla-css' | 'scoped-css';
  classes: string[];
  customProperties: string[];
  inlineStyles: boolean;
}

export interface DOMElementInfo {
  tagName: string;
  selector: string;
  classes: string[];
  attributes: Record<string, string>;
  textContent: string | undefined;
  lineNumber: number;
  columnNumber: number;
  parentContext: string;
}

export interface StylingPattern {
  property: string;
  values: Map<string, VisualMapping>;
  customClasses: Map<string, CSSProperties>;
  variables: Map<string, string>;
}

export interface TransformationRule {
  id: string;
  selector: string;
  property: string;
  fromValue: string;
  toValue: string;
  action: 'replace-class' | 'add-class' | 'remove-class' | 'modify-style' | 'update-variable';
  target: {
    filePath: string;
    searchPattern: string;
    replacePattern: string;
  };
  confidence: number;
}

export interface RepoSymbolicModel {
  repoId: string;
  analyzedAt: Date;
  version: string;
  
  // Framework Detection
  primaryFramework: 'react' | 'vue' | 'svelte' | 'mixed';
  frameworkVersions: Record<string, string>;
  
  // Styling Architecture
  stylingApproach: ComponentStyling['approach'];
  tailwindConfig: TailwindConfig | undefined;
  cssVariables: Map<string, string>;
  customClasses: Map<string, CSSProperties>;
  
  // Component Architecture
  components: ComponentStructure[];
  componentPatterns: {
    filePattern: RegExp;
    importPatterns: string[];
    exportPatterns: string[];
    namingConvention: 'PascalCase' | 'camelCase' | 'kebab-case';
  };
  
  // Visual-to-Code Mappings
  stylingPatterns: {
    fontSize: StylingPattern;
    color: StylingPattern;
    spacing: StylingPattern;
    layout: StylingPattern;
  };
  
  // DOM-to-Component Mappings
  domMappings: Map<string, ComponentMapping[]>;
  
  // Transformation Rules
  transformationRules: TransformationRule[];
  
  // Cache metadata
  fileHashes: Map<string, string>;
  lastModified: Date;
}

export interface ComponentMapping {
  componentName: string;
  filePath: string;
  selector: string;
  confidence: number;
  context: {
    lineNumber: number;
    parentComponent?: string;
    conditionalRendering?: boolean;
    loopRendering?: boolean;
  };
}

export interface TailwindConfig {
  theme: {
    fontSize: Record<string, string>;
    colors: Record<string, string>;
    spacing: Record<string, string>;
    [key: string]: any;
  };
  customClasses: string[];
  plugins: string[];
}

export interface AnalysisOptions {
  includeNodeModules: boolean;
  maxFileSize: number;
  supportedExtensions: string[];
  analysisDepth: 'shallow' | 'deep' | 'comprehensive';
  cacheEnabled: boolean;
  parallelProcessing: boolean;
}

export interface AnalysisResult {
  success: boolean;
  model?: RepoSymbolicModel;
  errors: AnalysisError[];
  warnings: string[];
  stats: {
    filesAnalyzed: number;
    componentsFound: number;
    rulesGenerated: number;
    processingTime: number;
  };
}

export interface AnalysisError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}
