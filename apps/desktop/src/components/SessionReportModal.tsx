import React from 'react';
import './SessionReportModal.css';

interface LLMReport {
  executiveSummary: string;
  keyFindings: string[];
  recommendations: string[];
  detailedAnalysis: string;
  themes: Array<{
    theme: string;
    description: string;
    relatedComments: string[];
  }>;
}

interface SessionReport {
  sessionId: string;
  homeUrl: string;
  duration: number;
  participants: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  summary: {
    totalComments: number;
    totalParticipants: number;
    commentsByParticipant: Record<string, number>;
  };
  llmReport?: LLMReport;
}

interface SessionReportModalProps {
  report: SessionReport;
  onClose: () => void;
}

export function SessionReportModal({ report, onClose }: SessionReportModalProps) {
  const durationMinutes = Math.round(report.duration / 60000);
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  const durationStr = durationHours > 0 
    ? `${durationHours}h ${remainingMinutes}m`
    : `${durationMinutes}m`;

  return (
    <div className="session-report-modal-overlay" onClick={onClose}>
      <div className="session-report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="session-report-modal-header">
          <h2>Session Report</h2>
          <button className="session-report-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="session-report-modal-body">
          {/* Session Overview */}
          <section className="session-report-section">
            <h3>Session Overview</h3>
            <div className="session-report-overview">
              <div className="overview-item">
                <span className="overview-label">URL:</span>
                <span className="overview-value">{report.homeUrl}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Duration:</span>
                <span className="overview-value">{durationStr}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Participants:</span>
                <span className="overview-value">{report.summary.totalParticipants}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Total Comments:</span>
                <span className="overview-value">{report.summary.totalComments}</span>
              </div>
            </div>
          </section>

          {/* LLM Report */}
          {report.llmReport ? (
            <>
              {/* Executive Summary */}
              <section className="session-report-section">
                <h3>Executive Summary</h3>
                <p className="session-report-text">{report.llmReport.executiveSummary}</p>
              </section>

              {/* Key Findings */}
              {report.llmReport.keyFindings.length > 0 && (
                <section className="session-report-section">
                  <h3>Key Findings</h3>
                  <ul className="session-report-list">
                    {report.llmReport.keyFindings.map((finding, index) => (
                      <li key={index}>{finding}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Themes */}
              {report.llmReport.themes.length > 0 && (
                <section className="session-report-section">
                  <h3>Key Themes</h3>
                  <div className="session-report-themes">
                    {report.llmReport.themes.map((theme, index) => (
                      <div key={index} className="session-report-theme">
                        <h4>{theme.theme}</h4>
                        <p>{theme.description}</p>
                        {theme.relatedComments.length > 0 && (
                          <div className="theme-comments">
                            <strong>Related Comments:</strong>
                            <ul>
                              {theme.relatedComments.map((comment, i) => (
                                <li key={i}>{comment}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recommendations */}
              {report.llmReport.recommendations.length > 0 && (
                <section className="session-report-section">
                  <h3>Recommendations</h3>
                  <ul className="session-report-list session-report-recommendations">
                    {report.llmReport.recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Detailed Analysis */}
              {report.llmReport.detailedAnalysis && (
                <section className="session-report-section">
                  <h3>Detailed Analysis</h3>
                  <p className="session-report-text">{report.llmReport.detailedAnalysis}</p>
                </section>
              )}
            </>
          ) : (
            <section className="session-report-section">
              <p className="session-report-no-llm">
                No AI analysis available. Review the comments manually below.
              </p>
            </section>
          )}

          {/* Comments by Element */}
          {report.commentsByElement && report.commentsByElement.length > 0 && (
            <section className="session-report-section">
              <h3>Comments by Element</h3>
              <div className="session-report-comments">
                {report.commentsByElement.map((group, index) => (
                  <div key={index} className="comment-group">
                    <h4>{group.elementName}</h4>
                    <code className="element-selector">{group.elementSelector}</code>
                    <ul className="comment-list">
                      {group.comments.map((comment) => (
                        <li key={comment.id} className="comment-item">
                          <div className="comment-author">{comment.authorName}</div>
                          <div className="comment-text">{comment.text}</div>
                          <div className="comment-time">
                            {new Date(comment.createdAt).toLocaleString()}
                            {comment.editedAt && (
                              <span className="comment-edited"> (edited)</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="session-report-modal-footer">
          <button className="session-report-modal-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

