export interface VisualEdit {
  id: string;
  type: 'text-change' | 'selection-replace' | 'insert' | 'delete';
  target: {
    file: string;
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
  };
  content: string;
  originalContent: string;
  timestamp: number;
}

export interface FileUpdate {
  path: string;
  content: string;
  action: 'create' | 'update' | 'delete';
  encoding?: 'utf8' | 'base64';
}

export interface ChangeContext {
  projectRoot: string;
  workingDirectory: string;
  gitBranch?: string;
  metadata?: Record<string, unknown>;
}

export interface SourceHint {
  owner: string;
  repo: string;
  ref: string;
  filePath: string;
  intent: string;
  targetElement?: string;
  tailwindChanges?: {
    fontSize?: string;
    spacing?: string;
    colors?: string;
    radius?: string;
    [key: string]: string | undefined;
  };
}

export interface PatchResult {
  fileUpdates: Array<{
    path: string;
    newContent: string;
  }>;
  changelogEntry?: string;
}

export interface PrepareFilesOptions {
  owner: string;
  repo: string;
  ref: string;
  hints: SourceHint[];
}

// Define interface for file reader to avoid circular dependency
export interface FileReader {
  readFile(options: { owner: string; repo: string; path: string; ref?: string }): Promise<string>;
}

// Define interface for LLM provider to avoid circular dependency
export interface LLMProvider {
  generateCodeChanges(options: {
    fileContent: string;
    filePath: string;
    intent: string;
    targetElement?: string;
    context?: string;
  }): Promise<{
    success: boolean;
    modifiedContent?: string;
    error?: string;
  }>;
}
