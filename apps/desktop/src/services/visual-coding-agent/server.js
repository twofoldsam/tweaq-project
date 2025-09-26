"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const environment_1 = require("./config/environment");
const logger_1 = require("./utils/logger");
const cache_1 = require("./services/cache");
const auth_1 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
// Import route handlers
const api_1 = require("./routes/api");
const health_1 = require("./routes/health");
// === Express App Setup ===
const app = (0, express_1.default)();
// === Trust Proxy (for rate limiting and IP detection) ===
if (environment_1.config.security.trustedProxies) {
    app.set('trust proxy', environment_1.config.security.trustedProxies);
}
// === Security Middleware ===
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false,
}));
// === CORS Configuration ===
app.use((0, cors_1.default)({
    origin: environment_1.config.cors.origin,
    credentials: environment_1.config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));
// === Body Parsing ===
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// === Request Context Middleware ===
app.use(auth_1.requestIdMiddleware);
// === Request Logging ===
app.use((req, res, next) => {
    (0, logger_1.logRequest)({
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.userId,
    }, 'Incoming request', {
        query: req.query,
        bodySize: JSON.stringify(req.body).length,
    });
    next();
});
// === Response Time Logging ===
app.use((req, res, next) => {
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        (0, logger_1.logRequest)({
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.userId,
        }, 'Request completed', {
            statusCode: res.statusCode,
            duration,
            responseSize: res.get('Content-Length') || 0,
        });
    });
    next();
});
// === Health Check Routes (No Auth Required) ===
app.use('/api/health', (0, health_1.createHealthRoutes)());
// === Public Routes ===
app.get('/', (req, res) => {
    res.json({
        service: 'Visual Coding Agent',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            processVisualEdit: 'POST /api/process-visual-edit',
            analyzeRepository: 'POST /api/analyze-repository',
            batchProcess: 'POST /api/batch-process',
            createPullRequest: 'POST /api/create-pull-request',
        },
        documentation: 'https://docs.visualcodingagent.com',
    });
});
// === API Routes (Auth Required) ===
app.use('/api', auth_1.authenticateApiKey, auth_1.rateLimitByApiKey, auth_1.validateBatchSize, (0, api_1.createApiRoutes)());
// === Error Handling ===
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// === Server Startup ===
async function startServer() {
    try {
        // Initialize services
        logger_1.logger.info('🚀 Starting Visual Coding Agent server...');
        // Connect to Redis
        logger_1.logger.info('📦 Connecting to Redis...');
        await cache_1.cacheService.connect();
        logger_1.logger.info('✅ Redis connected successfully');
        // Start HTTP server
        const server = app.listen(environment_1.config.port, () => {
            logger_1.logger.info(`🌐 Server running on port ${environment_1.config.port}`, {
                environment: environment_1.config.nodeEnv,
                port: environment_1.config.port,
                cors: environment_1.config.cors.origin,
                rateLimits: environment_1.config.rateLimits,
            });
        });
        // Graceful shutdown handling
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`📡 Received ${signal}. Starting graceful shutdown...`);
            // Stop accepting new requests
            server.close(async () => {
                logger_1.logger.info('🔌 HTTP server closed');
                try {
                    // Close Redis connection
                    await cache_1.cacheService.disconnect();
                    logger_1.logger.info('📦 Redis disconnected');
                    logger_1.logger.info('✅ Graceful shutdown completed');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.logger.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger_1.logger.error('⚠️  Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        // Register signal handlers
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('💥 Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// === Development Hot Reload ===
if (environment_1.config.isDevelopment) {
    app.use((req, res, next) => {
        // Add development headers
        res.setHeader('X-Development-Mode', 'true');
        res.setHeader('X-Node-Env', environment_1.config.nodeEnv);
        next();
    });
}
// === Production Optimizations ===
if (environment_1.config.isProduction) {
    // Compress responses
    const compression = require('compression');
    app.use(compression());
    // Security headers
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    });
}
// Start the server
if (require.main === module) {
    startServer().catch((error) => {
        logger_1.logger.error('💥 Server startup failed:', error);
        process.exit(1);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map