import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import './AIChatPage.css';
import ReactMarkdown from 'react-markdown';

export const AIChatPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your ThermalWatch AI Assistant. I can help you query database statistics, run fault detection models, or answer questions about the system. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Create payload format for backend
      const payload = {
        messages: newMessages.map(m => ({
          role: m.role,
          parts: [m.content]
        }))
      };

      const data = await api.post('/chat', payload);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || "I didn't receive a response."
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error communicating with the server.",
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in chat-page-container">
      <div className="chat-header">
        <div className="chat-header-title">
          <Sparkles className="text-blue" size={24} />
          <h2 style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>ThermalWatch AI Assistant</h2>
        </div>
        <p className="text-secondary" style={{ margin: 0, marginTop: '8px' }}>Powered by Google Gemini</p>
      </div>

      <div className="chat-window glass-card">
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-bubble-container ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={`message-bubble ${msg.role} ${msg.isError ? 'error-bubble' : ''}`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message-bubble-container assistant">
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-bubble assistant loading-bubble">
                <Loader2 className="spinner" size={20} />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to check the database or run a fault detection model..."
            className="chat-input"
            disabled={isLoading}
          />
          <button type="submit" className="chat-send-btn" disabled={!input.trim() || isLoading}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
