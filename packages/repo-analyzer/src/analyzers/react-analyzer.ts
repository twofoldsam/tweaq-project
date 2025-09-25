import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import {
  ComponentStructure,
  ComponentProp,
  ComponentStyling,
  DOMElementInfo
} from '../types.js';

export class ReactAnalyzer {
  async analyzeComponent(content: string, filePath: string): Promise<ComponentStructure | null> {
    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });

      let componentName = this.extractComponentName(filePath);
      let exportType: 'default' | 'named' = 'default';
      const props: ComponentProp[] = [];
      const domElements: DOMElementInfo[] = [];
      let styling: ComponentStyling = {
        approach: 'tailwind',
        classes: [],
        customProperties: [],
        inlineStyles: false
      };

      traverse(ast, {
        // Extract component name and export type
        ExportDefaultDeclaration: (path) => {
          if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
            componentName = path.node.declaration.id.name;
          }
          exportType = 'default';
        },

        ExportNamedDeclaration: (path) => {
          exportType = 'named';
          if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
            componentName = path.node.declaration.id.name;
          }
        },

        // Extract function component props
        FunctionDeclaration: (path) => {
          if (this.isComponentFunction(path.node)) {
            const extractedProps = this.extractProps(path.node);
            props.push(...extractedProps);
          }
        },

        // Extract arrow function component props
        VariableDeclarator: (path) => {
          if (t.isArrowFunctionExpression(path.node.init) && 
              t.isIdentifier(path.node.id) &&
              this.isComponentName(path.node.id.name)) {
            const extractedProps = this.extractPropsFromArrow(path.node.init);
            props.push(...extractedProps);
          }
        },

        // Extract JSX elements and their styling
        JSXElement: (path) => {
          const element = this.analyzeJSXElement(path, content);
          if (element) {
            domElements.push(element);
            
            // Analyze styling approach
            const elementStyling = this.analyzeStyling(path);
            this.mergeStyling(styling, elementStyling);
          }
        },

        JSXFragment: (path) => {
        // Handle React fragments
        path.node.children.forEach((child) => {
          if (t.isJSXElement(child)) {
            // Process fragment children
          }
        });
        }
      });

      return {
        name: componentName,
        filePath,
        exportType,
        framework: 'react' as const,
        props,
        styling,
        domElements
      };

    } catch (error) {
      console.warn(`Failed to parse React component ${filePath}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  private extractComponentName(filePath: string): string {
    const fileName = filePath.split('/').pop()?.replace(/\.(tsx|jsx)$/, '') || 'Unknown';
    return fileName.charAt(0).toUpperCase() + fileName.slice(1);
  }

  private isComponentFunction(node: t.FunctionDeclaration): boolean {
    return !!(node.id && this.isComponentName(node.id.name));
  }

  private isComponentName(name: string): boolean {
    return /^[A-Z]/.test(name);
  }

  private extractProps(node: t.FunctionDeclaration): ComponentProp[] {
    const props: ComponentProp[] = [];
    
    if (node.params.length > 0) {
      const param = node.params[0];
      
      if (t.isObjectPattern(param)) {
        param.properties.forEach(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            props.push({
              name: prop.key.name,
              type: 'any', // TODO: Extract TypeScript types
              required: true, // TODO: Determine from destructuring defaults
              defaultValue: undefined
            });
          }
        });
      } else if (t.isIdentifier(param)) {
        // Props passed as single object
        props.push({
          name: param.name,
          type: 'object',
          required: true,
          defaultValue: undefined
        });
      }
    }
    
    return props;
  }

  private extractPropsFromArrow(node: t.ArrowFunctionExpression): ComponentProp[] {
    // Similar to extractProps but for arrow functions
    return this.extractProps({
      ...node,
      type: 'FunctionDeclaration',
      id: null
    } as any);
  }

  private analyzeJSXElement(path: NodePath<t.JSXElement>, _content: string): DOMElementInfo | null {
    const node = path.node;
    
    if (!t.isJSXIdentifier(node.openingElement.name)) {
      return null; // Skip component elements, only analyze DOM elements
    }

    const tagName = node.openingElement.name.name;
    
    // Skip React components (capitalized names)
    if (/^[A-Z]/.test(tagName)) {
      return null;
    }

    const classes: string[] = [];
    const attributes: Record<string, string> = {};
    let textContent: string | undefined;

    // Extract attributes
    node.openingElement.attributes.forEach(attr => {
      if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
        const attrName = attr.name.name;
        let attrValue = '';

        if (attr.value) {
          if (t.isStringLiteral(attr.value)) {
            attrValue = attr.value.value;
          } else if (t.isJSXExpressionContainer(attr.value)) {
            // Handle dynamic attributes
            attrValue = '[dynamic]';
          }
        }

        attributes[attrName] = attrValue;

        // Special handling for className
        if (attrName === 'className' && t.isStringLiteral(attr.value)) {
          classes.push(...attr.value.value.split(/\s+/).filter(Boolean));
        }
      }
    });

    // Extract text content
    if (node.children.length > 0) {
      const textNodes = node.children.filter(child => t.isJSXText(child));
      if (textNodes.length > 0) {
        textContent = textNodes.map(textNode => (textNode as t.JSXText).value.trim()).join(' ') || undefined;
      }
    }

    // Generate selector
    const selector = this.generateSelector(tagName, attributes.id, classes);

    // Get position info
    const loc = node.loc;
    const lineNumber = loc?.start.line || 0;
    const columnNumber = loc?.start.column || 0;

    // Get parent context
    const parentContext = this.getParentContext(path);

    return {
      tagName,
      selector,
      classes,
      attributes,
      textContent,
      lineNumber,
      columnNumber,
      parentContext
    };
  }

  private generateSelector(tagName: string, id?: string, classes: string[] = []): string {
    let selector = tagName.toLowerCase();
    
    if (id) {
      selector += `#${id}`;
    }
    
    if (classes.length > 0) {
      // Limit to first few classes to avoid overly specific selectors
      const relevantClasses = classes.slice(0, 3);
      selector += '.' + relevantClasses.join('.');
    }
    
    return selector;
  }

  private getParentContext(path: NodePath<t.JSXElement>): string {
    const parents: string[] = [];
    let currentPath = path.parent;
    
    while (currentPath && parents.length < 3) {
      if (t.isJSXElement(currentPath) && t.isJSXIdentifier(currentPath.openingElement.name)) {
        parents.unshift(currentPath.openingElement.name.name);
      }
      currentPath = (currentPath as any).parent;
    }
    
    return parents.join(' > ');
  }

  private analyzeStyling(path: NodePath<t.JSXElement>): ComponentStyling {
    const styling: ComponentStyling = {
      approach: 'vanilla-css',
      classes: [],
      customProperties: [],
      inlineStyles: false
    };

    const node = path.node;
    
    // Check for className attribute (Tailwind/CSS classes)
    const classNameAttr = node.openingElement.attributes.find(attr => 
      t.isJSXAttribute(attr) && 
      t.isJSXIdentifier(attr.name) && 
      attr.name.name === 'className'
    ) as t.JSXAttribute | undefined;

    if (classNameAttr && t.isStringLiteral(classNameAttr.value)) {
      const classes = classNameAttr.value.value.split(/\s+/).filter(Boolean);
      styling.classes = classes;
      
      // Detect Tailwind classes
      const hasTailwindClasses = classes.some(cls => 
        /^(text-|bg-|p-|m-|w-|h-|flex|grid|border-)/.test(cls) ||
        /^(sm:|md:|lg:|xl:|2xl:)/.test(cls)
      );
      
      if (hasTailwindClasses) {
        styling.approach = 'tailwind';
      }
      
      // Detect CSS custom properties
      const hasCustomProps = classes.some(cls => cls.includes('[') && cls.includes(']'));
      if (hasCustomProps) {
        styling.customProperties = classes.filter(cls => cls.includes('[') && cls.includes(']'));
      }
    }

    // Check for style attribute (inline styles)
    const styleAttr = node.openingElement.attributes.find(attr =>
      t.isJSXAttribute(attr) &&
      t.isJSXIdentifier(attr.name) &&
      attr.name.name === 'style'
    );

    if (styleAttr) {
      styling.inlineStyles = true;
    }

    return styling;
  }

  private mergeStyling(target: ComponentStyling, source: ComponentStyling): void {
    // Merge classes
    target.classes = [...new Set([...target.classes, ...source.classes])];
    
    // Merge custom properties
    target.customProperties = [...new Set([...target.customProperties, ...source.customProperties])];
    
    // Update approach (prioritize Tailwind if found)
    if (source.approach === 'tailwind') {
      target.approach = 'tailwind';
    }
    
    // Update inline styles flag
    if (source.inlineStyles) {
      target.inlineStyles = true;
    }
  }
}
