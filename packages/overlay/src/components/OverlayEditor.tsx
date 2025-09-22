import { useState, useEffect } from 'react';
import type { OverlayEditorProps } from '../types';

const OverlayEditor: React.FC<OverlayEditorProps> = ({
  selection,
  onEdit,
  onCancel,
  language = 'typescript',
}) => {
  const [editedText, setEditedText] = useState(selection.text);

  useEffect(() => {
    setEditedText(selection.text);
  }, [selection.text]);

  const handleSave = () => {
    onEdit(editedText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  return (
    <div className="overlay-editor">
      <div className="overlay-editor__header">
        <span className="overlay-editor__language">{language}</span>
        <div className="overlay-editor__actions">
          <button
            className="overlay-editor__button overlay-editor__button--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="overlay-editor__button overlay-editor__button--primary"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
      <textarea
        className="overlay-editor__textarea"
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        spellCheck={false}
      />
    </div>
  );
};

export default OverlayEditor;
