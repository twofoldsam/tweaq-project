export { MappingEngine } from './mapping-engine.js';
export { RepoIndexer } from './repo-indexer.js';
export { GitHubSearchClient } from './github-search.js';
export { LLMAugmenter } from './llm-augmenter.js';
export { BaseLLMProvider, MockLLMProvider, OpenAIProvider, ClaudeProvider } from './llm-provider.js';
export * from './types.js';

import { MappingEngine } from './mapping-engine.js';

// Convenience function for quick usage
export async function buildRepoIndex(options: {
  owner: string;
  repo: string;
  ref?: string;
  auth: string;
}) {
  const { auth, ...repoOptions } = options;
  const engine = new MappingEngine(auth);
  return engine.buildRepoIndex(repoOptions);
}

// Convenience function for getting hints
export async function getDeterministicHints(options: {
  nodeSnapshot: {
    tagName?: string;
    className?: string;
    id?: string;
    'data-testid'?: string;
    textContent?: string;
    attributes?: Record<string, string>;
  };
  urlPath: string;
  repoIndex: {
    owner: string;
    repo: string;
    ref: string;
    files: Array<{
      path: string;
      sha: string;
      type: 'blob' | 'tree';
      size?: number;
    }>;
    commonSourceFolders: string[];
    indexedAt: number;
  };
  auth: string;
}) {
  const { auth, ...hintsOptions } = options;
  const engine = new MappingEngine(auth);
  return engine.getDeterministicHints(hintsOptions);
}

// Convenience function for LLM-augmented hints
export async function llmAugmentHints(options: {
  nodeSnapshot: {
    tagName?: string;
    className?: string;
    id?: string;
    'data-testid'?: string;
    textContent?: string;
    attributes?: Record<string, string>;
  };
  urlPath: string;
  deterministicHints: Array<{
    filePath: string;
    evidence: 'testid' | 'class' | 'id' | 'url-hint' | 'llm';
    confidence: number;
    matchedValue?: string;
    line?: number | undefined;
    rationale?: string;
  }>;
  repoIndex: {
    owner: string;
    repo: string;
    ref: string;
    files: Array<{
      path: string;
      sha: string;
      type: 'blob' | 'tree';
      size?: number | undefined;
    }>;
    commonSourceFolders: string[];
    indexedAt: number;
  };
  auth: string;
  llmProvider?: any; // LLMProvider type
}) {
  const { auth, llmProvider, ...augmentOptions } = options;
  const engine = new MappingEngine(auth, llmProvider);
  return engine.llmAugmentHints(augmentOptions);
}
