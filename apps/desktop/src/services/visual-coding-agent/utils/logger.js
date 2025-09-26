"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logRequest = logRequest;
exports.logRequestError = logRequestError;
exports.logPerformance = logPerformance;
exports.logClaudeRequest = logClaudeRequest;
exports.logGitHubRequest = logGitHubRequest;
exports.logCacheOperation = logCacheOperation;
exports.logSecurityEvent = logSecurityEvent;
exports.logMetrics = logMetrics;
exports.logError = logError;
exports.logUnhandledError = logUnhandledError;
const winston_1 = __importDefault(require("winston"));
const environment_1 = require("../config/environment");
// Custom log format
const customFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.prettyPrint());
// Console format for development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'HH:mm:ss'
}), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    // Add metadata if present
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
    if (metaStr) {
        logMessage += `\n${metaStr}`;
    }
    return logMessage;
}));
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: environment_1.config.logging.level,
    format: customFormat,
    defaultMeta: {
        service: 'visual-coding-agent',
        environment: environment_1.config.nodeEnv,
    },
    transports: [
        // Console transport
        new winston_1.default.transports.Console({
            format: environment_1.config.isDevelopment ? consoleFormat : customFormat,
            silent: process.env.NODE_ENV === 'test',
        }),
    ],
});
// Add file transport in production
if (environment_1.config.isProduction) {
    // Error log file
    exports.logger.add(new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
    // Combined log file
    exports.logger.add(new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}
function logRequest(context, message, meta) {
    exports.logger.info(message, {
        ...context,
        ...meta,
        type: 'request',
    });
}
function logRequestError(context, error, meta) {
    exports.logger.error('Request error', {
        ...context,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
        ...meta,
        type: 'request_error',
    });
}
function logPerformance(context, meta) {
    const level = context.duration > 5000 ? 'warn' : 'info'; // Warn if over 5 seconds
    exports.logger.log(level, `Operation completed: ${context.operation}`, {
        ...context,
        ...meta,
        type: 'performance',
    });
}
function logClaudeRequest(context, meta) {
    exports.logger.info('Claude API request completed', {
        ...context,
        ...meta,
        type: 'claude_api',
    });
}
function logGitHubRequest(context, meta) {
    exports.logger.info('GitHub API request completed', {
        ...context,
        ...meta,
        type: 'github_api',
    });
}
function logCacheOperation(context, meta) {
    exports.logger.debug('Cache operation', {
        ...context,
        ...meta,
        type: 'cache',
    });
}
function logSecurityEvent(context, message) {
    exports.logger.warn(`Security event: ${message}`, {
        ...context,
        type: 'security',
    });
}
function logMetrics(context) {
    exports.logger.info('Request metrics', {
        ...context,
        type: 'metrics',
    });
}
// === Error Utilities ===
function logError(error, context) {
    exports.logger.error(error.message, {
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
        ...context,
        type: 'error',
    });
}
function logUnhandledError(error, type) {
    exports.logger.error(`Unhandled ${type}`, {
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
        type: 'unhandled_error',
        severity: 'critical',
    });
}
// === Process Error Handlers ===
if (environment_1.config.isProduction) {
    process.on('uncaughtException', (error) => {
        logUnhandledError(error, 'uncaughtException');
        process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        logUnhandledError(error, 'unhandledRejection');
    });
}
// === Development Helpers ===
if (environment_1.config.isDevelopment) {
    // Add some helpful development logging
    exports.logger.info('🚀 Logger initialized', {
        level: environment_1.config.logging.level,
        environment: environment_1.config.nodeEnv,
    });
}
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map