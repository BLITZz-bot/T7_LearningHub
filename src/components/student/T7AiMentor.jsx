/**
 * T7 AI MENTOR — Floating AI Chat Component with Real Model Selection
 *
 * A context-aware AI career mentor that knows everything about the student.
 * Powered by Google Gemini with real-time model switching:
 *   - Gemini 2.0 Flash (Recommended, Ultra Fast)
 *   - Gemini 1.5 Flash (Fast & Reliable)
 *   - Gemini 1.5 Pro (Deep Reasoning & Pro Mentorship)
 *   - Gemini 2.0 Flash Lite (Lightweight)
 */

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  Loader2,
  Zap,
  Brain,
  Cpu,
  Check,
  SlidersHorizontal,
} from 'lucide-react';

export const AI_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    shortName: 'Gemini 3.8',
    speed: 'Ultra Fast',
    badge: 'Latest · Flagship',
    description: 'Next-gen flagship with built-in thinking & instant career guidance',
    icon: Zap,
    color: 'text-amber-500',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    shortName: 'Gemini 3.7',
    speed: 'Ultra Fast',
    badge: 'Hybrid Reasoning',
    description: 'High-speed adaptive reasoning for interview & resume prep',
    icon: Sparkles,
    color: 'text-violet-500',
    badgeBg: 'bg-violet-100 text-violet-800 border-violet-200',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    shortName: 'Gemini 3.1 Pro',
    speed: 'Deep Thinker',
    badge: 'Pro Thinking',
    description: 'Deep architectural logic and multi-phase roadmap analysis',
    icon: Brain,
    color: 'text-indigo-500',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    shortName: 'Gemini 3.6 Flash',
    speed: 'High Intelligence',
    badge: 'Default (Balanced)',
    description: 'Stable powerhouse for comprehensive resume audits & deep rewrites',
    icon: Brain,
    color: 'text-blue-500',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    shortName: 'Gemini 3.5',
    speed: 'Fast & Thinking',
    badge: 'Stable Fallback',
    description: 'Stable sub-second latency with 1M token context & thinking',
    icon: Zap,
    color: 'text-emerald-500',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    shortName: 'Flash Lite',
    speed: 'Lightweight',
    badge: 'Fast & High Quota',
    description: 'Ultra-low latency for instant quick doubt resolution',
    icon: Cpu,
    color: 'text-teal-500',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
  },
];

const QUICK_QUESTIONS = [
  'Why is my ATS score low?',
  'What skill should I learn first?',
  'Am I ready for interviews?',
  'How do I improve my resume?',
  'Which projects should I build?',
  'How long till I get placed?',
];

// Call /api/gemini with student context + message + chosen model
async function callT7Mentor(message, chatHistory, studentContext, model) {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, chatHistory, studentContext, model }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || err?.detail || `T7 Mentor error (${res.status})`);
  }

  const data = await res.json();
  return {
    text: data.text || 'Sorry, I could not respond. Please try again.',
    model: data.model,
    modelName: data.modelName || 'Gemini',
  };
}

const T7AiMentor = ({ studentContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: `👋 Hi${studentContext?.name ? ` ${studentContext.name}` : ''}! I'm **T7 AI MENTOR** — your personal career coach.\n\nI know your full profile, ATS results, skills gap, and roadmap. Ask me anything about your career, resume, or placement journey! 🚀`,
      modelName: 'Gemini 3.8 Flash',
      id: 'welcome',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeModelConfig = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];
  const ActiveModelIcon = activeModelConfig.icon;

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

  const handleSelectModel = (modelId) => {
    if (modelId === selectedModel) {
      setShowModelMenu(false);
      return;
    }
    const target = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];
    setSelectedModel(modelId);
    setShowModelMenu(false);

    // Add a neat system message showing model switch
    setMessages(prev => [
      ...prev,
      {
        role: 'system',
        text: `Switched AI engine to ${target.name}`,
        id: Date.now().toString(),
      },
    ]);
  };

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
      // Build history for Gemini (exclude welcome & system messages, only real turns)
      const history = messages
        .filter(m => m.id !== 'welcome' && m.role !== 'system')
        .map(m => ({ role: m.role, text: m.text }));

      const reply = await callT7Mentor(trimmed, history, studentContext, selectedModel);

      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: reply.text,
          modelName: reply.modelName,
          id: Date.now().toString(),
        },
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
        className={`fixed bottom-20 right-6 z-50 w-[92vw] max-w-[430px] bg-white rounded-3xl shadow-2xl border border-zinc-200 flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ height: '550px' }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between gap-2 px-4 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-3xl flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-white text-sm tracking-wide truncate">T7 AI MENTOR</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-violet-200 text-[11px] truncate">Career Mentor</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Model Selector Pill */}
            <button
              type="button"
              onClick={() => setShowModelMenu(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-sm"
              title="Change AI Model"
            >
              <ActiveModelIcon className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[11px]">{activeModelConfig.shortName}</span>
              <ChevronDown className={`w-3 h-3 text-white/80 transition-transform duration-200 ${showModelMenu ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={() => {
                setShowModelMenu(false);
                setIsOpen(false);
              }}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Model Selection Dropdown Menu */}
        {showModelMenu && (
          <>
            {/* Backdrop to close when clicking outside */}
            <div
              className="absolute inset-0 z-20 bg-black/10 rounded-3xl"
              onClick={() => setShowModelMenu(false)}
            />

            <div className="absolute top-16 left-3 right-3 z-30 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-2.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-zinc-100 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    Select AI Model
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">Google Gemini</span>
              </div>

              <div className="space-y-1">
                {AI_MODELS.map((m) => {
                  const IconComp = m.icon;
                  const isSelected = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectModel(m.id)}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-violet-50/90 border border-violet-200 ring-1 ring-violet-400/30'
                          : 'hover:bg-zinc-50 border border-transparent'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${isSelected ? 'bg-violet-100' : 'bg-zinc-100'}`}>
                        <IconComp className={`w-3.5 h-3.5 ${m.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold ${isSelected ? 'text-violet-900' : 'text-zinc-800'}`}>
                            {m.name}
                          </span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${m.badgeBg}`}>
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                          {m.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-violet-600 flex-shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

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
          {messages.map((msg) => {
            // System notification (model switch)
            if (msg.role === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-1.5">
                  <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-violet-500" />
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
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

                  {/* Model badge signature on model responses */}
                  {msg.role === 'model' && msg.modelName && (
                    <div className="mt-1.5 pt-1 border-t border-zinc-200/50 flex items-center justify-end gap-1 text-[9px] text-zinc-400 font-medium">
                      <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                      <span>{msg.modelName}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

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
                <span className="text-xs text-zinc-400 ml-1">Thinking with {activeModelConfig.shortName}...</span>
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
            placeholder={`Ask ${activeModelConfig.shortName} about your career...`}
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
        <div className="px-4 pb-2.5 text-center flex items-center justify-center gap-1.5">
          <ActiveModelIcon className={`w-3 h-3 ${activeModelConfig.color}`} />
          <p className="text-[10px] text-zinc-400">
            Powered by {activeModelConfig.name} · Live student data context
          </p>
        </div>
      </div>
    </>
  );
};

export default T7AiMentor;
