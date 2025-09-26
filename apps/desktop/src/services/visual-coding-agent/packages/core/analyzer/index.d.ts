import type { RepositoryAnalysis, DesignTokens, ComponentPatterns, Framework, StylingSystem } from '@/core/types';
export interface RepositoryAnalyzer {
    analyzeRepository(rootPath: string): Promise<RepositoryAnalysis>;
    extractDesignTokens(rootPath: string, stylingSystem: StylingSystem): Promise<DesignTokens>;
    analyzeComponentPatterns(rootPath: string, framework: Framework): Promise<ComponentPatterns>;
    detectFramework(rootPath: string): Promise<Framework>;
    detectStylingSystem(rootPath: string): Promise<StylingSystem>;
}
export declare class FileSystemRepositoryAnalyzer implements RepositoryAnalyzer {
    analyzeRepository(rootPath: string): Promise<RepositoryAnalysis>;
    detectFramework(rootPath: string): Promise<Framework>;
    detectStylingSystem(rootPath: string): Promise<StylingSystem>;
    extractDesignTokens(rootPath: string, stylingSystem: StylingSystem): Promise<DesignTokens>;
    private extractTailwindTokens;
    private getDefaultTailwindTokens;
    private parseTailwindConfig;
    private extractMuiTokens;
    private extractChakraTokens;
    private extractStyledComponentsTokens;
    private extractCssTokens;
    private extractCssCustomProperties;
    private mergeCssTokens;
    analyzeComponentPatterns(rootPath: string, framework: Framework): Promise<ComponentPatterns>;
    private findComponentFiles;
    private extractPatternsFromFile;
    private analyzeFileStructure;
    private findFiles;
    private mergeTokens;
}
//# sourceMappingURL=index.d.ts.map