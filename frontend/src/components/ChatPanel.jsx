import { useState, useEffect } from "react";
import useSSE from "../hooks/useSSE";
import { marked } from "marked";

export default function ChatPanel({ sessionId, provider, model, history, onUserSend, onAssistantDelta, onAssistantDone }) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [body, setBody] = useState(null);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, streaming, error]);
  // Reset error when sessionId changes (switching chats)
  useEffect(() => { setError(""); }, [sessionId]);

  useSSE({
    url: streaming ? `${import.meta.env.VITE_API_BASE || "http://localhost:8003"}/chat/${sessionId}/stream` : null,
    body,
    onDelta: (deltaOrError) => {
      if (typeof deltaOrError === "string") {
        onAssistantDelta(deltaOrError);
      } else if (deltaOrError && deltaOrError.error) {
        setError(deltaOrError.error);
      }
    },
    onDone: () => { setStreaming(false); onAssistantDone(); },
    onError: (err) => { setStreaming(false); setError(err?.message || "Unknown error"); }
  });

  const onSend = () => {
    if (!input.trim() || !sessionId) return;
    const msg = { role: "user", content: input, provider, model };
    const msgs = [...history, msg];
    onUserSend(msg);
    setBody({ messages: msgs, provider, model });
    setStreaming(true);
    setInput("");
  };

  return (
    <div className="chat">
      <div className="messages">
        {history.map((m, idx) => (
          <div key={idx} className={`msg ${m.role}`}>
            <div dangerouslySetInnerHTML={{__html: marked.parse(m.content || "")}} />
            <button className="copy" onClick={()=>navigator.clipboard.writeText(m.content || "")}>copy</button>
          </div>
        ))}
        {error && (
          <div className="msg error">
            <div style={{ color: 'red' }}>{error}</div>
            <button className="copy" onClick={()=>navigator.clipboard.writeText(error)}>copy</button>
          </div>
        )}
        {streaming && <div className="cursor">▍</div>}
      </div>
      <div className="composer">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything..."
          onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}  
  />
  <button onClick={onSend}>Send</button>
  {streaming && <button onClick={() => setStreaming(false)}>Stop</button>}
  </div>
    </div>
  );
}
