"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheError = exports.AnalysisFailedError = exports.GitHubAPIError = exports.ClaudeAPIError = exports.FileNotFoundError = exports.RepositoryNotFoundError = exports.RateLimitError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
exports.asyncHandler = asyncHandler;
exports.throwValidationError = throwValidationError;
exports.throwNotFoundError = throwNotFoundError;
exports.throwInternalError = throwInternalError;
exports.handleClaudeError = handleClaudeError;
exports.handleGitHubError = handleGitHubError;
exports.validateRequest = validateRequest;
const zod_1 = require("zod");
const types_1 = require("../api/types");
const logger_1 = require("../utils/logger");
// === Custom Error Classes ===
class AppError extends Error {
    code;
    message;
    statusCode;
    retryable;
    details;
    constructor(code, message, statusCode = 500, retryable = false, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.retryable = retryable;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(types_1.ErrorCodes.INVALID_REQUEST, message, 400, false, details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(types_1.ErrorCodes.AUTHENTICATION_FAILED, message, 401, false);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(types_1.ErrorCodes.RATE_LIMIT_EXCEEDED, message, 429, true);
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
class RepositoryNotFoundError extends AppError {
    constructor(repository) {
        super(types_1.ErrorCodes.REPOSITORY_NOT_FOUND, `Repository ${repository} not found or not accessible`, 404, false);
        this.name = 'RepositoryNotFoundError';
    }
}
exports.RepositoryNotFoundError = RepositoryNotFoundError;
class FileNotFoundError extends AppError {
    constructor(filePath) {
        super(types_1.ErrorCodes.FILE_NOT_FOUND, `File ${filePath} not found`, 404, false);
        this.name = 'FileNotFoundError';
    }
}
exports.FileNotFoundError = FileNotFoundError;
class ClaudeAPIError extends AppError {
    constructor(message, retryable = true) {
        super(types_1.ErrorCodes.CLAUDE_API_ERROR, message, 502, retryable);
        this.name = 'ClaudeAPIError';
    }
}
exports.ClaudeAPIError = ClaudeAPIError;
class GitHubAPIError extends AppError {
    constructor(message, retryable = true) {
        super(types_1.ErrorCodes.GITHUB_API_ERROR, message, 502, retryable);
        this.name = 'GitHubAPIError';
    }
}
exports.GitHubAPIError = GitHubAPIError;
class AnalysisFailedError extends AppError {
    constructor(message, details) {
        super(types_1.ErrorCodes.ANALYSIS_FAILED, message, 422, false, details);
        this.name = 'AnalysisFailedError';
    }
}
exports.AnalysisFailedError = AnalysisFailedError;
class CacheError extends AppError {
    constructor(message) {
        super(types_1.ErrorCodes.CACHE_ERROR, message, 503, true);
        this.name = 'CacheError';
    }
}
exports.CacheError = CacheError;
// === Error Handler Middleware ===
function errorHandler(error, req, res, next) {
    // If response already sent, delegate to default Express error handler
    if (res.headersSent) {
        return next(error);
    }
    const requestId = req.requestId || 'unknown';
    let errorResponse;
    // Handle different error types
    if (error instanceof AppError) {
        // Custom application errors
        errorResponse = {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
                requestId,
                timestamp: new Date().toISOString(),
            },
            retryable: error.retryable,
        };
        (0, logger_1.logRequestError)({
            requestId,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.userId,
        }, error, {
            statusCode: error.statusCode,
            errorCode: error.code,
            retryable: error.retryable,
        });
        res.status(error.statusCode).json(errorResponse);
    }
    else if (error instanceof zod_1.ZodError) {
        // Zod validation errors
        const validationErrors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.received,
        }));
        errorResponse = {
            success: false,
            error: {
                code: types_1.ErrorCodes.INVALID_REQUEST,
                message: 'Request validation failed',
                details: { validationErrors },
                requestId,
                timestamp: new Date().toISOString(),
            },
            retryable: false,
        };
        (0, logger_1.logRequestError)({
            requestId,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.userId,
        }, error, {
            statusCode: 400,
            errorCode: types_1.ErrorCodes.INVALID_REQUEST,
            validationErrors,
        });
        res.status(400).json(errorResponse);
    }
    else if (error.name === 'SyntaxError' && 'body' in error) {
        // JSON parsing errors
        errorResponse = {
            success: false,
            error: {
                code: types_1.ErrorCodes.INVALID_REQUEST,
                message: 'Invalid JSON in request body',
                requestId,
                timestamp: new Date().toISOString(),
            },
            retryable: false,
        };
        (0, logger_1.logRequestError)({
            requestId,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.userId,
        }, error, { statusCode: 400, errorCode: types_1.ErrorCodes.INVALID_REQUEST });
        res.status(400).json(errorResponse);
    }
    else {
        // Unknown errors - don't expose internal details
        const isProduction = process.env.NODE_ENV === 'production';
        errorResponse = {
            success: false,
            error: {
                code: types_1.ErrorCodes.INTERNAL_ERROR,
                message: isProduction
                    ? 'An internal error occurred'
                    : error.message,
                details: isProduction ? undefined : { stack: error.stack },
                requestId,
                timestamp: new Date().toISOString(),
            },
            retryable: true,
        };
        // Log full error details for internal errors
        logger_1.logger.error('Unhandled error in request:', {
            requestId,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.userId,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
        });
        res.status(500).json(errorResponse);
    }
}
// === 404 Handler ===
function notFoundHandler(req, res) {
    const requestId = req.requestId || 'unknown';
    const errorResponse = {
        success: false,
        error: {
            code: types_1.ErrorCodes.INVALID_REQUEST,
            message: `Endpoint ${req.method} ${req.path} not found`,
            requestId,
            timestamp: new Date().toISOString(),
        },
        retryable: false,
    };
    logger_1.logger.warn('404 Not Found:', {
        requestId,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
    });
    res.status(404).json(errorResponse);
}
// === Async Error Handler Wrapper ===
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// === Error Helper Functions ===
function throwValidationError(message, details) {
    throw new ValidationError(message, details);
}
function throwNotFoundError(resource, identifier) {
    if (resource === 'repository') {
        throw new RepositoryNotFoundError(identifier);
    }
    else if (resource === 'file') {
        throw new FileNotFoundError(identifier);
    }
    throw new AppError(types_1.ErrorCodes.INVALID_REQUEST, `${resource} ${identifier} not found`, 404);
}
function throwInternalError(message, details) {
    throw new AppError(types_1.ErrorCodes.INTERNAL_ERROR, message, 500, true, details);
}
// === Claude API Error Handler ===
function handleClaudeError(error) {
    if (error.status === 429) {
        throw new ClaudeAPIError('Claude API rate limit exceeded', true);
    }
    else if (error.status >= 500) {
        throw new ClaudeAPIError('Claude API server error', true);
    }
    else if (error.status === 400) {
        throw new ClaudeAPIError('Invalid request to Claude API', false);
    }
    else if (error.status === 401) {
        throw new ClaudeAPIError('Claude API authentication failed', false);
    }
    throw new ClaudeAPIError(error.message || 'Claude API error', error.status >= 500);
}
// === GitHub API Error Handler ===
function handleGitHubError(error, context) {
    const contextMsg = context ? ` (${context})` : '';
    if (error.status === 404) {
        throw new RepositoryNotFoundError(context || 'repository');
    }
    else if (error.status === 403) {
        if (error.message?.includes('rate limit')) {
            throw new GitHubAPIError(`GitHub API rate limit exceeded${contextMsg}`, true);
        }
        throw new GitHubAPIError(`GitHub API access forbidden${contextMsg}`, false);
    }
    else if (error.status === 401) {
        throw new GitHubAPIError(`GitHub API authentication failed${contextMsg}`, false);
    }
    else if (error.status >= 500) {
        throw new GitHubAPIError(`GitHub API server error${contextMsg}`, true);
    }
    throw new GitHubAPIError(error.message || `GitHub API error${contextMsg}`, error.status >= 500);
}
// === Request Validation Middleware ===
function validateRequest(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=errorHandler.js.map