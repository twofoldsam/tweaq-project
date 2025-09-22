export interface RepoIdentifier {
  owner: string;
  repo: string;
}

export interface TreeEntry {
  path?: string;
  sha?: string;
  type?: 'blob' | 'tree';
  mode?: string;
  size?: number;
  url?: string;
}

export interface TreeData {
  sha: string;
  url: string;
  tree: TreeEntry[];
  truncated: boolean;
}

export interface BlobData {
  sha: string;
  content: string;
  encoding: string;
  size: number | null;
  url: string;
  node_id: string;
}

export interface FileContent {
  path: string;
  content: string;
  sha: string;
  size: number;
  encoding: 'base64' | 'utf-8';
}

export interface SearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{
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
  }>;
}

export interface CreateTreeFile {
  path: string;
  content?: string;
  blobSha?: string;
  mode?: '100644' | '100755' | '040000' | '160000' | '120000';
}

export interface CommitData {
  sha: string;
  url: string;
  message: string;
  tree: {
    sha: string;
    url: string;
  };
  parents: Array<{
    sha: string;
    url: string;
  }>;
}

export interface PullRequestData {
  id: number;
  number: number;
  url: string;
  html_url: string;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
}

export interface CacheEntry<T> {
  data: T;
  etag?: string;
  lastModified?: string;
  timestamp: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
}

export interface GetRepoTreeOptions extends RepoIdentifier {
  ref?: string;
  recursive?: boolean;
}

export interface ReadBlobOptions extends RepoIdentifier {
  sha: string;
}

export interface ReadFileOptions extends RepoIdentifier {
  path: string;
  ref?: string;
}

export interface SearchCodeOptions extends RepoIdentifier {
  q: string;
  sort?: 'indexed';
  order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface CreateBranchOptions extends RepoIdentifier {
  newRef: string;
  fromRef: string;
}

export interface CreateTreeOptions extends RepoIdentifier {
  baseTreeSha?: string;
  files: CreateTreeFile[];
}

export interface CreateCommitOptions extends RepoIdentifier {
  message: string;
  treeSha: string;
  parentSha?: string;
  parents?: string[];
}

export interface UpdateRefOptions extends RepoIdentifier {
  ref: string;
  sha: string;
  force?: boolean;
}

export interface OpenPROptions extends RepoIdentifier {
  base: string;
  head: string;
  title: string;
  body?: string;
  labels?: string[];
  draft?: boolean;
}
