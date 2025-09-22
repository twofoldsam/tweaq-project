import { Octokit } from '@octokit/rest';
import {
  SearchCodeOptions,
  SearchResult,
  SearchResultItem,
  SourceHint,
  RepoIdentifier
} from './types.js';

export class GitHubSearchClient {
  private octokit: Octokit;

  constructor(auth: string) {
    this.octokit = new Octokit({ auth });
  }

  /**
   * Search for code in a repository using GitHub's Code Search API
   */
  async searchCode(options: SearchCodeOptions): Promise<SearchResult> {
    const { owner, repo, query, path, per_page = 30, page = 1 } = options;

    // Build the search query
    let searchQuery = `${query} repo:${owner}/${repo}`;
    
    if (path) {
      searchQuery += ` path:${path}`;
    }

    try {
      const response = await this.octokit.rest.search.code({
        q: searchQuery,
        per_page,
        page,
      });

      return response.data as SearchResult;
    } catch (error: any) {
      // Handle rate limiting and other errors gracefully
      if (error.status === 403 && error.message?.includes('rate limit')) {
        console.warn('GitHub search rate limit exceeded');
        return {
          total_count: 0,
          incomplete_results: true,
          items: []
        };
      }
      throw error;
    }
  }

  /**
   * Search for data-testid attributes
   */
  async searchTestId(repoId: RepoIdentifier, testId: string): Promise<SourceHint[]> {
    const { owner, repo } = repoId;
    
    try {
      const result = await this.searchCode({
        owner,
        repo,
        query: `"data-testid=\\"${testId}\\""`,
        path: 'src'
      });

      return this.convertSearchResultsToHints(result, 'testid', testId, 0.9);
    } catch (error) {
      console.warn(`Failed to search for testid "${testId}":`, error);
      return [];
    }
  }

  /**
   * Search for CSS class names in TSX/JSX files
   */
  async searchClassName(repoId: RepoIdentifier, className: string): Promise<SourceHint[]> {
    const { owner, repo } = repoId;
    const hints: SourceHint[] = [];

    try {
      // Search in TSX/JSX files for className usage
      const jsxResult = await this.searchCode({
        owner,
        repo,
        query: `"${className}" extension:tsx OR extension:jsx`,
        path: 'src'
      });

      hints.push(...this.convertSearchResultsToHints(jsxResult, 'class', className, 0.8));

      // Search in CSS files for class definitions
      const cssResult = await this.searchCode({
        owner,
        repo,
        query: `".${className}" extension:css OR extension:scss OR extension:sass`,
        path: 'src'
      });

      hints.push(...this.convertSearchResultsToHints(cssResult, 'class', className, 0.7));

      // Search for CSS Modules
      const moduleResult = await this.searchCode({
        owner,
        repo,
        query: `"${className}" filename:*.module.css OR filename:*.module.scss`,
        path: 'src'
      });

      hints.push(...this.convertSearchResultsToHints(moduleResult, 'class', className, 0.85));

    } catch (error) {
      console.warn(`Failed to search for className "${className}":`, error);
    }

    return hints;
  }

  /**
   * Search for ID attributes
   */
  async searchId(repoId: RepoIdentifier, id: string): Promise<SourceHint[]> {
    const { owner, repo } = repoId;
    const hints: SourceHint[] = [];

    try {
      // Search for id attribute in JSX/TSX
      const jsxResult = await this.searchCode({
        owner,
        repo,
        query: `"id=\\"${id}\\"" extension:tsx OR extension:jsx`,
        path: 'src'
      });

      hints.push(...this.convertSearchResultsToHints(jsxResult, 'id', id, 0.85));

      // Search for CSS ID selectors
      const cssResult = await this.searchCode({
        owner,
        repo,
        query: `"#${id}" extension:css OR extension:scss OR extension:sass`,
        path: 'src'
      });

      hints.push(...this.convertSearchResultsToHints(cssResult, 'id', id, 0.7));

    } catch (error) {
      console.warn(`Failed to search for id "${id}":`, error);
    }

    return hints;
  }

  /**
   * Search for multiple attributes from a node snapshot
   */
  async searchNodeAttributes(repoId: RepoIdentifier, attributes: {
    testId?: string;
    className?: string;
    id?: string;
  }): Promise<SourceHint[]> {
    const hints: SourceHint[] = [];

    // Search for data-testid (highest priority)
    if (attributes.testId) {
      const testIdHints = await this.searchTestId(repoId, attributes.testId);
      hints.push(...testIdHints);
    }

    // Search for class names
    if (attributes.className) {
      // Split class names and search for each
      const classNames = attributes.className.split(/\s+/).filter(cls => cls.length > 0);
      
      for (const className of classNames) {
        const classHints = await this.searchClassName(repoId, className);
        hints.push(...classHints);
      }
    }

    // Search for ID
    if (attributes.id) {
      const idHints = await this.searchId(repoId, attributes.id);
      hints.push(...idHints);
    }

    return this.deduplicateAndRankHints(hints);
  }

  /**
   * Convert GitHub search results to SourceHint objects
   */
  private convertSearchResultsToHints(
    searchResult: SearchResult,
    evidence: SourceHint['evidence'],
    matchedValue: string,
    baseConfidence: number
  ): SourceHint[] {
    return searchResult.items.map(item => {
      // Boost confidence based on GitHub's relevance score
      const scoreBoost = Math.min(item.score / 100, 0.1); // Max 0.1 boost
      const confidence = Math.min(baseConfidence + scoreBoost, 1.0);

      return {
        filePath: item.path,
        evidence,
        confidence,
        matchedValue,
        line: this.extractLineNumber(item) || undefined
      };
    });
  }

  /**
   * Extract line number from search result if available
   */
  private extractLineNumber(item: SearchResultItem): number | undefined {
    // GitHub search API sometimes includes text matches with line info
    if (item.text_matches && item.text_matches.length > 0) {
      // This is a simplified extraction - the actual API structure might vary
      return undefined; // GitHub Code Search API doesn't provide line numbers directly
    }
    return undefined;
  }

  /**
   * Remove duplicate hints and rank them by confidence
   */
  private deduplicateAndRankHints(hints: SourceHint[]): SourceHint[] {
    const seen = new Set<string>();
    const uniqueHints: SourceHint[] = [];

    // Sort by confidence first (highest first)
    const sortedHints = hints.sort((a, b) => b.confidence - a.confidence);

    for (const hint of sortedHints) {
      const key = `${hint.filePath}:${hint.evidence}:${hint.matchedValue}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueHints.push(hint);
      }
    }

    return uniqueHints;
  }

  /**
   * Search for text content in files
   */
  async searchTextContent(repoId: RepoIdentifier, textContent: string): Promise<SourceHint[]> {
    if (!textContent || textContent.trim().length < 3) {
      return []; // Skip very short text content
    }

    const { owner, repo } = repoId;
    const cleanText = textContent.trim().slice(0, 50); // Limit search text length

    try {
      const result = await this.searchCode({
        owner,
        repo,
        query: `"${cleanText}" extension:tsx OR extension:jsx`,
        path: 'src'
      });

      return this.convertSearchResultsToHints(result, 'testid', cleanText, 0.6);
    } catch (error) {
      console.warn(`Failed to search for text content "${cleanText}":`, error);
      return [];
    }
  }
}
