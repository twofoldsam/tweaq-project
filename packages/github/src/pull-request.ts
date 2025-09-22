import { Octokit } from '@octokit/rest';
import type { PullRequestData, FileChange } from './types';

export class PullRequestManager {
  private octokit: Octokit;

  constructor(octokit: Octokit) {
    this.octokit = octokit;
  }

  async createPullRequest(
    owner: string,
    repo: string,
    prData: PullRequestData,
    changes: FileChange[]
  ): Promise<number> {
    // Get the default branch
    const { data: repository } = await this.octokit.rest.repos.get({
      owner,
      repo,
    });

    const defaultBranch = repository.default_branch;

    // Get the latest commit SHA from the default branch
    const { data: ref } = await this.octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });

    const latestCommitSha = ref.object.sha;

    // Create a new branch
    await this.octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${prData.head}`,
      sha: latestCommitSha,
    });

    // Apply file changes
    for (const change of changes) {
      if (change.action === 'create' || change.action === 'update') {
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: change.path,
          message: `Update ${change.path}`,
          content: Buffer.from(change.content).toString('base64'),
          branch: prData.head,
        });
      } else if (change.action === 'delete') {
        // Get the file to delete
        const { data: file } = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: change.path,
          ref: prData.head,
        });

        if ('sha' in file) {
          await this.octokit.rest.repos.deleteFile({
            owner,
            repo,
            path: change.path,
            message: `Delete ${change.path}`,
            sha: file.sha,
            branch: prData.head,
          });
        }
      }
    }

    // Create the pull request
    const createData: any = {
      owner,
      repo,
      title: prData.title,
      body: prData.body,
      head: prData.head,
      base: prData.base,
    };
    
    if (prData.draft !== undefined) {
      createData.draft = prData.draft;
    }
    
    const { data: pullRequest } = await this.octokit.rest.pulls.create(createData);

    return pullRequest.number;
  }

  async getPullRequest(owner: string, repo: string, pullNumber: number) {
    const { data } = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });

    return data;
  }
}
