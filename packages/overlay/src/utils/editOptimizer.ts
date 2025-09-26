/**
 * Edit Optimizer Utilities
 * 
 * Helper functions to create optimized VisualEdit structures at the source
 */

import { VisualEdit, PendingEdit } from '../types';

// Session management
let currentSessionId: string | null = null;

/**
 * Initialize a new editing session
 */
export function initializeSession(): string {
  currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return currentSessionId;
}

/**
 * Get the current session ID
 */
export function getCurrentSessionId(): string | null {
  return currentSessionId;
}

/**
 * Create an optimized VisualEdit from pending edits
 */
export function createOptimizedVisualEdit(
  element: HTMLElement,
  pendingEdits: Map<string, PendingEdit>,
  selector: string
): VisualEdit {
  // Ensure we have a session
  if (!currentSessionId) {
    initializeSession();
  }

  // Get enhanced element information
  const elementInfo = getEnhancedElementInfo(element, selector);
  
  // Process and categorize changes
  const optimizedChanges = Array.from(pendingEdits.values()).map(edit => 
    optimizeChange(edit, element)
  );

  // Infer user intent
  const intent = inferUserIntent(optimizedChanges, element);

  return {
    id: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    ...(currentSessionId ? { sessionId: currentSessionId } : {}),
    element: elementInfo,
    changes: optimizedChanges,
    intent,
    validation: {
      applied: true,
      errors: [],
      warnings: []
    }
  };
}

/**
 * Get enhanced element information
 */
function getEnhancedElementInfo(element: HTMLElement, selector: string): VisualEdit['element'] {
  // Get computed styles for key properties
  const computedStyle = window.getComputedStyle(element);
  const computedStyles: Record<string, string> = {};
  
  // Collect important computed styles
  const importantStyles = [
    'display', 'position', 'width', 'height', 'margin', 'padding',
    'backgroundColor', 'color', 'fontSize', 'fontFamily', 'lineHeight',
    'border', 'borderRadius', 'boxShadow', 'opacity', 'zIndex'
  ];
  
  importantStyles.forEach(prop => {
    const value = computedStyle.getPropertyValue(prop);
    if (value) {
      computedStyles[prop] = value;
    }
  });

  // Get bounding rectangle
  const rect = element.getBoundingClientRect();
  const boundingRect = {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height
  };

  const componentPath = inferComponentPath(element);
  const componentName = inferComponentName(element);
  const textContent = element.textContent?.trim();

  return {
    selector,
    tagName: element.tagName,
    id: element.id || undefined,
    className: element.className || undefined,
    ...(textContent ? { textContent } : {}),
    ...(Object.keys(computedStyles).length > 0 ? { computedStyles } : {}),
    ...(boundingRect ? { boundingRect } : {}),
    ...(componentPath ? { componentPath } : {}),
    ...(componentName ? { componentName } : {})
  };
}

/**
 * Optimize a single change with categorization
 */
function optimizeChange(edit: PendingEdit, element: HTMLElement): VisualEdit['changes'][0] {
  return {
    property: edit.property,
    before: edit.before,
    after: edit.after,
    category: categorizeProperty(edit.property),
    impact: determineImpact(edit.property, edit.before, edit.after, element),
    confidence: calculateConfidence(edit, element)
  };
}

/**
 * Categorize CSS property
 */
