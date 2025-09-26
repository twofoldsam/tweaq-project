"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiRoutes = createApiRoutes;
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const types_1 = require("../api/types");
const apiHandlers_1 = require("../handlers/apiHandlers");
function createApiRoutes() {
    const router = (0, express_1.Router)();
    // === Process Visual Edit ===
    router.post('/process-visual-edit', (0, errorHandler_1.validateRequest)(types_1.ProcessVisualEditRequestSchema), (0, errorHandler_1.asyncHandler)(apiHandlers_1.processVisualEditHandler));
    // === Analyze Repository ===
    router.post('/analyze-repository', (0, errorHandler_1.validateRequest)(types_1.AnalyzeRepositoryRequestSchema), (0, errorHandler_1.asyncHandler)(apiHandlers_1.analyzeRepositoryHandler));
    // === Batch Process ===
    router.post('/batch-process', (0, errorHandler_1.validateRequest)(types_1.BatchProcessRequestSchema), (0, errorHandler_1.asyncHandler)(apiHandlers_1.batchProcessHandler));
    // === Create Pull Request ===
    router.post('/create-pull-request', (0, errorHandler_1.validateRequest)(types_1.CreatePullRequestRequestSchema), (0, errorHandler_1.asyncHandler)(apiHandlers_1.createPullRequestHandler));
    return router;
}
//# sourceMappingURL=api.js.map