/**
 * T7 Tutor — 100% Serverless Cloud Academic Mentor & Tutor Workspace
 * Powered directly by Google Gemini AI (Gemini 3.7 Flash / 3.6 Flash)
 * Zero Python backend, Zero local setup required — 100% Vercel & Cloud Native.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Sparkles,
  Bot,
  PenTool,
  Code2,
  HelpCircle,
  Send,
  RotateCcw,
  Copy,
  Check,
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Lightbulb,
  Cpu,
  Layers,
  Zap,
  Terminal
} from 'lucide-react';
import { callGemini } from '../Chatbot/chatbot';

const MODES = [
  { id: 'chat', label: 'Tutor Chat', icon: GraduationCap, desc: 'Interactive AI Academic Mentor' },
  { id: 'socratic', label: 'TutorBot (Socratic)', icon: Bot, desc: 'Step-by-step Guided Hint Learning' },
  { id: 'notes', label: 'Co-Writer Notes', icon: PenTool, desc: 'Structured Revision & Exam Cheat Sheets' },
  { id: 'quiz', label: 'Quiz Lab', icon: HelpCircle, desc: 'AI Generated Practice Tests' },
  { id: 'code', label: 'Code & Algorithm', icon: Code2, desc: 'Bug Fixer & Complexity Analyzer' }
];

const TOPIC_CHIPS = [
  'Data Structures & Algorithms',
  'Operating Systems & Threads',
  'DBMS & SQL Optimization',
  'Computer Networks & Protocols',
  'System Design & Scalability',
  'Object-Oriented Programming (Java/C++)',
  'Full-Stack Web (React & Node.js)',
  'Machine Learning & AI Fundamentals'
];

const AcademicMode = ({ userProfile }) => {
  const [activeMode, setActiveMode] = useState('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // Quiz Mode State
  const [quizTopic, setQuizTopic] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  // Notes Co-Writer State
  const [notesTopic, setNotesTopic] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);

  // Code Space State
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeAnalysis, setCodeAnalysis] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Active key & preferred model
  const activeKey = userProfile?.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const activeModel = userProfile?.geminiModel || 'gemini-3.7-flash';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Set initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: `👋 Hello **${userProfile?.name || 'Student'}**! I am your **T7 Academic AI Tutor** powered by Google Gemini.\n\nI can help you master complex computer science concepts, prepare for placement exams, solve coding problems, and build structured study notes.\n\nWhat would you like to learn or practice today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [userProfile]);

  // System Prompts for Different Modes
  const getSystemPromptForMode = (mode) => {
    const studentInfo = `Student: ${userProfile?.name || 'Student'}, Branch: ${userProfile?.branch || 'Engineering'}, Year: ${userProfile?.year || 'Undergraduate'}.`;

    if (mode === 'socratic') {
      return `You are T7 Tutor in SOCRATIC MENTOR mode. ${studentInfo}
Your goal is to guide the student to discover the answer themselves through thoughtful questions, intuitive analogies, and progressive hints.
RULES:
1. NEVER give the final direct solution immediately.
2. Break down problems into small, manageable reasoning steps.
3. Ask 1-2 guiding questions per response.
4. If the student makes a mistake, gently point out the contradiction in logic.
5. Use clear markdown, bold keywords, and concise formatting.`;
    }

    return `You are T7 Academic AI Tutor, a master computer science professor and placement mentor. ${studentInfo}
Your goal is to provide deep, crystal-clear, structured academic explanations.
RULES:
1. Explain concepts from first principles with intuitive real-world examples.
2. Include time/space complexity analysis when discussing algorithms or data structures.
3. Use clean Markdown: bold terms, numbered lists, and fenced code blocks with language identifiers.
4. Highlight common placement interview questions related to the topic.
5. Keep answers rigorous, motivating, and mathematically sound.`;
  };

  // Handle Chat & Socratic Submission
  const handleSendMessage = async (customPrompt = null) => {
    const query = (customPrompt || input).trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const historyForApi = newMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        text: m.text
      }));

      const systemPrompt = getSystemPromptForMode(activeMode);
      const responseText = await callGemini(activeKey, historyForApi, systemPrompt, activeModel);

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Tutor AI error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `⚠️ **Error generating response:** ${err.message || 'Please verify your Gemini connection.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Generate Co-Writer Notes
  const handleGenerateNotes = async (topic = notesTopic) => {
    if (!topic?.trim() || notesLoading) return;
    setNotesLoading(true);
    setGeneratedNotes('');

    const prompt = [
      {
        role: 'user',
        text: `Generate comprehensive, highly structured revision notes for the computer science topic: "${topic}".
Include:
1. Executive Summary & Core Definitions
2. Key Principles & Architecture / Flow
3. Formulas, Time & Space Complexities (if applicable)
4. Code / Implementation Patterns (with clear syntax)
5. Top 5 Placement & Exam Questions with Concise Answers
6. Common Pitfalls to Avoid`
      }
    ];

    try {
      const systemPrompt = `You are an expert academic note compiler. Format output cleanly in GitHub Markdown with headings, callouts, and bullet points.`;
      const notes = await callGemini(activeKey, prompt, systemPrompt, activeModel);
      setGeneratedNotes(notes);
    } catch (err) {
      setGeneratedNotes(`⚠️ Failed to generate notes: ${err.message}`);
    } finally {
      setNotesLoading(false);
    }
  };

  // Generate Interactive Quiz
  const handleGenerateQuiz = async (topic = quizTopic) => {
    if (!topic?.trim() || quizLoading) return;
    setQuizLoading(true);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);

    const prompt = [
      {
        role: 'user',
        text: `Generate a 5-question technical quiz on "${topic}".
Return ONLY a valid JSON array of 5 objects with this EXACT structure (no markdown, no other text):
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Why this option is correct."
  }
]`
      }
    ];

    try {
      const systemPrompt = `You are a technical assessment generator. Return raw JSON array only.`;
      const rawRes = await callGemini(activeKey, prompt, systemPrompt, activeModel);
      const cleanJson = rawRes.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        setQuizQuestions(parsed);
      } else {
        throw new Error('Invalid quiz response format');
      }
    } catch (err) {
      console.error('Quiz parse error:', err);
      setQuizQuestions([]);
    } finally {
      setQuizLoading(false);
    }
  };

  // Analyze Code Space
  const handleAnalyzeCode = async () => {
    if (!codeSnippet.trim() || codeLoading) return;
    setCodeLoading(true);
    setCodeAnalysis('');

    const prompt = [
      {
        role: 'user',
        text: `Analyze this ${codeLanguage} code:
\`\`\`${codeLanguage}
${codeSnippet}
\`\`\`

Provide:
1. **Line-by-Line Code Review & Correctness Analysis**
2. **Time Complexity & Space Complexity ($O(n)$ Breakdown)**
3. **Edge Cases & Potential Bugs**
4. **Optimized / Cleaner Version with Explanations**`
      }
    ];

    try {
      const systemPrompt = `You are a principal software engineer and algorithmic analysis tutor.`;
      const analysis = await callGemini(activeKey, prompt, systemPrompt, activeModel);
      setCodeAnalysis(analysis);
    } catch (err) {
      setCodeAnalysis(`⚠️ Analysis failed: ${err.message}`);
    } finally {
      setCodeLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const calculateQuizScore = () => {
    if (quizQuestions.length === 0) return 0;
    let score = 0;
    quizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* ── Top Workspace Navigation ── */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-violet-600/15 -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/30 border border-white/20 flex-shrink-0">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black tracking-tight">T7 Academic AI Tutor</h2>
                <span className="text-[11px] font-bold bg-violet-500/20 text-violet-300 px-2.5 py-0.5 rounded-full border border-violet-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Cloud Native • 0 Backend
                </span>
                <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {activeModel}
                </span>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Personalized computer science mentor, exam preparation, and code intelligence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => {
                setMessages([]);
                setGeneratedNotes('');
                setQuizQuestions([]);
                setCodeAnalysis('');
              }}
              title="Reset Session"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-zinc-300 transition-colors border border-white/10 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-6">
          {MODES.map(mode => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`flex flex-col items-start p-3 rounded-2xl transition-all border text-left cursor-pointer ${
                  isActive
                    ? 'bg-white text-zinc-900 border-white shadow-xl shadow-white/10 scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-violet-400'}`} />
                  <span className="font-bold text-xs">{mode.label}</span>
                </div>
                <span className={`text-[10px] line-clamp-1 ${isActive ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {mode.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mode 1 & 2: Tutor Chat & Socratic Mentor ── */}
      {(activeMode === 'chat' || activeMode === 'socratic') && (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden flex flex-col h-[700px]">
          {/* Quick topic pills */}
          <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Topics:
            </span>
            {TOPIC_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => handleSendMessage(`Teach me key concepts, formulas, and interview problems for: ${chip}`)}
                className="text-xs px-3 py-1 bg-white hover:bg-violet-50 hover:border-violet-300 text-zinc-700 hover:text-violet-700 rounded-full border border-zinc-200 transition-all flex-shrink-0 font-medium cursor-pointer shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs shadow-md ${
                    m.role === 'user'
                      ? 'bg-gradient-to-tr from-zinc-900 to-zinc-700 text-white'
                      : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'
                  }`}
                >
                  {m.role === 'user' ? userProfile?.name?.charAt(0)?.toUpperCase() || 'U' : <Bot className="w-5 h-5" />}
                </div>

                <div className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-violet-600 text-white rounded-tr-none shadow-md shadow-violet-600/10 font-medium'
                        : 'bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200/80 shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 px-1">
                    <span>{m.timestamp}</span>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(m.text, m.id)}
                        className="hover:text-zinc-600 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copy answer"
                      >
                        {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-xl">
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 bg-zinc-100 rounded-2xl rounded-tl-none border border-zinc-200 text-zinc-500 text-sm flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-violet-600 animate-spin" />
                  <span>T7 Tutor is thinking with {activeModel}...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 bg-zinc-50 border-t border-zinc-200">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  activeMode === 'socratic'
                    ? 'State a problem you want to solve step-by-step with hints...'
                    : 'Ask anything (e.g. Explain Dijkstra algorithm with time complexity)...'
                }
                className="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-violet-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Mode 3: Co-Writer & Revision Notes ── */}
      {activeMode === 'notes' && (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-100 pb-5">
            <div>
              <h3 className="font-black text-zinc-900 text-lg flex items-center gap-2">
                <PenTool className="w-5 h-5 text-violet-600" />
                Co-Writer & Revision Notes Compiler
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Generate high-yield academic study notes, cheat sheets, and interview cheat sheets instantly.
              </p>
            </div>
            {generatedNotes && (
              <button
                onClick={() => copyToClipboard(generatedNotes, 'notes')}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                {copiedId === 'notes' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === 'notes' ? 'Notes Copied!' : 'Copy All Notes'}</span>
              </button>
            )}
          </div>

          {/* Topic Input Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={notesTopic}
              onChange={e => setNotesTopic(e.target.value)}
              placeholder="Enter subject or topic (e.g. Dynamic Programming, Normalization in DBMS, B-Trees)..."
              className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
            <button
              onClick={() => handleGenerateNotes(notesTopic)}
              disabled={!notesTopic.trim() || notesLoading}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {notesLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              <span>{notesLoading ? 'Generating Notes…' : 'Generate Notes'}</span>
            </button>
          </div>

          {/* Notes Content */}
          {generatedNotes ? (
            <div className="p-6 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-sm text-zinc-800 leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto shadow-inner max-h-[600px] overflow-y-auto">
              {generatedNotes}
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400 space-y-2">
              <PenTool className="w-10 h-10 mx-auto text-zinc-300" />
              <p className="font-bold text-zinc-600 text-sm">No notes compiled yet</p>
              <p className="text-xs">Type a topic above or pick from quick suggestions to generate instant exam-ready revision notes.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Mode 4: Quiz Lab & Assessment ── */}
      {activeMode === 'quiz' && (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-100 pb-5">
            <div>
              <h3 className="font-black text-zinc-900 text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-violet-600" />
                Interactive Quiz Lab & Knowledge Test
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Generate real-time MCQs with instant scoring and in-depth explanations.
              </p>
            </div>
            {quizSubmitted && (
              <div className="px-4 py-2 bg-violet-50 border border-violet-200 text-violet-900 rounded-xl text-xs font-black">
                Score: {calculateQuizScore()} / {quizQuestions.length} ({Math.round((calculateQuizScore() / quizQuestions.length) * 100)}%)
              </div>
            )}
          </div>

          {/* Quiz Topic Form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={quizTopic}
              onChange={e => setQuizTopic(e.target.value)}
              placeholder="Topic for quiz (e.g. Graph Algorithms, Virtual Memory, SQL Joins)..."
              className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
            <button
              onClick={() => handleGenerateQuiz(quizTopic)}
              disabled={!quizTopic.trim() || quizLoading}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {quizLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>{quizLoading ? 'Generating Quiz…' : 'Start 5-Q Quiz'}</span>
            </button>
          </div>

          {/* Quiz Questions List */}
          {quizQuestions.length > 0 ? (
            <div className="space-y-6">
              {quizQuestions.map((q, qIndex) => {
                const selected = quizAnswers[q.id];
                const isCorrect = selected === q.correctIndex;
                return (
                  <div key={q.id} className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-zinc-900 text-sm">
                        <span className="text-violet-600 mr-2">Q{qIndex + 1}.</span>
                        {q.question}
                      </p>
                      {quizSubmitted && (
                        <div>
                          {isCorrect ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" /> Incorrect
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIndex) => {
                        let btnStyle = 'bg-white border-zinc-200 text-zinc-700 hover:border-violet-300';
                        if (selected === optIndex) {
                          btnStyle = 'bg-violet-600 border-violet-600 text-white font-bold shadow-md shadow-violet-600/10';
                        }
                        if (quizSubmitted) {
                          if (optIndex === q.correctIndex) {
                            btnStyle = 'bg-emerald-500 border-emerald-500 text-white font-bold';
                          } else if (selected === optIndex && !isCorrect) {
                            btnStyle = 'bg-rose-500 border-rose-500 text-white font-bold';
                          }
                        }

                        return (
                          <button
                            key={optIndex}
                            disabled={quizSubmitted}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIndex }))}
                            className={`p-3 text-left rounded-xl border text-xs transition-all cursor-pointer ${btnStyle}`}
                          >
                            <span className="font-bold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {quizSubmitted && (
                      <div className="p-3.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-600 leading-relaxed">
                        <span className="font-bold text-zinc-900 block mb-1">💡 Explanation:</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              {!quizSubmitted ? (
                <button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl text-sm shadow-xl shadow-violet-600/20 transition-all cursor-pointer"
                >
                  Submit Quiz Answers & Calculate Score
                </button>
              ) : (
                <button
                  onClick={() => handleGenerateQuiz(quizTopic)}
                  className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-2xl text-sm transition-all cursor-pointer shadow-lg"
                >
                  Generate Another Set of Questions
                </button>
              )}
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400 space-y-2">
              <HelpCircle className="w-10 h-10 mx-auto text-zinc-300" />
              <p className="font-bold text-zinc-600 text-sm">No active quiz</p>
              <p className="text-xs">Enter a topic above and generate instant test questions to practice!</p>
            </div>
          )}
        </div>
      )}

      {/* ── Mode 5: Code & Algorithm Space ── */}
      {activeMode === 'code' && (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-100 pb-5">
            <div>
              <h3 className="font-black text-zinc-900 text-lg flex items-center gap-2">
                <Code2 className="w-5 h-5 text-violet-600" />
                Code & Algorithm Complexity Space
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Paste any code snippet to analyze time & space complexity, edge-case bugs, and optimizations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={codeLanguage}
                onChange={e => setCodeLanguage(e.target.value)}
                className="px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 outline-none"
              >
                <option value="javascript">JavaScript / TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="sql">SQL Query</option>
              </select>
            </div>
          </div>

          {/* Code Editor Box */}
          <div className="space-y-2">
            <textarea
              rows={8}
              value={codeSnippet}
              onChange={e => setCodeSnippet(e.target.value)}
              placeholder={`// Paste your ${codeLanguage} code here...`}
              className="w-full p-4 bg-zinc-900 text-emerald-400 font-mono text-xs rounded-2xl border border-zinc-800 outline-none focus:ring-2 focus:ring-violet-500 leading-relaxed resize-y"
            />
            <button
              onClick={handleAnalyzeCode}
              disabled={!codeSnippet.trim() || codeLoading}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {codeLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
              <span>{codeLoading ? 'Analyzing Code with Gemini…' : 'Analyze Code & Complexity ($O(n)$)'}</span>
            </button>
          </div>

          {/* Code Analysis Result */}
          {codeAnalysis && (
            <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-800 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto shadow-inner">
              {codeAnalysis}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AcademicMode;
