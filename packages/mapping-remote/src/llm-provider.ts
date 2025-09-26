import {
  LLMProvider,
  LLMAnalysisRequest,
  LLMAnalysisResponse,
  FileExcerpt
} from './types.js';

/**
 * Base LLM provider that builds prompts and handles common functionality
 */
export abstract class BaseLLMProvider implements LLMProvider {
  abstract analyzeComponents(request: LLMAnalysisRequest): Promise<LLMAnalysisResponse>;

  /**
   * Build a comprehensive prompt for LLM analysis
   */
  protected buildAnalysisPrompt(request: LLMAnalysisRequest): string {
    const { nodeSnapshot, urlPath, candidateFiles } = request;

    const prompt = `# Component Analysis Task

You are an expert React/frontend developer. Your task is to analyze candidate source files and determine which ones are most likely to render a specific DOM node.

## DOM Node Information
**URL Path:** ${urlPath}
**Tag:** ${nodeSnapshot.tagName || 'unknown'}
${nodeSnapshot['data-testid'] ? `**Test ID:** ${nodeSnapshot['data-testid']}` : ''}
${nodeSnapshot.className ? `**CSS Classes:** ${nodeSnapshot.className}` : ''}
${nodeSnapshot.id ? `**Element ID:** ${nodeSnapshot.id}` : ''}
${nodeSnapshot.textContent ? `**Text Content:** "${nodeSnapshot.textContent.slice(0, 100)}${nodeSnapshot.textContent.length > 100 ? '...' : ''}"` : ''}
${this.formatAttributes(nodeSnapshot.attributes)}

## Candidate Files

${this.formatCandidateFiles(candidateFiles)}

## Analysis Instructions

Analyze each candidate file and determine how likely it is to render the DOM node described above. Consider:

1. **Direct Matches**: data-testid, className, id attributes that match exactly
2. **Component Structure**: Does the component structure suggest it could render this type of element?
3. **URL Relevance**: Does the file path/name relate to the URL path?
4. **Import Dependencies**: Do the imports suggest this component handles the relevant functionality?
5. **Content Patterns**: Does the code contain patterns that would generate the observed DOM structure?

## Response Format

Return your analysis as a JSON object with this exact structure:

\`\`\`json
{
  "rankings": [
    {
      "filePath": "exact/file/path.tsx",
      "confidence": 0.95,
      "rationale": "This component contains an exact data-testid match and is located in the checkout directory, matching the URL path. The component structure shows it renders a button with the observed classes."
    },
    {
      "filePath": "another/file/path.tsx", 
      "confidence": 0.75,
      "rationale": "Contains similar CSS classes and is imported by the main checkout component. Likely renders part of the UI structure."
    },
    {
      "filePath": "third/file/path.tsx",
      "confidence": 0.60,
      "rationale": "Located in relevant directory and contains similar text content, but no direct attribute matches."
    }
  ]
}
\`\`\`

**Requirements:**
- Return top 3 most likely files only
- Confidence scores between 0.0 and 1.0
- Provide specific, technical rationale for each ranking
- Focus on concrete evidence from the code
- If no files seem relevant, return empty rankings array

Begin your analysis:`;

    return prompt;
  }

  /**
   * Format node attributes for the prompt
   */
  private formatAttributes(attributes?: Record<string, string>): string {
    if (!attributes || Object.keys(attributes).length === 0) {
      return '';
    }

    const formatted = Object.entries(attributes)
      .filter(([key]) => key !== 'data-testid' && key !== 'class' && key !== 'id')
      .map(([key, value]) => `**${key}:** ${value}`)
      .join('\n');

    return formatted ? `**Other Attributes:**\n${formatted}` : '';
  }

  /**
   * Format candidate files for the prompt
   */
  private formatCandidateFiles(files: FileExcerpt[]): string {
    return files.map((file, index) => {
      const imports = file.imports && file.imports.length > 0 
        ? `\n**Imports:**\n${file.imports.map(imp => `  ${imp}`).join('\n')}`
        : '';

      return `### File ${index + 1}: \`${file.filePath}\`
**Lines:** ${file.lines}${imports}

**Code:**
\`\`\`typescript
${file.content}
\`\`\`
`;
    }).join('\n');
  }

