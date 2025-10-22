import { useState, useEffect } from 'react';
import './GitHubSettings.css';
import { PRPreview } from './PRPreview';

interface Repository {
  full_name: string;
  name: string;
  owner: string;
  default_branch: string;
  private: boolean;
  description: string;
  updated_at: string;
}

interface GitHubSettingsProps {
  authState: {
    isAuthenticated: boolean;
    user: GitHubUser | null;
    loading: boolean;
  };
  onAuthStateChange: (state: {
    isAuthenticated: boolean;
    user: GitHubUser | null;
    loading: boolean;
  }) => void;
}

export function GitHubSettings({ authState, onAuthStateChange }: GitHubSettingsProps) {
  const { isAuthenticated, user } = authState;
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [config, setConfig] = useState<GitHubConfig>({
    owner: '',
    repo: '',
    baseBranch: 'main',
    label: 'design-qa'
  });
  const [loading, setLoading] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [prNumber, setPrNumber] = useState<number | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisStatus, setAnalysisStatus] = useState<any>(null);
  const [codexStatus, setCodexStatus] = useState<{ enabled: boolean; connectedAt: string | null }>({ enabled: false, connectedAt: null });
  const [codexLoading, setCodexLoading] = useState(false);

  useEffect(() => {
    loadConfig();
    if (isAuthenticated && user) {
      loadRepositories();
      loadAnalysisStatus();
    }
  }, [isAuthenticated, user]);

  // Re-check config when repositories are loaded
  useEffect(() => {
    if (repositories.length > 0) {
      loadConfig();
    }
  }, [repositories]);

  useEffect(() => {
    (async () => {
      try {
        const s = await window.electronAPI.codexGetStatus();
        setCodexStatus(s);
      } catch {}
    })();
  }, []);

  const checkAuthStatus = async () => {
    try {
      onAuthStateChange({ ...authState, loading: true });
      
      // Check authentication status (this will also try to load stored token)
      const authenticated = await window.electronAPI.githubIsAuthenticated();
      
      if (authenticated) {
        const result = await window.electronAPI.githubLoadStoredToken();
        if (result.success && result.user) {
          onAuthStateChange({
            isAuthenticated: true,
            user: result.user,
            loading: false
          });
          loadRepositories();
          console.log('GitHub authentication status verified, user logged in');
        } else {
          onAuthStateChange({
            isAuthenticated: false,
            user: null,
            loading: false
          });
        }
      } else {
        onAuthStateChange({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      onAuthStateChange({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  };

  const loadConfig = async () => {
    try {
      const savedConfig = await window.electronAPI.githubGetConfig();
      if (savedConfig) {
        setConfig(savedConfig);
        // Find and set the selected repo if it exists
        const repo = repositories.find(r => r.owner === savedConfig.owner && r.name === savedConfig.repo);
        if (repo) {
          setSelectedRepo(repo);
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const loadRepositories = async () => {
    setLoadingRepos(true);
    try {
      const result = await window.electronAPI.githubListRepos();
      if (result.success && result.repos) {
        setRepositories(result.repos);
      } else {
        setError(result.error || 'Failed to load repositories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      onAuthStateChange({ ...authState, loading: true });
      
      const result = await window.electronAPI.githubConnect();
      if (result.success && result.user) {
        onAuthStateChange({
          isAuthenticated: true,
          user: result.user,
          loading: false
        });
        setSuccess('Successfully connected to GitHub!');
        loadRepositories();
      } else {
        onAuthStateChange({
          isAuthenticated: false,
          user: null,
          loading: false
        });
        setError(result.error || 'Failed to connect to GitHub');
      }
    } catch (err) {
      onAuthStateChange({
        isAuthenticated: false,
        user: null,
        loading: false
      });
      setError(err instanceof Error ? err.message : 'Failed to connect to GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await window.electronAPI.githubDisconnect();
      if (result.success) {
        onAuthStateChange({
          isAuthenticated: false,
          user: null,
          loading: false
        });
        setSuccess('Disconnected from GitHub');
      } else {
        setError(result.error || 'Failed to disconnect from GitHub');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect from GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await window.electronAPI.githubSaveConfig(config);
      if (result.success) {
        setSuccess('Configuration saved successfully!');
      } else {
        setError(result.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPR = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await window.electronAPI.githubTestPR();
      if (result.success && result.pr) {
        setSuccess(`Test PR created successfully! PR #${result.pr.number}: ${result.pr.url}`);
      } else {
        setError(result.error || 'Failed to create test PR');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test PR');
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelection = (repo: Repository) => {
    setSelectedRepo(repo);
    setConfig(prev => ({
      ...prev,
      owner: repo.owner,
      repo: repo.name,
      baseBranch: repo.default_branch
    }));
  };

  const handleConfigChange = (field: keyof GitHubConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const loadAnalysisStatus = async () => {
    try {
      const status = await window.electronAPI.getAnalysisStatus();
      setAnalysisStatus(status);
    } catch (err) {
      console.error('Error loading analysis status:', err);
    }
  };

  const handleAnalyzeRepository = async () => {
    setAnalysisLoading(true);
    setError(null);
    setSuccess(null);
    setAnalysisResult(null);

    try {
      const result = await window.electronAPI.analyzeRepository();
      if (result.success && result.model) {
        setAnalysisResult(result.model);
        setSuccess('Repository analysis completed successfully!');
        await loadAnalysisStatus(); // Refresh status
      } else {
        setError(result.error || 'Failed to analyze repository');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze repository');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleReAnalyzeRepository = async () => {
    setAnalysisLoading(true);
    setError(null);
    setSuccess(null);
    setAnalysisResult(null);

    try {
      // Clear existing analysis status first
      setAnalysisStatus(null);
      
      const result = await window.electronAPI.reAnalyzeRepository();
      if (result.success && result.model) {
        setAnalysisResult(result.model);
        setSuccess('Repository re-analysis completed successfully! Cache has been refreshed.');
        await loadAnalysisStatus(); // Refresh status
      } else {
        setError(result.error || 'Failed to re-analyze repository');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-analyze repository');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleCodexOpen = async () => {
    setCodexLoading(true);
    try {
      await window.electronAPI.codexOpenSetup();
    } finally {
      setCodexLoading(false);
    }
  };

  const handleCodexMarkConnected = async () => {
    setCodexLoading(true);
    try {
      const res = await window.electronAPI.codexMarkConnected();
      if (res.success) {
        const s = await window.electronAPI.codexGetStatus();
        setCodexStatus(s);
        setSuccess('Codex connected and saved. You only need to do this once.');
      } else {
        setError(res.error || 'Failed to save Codex connection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Codex connection');
    } finally {
      setCodexLoading(false);
    }
  };

  return (
    <div className="github-settings">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Authentication Section */}
      <div className="settings-section">
        <h3>Authentication</h3>
        {isAuthenticated && user ? (
          <div className="auth-status">
            <div className="user-info">
              <img src={user.avatar_url} alt="Avatar" className="user-avatar" />
              <div className="user-details">
                <div className="user-name">{user.name || user.login}</div>
                <div className="user-login">@{user.login}</div>
              </div>
            </div>
            <button 
              onClick={handleDisconnect}
              disabled={loading}
              className="disconnect-button"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <div className="auth-status">
            <p>Not connected to GitHub</p>
            <button 
              onClick={handleConnect}
              disabled={loading}
              className="connect-button"
            >
              {loading ? 'Connecting...' : 'Connect GitHub'}
            </button>
          </div>
        )}
      </div>

      {/* Repository Configuration */}
      <div className="settings-section">
        <h3>Repository Configuration</h3>
        {isAuthenticated ? (
          <div className="config-form">
            <div className="form-group">
              <label htmlFor="repository">Repository</label>
              {loadingRepos ? (
                <div className="loading-repos">Loading repositories...</div>
              ) : (
                <select
                  id="repository"
                  value={selectedRepo?.full_name || ''}
                  onChange={(e) => {
                    const repo = repositories.find(r => r.full_name === e.target.value);
                    if (repo) handleRepoSelection(repo);
                  }}
                  className="repo-select"
                >
                  <option value="">Select a repository</option>
                  {repositories.map((repo) => (
                    <option key={repo.full_name} value={repo.full_name}>
                      {repo.full_name} {repo.private ? '(Private)' : '(Public)'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedRepo && (
              <>
                <div className="repo-info">
                  <div className="repo-details">
                    <strong>{selectedRepo.full_name}</strong>
                    <p>{selectedRepo.description || 'No description'}</p>
                    <p>Default branch: <code>{selectedRepo.default_branch}</code></p>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="baseBranch">Base Branch</label>
                  <input
                    id="baseBranch"
                    type="text"
                    value={config.baseBranch}
                    onChange={(e) => handleConfigChange('baseBranch', e.target.value)}
                    placeholder="e.g., main"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="label">Label</label>
                  <input
                    id="label"
                    type="text"
                    value={config.label}
                    onChange={(e) => handleConfigChange('label', e.target.value)}
                    placeholder="e.g., design-qa"
                  />
                </div>
                
                <button 
                  onClick={handleSaveConfig}
                  disabled={loading || !selectedRepo}
                  className="save-button"
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </>
            )}
          </div>
        ) : (
          <p>Please connect to GitHub first to see your repositories.</p>
        )}
      </div>

      {/* Repository Analysis Section */}
      {isAuthenticated && config.owner && config.repo && (
        <div className="settings-section">
          <h3>Repository Analysis</h3>
          <p>Analyze your repository to build symbolic representations for better visual-to-code mapping.</p>
          
          {analysisStatus?.hasAnalysis && (
            <div className="analysis-status">
              <div className="status-info">
                <strong>Current Analysis:</strong>
                <div>Repository: {analysisStatus.repoId}</div>
                <div>Analyzed: {new Date(analysisStatus.analyzedAt).toLocaleString()}</div>
                <div>Components: {analysisStatus.componentsCount}</div>
                <div>Rules: {analysisStatus.rulesCount}</div>
              </div>
            </div>
          )}
          
          <div className="analysis-buttons">
            <button 
              onClick={handleAnalyzeRepository}
              disabled={analysisLoading || !isAuthenticated || !config.owner || !config.repo}
              className="analyze-button"
            >
              {analysisLoading ? 'Analyzing Repository...' : 'Analyze Repository'}
            </button>
            
            {analysisStatus?.hasAnalysis && (
              <button 
                onClick={handleReAnalyzeRepository}
                disabled={analysisLoading || !isAuthenticated || !config.owner || !config.repo}
                className="analyze-button reanalyze-button"
                title="Force re-analysis and clear cache"
              >
                {analysisLoading ? 'Re-analyzing...' : 'Re-analyze (Clear Cache)'}
              </button>
            )}
          </div>
          
          {analysisResult && (
            <div className="analysis-results">
              <h4>Analysis Results</h4>
              <div className="analysis-summary">
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-label">Framework:</span>
                    <span className="stat-value">{analysisResult.primaryFramework}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Styling:</span>
                    <span className="stat-value">{analysisResult.stylingApproach}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Components:</span>
                    <span className="stat-value">{analysisResult.componentsCount}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Transform Rules:</span>
                    <span className="stat-value">{analysisResult.transformationRulesCount}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">DOM Mappings:</span>
                    <span className="stat-value">{analysisResult.domMappingsCount}</span>
                  </div>
                </div>
              </div>
              
              <div className="analysis-details">
                <div className="detail-section">
                  <h5>Components Found</h5>
                  <div className="component-list">
                    {(analysisResult.components || []).slice(0, 10).map((comp: any, index: number) => (
                      <div key={index} className="component-item">
                        <div className="component-name">{comp.name}</div>
                        <div className="component-path">{comp.filePath}</div>
                        <div className="component-meta">
                          {comp.framework} • {comp.domElementsCount} elements • {comp.stylingApproach}
                        </div>
                        {comp.classes && comp.classes.length > 0 && (
                          <div className="component-classes">
                            Classes: {comp.classes.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                    {(analysisResult.components || []).length > 10 && (
                      <div className="more-items">
                        ... and {analysisResult.components.length - 10} more components
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="detail-section">
                  <h5>DOM Mappings (Top 10)</h5>
                  <div className="mapping-list">
                    {(analysisResult.domMappings || []).map((mapping: any, index: number) => (
                      <div key={index} className="mapping-item">
                        <div className="mapping-selector">{mapping.selector}</div>
                        <div className="mapping-target">
                          → {mapping.mappings?.[0]?.componentName} ({mapping.mappings?.[0]?.filePath})
                        </div>
                        <div className="mapping-confidence">
                          Confidence: {((mapping.mappings?.[0]?.confidence || 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="detail-section">
                  <h5>Transformation Rules (Top 20)</h5>
                  <div className="rules-list">
                    {(analysisResult.transformationRules || []).map((rule: any, index: number) => (
                      <div key={index} className="rule-item">
                        <div className="rule-selector">{rule.selector}</div>
                        <div className="rule-transform">
                          {rule.action}: {rule.fromValue} → {rule.toValue}
                        </div>
                        <div className="rule-meta">
                          {rule.property} • {rule.filePath} • {(rule.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Codex Integration */}
      {isAuthenticated && (
        <div className="settings-section">
          <h3>Codex Integration</h3>
          <p>Delegate code edits to OpenAI Codex. This requires a one-time connection in Codex.</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleCodexOpen}
              disabled={codexLoading}
              className="analyze-button"
            >
              {codexLoading ? 'Opening Codex…' : (codexStatus.enabled ? 'Reopen Codex' : 'Connect Codex')}
            </button>
            {!codexStatus.enabled && (
              <button
                onClick={handleCodexMarkConnected}
                disabled={codexLoading}
                className="analyze-button"
              >
                {codexLoading ? 'Saving…' : "I've connected Codex"}
              </button>
            )}
            {codexStatus.enabled && (
              <span style={{ fontSize: 12, color: '#198754' }}>
                Connected{codexStatus.connectedAt ? ` • ${new Date(codexStatus.connectedAt).toLocaleString()}` : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Test Section */}
      <div className="settings-section">
        <h3>Test Integration</h3>
        <p>Create a test PR to verify your GitHub integration is working correctly.</p>
        <button 
          onClick={handleTestPR}
          disabled={loading || !isAuthenticated || !config.owner || !config.repo}
          className="test-button"
        >
          {loading ? 'Creating Test PR...' : 'Create Test PR'}
        </button>
      </div>

      {/* PR Preview Section */}
      {isAuthenticated && config.owner && config.repo && (
        <div className="settings-section">
          <h3>PR Preview Monitor</h3>
          <p>Monitor deployment previews for pull requests (Vercel, Netlify, etc.)</p>
          
          <div className="form-group">
            <label htmlFor="prNumber">PR Number (optional)</label>
            <input
              id="prNumber"
              type="number"
              value={prNumber || ''}
              onChange={(e) => setPrNumber(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g., 123"
              min="1"
            />
            <small>Enter a PR number to monitor its deployment previews</small>
          </div>

          {prNumber && (
            <PRPreview 
              owner={config.owner}
              repo={config.repo}
              prNumber={prNumber}
            />
          )}
        </div>
      )}
    </div>
  );
}
