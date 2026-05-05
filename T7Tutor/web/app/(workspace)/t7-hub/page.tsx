"use client";

import { useState, useEffect, useRef } from "react";
import {
  School,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Wifi,
  WifiOff,
  Loader2,
  Sparkles,
  GraduationCap,
  Target,
  Zap,
  BookOpen,
  BarChart3,
} from "lucide-react";

const HUB_URL = "http://localhost:3000";

const HUB_SECTIONS = [
  { label: "Dashboard", path: "/", icon: <GraduationCap size={14} />, color: "#6366f1" },
  { label: "Academic Mode", path: "/academic", icon: <BookOpen size={14} />, color: "#a855f7" },
  { label: "Results", path: "/results", icon: <BarChart3 size={14} />, color: "#10b981" },
];

export default function T7HubPage() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [activePath, setActivePath] = useState("/");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const check = async () => {
      setStatus("checking");
      try {
        await fetch(HUB_URL, { mode: "no-cors", cache: "no-store" });
        setStatus("online");
      } catch {
        setStatus("offline");
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  const reload = () => {
    setIframeLoaded(false);
    setIframeKey((k) => k + 1);
  };

  const navigate = (path: string) => {
    setActivePath(path);
    setIframeLoaded(false);
    setIframeKey((k) => k + 1);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f0f11 0%, #1a1a2e 50%, #0f0f11 100%)",
          borderBottom: "1px solid rgba(99,102,241,0.2)",
          padding: "0.75rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: "1rem",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              borderRadius: "10px",
              padding: "7px",
              display: "flex",
            }}
          >
            <School size={18} color="white" />
          </div>
          <div>
            <p style={{ color: "white", fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>
              T7 Learning Hub
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>
              Academic Student Hub
            </p>
          </div>
        </div>

        {/* Quick nav pills */}
        <div style={{ display: "flex", gap: "0.4rem", flex: 1, justifyContent: "center", flexWrap: "wrap" }}>
          {HUB_SECTIONS.map((s) => (
            <button
              key={s.path}
              onClick={() => navigate(s.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "8px",
                border: `1px solid ${activePath === s.path ? s.color : "rgba(255,255,255,0.1)"}`,
                background: activePath === s.path ? `${s.color}22` : "rgba(255,255,255,0.05)",
                color: activePath === s.path ? s.color : "rgba(255,255,255,0.5)",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              borderRadius: "8px",
              border: `1px solid ${status === "online" ? "rgba(16,185,129,0.3)" : status === "offline" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
              background: status === "online" ? "rgba(16,185,129,0.15)" : status === "offline" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)",
              color: status === "online" ? "#10b981" : status === "offline" ? "#ef4444" : "rgba(255,255,255,0.4)",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            {status === "online" ? <Wifi size={12} /> : status === "offline" ? <WifiOff size={12} /> : <Loader2 size={12} className="animate-spin" />}
            {status === "online" ? "Live" : status === "offline" ? "Offline" : "…"}
          </div>

          <button
            onClick={reload}
            title="Reload"
            style={{
              padding: "6px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              display: "flex",
            }}
          >
            <RefreshCw size={14} />
          </button>

          <a
            href={HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            style={{
              padding: "6px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              display: "flex",
            }}
          >
            <ExternalLink size={14} />
          </a>

          <button
            onClick={() => setIsFullscreen((f) => !f)}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            style={{
              padding: "6px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              display: "flex",
            }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Offline state */}
        {status === "offline" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--background)",
              gap: "1rem",
              padding: "2rem",
            }}
          >
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "20px",
                padding: "2.5rem",
                textAlign: "center",
                maxWidth: "480px",
                width: "100%",
              }}
            >
              <WifiOff size={40} color="#ef4444" style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ color: "var(--foreground)", fontWeight: 800, fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                T7 Learning Hub is not running
              </h3>
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                Start the T7 Learning Hub dev server first.
              </p>
              <div
                style={{
                  background: "#0f0f11",
                  borderRadius: "12px",
                  padding: "1rem 1.25rem",
                  textAlign: "left",
                  fontFamily: "monospace",
                  fontSize: "0.82rem",
                  color: "#a78bfa",
                  marginBottom: "1.25rem",
                  lineHeight: 2,
                }}
              >
                <span style={{ color: "#6b7280" }}># In the T7-Learning-Hub folder:</span>
                <br />
                <span style={{ color: "#10b981" }}>npm</span> run dev
                <br />
                <span style={{ color: "#6b7280" }}># Opens at → http://localhost:3000</span>
              </div>
              <button
                onClick={reload}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  margin: "0 auto",
                  padding: "0.65rem 1.5rem",
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                  color: "white",
                  fontWeight: 700,
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                <RefreshCw size={16} /> Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {status !== "offline" && (!iframeLoaded || status === "checking") && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--background)",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
              }}
            >
              <Sparkles size={28} color="white" />
            </div>
            <p style={{ color: "var(--foreground)", fontWeight: 700, fontSize: "1rem" }}>
              Loading T7 Learning Hub…
            </p>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.82rem" }}>
              Connecting to localhost:3000
            </p>
            <Loader2 size={20} color="#a855f7" className="animate-spin" />
          </div>
        )}

        {/* Iframe */}
        {status !== "offline" && (
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={`${HUB_URL}${activePath}`}
            title="T7 Learning Hub"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
            }}
            onLoad={() => setIframeLoaded(true)}
            onError={() => setStatus("offline")}
            allow="clipboard-read; clipboard-write; microphone"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          />
        )}
      </div>
    </div>
  );
}
