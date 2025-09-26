import { Repository, CodeChange, PullRequestInfo } from '../api/types';
export interface GitHubFile {
    path: string;
    content: string;
    sha: string;
    size: number;
}
export interface GitHubCommit {
    sha: string;
    message: string;
    author: {
        name: string;
        email: string;
        date: string;
    };
    added: string[];
    modified: string[];
    removed: string[];
}
export declare class GitHubService {
    private appOctokit?;
    private installationCache;
    constructor();
    private getOctokitForRepository;
    getRepository(repository: Repository): Promise<any>;
    getLatestCommit(repository: Repository): Promise<GitHubCommit>;
    getFileContent(repository: Repository, filePath: string, ref?: string): Promise<GitHubFile>;
    getDirectoryContents(repository: Repository, path?: string, ref?: string): Promise<Array<{
        name: string;
        path: string;
        type: 'file' | 'dir';
        size?: number;
    }>>;
    findFiles(repository: Repository, extensions: string[], maxFiles?: number): Promise<string[]>;
    getPackageJson(repository: Repository): Promise<any | null>;
    getRateLimit(repository: Repository): Promise<{
        remaining: number;
        resetAt: string;
        limit: number;
    }>;
    createPullRequest(repository: Repository, changes: CodeChange[], pullRequestConfig: {
        title: string;
        description?: string;
        branchName?: string;
        baseBranch: string;
        draft: boolean;
        autoMerge: boolean;
    }, options?: {
        commitMessage?: string;
        createBranchFromLatest: boolean;
        deleteSourceBranch: boolean;
    }): Promise<{
        pullRequest: PullRequestInfo;
        changes: {
            filesModified: number;
            linesAdded: number;
            linesRemoved: number;
            commitSha: string;
        };
    }>;
    getPullRequest(repository: Repository, pullNumber: number): Promise<PullRequestInfo>;
    healthCheck(): Promise<{
        healthy: boolean;
        responseTime: number;
        error?: string;
    }>;
}
export declare const githubService: GitHubService;
//# sourceMappingURL=github.d.ts.map