  /**
   * Parse LLM response and validate structure
   */
  protected parseLLMResponse(response: string): LLMAnalysisResponse {
    try {
      // Extract JSON from response (handle cases where LLM includes extra text)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      
      if (!jsonString) {
        throw new Error('No JSON content found in response');
      }
      
      const parsed = JSON.parse(jsonString.trim());
      
      // Validate structure
      if (!parsed.rankings || !Array.isArray(parsed.rankings)) {
        throw new Error('Invalid response structure: missing rankings array');
      }

      // Validate and clean up rankings
      const validRankings = parsed.rankings
        .filter((ranking: any) => 
          ranking.filePath && 
          typeof ranking.confidence === 'number' && 
          ranking.rationale
        )
        .map((ranking: any) => ({
          filePath: String(ranking.filePath),
          confidence: Math.max(0, Math.min(1, Number(ranking.confidence))),
          rationale: String(ranking.rationale)
        }))
        .slice(0, 3); // Ensure max 3 results

      return { rankings: validRankings };
    } catch (error) {
      console.warn('Failed to parse LLM response:', error);
      return { rankings: [] };
    }
  }
}

/**
 * Mock LLM provider for testing (returns plausible mock responses)
 */
export class MockLLMProvider extends BaseLLMProvider {
  async analyzeComponents(request: LLMAnalysisRequest): Promise<LLMAnalysisResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const { nodeSnapshot, urlPath, candidateFiles } = request;
    
    // Generate mock rankings based on simple heuristics
    const rankings = candidateFiles
      .slice(0, 3)
      .map((file) => {
        let confidence = 0.5;
        let rationale = `File located at ${file.filePath}`;

        // Boost confidence for URL path matches
        const urlSegments = urlPath.split('/').filter(s => s.length > 0);
        for (const segment of urlSegments) {
          if (file.filePath.toLowerCase().includes(segment.toLowerCase())) {
            confidence += 0.2;
            rationale += `, matches URL segment "${segment}"`;
          }
        }

        // Boost confidence for attribute matches in content
        if (nodeSnapshot['data-testid'] && file.content.includes(nodeSnapshot['data-testid'])) {
          confidence += 0.3;
          rationale += `, contains matching data-testid`;
        }

        if (nodeSnapshot.className) {
          const classes = nodeSnapshot.className.split(' ');
          const matchingClasses = classes.filter(cls => file.content.includes(cls));
          if (matchingClasses.length > 0) {
            confidence += 0.2 * matchingClasses.length;
            rationale += `, contains CSS classes: ${matchingClasses.join(', ')}`;
          }
        }

        // Boost confidence for component files
        if (file.filePath.includes('component') || file.filePath.endsWith('.tsx')) {
          confidence += 0.1;
          rationale += `, is a React component`;
        }

        // Add some randomness to simulate LLM variability
        confidence = Math.max(0.1, Math.min(0.95, confidence + (Math.random() - 0.5) * 0.1));

        return {
          filePath: file.filePath,
          confidence: Number(confidence.toFixed(2)),
          rationale: `Mock analysis: ${rationale}.`
        };
      })
      .sort((a, b) => b.confidence - a.confidence);

    return { rankings };
  }
}

/**
 * OpenAI GPT provider implementation
 */
export class OpenAIProvider extends BaseLLMProvider {
  public apiKey: string;
  public model: string;

  constructor(apiKey: string, model: string = 'gpt-4') {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeComponents(request: LLMAnalysisRequest): Promise<LLMAnalysisResponse> {
    const prompt = this.buildAnalysisPrompt(request);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert React/frontend developer who excels at analyzing code and determining component relationships.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for consistent analysis
          max_tokens: 2000,
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

      return this.parseLLMResponse(content);
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      return { rankings: [] };
    }
  }
}

/**
 * Anthropic Claude provider implementation  
 */
export class ClaudeProvider extends BaseLLMProvider {
  public apiKey: string;
  public model: string;

  constructor(apiKey: string, model: string = 'claude-sonnet-4-20250514') {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeComponents(request: LLMAnalysisRequest): Promise<LLMAnalysisResponse> {
    const prompt = this.buildAnalysisPrompt(request);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2000,
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

      return this.parseLLMResponse(content);
    } catch (error) {
      console.error('Claude API call failed:', error);
      return { rankings: [] };
    }
  }
}
