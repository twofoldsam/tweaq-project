export interface AuthResult {
  token: string;
  user: {
    login: string;
    id: number;
    avatar_url: string;
    name?: string;
    email?: string;
  };
}

export interface PullRequestData {
  title: string;
  body: string;
  head: string;
  base: string;
  draft?: boolean;
}

export interface FileChange {
  path: string;
  content: string;
  action: 'create' | 'update' | 'delete';
}

export interface PRStatus {
  state: 'error' | 'failure' | 'pending' | 'success';
  target_url?: string | null;
  description?: string | null;
  context: string;
  created_at: string;
  updated_at: string;
}

export interface PRCheck {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | null | undefined;
  started_at?: string | null;
  completed_at?: string | null;
  details_url?: string | null;
  html_url?: string | null;
}

export interface DeploymentPreview {
  url: string;
  provider: 'vercel' | 'netlify' | 'other';
  status: 'pending' | 'success' | 'failure';
  environment?: string | undefined;
}
