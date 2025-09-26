"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMetricsSchema = exports.HealthCheckResponseSchema = exports.ServiceHealthSchema = exports.ErrorResponseSchema = exports.ErrorCodes = exports.CreatePullRequestResponseSchema = exports.PullRequestInfoSchema = exports.CreatePullRequestRequestSchema = exports.BatchProcessResponseSchema = exports.BatchEditResultSchema = exports.BatchProcessRequestSchema = exports.BatchEditSchema = exports.AnalyzeRepositoryResponseSchema = exports.ComponentStructureSchema = exports.AnalyzeRepositoryRequestSchema = exports.ProcessVisualEditResponseSchema = exports.AlternativeChangeSchema = exports.CodeChangeSchema = exports.ProcessVisualEditRequestSchema = exports.ContextSchema = exports.ComponentMappingSchema = exports.DesignTokensSchema = exports.RepositorySchema = exports.ElementSchema = void 0;
const zod_1 = require("zod");
// === Base Types ===
exports.ElementSchema = zod_1.z.object({
    tagName: zod_1.z.string(),
    classes: zod_1.z.array(zod_1.z.string()),
    computedStyles: zod_1.z.record(zod_1.z.string()),
    textContent: zod_1.z.string().optional(),
    selector: zod_1.z.string(),
    attributes: zod_1.z.record(zod_1.z.string()).optional(),
});
exports.RepositorySchema = zod_1.z.object({
    owner: zod_1.z.string(),
    repo: zod_1.z.string(),
    branch: zod_1.z.string().default('main'),
    filePath: zod_1.z.string().optional(),
    githubToken: zod_1.z.string().optional(),
});
exports.DesignTokensSchema = zod_1.z.object({
    fontSize: zod_1.z.record(zod_1.z.string()).optional(),
    colors: zod_1.z.record(zod_1.z.string()).optional(),
    spacing: zod_1.z.record(zod_1.z.string()).optional(),
    borderRadius: zod_1.z.record(zod_1.z.string()).optional(),
    shadows: zod_1.z.record(zod_1.z.string()).optional(),
    breakpoints: zod_1.z.record(zod_1.z.string()).optional(),
});
exports.ComponentMappingSchema = zod_1.z.object({
    componentName: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(1),
    filePath: zod_1.z.string().optional(),
});
exports.ContextSchema = zod_1.z.object({
    framework: zod_1.z.enum(['react', 'vue', 'svelte', 'angular', 'vanilla']),
    stylingSystem: zod_1.z.enum(['tailwind', 'styled-components', 'emotion', 'css-modules', 'sass', 'css']),
    designTokens: exports.DesignTokensSchema.optional(),
    componentMapping: exports.ComponentMappingSchema.optional(),
    librariesDetected: zod_1.z.array(zod_1.z.string()).optional(),
});
// === API Request/Response Schemas ===
exports.ProcessVisualEditRequestSchema = zod_1.z.object({
    description: zod_1.z.string().min(1).max(500),
    element: exports.ElementSchema,
    repository: exports.RepositorySchema,
    context: exports.ContextSchema,
    options: zod_1.z.object({
        includeAlternatives: zod_1.z.boolean().default(true),
        maxAlternatives: zod_1.z.number().min(1).max(5).default(3),
        confidenceThreshold: zod_1.z.number().min(0).max(1).default(0.7),
    }).optional(),
});
exports.CodeChangeSchema = zod_1.z.object({
    filePath: zod_1.z.string(),
    oldContent: zod_1.z.string(),
    newContent: zod_1.z.string(),
    lineNumber: zod_1.z.number().optional(),
    reasoning: zod_1.z.string(),
});
exports.AlternativeChangeSchema = zod_1.z.object({
    description: zod_1.z.string(),
    changes: zod_1.z.array(exports.CodeChangeSchema),
    confidence: zod_1.z.number().min(0).max(1).optional(),
});
exports.ProcessVisualEditResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    requestId: zod_1.z.string(),
    changes: zod_1.z.array(exports.CodeChangeSchema),
    explanation: zod_1.z.string(),
    alternatives: zod_1.z.array(exports.AlternativeChangeSchema).optional(),
    confidence: zod_1.z.number().min(0).max(1),
    processingTime: zod_1.z.number(),
    claudeTokensUsed: zod_1.z.number(),
});
exports.AnalyzeRepositoryRequestSchema = zod_1.z.object({
    repository: exports.RepositorySchema,
    options: zod_1.z.object({
        forceRefresh: zod_1.z.boolean().default(false),
        lastAnalyzedCommit: zod_1.z.string().optional(),
        changedFiles: zod_1.z.array(zod_1.z.string()).optional(),
        includeDesignTokens: zod_1.z.boolean().default(true),
        includeComponents: zod_1.z.boolean().default(true),
    }).optional(),
});
exports.ComponentStructureSchema = zod_1.z.object({
    name: zod_1.z.string(),
    filePath: zod_1.z.string(),
    type: zod_1.z.enum(['component', 'hook', 'utility', 'type', 'config']),
    exports: zod_1.z.array(zod_1.z.string()),
    dependencies: zod_1.z.array(zod_1.z.string()),
    props: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        type: zod_1.z.string(),
        required: zod_1.z.boolean(),
        description: zod_1.z.string().optional(),
    })).optional(),
});
exports.AnalyzeRepositoryResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    analysis: zod_1.z.object({
        designTokens: exports.DesignTokensSchema,
        components: zod_1.z.array(exports.ComponentStructureSchema),
        framework: zod_1.z.string(),
        stylingSystem: zod_1.z.string(),
        librariesDetected: zod_1.z.array(zod_1.z.string()),
        fileStructure: zod_1.z.record(zod_1.z.array(zod_1.z.string())),
    }),
    cacheInfo: zod_1.z.object({
        cached: zod_1.z.boolean(),
        lastUpdated: zod_1.z.string(),
        expiresAt: zod_1.z.string(),
    }),
});
exports.BatchEditSchema = zod_1.z.object({
    id: zod_1.z.string(),
    description: zod_1.z.string().min(1).max(500),
    element: exports.ElementSchema,
});
exports.BatchProcessRequestSchema = zod_1.z.object({
    repository: exports.RepositorySchema,
    edits: zod_1.z.array(exports.BatchEditSchema).min(1).max(10),
    context: exports.ContextSchema.optional(),
});
exports.BatchEditResultSchema = zod_1.z.object({
    editId: zod_1.z.string(),
    success: zod_1.z.boolean(),
    changes: zod_1.z.array(exports.CodeChangeSchema).optional(),
    explanation: zod_1.z.string().optional(),
    error: zod_1.z.string().optional(),
    confidence: zod_1.z.number().min(0).max(1).optional(),
});
exports.BatchProcessResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    results: zod_1.z.array(exports.BatchEditResultSchema),
    totalProcessingTime: zod_1.z.number(),
    totalTokensUsed: zod_1.z.number(),
});
// === Pull Request Creation Schemas ===
exports.CreatePullRequestRequestSchema = zod_1.z.object({
    repository: exports.RepositorySchema,
    changes: zod_1.z.array(exports.CodeChangeSchema),
    pullRequest: zod_1.z.object({
        title: zod_1.z.string().min(1).max(200),
        description: zod_1.z.string().max(5000).optional(),
        branchName: zod_1.z.string().min(1).max(100).optional(), // Auto-generated if not provided
        baseBranch: zod_1.z.string().default('main'),
        draft: zod_1.z.boolean().default(false),
        autoMerge: zod_1.z.boolean().default(false),
    }),
    options: zod_1.z.object({
        commitMessage: zod_1.z.string().max(200).optional(),
        createBranchFromLatest: zod_1.z.boolean().default(true),
        deleteSourceBranch: zod_1.z.boolean().default(true), // After merge
    }).optional(),
});
exports.PullRequestInfoSchema = zod_1.z.object({
    number: zod_1.z.number(),
    title: zod_1.z.string(),
    url: zod_1.z.string(),
    htmlUrl: zod_1.z.string(),
    state: zod_1.z.enum(['open', 'closed', 'merged']),
    branchName: zod_1.z.string(),
    baseBranch: zod_1.z.string(),
    draft: zod_1.z.boolean(),
    mergeable: zod_1.z.boolean().nullable(),
    commits: zod_1.z.number(),
    additions: zod_1.z.number(),
    deletions: zod_1.z.number(),
    changedFiles: zod_1.z.number(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.CreatePullRequestResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    pullRequest: exports.PullRequestInfoSchema,
    changes: zod_1.z.object({
        filesModified: zod_1.z.number(),
        linesAdded: zod_1.z.number(),
        linesRemoved: zod_1.z.number(),
        commitSha: zod_1.z.string(),
    }),
    processingTime: zod_1.z.number(),
});
// === Error Response Schema ===
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes["INVALID_REQUEST"] = "INVALID_REQUEST";
    ErrorCodes["REPOSITORY_NOT_FOUND"] = "REPOSITORY_NOT_FOUND";
    ErrorCodes["CLAUDE_API_ERROR"] = "CLAUDE_API_ERROR";
    ErrorCodes["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ErrorCodes["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCodes["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    ErrorCodes["ANALYSIS_FAILED"] = "ANALYSIS_FAILED";
    ErrorCodes["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    ErrorCodes["GITHUB_API_ERROR"] = "GITHUB_API_ERROR";
    ErrorCodes["CACHE_ERROR"] = "CACHE_ERROR";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
exports.ErrorResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: zod_1.z.object({
        code: zod_1.z.nativeEnum(ErrorCodes),
        message: zod_1.z.string(),
        details: zod_1.z.any().optional(),
        requestId: zod_1.z.string(),
        timestamp: zod_1.z.string(),
    }),
    retryable: zod_1.z.boolean(),
});
// === Health Check Schemas ===
exports.ServiceHealthSchema = zod_1.z.object({
    status: zod_1.z.enum(['healthy', 'degraded', 'unhealthy']),
    responseTime: zod_1.z.number().optional(),
    lastError: zod_1.z.string().nullable().optional(),
});
exports.HealthCheckResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['healthy', 'degraded', 'unhealthy']),
    timestamp: zod_1.z.string(),
    version: zod_1.z.string(),
    uptime: zod_1.z.number(),
    services: zod_1.z.object({
        claude: exports.ServiceHealthSchema,
        redis: exports.ServiceHealthSchema.extend({
            connected: zod_1.z.boolean(),
            memory: zod_1.z.string().optional(),
            hitRate: zod_1.z.number().optional(),
        }),
        database: exports.ServiceHealthSchema.extend({
            connected: zod_1.z.boolean(),
            activeConnections: zod_1.z.number().optional(),
        }),
        github: exports.ServiceHealthSchema.extend({
            rateLimit: zod_1.z.object({
                remaining: zod_1.z.number(),
                resetAt: zod_1.z.string(),
            }).optional(),
        }),
    }),
    metrics: zod_1.z.object({
        requestsLastHour: zod_1.z.number(),
        averageResponseTime: zod_1.z.number(),
        errorRate: zod_1.z.number(),
        cacheHitRate: zod_1.z.number(),
    }),
});
// === Metrics Schema ===
exports.AgentMetricsSchema = zod_1.z.object({
    requestId: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    repository: zod_1.z.string(),
    description: zod_1.z.string(),
    framework: zod_1.z.string(),
    stylingSystem: zod_1.z.string(),
    processingTime: zod_1.z.number(),
    claudeTokensUsed: zod_1.z.number(),
    cacheHit: zod_1.z.boolean(),
    success: zod_1.z.boolean(),
    changesGenerated: zod_1.z.number(),
    confidence: zod_1.z.number(),
    userFeedback: zod_1.z.enum(['helpful', 'not_helpful']).optional(),
    appliedChanges: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=types.js.map