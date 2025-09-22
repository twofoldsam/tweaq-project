import type { CSSMapping, ConfidenceLevel, AdapterPreview, PendingEdit } from '../types';

// Tailwind CSS property mappings
const TAILWIND_MAPPINGS: Record<string, { pattern: RegExp; mapper: (value: string) => { class?: string; confidence: ConfidenceLevel } }> = {
  // Colors
  color: {
    pattern: /.*/,
    mapper: (value: string) => {
      const colorMap: Record<string, string> = {
        '#000000': 'text-black',
        '#ffffff': 'text-white',
        '#ef4444': 'text-red-500',
        '#22c55e': 'text-green-500',
        '#3b82f6': 'text-blue-500',
        '#a855f7': 'text-purple-500',
        '#f59e0b': 'text-yellow-500',
        '#6b7280': 'text-gray-500',
        '#374151': 'text-gray-700',
        '#1f2937': 'text-gray-800',
        '#111827': 'text-gray-900',
      };
      
      const exactMatch = colorMap[value.toLowerCase()];
      if (exactMatch) return { class: exactMatch, confidence: 'high' };
      
      // Try to match RGB values
      if (value.startsWith('rgb(')) {
        return { class: `text-[${value}]`, confidence: 'medium' };
      }
      
      // Try to match hex values
      if (value.startsWith('#')) {
        return { class: `text-[${value}]`, confidence: 'medium' };
      }
      
      return { confidence: 'low' };
    }
  },

  backgroundColor: {
    pattern: /.*/,
    mapper: (value: string) => {
      const colorMap: Record<string, string> = {
        '#000000': 'bg-black',
        '#ffffff': 'bg-white',
        '#ef4444': 'bg-red-500',
        '#22c55e': 'bg-green-500',
        '#3b82f6': 'bg-blue-500',
        '#a855f7': 'bg-purple-500',
        '#f59e0b': 'bg-yellow-500',
        '#6b7280': 'bg-gray-500',
        '#374151': 'bg-gray-700',
        '#1f2937': 'bg-gray-800',
        '#111827': 'bg-gray-900',
      };
      
      const exactMatch = colorMap[value.toLowerCase()];
      if (exactMatch) return { class: exactMatch, confidence: 'high' };
      
      if (value.startsWith('rgb(') || value.startsWith('#')) {
        return { class: `bg-[${value}]`, confidence: 'medium' };
      }
      
      return { confidence: 'low' };
    }
  },

  // Typography
  fontSize: {
    pattern: /^(\d+)px$/,
    mapper: (value: string) => {
      const sizeMap: Record<string, string> = {
        '12px': 'text-xs',
        '14px': 'text-sm',
        '16px': 'text-base',
        '18px': 'text-lg',
        '20px': 'text-xl',
        '24px': 'text-2xl',
        '30px': 'text-3xl',
        '36px': 'text-4xl',
        '48px': 'text-5xl',
        '60px': 'text-6xl',
      };
      
      const exactMatch = sizeMap[value];
      if (exactMatch) return { class: exactMatch, confidence: 'high' };
      
      const match = value.match(/^(\d+)px$/);
      if (match) {
        return { class: `text-[${value}]`, confidence: 'medium' };
      }
      
      return { confidence: 'low' };
    }
  },

  fontWeight: {
    pattern: /.*/,
    mapper: (value: string) => {
      const weightMap: Record<string, string> = {
        '100': 'font-thin',
        '200': 'font-extralight',
        '300': 'font-light',
        '400': 'font-normal',
        '500': 'font-medium',
        '600': 'font-semibold',
        '700': 'font-bold',
        '800': 'font-extrabold',
        '900': 'font-black',
        'normal': 'font-normal',
        'bold': 'font-bold',
      };
      
      const exactMatch = weightMap[value];
      if (exactMatch) return { class: exactMatch, confidence: 'high' };
      
      return { confidence: 'low' };
    }
  },

  textAlign: {
    pattern: /.*/,
    mapper: (value: string) => {
      const alignMap: Record<string, string> = {
        'left': 'text-left',
        'center': 'text-center',
        'right': 'text-right',
        'justify': 'text-justify',
      };
      
      const exactMatch = alignMap[value];
      if (exactMatch) return { class: exactMatch, confidence: 'high' };
      
      return { confidence: 'low' };
    }
  },

  // Layout
  display: {
    pattern: /.*/,
    mapper: (value: string) => {
      const displayMap: Record<string, string> = {
        'block': 'block',
        'inline': 'inline',
        'inline-block': 'inline-block',
        'flex': 'flex',
        'inline-flex': 'inline-flex',
        'grid': 'grid',
        'inline-grid': 'inline-grid',
        'none': 'hidden',
      };
      
      const exactMatch = displayMap[value];
      if (exactMatch) return { class: exactMatch, confidence: 'high' };
      
      return { confidence: 'low' };
    }
  },

  // Spacing
  margin: {
    pattern: /^(\d+)px$/,
    mapper: (value: string) => {
      const spaceMap: Record<string, string> = {
        '0px': 'm-0',
        '4px': 'm-1',
        '8px': 'm-2',
        '12px': 'm-3',
        '16px': 'm-4',
        '20px': 'm-5',
        '24px': 'm-6',
        '32px': 'm-8',
        '40px': 'm-10',
        '48px': 'm-12',
      };
      
      const exactMatch = spaceMap[value];
      if (exactMatch) return { class: exactMatch, confidence: 'high' };
      
      const match = value.match(/^(\d+)px$/);
      if (match && match[1]) {
        const px = parseInt(match[1]);
        const rem = px / 16;
        return { class: `m-[${rem}rem]`, confidence: 'medium' };
      }
      
      return { confidence: 'low' };
    }
  },

  padding: {
    pattern: /^(\d+)px$/,
    mapper: (value: string) => {
      const spaceMap: Record<string, string> = {
        '0px': 'p-0',
        '4px': 'p-1',
        '8px': 'p-2',
        '12px': 'p-3',
        '16px': 'p-4',
        '20px': 'p-5',
        '24px': 'p-6',
        '32px': 'p-8',
        '40px': 'p-10',
        '48px': 'p-12',
      };
      
      const exactMatch = spaceMap[value];
      if (exactMatch) return { class: exactMatch, confidence: 'high' };
      
      const match = value.match(/^(\d+)px$/);
      if (match && match[1]) {
        const px = parseInt(match[1]);
        const rem = px / 16;
        return { class: `p-[${rem}rem]`, confidence: 'medium' };
      }
      
      return { confidence: 'low' };
    }
  },

  // Border radius
  borderRadius: {
    pattern: /^(\d+)px$/,
    mapper: (value: string) => {
      const radiusMap: Record<string, string> = {
        '0px': 'rounded-none',
        '2px': 'rounded-sm',
        '4px': 'rounded',
        '6px': 'rounded-md',
        '8px': 'rounded-lg',
        '12px': 'rounded-xl',
        '16px': 'rounded-2xl',
        '24px': 'rounded-3xl',
        '9999px': 'rounded-full',
      };
      
      const exactMatch = radiusMap[value];
      if (exactMatch) return { class: exactMatch, confidence: 'high' };
      
      const match = value.match(/^(\d+)px$/);
      if (match) {
        return { class: `rounded-[${value}]`, confidence: 'medium' };
      }
      
      return { confidence: 'low' };
    }
  },

  // Opacity
  opacity: {
    pattern: /^0(\.\d+)?$|^1(\.0+)?$/,
    mapper: (value: string) => {
      const opacityMap: Record<string, string> = {
        '0': 'opacity-0',
        '0.05': 'opacity-5',
        '0.1': 'opacity-10',
        '0.25': 'opacity-25',
        '0.5': 'opacity-50',
        '0.75': 'opacity-75',
        '0.95': 'opacity-95',
        '1': 'opacity-100',
      };
      
      const exactMatch = opacityMap[value];
      if (exactMatch) return { class: exactMatch, confidence: 'high' };
      
      const num = parseFloat(value);
      if (num >= 0 && num <= 1) {
        const percent = Math.round(num * 100);
        return { class: `opacity-[${percent}%]`, confidence: 'medium' };
      }
      
      return { confidence: 'low' };
    }
  },
};

