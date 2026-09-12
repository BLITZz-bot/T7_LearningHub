import React, { useState, useRef, useEffect } from "react";
import { buildSystemPrompt, callLyzrTutor, detectIntent, getQuickReplies } from "./chatbot";
import "./chatbot.css";

const TypingIndicator = () => (
  <div className="sf-message sf-message--bot">
    <div className="sf-avatar">🤖</div>
    <div className="sf-bubble sf-bubble--typing">
      <span></span><span></span><span></span>
    </div>
  </div>
);

const ChatbotWidget = ({ userProfile, onOpenKeySettings = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hey ${userProfile?.name?.split(' ')[0] || 'there'}! 👋 I'm T7 SKILL_BOT. I'm here to help you get placement-ready.
      
What would you like to know about your progress or career path today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState(["Show my progress", "Check skill gaps", "What should I learn next?"]);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const greetingUpdatedRef = useRef(false);
  
  const formatTime = (date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Update initial message when userProfile name becomes available
  useEffect(() => {
    if (userProfile?.name && !greetingUpdatedRef.current) {
      greetingUpdatedRef.current = true;
      const firstName = userProfile.name.split(' ')[0];
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].content.startsWith('Hey there!')) {
          return [{
            ...prev[0],
            content: `Hey ${firstName}! 👋 I'm T7 SKILL_BOT. I'm here to help you get placement-ready.
      
What would you like to know about your progress or career path today?`
          }];
        }
        return prev;
      });
    }
  }, [userProfile?.name]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: "user", content: text.trim(), timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);
    setError(null);
    setQuickReplies([]);

    try {
      const systemPrompt = buildSystemPrompt(userProfile);
      // Uses LYZR TutorBotAgent (persistent memory, personalized tutoring).
      // Falls back to Gemini automatically if LYZR not yet configured.
      const studentContext = userProfile
        ? {
            uid: userProfile.uid,
            name: userProfile.name,
            career_interest: userProfile.career_interest,
            branch: userProfile.branch,
            year: userProfile.passoutYear || userProfile.year,
            readiness_score: userProfile.readiness_score || 0,
          }
        : null;
      const reply = await callLyzrTutor(updatedMessages, systemPrompt, studentContext);
      const botMsg = { role: "assistant", content: reply, timestamp: new Date() };
      setMessages((prev) => [...prev, botMsg]);
      const intent = detectIntent(text);
      setQuickReplies(getQuickReplies(intent));
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <>
      <button className={`sf-fab ${isOpen ? "sf-fab--open" : ""}`} onClick={() => setIsOpen((v) => !v)}>
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
        )}
        {!isOpen && <span className="sf-fab__badge">AI</span>}
      </button>

      <div className={`sf-chatwindow ${isOpen ? "sf-chatwindow--open" : ""}`}>
        <div className="sf-header">
          <div className="sf-header__left">
            <div className="sf-header__avatar">🤖</div>
            <div>
              <div className="sf-header__name">T7 SKILL_BOT</div>
              <div className="sf-header__status"><span className="sf-status-dot"></span>AI Mentor Online</div>
            </div>
          </div>
          <button className="sf-header__close" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        <div className="sf-contextbar">
          <span>🎯 {userProfile?.career_interest || "Set Goal"}</span>
          <span>⚡ {userProfile?.skills?.length || 0} Skills</span>
        </div>

        <div className="sf-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`sf-message sf-message--${msg.role === "user" ? "user" : "bot"}`}>
              {msg.role === "assistant" && <div className="sf-avatar">🤖</div>}
              <div className="sf-bubble-wrap">
                <div className={`sf-bubble ${msg.role === "user" ? "sf-bubble--user" : "sf-bubble--bot"}`}>
                  {msg.content.split("\n").map((line, i) => (
                    <React.Fragment key={i}>{line}{i < msg.content.split("\n").length - 1 && <br />}</React.Fragment>
                  ))}
                </div>
                <div className="sf-timestamp">{formatTime(msg.timestamp)}</div>
              </div>
              {msg.role === "user" && (
                <div className="sf-avatar sf-avatar--user">{userProfile?.name ? userProfile.name[0].toUpperCase() : "U"}</div>
              )}
            </div>
          ))}
          {isLoading && <TypingIndicator />}
          {error && <div className="sf-error">⚠️ {error} <button onClick={() => setError(null)}>Dismiss</button></div>}
          <div ref={messagesEndRef} />
        </div>

        {quickReplies.length > 0 && !isLoading && (
          <div className="sf-quickreplies">
            {quickReplies.map((qr, i) => <button key={i} className="sf-quickreply" onClick={() => sendMessage(qr)}>{qr}</button>)}
          </div>
        )}

        <div className="sf-inputbar">
          <input ref={inputRef} className="sf-input" type="text" placeholder="Ask anything..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} disabled={isLoading} />
          <button className="sf-send" onClick={() => sendMessage(inputValue)} disabled={isLoading || !inputValue.trim()}>
            {isLoading ? <div className="sf-spinner" /> : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatbotWidget;
