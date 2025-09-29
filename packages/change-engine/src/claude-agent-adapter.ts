import type { LLMProvider } from './types';

// Symbolic analysis context that provides high-value information to the agent
interface SymbolicContext {
  domMappings: Map<string, Array<{
    componentName: string;
    filePath: string;
    confidence: number;
    reasoning: string;
  }>>;
  componentStructure: Array<{
    name: string;
    filePath: string;
    framework: 'react' | 'vue' | 'svelte';
    styling: {
      approach: 'tailwind' | 'css-modules' | 'styled-components' | 'css';
      classes: string[];
    };
  }>;
  transformationRules: Array<{
    id: string;
    pattern: string;
    replacement: string;
    confidence: number;
    context: string[];
  }>;
  stylingApproach: 'tailwind' | 'css-modules' | 'styled-components' | 'mixed';
}

interface RepositoryContext {
  owner: string;
  repo: string;
  branch: string;
  githubToken: string;
}

/**
 * Claude Agent Adapter for direct repository access and intelligent code modification
 * Eliminates need for local cloning by giving Claude direct repository context
 */
export class ClaudeAgentAdapter implements LLMProvider {
  constructor(
    private apiKey: string,
    private repository: RepositoryContext,
    private symbolicContext?: SymbolicContext
  ) {}

