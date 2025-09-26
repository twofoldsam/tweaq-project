import type { DesignIntent, DesignContext, CodeChange } from '@/core/types';
export interface ClaudeProvider {
    analyzeIntent(description: string, context: DesignContext): Promise<DesignIntent>;
    generateCode(intent: DesignIntent, context: DesignContext): Promise<CodeChange[]>;
    generateAlternatives(intent: DesignIntent, context: DesignContext): Promise<CodeChange[][]>;
    explainChanges(changes: CodeChange[], intent: DesignIntent, context: DesignContext): Promise<string>;
}
export declare class AnthropicClaudeProvider implements ClaudeProvider {
    private client;
    constructor(apiKey?: string);
    analyzeIntent(description: string, context: DesignContext): Promise<DesignIntent>;
    generateCode(intent: DesignIntent, context: DesignContext): Promise<CodeChange[]>;
    generateAlternatives(intent: DesignIntent, context: DesignContext): Promise<CodeChange[][]>;
    explainChanges(changes: CodeChange[], intent: DesignIntent, context: DesignContext): Promise<string>;
    private buildIntentAnalysisPrompt;
    private buildCodeGenerationPrompt;
    private buildAlternativesPrompt;
    private buildExplanationPrompt;
}
//# sourceMappingURL=claude.d.ts.map