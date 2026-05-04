import { useState, useRef, useEffect } from "react";
import axios from "axios";

function Chatbot({ groupId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hi! I'm SmartSplit AI. Ask me about your group's expenses!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chat`, {
        message: userMsg.text,
        groupId
      });

      setMessages((prev) => [...prev, { sender: "ai", text: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Oops, something went wrong connecting to the AI." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>✨ SmartSplit AI</span>
            <button
              style={{ width: 'auto', padding: '4px 8px', margin: 0, background: 'transparent', boxShadow: 'none', color: '#94a3b8' }}
              onClick={() => setIsOpen(false)}
            >
              ✖
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.sender}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="msg ai">Typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              placeholder="Ask anything..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend} disabled={loading}>
              ➤
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <div className="chatbot-btn" onClick={() => setIsOpen(true)}>
          🤖
        </div>
      )}
    </div>
  );
}

export default Chatbot;
