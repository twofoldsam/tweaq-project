"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
exports.createCacheKey = createCacheKey;
exports.hashRequest = hashRequest;
const ioredis_1 = __importDefault(require("ioredis"));
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
class CacheService {
    redis;
    connected = false;
    constructor() {
        this.redis = new ioredis_1.default(environment_1.config.redis.url, {
            keyPrefix: environment_1.config.redis.keyPrefix,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.redis.on('connect', () => {
            this.connected = true;
            logger_1.logger.info('✅ Redis connected');
        });
        this.redis.on('error', (error) => {
            this.connected = false;
            logger_1.logger.error('❌ Redis error:', error);
        });
        this.redis.on('close', () => {
            this.connected = false;
            logger_1.logger.warn('⚠️  Redis connection closed');
        });
    }
    async connect() {
        try {
            await this.redis.connect();
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    async disconnect() {
        await this.redis.disconnect();
    }
    isConnected() {
        return this.connected;
    }
    // === Repository Analysis Cache ===
    async getRepositoryAnalysis(owner, repo, commitSha) {
        const key = this.buildRepositoryKey(owner, repo, commitSha);
        return this.get(key);
    }
    async setRepositoryAnalysis(owner, repo, analysis, commitSha, ttl) {
        const key = this.buildRepositoryKey(owner, repo, commitSha);
        await this.set(key, analysis, ttl || 24 * 60 * 60); // 24 hours default
    }
    async invalidateRepositoryAnalysis(owner, repo) {
        const pattern = `repo:${owner}/${repo}*`;
        await this.deleteByPattern(pattern);
    }
    // === File Content Cache ===
    async getFileContent(owner, repo, filePath, commitSha) {
        const key = this.buildFileKey(owner, repo, filePath, commitSha);
        return this.get(key);
    }
    async setFileContent(owner, repo, filePath, content, commitSha, ttl) {
        const key = this.buildFileKey(owner, repo, filePath, commitSha);
        await this.set(key, content, ttl || 60 * 60); // 1 hour default
    }
    async invalidateFileContent(owner, repo, filePath) {
        const pattern = `file:${owner}/${repo}:${filePath}*`;
        await this.deleteByPattern(pattern);
    }
    // === Claude Response Cache ===
    async getClaudeResponse(requestHash) {
        const key = `claude:${requestHash}`;
        return this.get(key);
    }
    async setClaudeResponse(requestHash, response, ttl) {
        const key = `claude:${requestHash}`;
        await this.set(key, response, ttl || 5 * 60); // 5 minutes default
    }
    // === Generic Cache Operations ===
    async get(key) {
        try {
            if (!this.connected) {
                logger_1.logger.warn('Cache not connected, skipping get operation');
                return null;
            }
            const data = await this.redis.get(key);
            if (!data)
                return null;
            const entry = JSON.parse(data);
            // Check if expired
            if (new Date(entry.expiresAt) < new Date()) {
                await this.redis.del(key);
                return null;
            }
            return entry.data;
        }
        catch (error) {
            logger_1.logger.error('Cache get error:', error);
            return null; // Graceful degradation
        }
    }
    async set(key, data, ttlSeconds) {
        try {
            if (!this.connected) {
                logger_1.logger.warn('Cache not connected, skipping set operation');
                return;
            }
            const entry = {
                data,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
                version: '1.0',
            };
            await this.redis.setex(key, ttlSeconds, JSON.stringify(entry));
        }
        catch (error) {
            logger_1.logger.error('Cache set error:', error);
            // Don't throw - graceful degradation
        }
    }
    async deleteByPattern(pattern) {
        try {
            if (!this.connected) {
                logger_1.logger.warn('Cache not connected, skipping delete operation');
                return;
            }
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                logger_1.logger.info(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Cache delete by pattern error:', error);
        }
    }
    // === Batch Operations ===
    async invalidateRepositoryFiles(owner, repo, filePaths) {
        const promises = filePaths.map(filePath => this.invalidateFileContent(owner, repo, filePath));
        await Promise.all(promises);
    }
    // === Cache Statistics ===
    async getStats() {
        try {
            if (!this.connected) {
                return { connected: false, keyCount: 0, memory: '0B' };
            }
            const info = await this.redis.info('memory');
            const keyCount = await this.redis.dbsize();
            // Parse memory usage from info string
            const memoryMatch = info.match(/used_memory_human:(.+)/);
            const memory = memoryMatch ? memoryMatch[1].trim() : '0B';
            return {
                connected: true,
                keyCount,
                memory,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting cache stats:', error);
            return { connected: false, keyCount: 0, memory: '0B' };
        }
    }
    // === Key Builders ===
    buildRepositoryKey(owner, repo, commitSha) {
        const base = `repo:${owner}/${repo}`;
        return commitSha ? `${base}@${commitSha}` : base;
    }
    buildFileKey(owner, repo, filePath, commitSha) {
        const base = `file:${owner}/${repo}:${filePath}`;
        return commitSha ? `${base}@${commitSha}` : base;
    }
    // === Health Check ===
    async healthCheck() {
        const startTime = Date.now();
        try {
            if (!this.connected) {
                return { healthy: false, responseTime: 0, error: 'Not connected' };
            }
            await this.redis.ping();
            const responseTime = Date.now() - startTime;
            return { healthy: true, responseTime };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                healthy: false,
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
exports.CacheService = CacheService;
// Singleton instance
exports.cacheService = new CacheService();
// === Utility Functions ===
function createCacheKey(type, identifier, version) {
    const base = `${type}:${identifier}`;
    return version ? `${base}@${version}` : base;
}
function hashRequest(request) {
    // Simple hash function for request caching
    const str = JSON.stringify(request, Object.keys(request).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}
//# sourceMappingURL=cache.js.map