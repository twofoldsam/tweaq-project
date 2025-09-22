import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { Octokit } from '@octokit/rest';
import type { AuthResult } from './types';

export class GitHubAuth {
  private clientId: string;
  private octokit: Octokit | null = null;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  async authenticate(): Promise<AuthResult> {
    const auth = createOAuthDeviceAuth({
      clientType: 'oauth-app',
      clientId: this.clientId,
      onVerification: (verification) => {
        console.log('Open this URL:', verification.verification_uri);
        console.log('Enter code:', verification.user_code);
      },
    });

    const { token } = await auth({
      type: 'oauth',
    });

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

  getOctokit(): Octokit {
    if (!this.octokit) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }
    return this.octokit;
  }
}
