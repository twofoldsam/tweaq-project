export { GitHubAuth } from './auth';
export { PullRequestManager } from './pull-request';
export { GitClient } from './client';
export { PRWatcher } from './pr-watcher';
export type { AuthResult, PullRequestData, PRStatus, PRCheck, DeploymentPreview } from './types';
export type { EnsureBranchAndCommitOptions, OpenPROptions, PRResult } from './client';
export type { PRWatcherOptions, PRWatcherCallbacks } from './pr-watcher';
