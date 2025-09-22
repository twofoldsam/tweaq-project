# @smart-qa/mapping-remote

A package for generating source code hints from GitHub repositories without requiring local files.

## Features

- **Repository Indexing**: Build an index of a GitHub repository by pulling tree structures and common source folders
- **Deterministic Hints**: Generate source hints based on DOM node attributes and URL context
- **GitHub Search Integration**: Search for data-testid, CSS classes, and IDs using GitHub's Code Search API
- **URL-based Ranking**: Rank hints higher when file names or paths match URL segments
- **LLM Augmentation**: When deterministic hints are weak, use LLM analysis of candidate components to provide intelligent rankings with rationale

## Installation

```bash
pnpm add @smart-qa/mapping-remote
```

## Usage

### Basic Usage

```typescript
import { buildRepoIndex, getDeterministicHints } from '@smart-qa/mapping-remote';

// 1. Build a repository index
const repoIndex = await buildRepoIndex({
  owner: 'facebook',
  repo: 'react',
  ref: 'main', // optional, defaults to 'main'
  auth: 'your-github-token'
});

// 2. Get hints for a DOM node
const hints = await getDeterministicHints({
  nodeSnapshot: {
    'data-testid': 'submit-button',
    className: 'btn btn-primary',
    id: 'checkout-submit',
    tagName: 'button',
    textContent: 'Submit Order'
  },
  urlPath: '/checkout',
  repoIndex,
  auth: 'your-github-token'
});

console.log(hints);
// [
//   {
//     filePath: 'src/components/CheckoutButton.tsx',
//     evidence: 'testid',
//     confidence: 0.95,
//     matchedValue: 'submit-button'
//   },
//   {
//     filePath: 'src/pages/Checkout.tsx',
//     evidence: 'url-hint',
//     confidence: 0.8,
//     matchedValue: '/checkout'
//   }
// ]
```

### Advanced Usage

```typescript
import { MappingEngine, OpenAIProvider } from '@smart-qa/mapping-remote';

// Initialize with LLM provider for enhanced accuracy
const llmProvider = new OpenAIProvider('your-openai-api-key', 'gpt-4');
const engine = new MappingEngine('your-github-token', llmProvider);

// Build repository index
const repoIndex = await engine.buildRepoIndex({
  owner: 'your-org',
  repo: 'your-repo',
  ref: 'develop'
});

// Get deterministic hints first
const deterministicHints = await engine.getDeterministicHints({
  nodeSnapshot: {
    'data-testid': 'user-profile-avatar',
    className: 'avatar rounded-full'
  },
  urlPath: '/profile/settings',
  repoIndex
});

// Augment with LLM analysis if hints are weak
const augmentedHints = await engine.llmAugmentHints({
  nodeSnapshot: {
    'data-testid': 'user-profile-avatar',
    className: 'avatar rounded-full'
  },
  urlPath: '/profile/settings',
  deterministicHints,
  repoIndex
});

console.log(augmentedHints);
// [
//   {
//     filePath: 'src/components/UserProfile.tsx',
//     evidence: 'llm',
//     confidence: 0.92,
//     rationale: 'This component contains an exact data-testid match for "user-profile-avatar" and is located in the profile section matching the URL path.'
//   }
// ]

// Get statistics about the hints
const stats = engine.getHintStatistics(augmentedHints);
console.log(stats);
// {
//   total: 5,
//   byEvidence: { testid: 2, llm: 1, class: 2, 'url-hint': 1 },
//   averageConfidence: 0.86,
//   highConfidenceCount: 4
// }
```

## API Reference

### `buildRepoIndex(options)`

Builds an index of a GitHub repository.

**Parameters:**
- `owner` (string): Repository owner
- `repo` (string): Repository name  
- `ref` (string, optional): Git reference (default: 'main')
- `auth` (string): GitHub authentication token

**Returns:** `Promise<RepoIndex>`

### `getDeterministicHints(options)`

Generates source hints for a DOM node.

**Parameters:**
- `nodeSnapshot` (object): DOM node attributes
  - `data-testid` (string, optional): Test ID attribute
  - `className` (string, optional): CSS class names
  - `id` (string, optional): Element ID
  - `tagName` (string, optional): HTML tag name
  - `textContent` (string, optional): Element text content
- `urlPath` (string): Current URL path
- `repoIndex` (RepoIndex): Repository index from `buildRepoIndex`
- `auth` (string): GitHub authentication token

**Returns:** `Promise<SourceHint[]>`

### `llmAugmentHints(options)`

Augments deterministic hints with LLM analysis for better accuracy.

**Parameters:**
- `nodeSnapshot` (object): DOM node attributes (same as `getDeterministicHints`)
- `urlPath` (string): Current URL path
- `deterministicHints` (SourceHint[]): Existing hints from deterministic analysis
- `repoIndex` (RepoIndex): Repository index from `buildRepoIndex`

**Returns:** `Promise<SourceHint[]>` - Merged hints including LLM analysis

### `SourceHint`

```typescript
interface SourceHint {
  filePath: string;           // Path to the source file
  evidence: 'testid' | 'class' | 'id' | 'url-hint' | 'llm'; // Type of evidence
  confidence: number;         // Confidence score (0-1)
  matchedValue?: string;      // The matched value
  line?: number;              // Line number (if available)
  rationale?: string;         // LLM reasoning (for 'llm' evidence type)
}
```

## Evidence Types

1. **testid**: Matches found via `data-testid` attribute search (highest priority)
2. **llm**: Matches from LLM analysis of component code (high priority, includes rationale)
3. **class**: Matches found via CSS class name search  
4. **id**: Matches found via element ID search
5. **url-hint**: Matches based on URL path similarity to file names/paths

## LLM Providers

The package supports multiple LLM providers for enhanced analysis:

### OpenAI GPT
```typescript
import { OpenAIProvider } from '@smart-qa/mapping-remote';

const llmProvider = new OpenAIProvider('your-openai-api-key', 'gpt-4');
// or use gpt-3.5-turbo for faster/cheaper analysis
const llmProvider = new OpenAIProvider('your-openai-api-key', 'gpt-3.5-turbo');
```

### Anthropic Claude
```typescript
import { ClaudeProvider } from '@smart-qa/mapping-remote';

const llmProvider = new ClaudeProvider('your-anthropic-api-key', 'claude-3-sonnet-20240229');
```

### Mock Provider (for testing)
```typescript
import { MockLLMProvider } from '@smart-qa/mapping-remote';

const llmProvider = new MockLLMProvider(); // Returns plausible mock responses
```

### Custom Provider
```typescript
import { BaseLLMProvider, LLMAnalysisRequest, LLMAnalysisResponse } from '@smart-qa/mapping-remote';

class CustomLLMProvider extends BaseLLMProvider {
  async analyzeComponents(request: LLMAnalysisRequest): Promise<LLMAnalysisResponse> {
    // Implement your custom LLM integration
    const prompt = this.buildAnalysisPrompt(request);
    const response = await yourLLMService.complete(prompt);
    return this.parseLLMResponse(response);
  }
}
```

## Authentication

You need a GitHub personal access token with appropriate permissions to access the repositories you want to index. The token should have:

- `repo` scope for private repositories
- `public_repo` scope for public repositories

For LLM providers, you'll also need API keys from your chosen service (OpenAI, Anthropic, etc.).

## Rate Limits

The package respects GitHub's API rate limits and includes basic rate limit handling. For heavy usage, consider implementing additional caching strategies.

## Examples

See the `/examples` directory for more detailed usage examples.
