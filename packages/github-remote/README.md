# @smart-qa/github-remote

A TypeScript package that provides a `RemoteRepo` class for GitHub operations without requiring local git. Uses Octokit under the hood with intelligent caching to minimize API rate limit usage.

## Features

- 🔍 **Tree Operations**: Get repository tree structure with shallow loading and on-demand subtree fetching
- 📖 **File Reading**: Read files by path@ref or blob SHA with content decoding
- 🔎 **Code Search**: Wrapper for GitHub Code Search with repository scoping
- 🌿 **Git Data Writers**: Create branches, trees, commits, update refs, and open PRs
- ⚡ **Smart Caching**: ETag/If-None-Match caching to reduce rate limit usage
- 🎯 **Path Mapping**: In-memory path→SHA caching for efficient file lookups

## Installation

```bash
pnpm add @smart-qa/github-remote
```

## Quick Start

```typescript
import { RemoteRepo } from '@smart-qa/github-remote';

const repo = new RemoteRepo(process.env.GITHUB_TOKEN);

// Read a file by path@ref
const content = await repo.readFile({
  owner: 'username',
  repo: 'repository',
  path: 'src/index.ts',
  ref: 'main'
});

// Create a new branch and commit
await repo.createBranchFrom({
  owner: 'username',
  repo: 'repository',
  newRef: 'feature/new-feature',
  fromRef: 'main'
});

// Open a PR
const pr = await repo.openPR({
  owner: 'username',
  repo: 'repository',
  base: 'main',
  head: 'feature/new-feature',
  title: 'Add new feature',
  body: 'Description of changes'
});
```

## API Reference

### Tree Operations

#### `getRepoTree(options)`
Get repository tree structure (shallow by default, with caching).

```typescript
const tree = await repo.getRepoTree({
  owner: 'username',
  repo: 'repository',
  ref: 'main', // optional, defaults to 'main'
  recursive: false // optional, defaults to false
});
```

#### `getSubtree(options)`
Fetch subtree on demand for a specific path.

```typescript
const subtree = await repo.getSubtree({
  owner: 'username',
  repo: 'repository',
  ref: 'main',
  path: 'src'
});
```

### File Operations

#### `readBlob(options)`
Read blob content by SHA.

```typescript
const blob = await repo.readBlob({
  owner: 'username',
  repo: 'repository',
  sha: 'abc123...'
});
```

#### `readFile(options)`
Read file content by path and ref, returns decoded text.

```typescript
const content = await repo.readFile({
  owner: 'username',
  repo: 'repository',
  path: 'README.md',
  ref: 'main' // optional, defaults to 'main'
});
```

### Search

#### `searchCode(options)`
Search code in repository using GitHub Code Search.

```typescript
const results = await repo.searchCode({
  owner: 'username',
  repo: 'repository',
  q: 'interface extension:ts',
  per_page: 30, // optional
  page: 1 // optional
});
```

### Git Data Writers

#### `createBranchFrom(options)`
Create a new branch from an existing ref.

```typescript
await repo.createBranchFrom({
  owner: 'username',
  repo: 'repository',
  newRef: 'feature/new-feature',
  fromRef: 'main'
});
```

#### `createTree(options)`
Create a new tree with files.

```typescript
const tree = await repo.createTree({
  owner: 'username',
  repo: 'repository',
  baseTreeSha: 'abc123...', // optional
  files: [
    {
      path: 'new-file.txt',
      content: 'Hello, world!',
      mode: '100644' // optional
    },
    {
      path: 'existing-file.txt',
      blobSha: 'def456...' // use existing blob
    }
  ]
});
```

#### `createCommit(options)`
Create a new commit.

```typescript
const commit = await repo.createCommit({
  owner: 'username',
  repo: 'repository',
  message: 'Add new feature',
  treeSha: 'abc123...',
  parentSha: 'def456...' // optional
});
```

#### `updateRef(options)`
Update a reference (branch) to point to a new commit.

```typescript
await repo.updateRef({
  owner: 'username',
  repo: 'repository',
  ref: 'feature/new-feature',
  sha: 'abc123...',
  force: false // optional
});
```

#### `openPR(options)`
Open a pull request.

```typescript
const pr = await repo.openPR({
  owner: 'username',
  repo: 'repository',
  base: 'main',
  head: 'feature/new-feature',
  title: 'Add new feature',
  body: 'Description of changes', // optional
  labels: ['enhancement'], // optional
  draft: false // optional
});
```

## Caching

The `RemoteRepo` class includes intelligent caching to minimize GitHub API rate limit usage:

- **ETag Support**: Uses `If-None-Match` headers to avoid re-downloading unchanged resources
- **In-Memory Tree Cache**: Caches path→SHA mappings for efficient file lookups
- **Configurable TTL**: Set cache time-to-live and maximum size

```typescript
const repo = new RemoteRepo(token, {
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 500 // max 500 cached responses
});

// Get cache statistics
const stats = repo.getCacheStats();
console.log(stats);

// Clear all caches
repo.clearCache();
```

## Examples

See `src/example.ts` for complete examples demonstrating:

1. Reading files by path@ref
2. Creating empty commits on new branches
3. Opening pull requests
4. Advanced tree and search operations

## License

MIT
