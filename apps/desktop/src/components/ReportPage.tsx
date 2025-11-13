import React from 'react';
import './ReportPage.css';

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
    joinedAt: number;
  }>;
  summary: {
    totalComments: number;
    totalParticipants: number;
    commentsByParticipant: Record<string, number>;
  };
  commentsByElement: Array<{
    elementSelector: string;
    elementName: string;
    comments: Array<{
      id: string;
      authorName: string;
      text: string;
      createdAt: number;
      editedAt?: number;
    }>;
  }>;
  llmReport?: LLMReport;
}

interface ReportPageProps {
  report: SessionReport;
  onClose: () => void;
}

export function ReportPage({ report, onClose }: ReportPageProps) {
  const durationMinutes = Math.round(report.duration / 60000);
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  const durationStr = durationHours > 0 
    ? `${durationHours}h ${remainingMinutes}m`
    : `${durationMinutes}m`;

  return (
    <div className="report-page">
      <div className="report-page-header">
        <div className="report-page-header-content">
          <h1>Session Report</h1>
          <button className="report-page-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Close Report
          </button>
        </div>
      </div>

      <div className="report-page-content">
        {/* Session Overview */}
        <section className="report-section">
          <h2>Session Overview</h2>
          <div className="report-overview-grid">
            <div className="report-overview-card">
              <div className="report-overview-label">Session URL</div>
              <div className="report-overview-value">{report.homeUrl}</div>
            </div>
            <div className="report-overview-card">
              <div className="report-overview-label">Duration</div>
              <div className="report-overview-value">{durationStr}</div>
            </div>
            <div className="report-overview-card">
              <div className="report-overview-label">Participants</div>
              <div className="report-overview-value">{report.summary.totalParticipants}</div>
            </div>
            <div className="report-overview-card">
              <div className="report-overview-label">Total Comments</div>
              <div className="report-overview-value">{report.summary.totalComments}</div>
            </div>
          </div>
        </section>

        {/* LLM Report */}
        {report.llmReport ? (
          <>
            {/* Executive Summary */}
            <section className="report-section">
              <h2>Executive Summary</h2>
              <div className="report-text-content">
                {report.llmReport.executiveSummary}
              </div>
            </section>

            {/* Key Findings */}
            {report.llmReport.keyFindings.length > 0 && (
              <section className="report-section">
                <h2>Key Findings</h2>
                <ul className="report-list">
                  {report.llmReport.keyFindings.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Themes */}
            {report.llmReport.themes.length > 0 && (
              <section className="report-section">
                <h2>Key Themes</h2>
                <div className="report-themes-grid">
                  {report.llmReport.themes.map((theme, index) => (
                    <div key={index} className="report-theme-card">
                      <h3>{theme.theme}</h3>
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
              <section className="report-section">
                <h2>Recommendations</h2>
                <ul className="report-list report-recommendations">
                  {report.llmReport.recommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Detailed Analysis */}
            {report.llmReport.detailedAnalysis && (
              <section className="report-section">
                <h2>Detailed Analysis</h2>
                <div className="report-text-content">
                  {report.llmReport.detailedAnalysis}
                </div>
              </section>
            )}
          </>
        ) : (
          <section className="report-section">
            <div className="report-no-llm">
              <p>No AI analysis available. Review the comments manually below.</p>
            </div>
          </section>
        )}

        {/* Comments by Element */}
        {report.commentsByElement && report.commentsByElement.length > 0 && (
          <section className="report-section">
            <h2>All Comments by Element</h2>
            <div className="report-comments-container">
              {report.commentsByElement.map((group, index) => (
                <div key={index} className="report-comment-group">
                  <h3>{group.elementName}</h3>
                  <code className="report-element-selector">{group.elementSelector}</code>
                  <div className="report-comment-list">
                    {group.comments.map((comment) => (
                      <div key={comment.id} className="report-comment-item">
                        <div className="report-comment-header">
                          <span className="report-comment-author">{comment.authorName}</span>
                          <span className="report-comment-time">
                            {new Date(comment.createdAt).toLocaleString()}
                            {comment.editedAt && (
                              <span className="report-comment-edited"> (edited)</span>
                            )}
                          </span>
                        </div>
                        <div className="report-comment-text">{comment.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

