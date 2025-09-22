import { Octokit } from '@octokit/rest';
import type { PRStatus, PRCheck, DeploymentPreview } from './types';

export interface PRWatcherOptions {
  owner: string;
  repo: string;
  prNumber: number;
  pollInterval?: number; // milliseconds, default 30 seconds
}

export interface PRWatcherCallbacks {
  onPreviewReady?: (preview: DeploymentPreview) => void;
  onStatusUpdate?: (statuses: PRStatus[]) => void;
  onChecksUpdate?: (checks: PRCheck[]) => void;
  onError?: (error: Error) => void;
}

export class PRWatcher {
  private octokit: Octokit;
  private options: Required<PRWatcherOptions>;
  private callbacks: PRWatcherCallbacks;
  private intervalId: NodeJS.Timeout | null = null;
  private isWatching = false;
  private lastStatusUpdate: string = '';
  private lastChecksUpdate: string = '';

  constructor(octokit: Octokit, options: PRWatcherOptions, callbacks: PRWatcherCallbacks = {}) {
    this.octokit = octokit;
    this.options = {
      ...options,
      pollInterval: options.pollInterval || 30000, // 30 seconds default
    };
    this.callbacks = callbacks;
  }

  /**
   * Start watching the PR for status updates
   */
  start(): void {
    if (this.isWatching) {
      return;
    }

    this.isWatching = true;
    this.poll(); // Initial poll
    this.intervalId = setInterval(() => this.poll(), this.options.pollInterval);
  }

