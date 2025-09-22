import type { VisualEdit, AdapterPreview, CSSMapping } from '../types';

export interface GitHubContextInfo {
  owner: string;
  repo: string;
  branch: string;
  filePath?: string;
  projectType?: 'react' | 'vue' | 'angular' | 'vanilla' | 'unknown';
  cssFramework?: 'tailwind' | 'bootstrap' | 'material-ui' | 'styled-components' | 'unknown';
}

export interface EnhancedPreviewOptions {
  githubContext?: GitHubContextInfo;
  includeFrameworkSpecific?: boolean;
  generatePullRequestDiff?: boolean;
}

/**
 * Detects the project type and CSS framework from GitHub repository
 */
export async function detectProjectContext(
  owner: string, 
  repo: string, 
  branch: string = 'main'
): Promise<GitHubContextInfo> {
  try {
    // This would typically make API calls to GitHub to analyze the repository
    // For now, we'll return a basic implementation
    
    const context: GitHubContextInfo = {
      owner,
      repo,
      branch,
      projectType: 'unknown',
      cssFramework: 'unknown',
    };

    // In a real implementation, you would:
    // 1. Fetch package.json to detect framework dependencies
    // 2. Look for config files (tailwind.config.js, etc.)
    // 3. Analyze file structure and imports
    // 4. Check for common patterns in CSS/component files
    
    // Mock detection logic for demonstration
    const packageJsonUrl = `https://api.github.com/repos/${owner}/${repo}/contents/package.json?ref=${branch}`;
    
    try {
      const response = await fetch(packageJsonUrl);
      if (response.ok) {
        const data = await response.json();
        const packageContent = JSON.parse(atob(data.content));
        
        // Detect framework
        if (packageContent.dependencies?.react || packageContent.devDependencies?.react) {
          context.projectType = 'react';
        } else if (packageContent.dependencies?.vue || packageContent.devDependencies?.vue) {
          context.projectType = 'vue';
        } else if (packageContent.dependencies?.['@angular/core']) {
          context.projectType = 'angular';
        }
        
        // Detect CSS framework
        if (packageContent.dependencies?.tailwindcss || packageContent.devDependencies?.tailwindcss) {
          context.cssFramework = 'tailwind';
        } else if (packageContent.dependencies?.bootstrap) {
          context.cssFramework = 'bootstrap';
        } else if (packageContent.dependencies?.['@mui/material']) {
          context.cssFramework = 'material-ui';
        } else if (packageContent.dependencies?.['styled-components']) {
          context.cssFramework = 'styled-components';
        }
      }
    } catch (error) {
      console.warn('Could not fetch package.json for context detection:', error);
    }
    
    return context;
  } catch (error) {
    console.error('Error detecting project context:', error);
    return {
      owner,
      repo,
      branch,
      projectType: 'unknown',
      cssFramework: 'unknown',
    };
  }
}

/**
 * Enhances CSS mappings based on GitHub project context
 */
export function enhanceCSSMappingsWithContext(
  mappings: CSSMapping[],
  context: GitHubContextInfo
): CSSMapping[] {
  return mappings.map(mapping => {
    let enhancedMapping = { ...mapping };
    
    // Enhance confidence based on detected framework
    if (context.cssFramework === 'tailwind' && mapping.tailwindClass) {
      enhancedMapping.confidence = 'high';
    } else if (context.cssFramework === 'bootstrap') {
      // Convert Tailwind classes to Bootstrap equivalents
      enhancedMapping = enhanceWithBootstrap(mapping);
    } else if (context.cssFramework === 'material-ui') {
      // Convert to Material-UI theme-based styles
      enhancedMapping = enhanceWithMaterialUI(mapping);
    }
    
    return enhancedMapping;
  });
}

/**
 * Converts Tailwind-style mappings to Bootstrap equivalents
 */
function enhanceWithBootstrap(mapping: CSSMapping): CSSMapping {
  const bootstrapMap: Record<string, string> = {
    'text-center': 'text-center',
    'text-left': 'text-start',
    'text-right': 'text-end',
    'font-bold': 'fw-bold',
    'font-normal': 'fw-normal',
    'text-lg': 'fs-5',
    'text-xl': 'fs-4',
    'text-2xl': 'fs-3',
    'bg-blue-500': 'bg-primary',
    'bg-red-500': 'bg-danger',
    'bg-green-500': 'bg-success',
    'text-blue-500': 'text-primary',
    'text-red-500': 'text-danger',
    'text-green-500': 'text-success',
    'p-4': 'p-3',
    'm-4': 'm-3',
    'rounded': 'rounded',
    'rounded-lg': 'rounded-3',
  };
  
  if (mapping.tailwindClass && bootstrapMap[mapping.tailwindClass]) {
    return {
      ...mapping,
      tailwindClass: undefined as string | undefined,
      rawCSS: `/* Bootstrap: ${bootstrapMap[mapping.tailwindClass]} */ ${mapping.rawCSS || ''}`,
      confidence: 'medium',
    };
  }
  
  return mapping;
}

/**
 * Converts mappings to Material-UI theme-based styles
 */
