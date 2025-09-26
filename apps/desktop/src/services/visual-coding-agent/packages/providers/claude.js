"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicClaudeProvider = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class AnthropicClaudeProvider {
    client;
    constructor(apiKey) {
        this.client = new sdk_1.default({
            apiKey: apiKey ?? process.env['ANTHROPIC_API_KEY'],
        });
    }
    async analyzeIntent(description, context) {
        const prompt = this.buildIntentAnalysisPrompt(description, context);
        const response = await this.client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            temperature: 0.1,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });
        const content = response.content[0];
        if (!content || content.type !== 'text') {
            throw new Error('Expected text response from Claude');
        }
        try {
            const result = JSON.parse(content.text);
            return result;
        }
        catch (error) {
            throw new Error(`Failed to parse design intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateCode(intent, context) {
        const prompt = this.buildCodeGenerationPrompt(intent, context);
        const response = await this.client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2000,
            temperature: 0.1,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });
        const content = response.content[0];
        if (!content || content.type !== 'text') {
            throw new Error('Expected text response from Claude');
        }
        try {
            const result = JSON.parse(content.text);
            return result.changes;
        }
        catch (error) {
            throw new Error(`Failed to parse code changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateAlternatives(intent, context) {
        const prompt = this.buildAlternativesPrompt(intent, context);
        const response = await this.client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 3000,
            temperature: 0.2,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });
        const content = response.content[0];
        if (!content || content.type !== 'text') {
            throw new Error('Expected text response from Claude');
        }
        try {
            const result = JSON.parse(content.text);
            return result.alternatives;
        }
        catch (error) {
            throw new Error(`Failed to parse alternatives: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async explainChanges(changes, intent, context) {
        const prompt = this.buildExplanationPrompt(changes, intent, context);
        const response = await this.client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            temperature: 0.3,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });
        const content = response.content[0];
        if (!content || content.type !== 'text') {
            throw new Error('Expected text response from Claude');
        }
        return content.text.trim();
    }
    buildIntentAnalysisPrompt(description, context) {
        return `You are a design-aware AI analyzing user requests for visual changes.

User Request: "${description}"
Framework: ${context.framework}
Styling System: ${context.stylingSystem}
Available Design Tokens: ${JSON.stringify(context.designTokens, null, 2)}

Extract the design intent and return ONLY valid JSON in this exact format:
{
  "property": "size" | "color" | "spacing" | "typography" | "layout" | "emphasis" | "complexity" | "style",
  "direction": "increase" | "decrease" | "change" | "add" | "remove",
  "methods": ["array", "of", "specific", "approaches"],
  "designPrinciple": "optional design principle being applied",
  "urgency": "low" | "medium" | "high",
  "specificity": 0.8
}

Analysis guidelines:
1. Map vague terms like "pop", "professional", "busy" to specific properties
2. Suggest multiple methods that could achieve the intent
3. Consider the design system tokens available
4. Rate specificity from 0 (very vague) to 1 (very specific)

Examples:
- "make it pop" → {"property": "emphasis", "direction": "increase", "methods": ["size", "contrast", "color"], "specificity": 0.3}
- "too busy" → {"property": "complexity", "direction": "decrease", "methods": ["spacing", "colors", "elements"], "specificity": 0.4}
- "make the button 20% bigger" → {"property": "size", "direction": "increase", "methods": ["scale", "padding"], "specificity": 0.9}`;
    }
    buildCodeGenerationPrompt(intent, context) {
        return `You are an expert frontend developer generating precise code changes.

Design Intent: ${JSON.stringify(intent, null, 2)}
Framework: ${context.framework}
Styling System: ${context.stylingSystem}
Current Code: ${context.existingCode ?? 'Not provided'}
File Path: ${context.filePath ?? 'Not specified'}
Available Design Tokens: ${JSON.stringify(context.designTokens, null, 2)}

Generate code changes that:
1. Achieve the design intent precisely
2. ALWAYS use design system tokens (never arbitrary values)
3. Follow existing code patterns
4. Maintain type safety and best practices
5. Are framework-appropriate

Return ONLY valid JSON in this exact format:
{
  "changes": [
    {
      "filePath": "path/to/file.tsx",
      "oldContent": "exact content to replace",
      "newContent": "new content",
      "reasoning": "why this change achieves the intent",
      "changeType": "modify" | "create" | "delete"
    }
  ]
}

Rules:
- For Tailwind: Use utility classes from the design tokens
- For styled-components: Use theme values
- For CSS modules: Use CSS custom properties
- Always prefer semantic tokens over raw values
- Include imports if needed
- Maintain existing code structure`;
    }
    buildAlternativesPrompt(intent, context) {
        return `You are an expert frontend developer providing multiple approaches to achieve a design change.

Design Intent: ${JSON.stringify(intent, null, 2)}
Framework: ${context.framework}
Styling System: ${context.stylingSystem}
Available Design Tokens: ${JSON.stringify(context.designTokens, null, 2)}

Provide 2-3 different approaches to achieve this intent, each with trade-offs.

Return ONLY valid JSON in this exact format:
{
  "alternatives": [
    [
      {
        "filePath": "path/to/file.tsx",
        "oldContent": "exact content to replace",
        "newContent": "new content",
        "reasoning": "approach 1 reasoning",
        "changeType": "modify"
      }
    ],
    [
      {
        "filePath": "path/to/file.tsx",
        "oldContent": "exact content to replace", 
        "newContent": "different approach",
        "reasoning": "approach 2 reasoning",
        "changeType": "modify"
      }
    ]
  ]
}

Consider different approaches like:
- Conservative vs bold changes
- Different design tokens that achieve similar results
- Structural vs styling-only changes
- Performance implications`;
    }
    buildExplanationPrompt(changes, intent, context) {
        return `You are explaining code changes to a non-technical user in a friendly, educational way.

Technical Changes: ${JSON.stringify(changes, null, 2)}
Original Intent: ${JSON.stringify(intent, null, 2)}
Design System Context: ${JSON.stringify(context.designTokens, null, 2)}

Explain in plain English what you changed and why. Be educational but not condescending.

Guidelines:
1. Start with what you changed in simple terms
2. Explain how it achieves their design goal
3. Mention the design principle you applied
4. Explain why you chose this specific approach over alternatives
5. Use friendly, conversational tone

Example format:
"I made the text 25% larger by changing it from 'small' to 'large' size in your design system. This improves readability and creates better visual hierarchy, which is especially important for this call-to-action button. I chose the 'large' size instead of 'extra-large' because it maintains good proportions with the surrounding elements while still giving it the emphasis you wanted."

Focus on the user benefit and design reasoning, not technical implementation details.`;
    }
}
exports.AnthropicClaudeProvider = AnthropicClaudeProvider;
//# sourceMappingURL=claude.js.map