"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Load environment variables
dotenv_1.default.config();
const EnvironmentSchema = zod_1.z.object({
    // Server Configuration
    PORT: zod_1.z.coerce.number().default(3000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    // API Keys
    CLAUDE_API_KEY: zod_1.z.string().min(1, 'Claude API key is required'),
    VISUAL_AGENT_API_KEY: zod_1.z.string().min(1, 'Visual Agent API key is required'),
    // GitHub Integration
    GITHUB_APP_ID: zod_1.z.string().optional(),
    GITHUB_APP_PRIVATE_KEY: zod_1.z.string().optional(),
    GITHUB_WEBHOOK_SECRET: zod_1.z.string().optional(),
    // Redis Configuration
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    REDIS_KEY_PREFIX: zod_1.z.string().default('visual-agent:'),
    REDIS_DEFAULT_TTL: zod_1.z.coerce.number().default(3600), // 1 hour
    // Database Configuration
    DATABASE_URL: zod_1.z.string().default('postgresql://localhost:5432/visual_agent'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(15 * 60 * 1000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.coerce.number().default(100),
    RATE_LIMIT_MAX_BATCH_SIZE: zod_1.z.coerce.number().default(10),
    // Claude API Configuration
    CLAUDE_MODEL: zod_1.z.string().default('claude-3-5-sonnet-20241022'),
    CLAUDE_MAX_TOKENS: zod_1.z.coerce.number().default(4000),
    CLAUDE_TIMEOUT: zod_1.z.coerce.number().default(30000), // 30 seconds
    // CORS Configuration
    ALLOWED_ORIGINS: zod_1.z.string().default('https://tweaq.app'),
    // Logging
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    // Monitoring
    ENABLE_METRICS: zod_1.z.coerce.boolean().default(true),
    METRICS_RETENTION_DAYS: zod_1.z.coerce.number().default(30),
});
function validateEnvironment() {
    try {
        return EnvironmentSchema.parse(process.env);
    }
    catch (error) {
        console.error('❌ Invalid environment configuration:');
        if (error instanceof zod_1.z.ZodError) {
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
        }
        process.exit(1);
    }
}
const env = validateEnvironment();
exports.config = {
    // Server
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    // API Keys
    claudeApiKey: env.CLAUDE_API_KEY,
    visualAgentApiKey: env.VISUAL_AGENT_API_KEY,
    // GitHub Integration
    github: {
        appId: env.GITHUB_APP_ID,
        privateKey: env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle escaped newlines
        webhookSecret: env.GITHUB_WEBHOOK_SECRET,
        hasAppConfig: Boolean(env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY),
    },
    // Redis Cache
    redis: {
        url: env.REDIS_URL,
        keyPrefix: env.REDIS_KEY_PREFIX,
        defaultTTL: env.REDIS_DEFAULT_TTL,
        // Parse Redis URL for individual components if needed
        ...(() => {
            try {
                const url = new URL(env.REDIS_URL);
                return {
                    host: url.hostname,
                    port: parseInt(url.port) || 6379,
                    password: url.password || undefined,
                    db: parseInt(url.pathname.slice(1)) || 0,
                };
            }
            catch {
                return {
                    host: 'localhost',
                    port: 6379,
                    db: 0,
                };
            }
        })(),
    },
    // Database
    database: {
        url: env.DATABASE_URL,
    },
    // Rate Limiting
    rateLimits: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
        maxBatchSize: env.RATE_LIMIT_MAX_BATCH_SIZE,
    },
    // Claude API
    claude: {
        model: env.CLAUDE_MODEL,
        maxTokens: env.CLAUDE_MAX_TOKENS,
        timeout: env.CLAUDE_TIMEOUT,
    },
    // CORS
    cors: {
        origin: env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
        credentials: true,
    },
    // Logging
    logging: {
        level: env.LOG_LEVEL,
    },
    // Monitoring
    metrics: {
        enabled: env.ENABLE_METRICS,
        retentionDays: env.METRICS_RETENTION_DAYS,
    },
    // Security
    security: {
        requireHttps: env.NODE_ENV === 'production',
        trustedProxies: env.NODE_ENV === 'production' ? 1 : false, // Trust first proxy in production
    },
};
// Validate critical configuration
if (exports.config.isProduction) {
    const requiredForProduction = [
        exports.config.claudeApiKey,
        exports.config.visualAgentApiKey,
    ];
    const missingRequired = requiredForProduction.filter(Boolean).length !== requiredForProduction.length;
    if (missingRequired) {
        console.error('❌ Missing required configuration for production environment');
        process.exit(1);
    }
    if (!exports.config.github.hasAppConfig) {
        console.warn('⚠️  GitHub App configuration missing - falling back to token-based auth');
    }
}
// Log configuration summary
if (exports.config.isDevelopment) {
    console.log('🔧 Configuration loaded:', {
        nodeEnv: exports.config.nodeEnv,
        port: exports.config.port,
        claudeModel: exports.config.claude.model,
        redisHost: exports.config.redis.host,
        githubAppConfigured: exports.config.github.hasAppConfig,
    });
}
exports.default = exports.config;
//# sourceMappingURL=environment.js.map