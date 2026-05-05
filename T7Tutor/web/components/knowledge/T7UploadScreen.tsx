"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Link2, Video, Sparkles, Loader2, Brain,
  BookOpen, GraduationCap, Zap, ArrowRight, X
} from "lucide-react";

// Types from T7 Learning Hub
export interface ChunkData {
  id: number;
  text: string;
  title: string;
}

export interface SessionData {
  session_id: string;
  total_chunks: number;
  chunks: ChunkData[];
}

const API = "http://localhost:8001/api/t7"; // Integrated T7 Hub in DeepTutor

interface Props {
  onSessionCreated: (s: SessionData) => void;
}

export default function T7UploadScreen({ onSessionCreated }: Props) {
  const [tab, setTab] = useState<"pdf" | "youtube" | "video">("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const upload = useCallback(async (file?: File, url?: string) => {
    setLoading(true);
    setError("");
    try {
      let res: Response;
      if (tab === "pdf" && file) {
        const fd = new FormData();
        fd.append("file", file);
        res = await fetch(`${API}/upload/pdf`, { method: "POST", body: fd });
      } else if (tab === "youtube" && url) {
        const fd = new FormData();
        fd.append("url", url);
        res = await fetch(`${API}/upload/youtube`, { method: "POST", body: fd });
      } else if (tab === "video" && file) {
        const fd = new FormData();
        fd.append("file", file);
        res = await fetch(`${API}/upload/video`, { method: "POST", body: fd });
      } else {
        throw new Error("Please provide a file or URL");
      }
      
      if (!res!.ok) {
        const d = await res!.json();
        throw new Error(d.detail || "Upload failed");
      }
      
      const data: SessionData = await res!.json();
      onSessionCreated(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [tab, onSessionCreated]);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (tab === "youtube") {
      upload(undefined, ytUrl);
    } else if (selectedFile) {
      upload(selectedFile);
    }
  };

  const tabs: { id: "pdf" | "youtube" | "video"; label: string; icon: React.ReactNode }[] = [
    { id: "pdf", label: "PDF / Notes", icon: <FileText size={18} /> },
    { id: "youtube", label: "YouTube Link", icon: <Link2 size={18} /> },
    { id: "video", label: "Video Upload", icon: <Video size={18} /> },
  ];

  const features = [
    { icon: <BookOpen size={20} />, label: "Story Mode", desc: "Learn through narratives", gradient: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" },
    { icon: <Brain size={20} />, label: "Simple Mode", desc: "Beginner-friendly", gradient: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)" },
    { icon: <GraduationCap size={20} />, label: "Exam Mode", desc: "Exam-ready prep", gradient: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)" },
  ];

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--background)" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", marginBottom: "2.5rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", borderRadius: "12px", padding: "10px", display: "flex" }}>
            <Sparkles size={28} color="white" />
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            T7 Knowledge
          </h1>
        </div>
        <p style={{ color: "var(--muted-foreground)", fontSize: "1.1rem", maxWidth: "500px", margin: "0 auto" }}>
          Upload any content → AI transforms it into personalized learning experiences
        </p>
      </motion.div>

      {/* Mode cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2.5rem", maxWidth: "560px", width: "100%" }}>
        {features.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            style={{ 
                padding: "1rem", 
                textAlign: "center", 
                borderRadius: "16px", 
                border: "1px solid var(--border)",
                background: "var(--secondary)",
                backdropFilter: "blur(10px)"
            }}
            whileHover={{ scale: 1.04, borderColor: "#6366f1" }}
          >
            <div style={{ background: f.gradient, borderRadius: "10px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.5rem", color: "white" }}>
              {f.icon}
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>{f.label}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", marginTop: "2px" }}>{f.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Upload card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ 
            width: "100%", 
            maxWidth: "600px", 
            padding: "2rem", 
            borderRadius: "24px", 
            border: "1px solid var(--border)",
            background: "var(--secondary)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
        }}
      >
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", background: "var(--background)", borderRadius: "12px", padding: "4px" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(""); setFileName(""); setSelectedFile(null); }}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                padding: "0.65rem 0.75rem", borderRadius: "10px", border: "none", cursor: "pointer",
                fontSize: "0.85rem", fontWeight: 500, transition: "all 0.2s",
                background: tab === t.id ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "transparent",
                color: tab === t.id ? "white" : "var(--muted-foreground)",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {tab === "youtube" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ position: "relative" }}>
                  <Link2 size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
                  <input
                    type="url"
                    placeholder="Paste YouTube or video URL..."
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    style={{
                      width: "100%", padding: "0.9rem 1rem 0.9rem 2.8rem", borderRadius: "12px",
                      border: "1px solid var(--border)", background: "var(--background)",
                      color: "var(--foreground)", fontSize: "0.9rem", outline: "none",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = tab === "pdf" ? ".pdf" : "video/*"; inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f); }; inp.click(); }}
                style={{
                  border: `2px dashed ${dragOver ? "#a855f7" : "var(--border)"}`,
                  borderRadius: "16px", padding: "3rem 2rem", textAlign: "center", cursor: "pointer",
                  transition: "all 0.3s", background: dragOver ? "rgba(168,85,247,0.05)" : "var(--background)",
                }}
              >
                {fileName ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                    <FileText size={24} color="#a855f7" />
                    <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{fileName}</span>
                    <button onClick={(e) => { e.stopPropagation(); setFileName(""); setSelectedFile(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <Upload size={36} color="var(--muted-foreground)" style={{ marginBottom: "0.75rem" }} />
                    <p style={{ color: "var(--foreground)", fontSize: "0.95rem", fontWeight: 500 }}>
                      Drop your {tab === "pdf" ? "PDF" : "video"} here or click to browse
                    </p>
                    <p style={{ color: "var(--muted-foreground)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
                      {tab === "pdf" ? "Supports .pdf files" : "Supports .mp4, .webm, .mov"}
                    </p>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "0.85rem" }}>
            {error}
          </motion.div>
        )}

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading || (tab === "youtube" ? !ytUrl : !selectedFile)}
          onClick={handleSubmit}
          style={{
            width: "100%", marginTop: "1.5rem", padding: "0.9rem", borderRadius: "12px",
            border: "none", cursor: loading ? "wait" : "pointer", fontSize: "1rem", fontWeight: 600,
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            opacity: loading || (tab === "youtube" ? !ytUrl : !selectedFile) ? 0.5 : 1,
          }}
        >
          {loading ? (
            <><Loader2 size={20} className="animate-spin" /> Processing with AI...</>
          ) : (
            <><Zap size={20} /> Transform Content <ArrowRight size={18} /></>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
