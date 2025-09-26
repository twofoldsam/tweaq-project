import type { VisualRequest, VisualResponse, DesignContext, RepositoryAnalysis } from './types';
import { AnthropicClaudeProvider } from '../providers/claude';
import { Repository, Element, Context, CodeChange, AlternativeChange, ComponentStructure, DesignTokens } from '../../api/types';
export interface VisualCodingAgentConfig {
    anthropicApiKey?: string;
    repositoryPath?: string;
    cacheAnalysis?: boolean;
}
export declare class VisualCodingAgent {
    private claudeProvider;
    private interpreter;
    private analyzer;
    private generator;
    private explainer;
    private analysisCache;
    private config;
    constructor(claudeProvider: AnthropicClaudeProvider, config?: VisualCodingAgentConfig);
    processRequest(request: VisualRequest): Promise<VisualResponse>;
    private enhanceContext;
    private hasComprehensiveDesignTokens;
    private mergeContextWithAnalysis;
    private calculateOverallConfidence;
    private generateErrorExplanation;
    processVisualEdit(request: {
        description: string;
        element: Element;
        context: Context & {
            repository?: Repository;
            currentFileContent?: string;
        };
        options?: {
            includeAlternatives?: boolean;
            maxAlternatives?: number;
            confidenceThreshold?: number;
        };
    }): Promise<{
        changes: CodeChange[];
        explanation: string;
        alternatives?: AlternativeChange[];
        confidence: number;
        tokensUsed?: number;
    }>;
    analyzeRepository(request: {
        repository: Repository;
        options?: {
            forceRefresh?: boolean;
            lastAnalyzedCommit?: string;
            changedFiles?: string[];
            includeDesignTokens?: boolean;
            includeComponents?: boolean;
        };
    }): Promise<{
        designTokens: DesignTokens;
        components: ComponentStructure[];
        framework: string;
        stylingSystem: string;
        librariesDetected: string[];
        fileStructure: Record<string, string[]>;
    }>;
    analyzeRepositoryPath(repositoryPath: string): Promise<RepositoryAnalysis>;
    interpretDescription(description: string, context: DesignContext): Promise<{
        property: "style" | "size" | "color" | "spacing" | "typography" | "layout" | "emphasis" | "complexity";
        direction: "increase" | "decrease" | "change" | "add" | "remove";
        methods: string[];
        urgency: "low" | "medium" | "high";
        designPrinciple?: string | undefined;
        specificity?: number | undefined;
    }>;
    clearAnalysisCache(): void;
    getAnalysisCache(): Map<string, RepositoryAnalysis>;
    private mapStylingSystem;
}
export declare function createVisualCodingAgent(claudeProvider: AnthropicClaudeProvider, config?: VisualCodingAgentConfig): VisualCodingAgent;
//# sourceMappingURL=agent.d.ts.map