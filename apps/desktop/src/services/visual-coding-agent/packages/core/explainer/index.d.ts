import type { CodeChange, DesignIntent, DesignContext, Alternative } from '@/core/types';
import type { ClaudeProvider } from '@/providers/claude';
export interface UserExplainer {
    explainChanges(changes: CodeChange[], intent: DesignIntent, context: DesignContext): Promise<string>;
    explainAlternatives(alternatives: Alternative[], intent: DesignIntent, context: DesignContext): Promise<string>;
    explainDesignPrinciples(intent: DesignIntent): Promise<string[]>;
}
export declare class ClaudeUserExplainer implements UserExplainer {
    private claudeProvider;
    constructor(claudeProvider: ClaudeProvider);
    explainChanges(changes: CodeChange[], intent: DesignIntent, context: DesignContext): Promise<string>;
    explainAlternatives(alternatives: Alternative[], intent: DesignIntent, context: DesignContext): Promise<string>;
    explainDesignPrinciples(intent: DesignIntent): Promise<string[]>;
    private enhanceExplanation;
    private generateTemplateExplanation;
    private explainSingleAlternative;
    private combineAlternativeExplanations;
    private getDesignSystemInfo;
    private estimateConfidence;
    private changeUsesDesignTokens;
}
export declare class ExplanationFormatter {
    static formatTechnicalChange(change: CodeChange): string;
    static formatDesignPrinciples(principles: string[]): string;
    static formatConfidenceLevel(confidence: number): string;
    static addPersonalTouch(explanation: string): string;
}
//# sourceMappingURL=index.d.ts.map