  async generateCodeChanges(options: {
    fileContent: string;
    filePath: string;
    intent: string;
    targetElement?: string;
    context?: string;
  }): Promise<{
    success: boolean;
    modifiedContent?: string;
    error?: string;
  }> {
    try {
      console.log(`🤖 Using Claude Agent for repository-aware code modification`);
      
      // Get enhanced context from symbolic analysis
      const enhancedContext = this.buildEnhancedContext(options);
      
      // Build agent-optimized prompt with repository context
      const prompt = this.buildAgentPrompt(options, enhancedContext);
      
      console.log(`🧠 Sending repository-aware prompt to Claude (${prompt.length} chars)`);
      
      const response = await this.callClaudeAPI(prompt);
      console.log(`✅ Claude Agent response received (${response.length} chars)`);
      
      // Extract the modified code from the response
      const modifiedContent = this.extractCodeFromResponse(response, options.fileContent);
      
      if (modifiedContent) {
        return {
          success: true,
          modifiedContent
        };
      } else {
        return {
          success: false,
          error: 'Could not extract valid code from Claude Agent response'
        };
      }
    } catch (error) {
      console.error('❌ Claude Agent failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Build enhanced context using symbolic analysis
   */
  private buildEnhancedContext(options: {
    filePath: string;
    targetElement?: string;
    intent: string;
  }): any {
    if (!this.symbolicContext) {
      return null;
    }

    // Find relevant DOM mappings for this change
    const relevantMappings = [];
    for (const [selector, mappings] of this.symbolicContext.domMappings.entries()) {
      const fileMatches = mappings.some(m => m.filePath === options.filePath);
      if (fileMatches) {
        relevantMappings.push({ selector, mappings });
      }
    }

    // Find component structure for this file
    const componentInfo = this.symbolicContext.componentStructure.find(
      comp => comp.filePath === options.filePath
    );

    // Find relevant transformation rules
    const relevantRules = this.symbolicContext.transformationRules.filter(
      rule => rule.context.some(ctx => 
        ctx.includes(options.filePath) || 
        options.intent.toLowerCase().includes(ctx.toLowerCase())
      )
    );

    return {
      domMappings: relevantMappings,
      componentInfo,
      transformationRules: relevantRules,
      stylingApproach: this.symbolicContext.stylingApproach
    };
  }

  /**
   * Build agent-optimized prompt with repository and symbolic context
   */
  private buildAgentPrompt(
    options: {
      fileContent: string;
      filePath: string;
      intent: string;
      targetElement?: string;
      context?: string;
    },
    enhancedContext: any
  ): string {
    return `You are Claude, an expert coding agent with direct access to the GitHub repository "${this.repository.owner}/${this.repository.repo}".

## Repository Context
- **Repository**: ${this.repository.owner}/${this.repository.repo}
- **Branch**: ${this.repository.branch}
- **Primary Framework**: ${enhancedContext?.componentInfo?.framework || 'React'}
- **Styling Approach**: ${enhancedContext?.stylingApproach || 'Unknown'}

## Task: Code Modification
**File**: ${options.filePath}
**Intent**: ${options.intent}
${options.targetElement ? `**Target Element**: ${options.targetElement}` : ''}

## Symbolic Analysis Context
${this.formatSymbolicContext(enhancedContext)}

## Current File Content
\`\`\`${this.getFileExtension(options.filePath)}
${options.fileContent}
\`\`\`

## Instructions
As a coding agent with repository access, you should:

1. **Understand the Intent**: Parse the visual change request and understand what needs to be modified
2. **Use Symbolic Context**: Leverage the DOM mappings and transformation rules provided
3. **Maintain Consistency**: Follow the existing code patterns and styling approach
4. **Consider Dependencies**: Think about how this change might affect other components
5. **Generate Precise Changes**: Return the complete modified file content

## Response Format
Return ONLY the complete modified file content. Do not include explanations, comments, or markdown formatting - just the raw code that should replace the current file content.

**Modified File Content**:`;
  }

  /**
   * Format symbolic context for the agent prompt
   */
  private formatSymbolicContext(context: any): string {
    if (!context) {
      return 'No symbolic analysis available.';
    }

    let formatted = '';

    // DOM Mappings
    if (context.domMappings && context.domMappings.length > 0) {
      formatted += '### DOM Element Mappings\n';
      context.domMappings.forEach((mapping: any) => {
        formatted += `- Selector: \`${mapping.selector}\`\n`;
        mapping.mappings.forEach((m: any) => {
          formatted += `  → Component: ${m.componentName} (confidence: ${(m.confidence * 100).toFixed(1)}%)\n`;
          if (m.reasoning) {
            formatted += `  → Reasoning: ${m.reasoning}\n`;
          }
        });
      });
      formatted += '\n';
    }

    // Component Info
    if (context.componentInfo) {
      formatted += '### Component Structure\n';
      formatted += `- Name: ${context.componentInfo.name}\n`;
      formatted += `- Framework: ${context.componentInfo.framework}\n`;
      formatted += `- Styling: ${context.componentInfo.styling.approach}\n`;
      if (context.componentInfo.styling.classes.length > 0) {
        formatted += `- Common Classes: ${context.componentInfo.styling.classes.slice(0, 10).join(', ')}\n`;
      }
      formatted += '\n';
    }

    // Transformation Rules
    if (context.transformationRules && context.transformationRules.length > 0) {
      formatted += '### Transformation Rules (Repository-Specific Patterns)\n';
      context.transformationRules.slice(0, 5).forEach((rule: any) => {
        formatted += `- Pattern: \`${rule.pattern}\` → \`${rule.replacement}\` (confidence: ${(rule.confidence * 100).toFixed(1)}%)\n`;
      });
      formatted += '\n';
    }

    return formatted;
  }

  /**
   * Call Claude API with repository context
   */
  private async callClaudeAPI(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Latest Claude 3.5 Sonnet
        max_tokens: 64000, // Maximum for Claude 4 Sonnet
        temperature: 0.1, // Low temperature for consistent code generation
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error('No content in Claude response');
    }

    return content;
  }

  /**
   * Extract code from Claude's response
   */
  private extractCodeFromResponse(response: string, originalContent: string): string | null {
    try {
      // Try to extract code from markdown code blocks
      const codeBlockMatch = response.match(/```[\w]*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        const extractedCode = codeBlockMatch[1].trim();
        console.log(`📝 Extracted code from markdown block (${extractedCode.length} chars)`);
        return extractedCode;
      }

      // If no code block, check if the entire response looks like code
      const trimmedResponse = response.trim();
      
      // Enhanced heuristics for code detection
      const looksLikeCode = (
        // React/JSX patterns
        (trimmedResponse.includes('import ') && trimmedResponse.includes('export ')) ||
        (trimmedResponse.includes('function ') && trimmedResponse.includes('return')) ||
        (trimmedResponse.includes('const ') && trimmedResponse.includes('=>')) ||
        (trimmedResponse.includes('<') && trimmedResponse.includes('/>')) ||
        trimmedResponse.includes('className=') ||
        // Vue patterns
        (trimmedResponse.includes('<template>') && trimmedResponse.includes('</template>')) ||
        // Svelte patterns
        (trimmedResponse.includes('<script>') && trimmedResponse.includes('</script>')) ||
        // General patterns
        trimmedResponse.startsWith('{') ||
        (trimmedResponse.length > originalContent.length * 0.5 && 
         trimmedResponse.split('\n').length > 10)
      );

      if (looksLikeCode) {
        console.log(`📝 Using entire response as code (${trimmedResponse.length} chars)`);
        return trimmedResponse;
      }

      console.warn('⚠️ Could not extract code from Claude Agent response');
      console.warn('Response preview:', response.substring(0, 200) + '...');
      return null;
    } catch (error) {
      console.error('❌ Failed to extract code from response:', error);
      return null;
    }
  }

  /**
   * Get file extension for syntax highlighting
   */
  private getFileExtension(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx': return 'typescript';
      case 'jsx': return 'javascript';
      case 'ts': return 'typescript';
      case 'js': return 'javascript';
      case 'vue': return 'vue';
      case 'svelte': return 'svelte';
      default: return 'javascript';
    }
  }
}
