import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import './AIChatbotWidget.css';

export const AIChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ai-chatbot-container">
      {isOpen && (
        <div className="ai-chat-window glass-card fade-in">
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <div className="orb-small"></div>
              <h4>AI Diagnostics Assistant</h4>
            </div>
            <button className="icon-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="ai-chat-messages">
            <div className="ai-message system">
              <p>Hello! I am your AI Diagnostics Assistant. How can I help you analyze the turbine telemetry today?</p>
              <span className="ai-note">(LLM integration coming soon)</span>
            </div>
          </div>
          <div className="ai-chat-input-area">
            <input type="text" placeholder="Ask about fault patterns..." disabled />
            <button className="ai-send-btn" disabled>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      
      {!isOpen && (
        <button className="ai-orb-button" onClick={() => setIsOpen(true)}>
          <div className="orb"></div>
          <MessageSquare size={24} color="#FFFFFF" className="orb-icon" />
        </button>
      )}
    </div>
  );
};
