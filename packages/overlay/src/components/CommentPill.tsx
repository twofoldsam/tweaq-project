import React, { useState, useRef, useEffect } from 'react';

interface CommentPillProps {
  elementRect: DOMRect;
  onSubmitComment: (comment: string) => void;
}

const CommentPill: React.FC<CommentPillProps> = ({ elementRect, onSubmitComment }) => {
  const [comment, setComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Position the pill slightly to the right and above the selected element
  const pillStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${elementRect.right + window.scrollX + 12}px`,
    top: `${elementRect.top + window.scrollY}px`,
    zIndex: 1000002,
  };

  // Auto-focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmitComment(comment.trim());
      setComment('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setComment('');
    }
  };

  return (
    <div
      style={pillStyle}
      className="tweaq-comment-pill tweaq-comment-pill-expanded"
    >
      <textarea
        ref={textareaRef}
        className="tweaq-comment-textarea"
        placeholder="Add a comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
      />
      <div className="tweaq-comment-actions">
        <button
          className="tweaq-comment-btn tweaq-comment-submit"
          onClick={handleSubmit}
          disabled={!comment.trim()}
          title={comment.trim() ? "Send comment (⌘+Enter)" : "Type a comment to send"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CommentPill;

