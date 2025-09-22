import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { Octokit } from '@octokit/rest';
import * as keytar from 'keytar';
import type { AuthResult } from './types';

const SERVICE_NAME = 'smart-qa-github';
const ACCOUNT_NAME = 'github-token';

export interface EnsureBranchAndCommitOptions {
  owner: string;
  repo: string;
  base: string;
  branch: string;
  files: Array<{ path: string; content: string }>;
}

export interface OpenPROptions {
  owner: string;
  repo: string;
  base?: string;
  head: string;
  title: string;
  body: string;
  labels?: string[];
}

export interface PRResult {
  url: string;
  number: number;
}

export class GitClient {
  protected clientId: string;
  private octokit: Octokit | null = null;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  /**
   * Opens device flow in the OS browser and stores token securely via keytar
   */
  async connectDeviceFlow(): Promise<AuthResult> {
    const auth = createOAuthDeviceAuth({
      clientType: 'oauth-app',
      clientId: this.clientId,
      onVerification: (verification) => {
        // This callback is used by the main process to handle device flow
        // The URL opening and user code display will be handled by the main process
        console.log('Verification URL:', verification.verification_uri);
        console.log('Enter code:', verification.user_code);
      },
    });

    const { token } = await auth({
      type: 'oauth',
    });

    // Store token securely using keytar
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);

    this.octokit = new Octokit({
      auth: token,
    });

    const { data: user } = await this.octokit.rest.users.getAuthenticated();

    return {
      token,
      user: {
        login: user.login,
        id: user.id,
        avatar_url: user.avatar_url,
        ...(user.name && { name: user.name }),
        ...(user.email && { email: user.email }),
      },
    };
  }

  /**
   * Load stored token from keytar and initialize Octokit
   */
  async loadStoredToken(): Promise<boolean> {
    try {
      const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      if (!token) {
        return false;
      }

      this.octokit = new Octokit({
        auth: token,
      });

      // Verify the token is still valid
      await this.octokit.rest.users.getAuthenticated();
      return true;
    } catch (error) {
      // Token might be invalid, clear it
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      this.octokit = null;
      return false;
    }
  }

  /**
   * Clear stored token
   */
  async clearStoredToken(): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    this.octokit = null;
  }

  /**
   * Creates/updates a branch with provided files (UTF-8 text), commits, pushes
   */
  async ensureBranchAndCommit(options: EnsureBranchAndCommitOptions): Promise<void> {
    if (!this.octokit) {
      throw new Error('Not authenticated. Call connectDeviceFlow() first.');
    }

    const { owner, repo, base, branch, files } = options;

    try {
      // Get the base branch reference
      const { data: baseRef } = await this.octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${base}`,
      });

      const baseSha = baseRef.object.sha;

      // Try to get existing branch, create if it doesn't exist
      try {
        await this.octokit.rest.git.getRef({
          owner,
          repo,
          ref: `heads/${branch}`,
        });

        // Update the branch to point to the latest base
        await this.octokit.rest.git.updateRef({
          owner,
          repo,
          ref: `heads/${branch}`,
          sha: baseSha,
        });
      } catch (error: any) {
        if (error.status === 404) {
          // Branch doesn't exist, create it
          await this.octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${branch}`,
            sha: baseSha,
          });
        } else {
          throw error;
        }
      }

      // Get the base tree
      const { data: baseCommit } = await this.octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: baseSha,
      });

      // Create blobs for all files
      const tree = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await this.octokit!.rest.git.createBlob({
            owner,
            repo,
            content: Buffer.from(file.content, 'utf8').toString('base64'),
            encoding: 'base64',
          });

          return {
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.sha,
          };
        })
      );

      // Create tree
      const { data: newTree } = await this.octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: baseCommit.tree.sha,
        tree,
      });

      // Create commit
      const { data: newCommit } = await this.octokit.rest.git.createCommit({
        owner,
        repo,
        message: `Update files via Smart QA`,
        tree: newTree.sha,
        parents: [baseSha],
      });

      // Update branch reference to point to new commit
      await this.octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });

    } catch (error) {
      console.error('Error in ensureBranchAndCommit:', error);
      throw error;
    }
  }

  /**
   * Opens a PR and returns PR URL/number
   */
  async openPR(options: OpenPROptions): Promise<PRResult> {
    if (!this.octokit) {
      throw new Error('Not authenticated. Call connectDeviceFlow() first.');
    }

    const { owner, repo, base = 'main', head, title, body, labels = [] } = options;

    try {
      // Create the pull request
      const { data: pullRequest } = await this.octokit.rest.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base,
      });

      // Add labels if provided
      if (labels.length > 0) {
        await this.octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number: pullRequest.number,
          labels,
        });
      }

      return {
        url: pullRequest.html_url,
        number: pullRequest.number,
      };
    } catch (error) {
      console.error('Error in openPR:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getAuthenticatedUser() {
    if (!this.octokit) {
      throw new Error('Not authenticated. Call connectDeviceFlow() first.');
    }

    const { data: user } = await this.octokit.rest.users.getAuthenticated();
    return user;
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return this.octokit !== null;
  }

  /**
   * Get the underlying Octokit instance
   */
  getOctokit(): Octokit {
    if (!this.octokit) {
      throw new Error('Not authenticated. Call connectDeviceFlow() first.');
    }
    return this.octokit;
  }
}
