import { useState, useEffect } from 'react';
import './SessionModals.css';

interface SessionCreationModalProps {
  currentUrl: string;
  onClose: () => void;
  onCreate: (homeUrl: string, ownerName: string) => Promise<void>;
}

export function SessionCreationModal({
  currentUrl,
  onClose,
  onCreate
}: SessionCreationModalProps) {
  const [ownerName, setOwnerName] = useState('Owner');
  const [homeUrl, setHomeUrl] = useState(currentUrl);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!homeUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreate(homeUrl.trim(), ownerName.trim() || 'Owner');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Session</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="owner-name">Your Name</label>
            <input
              id="owner-name"
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Owner"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="home-url">Home URL</label>
            <input
              id="home-url"
              type="text"
              value={homeUrl}
              onChange={(e) => setHomeUrl(e.target.value)}
              placeholder="https://example.com"
              className="form-input"
            />
            <p className="form-help">This URL will be shared with all participants</p>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="button-secondary" onClick={onClose} disabled={isCreating}>
            Cancel
          </button>
          <button
            className="button-primary"
            onClick={handleCreate}
            disabled={isCreating || !homeUrl.trim()}
          >
            {isCreating ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface JoinSessionModalProps {
  onClose: () => void;
  onJoin: (sessionId: string, name: string) => Promise<void>;
  sessionIdFromLink?: string;
}

export function JoinSessionModal({
  onClose,
  onJoin,
  sessionIdFromLink
}: JoinSessionModalProps) {
  const [sessionId, setSessionId] = useState(sessionIdFromLink || '');
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update sessionId when sessionIdFromLink changes
  useEffect(() => {
    if (sessionIdFromLink) {
      setSessionId(sessionIdFromLink);
    }
  }, [sessionIdFromLink]);

  const handleJoin = async () => {
    if (!sessionId.trim()) {
      setError('Please enter a session ID');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      await onJoin(sessionId.trim(), name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Join Session</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="join-name">Your Name</label>
            <input
              id="join-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="form-input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="join-session-id">Session ID</label>
            <input
              id="join-session-id"
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Enter session ID"
              className="form-input"
              disabled={!!sessionIdFromLink}
            />
            <p className="form-help">
              {sessionIdFromLink
                ? 'Session ID from link'
                : 'Enter the session ID from the share link'}
            </p>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="button-secondary" onClick={onClose} disabled={isJoining}>
            Cancel
          </button>
          <button
            className="button-primary"
            onClick={handleJoin}
            disabled={isJoining || !sessionId.trim() || !name.trim()}
          >
            {isJoining ? 'Joining...' : 'Join Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

