import React, { useState, useRef, useEffect } from 'react';

interface CommentPillProps {
  elementRect: DOMRect;
  onSubmitComment: (comment: string) => void;
}

const CommentPill: React.FC<CommentPillProps> = ({ elementRect, onSubmitComment }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Position the pill slightly to the right and above the selected element
  const pillStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${elementRect.right + window.scrollX + 12}px`,
    top: `${elementRect.top + window.scrollY}px`,
    zIndex: 1000002,
  };

  // Auto-focus the textarea when expanded
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmitComment(comment.trim());
      setComment('');
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsExpanded(false);
      setComment('');
    }
  };

  const handleCancel = () => {
    setComment('');
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <div
        style={pillStyle}
        className="tweaq-comment-pill"
        onClick={() => setIsExpanded(true)}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2.678 11.894a1 1 0 01.287.801 10.97 10.97 0 01-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 01.71-.074A8.06 8.06 0 008 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 01-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 00.244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 01-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
        </svg>
        <span>Comment</span>
      </div>
    );
  }

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
          className="tweaq-comment-btn tweaq-comment-cancel"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          className="tweaq-comment-btn tweaq-comment-submit"
          onClick={handleSubmit}
          disabled={!comment.trim()}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
          </svg>
          Submit
        </button>
      </div>
      <div className="tweaq-comment-hint">
        Press <kbd>⌘</kbd>+<kbd>Enter</kbd> to submit, <kbd>Esc</kbd> to cancel
      </div>
    </div>
  );
};

export default CommentPill;

