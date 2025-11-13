import { useState, useEffect } from 'react';
import './SessionPanel.css';

interface Participant {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

interface CompletedSession {
  id: string;
  homeUrl: string;
  createdAt: number;
  endedAt?: number;
  commentCount: number;
  participantCount: number;
  ownerId: string;
}

interface SessionPanelProps {
  sessionId?: string | null;
  shareLink?: string | null;
  homeUrl?: string | null;
  participants?: Participant[];
  onEndSession?: () => void;
  onCopyLink?: () => void;
  onCreateSession?: () => void;
  onJoinSession?: () => void;
  startTime?: number;
  completedSessions?: CompletedSession[];
  selectedCompletedSessionId?: string | null;
  sessionComments?: any[]; // Comments for the selected completed session
  onSelectCompletedSession?: (sessionId: string) => void;
  onViewReport?: (sessionId: string) => void;
  onCommentClick?: (comment: any) => void; // Handler for clicking on a comment
}

export function SessionPanel({
  sessionId,
  shareLink,
  homeUrl,
  participants = [],
  onEndSession,
  onCopyLink,
  onCreateSession,
  onJoinSession,
  startTime,
  completedSessions = [],
  selectedCompletedSessionId,
  sessionComments = [],
  onSelectCompletedSession,
  onViewReport,
  onCommentClick
}: SessionPanelProps) {
  const [sessionDuration, setSessionDuration] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  // Always call hooks in the same order - move useEffect before early return
  useEffect(() => {
    if (!startTime || !sessionId) return;
    
    const updateDuration = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setSessionDuration(elapsed);
    };
    
    updateDuration(); // Initial update
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [startTime, sessionId]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink || '');
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      onCopyLink?.();
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  // Active session view
  if (sessionId) {
    return (
      <>
        <div className="panel-header">
          <h3>Session</h3>
        </div>
        <div className="panel-content">
          <div className="session-status-badge" style={{ marginBottom: '20px' }}>
            <span className="status-dot"></span>
            <span>Live</span>
          </div>
          {/* Session Info */}
          <div className="session-info-section">
            <div className="session-info-item">
              <span className="info-label">Duration</span>
              <span className="info-value">{formatDuration(sessionDuration)}</span>
            </div>
            <div className="session-info-item">
              <span className="info-label">Participants</span>
              <span className="info-value">{participants.length}</span>
            </div>
            <div className="session-info-item">
              <span className="info-label">Home URL</span>
              <span className="info-value-url" title={homeUrl}>{homeUrl}</span>
            </div>
          </div>

          {/* Share Link */}
          <div className="share-link-section">
            <label className="share-link-label">Share Link</label>
            <div className="share-link-input-group">
              <input
                type="text"
                value={shareLink || ''}
                readOnly
                className="share-link-input"
              />
              <button
                className={`copy-link-button ${linkCopied ? 'copied' : ''}`}
                onClick={handleCopyLink}
              >
                {linkCopied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2"/>
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Participants List */}
          <div className="participants-section">
            <label className="participants-label">Participants ({participants.length})</label>
            <div className="participants-list">
              {participants.length === 0 ? (
                <div className="empty-participants">No participants yet</div>
              ) : (
                participants.map((participant) => (
                  <div key={participant.id} className="participant-item">
                    <div
                      className="participant-color-indicator"
                      style={{ backgroundColor: participant.color }}
                    />
                    <span className="participant-name">{participant.name}</span>
                    {participant.name === 'Owner' && (
                      <span className="participant-badge owner">Owner</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* End Session Button */}
          <div className="session-actions">
            <button className="end-session-button" onClick={onEndSession}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M12 8v8M8 12h8" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              End Session
            </button>
          </div>
        </div>
      </>
    );
  }

  // Completed session view
  if (selectedCompletedSessionId) {
    const selectedSession = completedSessions.find(s => s.id === selectedCompletedSessionId);
    if (!selectedSession) {
      return (
        <>
          <div className="panel-header">
            <h3>Session</h3>
          </div>
          <div className="panel-content">
            <div className="session-empty-state">
              <p>Session not found</p>
              <button className="create-session-button" onClick={() => onSelectCompletedSession?.(null)}>
                Back to Sessions
              </button>
            </div>
          </div>
        </>
      );
    }

    const sessionDuration = selectedSession.endedAt && selectedSession.createdAt
      ? Math.floor((selectedSession.endedAt - selectedSession.createdAt) / 1000)
      : 0;

    return (
      <>
        <div className="panel-header">
          <button 
            className="back-button"
            onClick={() => onSelectCompletedSession?.(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h3>Completed Session</h3>
        </div>
        <div className="panel-content">
          <div className="session-info-section">
            <div className="session-info-item">
              <span className="info-label">URL</span>
              <span className="info-value-url" title={selectedSession.homeUrl}>{selectedSession.homeUrl}</span>
            </div>
            <div className="session-info-item">
              <span className="info-label">Duration</span>
              <span className="info-value">{formatDuration(sessionDuration)}</span>
            </div>
            <div className="session-info-item">
              <span className="info-label">Participants</span>
              <span className="info-value">{selectedSession.participantCount}</span>
            </div>
            <div className="session-info-item">
              <span className="info-label">Comments</span>
              <span className="info-value">{selectedSession.commentCount}</span>
            </div>
            <div className="session-info-item">
              <span className="info-label">Ended</span>
              <span className="info-value">{selectedSession.endedAt ? formatDate(selectedSession.endedAt) : 'N/A'}</span>
            </div>
          </div>

          {/* Comments List */}
          {sessionComments && sessionComments.length > 0 && (
            <div className="comments-section">
              <label className="comments-label">Comments ({sessionComments.length})</label>
              <div className="comments-list">
                {(() => {
                  // Group comments by URL
                  const commentsByUrl = sessionComments.reduce((acc: Record<string, any[]>, comment) => {
                    const url = comment.url || 'Unknown Page';
                    if (!acc[url]) acc[url] = [];
                    acc[url].push(comment);
                    return acc;
                  }, {});

                  return Object.entries(commentsByUrl).map(([url, comments]) => (
                    <div key={url} className="comment-group">
                      <div className="comment-group-header">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                        <span className="comment-group-url" title={url}>
                          {new URL(url).pathname === '/' ? new URL(url).hostname : new URL(url).pathname}
                        </span>
                        <span className="comment-group-count">({comments.length})</span>
                      </div>
                      {comments.map((comment: any) => (
                        <div 
                          key={comment.id} 
                          className="comment-item"
                          onClick={() => onCommentClick?.(comment)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="comment-item-header">
                            <span className="comment-author">{comment.authorName}</span>
                            <span className="comment-date">
                              {comment.createdAt ? formatDate(comment.createdAt) : ''}
                            </span>
                          </div>
                          <div className="comment-item-text">{comment.text}</div>
                          {comment.elementSelector && (
                            <div className="comment-item-element">
                              on <code>{comment.elementName || comment.elementSelector}</code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          <div className="session-actions">
            <button 
              className="view-report-button" 
              onClick={() => onViewReport?.(selectedSession.id)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              View Report
            </button>
          </div>
        </div>
      </>
    );
  }

  // Empty state - show completed sessions list
  return (
    <>
      <div className="panel-header">
        <h3>Sessions</h3>
      </div>
      <div className="panel-content">
        {/* Completed Sessions List - PRIMARY */}
        {completedSessions.length > 0 ? (
          <div className="completed-sessions-section">
            <label className="completed-sessions-label">Previous Sessions</label>
            <div className="completed-sessions-list">
              {completedSessions.map((session) => (
                <div 
                  key={session.id} 
                  className="completed-session-item"
                  onClick={() => onSelectCompletedSession?.(session.id)}
                >
                  <div className="completed-session-header">
                    <span className="completed-session-url" title={session.homeUrl}>
                      {session.homeUrl}
                    </span>
                    <span className="completed-session-date">
                      {session.endedAt ? formatDate(session.endedAt) : 'N/A'}
                    </span>
                  </div>
                  <div className="completed-session-stats">
                    <span className="completed-session-stat">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                      </svg>
                      {session.participantCount}
                    </span>
                    <span className="completed-session-stat">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      {session.commentCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="session-empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4 className="empty-state-title">No Sessions Yet</h4>
            <p className="empty-state-description">
              Create your first session to get started.
            </p>
          </div>
        )}

        {/* Session Actions - SECONDARY */}
        <div className="session-actions-secondary">
          {onCreateSession && (
            <button className="create-session-button" onClick={onCreateSession}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Create Session
            </button>
          )}
          {onJoinSession && (
            <button className="join-session-button" onClick={onJoinSession}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                <circle cx="8.5" cy="7" r="4" strokeWidth="2"/>
                <path d="M20 8v6M23 11h-6" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Join Session
            </button>
          )}
        </div>
      </div>
    </>
  );
}
