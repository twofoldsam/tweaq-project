import { Octokit } from '@octokit/rest';
import {
  LLMAugmentHintsOptions,
  SourceHint,
  FileExcerpt,
  LLMAnalysisResponse,
  LLMProvider,
  NodeSnapshot,
  RepoIndex
} from './types.js';
import { GitHubSearchClient } from './github-search.js';

export class LLMAugmenter {
  private octokit: Octokit;
  private searchClient: GitHubSearchClient;
  private llmProvider?: LLMProvider | undefined;

  constructor(auth: string, llmProvider?: LLMProvider | undefined) {
    this.octokit = new Octokit({ auth });
    this.searchClient = new GitHubSearchClient(auth);
    this.llmProvider = llmProvider;
  }

  /**
   * Augment deterministic hints with LLM analysis
   */
  async llmAugmentHints(options: LLMAugmentHintsOptions): Promise<SourceHint[]> {
    const { nodeSnapshot, urlPath, deterministicHints, repoIndex } = options;

    if (!this.llmProvider) {
      console.warn('No LLM provider configured, skipping LLM augmentation');
      return deterministicHints;
    }

    // Check if we need LLM augmentation (weak deterministic hints)
    const needsAugmentation = this.shouldAugmentHints(deterministicHints);
    
    if (!needsAugmentation) {
      return deterministicHints;
    }

    try {
      // 1. Get top candidate files from code search
      const candidateFiles = await this.getCandidateFiles(nodeSnapshot, urlPath, repoIndex);
      
      if (candidateFiles.length === 0) {
        return deterministicHints;
      }

      // 2. Fetch file excerpts for LLM analysis
      const fileExcerpts = await this.fetchFileExcerpts(candidateFiles, repoIndex);

      // 3. Analyze with LLM
      const llmAnalysis = await this.llmProvider.analyzeComponents({
        nodeSnapshot,
        urlPath,
        candidateFiles: fileExcerpts
      });

      // 4. Convert LLM results to SourceHints
      const llmHints = this.convertLLMResultsToHints(llmAnalysis);

      // 5. Merge with deterministic hints
      return this.mergeHints(deterministicHints, llmHints);

    } catch (error) {
      console.warn('LLM augmentation failed:', error);
      return deterministicHints;
    }
  }

  /**
   * Determine if hints are weak enough to warrant LLM augmentation
   */
  private shouldAugmentHints(hints: SourceHint[]): boolean {
    // Augment if:
    // 1. No hints at all
    // 2. All hints have low confidence (< 0.7)
    // 3. Fewer than 3 hints total
    
    if (hints.length === 0) return true;
    if (hints.length < 3) return true;
    
    const highConfidenceHints = hints.filter(h => h.confidence >= 0.7);
    return highConfidenceHints.length === 0;
  }

  /**
   * Get candidate files through comprehensive search
   */
  private async getCandidateFiles(
    nodeSnapshot: NodeSnapshot,
    urlPath: string,
    repoIndex: RepoIndex
  ): Promise<string[]> {
    const candidateFiles = new Set<string>();
    const repoId = { owner: repoIndex.owner, repo: repoIndex.repo };

    // Search based on node attributes
    const searchPromises: Promise<SourceHint[]>[] = [];

    if (nodeSnapshot['data-testid']) {
      searchPromises.push(this.searchClient.searchTestId(repoId, nodeSnapshot['data-testid']));
    }

    if (nodeSnapshot.className) {
      const classNames = nodeSnapshot.className.split(/\s+/).filter(cls => cls.length > 0);
      for (const className of classNames.slice(0, 3)) { // Limit to first 3 classes
        searchPromises.push(this.searchClient.searchClassName(repoId, className));
      }
    }

    if (nodeSnapshot.id) {
      searchPromises.push(this.searchClient.searchId(repoId, nodeSnapshot.id));
    }

    if (nodeSnapshot.textContent && nodeSnapshot.textContent.length > 3) {
      searchPromises.push(this.searchClient.searchTextContent(repoId, nodeSnapshot.textContent));
    }

    // Execute searches in parallel
    const searchResults = await Promise.all(searchPromises);
    
    // Collect unique file paths
    for (const hints of searchResults) {
      for (const hint of hints) {
        candidateFiles.add(hint.filePath);
      }
    }

    // Add URL-based candidates
    const urlCandidates = this.getUrlBasedCandidates(urlPath, repoIndex);
    for (const candidate of urlCandidates) {
      candidateFiles.add(candidate);
    }

    // Return top 20 candidates, prioritizing UI-related files
    const sortedCandidates = Array.from(candidateFiles)
      .sort((a, b) => this.scoreCandidate(b, urlPath) - this.scoreCandidate(a, urlPath))
      .slice(0, 20);

    return sortedCandidates;
  }

