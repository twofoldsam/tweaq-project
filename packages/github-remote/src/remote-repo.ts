import { Octokit } from '@octokit/rest';
import { ResponseCache } from './cache.js';
import {
  RepoIdentifier,
  TreeData,
  TreeEntry,
  BlobData,
  FileContent,
  SearchResult,
  CommitData,
  PullRequestData,
  GetRepoTreeOptions,
  ReadBlobOptions,
  ReadFileOptions,
  SearchCodeOptions,
  CreateBranchOptions,
  CreateTreeOptions,
  CreateCommitOptions,
  UpdateRefOptions,
  OpenPROptions,
  CreateTreeFile,
  CacheOptions,
} from './types.js';

export class RemoteRepo {
  private octokit: Octokit;
  private cache: ResponseCache;
  private treeCache = new Map<string, Map<string, string>>(); // ref -> path -> sha

  constructor(auth: string, cacheOptions?: CacheOptions) {
    this.octokit = new Octokit({ auth });
    this.cache = new ResponseCache(cacheOptions);
  }

  /**
   * Get repository tree structure (shallow by default, with caching)
   * Caches path→sha mappings in memory for efficient lookups
   */
  async getRepoTree(options: GetRepoTreeOptions): Promise<TreeData> {
    const { owner, repo, ref = 'main', recursive = false } = options;
    const cacheKey = `${owner}/${repo}/${ref}`;

    try {
      // Check cache first
      const cachedResponse = this.cache.get<TreeData>('GET', `/repos/${owner}/${repo}/git/trees/${ref}`, { recursive });
      if (cachedResponse) {
        this.updateTreeCache(cacheKey, cachedResponse.data);
        return cachedResponse.data;
      }

      // Get conditional headers for ETag support
      const headers = this.cache.getConditionalHeaders('GET', `/repos/${owner}/${repo}/git/trees/${ref}`, { recursive });

      const response = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: ref,
        recursive: recursive ? 'true' : undefined,
        headers,
      });

      // Cache the response
      this.cache.set('GET', `/repos/${owner}/${repo}/git/trees/${ref}`, response.data, response.headers, { recursive });
      
      // Update in-memory path→sha cache
      this.updateTreeCache(cacheKey, response.data as TreeData);

