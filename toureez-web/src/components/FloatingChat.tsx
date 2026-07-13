import { useEffect, useRef, useState } from 'react';
import { sendChatMessage, type ChatMessage } from '../lib/api/chat';

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: "Hi! I'm your Toureez travel assistant 🧭\n\nAsk me about destinations, packages, itineraries, or anything travel-related!",
};

const SUGGESTIONS = [
  'Best hill stations in India?',
  'Budget trips under ₹15,000',
  'Honeymoon packages',
  'Adventure tours',
];

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showDot, setShowDot] = useState(true);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, sending]);

  useEffect(() => {
    if (open) {
      setShowDot(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    const history = messages.slice(-20);
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setSending(true);
    const res = await sendChatMessage(msg, history);
    setSending(false);
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: res.data?.reply ?? 'Sorry, something went wrong. Please try again.' },
    ]);
  }

  function handleReset() {
    setMessages([WELCOME]);
    setInput('');
  }

  const showSuggestions = messages.length === 1 && !sending;

  return (
    <>
      {/* FAB */}
      <button
        className="fchat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open AI travel assistant'}
      >
        <span className="fchat-fab-icon">{open ? '✕' : '🧭'}</span>
        {showDot && !open && <span className="fchat-fab-dot" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fchat-panel">
          {/* Header */}
          <div className="fchat-header">
            <div className="fchat-header-left">
              <div className="fchat-avatar">🧭</div>
              <div>
                <div className="fchat-title">Travel Assistant</div>
                <div className="fchat-status">● AI-powered · Always available</div>
              </div>
            </div>
            <div className="fchat-header-actions">
              <button className="fchat-icon-btn" onClick={handleReset} title="New conversation" aria-label="New conversation">
                ↺
              </button>
              <button className="fchat-icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
          </div>

          {/* Thread */}
          <div className="fchat-thread" ref={threadRef}>
            {messages.map((m, i) => (
              <div key={i} className={`fchat-bubble ${m.role === 'user' ? 'mine' : 'theirs'}`}>
                {m.content.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br />}</span>
                ))}
              </div>
            ))}

            {sending && (
              <div className="fchat-bubble theirs fchat-typing">
                <span /><span /><span />
              </div>
            )}

            {showSuggestions && (
              <div className="fchat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="fchat-chip" onClick={() => handleSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="fchat-input-row">
            <input
              ref={inputRef}
              className="fchat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask me anything about travel…"
              disabled={sending}
              maxLength={1000}
            />
            <button
              className="fchat-send"
              onClick={() => handleSend()}
              disabled={sending || !input.trim()}
              aria-label="Send"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
