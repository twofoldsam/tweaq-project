import React, { useState, useEffect } from 'react';
import { 
  detectProjectContext, 
  generatePullRequestDiff,
  type GitHubContextInfo
} from '../utils/githubIntegration';
import type { VisualEdit } from '../types';

interface GitHubIntegrationExampleProps {
  owner: string;
  repo: string;
  branch?: string;
  visualEdits: VisualEdit[];
}

/**
 * Example component showing how to integrate GitHub context 
 * for enhanced preview accuracy
 */
const GitHubIntegrationExample: React.FC<GitHubIntegrationExampleProps> = ({
  owner,
  repo,
  branch = 'main',
  visualEdits,
}) => {
  const [context, setContext] = useState<GitHubContextInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pullRequestDiff, setPullRequestDiff] = useState<string>('');

  useEffect(() => {
    const fetchContext = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const detectedContext = await detectProjectContext(owner, repo, branch);
        setContext(detectedContext);
        
        // Generate PR diff if we have visual edits
        if (visualEdits.length > 0) {
          const diff = generatePullRequestDiff(visualEdits, detectedContext);
          setPullRequestDiff(diff);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to detect project context');
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [owner, repo, branch, visualEdits]);

  const handleCreatePullRequest = async () => {
    if (!context || visualEdits.length === 0) return;
    
    // This would integrate with the GitHub package to actually create a PR
    console.log('Creating pull request with context:', context);
    console.log('Visual edits:', visualEdits);
    console.log('Generated diff:', pullRequestDiff);
    
    // Example of how you might use the GitHub client:
    // const { GitClient } = await import('@tweaq/github');
    // const client = new GitClient('your-client-id');
    // await client.connectDeviceFlow();
    // 
    // const files = [{
    //   path: 'styles/generated-edits.css',
    //   content: generateCSSFromVisualEdits(visualEdits, context)
    // }];
    // 
    // await client.ensureBranchAndCommit({
    //   owner,
    //   repo,
    //   base: branch,
    //   branch: `visual-edits-${Date.now()}`,
    //   files
    // });
  };

  if (loading) {
    return (
      <div className="github-integration-example loading">
        <div className="loading-spinner">🔄</div>
        <p>Detecting project context...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="github-integration-example error">
        <div className="error-icon">❌</div>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="github-integration-example empty">
        <p>No context available</p>
      </div>
    );
  }

  return (
    <div className="github-integration-example">
      <div className="context-info">
        <h3>🔍 Project Context Detected</h3>
        <div className="context-grid">
          <div className="context-item">
            <strong>Repository:</strong> {context.owner}/{context.repo}
          </div>
          <div className="context-item">
            <strong>Branch:</strong> {context.branch}
          </div>
          <div className="context-item">
            <strong>Project Type:</strong> 
            <span className={`badge ${context.projectType}`}>
              {context.projectType}
            </span>
          </div>
          <div className="context-item">
            <strong>CSS Framework:</strong>
            <span className={`badge ${context.cssFramework}`}>
              {context.cssFramework}
            </span>
          </div>
        </div>
      </div>

      {visualEdits.length > 0 && (
        <div className="visual-edits-summary">
          <h4>📝 Visual Edits ({visualEdits.length})</h4>
          <div className="edits-list">
            {visualEdits.map((edit, index) => (
              <div key={edit.id} className="edit-item">
                <div className="edit-header">
                  <span className="edit-number">#{index + 1}</span>
                  <code className="edit-selector">{edit.element.selector}</code>
                  <span className="edit-timestamp">
                    {new Date(edit.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="edit-changes">
                  {edit.changes.map((change: any, changeIndex: number) => (
                    <div key={changeIndex} className="change-item">
                      <span className="change-property">{change.property}:</span>
                      <span className="change-before">{change.before}</span>
                      <span className="change-arrow">→</span>
                      <span className="change-after">{change.after}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pullRequestDiff && (
        <div className="pull-request-preview">
          <h4>🚀 Pull Request Preview</h4>
          <pre className="diff-preview">{pullRequestDiff}</pre>
          <button 
            className="create-pr-button"
            onClick={handleCreatePullRequest}
            disabled={visualEdits.length === 0}
          >
            Create Pull Request
          </button>
        </div>
      )}

      <style>{`
        .github-integration-example {
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .loading, .error, .empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px;
          text-align: center;
        }

        .loading-spinner {
          font-size: 24px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .context-info {
          margin-bottom: 24px;
        }

        .context-info h3 {
          margin: 0 0 12px 0;
          color: #333;
        }

        .context-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .context-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: white;
          border-radius: 4px;
          font-size: 14px;
        }

        .badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .badge.react { background: #61dafb; color: #000; }
        .badge.vue { background: #4fc08d; color: #fff; }
        .badge.angular { background: #dd0031; color: #fff; }
        .badge.tailwind { background: #38bdf8; color: #fff; }
        .badge.bootstrap { background: #7952b3; color: #fff; }
        .badge.unknown { background: #6c757d; color: #fff; }

        .visual-edits-summary {
          margin-bottom: 24px;
        }

        .visual-edits-summary h4 {
          margin: 0 0 12px 0;
          color: #333;
        }

        .edits-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .edit-item {
          background: white;
          border-radius: 6px;
          padding: 12px;
          border-left: 4px solid #007acc;
        }

        .edit-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .edit-number {
          background: #007acc;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .edit-selector {
          background: #f1f3f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 12px;
        }

        .edit-timestamp {
          margin-left: auto;
          font-size: 12px;
          color: #666;
        }

        .edit-changes {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .change-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-family: 'SF Mono', Monaco, monospace;
        }

        .change-property {
          color: #d73a49;
          font-weight: 500;
        }

        .change-before {
          color: #e36209;
          background: #fff5b4;
          padding: 1px 4px;
          border-radius: 2px;
        }

        .change-arrow {
          color: #666;
        }

        .change-after {
          color: #28a745;
          background: #d4edda;
          padding: 1px 4px;
          border-radius: 2px;
        }

        .pull-request-preview {
          background: white;
          border-radius: 6px;
          padding: 16px;
        }

        .pull-request-preview h4 {
          margin: 0 0 12px 0;
          color: #333;
        }

        .diff-preview {
          background: #f6f8fa;
          border: 1px solid #d0d7de;
          border-radius: 6px;
          padding: 16px;
          margin: 12px 0;
          font-size: 12px;
          line-height: 1.4;
          overflow-x: auto;
          white-space: pre-wrap;
        }

        .create-pr-button {
          background: #238636;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .create-pr-button:hover:not(:disabled) {
          background: #2ea043;
        }

        .create-pr-button:disabled {
          background: #8c959f;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default GitHubIntegrationExample;