      return response.data as TreeData;
    } catch (error: any) {
      if (error.status === 304) {
        // Not modified - return cached data
        const cachedResponse = this.cache.get<TreeData>('GET', `/repos/${owner}/${repo}/git/trees/${ref}`, { recursive });
        if (cachedResponse) {
          return cachedResponse.data;
        }
      }
      throw error;
    }
  }

  /**
   * Fetch subtree on demand for a specific path
   */
  async getSubtree(options: GetRepoTreeOptions & { path: string }): Promise<TreeData> {
    const { owner, repo, ref = 'main', path } = options;
    
    // First get the tree entry for the path
    const sha = await this.getPathSha({ owner, repo, ref, path });
    if (!sha) {
      throw new Error(`Path ${path} not found in ${owner}/${repo}@${ref}`);
    }

    // Fetch the subtree
    return this.getRepoTree({ owner, repo, ref: sha });
  }

  /**
   * Get SHA for a specific path from cache or by fetching tree
   */
  private async getPathSha(options: { owner: string; repo: string; ref: string; path: string }): Promise<string | null> {
    const { owner, repo, ref, path } = options;
    const cacheKey = `${owner}/${repo}/${ref}`;
    
    // Check in-memory cache first
    const pathCache = this.treeCache.get(cacheKey);
    if (pathCache?.has(path)) {
      return pathCache.get(path) || null;
    }

    // Fetch tree to populate cache
    await this.getRepoTree({ owner, repo, ref });
    
    // Try cache again
    const updatedPathCache = this.treeCache.get(cacheKey);
    return updatedPathCache?.get(path) || null;
  }

  /**
   * Update in-memory tree cache with path→sha mappings
   */
  private updateTreeCache(cacheKey: string, treeData: TreeData): void {
    if (!this.treeCache.has(cacheKey)) {
      this.treeCache.set(cacheKey, new Map());
    }
    
    const pathCache = this.treeCache.get(cacheKey)!;
    treeData.tree.forEach((entry: TreeEntry) => {
      if (entry.path && entry.sha) {
        pathCache.set(entry.path, entry.sha);
      }
    });
  }

  /**
   * Read blob content by SHA
   */
  async readBlob(options: ReadBlobOptions): Promise<BlobData> {
    const { owner, repo, sha } = options;

    try {
      // Check cache first
      const cachedResponse = this.cache.get<BlobData>('GET', `/repos/${owner}/${repo}/git/blobs/${sha}`);
      if (cachedResponse) {
        return cachedResponse.data;
      }

      // Get conditional headers
      const headers = this.cache.getConditionalHeaders('GET', `/repos/${owner}/${repo}/git/blobs/${sha}`);

      const response = await this.octokit.rest.git.getBlob({
        owner,
        repo,
        file_sha: sha,
        headers,
      });

      // Cache the response
      this.cache.set('GET', `/repos/${owner}/${repo}/git/blobs/${sha}`, response.data, response.headers);

      return response.data as BlobData;
    } catch (error: any) {
      if (error.status === 304) {
        const cachedResponse = this.cache.get<BlobData>('GET', `/repos/${owner}/${repo}/git/blobs/${sha}`);
        if (cachedResponse) {
          return cachedResponse.data;
        }
      }
      throw error;
    }
  }

  /**
   * Read file content by path and ref
   */
  async readFile(options: ReadFileOptions): Promise<string> {
    const { owner, repo, path, ref = 'main' } = options;

    // Get the SHA for the file path
    const sha = await this.getPathSha({ owner, repo, ref, path });
    if (!sha) {
      throw new Error(`File ${path} not found in ${owner}/${repo}@${ref}`);
    }

    // Read the blob
    const blob = await this.readBlob({ owner, repo, sha });
    
    // Decode content
    if (blob.encoding === 'base64') {
      return Buffer.from(blob.content, 'base64').toString('utf-8');
    }
    
    return blob.content;
  }

  /**
   * Search code in repository
   */
  async searchCode(options: SearchCodeOptions): Promise<SearchResult> {
    const { owner, repo, q, sort, order, per_page = 30, page = 1 } = options;
    
    // Scope search to this repository
    const query = `${q} repo:${owner}/${repo}`;

    try {
      // Check cache first
      const cacheParams = { q: query, sort, order, per_page, page };
      const cachedResponse = this.cache.get<SearchResult>('GET', '/search/code', cacheParams);
      if (cachedResponse) {
        return cachedResponse.data;
      }

      // Get conditional headers
      const headers = this.cache.getConditionalHeaders('GET', '/search/code', cacheParams);

      const response = await this.octokit.rest.search.code({
        q: query,
        sort,
        order,
        per_page,
        page,
        headers,
      });

      // Cache the response
      this.cache.set('GET', '/search/code', response.data, response.headers, cacheParams);

      return response.data;
    } catch (error: any) {
      if (error.status === 304) {
        const cachedResponse = this.cache.get<SearchResult>('GET', '/search/code', { q: query, sort, order, per_page, page });
        if (cachedResponse) {
          return cachedResponse.data;
        }
      }
      throw error;
    }
  }

  /**
   * Create a new branch from an existing ref
   */
  async createBranchFrom(options: CreateBranchOptions): Promise<void> {
    const { owner, repo, newRef, fromRef } = options;

    // Get the SHA of the source ref
    const sourceRef = await this.octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${fromRef}`,
    });

    // Create new branch
    await this.octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newRef}`,
      sha: sourceRef.data.object.sha,
    });
  }

  /**
   * Create a new tree with files
   */
  async createTree(options: CreateTreeOptions): Promise<{ sha: string; url: string }> {
    const { owner, repo, baseTreeSha, files } = options;

    // Convert files to tree format
    const tree = await Promise.all(
      files.map(async (file: CreateTreeFile) => {
        let sha: string;
        
        if (file.blobSha) {
          sha = file.blobSha;
        } else if (file.content !== undefined) {
          // Create blob for content
          const blob = await this.octokit.rest.git.createBlob({
            owner,
            repo,
            content: file.content,
            encoding: 'utf-8',
          });
          sha = blob.data.sha;
        } else {
          throw new Error(`File ${file.path} must have either content or blobSha`);
        }

        return {
          path: file.path,
          mode: file.mode || '100644',
          type: 'blob' as const,
          sha,
        };
      })
    );

    const response = await this.octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree,
    });

    return {
      sha: response.data.sha,
      url: response.data.url,
    };
  }

  /**
   * Create a new commit
   */
  async createCommit(options: CreateCommitOptions): Promise<CommitData> {
    const { owner, repo, message, treeSha, parentSha, parents } = options;

    const parentShas = parents || (parentSha ? [parentSha] : []);

    const response = await this.octokit.rest.git.createCommit({
      owner,
      repo,
      message,
      tree: treeSha,
      parents: parentShas,
    });

    return response.data;
  }

  /**
   * Update a reference (branch) to point to a new commit
   */
  async updateRef(options: UpdateRefOptions): Promise<void> {
    const { owner, repo, ref, sha, force = false } = options;

    await this.octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${ref}`,
      sha,
      force,
    });
  }

  /**
   * Open a pull request
   */
  async openPR(options: OpenPROptions): Promise<PullRequestData> {
    const { owner, repo, base, head, title, body, labels, draft = false } = options;

    const response = await this.octokit.rest.pulls.create({
      owner,
      repo,
      base,
      head,
      title,
      body,
      draft,
    });

    // Add labels if provided
    if (labels && labels.length > 0) {
      await this.octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: response.data.number,
        labels,
      });
    }

    return response.data as PullRequestData;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.treeCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { responseCache: any; treeCacheSize: number } {
    return {
      responseCache: this.cache.getStats(),
      treeCacheSize: this.treeCache.size,
    };
  }
}