function categorizeProperty(property: string): VisualEdit['changes'][0]['category'] {
  const colorProps = ['color', 'background-color', 'border-color', 'outline-color', 'text-decoration-color'];
  const spacingProps = ['margin', 'padding', 'gap', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right', 
                       'padding-top', 'padding-bottom', 'padding-left', 'padding-right'];
  const layoutProps = ['display', 'position', 'width', 'height', 'top', 'left', 'right', 'bottom', 
                      'flex', 'grid', 'float', 'clear', 'overflow', 'z-index'];
  const typographyProps = ['font-size', 'font-family', 'font-weight', 'line-height', 'text-align', 
                          'text-decoration', 'letter-spacing', 'word-spacing', 'text-transform'];
  const borderProps = ['border', 'border-width', 'border-style', 'border-radius', 'outline', 'border-top',
                      'border-right', 'border-bottom', 'border-left'];
  const backgroundProps = ['background', 'background-image', 'background-size', 'background-position',
                          'background-repeat', 'background-attachment'];
  const animationProps = ['transition', 'animation', 'transform', 'opacity', 'filter'];

  const prop = property.toLowerCase();
  
  if (colorProps.some(p => prop.includes(p))) return 'color';
  if (spacingProps.some(p => prop.includes(p))) return 'spacing';
  if (layoutProps.some(p => prop.includes(p))) return 'layout';
  if (typographyProps.some(p => prop.includes(p))) return 'typography';
  if (borderProps.some(p => prop.includes(p))) return 'border';
  if (backgroundProps.some(p => prop.includes(p))) return 'background';
  if (animationProps.some(p => prop.includes(p))) return 'animation';
  
  return 'other';
}

/**
 * Determine the impact type of a change
 */
function determineImpact(
  property: string, 
  _before: string, 
  _after: string, 
  _element: HTMLElement
): VisualEdit['changes'][0]['impact'] {
  const structuralProps = ['display', 'position', 'width', 'height', 'flex', 'grid', 'float'];
  const behavioralProps = ['cursor', 'pointer-events', 'user-select', 'overflow', 'z-index'];

  const prop = property.toLowerCase();

  if (structuralProps.some(p => prop.includes(p))) {
    return 'structural';
  }
  if (behavioralProps.some(p => prop.includes(p))) {
    return 'behavioral';
  }
  return 'visual';
}

/**
 * Calculate confidence in the before/after values
 */
function calculateConfidence(edit: PendingEdit, element: HTMLElement): number {
  let confidence = 0.8; // Base confidence
  
  // Reduce confidence for computed/auto values
  if (edit.before.includes('auto') || edit.before.includes('inherit') || edit.before.includes('initial')) {
    confidence -= 0.2;
  }
  
  // Reduce confidence if the before value seems to be a computed value (very precise decimals)
  if (/\d+\.\d{3,}px/.test(edit.before)) {
    confidence -= 0.1;
  }
  
  // Increase confidence for explicit units and values
  if (/^\d+(\.\d{1,2})?(px|em|rem|%|vh|vw)$/.test(edit.after)) {
    confidence += 0.1;
  }
  
  // Increase confidence for color values
  if (/^#[0-9a-fA-F]{6}$/.test(edit.after) || /^rgb\(/.test(edit.after) || /^rgba\(/.test(edit.after)) {
    confidence += 0.1;
  }
  
  // Verify the change was actually applied
  try {
    const currentValue = window.getComputedStyle(element).getPropertyValue(edit.property);
    if (currentValue === edit.after) {
      confidence += 0.1;
    }
  } catch (error) {
    confidence -= 0.1;
  }
  
  return Math.max(0.1, Math.min(1.0, confidence));
}

/**
 * Infer user intent from change patterns
 */
