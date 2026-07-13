import { useRef, useEffect, useState } from 'react';
import { sendChatMessage, type ChatMessage } from '../../lib/api/chat';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm your Toureez travel assistant. Ask me about destinations, packages, or anything travel-related." },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    const history = messages.slice(-20);
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    const res = await sendChatMessage(input, history);
    setSending(false);
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: res.data?.reply ?? res.error ?? 'Sorry, something went wrong.' },
    ]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            🧭
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--heading)' }}>Toureez Travel Assistant</div>
            <div style={{ fontSize: '.75rem', color: 'var(--success)', fontWeight: 600 }}>● Online · Powered by AI</div>
          </div>
        </div>
      </div>

      <div ref={threadRef} className="chat-thread" style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role === 'user' ? 'mine' : 'theirs'}`}>
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="chat-bubble theirs" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', display: 'inline-block', animation: 'pulse 1.2s ease-in-out .2s infinite' }} />
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', display: 'inline-block', animation: 'pulse 1.2s ease-in-out .4s infinite' }} />
          </div>
        )}
      </div>

      <div className="chat-input-row" style={{ padding: '16px 24px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask about destinations, packages, group size…"
          disabled={sending}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={sending || !input.trim()} style={{ flexShrink: 0 }}>
          Send ↑
        </button>
      </div>
    </div>
  );
}
