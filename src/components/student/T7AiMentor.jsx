/**
 * T7 AI MENTOR — Floating AI Chat Component
 *
 * A context-aware AI career mentor that knows everything about the student.
 * Powered by Google Gemini Flash via /api/gemini
 *
 * Features:
 * - Floating button (bottom-right) available on every page/tab
 * - Slide-up chat panel with full conversation history
 * - Pre-loaded with all student data as context
 * - Quick-start suggestion chips
 * - Typing indicator
 * - Auto-scroll to latest message
 */

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User, ChevronDown, Loader2, MessageCircle } from 'lucide-react';

const QUICK_QUESTIONS = [
  'Why is my ATS score low?',
  'What skill should I learn first?',
  'Am I ready for interviews?',
  'How do I improve my resume?',
  'Which projects should I build?',
  'How long till I get placed?',
];

// Call /api/gemini with student context + message
async function callT7Mentor(message, chatHistory, studentContext) {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, chatHistory, studentContext }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || err?.detail || `T7 Mentor error (${res.status})`);
  }

  const data = await res.json();
  return data.text || 'Sorry, I could not respond. Please try again.';
}

const T7AiMentor = ({ studentContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: `👋 Hi${studentContext?.name ? ` ${studentContext.name}` : ''}! I'm **T7 AI MENTOR** — your personal career coach.\n\nI know your full profile, ATS results, skills gap, and roadmap. Ask me anything about your career, resume, or placement journey! 🚀`,
      id: 'welcome',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const trimmed = (text || inputValue).trim();
    if (!trimmed || isLoading) return;

    setInputValue('');
    setError('');
    setShowQuickQuestions(false);

    const userMsg = { role: 'user', text: trimmed, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build history for Gemini (exclude welcome message, only real turns)
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));

      const reply = await callT7Mentor(trimmed, history, studentContext);

      setMessages(prev => [
        ...prev,
        { role: 'model', text: reply, id: Date.now().toString() },
      ]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple markdown-like renderer for bold and line breaks
  const renderText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      // Handle **bold**
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl font-bold text-sm transition-all duration-300 cursor-pointer group ${
          isOpen
            ? 'bg-zinc-800 text-white'
            : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40'
        }`}
        title="T7 AI MENTOR"
      >
        {isOpen ? (
          <>
            <ChevronDown className="w-4 h-4" />
            <span>Close Mentor</span>
          </>
        ) : (
          <>
            {/* Pulse ring */}
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-30"></span>
              <Bot className="relative w-4 h-4 text-white" />
            </span>
            <span>T7 AI MENTOR</span>
            <Sparkles className="w-3.5 h-3.5 text-violet-200 group-hover:text-white transition-colors" />
          </>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-20 right-6 z-50 w-[90vw] max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ height: '520px' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-3xl flex-shrink-0">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm tracking-wide">T7 AI MENTOR</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-violet-200 text-xs">Knows your full profile</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Context pills */}
        {studentContext && (
          <div className="px-4 py-2 bg-violet-50 border-b border-violet-100 flex gap-2 overflow-x-auto flex-shrink-0 scrollbar-hide">
            {studentContext.targetRole && (
              <span className="text-[10px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                🎯 {studentContext.targetRole}
              </span>
            )}
            {studentContext.readinessScore !== undefined && (
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                📊 {studentContext.readinessScore}% Ready
              </span>
            )}
            {studentContext.atsScore !== undefined && studentContext.atsScore !== null && (
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                📄 ATS {studentContext.atsScore}%
              </span>
            )}
            {studentContext.missingSkills?.length > 0 && (
              <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                📚 {studentContext.missingSkills.length} skills to learn
              </span>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === 'user'
                  ? 'bg-zinc-800'
                  : 'bg-gradient-to-br from-violet-500 to-indigo-600'
              }`}>
                {msg.role === 'user'
                  ? <User className="w-3.5 h-3.5 text-white" />
                  : <Bot className="w-3.5 h-3.5 text-white" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-zinc-900 text-white rounded-tr-sm'
                  : 'bg-zinc-50 border border-zinc-100 text-zinc-800 rounded-tl-sm'
              }`}>
                {renderText(msg.text)}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-2.5 flex-row">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">
              ⚠️ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions */}
        {showQuickQuestions && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="whitespace-nowrap text-[11px] font-semibold bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="px-4 py-3 border-t border-zinc-100 flex gap-2.5 items-end flex-shrink-0">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your career..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none text-sm text-zinc-800 placeholder:text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all max-h-28 overflow-y-auto disabled:opacity-50"
            style={{ lineHeight: '1.5' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0 shadow-lg shadow-violet-500/30"
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 text-center">
          <p className="text-[10px] text-zinc-400">
            Powered by Google Gemini · Context: Your live T7 profile data
          </p>
        </div>
      </div>
    </>
  );
};

export default T7AiMentor;