  /**
   * Get URL-based candidate files
   */
  private getUrlBasedCandidates(urlPath: string, repoIndex: RepoIndex): string[] {
    const segments = urlPath.split('/').filter(s => s.length > 0);
    const candidates: string[] = [];

    // Look for files that might match URL segments
    for (const file of repoIndex.files) {
      if (file.type !== 'blob') continue;
      
      const filePath = file.path.toLowerCase();
      const fileName = file.path.split('/').pop()?.toLowerCase() || '';

      // Check if file might be UI-related
      if (!this.isUIFile(file.path)) continue;

      // Score based on URL segment matches
      for (const segment of segments) {
        if (fileName.includes(segment.toLowerCase()) || 
            filePath.includes(segment.toLowerCase())) {
          candidates.push(file.path);
          break;
        }
      }
    }

    return candidates;
  }

  /**
   * Score a candidate file based on relevance
   */
  private scoreCandidate(filePath: string, urlPath: string): number {
    let score = 0;
    const pathLower = filePath.toLowerCase();
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';

    // UI file bonus
    if (this.isUIFile(filePath)) score += 10;

    // Component directory bonus
    if (pathLower.includes('component')) score += 5;
    if (pathLower.includes('page')) score += 5;
    if (pathLower.includes('view')) score += 3;

    // URL segment matches
    const urlSegments = urlPath.split('/').filter(s => s.length > 0);
    for (const segment of urlSegments) {
      if (fileName.includes(segment.toLowerCase())) score += 8;
      if (pathLower.includes(segment.toLowerCase())) score += 4;
    }

    // File extension preference
    if (filePath.endsWith('.tsx')) score += 3;
    if (filePath.endsWith('.jsx')) score += 2;

    return score;
  }

  /**
   * Check if a file is likely a UI component
   */
  private isUIFile(filePath: string): boolean {
    const uiExtensions = ['.tsx', '.jsx', '.vue', '.svelte'];
    const uiDirectories = ['components', 'pages', 'views', 'containers', 'features', 'screens'];
    
    const hasUIExtension = uiExtensions.some(ext => filePath.endsWith(ext));
    const inUIDirectory = uiDirectories.some(dir => filePath.toLowerCase().includes(dir));
    
    return hasUIExtension || inUIDirectory;
  }

