"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Brain, GraduationCap, RefreshCw,
  Sparkles, ArrowLeft, Trophy, Loader2, CheckCircle2, XCircle,
  BarChart3, Zap, Volume2, VolumeOff, Flame, Award, Mic, Download, Circle,
} from "lucide-react";
import type { SessionData, ChunkData } from "./T7UploadScreen";

const API = "http://localhost:8001/api/t7"; // Integrated T7 Hub in DeepTutor

type Mode = "story" | "simple" | "exam";

interface QuizQuestion {
  question: string;
  options: Record<string, string>;
  correct: string;
}

interface Props {
  session: SessionData;
  onReset: () => void;
}

const MODE_CONFIG: Record<Mode, { icon: React.ReactNode; label: string; color: string; gradient: string }> = {
  story:  { icon: <BookOpen size={16} />,     label: "Story",  color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #3b82f6)" },
  simple: { icon: <Brain size={16} />,         label: "Simple", color: "#10b981", gradient: "linear-gradient(135deg, #3b82f6, #10b981)" },
  exam:   { icon: <GraduationCap size={16} />, label: "Exam",   color: "#f59e0b", gradient: "linear-gradient(135deg, #ef4444, #f59e0b)" },
};

export default function T7LearningDashboard({ session, onReset }: Props) {
  const [currentChunkIdx, setCurrentChunkIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("story");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [adaptMsg, setAdaptMsg] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<{id:string;name:string;icon:string;desc:string}[]>([]);
  const [newBadge, setNewBadge] = useState<{name:string;icon:string;desc:string}|null>(null);
  const [allQuizHistory, setAllQuizHistory] = useState<QuizQuestion[]>([]);
  const [listening, setListening] = useState(false);
  const [tutorMsg, setTutorMsg] = useState("");
  const [showTutor, setShowTutor] = useState(false);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const [persistentQuizData, setPersistentQuizData] = useState<Record<number, {
    quiz: QuizQuestion[] | null;
    answers: Record<number, string>;
    submitted: boolean;
  }>>({});

  function toggleTTS() {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    if (!content) return;
    const u = new SpeechSynthesisUtterance(content.replace(/[#*_`]/g, ""));
    u.rate = 0.95; u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u); setSpeaking(true);
  }

  function toggleListen() {
    if (listening) { setListening(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      askTutor(transcript);
    };
    recognition.start();
  }

  async function askTutor(query: string) {
    setTutorLoading(true);
    setShowTutor(true);
    setTutorMsg(`" ${query} "`);
    try {
      const fd = new FormData();
      fd.append("session_id", session.session_id);
      fd.append("chunk_id", chunk.id.toString());
      fd.append("query", query);
      const res = await fetch(`${API}/tutor_chat`, { method: "POST", body: fd });
      const data = await res.json();
      const tutorAnswer = data.answer || "I heard you, but I couldn't find an answer.";
      setTutorMsg(tutorAnswer);
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(tutorAnswer);
      window.speechSynthesis.speak(u);
      setSpeaking(true);
    } catch (err) {
      setTutorMsg("Sorry, I couldn't process that question.");
    } finally {
      setTutorLoading(false);
    }
  }

  const chunk = session?.chunks?.[currentChunkIdx];

  useEffect(() => {
    console.log("T7 Dashboard: Mounting chunk index", currentChunkIdx, "with mode", mode);
    if (!chunk || !chunk.id) {
        console.warn("T7 Dashboard: No valid chunk found to load content.");
        return;
    }
    generateContent(chunk.id, mode);
  }, [currentChunkIdx, mode, chunk?.id]);

  async function generateContent(chunkId: number, m: Mode, forceRefreshQuiz: boolean = false) {
    setLoading(true);
    setContent("");
    if (forceRefreshQuiz) {
      setQuiz(null); setAnswers({}); setSubmitted(false); setAdaptMsg("");
    }
    try {
      const fd = new FormData();
      fd.append("session_id", session.session_id);
      fd.append("chunk_id", chunkId.toString());
      fd.append("mode", m);
      const res = await fetch(`${API}/generate`, { method: "POST", body: fd });
      const data = await res.json();
      setContent(data.content);
      if (forceRefreshQuiz || !persistentQuizData[chunkId]?.quiz) { loadQuiz(); }
    } catch (err) {
      setContent(`⚠️ Could not generate content.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!chunk) return;
    const data = persistentQuizData[chunk.id];
    if (data) {
      setQuiz(data.quiz); setAnswers(data.answers); setSubmitted(data.submitted);
    } else {
      setQuiz(null); setAnswers({}); setSubmitted(false);
    }
  }, [currentChunkIdx]);

  useEffect(() => {
    if (!chunk) return;
    setPersistentQuizData(prev => ({
      ...prev,
      [chunk.id]: { quiz, answers, submitted }
    }));
  }, [quiz, answers, submitted, chunk?.id]);

  async function loadQuiz() {
    setQuizLoading(true);
    try {
      const fd = new FormData();
      fd.append("session_id", session.session_id);
      fd.append("chunk_id", chunk.id.toString());
      const res = await fetch(`${API}/quiz`, { method: "POST", body: fd });
      const data = await res.json();
      console.log("Quiz data received for chunk", chunk?.id, ":", data);
      
      // Safety check for chunk
      if (!chunk) throw new Error("No active chunk");
      if (data.questions && Array.isArray(data.questions)) {
          setQuiz(data.questions);
      } else {
          throw new Error("Invalid quiz format");
      }
    } catch (err) {
      console.error("Quiz load error:", err);
      setQuiz([{ 
        question: "Ready to proceed to the next section?", 
        options: { A: "Yes, I'm ready!", B: "I need more time", C: "Let's go", D: "Sure" }, 
        correct: "A" 
      }]);
    } finally {
      setQuizLoading(false);
    }
  }

  async function submitQuiz() {
    if (!quiz) return;
    setSubmitted(true);
    const correct = quiz.filter((q, i) => {
        const userAnswer = answers[i];
        return userAnswer === q.correct;
    }).length;
    
    const score = Math.round((correct / quiz.length) * 100);
    setScores((prev) => [...prev, score]);
    setAllQuizHistory((prev) => [...prev, ...quiz]);
    
    try {
      const fd = new FormData();
      fd.append("session_id", session.session_id);
      fd.append("score", score.toString());
      const res = await fetch(`${API}/adapt`, { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setAdaptMsg(`${data.message} (+${data.xp_earned} XP)`);
        setXp(data.total_xp); setStreak(data.streak);
        if (data.all_badges) setBadges(data.all_badges);
        if (data.new_badges?.length) { setNewBadge(data.new_badges[0]); setTimeout(() => setNewBadge(null), 3000); }
        if (data.completed) { setCompleted(true); }
        else { setPendingMode(data.new_mode as Mode); }
      }
    } catch { /* ignore */ }
  }

  function nextChunk() {
    if (currentChunkIdx < session.chunks.length - 1) {
      if (pendingMode) { setMode(pendingMode); setPendingMode(null); }
      setCurrentChunkIdx((i) => i + 1);
    }
  }

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  if (completed) {
    return (
      <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ padding: "3rem", textAlign: "center", maxWidth: "500px", borderRadius: "24px", border: "1px solid var(--border)", background: "var(--secondary)" }}>
          <Trophy size={64} color="#f59e0b" style={{ margin: "0 auto 1rem" }} />
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Course Complete! 🎉</h1>
          <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>You covered all {session.total_chunks} concepts</p>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ flex: 1, background: "var(--background)", borderRadius: "12px", padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#8b5cf6" }}>{avgScore}%</div>
              <div style={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}>Avg Score</div>
            </div>
            <div style={{ flex: 1, background: "var(--background)", borderRadius: "12px", padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f97316" }}>{xp}</div>
              <div style={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}>Total XP</div>
            </div>
          </div>
          <button onClick={onReset} style={{ width: "100%", padding: "0.8rem", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", color: "white", fontWeight: 600, cursor: "pointer" }}>
            New Content
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", width: "100%" }}>
      {/* Top Bar */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", borderBottom: "1px solid var(--border)", background: "var(--secondary)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={onReset} style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem" }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ width: "1px", height: "20px", background: "var(--border)" }} />
          <Sparkles size={20} color="#8b5cf6" />
          <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>T7 Knowledge</span>
        </div>
      </header>

      {/* Stats Panel */}
      <div style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)", padding: "1rem 2rem" }}>
        <div style={{ display: "flex", gap: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
            {[
            { label: "XP", val: xp, icon: <Award size={20} />, color: "#8b5cf6" },
            { label: "Streak", val: streak, icon: <Flame size={20} />, color: "#f97316" },
            { label: "Badges", val: badges.length, icon: <Sparkles size={20} />, color: "#ec4899" },
            { label: "Done", val: `${scores.length}/${session.total_chunks}`, icon: <CheckCircle2 size={20} />, color: "#10b981" },
            ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--background)", padding: "8px 16px", borderRadius: "14px", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ color: s.color }}>{s.icon}</div>
                <div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                <div style={{ fontSize: "1rem", fontWeight: 900, color: "var(--foreground)" }}>{s.val}</div>
                </div>
            </div>
            ))}
            <div style={{ flex: 1 }} />
            <button 
                onClick={() => setShowProgress(!showProgress)} 
                style={{ 
                    background: showProgress ? "#8b5cf6" : "var(--background)", 
                    border: "1px solid var(--border)", 
                    borderRadius: "12px", 
                    padding: "8px 16px", 
                    color: showProgress ? "white" : "var(--foreground)", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    transition: "all 0.2s"
                }}
            >
                <BarChart3 size={16} /> Detailed Progress
            </button>
        </div>
      </div>

      <AnimatePresence>
        {showProgress && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            style={{ overflow: "hidden", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(10px)" }}
          >
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 2rem" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: "1rem", color: "var(--muted-foreground)" }}>BADGES UNLOCKED</h4>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    {badges.length > 0 ? badges.map(b => (
                        <div key={b.id} style={{ padding: "10px 15px", background: "var(--background)", border: "1px solid var(--border)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "1.2rem" }}>{b.icon}</span>
                            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{b.name}</span>
                        </div>
                    )) : <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>Complete quizzes to earn badges!</p>}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", gap: "2rem", padding: "2rem", maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        {/* Sidebar - Scrollable Roadmap */}
        <div style={{ width: "280px", flexShrink: 0, display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 200px)" }}>
          <h3 style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#8b5cf6", marginBottom: "1.2rem", fontWeight: 800, letterSpacing: "0.1em" }}>ROADMAP</h3>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.8rem", paddingRight: "10px" }}>
            {session.chunks.map((c, i) => (
              <button 
                key={c.id} 
                onClick={() => setCurrentChunkIdx(i)} 
                style={{ 
                    textAlign: "left", 
                    background: i === currentChunkIdx ? "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))" : "transparent", 
                    border: i === currentChunkIdx ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent", 
                    padding: "14px 18px", 
                    borderRadius: "16px", 
                    cursor: "pointer", 
                    color: i === currentChunkIdx ? "var(--foreground)" : "var(--muted-foreground)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: i === currentChunkIdx ? "0 4px 12px rgba(139,92,246,0.1)" : "none"
                }}
              >
                <div style={{ fontSize: "0.9rem", fontWeight: i === currentChunkIdx ? 800 : 500, lineHeight: 1.5 }}>{c.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area - Unified Scroll */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2rem", overflowY: "auto", paddingRight: "15px", maxHeight: "calc(100vh - 200px)", paddingBottom: "4rem" }}>
          
          {/* Sticky Mode Switcher & Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(255,255,255,0.01)", backdropFilter: "blur(12px)", zIndex: 10, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: "0.6rem" }}>
                {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
                <button 
                    key={m} 
                    onClick={() => setMode(m)} 
                    style={{ 
                        padding: "10px 20px", borderRadius: "14px", border: "none", cursor: "pointer", 
                        fontSize: "0.9rem", fontWeight: 700,
                        background: m === mode ? MODE_CONFIG[m].gradient : "var(--secondary)", 
                        color: m === mode ? "white" : "var(--muted-foreground)",
                        transition: "all 0.3s",
                        boxShadow: m === mode ? "0 4px 12px rgba(0,0,0,0.15)" : "none"
                    }}
                >
                    {MODE_CONFIG[m].label}
                </button>
                ))}
            </div>
            
            <div style={{ display: "flex", gap: "0.5rem" }}>
                <button 
                    onClick={() => generateContent(chunk.id, mode, true)} 
                    disabled={loading || quizLoading}
                    style={{ 
                        background: "var(--background)", 
                        border: "1px solid var(--border)", 
                        borderRadius: "12px", 
                        padding: "10px 15px", 
                        color: "#8b5cf6", 
                        cursor: "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px", 
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        transition: "all 0.2s"
                    }}
                >
                    <RefreshCw size={16} className={loading || quizLoading ? "animate-spin" : ""} /> 
                    Regenerate
                </button>
            </div>
          </div>

          {/* Explanation Section */}
          <div style={{ padding: "2.5rem", borderRadius: "24px", border: "1px solid var(--border)", background: "var(--background)", boxShadow: "0 8px 32px rgba(0,0,0,0.03)", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.8rem" }}>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--foreground)", letterSpacing: "-0.02em", margin: 0 }}>{chunk?.title}</h2>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button 
                        onClick={toggleTTS} 
                        style={{ 
                            background: speaking ? "#8b5cf6" : "var(--secondary)", 
                            border: "none", borderRadius: "12px", padding: "10px", 
                            color: speaking ? "white" : "var(--foreground)", cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        title="Listen to Explanation"
                    >
                        {speaking ? <VolumeOff size={20} /> : <Volume2 size={20} />}
                    </button>
                    <button 
                        onClick={toggleListen} 
                        style={{ 
                            background: listening ? "#ef4444" : "var(--secondary)", 
                            border: "none", borderRadius: "12px", padding: "10px", 
                            color: listening ? "white" : "var(--foreground)", cursor: "pointer",
                            transition: "all 0.2s",
                            animation: listening ? "pulse 1.5s infinite" : "none"
                        }}
                        title="Talk to Voice Tutor"
                    >
                        <Mic size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "4rem 0" }}>
                <Loader2 className="animate-spin" size={32} color="#8b5cf6" /> 
                <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Crafting your {mode} experience...</span>
              </div>
            ) : (
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "var(--foreground)", fontSize: "1.05rem" }}>{content}</div>
            )}

            {/* Floating Tutor Response */}
            <AnimatePresence>
                {showTutor && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 20 }}
                        style={{ 
                            marginTop: "2rem", padding: "1.5rem", borderRadius: "18px", 
                            background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(59,130,246,0.05))", 
                            border: "1px solid rgba(139,92,246,0.2)",
                            position: "relative"
                        }}
                    >
                        <button 
                            onClick={() => setShowTutor(false)} 
                            style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer" }}
                        >
                            <XCircle size={16} />
                        </button>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <div style={{ background: "#8b5cf6", padding: "8px", borderRadius: "10px", height: "fit-content" }}>
                                <Sparkles size={18} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#8b5cf6", marginBottom: "4px" }}>VOICE TUTOR</div>
                                {tutorLoading ? (
                                    <div style={{ display: "flex", gap: "4px" }}>
                                        <div className="dot-pulse" style={{ width: "6px", height: "6px", background: "#8b5cf6", borderRadius: "50%", animation: "pulse 1s infinite" }} />
                                        <div className="dot-pulse" style={{ width: "6px", height: "6px", background: "#8b5cf6", borderRadius: "50%", animation: "pulse 1s infinite 0.2s" }} />
                                        <div className="dot-pulse" style={{ width: "6px", height: "6px", background: "#8b5cf6", borderRadius: "50%", animation: "pulse 1s infinite 0.4s" }} />
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--foreground)", lineHeight: 1.5 }}>{tutorMsg}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* Quiz Section */}
          <div style={{ marginTop: "1rem" }}>
            {quiz && (
                <div style={{ padding: "2.5rem", borderRadius: "24px", border: "1px solid var(--border)", background: "var(--secondary)", boxShadow: "0 12px 40px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "2rem" }}>
                    <div style={{ background: "#fef3c7", padding: "10px", borderRadius: "12px" }}><Zap size={24} color="#f59e0b" /></div>
                    <h3 style={{ color: "var(--foreground)", fontWeight: 900, fontSize: "1.4rem" }}>Knowledge Check</h3>
                </div>
                
                {quiz.map((q, qi) => (
                    <div key={qi} style={{ marginBottom: "2.5rem" }}>
                    <p style={{ fontSize: "1.1rem", marginBottom: "1.2rem", color: "var(--foreground)", fontWeight: 700 }}>{qi + 1}. {q.question}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                        {q.options && Object.entries(q.options).map(([key, val]) => {
                            const selected = answers[qi] === key;
                            const isCorrect = submitted && key === q.correct;
                            const isWrong = submitted && selected && key !== q.correct;
                            
                            let borderColor = "var(--border)";
                            let bgColor = "var(--background)";
                            if (isCorrect) { borderColor = "#10b981"; bgColor = "rgba(16,185,129,0.08)"; }
                            else if (isWrong) { borderColor = "#ef4444"; bgColor = "rgba(239,68,68,0.08)"; }
                            else if (selected) { borderColor = "#8b5cf6"; bgColor = "rgba(139,92,246,0.05)"; }

                            return (
                                <button 
                                    key={key} 
                                    onClick={() => !submitted && setAnswers(a => ({ ...a, [qi]: key }))} 
                                    style={{ 
                                        padding: "18px 22px", 
                                        borderRadius: "16px", 
                                        border: `2px solid ${borderColor}`, 
                                        background: bgColor, 
                                        cursor: submitted ? "default" : "pointer", 
                                        textAlign: "left",
                                        color: "var(--foreground)",
                                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                        fontSize: "0.95rem",
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        boxShadow: selected && !submitted ? "0 4px 12px rgba(139,92,246,0.1)" : "none"
                                    }}
                                >
                                    <span>
                                        <span style={{ fontWeight: 900, marginRight: "1rem", color: isCorrect ? "#10b981" : isWrong ? "#ef4444" : "#8b5cf6", fontSize: "1.1rem" }}>{key}</span> 
                                        {val}
                                    </span>
                                    {isCorrect && <CheckCircle2 size={22} color="#10b981" />}
                                    {isWrong && <XCircle size={22} color="#ef4444" />}
                                </button>
                            );
                        })}
                    </div>
                    </div>
                ))}

                {!submitted ? (
                    <button 
                        onClick={submitQuiz} 
                        disabled={Object.keys(answers).length < quiz.length}
                        style={{ 
                            width: "100%", padding: "20px", borderRadius: "18px", border: "none", 
                            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", 
                            color: "white", cursor: "pointer", fontWeight: 900, fontSize: "1.1rem",
                            boxShadow: "0 10px 25px rgba(99,102,241,0.3)",
                            opacity: Object.keys(answers).length < quiz.length ? 0.6 : 1,
                            transition: "all 0.3s"
                        }}
                    >
                        Submit Answers
                    </button>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        {adaptMsg && (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ padding: "1.2rem", borderRadius: "16px", background: "rgba(16,185,129,0.1)", border: "1px solid #10b981", color: "#059669", fontWeight: 700, textAlign: "center", fontSize: "1rem" }}>
                                {adaptMsg}
                            </motion.div>
                        )}
                        <button 
                            onClick={nextChunk} 
                            style={{ 
                                width: "100%", padding: "20px", borderRadius: "18px", border: "none", 
                                background: "#10b981", color: "white", cursor: "pointer", fontWeight: 900, fontSize: "1.1rem",
                                boxShadow: "0 10px 25px rgba(16,185,129,0.3)",
                                transition: "all 0.3s"
                            }}
                        >
                            Continue to Next Chapter
                        </button>
                    </div>
                )}
                </div>
            )}
            
            {!quiz && !loading && content && (
                <button 
                    onClick={loadQuiz} 
                    style={{ 
                        width: "100%", padding: "22px", borderRadius: "20px", border: "none", 
                        background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", 
                        color: "white", cursor: "pointer", fontWeight: 900, fontSize: "1.1rem",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem",
                        boxShadow: "0 10px 25px rgba(99,102,241,0.3)",
                        transition: "all 0.3s"
                    }}
                >
                    <Zap size={24} /> Master This Chapter
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
