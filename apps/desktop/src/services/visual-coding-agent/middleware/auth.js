"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
exports.authenticateApiKey = authenticateApiKey;
exports.optionalAuth = optionalAuth;
exports.rateLimitByApiKey = rateLimitByApiKey;
exports.validateBatchSize = validateBatchSize;
exports.cleanupRateLimitStores = cleanupRateLimitStores;
const environment_1 = require("../config/environment");
const types_1 = require("../api/types");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
// === Request ID Middleware ===
function requestIdMiddleware(req, res, next) {
    req.requestId = (0, uuid_1.v4)();
    req.startTime = Date.now();
    // Add request ID to response headers for debugging
    res.setHeader('X-Request-ID', req.requestId);
    next();
}
// === API Key Authentication ===
function authenticateApiKey(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        (0, logger_1.logSecurityEvent)({
            requestId: req.requestId,
            event: 'auth_failure',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            details: { reason: 'missing_auth_header' },
        }, 'Missing authorization header');
        return res.status(401).json({
            success: false,
            error: {
                code: types_1.ErrorCodes.AUTHENTICATION_FAILED,
                message: 'Authorization header is required',
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
            retryable: false,
        });
    }
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
        (0, logger_1.logSecurityEvent)({
            requestId: req.requestId,
            event: 'auth_failure',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            details: { reason: 'invalid_auth_format' },
        }, 'Invalid authorization format');
        return res.status(401).json({
            success: false,
            error: {
                code: types_1.ErrorCodes.AUTHENTICATION_FAILED,
                message: 'Authorization must be in format: Bearer <token>',
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
            retryable: false,
        });
    }
    // Validate API key
    if (token !== environment_1.config.visualAgentApiKey) {
        (0, logger_1.logSecurityEvent)({
            requestId: req.requestId,
            event: 'auth_failure',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            details: { reason: 'invalid_api_key', keyPrefix: token.substring(0, 8) },
        }, 'Invalid API key');
        return res.status(401).json({
            success: false,
            error: {
                code: types_1.ErrorCodes.AUTHENTICATION_FAILED,
                message: 'Invalid API key',
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
            retryable: false,
        });
    }
    // Add API key to request context
    req.apiKey = token;
    // Extract user ID from API key if it follows a pattern (e.g., va_live_userid_randompart)
    const keyParts = token.split('_');
    if (keyParts.length >= 3 && keyParts[0] === 'va') {
        req.userId = keyParts[2];
    }
    next();
}
// === Optional Authentication (for public endpoints) ===
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        // If auth header is present, validate it
        return authenticateApiKey(req, res, next);
    }
    // No auth header, continue without authentication
    next();
}
// === Rate Limiting by API Key ===
const rateLimitStore = new Map();
function rateLimitByApiKey(req, res, next) {
    const apiKey = req.apiKey;
    if (!apiKey) {
        // If no API key, apply global rate limiting by IP
        return rateLimitByIp(req, res, next);
    }
    const now = Date.now();
    const windowMs = environment_1.config.rateLimits.windowMs;
    const maxRequests = environment_1.config.rateLimits.maxRequests;
    // Get or create rate limit entry for this API key
    let entry = rateLimitStore.get(apiKey);
    if (!entry || now - entry.lastReset > windowMs) {
        entry = { requests: [], lastReset: now };
        rateLimitStore.set(apiKey, entry);
    }
    // Remove expired requests
    entry.requests = entry.requests.filter(time => now - time < windowMs);
    // Check if limit exceeded
    if (entry.requests.length >= maxRequests) {
        const resetTime = new Date(entry.lastReset + windowMs);
        (0, logger_1.logSecurityEvent)({
            requestId: req.requestId,
            event: 'rate_limit',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            details: {
                apiKey: apiKey.substring(0, 8) + '...',
                requests: entry.requests.length,
                limit: maxRequests,
            },
        }, 'Rate limit exceeded');
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime.getTime() / 1000).toString());
        return res.status(429).json({
            success: false,
            error: {
                code: types_1.ErrorCodes.RATE_LIMIT_EXCEEDED,
                message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000 / 60} minutes.`,
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                details: {
                    limit: maxRequests,
                    windowMs,
                    resetTime: resetTime.toISOString(),
                },
            },
            retryable: true,
        });
    }
    // Add current request
    entry.requests.push(now);
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - entry.requests.length).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil((entry.lastReset + windowMs) / 1000).toString());
    next();
}
// === Rate Limiting by IP (fallback) ===
const ipRateLimitStore = new Map();
function rateLimitByIp(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = environment_1.config.rateLimits.windowMs;
    const maxRequests = Math.floor(environment_1.config.rateLimits.maxRequests / 2); // Lower limit for unauthenticated
    let entry = ipRateLimitStore.get(ip);
    if (!entry || now - entry.lastReset > windowMs) {
        entry = { requests: [], lastReset: now };
        ipRateLimitStore.set(ip, entry);
    }
    entry.requests = entry.requests.filter(time => now - time < windowMs);
    if (entry.requests.length >= maxRequests) {
        (0, logger_1.logSecurityEvent)({
            requestId: req.requestId,
            event: 'rate_limit',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            details: {
                type: 'ip_based',
                requests: entry.requests.length,
                limit: maxRequests,
            },
        }, 'IP-based rate limit exceeded');
        return res.status(429).json({
            success: false,
            error: {
                code: types_1.ErrorCodes.RATE_LIMIT_EXCEEDED,
                message: `Rate limit exceeded for IP ${ip}`,
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
            retryable: true,
        });
    }
    entry.requests.push(now);
    next();
}
// === Batch Size Validation ===
function validateBatchSize(req, res, next) {
    if (req.body?.edits && Array.isArray(req.body.edits)) {
        const batchSize = req.body.edits.length;
        const maxBatchSize = environment_1.config.rateLimits.maxBatchSize;
        if (batchSize > maxBatchSize) {
            (0, logger_1.logSecurityEvent)({
                requestId: req.requestId,
                event: 'invalid_request',
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                details: {
                    batchSize,
                    maxBatchSize,
                },
            }, 'Batch size exceeded');
            return res.status(400).json({
                success: false,
                error: {
                    code: types_1.ErrorCodes.INVALID_REQUEST,
                    message: `Batch size ${batchSize} exceeds maximum of ${maxBatchSize}`,
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
                retryable: false,
            });
        }
    }
    next();
}
// === Cleanup Function (call periodically) ===
function cleanupRateLimitStores() {
    const now = Date.now();
    const windowMs = environment_1.config.rateLimits.windowMs;
    // Clean up API key store
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now - entry.lastReset > windowMs * 2) {
            rateLimitStore.delete(key);
        }
    }
    // Clean up IP store
    for (const [ip, entry] of ipRateLimitStore.entries()) {
        if (now - entry.lastReset > windowMs * 2) {
            ipRateLimitStore.delete(ip);
        }
    }
}
// Clean up every 10 minutes
setInterval(cleanupRateLimitStores, 10 * 60 * 1000);
//# sourceMappingURL=auth.js.map