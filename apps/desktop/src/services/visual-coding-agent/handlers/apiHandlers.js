"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVisualEditHandler = processVisualEditHandler;
exports.analyzeRepositoryHandler = analyzeRepositoryHandler;
exports.batchProcessHandler = batchProcessHandler;
exports.createPullRequestHandler = createPullRequestHandler;
const agent_1 = require("../packages/core/agent");
const claude_1 = require("../packages/providers/claude");
const github_1 = require("../services/github");
const cache_1 = require("../services/cache");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
// Initialize Claude provider and agent
const claudeProvider = new claude_1.AnthropicClaudeProvider();
const visualAgent = (0, agent_1.createVisualCodingAgent)(claudeProvider);
// === Process Visual Edit Handler ===
async function processVisualEditHandler(req, res) {
    const startTime = Date.now();
    const request = req.body;
    const requestId = req.requestId;
    try {
        logger_1.logger.info('Processing visual edit request', {
            requestId,
            repository: `${request.repository.owner}/${request.repository.repo}`,
            description: request.description,
            element: request.element.selector,
            framework: request.context.framework,
            stylingSystem: request.context.stylingSystem,
        });
        // Check cache first
        const requestHash = (0, cache_1.hashRequest)({
            description: request.description,
            element: request.element,
            context: request.context,
        });
        const cachedResponse = await cache_1.cacheService.getClaudeResponse(requestHash);
        if (cachedResponse) {
            logger_1.logger.info('Returning cached response', { requestId, requestHash });
            return res.json({
                ...cachedResponse,
                requestId,
                processingTime: Date.now() - startTime,
            });
        }
        // Validate repository access
        try {
            await github_1.githubService.getRepository(request.repository);
        }
        catch (error) {
            (0, errorHandler_1.handleGitHubError)(error, `${request.repository.owner}/${request.repository.repo}`);
        }
        // Get file content if filePath is specified
        let currentFileContent;
        if (request.repository.filePath) {
            try {
                const file = await github_1.githubService.getFileContent(request.repository, request.repository.filePath);
                currentFileContent = file.content;
            }
            catch (error) {
                (0, errorHandler_1.handleGitHubError)(error, `file: ${request.repository.filePath}`);
            }
        }
        // Process with the visual coding agent
        let agentResult;
        let claudeTokensUsed = 0;
        try {
            agentResult = await visualAgent.processVisualEdit({
                description: request.description,
                element: request.element,
                context: {
                    ...request.context,
                    repository: request.repository,
                    currentFileContent,
                },
                options: request.options,
            });
            claudeTokensUsed = agentResult.tokensUsed || 0;
        }
        catch (error) {
            (0, errorHandler_1.handleClaudeError)(error);
        }
        // Transform agent result to API response format
        const changes = agentResult.changes.map(change => ({
            filePath: change.filePath,
            oldContent: change.oldContent,
            newContent: change.newContent,
            lineNumber: change.lineNumber,
            reasoning: change.reasoning,
        }));
        const alternatives = agentResult.alternatives?.map(alt => ({
            description: alt.description,
            changes: alt.changes.map(change => ({
                filePath: change.filePath,
                oldContent: change.oldContent,
                newContent: change.newContent,
                lineNumber: change.lineNumber,
                reasoning: change.reasoning,
            })),
            confidence: alt.confidence,
        })) || [];
        const processingTime = Date.now() - startTime;
        const response = {
            success: true,
            requestId,
            changes,
            explanation: agentResult.explanation,
            alternatives: request.options?.includeAlternatives ? alternatives : undefined,
            confidence: agentResult.confidence,
            processingTime,
            claudeTokensUsed,
        };
        // Cache the response
        await cache_1.cacheService.setClaudeResponse(requestHash, response);
        // Log metrics
        (0, logger_1.logMetrics)({
            requestId,
            repository: `${request.repository.owner}/${request.repository.repo}`,
            description: request.description,
            framework: request.context.framework,
            stylingSystem: request.context.stylingSystem,
            processingTime,
            claudeTokensUsed,
            cacheHit: false,
            success: true,
            changesGenerated: changes.length,
            confidence: agentResult.confidence,
        });
        (0, logger_1.logPerformance)({
            requestId,
            operation: 'processVisualEdit',
            duration: processingTime,
            success: true,
        });
        res.json(response);
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        (0, logger_1.logPerformance)({
            requestId,
            operation: 'processVisualEdit',
            duration: processingTime,
            success: false,
        });
        throw error;
    }
}
// === Analyze Repository Handler ===
async function analyzeRepositoryHandler(req, res) {
    const startTime = Date.now();
    const request = req.body;
    const requestId = req.requestId;
    try {
        logger_1.logger.info('Analyzing repository', {
            requestId,
            repository: `${request.repository.owner}/${request.repository.repo}`,
            forceRefresh: request.options?.forceRefresh,
        });
        const repoKey = `${request.repository.owner}/${request.repository.repo}`;
        // Check cache unless force refresh is requested
        if (!request.options?.forceRefresh) {
            const cachedAnalysis = await cache_1.cacheService.getRepositoryAnalysis(request.repository.owner, request.repository.repo, request.options?.lastAnalyzedCommit);
            if (cachedAnalysis) {
                logger_1.logger.info('Returning cached repository analysis', { requestId, repoKey });
                return res.json({
                    ...cachedAnalysis,
                    cacheInfo: {
                        cached: true,
                        lastUpdated: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    },
                });
            }
        }
        // Validate repository access
        let repoInfo;
        try {
            repoInfo = await github_1.githubService.getRepository(request.repository);
        }
        catch (error) {
            (0, errorHandler_1.handleGitHubError)(error, repoKey);
        }
        // Get latest commit for cache versioning
        const latestCommit = await github_1.githubService.getLatestCommit(request.repository);
        // Perform repository analysis using the visual coding agent
        let analysisResult;
        try {
            analysisResult = await visualAgent.analyzeRepository({
                repository: request.repository,
                options: request.options,
            });
        }
        catch (error) {
            (0, errorHandler_1.handleClaudeError)(error);
        }
        const response = {
            success: true,
            analysis: {
                designTokens: analysisResult.designTokens,
                components: analysisResult.components,
                framework: analysisResult.framework,
                stylingSystem: analysisResult.stylingSystem,
                librariesDetected: analysisResult.librariesDetected,
                fileStructure: analysisResult.fileStructure,
            },
            cacheInfo: {
                cached: false,
                lastUpdated: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
        };
        // Cache the analysis
        await cache_1.cacheService.setRepositoryAnalysis(request.repository.owner, request.repository.repo, response, latestCommit.sha);
        const processingTime = Date.now() - startTime;
        (0, logger_1.logPerformance)({
            requestId,
            operation: 'analyzeRepository',
            duration: processingTime,
            success: true,
        }, {
            repository: repoKey,
            componentsFound: analysisResult.components.length,
            framework: analysisResult.framework,
        });
        res.json(response);
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        (0, logger_1.logPerformance)({
            requestId,
            operation: 'analyzeRepository',
            duration: processingTime,
            success: false,
        });
        throw error;
    }
}
// === Batch Process Handler ===
async function batchProcessHandler(req, res) {
    const startTime = Date.now();
    const request = req.body;
    const requestId = req.requestId;
    try {
        logger_1.logger.info('Processing batch request', {
            requestId,
            repository: `${request.repository.owner}/${request.repository.repo}`,
            editCount: request.edits.length,
        });
        // Validate repository access
        try {
            await github_1.githubService.getRepository(request.repository);
        }
        catch (error) {
            (0, errorHandler_1.handleGitHubError)(error, `${request.repository.owner}/${request.repository.repo}`);
        }
        const results = [];
        let totalTokensUsed = 0;
        // Process edits sequentially to avoid conflicts
        for (const edit of request.edits) {
            const editStartTime = Date.now();
            try {
                logger_1.logger.info('Processing batch edit', {
                    requestId,
                    editId: edit.id,
                    description: edit.description,
                });
                // Create a visual edit request for this batch item
                const visualEditRequest = {
                    description: edit.description,
                    element: edit.element,
                    repository: request.repository,
                    context: request.context || {
                        framework: 'react',
                        stylingSystem: 'tailwind',
                    },
                    options: {
                        includeAlternatives: false, // Skip alternatives for batch processing
                        maxAlternatives: 1,
                        confidenceThreshold: 0.7,
                    },
                };
                // Check cache
                const requestHash = (0, cache_1.hashRequest)({
                    description: edit.description,
                    element: edit.element,
                    context: request.context,
                });
                let cachedResponse = await cache_1.cacheService.getClaudeResponse(requestHash);
                let processingResult;
                if (cachedResponse) {
                    processingResult = cachedResponse;
                    logger_1.logger.info('Using cached result for batch edit', { requestId, editId: edit.id });
                }
                else {
                    // Process with agent
                    const agentResult = await visualAgent.processVisualEdit({
                        description: edit.description,
                        element: edit.element,
                        context: {
                            ...visualEditRequest.context,
                            repository: request.repository,
                        },
                        options: visualEditRequest.options,
                    });
                    processingResult = {
                        changes: agentResult.changes.map(change => ({
                            filePath: change.filePath,
                            oldContent: change.oldContent,
                            newContent: change.newContent,
                            lineNumber: change.lineNumber,
                            reasoning: change.reasoning,
                        })),
                        explanation: agentResult.explanation,
                        confidence: agentResult.confidence,
                        claudeTokensUsed: agentResult.tokensUsed || 0,
                    };
                    // Cache the result
                    await cache_1.cacheService.setClaudeResponse(requestHash, processingResult);
                }
                totalTokensUsed += processingResult.claudeTokensUsed || 0;
                results.push({
                    editId: edit.id,
                    success: true,
                    changes: processingResult.changes,
                    explanation: processingResult.explanation,
                    confidence: processingResult.confidence,
                });
                (0, logger_1.logPerformance)({
                    requestId,
                    operation: `batchEdit_${edit.id}`,
                    duration: Date.now() - editStartTime,
                    success: true,
                });
            }
            catch (error) {
                logger_1.logger.error('Batch edit failed', {
                    requestId,
                    editId: edit.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                results.push({
                    editId: edit.id,
                    success: false,
                    error: error instanceof Error ? error.message : 'Processing failed',
                });
                (0, logger_1.logPerformance)({
                    requestId,
                    operation: `batchEdit_${edit.id}`,
                    duration: Date.now() - editStartTime,
                    success: false,
                });
            }
        }
        const totalProcessingTime = Date.now() - startTime;
        const response = {
            success: true,
            results,
            totalProcessingTime,
            totalTokensUsed,
        };
        (0, logger_1.logPerformance)({
            requestId,
            operation: 'batchProcess',
            duration: totalProcessingTime,
            success: true,
        }, {
            editCount: request.edits.length,
            successfulEdits: results.filter(r => r.success).length,
            totalTokensUsed,
        });
        res.json(response);
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        (0, logger_1.logPerformance)({
            requestId,
            operation: 'batchProcess',
            duration: processingTime,
            success: false,
        });
        throw error;
    }
}
// === Create Pull Request Handler ===
async function createPullRequestHandler(req, res) {
    const startTime = Date.now();
    const request = req.body;
    const requestId = req.requestId;
    try {
        logger_1.logger.info('Creating pull request', {
            requestId,
            repository: `${request.repository.owner}/${request.repository.repo}`,
            title: request.pullRequest.title,
            changesCount: request.changes.length,
        });
        // Validate repository access
        try {
            await github_1.githubService.getRepository(request.repository);
        }
        catch (error) {
            (0, errorHandler_1.handleGitHubError)(error, `${request.repository.owner}/${request.repository.repo}`);
        }
        // Validate that we have changes to apply
        if (request.changes.length === 0) {
            throw new errorHandler_1.ValidationError('No changes provided for pull request');
        }
        // Create the pull request using GitHub service
        const result = await github_1.githubService.createPullRequest(request.repository, request.changes, {
            title: request.pullRequest.title,
            description: request.pullRequest.description,
            branchName: request.pullRequest.branchName,
            baseBranch: request.pullRequest.baseBranch,
            draft: request.pullRequest.draft,
            autoMerge: request.pullRequest.autoMerge,
        }, {
            commitMessage: request.options?.commitMessage,
            createBranchFromLatest: request.options?.createBranchFromLatest ?? true,
            deleteSourceBranch: request.options?.deleteSourceBranch ?? true,
        });
        const processingTime = Date.now() - startTime;
        const response = {
            success: true,
            pullRequest: result.pullRequest,
            changes: result.changes,
            processingTime,
        };
        // Log performance metrics
        (0, logger_1.logPerformance)({
            requestId,
            operation: 'createPullRequest',
            duration: processingTime,
            success: true,
        }, {
            repository: `${request.repository.owner}/${request.repository.repo}`,
            prNumber: result.pullRequest.number,
            filesModified: result.changes.filesModified,
            linesAdded: result.changes.linesAdded,
            branchName: result.pullRequest.branchName,
        });
        logger_1.logger.info('Pull request created successfully', {
            requestId,
            prNumber: result.pullRequest.number,
            prUrl: result.pullRequest.htmlUrl,
            filesModified: result.changes.filesModified,
        });
        res.json(response);
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        (0, logger_1.logPerformance)({
            requestId,
            operation: 'createPullRequest',
            duration: processingTime,
            success: false,
        });
        throw error;
    }
}
//# sourceMappingURL=apiHandlers.js.map