import type { LLMProvider } from './types';

// Define minimal LLM provider interface to avoid circular dependencies
// We'll use the raw API methods from OpenAI/Claude providers
interface ExternalLLMProvider {
  apiKey: string;
  model?: string;
}

/**
 * Adapter that wraps external LLM providers to work with InMemoryPatcher
 */
export class LLMCodeAdapter implements LLMProvider {
  constructor(private externalProvider: ExternalLLMProvider, private providerType: 'openai' | 'claude') {}

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
      const prompt = this.buildCodeChangePrompt(options);
      console.log(`🤖 Sending prompt to ${this.providerType} (${prompt.length} chars)`);
      
      const response = await this.callLLMAPI(prompt);
      console.log(`🤖 LLM response received (${response.length} chars)`);
      
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
          error: 'Could not extract valid code from LLM response'
        };
      }
    } catch (error) {
      console.error('❌ LLM code generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async callLLMAPI(prompt: string): Promise<string> {
    if (this.providerType === 'openai') {
      return this.callOpenAI(prompt);
    } else if (this.providerType === 'claude') {
      return this.callClaude(prompt);
    } else {
      throw new Error(`Unknown provider type: ${this.providerType}`);
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.externalProvider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.externalProvider.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert code modification assistant. Apply the requested changes precisely and return only the complete modified file content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return content;
  }

  private async callClaude(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.externalProvider.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.externalProvider.model || 'claude-3-sonnet-20240229',
        max_tokens: 64000, // Maximum for Claude 4 Sonnet
        temperature: 0.1,
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

  private buildCodeChangePrompt(options: {
    fileContent: string;
    filePath: string;
    intent: string;
    targetElement?: string;
    context?: string;
  }): string {
    return `You are a code modification assistant. Your task is to apply a specific change to a source code file and return the complete modified file content.

**File**: ${options.filePath}
**File Type**: ${options.context || 'source code'}
**Intent**: ${options.intent}
${options.targetElement ? `**Target Element**: ${options.targetElement}` : ''}

**Current File Content**:
\`\`\`
${options.fileContent}
\`\`\`

**Instructions**:
1. Apply the requested change precisely to the file
2. Maintain all existing formatting, indentation, and structure
3. Only modify what is necessary to fulfill the intent
4. Return the COMPLETE modified file content (not just the changed parts)
5. Do not add any explanations or comments - just return the modified code

**Modified File Content**:`;
  }

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
      
      // Simple heuristics to detect if response is code
      const looksLikeCode = (
        trimmedResponse.includes('import ') ||
        trimmedResponse.includes('export ') ||
        trimmedResponse.includes('function ') ||
        trimmedResponse.includes('const ') ||
        trimmedResponse.includes('class ') ||
        trimmedResponse.includes('<') ||
        trimmedResponse.includes('/>') ||
        trimmedResponse.startsWith('{') ||
        trimmedResponse.includes('className=')
      );

      if (looksLikeCode && trimmedResponse.length > originalContent.length * 0.5) {
        console.log(`📝 Using entire response as code (${trimmedResponse.length} chars)`);
        return trimmedResponse;
      }

      console.warn('⚠️ Could not extract code from LLM response');
      return null;
    } catch (error) {
      console.error('❌ Failed to extract code from response:', error);
      return null;
    }
  }
}
