import winston from 'winston';
export declare const logger: winston.Logger;
export interface RequestLogContext {
    requestId: string;
    method: string;
    path: string;
    userAgent?: string;
    ip?: string;
    userId?: string;
}
export declare function logRequest(context: RequestLogContext, message: string, meta?: any): void;
export declare function logRequestError(context: RequestLogContext, error: Error, meta?: any): void;
export interface PerformanceLogContext {
    requestId: string;
    operation: string;
    duration: number;
    success: boolean;
}
export declare function logPerformance(context: PerformanceLogContext, meta?: any): void;
export interface ClaudeLogContext {
    requestId: string;
    model: string;
    tokensUsed: number;
    duration: number;
    success: boolean;
}
export declare function logClaudeRequest(context: ClaudeLogContext, meta?: any): void;
export interface GitHubLogContext {
    requestId: string;
    operation: string;
    repository?: string;
    rateLimitRemaining?: number;
    duration: number;
    success: boolean;
}
export declare function logGitHubRequest(context: GitHubLogContext, meta?: any): void;
export interface CacheLogContext {
    requestId: string;
    operation: 'get' | 'set' | 'delete' | 'invalidate';
    key: string;
    hit?: boolean;
    duration: number;
}
export declare function logCacheOperation(context: CacheLogContext, meta?: any): void;
export interface SecurityLogContext {
    requestId: string;
    event: 'auth_failure' | 'rate_limit' | 'invalid_request' | 'suspicious_activity';
    ip?: string;
    userAgent?: string;
    details?: any;
}
export declare function logSecurityEvent(context: SecurityLogContext, message: string): void;
export interface MetricsLogContext {
    requestId: string;
    repository: string;
    description: string;
    framework: string;
    stylingSystem: string;
    processingTime: number;
    claudeTokensUsed: number;
    cacheHit: boolean;
    success: boolean;
    changesGenerated: number;
    confidence: number;
}
export declare function logMetrics(context: MetricsLogContext): void;
export declare function logError(error: Error, context?: any): void;
export declare function logUnhandledError(error: Error, type: 'uncaughtException' | 'unhandledRejection'): void;
export default logger;
//# sourceMappingURL=logger.d.ts.map