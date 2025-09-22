export interface RepoIdentifier {
  owner: string;
  repo: string;
  ref?: string;
}

export interface BuildRepoIndexOptions extends RepoIdentifier {}

export interface NodeSnapshot {
  tagName?: string;
  className?: string;
  id?: string;
  'data-testid'?: string;
  textContent?: string;
  attributes?: Record<string, string>;
}

export interface GetDeterministicHintsOptions {
  nodeSnapshot: NodeSnapshot;
  urlPath: string;
  repoIndex: RepoIndex;
}

export interface LLMAugmentHintsOptions {
  nodeSnapshot: NodeSnapshot;
  urlPath: string;
  deterministicHints: SourceHint[];
  repoIndex: RepoIndex;
}

export interface FileExcerpt {
  filePath: string;
  content: string;
  lines: number;
  imports?: string[];
}

export interface LLMAnalysisRequest {
  nodeSnapshot: NodeSnapshot;
  urlPath: string;
  candidateFiles: FileExcerpt[];
}

export interface LLMAnalysisResponse {
  rankings: Array<{
    filePath: string;
    confidence: number;
    rationale: string;
  }>;
}

export interface LLMProvider {
  analyzeComponents(request: LLMAnalysisRequest): Promise<LLMAnalysisResponse>;
}

export interface SourceHint {
  filePath: string;
  evidence: 'testid' | 'class' | 'id' | 'url-hint' | 'llm';
  confidence: number; // 0-1 scale
  matchedValue?: string; // The actual value that matched (e.g., the testid, class name, etc.)
  line?: number | undefined; // Line number where the match was found (if available)
  rationale?: string; // LLM reasoning for why this file is relevant (for UI display)
}

export interface RepoIndex {
  owner: string;
  repo: string;
  ref: string;
  files: RepoFile[];
  commonSourceFolders: string[];
  indexedAt: number;
}

export interface RepoFile {
  path: string;
  sha: string;
  type: 'blob' | 'tree';
  size?: number | undefined;
}

export interface SearchCodeOptions {
  owner: string;
  repo: string;
  query: string;
  path?: string;
  per_page?: number;
  page?: number;
}

export interface SearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: SearchResultItem[];
}

export interface SearchResultItem {
  name: string;
  path: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
  };
  score: number;
  text_matches?: TextMatch[];
}

export interface TextMatch {
  object_url?: string;
  object_type?: string | null;
  property?: string;
  fragment?: string;
  matches?: Array<{
    text?: string;
    indices?: number[];
  }>;
}

// Common source folder patterns to prioritize
export const COMMON_SOURCE_FOLDERS = [
  'src',
  'apps',
  'packages',
  'components',
  'lib',
  'utils',
  'pages',
  'views',
  'containers',
  'features'
] as const;

// File extensions to consider for source code
export const SOURCE_EXTENSIONS = [
  '.tsx',
  '.jsx',
  '.ts',
  '.js',
  '.vue',
  '.svelte',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.module.css',
  '.module.scss'
] as const;
