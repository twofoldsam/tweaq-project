export declare const config: {
    readonly port: number;
    readonly nodeEnv: "development" | "production" | "test";
    readonly isDevelopment: boolean;
    readonly isProduction: boolean;
    readonly claudeApiKey: string;
    readonly visualAgentApiKey: string;
    readonly github: {
        readonly appId: string | undefined;
        readonly privateKey: string | undefined;
        readonly webhookSecret: string | undefined;
        readonly hasAppConfig: boolean;
    };
    readonly redis: {
        readonly url: string;
        readonly keyPrefix: string;
        readonly defaultTTL: number;
    };
    readonly database: {
        readonly url: string;
    };
    readonly rateLimits: {
        readonly windowMs: number;
        readonly maxRequests: number;
        readonly maxBatchSize: number;
    };
    readonly claude: {
        readonly model: string;
        readonly maxTokens: number;
        readonly timeout: number;
    };
    readonly cors: {
        readonly origin: string[];
        readonly credentials: true;
    };
    readonly logging: {
        readonly level: "error" | "info" | "warn" | "debug";
    };
    readonly metrics: {
        readonly enabled: boolean;
        readonly retentionDays: number;
    };
    readonly security: {
        readonly requireHttps: boolean;
        readonly trustedProxies: false | 1;
    };
};
export default config;
//# sourceMappingURL=environment.d.ts.map