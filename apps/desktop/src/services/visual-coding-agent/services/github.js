"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubService = exports.GitHubService = void 0;
const rest_1 = require("@octokit/rest");
const auth_app_1 = require("@octokit/auth-app");
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
const cache_1 = require("./cache");
class GitHubService {
    appOctokit;
    installationCache = new Map();
    constructor() {
        // Initialize GitHub App if configured
        if (environment_1.config.github.hasAppConfig) {
            this.appOctokit = new rest_1.Octokit({
                authStrategy: auth_app_1.createAppAuth,
                auth: {
                    appId: environment_1.config.github.appId,
                    privateKey: environment_1.config.github.privateKey,
                },
            });
        }
    }
    // === Authentication ===
    async getOctokitForRepository(repository) {
        // If user provided a token, use it directly
        if (repository.githubToken) {
            return new rest_1.Octokit({
                auth: repository.githubToken,
            });
        }
        // Use GitHub App authentication
        if (!this.appOctokit) {
            throw new Error('GitHub App not configured and no token provided');
        }
        const cacheKey = `${repository.owner}/${repository.repo}`;
        const cached = this.installationCache.get(cacheKey);
        // Return cached installation if still valid
        if (cached && cached.expiresAt > Date.now()) {
            return cached.octokit;
        }
        try {
            // Get installation for repository
            const { data: installation } = await this.appOctokit.apps.getRepoInstallation({
                owner: repository.owner,
                repo: repository.repo,
            });
            // Create installation-specific Octokit
            const installationOctokit = new rest_1.Octokit({
                authStrategy: auth_app_1.createAppAuth,
                auth: {
                    appId: environment_1.config.github.appId,
                    privateKey: environment_1.config.github.privateKey,
                    installationId: installation.id,
                },
            });
            // Cache for 50 minutes (tokens last 1 hour)
            this.installationCache.set(cacheKey, {
                octokit: installationOctokit,
                expiresAt: Date.now() + 50 * 60 * 1000,
            });
            return installationOctokit;
        }
        catch (error) {
            logger_1.logger.error('Failed to get GitHub installation:', error);
            throw new Error('Repository not accessible or GitHub App not installed');
        }
    }
    // === Repository Operations ===
    async getRepository(repository) {
        const startTime = Date.now();
        const requestId = `repo-${Date.now()}`;
        try {
            const octokit = await this.getOctokitForRepository(repository);
            const { data } = await octokit.repos.get({
                owner: repository.owner,
                repo: repository.repo,
            });
            (0, logger_1.logGitHubRequest)({
                requestId,
                operation: 'getRepository',
                repository: `${repository.owner}/${repository.repo}`,
                duration: Date.now() - startTime,
                success: true,
            });
            return data;
        }
        catch (error) {
            (0, logger_1.logGitHubRequest)({
                requestId,
                operation: 'getRepository',
                repository: `${repository.owner}/${repository.repo}`,
                duration: Date.now() - startTime,
                success: false,
            });
            throw error;
        }
    }
    async getLatestCommit(repository) {
        const startTime = Date.now();
        const requestId = `commit-${Date.now()}`;
        try {
            const octokit = await this.getOctokitForRepository(repository);
            const { data } = await octokit.repos.getCommit({
                owner: repository.owner,
                repo: repository.repo,
                ref: repository.branch,
            });
            (0, logger_1.logGitHubRequest)({
                requestId,
                operation: 'getLatestCommit',
                repository: `${repository.owner}/${repository.repo}`,
                duration: Date.now() - startTime,
                success: true,
            });
            return {
                sha: data.sha,
                message: data.commit.message,
                author: {
                    name: data.commit.author?.name || '',
                    email: data.commit.author?.email || '',
                    date: data.commit.author?.date || '',
                },
                added: data.files?.filter(f => f.status === 'added').map(f => f.filename) || [],
                modified: data.files?.filter(f => f.status === 'modified').map(f => f.filename) || [],
                removed: data.files?.filter(f => f.status === 'removed').map(f => f.filename) || [],
            };
        }
        catch (error) {
            (0, logger_1.logGitHubRequest)({
                requestId,
                operation: 'getLatestCommit',
                repository: `${repository.owner}/${repository.repo}`,
                duration: Date.now() - startTime,
                success: false,
            });
            throw error;
        }
    }
    // === File Operations ===
    async getFileContent(repository, filePath, ref) {
        const startTime = Date.now();
        const requestId = `file-${Date.now()}`;
        const commitRef = ref || repository.branch;
        try {
            // Check cache first
            const cachedContent = await cache_1.cacheService.getFileContent(repository.owner, repository.repo, filePath, ref);
            if (cachedContent) {
                return {
                    path: filePath,
                    content: cachedContent,
                    sha: ref || 'cached',
                    size: cachedContent.length,
                };
            }
            const octokit = await this.getOctokitForRepository(repository);
            const { data } = await octokit.repos.getContent({
                owner: repository.owner,
                repo: repository.repo,
                path: filePath,
                ref: commitRef,
            });
            if (Array.isArray(data) || data.type !== 'file') {
                throw new Error(`Path ${filePath} is not a file`);
            }
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            // Cache the content
            await cache_1.cacheService.setFileContent(repository.owner, repository.repo, filePath, content, ref);
            (0, logger_1.logGitHubRequest)({
                requestId,
                operation: 'getFileContent',
                repository: `${repository.owner}/${repository.repo}`,
                duration: Date.now() - startTime,
                success: true,
            });
            return {
                path: filePath,
                content,
                sha: data.sha,
                size: data.size,
            };
        }
        catch (error) {
            (0, logger_1.logGitHubRequest)({
                requestId,
                operation: 'getFileContent',
                repository: `${repository.owner}/${repository.repo}`,
                duration: Date.now() - startTime,
                success: false,
            });
            throw error;
        }
    }
    async getDirectoryContents(repository, path = '', ref) {
        const startTime = Date.now();
        const requestId = `dir-${Date.now()}`;
        const commitRef = ref || repository.branch;
        try {
            const octokit = await this.getOctokitForRepository(repository);
            const { data } = await octokit.repos.getContent({
                owner: repository.owner,
                repo: repository.repo,
                path,
                ref: commitRef,
            });
            if (!Array.isArray(data)) {
                throw new Error(`Path ${path} is not a directory`);
            }
            (0, logger_1.logGitHubRequest)({
                requestId,
                operation: 'getDirectoryContents',
                repository: `${repository.owner}/${repository.repo}`,
                duration: Date.now() - startTime,
                success: true,
            });
            return data.map(item => ({
                name: item.name,
                path: item.path,
                type: item.type === 'dir' ? 'dir' : 'file',
                size: item.size,
            }));
        }
        catch (error) {
            (0, logger_1.logGitHubRequest)({
                requestId,
                operation: 'getDirectoryContents',
                repository: `${repository.owner}/${repository.repo}`,
                duration: Date.now() - startTime,
                success: false,
            });
            throw error;
        }
    }
    // === Repository Analysis ===
    async findFiles(repository, extensions, maxFiles = 100) {
        const files = [];
        const visited = new Set();
        const searchDirectory = async (path = '') => {
            if (files.length >= maxFiles)
                return;
            try {
                const contents = await this.getDirectoryContents(repository, path);
                for (const item of contents) {
                    if (files.length >= maxFiles)
                        break;
                    if (visited.has(item.path))
                        continue;
                    visited.add(item.path);
                    if (item.type === 'file') {
                        const ext = item.name.split('.').pop()?.toLowerCase();
                        if (ext && extensions.includes(`.${ext}`)) {
                            files.push(item.path);
                        }
                    }
                    else if (item.type === 'dir') {
                        // Skip common directories that don't contain source code
                        const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
                        if (!skipDirs.includes(item.name)) {
                            await searchDirectory(item.path);
                        }
                    }
                }
            }
            catch (error) {
                logger_1.logger.warn(`Failed to search directory ${path}:`, error);
            }
        };
        await searchDirectory();
        return files;
    }
    async getPackageJson(repository) {
        try {
            const file = await this.getFileContent(repository, 'package.json');
            return JSON.parse(file.content);
        }
        catch (error) {
            return null;
        }
    }
    // === Rate Limiting ===
    async getRateLimit(repository) {
        try {
            const octokit = await this.getOctokitForRepository(repository);
            const { data } = await octokit.rateLimit.get();
            return {
                remaining: data.rate.remaining,
                resetAt: new Date(data.rate.reset * 1000).toISOString(),
                limit: data.rate.limit,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get rate limit:', error);
            return {
                remaining: 0,
                resetAt: new Date().toISOString(),
                limit: 5000,
            };
        }
    }
    // === Pull Request Operations ===
    async createPullRequest(repository, changes, pullRequestConfig, options = {
        createBranchFromLatest: true,
        deleteSourceBranch: true,
    }) {
        const startTime = Date.now();
        const requestId = `pr-${Date.now()}`;
        try {
            const octokit = await this.getOctokitForRepository(repository);
            // Generate branch name if not provided
            const branchName = pullRequestConfig.branchName ||
                `visual-agent-changes-${Date.now()}`;
            logger_1.logger.info('Creating pull request', {
                requestId,
                repository: `${repository.owner}/${repository.repo}`,
                branchName,
                changesCount: changes.length,
            });
            // Step 1: Get the latest commit SHA from base branch
            const { data: baseRef } = await octokit.git.getRef({
                owner: repository.owner,
                repo: repository.repo,
                ref: `heads/${pullRequestConfig.baseBranch}`,
            });
            const baseCommitSha = baseRef.object.sha;
            // Step 2: Create a new branch
            await octokit.git.createRef({
                owner: repository.owner,
                repo: repository.repo,
                ref: `refs/heads/${branchName}`,
                sha: baseCommitSha,
            });
            logger_1.logger.info('Created branch', { requestId, branchName, baseSha: baseCommitSha });
            // Step 3: Apply changes to files
            let filesModified = 0;
            let totalLinesAdded = 0;
            let totalLinesRemoved = 0;
            const fileChanges = [];
            for (const change of changes) {
                try {
                    // Get current file content and SHA
                    let currentContent = '';
                    let currentSha;
                    try {
                        const fileData = await this.getFileContent(repository, change.filePath, branchName);
                        currentContent = fileData.content;
                        currentSha = fileData.sha;
                    }
                    catch (error) {
                        // File doesn't exist, will create new file
                        logger_1.logger.info('File not found, will create new file', {
                            requestId,
                            filePath: change.filePath
                        });
                    }
                    // Apply the change
                    let newContent;
                    if (change.oldContent && currentContent.includes(change.oldContent)) {
                        // Replace specific content
                        newContent = currentContent.replace(change.oldContent, change.newContent);
                    }
                    else {
                        // If oldContent not found or not specified, append/replace entire content
                        newContent = change.newContent;
                    }
                    // Calculate line changes
                    const oldLines = currentContent.split('\n').length;
                    const newLines = newContent.split('\n').length;
                    const linesAdded = Math.max(0, newLines - oldLines);
                    const linesRemoved = Math.max(0, oldLines - newLines);
                    totalLinesAdded += linesAdded;
                    totalLinesRemoved += linesRemoved;
                    fileChanges.push({
                        path: change.filePath,
                        content: newContent,
                        sha: currentSha,
                    });
                    filesModified++;
                }
                catch (error) {
                    logger_1.logger.error('Failed to process file change', {
                        requestId,
                        filePath: change.filePath,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                    throw new Error(`Failed to process changes for ${change.filePath}: ${error}`);
                }
            }
            // Step 4: Create tree with all changes
            const tree = fileChanges.map(file => ({
                path: file.path,
                mode: '100644',
                type: 'blob',
                content: file.content,
            }));
            const { data: newTree } = await octokit.git.createTree({
                owner: repository.owner,
                repo: repository.repo,
                base_tree: baseCommitSha,
                tree,
            });
            // Step 5: Create commit
            const commitMessage = options.commitMessage ||
                `Visual Agent: ${pullRequestConfig.title}`;
            const { data: newCommit } = await octokit.git.createCommit({
                owner: repository.owner,
                repo: repository.repo,
                message: commitMessage,
                tree: newTree.sha,
                parents: [baseCommitSha],
            });
            // Step 6: Update branch reference
            await octokit.git.updateRef({
                owner: repository.owner,
                repo: repository.repo,
                ref: `heads/${branchName}`,
                sha: newCommit.sha,
            });
            logger_1.logger.info('Created commit', {
                requestId,
                commitSha: newCommit.sha,
                filesModified,
            });
            // Step 7: Create pull request
            const { data: pr } = await octokit.pulls.create({
                owner: repository.owner,
                repo: repository.repo,
                title: pullRequestConfig.title,
                head: branchName,
                base: pullRequestConfig.baseBranch,
                body: pullRequestConfig.description || '',
                draft: pullRequestConfig.draft,
            });
            // Step 8: Enable auto-merge if requested
            if (pullRequestConfig.autoMerge && !pullRequestConfig.draft) {
                try {
                    await octokit.pulls.merge({
                        owner: repository.owner,
                        repo: repository.repo,
                        pull_number: pr.number,
                        merge_method: 'squash',
                    });
                    logger_1.logger.info('Auto-merged pull request', { requestId, prNumber: pr.number });
                }
                catch (error) {
                    logger_1.logger.warn('Failed to auto-merge PR', {
                        requestId,
                        prNumber: pr.number,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }
            const pullRequestInfo = {
                number: pr.number,
                title: pr.title,
                url: pr.url,
                htmlUrl: pr.html_url,
                state: pr.state,
                branchName,
                baseBranch: pullRequestConfig.baseBranch,
                draft: pr.draft || false,
                mergeable: pr.mergeable,
                commits: 1, // We created one commit
                additions: totalLinesAdded,
                deletions: totalLinesRemoved,
                changedFiles: filesModified,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
            };
            (0, logger_1.logGitHubRequest)({
                requestId,
                operation: 'createPullRequest',
                repository: `${repository.owner}/${repository.repo}`,
                duration: Date.now() - startTime,
                success: true,
            }, {
                prNumber: pr.number,
                filesModified,
                branchName,
            });
            return {
                pullRequest: pullRequestInfo,
                changes: {
                    filesModified,
                    linesAdded: totalLinesAdded,
                    linesRemoved: totalLinesRemoved,
                    commitSha: newCommit.sha,
                },
            };
        }
        catch (error) {
            (0, logger_1.logGitHubRequest)({
                requestId,
                operation: 'createPullRequest',
                repository: `${repository.owner}/${repository.repo}`,
                duration: Date.now() - startTime,
                success: false,
            });
            logger_1.logger.error('Failed to create pull request', {
                requestId,
                error: error instanceof Error ? error.message : 'Unknown error',
                repository: `${repository.owner}/${repository.repo}`,
            });
            throw error;
        }
    }
    async getPullRequest(repository, pullNumber) {
        const startTime = Date.now();
        const requestId = `pr-get-${Date.now()}`;
        try {
            const octokit = await this.getOctokitForRepository(repository);
            const { data: pr } = await octokit.pulls.get({
                owner: repository.owner,
                repo: repository.repo,
                pull_number: pullNumber,
            });
            (0, logger_1.logGitHubRequest)({
                requestId,
                operation: 'getPullRequest',
                repository: `${repository.owner}/${repository.repo}`,
                duration: Date.now() - startTime,
                success: true,
            });
            return {
                number: pr.number,
                title: pr.title,
                url: pr.url,
                htmlUrl: pr.html_url,
                state: pr.state,
                branchName: pr.head.ref,
                baseBranch: pr.base.ref,
                draft: pr.draft || false,
                mergeable: pr.mergeable,
                commits: pr.commits,
                additions: pr.additions || 0,
                deletions: pr.deletions || 0,
                changedFiles: pr.changed_files || 0,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
            };
        }
        catch (error) {
            (0, logger_1.logGitHubRequest)({
                requestId,
                operation: 'getPullRequest',
                repository: `${repository.owner}/${repository.repo}`,
                duration: Date.now() - startTime,
                success: false,
            });
            throw error;
        }
    }
    // === Health Check ===
    async healthCheck() {
        const startTime = Date.now();
        try {
            const octokit = this.appOctokit || new rest_1.Octokit();
            await octokit.meta.get();
            return {
                healthy: true,
                responseTime: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                healthy: false,
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
exports.GitHubService = GitHubService;
exports.githubService = new GitHubService();
//# sourceMappingURL=github.js.map