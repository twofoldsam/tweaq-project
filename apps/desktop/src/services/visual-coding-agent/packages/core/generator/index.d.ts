import type { CodeChange, DesignIntent, DesignContext, Alternative } from '@/core/types';
import type { ClaudeProvider } from '@/providers/claude';
export interface CodeGenerator {
    generateChanges(intent: DesignIntent, context: DesignContext): Promise<CodeChange[]>;
    generateAlternatives(intent: DesignIntent, context: DesignContext): Promise<Alternative[]>;
    validateChanges(changes: CodeChange[]): Promise<boolean>;
}
export declare class ClaudeCodeGenerator implements CodeGenerator {
    private claudeProvider;
    constructor(claudeProvider: ClaudeProvider);
    generateChanges(intent: DesignIntent, context: DesignContext): Promise<CodeChange[]>;
    generateAlternatives(intent: DesignIntent, context: DesignContext): Promise<Alternative[]>;
    validateChanges(changes: CodeChange[]): Promise<boolean>;
    private postProcessChanges;
    private postProcessReactChange;
    private postProcessVueChange;
    private postProcessSvelteChange;
    private postProcessTailwindChange;
    private postProcessMuiChange;
    private postProcessStyledComponentsChange;
    private replaceTailwindArbitraryValues;
    private replaceMuiArbitraryColors;
    private replaceStyledComponentsArbitraryValues;
    private findClosestColorToken;
    private findClosestSizeToken;
    private optimizeTailwindClasses;
    private addReactTypes;
    private validateReactSyntax;
    private validateVueSyntax;
    private generateAlternativeDescription;
    private analyzeTradeoffs;
    private calculateConfidence;
    private usesDesignTokens;
}
//# sourceMappingURL=index.d.ts.map