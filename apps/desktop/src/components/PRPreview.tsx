import { useState, useEffect } from 'react';
import './PRPreview.css';

interface DeploymentPreview {
  url: string;
  provider: 'vercel' | 'netlify' | 'other';
  status: 'pending' | 'success' | 'failure';
  environment?: string;
}

interface PRPreviewProps {
  owner?: string;
  repo?: string;
  prNumber?: number;
  className?: string;
}

export function PRPreview({ owner, repo, prNumber, className }: PRPreviewProps) {
  const [watcherKey, setWatcherKey] = useState<string | null>(null);
  const [previews, setPreviews] = useState<DeploymentPreview[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!owner || !repo || !prNumber) return;

    const startWatcher = async () => {
      try {
        setError(null);
        const result = await window.electronAPI.prWatcherStart({
          owner,
          repo,
          prNumber,
        });

        if (result.success && result.watcherKey) {
          setWatcherKey(result.watcherKey);
          setIsWatching(true);
        } else {
          setError(result.error || 'Failed to start PR watcher');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start PR watcher');
      }
    };

    startWatcher();

    return () => {
      if (watcherKey) {
        window.electronAPI.prWatcherStop(watcherKey);
        setIsWatching(false);
        setWatcherKey(null);
      }
    };
  }, [owner, repo, prNumber]);

  useEffect(() => {
    // Listen for preview URL updates
    const cleanupPreviewReady = window.electronAPI.onPreviewUrlReady((data) => {
      if (data.prKey === watcherKey) {
        setPreviews(data.allPreviews);
      }
    });

    const cleanupError = window.electronAPI.onPRWatcherError((data) => {
      if (data.prKey === watcherKey) {
        setError(data.error);
      }
    });

    return () => {
      cleanupPreviewReady();
      cleanupError();
    };
  }, [watcherKey]);

  const handleShowPreview = async (previewUrl: string) => {
    try {
      const result = await window.electronAPI.showPreviewPane(previewUrl);
      if (result.success) {
        setShowPreview(true);
      } else {
        setError(result.error || 'Failed to show preview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to show preview');
    }
  };

  const handleHidePreview = async () => {
    try {
      const result = await window.electronAPI.hidePreviewPane();
      if (result.success) {
        setShowPreview(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hide preview');
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'vercel':
        return '▲';
      case 'netlify':
        return '◆';
      default:
        return '🌐';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failure':
        return '❌';
      case 'pending':
        return '🔄';
      default:
        return '⏳';
    }
  };

  if (!owner || !repo || !prNumber) {
    return (
      <div className={`pr-preview ${className || ''}`}>
        <div className="pr-preview-placeholder">
          <p>No PR specified for preview monitoring</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`pr-preview ${className || ''}`}>
      <div className="pr-preview-header">
        <h3>PR #{prNumber} Previews</h3>
        <div className="pr-preview-status">
          {isWatching && (
            <span className="watching-indicator">
              <span className="pulse"></span>
              Watching for deployments
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="pr-preview-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {previews.length > 0 && (
        <div className="pr-preview-list">
          {previews.map((preview, index) => (
            <div key={`${preview.url}-${index}`} className="pr-preview-item">
              <div className="preview-info">
                <div className="preview-provider">
                  <span className="provider-icon">{getProviderIcon(preview.provider)}</span>
                  <span className="provider-name">
                    {preview.provider.charAt(0).toUpperCase() + preview.provider.slice(1)}
                  </span>
                  {preview.environment && (
                    <span className="preview-environment">({preview.environment})</span>
                  )}
                </div>
                <div className="preview-status">
                  <span className="status-icon">{getStatusIcon(preview.status)}</span>
                  <span className="status-text">{preview.status}</span>
                </div>
              </div>
              
              {preview.status === 'success' && (
                <div className="preview-actions">
                  <button
                    className="preview-button"
                    onClick={() => handleShowPreview(preview.url)}
                    title="Open preview in right pane"
                  >
                    Code Preview (Cloud)
                  </button>
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link"
                    title="Open in external browser"
                  >
                    🔗
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showPreview && (
        <div className="pr-preview-controls">
          <button
            className="hide-preview-button"
            onClick={handleHidePreview}
          >
            Hide Preview Pane
          </button>
        </div>
      )}

      {previews.length === 0 && isWatching && !error && (
        <div className="pr-preview-empty">
          <div className="empty-icon">🔍</div>
          <p>Waiting for deployment previews...</p>
          <small>
            Monitoring for Vercel, Netlify, and other deployment providers.
          </small>
        </div>
      )}
    </div>
  );
}
