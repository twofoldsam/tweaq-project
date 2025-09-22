import { RepoIndexer } from './repo-indexer.js';
import { GitHubSearchClient } from './github-search.js';
import { LLMAugmenter } from './llm-augmenter.js';
import {
  RepoIdentifier,
  NodeSnapshot,
  SourceHint,
  RepoIndex,
  GetDeterministicHintsOptions,
  LLMAugmentHintsOptions,
  LLMProvider
} from './types.js';

export class MappingEngine {
  private repoIndexer: RepoIndexer;
  private searchClient: GitHubSearchClient;
  private llmAugmenter: LLMAugmenter;

  constructor(auth: string, llmProvider?: LLMProvider) {
    this.repoIndexer = new RepoIndexer(auth);
    this.searchClient = new GitHubSearchClient(auth);
    this.llmAugmenter = new LLMAugmenter(auth, llmProvider);
  }

  /**
   * Build a repository index for fast lookups
   */
  async buildRepoIndex(options: RepoIdentifier): Promise<RepoIndex> {
    return this.repoIndexer.buildRepoIndex(options);
  }

  /**
   * Get deterministic hints for a DOM node based on its attributes and URL context
   */
  async getDeterministicHints(options: GetDeterministicHintsOptions): Promise<SourceHint[]> {
    const { nodeSnapshot, urlPath, repoIndex } = options;
    const hints: SourceHint[] = [];

    // 1. Search based on node attributes (data-testid, class, id)
    const attributeHints = await this.searchNodeAttributes(repoIndex, nodeSnapshot);
    hints.push(...attributeHints);

    // 2. Add URL-based hints
    const urlHints = this.getUrlBasedHints(repoIndex, urlPath, attributeHints);
    hints.push(...urlHints);

    // 3. Search for text content if available
    if (nodeSnapshot.textContent) {
      const textHints = await this.searchClient.searchTextContent(repoIndex, nodeSnapshot.textContent);
      hints.push(...textHints);
    }

    // 4. Rank and deduplicate hints
    const rankedHints = this.rankAndDeduplicateHints(hints);

    // 5. Limit results to most relevant hints
    return rankedHints.slice(0, 20); // Return top 20 hints
  }

  /**
   * Augment deterministic hints with LLM analysis for better accuracy
   */
  async llmAugmentHints(options: LLMAugmentHintsOptions): Promise<SourceHint[]> {
    return this.llmAugmenter.llmAugmentHints(options);
  }

  /**
   * Search for node attributes using GitHub search
   */
  private async searchNodeAttributes(repoIndex: RepoIndex, nodeSnapshot: NodeSnapshot): Promise<SourceHint[]> {
    const repoId = {
      owner: repoIndex.owner,
      repo: repoIndex.repo,
      ref: repoIndex.ref
    };

    const attributes: { testId?: string; className?: string; id?: string } = {};
    
    if (nodeSnapshot['data-testid']) {
      attributes.testId = nodeSnapshot['data-testid'];
    }
    if (nodeSnapshot.className) {
      attributes.className = nodeSnapshot.className;
    }
    if (nodeSnapshot.id) {
      attributes.id = nodeSnapshot.id;
    }

    return this.searchClient.searchNodeAttributes(repoId, attributes);
  }

  /**
   * Generate URL-based hints by finding files that match URL segments
   */
  private getUrlBasedHints(repoIndex: RepoIndex, urlPath: string, existingHints: SourceHint[]): SourceHint[] {
    const urlRelatedFiles = this.repoIndexer.getUrlRelatedFiles(repoIndex, urlPath);
    const existingPaths = new Set(existingHints.map(hint => hint.filePath));

    return urlRelatedFiles
      .filter(file => !existingPaths.has(file.path)) // Don't duplicate existing hints
      .map(file => {
        const confidence = this.calculateUrlConfidence(file.path, urlPath);
        return {
          filePath: file.path,
          evidence: 'url-hint' as const,
          confidence,
          matchedValue: urlPath
        };
      })
      .filter(hint => hint.confidence > 0.3); // Only include hints with reasonable confidence
  }