function inferUserIntent(changes: VisualEdit['changes'], _element: HTMLElement): VisualEdit['intent'] {
  const categories = changes.map(c => c.category);
  
  // Build description based on change patterns
  const descriptions: string[] = [];
  const categoryCount: Record<string, number> = {};
  
  categories.forEach(cat => {
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  
  Object.entries(categoryCount).forEach(([category, count]) => {
    if (count === 1) {
      descriptions.push(`${category} adjustment`);
    } else {
      descriptions.push(`${category} modifications (${count} properties)`);
    }
  });
  
  // Determine user action type
  let userAction: VisualEdit['intent']['userAction'] = 'direct-edit';
  
  if (changes.length > 5) {
    userAction = 'batch-operation';
  } else if (categories.length > 0 && categories.every(cat => cat === categories[0]) && changes.length > 2) {
    userAction = 'copy-from'; // Likely copying similar styles
  }
  
  return {
    description: descriptions.join(', ') || 'Visual modification',
    userAction,
    relatedEdits: [] // Will be populated by session analysis
  };
}

/**
 * Infer component path from element
 */
function inferComponentPath(element: HTMLElement): string | undefined {
  // Look for React component indicators
  const classes = element.className.split(' ');
  
  // Common React component class patterns
  const componentClass = classes.find(cls => 
    /^[A-Z]/.test(cls) || // PascalCase
    cls.includes('component') ||
    cls.includes('Component') ||
    cls.includes('-component') ||
    cls.includes('_component')
  );
  
  if (componentClass) {
    // Convert class name to likely component path
    const componentName = componentClass.replace(/[-_]/g, '');
    return `src/components/${componentName}.tsx`;
  }
  
  // Look for data attributes that might indicate components
  const dataComponent = element.getAttribute('data-component');
  if (dataComponent) {
    return `src/components/${dataComponent}.tsx`;
  }
  
  return undefined;
}

/**
 * Infer component name from element
 */
function inferComponentName(element: HTMLElement): string | undefined {
  const classes = element.className.split(' ');
  
  // Look for PascalCase class names (likely component names)
  const componentClass = classes.find(cls => /^[A-Z][a-zA-Z]*$/.test(cls));
  if (componentClass) {
    return componentClass;
  }
  
  // Look for data attributes
  const dataComponent = element.getAttribute('data-component');
  if (dataComponent) {
    return dataComponent;
  }
  
  return undefined;
}

/**
 * Analyze multiple edits to find relationships and batch operations
 */
export function analyzeEditRelationships(edits: VisualEdit[]): VisualEdit[] {
  if (edits.length <= 1) return edits;
  
  // Group edits by timing (within 5 seconds = likely related)
  const timeThreshold = 5000;
  const groups: VisualEdit[][] = [];
  
  for (const edit of edits) {
    let addedToGroup = false;
    
      for (const group of groups) {
        const lastEditInGroup = group[group.length - 1];
        if (!lastEditInGroup) continue;
        
        const timeDiff = edit.timestamp - lastEditInGroup.timestamp;
      
      if (timeDiff <= timeThreshold) {
        // Check if changes are similar (same categories)
        const editCategories = edit.changes.map(c => c.category);
        const groupCategories = lastEditInGroup.changes.map(c => c.category);
        const hasOverlap = editCategories.some(cat => groupCategories.includes(cat));
        
        if (hasOverlap) {
          group.push(edit);
          addedToGroup = true;
          break;
        }
      }
    }
    
    if (!addedToGroup) {
      groups.push([edit]);
    }
  }
  
  // Update related edits for each group
  return edits.map(edit => {
    const group = groups.find(g => g.includes(edit));
    if (group && group.length > 1) {
      const relatedIds = group.filter(e => e.id !== edit.id).map(e => e.id);
        return {
          ...edit,
          intent: {
            ...edit.intent!,
            relatedEdits: relatedIds,
            userAction: group.length > 3 ? 'batch-operation' : ((edit.intent && edit.intent.userAction) || 'direct-edit')
          }
        };
    }
    return edit;
  });
}

/**
 * Generate element selector with fallbacks
 */
export function generateElementSelector(element: HTMLElement): string {
  // Priority order: ID > unique class combination > nth-child
  
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).join('.');
    if (classes) {
      // Check if this selector is unique
      try {
        const matches = document.querySelectorAll(`.${classes}`);
        if (matches.length === 1) {
          return `.${classes}`;
        }
      } catch (error) {
        // Invalid selector, continue to fallback
      }
    }
  }
  
  // Fallback to nth-child
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(el => el.tagName === element.tagName);
    const index = siblings.indexOf(element);
    return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
  }
  
  return element.tagName.toLowerCase();
}