  /**
   * Fetch file excerpts for LLM analysis
   */
  private async fetchFileExcerpts(
    candidateFiles: string[],
    repoIndex: RepoIndex
  ): Promise<FileExcerpt[]> {
    const excerpts: FileExcerpt[] = [];
    
    // Process files in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < candidateFiles.length; i += batchSize) {
      const batch = candidateFiles.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (filePath) => {
        try {
          const content = await this.readFileContent(filePath, repoIndex);
          return this.createFileExcerpt(filePath, content);
        } catch (error) {
          console.warn(`Failed to read ${filePath}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      excerpts.push(...batchResults.filter(excerpt => excerpt !== null) as FileExcerpt[]);
      
      // Small delay between batches to be respectful of rate limits
      if (i + batchSize < candidateFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return excerpts;
  }

  /**
   * Read file content from GitHub
   */
  private async readFileContent(filePath: string, repoIndex: RepoIndex): Promise<string> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: repoIndex.owner,
        repo: repoIndex.repo,
        path: filePath,
        ref: repoIndex.ref
      });

      if ('content' in response.data && response.data.content) {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }
      
      throw new Error('No content found');
    } catch (error) {
      throw new Error(`Failed to read ${filePath}: ${error}`);
    }
  }

  /**
   * Create a file excerpt with key sections
   */
  private createFileExcerpt(filePath: string, content: string): FileExcerpt {
    const lines = content.split('\n');
    const maxLines = 200;
    
    // For components, try to get the most relevant sections
    if (this.isReactComponent(content)) {
      return this.createReactComponentExcerpt(filePath, lines, maxLines);
    }
    
    // For other files, take first 200 lines
    const excerptLines = lines.slice(0, maxLines);
    const imports = this.extractImports(excerptLines);
    
    return {
      filePath,
      content: excerptLines.join('\n'),
      lines: excerptLines.length,
      imports
    };
  }

  /**
   * Check if content is a React component
   */
  private isReactComponent(content: string): boolean {
    return /import.*React|export.*function|export.*const.*=|class.*extends.*Component/.test(content);
  }

  /**
   * Create excerpt focused on React component structure
   */
  private createReactComponentExcerpt(filePath: string, lines: string[], maxLines: number): FileExcerpt {
    const excerptLines: string[] = [];
    const imports: string[] = [];
    
    let inImports = true;
    let foundComponent = false;
    let braceDepth = 0;
    let componentStartLine = -1;
    
    for (let i = 0; i < lines.length && excerptLines.length < maxLines; i++) {
      const currentLine = lines[i];
      if (!currentLine) continue;
      
      const line = currentLine.trim();
      
      // Collect imports
      if (inImports && (line.startsWith('import ') || line.startsWith('export ') && line.includes('from'))) {
        imports.push(line);
        excerptLines.push(currentLine);
        continue;
      }
      
      if (inImports && line && !line.startsWith('import') && !line.startsWith('//')) {
        inImports = false;
      }
      
      // Look for component definition
      if (!foundComponent && (
        line.includes('function ') || 
        line.includes('const ') && line.includes('=') ||
        line.includes('class ') && line.includes('extends')
      )) {
        foundComponent = true;
        componentStartLine = i;
        excerptLines.push(currentLine);
        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;
        continue;
      }
      
      // Include component body
      if (foundComponent) {
        excerptLines.push(currentLine);
        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;
        
        // Stop when we've closed the main component function/class
        if (braceDepth <= 0 && i > componentStartLine + 5) {
          break;
        }
      }
    }
    
    // If we didn't find a clear component structure, fall back to first N lines
    if (excerptLines.length < 20) {
      return {
        filePath,
        content: lines.slice(0, maxLines).join('\n'),
        lines: Math.min(lines.length, maxLines),
        imports: this.extractImports(lines.slice(0, maxLines))
      };
    }
    
    return {
      filePath,
      content: excerptLines.join('\n'),
      lines: excerptLines.length,
      imports
    };
  }

  /**
   * Extract import statements from lines
   */
  private extractImports(lines: string[]): string[] {
    return lines
      .filter(line => line.trim().startsWith('import '))
      .map(line => line.trim())
      .slice(0, 10); // Limit to first 10 imports
  }

  /**
   * Convert LLM analysis results to SourceHints
   */
  private convertLLMResultsToHints(analysis: LLMAnalysisResponse): SourceHint[] {
    return analysis.rankings.map(ranking => ({
      filePath: ranking.filePath,
      evidence: 'llm' as const,
      confidence: Math.max(0, Math.min(1, ranking.confidence)), // Clamp to 0-1
      matchedValue: 'LLM Analysis',
      rationale: ranking.rationale
    }));
  }

  /**
   * Merge deterministic hints with LLM hints
   */
  private mergeHints(deterministicHints: SourceHint[], llmHints: SourceHint[]): SourceHint[] {
    const merged = [...deterministicHints];
    const existingPaths = new Set(deterministicHints.map(h => h.filePath));
    
    // Add LLM hints that don't conflict with existing high-confidence hints
    for (const llmHint of llmHints) {
      if (!existingPaths.has(llmHint.filePath)) {
        merged.push(llmHint);
      } else {
        // If we have an existing hint for this file, boost its confidence slightly if LLM agrees
        const existingHint = merged.find(h => h.filePath === llmHint.filePath);
        if (existingHint && llmHint.confidence > 0.6) {
          existingHint.confidence = Math.min(1, existingHint.confidence + 0.1);
          if (!existingHint.rationale && llmHint.rationale) {
            existingHint.rationale = llmHint.rationale;
          }
        }
      }
    }
    
    // Sort by confidence and return top results
    return merged
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 25); // Slightly more results since we have LLM augmentation
  }
}