  /**
   * Stop watching the PR
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isWatching = false;
  }

  /**
   * Get current PR statuses
   */
  async getStatuses(): Promise<PRStatus[]> {
    try {
      const { data: pr } = await this.octokit.rest.pulls.get({
        owner: this.options.owner,
        repo: this.options.repo,
        pull_number: this.options.prNumber,
      });

      const { data: statuses } = await this.octokit.rest.repos.listCommitStatusesForRef({
        owner: this.options.owner,
        repo: this.options.repo,
        ref: pr.head.sha,
      });

      return statuses.map(status => ({
        state: status.state as PRStatus['state'],
        target_url: status.target_url,
        description: status.description,
        context: status.context,
        created_at: status.created_at,
        updated_at: status.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching PR statuses:', error);
      throw error;
    }
  }

  /**
   * Get current PR checks
   */
  async getChecks(): Promise<PRCheck[]> {
    try {
      const { data: pr } = await this.octokit.rest.pulls.get({
        owner: this.options.owner,
        repo: this.options.repo,
        pull_number: this.options.prNumber,
      });

      const { data: checkRuns } = await this.octokit.rest.checks.listForRef({
        owner: this.options.owner,
        repo: this.options.repo,
        ref: pr.head.sha,
      });

      return checkRuns.check_runs.map(check => ({
        id: check.id,
        name: check.name,
        status: check.status as PRCheck['status'],
        conclusion: check.conclusion as PRCheck['conclusion'],
        started_at: check.started_at,
        completed_at: check.completed_at,
        details_url: check.details_url,
        html_url: check.html_url,
      }));
    } catch (error) {
      console.error('Error fetching PR checks:', error);
      throw error;
    }
  }

  /**
   * Extract deployment preview URLs from statuses and checks
   */
  extractPreviewUrls(statuses: PRStatus[], checks: PRCheck[]): DeploymentPreview[] {
    const previews: DeploymentPreview[] = [];

    // Check statuses for preview URLs
    for (const status of statuses) {
      const preview = this.parsePreviewFromStatus(status);
      if (preview) {
        previews.push(preview);
      }
    }

    // Check checks for preview URLs
    for (const check of checks) {
      const preview = this.parsePreviewFromCheck(check);
      if (preview) {
        previews.push(preview);
      }
    }

    // Remove duplicates based on URL
    const uniquePreviews = previews.filter((preview, index, arr) => 
      arr.findIndex(p => p.url === preview.url) === index
    );

    return uniquePreviews;
  }

  /**
   * Parse preview URL from a status
   */
  private parsePreviewFromStatus(status: PRStatus): DeploymentPreview | null {
    if (!status.target_url) return null;

    // Vercel patterns
    if (status.context.toLowerCase().includes('vercel') || 
        status.target_url.includes('vercel.app') ||
        status.target_url.includes('vercel.com')) {
      return {
        url: status.target_url,
        provider: 'vercel',
        status: status.state === 'success' ? 'success' : 
               status.state === 'pending' ? 'pending' : 'failure',
        environment: this.extractEnvironmentFromUrl(status.target_url),
      };
    }

    // Netlify patterns
    if (status.context.toLowerCase().includes('netlify') ||
        status.target_url.includes('netlify.app') ||
        status.target_url.includes('netlify.com')) {
      return {
        url: status.target_url,
        provider: 'netlify',
        status: status.state === 'success' ? 'success' : 
               status.state === 'pending' ? 'pending' : 'failure',
        environment: this.extractEnvironmentFromUrl(status.target_url),
      };
    }

    // Generic deployment preview patterns
    if (status.description && 
        (status.description.toLowerCase().includes('preview') ||
         status.description.toLowerCase().includes('deploy'))) {
      return {
        url: status.target_url,
        provider: 'other',
        status: status.state === 'success' ? 'success' : 
               status.state === 'pending' ? 'pending' : 'failure',
        environment: this.extractEnvironmentFromUrl(status.target_url),
      };
    }

    return null;
  }

  /**
   * Parse preview URL from a check
   */
  private parsePreviewFromCheck(check: PRCheck): DeploymentPreview | null {
    if (!check.details_url && !check.html_url) return null;

    const url = check.details_url || check.html_url!;

    // Vercel patterns
    if (check.name.toLowerCase().includes('vercel') || 
        url.includes('vercel.app') ||
        url.includes('vercel.com')) {
      return {
        url,
        provider: 'vercel',
        status: check.conclusion === 'success' ? 'success' : 
               check.status === 'completed' ? 'failure' : 'pending',
        environment: this.extractEnvironmentFromUrl(url),
      };
    }

    // Netlify patterns
    if (check.name.toLowerCase().includes('netlify') ||
        url.includes('netlify.app') ||
        url.includes('netlify.com')) {
      return {
        url,
        provider: 'netlify',
        status: check.conclusion === 'success' ? 'success' : 
               check.status === 'completed' ? 'failure' : 'pending',
        environment: this.extractEnvironmentFromUrl(url),
      };
    }

    // Generic deployment preview patterns
    if (check.name.toLowerCase().includes('preview') ||
        check.name.toLowerCase().includes('deploy')) {
      return {
        url,
        provider: 'other',
        status: check.conclusion === 'success' ? 'success' : 
               check.status === 'completed' ? 'failure' : 'pending',
        environment: this.extractEnvironmentFromUrl(url),
      };
    }

    return null;
  }

  /**
   * Extract environment name from URL (e.g., "preview", "staging")
   */
  private extractEnvironmentFromUrl(url: string): string | undefined {
    // For Vercel: https://myapp-git-feature-branch-user.vercel.app
    if (url.includes('vercel.app')) {
      const match = url.match(/https:\/\/([^-]+)-git-([^-]+)-/);
      if (match) return 'preview';
    }

    // For Netlify: https://deploy-preview-123--mysite.netlify.app
    if (url.includes('netlify.app')) {
      if (url.includes('deploy-preview')) return 'preview';
      if (url.includes('branch-deploy')) return 'branch';
    }

    return undefined;
  }

  /**
   * Poll for updates
   */
  private async poll(): Promise<void> {
    try {
      const [statuses, checks] = await Promise.all([
        this.getStatuses(),
        this.getChecks(),
      ]);

      // Check if statuses have changed
      const statusesHash = JSON.stringify(statuses);
      if (statusesHash !== this.lastStatusUpdate) {
        this.lastStatusUpdate = statusesHash;
        this.callbacks.onStatusUpdate?.(statuses);
      }

      // Check if checks have changed
      const checksHash = JSON.stringify(checks);
      if (checksHash !== this.lastChecksUpdate) {
        this.lastChecksUpdate = checksHash;
        this.callbacks.onChecksUpdate?.(checks);
      }

      // Extract and notify about preview URLs
      const previews = this.extractPreviewUrls(statuses, checks);
      for (const preview of previews) {
        if (preview.status === 'success') {
          this.callbacks.onPreviewReady?.(preview);
        }
      }
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }
}
