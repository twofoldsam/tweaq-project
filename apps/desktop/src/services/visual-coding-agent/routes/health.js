"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthRoutes = createHealthRoutes;
const express_1 = require("express");
const cache_1 = require("../services/cache");
const github_1 = require("../services/github");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
function createHealthRoutes() {
    const router = (0, express_1.Router)();
    // === Basic Health Check ===
    router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const startTime = Date.now();
        try {
            // Quick health check - just verify core services are responsive
            const [cacheHealth, githubHealth] = await Promise.allSettled([
                cache_1.cacheService.healthCheck(),
                github_1.githubService.healthCheck(),
            ]);
            const responseTime = Date.now() - startTime;
            const isHealthy = cacheHealth.status === 'fulfilled' && cacheHealth.value.healthy &&
                githubHealth.status === 'fulfilled' && githubHealth.value.healthy;
            res.status(isHealthy ? 200 : 503).json({
                status: isHealthy ? 'healthy' : 'degraded',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                responseTime,
                services: {
                    cache: cacheHealth.status === 'fulfilled' ? cacheHealth.value.healthy : false,
                    github: githubHealth.status === 'fulfilled' ? githubHealth.value.healthy : false,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Health check error:', error);
            res.status(503).json({
                status: 'unhealthy',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime,
                error: 'Health check failed',
            });
        }
    }));
    // === Detailed Health Check ===
    router.get('/detailed', (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const startTime = Date.now();
        const uptime = process.uptime();
        try {
            // Perform detailed health checks
            const [cacheResult, githubResult] = await Promise.allSettled([
                performCacheHealthCheck(),
                performGitHubHealthCheck(),
                // Add Claude health check when we have the service
            ]);
            const cacheHealth = cacheResult.status === 'fulfilled' ? cacheResult.value : {
                status: 'unhealthy',
                responseTime: 0,
                error: cacheResult.reason?.message || 'Cache health check failed',
            };
            const githubHealth = githubResult.status === 'fulfilled' ? githubResult.value : {
                status: 'unhealthy',
                responseTime: 0,
                error: githubResult.reason?.message || 'GitHub health check failed',
            };
            // Get cache stats
            const cacheStats = await cache_1.cacheService.getStats();
            // Determine overall status
            const services = {
                claude: { status: 'healthy', responseTime: 100 }, // Placeholder
                redis: {
                    ...cacheHealth,
                    connected: cacheStats.connected,
                    memory: cacheStats.memory,
                    hitRate: 0.85, // Placeholder - implement actual hit rate tracking
                },
                database: { status: 'healthy', connected: true, activeConnections: 5 }, // Placeholder
                github: {
                    ...githubHealth,
                    rateLimit: {
                        remaining: 4500, // Placeholder - get actual rate limit
                        resetAt: new Date(Date.now() + 3600000).toISOString(),
                    },
                },
            };
            const overallStatus = determineOverallStatus(services);
            const response = {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                uptime: Math.floor(uptime),
                services,
                metrics: {
                    requestsLastHour: 0, // Implement actual metrics
                    averageResponseTime: Date.now() - startTime,
                    errorRate: 0.02,
                    cacheHitRate: 0.85,
                },
            };
            const statusCode = overallStatus === 'healthy' ? 200 :
                overallStatus === 'degraded' ? 200 : 503;
            res.status(statusCode).json(response);
        }
        catch (error) {
            logger_1.logger.error('Detailed health check error:', error);
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                uptime: Math.floor(uptime),
                error: 'Detailed health check failed',
            });
        }
    }));
    // === Readiness Probe ===
    router.get('/ready', (0, errorHandler_1.asyncHandler)(async (req, res) => {
        try {
            // Check if all critical services are ready
            const cacheReady = cache_1.cacheService.isConnected();
            if (!cacheReady) {
                return res.status(503).json({
                    ready: false,
                    reason: 'Cache not connected',
                    timestamp: new Date().toISOString(),
                });
            }
            res.json({
                ready: true,
                timestamp: new Date().toISOString(),
                services: {
                    cache: cacheReady,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Readiness check error:', error);
            res.status(503).json({
                ready: false,
                reason: 'Readiness check failed',
                timestamp: new Date().toISOString(),
            });
        }
    }));
    // === Liveness Probe ===
    router.get('/live', (0, errorHandler_1.asyncHandler)(async (req, res) => {
        // Simple liveness check - just verify the service is running
        res.json({
            alive: true,
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            },
        });
    }));
    return router;
}
// === Helper Functions ===
async function performCacheHealthCheck() {
    const result = await cache_1.cacheService.healthCheck();
    return {
        status: result.healthy ? 'healthy' : 'unhealthy',
        responseTime: result.responseTime,
        lastError: result.error || null,
        connected: result.healthy,
    };
}
async function performGitHubHealthCheck() {
    const result = await github_1.githubService.healthCheck();
    return {
        status: result.healthy ? 'healthy' : 'unhealthy',
        responseTime: result.responseTime,
        lastError: result.error || null,
    };
}
function determineOverallStatus(services) {
    const statuses = Object.values(services).map((service) => service.status);
    if (statuses.every(status => status === 'healthy')) {
        return 'healthy';
    }
    if (statuses.some(status => status === 'unhealthy')) {
        // If critical services are unhealthy, mark as unhealthy
        if (services.claude.status === 'unhealthy' || services.redis.status === 'unhealthy') {
            return 'unhealthy';
        }
        return 'degraded';
    }
    return 'degraded';
}
//# sourceMappingURL=health.js.map