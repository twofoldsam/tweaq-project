import {
  TransformationRule,
  ComponentStructure,
  StylingPattern,
  ComponentMapping
} from './types.js';

export class RuleGenerator {
  async generateRules(
    components: ComponentStructure[],
    stylingPatterns: {
      fontSize: StylingPattern;
      color: StylingPattern;
      spacing: StylingPattern;
      layout: StylingPattern;
    },
    domMappings: Map<string, ComponentMapping[]>
  ): Promise<TransformationRule[]> {
    
    const rules: TransformationRule[] = [];
    
    console.log('📋 Generating transformation rules...');
    
    // Generate font-size transformation rules
    rules.push(...this.generateFontSizeRules(components, stylingPatterns.fontSize, domMappings));
    
    // Generate color transformation rules
    rules.push(...this.generateColorRules(components, stylingPatterns.color, domMappings));
    
    // Generate spacing transformation rules
    rules.push(...this.generateSpacingRules(components, stylingPatterns.spacing, domMappings));
    
    // Generate layout transformation rules
    rules.push(...this.generateLayoutRules(components, stylingPatterns.layout, domMappings));
    
    console.log(`⚡ Generated ${rules.length} transformation rules`);
    return rules;
  }

  private generateFontSizeRules(
    components: ComponentStructure[],
    fontSizePattern: StylingPattern,
    _domMappings: Map<string, ComponentMapping[]>
  ): TransformationRule[] {
    
    const rules: TransformationRule[] = [];
    
    // For each font-size mapping, create transformation rules
    fontSizePattern.values.forEach((mapping, pixelValue) => {
      
      // Find components that might use this font size
      components.forEach(component => {
        component.domElements.forEach(element => {
          
          // Look for text elements with font-size related classes
          const fontClasses = element.classes.filter(cls => cls.startsWith('text-'));
          
          if (fontClasses.length > 0) {
            fontClasses.forEach(fontClass => {
              
              // Create rule for changing from this class to the target pixel value
              const rule: TransformationRule = {
                id: `font-size-${component.name}-${element.lineNumber}-${fontClass}-to-${pixelValue}`,
                selector: element.selector,
                property: 'font-size',
                fromValue: fontClass,
                toValue: mapping.className,
                action: 'replace-class',
                target: {
                  filePath: component.filePath,
                  searchPattern: `className.*${this.escapeRegex(fontClass)}`,
                  replacePattern: fontClass + ' -> ' + mapping.className
                },
                confidence: mapping.confidence * 0.8 // Reduce confidence for generated rules
              };
              
              rules.push(rule);
            });
          }
        });
      });
    });
    
    return rules;
  }

  private generateColorRules(
    components: ComponentStructure[],
    colorPattern: StylingPattern,
    _domMappings: Map<string, ComponentMapping[]>
  ): TransformationRule[] {
    
    const rules: TransformationRule[] = [];
    
    // Similar to font-size but for color classes
    colorPattern.values.forEach((mapping, colorValue) => {
      components.forEach(component => {
        component.domElements.forEach(element => {
          
          const colorClasses = element.classes.filter(cls => 
            cls.startsWith('text-') && 
            (cls.includes('slate') || cls.includes('gray') || cls.includes('blue') || 
             cls.includes('red') || cls.includes('green') || cls.includes('yellow'))
          );
          
          colorClasses.forEach(colorClass => {
            const rule: TransformationRule = {
              id: `color-${component.name}-${element.lineNumber}-${colorClass}-to-${colorValue}`,
              selector: element.selector,
              property: 'color',
              fromValue: colorClass,
              toValue: mapping.className,
              action: 'replace-class',
              target: {
                filePath: component.filePath,
                searchPattern: `className.*${this.escapeRegex(colorClass)}`,
                replacePattern: colorClass + ' -> ' + mapping.className
              },
              confidence: mapping.confidence * 0.7
            };
            
            rules.push(rule);
          });
        });
      });
    });
    
    return rules;
  }

  private generateSpacingRules(
    components: ComponentStructure[],
    spacingPattern: StylingPattern,
    _domMappings: Map<string, ComponentMapping[]>
  ): TransformationRule[] {
    
    const rules: TransformationRule[] = [];
    
    spacingPattern.values.forEach((mapping, spacingValue) => {
      components.forEach(component => {
        component.domElements.forEach(element => {
          
          const spacingClasses = element.classes.filter(cls => 
            /^[pm][trblxy]?-/.test(cls) || // padding/margin classes
            /^[wh]-/.test(cls) || // width/height classes
            /^gap-/.test(cls) // gap classes
          );
          
          spacingClasses.forEach(spacingClass => {
            const rule: TransformationRule = {
              id: `spacing-${component.name}-${element.lineNumber}-${spacingClass}-to-${spacingValue}`,
              selector: element.selector,
              property: 'spacing',
              fromValue: spacingClass,
              toValue: mapping.className,
              action: 'replace-class',
              target: {
                filePath: component.filePath,
                searchPattern: `className.*${this.escapeRegex(spacingClass)}`,
                replacePattern: spacingClass + ' -> ' + mapping.className
              },
              confidence: mapping.confidence * 0.6
            };
            
            rules.push(rule);
          });
        });
      });
    });
    
    return rules;
  }

  private generateLayoutRules(
    components: ComponentStructure[],
    layoutPattern: StylingPattern,
    _domMappings: Map<string, ComponentMapping[]>
  ): TransformationRule[] {
    
    const rules: TransformationRule[] = [];
    
    layoutPattern.values.forEach((mapping, layoutValue) => {
      components.forEach(component => {
        component.domElements.forEach(element => {
          
          const layoutClasses = element.classes.filter(cls => 
            ['flex', 'grid', 'block', 'inline', 'inline-block', 'hidden'].includes(cls) ||
            cls.startsWith('flex-') ||
            cls.startsWith('grid-') ||
            cls.startsWith('justify-') ||
            cls.startsWith('items-')
          );
          
          layoutClasses.forEach(layoutClass => {
            const rule: TransformationRule = {
              id: `layout-${component.name}-${element.lineNumber}-${layoutClass}-to-${layoutValue}`,
              selector: element.selector,
              property: 'layout',
              fromValue: layoutClass,
              toValue: mapping.className,
              action: 'replace-class',
              target: {
                filePath: component.filePath,
                searchPattern: `className.*${this.escapeRegex(layoutClass)}`,
                replacePattern: layoutClass + ' -> ' + mapping.className
              },
              confidence: mapping.confidence * 0.7
            };
            
            rules.push(rule);
          });
        });
      });
    });
    
    return rules;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
