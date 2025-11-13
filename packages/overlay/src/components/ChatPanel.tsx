import React, { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ReadyTweaq {
  instruction: string;
  target: {
    type: string;
    identifier: string;
  };
  action: {
    type: string;
    specifics: string[];
  };
  confidence: number;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElement?: {
    selector: string;
    tagName: string;
    className?: string;
  };
  onTweaqsCreated?: (tweaqs: ReadyTweaq[]) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  selectedElement,
  onTweaqsCreated
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [conversationState, setConversationState] = useState<any>(null);
  const [readyTweaqs, setReadyTweaqs] = useState<ReadyTweaq[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async () => {
    const message = input.trim();
    if (!message || isLoading) return;

    // Add user message
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('🗣️ Sending message to AI...');
      
      // Call the conversation API
      const result = await (window as any).electronAPI.analyzeConversationMessage({
        message,
        conversationState
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze message');
      }

      const analysis = result.analysis;

      // Update conversation state
      setConversationState(analysis.conversationState);

      // Add AI response
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: analysis.response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);

      console.log(`✅ Analysis complete - Completeness: ${(analysis.completeness * 100).toFixed(1)}%`);
      console.log(`   Next Action: ${analysis.nextAction}`);

      // If ready for confirmation, create ready tweaqs
      if (analysis.nextAction === 'confirm') {
        createReadyTweaqs(analysis.conversationState);
      }

    } catch (error) {
      console.error('❌ Error in conversation:', error);
      const errorMessage: ConversationMessage = {
        role: 'assistant',
        content: `Sorry, something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const createReadyTweaqs = (state: any) => {
    const { target, action } = state.extractedInfo;

    if (!target || !action) {
      console.error('Cannot create tweaqs: missing target or action');
      return;
    }

    // Create ready tweaqs (one per target identifier)
    const tweaqs: ReadyTweaq[] = target.identifiers.map((identifier: string) => {
      const specificsStr = action.specifics.join(' and ');
      return {
        instruction: `Make the ${identifier} ${specificsStr}`,
        target: {
          type: target.type,
          identifier
        },
        action: {
          type: action.type,
          specifics: action.specifics
        },
        confidence: Math.min(target.confidence, action.confidence)
      };
    });

    setReadyTweaqs(tweaqs);
    console.log('✅ Created ready tweaqs:', tweaqs);
  };

  const handleConfirm = () => {
    if (!readyTweaqs || readyTweaqs.length === 0) return;

    console.log('✅ User confirmed conversation - creating tweaqs');

    // Apply tweaqs through the browser overlay
    readyTweaqs.forEach(tweaq => {
      // Send each tweaq to be applied
      if ((window as any).electronAPI?.sendOverlayMessage) {
        (window as any).electronAPI.sendOverlayMessage('apply-tweaq-from-chat', {
          instruction: tweaq.instruction,
          target: tweaq.target,
          action: tweaq.action,
          confidence: tweaq.confidence
        });
      }
    });

    // Notify parent component
    if (onTweaqsCreated) {
      onTweaqsCreated(readyTweaqs);
    }

    // Reset conversation
    setMessages([]);
    setConversationState(null);
    setReadyTweaqs(null);
    
    console.log(`⚡ Created ${readyTweaqs.length} tweaqs from conversation`);
  };

  const handleCancel = () => {
    console.log('❌ User cancelled conversation');
    setMessages([]);
    setConversationState(null);
    setReadyTweaqs(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleExampleClick = (example: string) => {
    if (!isLoading) {
      setInput(example);
      // Auto-submit after short delay
      setTimeout(() => {
        const submitEvent = new Event('submit');
        handleSubmit();
      }, 100);
    }
  };

  const exampleInstructions = [
    "Make the buttons more vibrant",
    "Change the copy to be more friendly", 
    "Make the footer more condensed"
  ];

  if (!isOpen) return null;

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <div className="chat-panel-title">
          💬 Chat with AI
          {messages.length > 0 && (
            <span className="chat-panel-badge">{Math.floor(messages.length / 2)}</span>
          )}
        </div>
        <button className="chat-panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="chat-panel-content">
        {/* Conversation Messages */}
        <div className="chat-messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
              <p style={{ color: '#999', fontSize: '14px' }}>Start a conversation to make changes</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${msg.role}`}
              >
                <div className="message-content">
                  {msg.role === 'assistant' ? (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="chat-loading">
              <div className="loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
              <span>Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Ready Tweaqs Confirmation */}
        {readyTweaqs && readyTweaqs.length > 0 && (
          <div className="confirmation-section">
            <div className="confirmation-header">Ready to create tweaqs?</div>
            <div className="confirmation-tickets">
              {readyTweaqs.map((tweaq, index) => (
                <div key={index} className="confirmation-ticket">
                  <div className="ticket-icon">⚡</div>
                  <div className="ticket-info">
                    <div className="ticket-instruction">{tweaq.instruction}</div>
                    <div className="ticket-meta">
                      Target: {tweaq.target.identifier} • Confidence: {(tweaq.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="confirmation-actions">
              <button className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleConfirm}>
                Create Tweaqs
              </button>
            </div>
          </div>
        )}

        {/* Chat Input (hidden when showing confirmation) */}
        {!readyTweaqs && (
          <>
            {messages.length === 0 && (
              <div className="examples-section">
                <div className="examples-label">Examples:</div>
                <div className="example-chips">
                  {exampleInstructions.map((example, i) => (
                    <button
                      key={i}
                      className="example-chip"
                      onClick={() => handleExampleClick(example)}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="chat-input-wrapper">
              <textarea
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  messages.length === 0
                    ? "Describe the change you want to make..."
                    : "Type your message..."
                }
                rows={3}
                disabled={isLoading}
              />
              <button
                className="chat-send-btn"
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
              >
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Simple markdown renderer
function renderMarkdown(text: string): string {
  let html = escapeHtml(text);
  
  // Bold: **text** or __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // Code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br/>');
  
  return html;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default ChatPanel;