  /**
   * Calculate confidence score for URL-based hints
   */
  private calculateUrlConfidence(filePath: string, urlPath: string): number {
    const urlSegments = urlPath
      .split('/')
      .filter(segment => segment.length > 0)
      .map(segment => segment.toLowerCase());

    if (urlSegments.length === 0) return 0;

    const pathParts = filePath.toLowerCase().split('/');
    const fileName = pathParts[pathParts.length - 1] || '';
    
    let confidence = 0;
    let matchCount = 0;

    for (const segment of urlSegments) {
      // Check for exact matches in file name (highest weight)
      if (fileName.includes(segment)) {
        confidence += 0.4;
        matchCount++;
      }
      // Check for exact matches in path segments (medium weight)
      else if (pathParts.some(part => part.includes(segment))) {
        confidence += 0.3;
        matchCount++;
      }
      // Check for camelCase/PascalCase variations (lower weight)
      else {
        const capitalizedSegment = segment.charAt(0).toUpperCase() + segment.slice(1);
        if (fileName.includes(capitalizedSegment.toLowerCase()) || 
            pathParts.some(part => part.includes(capitalizedSegment.toLowerCase()))) {
          confidence += 0.2;
          matchCount++;
        }
      }
    }

    // Boost confidence if multiple segments match
    if (matchCount > 1) {
      confidence *= 1.2;
    }

    // Boost confidence for files in common UI directories
    const uiDirectories = ['components', 'pages', 'views', 'containers', 'features'];
    if (uiDirectories.some(dir => filePath.includes(dir))) {
      confidence *= 1.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Rank hints by confidence and relevance, removing duplicates
   */
  private rankAndDeduplicateHints(hints: SourceHint[]): SourceHint[] {
    // Group hints by file path
    const hintsByFile = new Map<string, SourceHint[]>();
    
    for (const hint of hints) {
      if (!hintsByFile.has(hint.filePath)) {
        hintsByFile.set(hint.filePath, []);
      }
      hintsByFile.get(hint.filePath)!.push(hint);
    }

    // For each file, keep the hint with highest confidence
    const deduplicatedHints: SourceHint[] = [];
    
    for (const [, fileHints] of hintsByFile) {
      // Sort by confidence (descending) and evidence priority
      const sortedHints = fileHints.sort((a, b) => {
        // First sort by confidence
        if (a.confidence !== b.confidence) {
          return b.confidence - a.confidence;
        }
        
        // Then by evidence priority (testid > llm > class > id > url-hint)
        const evidencePriority = { testid: 5, llm: 4, class: 3, id: 2, 'url-hint': 1 };
        return evidencePriority[b.evidence] - evidencePriority[a.evidence];
      });

      // Take the best hint for this file
      const bestHint = sortedHints[0];
      
      if (bestHint) {
        deduplicatedHints.push(bestHint);
      }
    }

    // Final ranking by confidence
    return deduplicatedHints.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get statistics about the search results
   */
  getHintStatistics(hints: SourceHint[]): {
    total: number;
    byEvidence: Record<string, number>;
    averageConfidence: number;
    highConfidenceCount: number; // confidence > 0.8
  } {
    const byEvidence: Record<string, number> = {};
    let totalConfidence = 0;
    let highConfidenceCount = 0;

    for (const hint of hints) {
      byEvidence[hint.evidence] = (byEvidence[hint.evidence] || 0) + 1;
      totalConfidence += hint.confidence;
      
      if (hint.confidence > 0.8) {
        highConfidenceCount++;
      }
    }

    return {
      total: hints.length,
      byEvidence,
      averageConfidence: hints.length > 0 ? totalConfidence / hints.length : 0,
      highConfidenceCount
    };
  }
}
