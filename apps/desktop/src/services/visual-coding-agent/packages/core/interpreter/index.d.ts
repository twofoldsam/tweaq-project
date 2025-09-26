import type { ClaudeProvider } from '@/providers/claude';
import type { DesignIntent, DesignContext } from '@/core/types';
export interface NaturalLanguageInterpreter {
    interpretRequest(description: string, context: DesignContext): Promise<DesignIntent>;
}
export declare class ClaudeNaturalLanguageInterpreter implements NaturalLanguageInterpreter {
    private claudeProvider;
    constructor(claudeProvider: ClaudeProvider);
    interpretRequest(description: string, context: DesignContext): Promise<DesignIntent>;
    private preprocessDescription;
    private validateIntent;
    private validateMethods;
    private inferDesignPrinciple;
}
export declare class InterpretationUtils {
    static extractSizeModifiers(description: string): {
        amount?: number;
        relative?: boolean;
    };
    static extractColorReferences(description: string, designTokens: any): string[];
    static detectUrgency(description: string): 'low' | 'medium' | 'high';
}
//# sourceMappingURL=index.d.ts.map