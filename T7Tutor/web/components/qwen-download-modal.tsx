"use client";

import { useEffect, useState } from "react";
import { Cpu, Download, Sparkles, X, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { apiUrl } from "@/lib/api";
import Link from "next/link";

export function QwenDownloadPrompt({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState("");
  const [pullPercent, setPullPercent] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setIsPulling(true);
      setPullProgress("Connecting to Ollama...");
      setPullPercent(0);
      setErrorMsg(null);

      const res = await fetch(apiUrl("/api/v1/model-manager/pull"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen2.5:7b" }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to start download");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) throw new Error(data.error);
              if (data.status) setPullProgress(data.status);
              if (data.completed && data.total) {
                setPullPercent(Math.round((data.completed / data.total) * 100));
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }

      setIsCompleted(true);
      setTimeout(() => {
        setIsPulling(false);
        onClose();
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Download failed. Please check if Ollama is running.");
      setIsPulling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-zinc-100 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-violet-600/15 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <button
          onClick={onClose}
          disabled={isPulling}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-5">
          <Cpu className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
          Download T7 Tutor AI Model
        </h3>
        <p className="text-zinc-400 text-xs leading-relaxed mb-5">
          T7 Tutor runs locally on your machine for 100% free, unlimited, and private AI academic tutoring. Download the model once to begin.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {isPulling && (
          <div className="mb-5 p-4 bg-zinc-800/80 border border-zinc-700 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                {pullProgress || "Downloading AI Model..."}
              </span>
              {pullPercent !== null && (
                <span className="text-violet-400 font-mono">{pullPercent}%</span>
              )}
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-700">
              <div
                className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${pullPercent ?? 5}%` }}
              />
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="mb-5 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Download complete! Connecting automatically...
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {!isCompleted && (
            <button
              onClick={handleDownload}
              disabled={isPulling}
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isPulling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Downloading AI Model ({pullPercent || 0}%)...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download T7 Tutor AI Model (~4.7 GB)
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
            <Link
              href="/settings"
              onClick={onClose}
              className="text-violet-400 hover:underline flex items-center gap-1"
            >
              Open Model Settings <ExternalLink className="w-3 h-3" />
            </Link>
            <span>High-Speed Local Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
