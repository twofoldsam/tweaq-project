import { useState } from 'react';

interface CodeHighlighterProps {
  code: string;
  language?: string;
  onSelectionChange?: (selection: {
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
    text: string;
  }) => void;
}

const CodeHighlighter: React.FC<CodeHighlighterProps> = ({
  code,
  language = 'typescript',
  onSelectionChange,
}) => {
  const [_selectedRange, _setSelectedRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText && onSelectionChange) {
      // This is a simplified implementation
      // In a real implementation, you'd need to calculate line/column positions
      onSelectionChange({
        startLine: 1,
        endLine: 1,
        startColumn: range.startOffset,
        endColumn: range.endOffset,
        text: selectedText,
      });
    }
  };

  return (
    <div className="code-highlighter">
      <pre
        className={`code-highlighter__pre language-${language}`}
        onMouseUp={handleTextSelection}
      >
        <code className="code-highlighter__code">{code}</code>
      </pre>
    </div>
  );
};

export default CodeHighlighter;
