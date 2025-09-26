"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualCodingAgent = void 0;
exports.createVisualCodingAgent = createVisualCodingAgent;
const interpreter_1 = require("./interpreter");
const analyzer_1 = require("./analyzer");
const generator_1 = require("./generator");
const explainer_1 = require("./explainer");
const github_1 = require("../../services/github");
const logger_1 = require("../../utils/logger");
class VisualCodingAgent {
    claudeProvider;
    interpreter;
    analyzer;
    generator;
    explainer;
    analysisCache = new Map();
    config;
    constructor(claudeProvider, config = {}) {
        this.config = config;
        this.claudeProvider = claudeProvider;
        // Initialize core components
        this.interpreter = new interpreter_1.ClaudeNaturalLanguageInterpreter(this.claudeProvider);
        this.analyzer = new analyzer_1.FileSystemRepositoryAnalyzer();
        this.generator = new generator_1.ClaudeCodeGenerator(this.claudeProvider);
        this.explainer = new explainer_1.ClaudeUserExplainer(this.claudeProvider);
    }
    async processRequest(request) {
        try {
            // Step 1: Enhance context with repository analysis if needed
            const enhancedContext = await this.enhanceContext(request.context);
            // Step 2: Interpret the natural language request
            const designIntent = await this.interpreter.interpretRequest(request.description, enhancedContext);
            // Step 3: Generate code changes
            const [changes, alternatives] = await Promise.all([
                this.generator.generateChanges(designIntent, enhancedContext),
                this.generator.generateAlternatives(designIntent, enhancedContext)
            ]);
            // Step 4: Generate user-friendly explanation
            const [explanation, designPrinciples] = await Promise.all([
                this.explainer.explainChanges(changes, designIntent, enhancedContext),
                this.explainer.explainDesignPrinciples(designIntent)
            ]);
            // Step 5: Calculate confidence score
            const confidence = this.calculateOverallConfidence(designIntent, changes, alternatives, enhancedContext);
            return {
                changes,
                explanation,
                alternatives: alternatives.length > 0 ? alternatives : undefined,
                confidence,
                designPrinciples,
            };
        }
        catch (error) {
            // Return error response with helpful message
            return {
                changes: [],
                explanation: this.generateErrorExplanation(error, request),
                confidence: 0,
                designPrinciples: [],
            };
        }
    }
    async enhanceContext(context) {
        // If we already have comprehensive design tokens, use the existing context
        if (this.hasComprehensiveDesignTokens(context)) {
            return context;
        }
        // If we have a repository path, analyze it
        const repositoryPath = this.config.repositoryPath;
        if (repositoryPath) {
            const cacheKey = repositoryPath;
            // Check cache first
            if (this.config.cacheAnalysis && this.analysisCache.has(cacheKey)) {
                const analysis = this.analysisCache.get(cacheKey);
                return this.mergeContextWithAnalysis(context, analysis);
            }
            // Perform fresh analysis
            try {
                const analysis = await this.analyzer.analyzeRepository(repositoryPath);
                if (this.config.cacheAnalysis) {
                    this.analysisCache.set(cacheKey, analysis);
                }
                return this.mergeContextWithAnalysis(context, analysis);
            }
            catch (error) {
                console.warn('Failed to analyze repository, using provided context:', error);
                return context;
            }
        }
        return context;
    }
    hasComprehensiveDesignTokens(context) {
        const tokens = context.designTokens;
        // Check if we have the basic token categories
        return !!(tokens['colors'] &&
            Object.keys(tokens['colors']).length > 0 &&
            tokens['typography'] &&
            tokens['spacing'] &&
            Object.keys(tokens['spacing']).length > 0);
    }
    mergeContextWithAnalysis(context, analysis) {
        return {
            ...context,
            designTokens: {
                ...analysis.designTokens,
                ...context.designTokens, // Provided context takes precedence
            },
            framework: context.framework || analysis.framework,
            stylingSystem: context.stylingSystem || analysis.stylingApproach,
            componentPatterns: {
                ...analysis.componentPatterns,
                ...context.componentPatterns,
            },
            fileStructure: analysis.fileStructure.components.concat(analysis.fileStructure.styles, analysis.fileStructure.types),
        };
    }
    calculateOverallConfidence(intent, changes, alternatives, context) {
        let confidence = 0.8; // Base confidence
        // Adjust based on intent specificity
        if (intent.specificity) {
            confidence = confidence * 0.7 + intent.specificity * 0.3;
        }
        // Adjust based on design token coverage
        if (this.hasComprehensiveDesignTokens(context)) {
            confidence += 0.1;
        }
        // Adjust based on change complexity
        if (changes.length === 1 && changes[0].changeType === 'modify') {
            confidence += 0.05;
        }
        else if (changes.length > 3) {
            confidence -= 0.1;
        }
        // Adjust based on alternatives quality
        if (alternatives.length >= 2) {
            confidence += 0.05;
        }
        return Math.max(0.1, Math.min(confidence, 1.0));
    }
    generateErrorExplanation(error, request) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return `I encountered an issue while processing your request "${request.description}". ${errorMessage}

Here are some things you can try:
• Make your request more specific (e.g., "make the button 20% larger" instead of "make it bigger")
• Ensure your design system tokens are properly configured
• Check that the target element information is correct

I'm designed to work best with clear, specific requests and comprehensive design system information.`;
    }
    // === Service-Oriented Methods ===
    async processVisualEdit(request) {
        try {
            logger_1.logger.info('Processing visual edit with agent', {
                description: request.description,
                element: request.element.selector,
                framework: request.context.framework,
                stylingSystem: request.context.stylingSystem,
            });
            // Convert API types to internal types
            const visualRequest = {
                description: request.description,
                element: {
                    tagName: request.element.tagName,
                    classes: request.element.classes,
                    style: request.element.computedStyles,
                    textContent: request.element.textContent,
                    selector: request.element.selector,
                    attributes: request.element.attributes || {},
                },
                context: {
                    framework: request.context.framework,
                    stylingSystem: this.mapStylingSystem(request.context.stylingSystem),
                    designTokens: request.context.designTokens || {},
                    componentPatterns: {},
                    fileStructure: [],
                    currentFileContent: request.context.currentFileContent,
                },
            };
            // Process with the original agent logic
            const response = await this.processRequest(visualRequest);
            // Convert back to API types
            const changes = response.changes.map(change => ({
                filePath: change.filePath,
                oldContent: change.oldContent,
                newContent: change.newContent,
                lineNumber: undefined, // LineNumber not available in current response type
                reasoning: change.reasoning || 'Code change generated by visual agent',
            }));
            const alternatives = request.options?.includeAlternatives
                ? response.alternatives?.map(alt => ({
                    description: alt.description,
                    changes: alt.changes.map(change => ({
                        filePath: change.filePath,
                        oldContent: change.oldContent,
                        newContent: change.newContent,
                        lineNumber: undefined, // LineNumber not available in current response type
                        reasoning: change.reasoning || 'Alternative code change',
                    })),
                    confidence: alt.confidence,
                })) || []
                : undefined;
            return {
                changes,
                explanation: response.explanation,
                alternatives,
                confidence: response.confidence,
                tokensUsed: 0, // Token usage tracking to be implemented
            };
        }
        catch (error) {
            logger_1.logger.error('Error processing visual edit:', error);
            throw error;
        }
    }
    async analyzeRepository(request) {
        try {
            logger_1.logger.info('Analyzing repository with agent', {
                repository: `${request.repository.owner}/${request.repository.repo}`,
                options: request.options,
            });
            // Get repository files for analysis
            const packageJson = await github_1.githubService.getPackageJson(request.repository);
            const sourceFiles = await github_1.githubService.findFiles(request.repository, ['.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte', '.css', '.scss', '.sass'], 50);
            // Analyze key files
            const analysisPromises = sourceFiles.slice(0, 10).map(async (filePath) => {
                try {
                    const file = await github_1.githubService.getFileContent(request.repository, filePath);
                    return { path: filePath, content: file.content };
                }
                catch (error) {
                    logger_1.logger.warn(`Failed to read file ${filePath}:`, error);
                    return null;
                }
            });
            const fileContents = (await Promise.all(analysisPromises)).filter(Boolean);
            // Use the analyzer to process the repository
            // For now, create a mock analysis - full implementation would require analyzer updates
            const analysis = {
                designTokens: request.context?.designTokens || {},
                componentPatterns: [],
                framework: packageJson?.dependencies?.react ? 'react' :
                    packageJson?.dependencies?.vue ? 'vue' :
                        packageJson?.dependencies?.svelte ? 'svelte' : 'unknown',
                stylingApproach: packageJson?.dependencies?.tailwindcss ? 'tailwind' :
                    packageJson?.dependencies?.['styled-components'] ? 'styled-components' : 'css',
                libraries: Object.keys(packageJson?.dependencies || {}),
                fileStructure: {
                    components: sourceFiles.filter(f => f.includes('component')),
                    styles: sourceFiles.filter(f => f.match(/\.(css|scss|sass)$/)),
                    types: sourceFiles.filter(f => f.endsWith('.d.ts')),
                },
            };
            // Convert to API response format
            return {
                designTokens: analysis.designTokens,
                components: analysis.componentPatterns.map((pattern) => ({
                    name: pattern.name,
                    filePath: pattern.filePath,
                    type: 'component',
                    exports: pattern.exports || [],
                    dependencies: pattern.dependencies || [],
                    props: pattern.props?.map((prop) => ({
                        name: prop.name,
                        type: prop.type,
                        required: prop.required,
                        description: prop.description,
                    })) || [],
                })),
                framework: analysis.framework,
                stylingSystem: analysis.stylingApproach,
                librariesDetected: analysis.libraries || [],
                fileStructure: {
                    components: analysis.fileStructure.components,
                    styles: analysis.fileStructure.styles,
                    types: analysis.fileStructure.types,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Error analyzing repository:', error);
            throw error;
        }
    }
    // Utility methods for external usage
    async analyzeRepositoryPath(repositoryPath) {
        return this.analyzer.analyzeRepository(repositoryPath);
    }
    async interpretDescription(description, context) {
        return this.interpreter.interpretRequest(description, context);
    }
    clearAnalysisCache() {
        this.analysisCache.clear();
    }
    getAnalysisCache() {
        return new Map(this.analysisCache);
    }
    // === Helper Methods ===
    mapStylingSystem(stylingSystem) {
        switch (stylingSystem) {
            case 'tailwind':
                return 'tailwind';
            case 'css-modules':
                return 'css-modules';
            case 'styled-components':
                return 'styled-components';
            case 'emotion':
                return 'styled-components'; // Map emotion to styled-components
            case 'sass':
            case 'css':
                return 'vanilla-css';
            default:
                return 'vanilla-css';
        }
    }
}
exports.VisualCodingAgent = VisualCodingAgent;
// Factory function for easy instantiation
function createVisualCodingAgent(claudeProvider, config) {
    return new VisualCodingAgent(claudeProvider, config);
}
//# sourceMappingURL=agent.js.map