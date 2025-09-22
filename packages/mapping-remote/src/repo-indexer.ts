import { Octokit } from '@octokit/rest';
import {
  BuildRepoIndexOptions,
  RepoIndex,
  RepoFile,
  COMMON_SOURCE_FOLDERS,
  SOURCE_EXTENSIONS
} from './types.js';

export class RepoIndexer {
  private octokit: Octokit;

  constructor(auth: string) {
    this.octokit = new Octokit({ auth });
  }

  /**
   * Build an index of a repository by pulling the top-level tree and common source folders
   * Only fetches paths and SHAs, not blob contents
   */
  async buildRepoIndex(options: BuildRepoIndexOptions): Promise<RepoIndex> {
    const { owner, repo, ref = 'main' } = options;

    try {
      // First, get the top-level tree
      const topLevelTree = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: ref
      });

      const files: RepoFile[] = [];
      const commonSourceFolders: string[] = [];
      const foldersToFetch: string[] = [];

      // Process top-level entries
      for (const entry of topLevelTree.data.tree) {
        if (!entry.path || !entry.sha) continue;

        files.push({
          path: entry.path,
          sha: entry.sha,
          type: entry.type as 'blob' | 'tree',
          size: entry.size || undefined
        });

        // Check if this is a common source folder
        if (entry.type === 'tree' && COMMON_SOURCE_FOLDERS.includes(entry.path as any)) {
          commonSourceFolders.push(entry.path);
          foldersToFetch.push(entry.sha);
        }
      }

      // Fetch contents of common source folders recursively
      for (let i = 0; i < foldersToFetch.length; i++) {
        const folderSha = foldersToFetch[i];
        const folderPath = commonSourceFolders[i];

        if (!folderSha) continue;

        try {
          const folderTree = await this.octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: folderSha,
            recursive: 'true'
          });

          // Add all files from this folder, filtering for source files
          for (const entry of folderTree.data.tree) {
            if (!entry.path || !entry.sha) continue;

            const fullPath = `${folderPath}/${entry.path}`;
            
            // Only include source files and directories
            if (entry.type === 'tree' || this.isSourceFile(entry.path)) {
              files.push({
                path: fullPath,
                sha: entry.sha,
                type: entry.type as 'blob' | 'tree',
                size: entry.size || undefined
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch folder ${folderPath}:`, error);
          // Continue with other folders
        }
      }

      return {
        owner,
        repo,
        ref,
        files,
        commonSourceFolders,
        indexedAt: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to build repo index for ${owner}/${repo}@${ref}: ${error}`);
    }
  }

  /**
   * Check if a file path represents a source file we care about
   */
  private isSourceFile(path: string): boolean {
    return SOURCE_EXTENSIONS.some(ext => path.endsWith(ext));
  }

  /**
   * Get files from the index that match certain criteria
   */
  getRelevantFiles(repoIndex: RepoIndex, criteria: {
    extensions?: string[];
    pathContains?: string;
    excludePaths?: string[];
  } = {}): RepoFile[] {
    const { extensions = SOURCE_EXTENSIONS, pathContains, excludePaths = [] } = criteria;

    return repoIndex.files.filter(file => {
      // Only consider blob files
      if (file.type !== 'blob') return false;

      // Check extension
      if (!extensions.some(ext => file.path.endsWith(ext))) return false;

      // Check path contains
      if (pathContains && !file.path.toLowerCase().includes(pathContains.toLowerCase())) {
        return false;
      }

      // Check excluded paths
      if (excludePaths.some(excludePath => file.path.includes(excludePath))) {
        return false;
      }

      return true;
    });
  }

  /**
   * Find files that might be related to a URL path
   * E.g., /checkout might relate to files containing "Checkout" or in "checkout" folders
   */
  getUrlRelatedFiles(repoIndex: RepoIndex, urlPath: string): RepoFile[] {
    // Extract meaningful segments from URL path
    const segments = urlPath
      .split('/')
      .filter(segment => segment.length > 0)
      .map(segment => segment.toLowerCase());

    if (segments.length === 0) {
      return [];
    }

    const relevantFiles = this.getRelevantFiles(repoIndex);

    return relevantFiles.filter(file => {
      const filePath = file.path.toLowerCase();
      const fileName = file.path.split('/').pop()?.toLowerCase() || '';

      // Check if any URL segment matches file name or path
      return segments.some(segment => {
        // Direct match in file name or path
        if (filePath.includes(segment) || fileName.includes(segment)) {
          return true;
        }

        // Check for camelCase/PascalCase variations
        const capitalizedSegment = segment.charAt(0).toUpperCase() + segment.slice(1);
        if (filePath.includes(capitalizedSegment.toLowerCase()) || fileName.includes(capitalizedSegment.toLowerCase())) {
          return true;
        }

        return false;
      });
    });
  }
}