function enhanceWithMaterialUI(mapping: CSSMapping): CSSMapping {
  const muiThemeMap: Record<string, string> = {
    'text-blue-500': 'color: theme.palette.primary.main',
    'bg-blue-500': 'backgroundColor: theme.palette.primary.main',
    'text-red-500': 'color: theme.palette.error.main',
    'bg-red-500': 'backgroundColor: theme.palette.error.main',
    'font-bold': 'fontWeight: theme.typography.fontWeightBold',
    'text-lg': 'fontSize: theme.typography.h6.fontSize',
    'text-xl': 'fontSize: theme.typography.h5.fontSize',
  };
  
  if (mapping.tailwindClass && muiThemeMap[mapping.tailwindClass]) {
    return {
      ...mapping,
      tailwindClass: undefined as string | undefined,
      rawCSS: `/* MUI Theme: */ ${muiThemeMap[mapping.tailwindClass]}`,
      confidence: 'medium',
    };
  }
  
  return mapping;
}

/**
 * Generates a code diff for creating a pull request
 */
export function generatePullRequestDiff(
  visualEdits: VisualEdit[],
  context: GitHubContextInfo
): string {
  if (visualEdits.length === 0) return '';
  
  let diff = `# Visual Edits Summary\n\n`;
  diff += `Repository: ${context.owner}/${context.repo}\n`;
  diff += `Branch: ${context.branch}\n`;
  diff += `Project Type: ${context.projectType}\n`;
  diff += `CSS Framework: ${context.cssFramework}\n\n`;
  
  diff += `## Changes Made\n\n`;
  
  visualEdits.forEach((edit, index) => {
    diff += `### Edit ${index + 1}: ${edit.element.tagName}${edit.element.id ? '#' + edit.element.id : ''}${edit.element.className ? '.' + edit.element.className.split(' ').join('.') : ''}\n\n`;
    diff += `**Selector:** \`${edit.element.selector}\`\n\n`;
    diff += `**Changes:**\n`;
    
    edit.changes.forEach(change => {
      diff += `- **${change.property}:** \`${change.before}\` → \`${change.after}\`\n`;
    });
    
    diff += `\n**Timestamp:** ${new Date(edit.timestamp).toISOString()}\n\n`;
  });
  
  // Generate CSS code
  if (context.cssFramework === 'tailwind') {
    diff += `## Suggested Tailwind Classes\n\n`;
    diff += generateTailwindSuggestions(visualEdits);
  } else {
    diff += `## Suggested CSS\n\n`;
    diff += generateRawCSSSuggestions(visualEdits);
  }
  
  return diff;
}

/**
 * Generates Tailwind class suggestions from visual edits
 */
function generateTailwindSuggestions(visualEdits: VisualEdit[]): string {
  let suggestions = '';
  
  visualEdits.forEach(edit => {
    suggestions += `\`\`\`css\n/* ${edit.element.selector} */\n`;
    
    edit.changes.forEach(change => {
      // This would use the cssAdapter utility to convert to Tailwind
      suggestions += `.${edit.element.selector.replace(/[#.]/, '')} {\n`;
      suggestions += `  /* ${change.property}: ${change.after}; */\n`;
      suggestions += `  /* Suggested Tailwind class: [to be determined by cssAdapter] */\n`;
      suggestions += `}\n`;
    });
    
    suggestions += `\`\`\`\n\n`;
  });
  
  return suggestions;
}

/**
 * Generates raw CSS suggestions from visual edits
 */
function generateRawCSSSuggestions(visualEdits: VisualEdit[]): string {
  let css = '';
  
  visualEdits.forEach(edit => {
    css += `\`\`\`css\n/* ${edit.element.selector} */\n`;
    css += `${edit.element.selector} {\n`;
    
    edit.changes.forEach(change => {
      const cssProperty = change.property.replace(/([A-Z])/g, '-$1').toLowerCase();
      css += `  ${cssProperty}: ${change.after};\n`;
    });
    
    css += `}\n\`\`\`\n\n`;
  });
  
  return css;
}

/**
 * Creates an enhanced adapter preview with GitHub context
 */
export async function createEnhancedAdapterPreview(
  selector: string,
  pendingEdits: Map<string, any>,
  options: EnhancedPreviewOptions = {}
): Promise<AdapterPreview> {
  // Import the base adapter functionality
  const { createAdapterPreview } = await import('./cssAdapter');
  
  // Create base preview
  let preview = createAdapterPreview(selector, pendingEdits);
  
  // Enhance with GitHub context if available
  if (options.githubContext) {
    preview.mappings = enhanceCSSMappingsWithContext(
      preview.mappings,
      options.githubContext
    );
    
    // Recalculate overall confidence
    const totalConfidenceScore = preview.mappings.reduce((sum, mapping) => {
      switch (mapping.confidence) {
        case 'high': return sum + 3;
        case 'medium': return sum + 2;
        case 'low': return sum + 1;
        default: return sum;
      }
    }, 0);
    
    const avgScore = totalConfidenceScore / preview.mappings.length;
    if (avgScore >= 2.5) preview.overallConfidence = 'high';
    else if (avgScore >= 1.5) preview.overallConfidence = 'medium';
    else preview.overallConfidence = 'low';
  }
  
  return preview;
}
