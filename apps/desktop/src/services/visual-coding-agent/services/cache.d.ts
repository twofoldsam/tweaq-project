import { CacheKey } from '../api/types';
export declare class CacheService {
    private redis;
    private connected;
    constructor();
    private setupEventHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    getRepositoryAnalysis(owner: string, repo: string, commitSha?: string): Promise<any | null>;
    setRepositoryAnalysis(owner: string, repo: string, analysis: any, commitSha?: string, ttl?: number): Promise<void>;
    invalidateRepositoryAnalysis(owner: string, repo: string): Promise<void>;
    getFileContent(owner: string, repo: string, filePath: string, commitSha?: string): Promise<string | null>;
    setFileContent(owner: string, repo: string, filePath: string, content: string, commitSha?: string, ttl?: number): Promise<void>;
    invalidateFileContent(owner: string, repo: string, filePath: string): Promise<void>;
    getClaudeResponse(requestHash: string): Promise<any | null>;
    setClaudeResponse(requestHash: string, response: any, ttl?: number): Promise<void>;
    private get;
    private set;
    private deleteByPattern;
    invalidateRepositoryFiles(owner: string, repo: string, filePaths: string[]): Promise<void>;
    getStats(): Promise<{
        connected: boolean;
        keyCount: number;
        memory: string;
        hitRate?: number;
    }>;
    private buildRepositoryKey;
    private buildFileKey;
    healthCheck(): Promise<{
        healthy: boolean;
        responseTime: number;
        error?: string;
    }>;
}
export declare const cacheService: CacheService;
export declare function createCacheKey(type: CacheKey['type'], identifier: string, version?: string): string;
export declare function hashRequest(request: any): string;
//# sourceMappingURL=cache.d.ts.map