/**
 * Maps a CSS property and value to a Tailwind class or raw CSS
 */
export function mapCSSToTailwind(property: string, value: string): CSSMapping {
  const mapping = TAILWIND_MAPPINGS[property];
  
  if (mapping && mapping.pattern.test(value)) {
    const result = mapping.mapper(value);
  return {
    property,
    value,
    tailwindClass: result.class || undefined,
    confidence: result.confidence,
  };
  }
  
  // Fallback to raw CSS
  return {
    property,
    value,
    rawCSS: `${property.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`,
    confidence: 'low',
  };
}

/**
 * Creates an adapter preview from pending edits
 */
export function createAdapterPreview(
  selector: string,
  pendingEdits: Map<string, PendingEdit>
): AdapterPreview {
  const mappings: CSSMapping[] = [];
  let totalConfidenceScore = 0;
  
  for (const [, edit] of pendingEdits) {
    const mapping = mapCSSToTailwind(edit.property, edit.after);
    mappings.push(mapping);
    
    // Calculate confidence score
    switch (mapping.confidence) {
      case 'high': totalConfidenceScore += 3; break;
      case 'medium': totalConfidenceScore += 2; break;
      case 'low': totalConfidenceScore += 1; break;
    }
  }
  
  // Calculate overall confidence
  const avgScore = totalConfidenceScore / mappings.length;
  let overallConfidence: ConfidenceLevel = 'low';
  if (avgScore >= 2.5) overallConfidence = 'high';
  else if (avgScore >= 1.5) overallConfidence = 'medium';
  
  return {
    id: `adapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    selector,
    mappings,
    overallConfidence,
  };
}

/**
 * Generates CSS rules from adapter preview
 */
export function generateAdapterCSS(preview: AdapterPreview): string {
  const rules: string[] = [];
  
  for (const mapping of preview.mappings) {
    if (mapping.tailwindClass) {
      // For Tailwind classes, we need to apply the actual CSS
      // This is a simplified version - in a real implementation,
      // you'd want to use the full Tailwind CSS definitions
      const cssRule = tailwindToCSSRule(mapping.tailwindClass, mapping.property, mapping.value);
      if (cssRule) rules.push(cssRule);
    } else if (mapping.rawCSS) {
      rules.push(mapping.rawCSS);
    }
  }
  
  if (rules.length === 0) return '';
  
  return `${preview.selector} {\n  ${rules.join(';\n  ')};\n}`;
}

/**
 * Simplified Tailwind to CSS conversion
 * In a real implementation, this would use the full Tailwind CSS definitions
 */
function tailwindToCSSRule(tailwindClass: string, property: string, value: string): string | null {
  // For classes with arbitrary values like text-[#ff0000]
  if (tailwindClass.includes('[') && tailwindClass.includes(']')) {
    const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
    return `${cssProperty}: ${value}`;
  }
  
  // For standard Tailwind classes, return the raw CSS as fallback
  const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `${cssProperty}: ${value}`;
}

/**
 * Injects CSS override styles into the page
 */
export function injectAdapterCSS(css: string): void {
  // Remove existing override styles
  const existingStyle = document.getElementById('__smartqa-override');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  if (!css.trim()) return;
  
  // Create new style element
  const style = document.createElement('style');
  style.id = '__smartqa-override';
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Removes injected adapter CSS
 */
export function removeAdapterCSS(): void {
  const existingStyle = document.getElementById('__smartqa-override');
  if (existingStyle) {
    existingStyle.remove();
  }
}
