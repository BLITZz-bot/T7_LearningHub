"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { apiUrl } from "@/lib/api";

type ModelStatus = {
  ollama_running: boolean;
  model_downloaded: boolean;
  target_model: string;
  installed_models?: string[];
  error?: string;
};

export function QwenManager({ onStatusChange }: { onStatusChange?: (ready: boolean) => void }) {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState<string>("");
  const [pullPercent, setPullPercent] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(apiUrl("/api/v1/model-manager/status"));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ModelStatus = await res.json();
      setStatus(data);
      if (onStatusChange) {
        onStatusChange(data.ollama_running && data.model_downloaded);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reach model manager");
      setStatus({
        ollama_running: false,
        model_downloaded: false,
        target_model: "qwen2.5:7b",
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleDownload = async () => {
    try {
      setIsPulling(true);
      setPullProgress("Connecting to model engine...");
      setPullPercent(0);
      setErrorMsg(null);

      const res = await fetch(apiUrl("/api/v1/model-manager/pull"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen2.5:7b" }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to start model download stream");
      }

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
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.status) {
                setPullProgress(data.status);
              }
              if (data.completed && data.total) {
                const pct = Math.round((data.completed / data.total) * 100);
                setPullPercent(pct);
              }
            } catch (e: any) {
              // ignore parse errors
            }
          }
        }
      }

      setPullProgress("Download complete!");
      setPullPercent(100);
      setTimeout(() => {
        setIsPulling(false);
        setPullPercent(null);
        fetchStatus();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Download failed");
      setIsPulling(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setErrorMsg(null);
      const res = await fetch(apiUrl("/api/v1/model-manager/delete"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen2.5:7b" }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to delete model");
      }
      setConfirmDelete(false);
      await fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl text-zinc-100 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-white">T7 Tutor AI Engine</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 100% Free & Local
              </span>
            </div>
            <p className="text-zinc-400 text-xs mt-0.5">
              High-performance open-source AI engine running on your computer without API fees or limits.
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading || isPulling}
          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors border border-zinc-700 text-xs font-semibold flex items-center gap-1.5"
          title="Refresh Status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Ollama Not Running Warning */}
      {status && !status.ollama_running && (
        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            AI Engine is not detected
          </div>
          <p className="text-zinc-300">
            To run T7 Tutor, make sure the local engine is installed and running on your computer.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://ollama.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-zinc-950 font-bold rounded-lg hover:bg-amber-400 transition-colors"
            >
              Download Local Runtime <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-zinc-400 text-[11px]">
              Or start it in terminal: <code className="bg-zinc-800 px-1.5 py-0.5 rounded font-mono">ollama serve</code>
            </span>
          </div>
        </div>
      )}

      {/* Status Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
          <span className="text-zinc-400 text-xs block">Engine Model</span>
          <span className="text-white font-mono font-bold text-sm">T7 Tutor AI (8B)</span>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
          <span className="text-zinc-400 text-xs block">Engine Size</span>
          <span className="text-white font-mono font-bold text-sm">~4.7 GB (Quantized)</span>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
          <span className="text-zinc-400 text-xs block">Current Status</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {loading ? (
              <span className="text-zinc-400 text-xs flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
              </span>
            ) : status?.model_downloaded ? (
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Downloaded & Ready
              </span>
            ) : (
              <span className="text-rose-400 font-bold text-xs flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Not Downloaded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Download Progress Bar */}
      {isPulling && (
        <div className="my-4 p-4 bg-zinc-800 border border-zinc-700 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
              {pullProgress || "Downloading AI Engine..."}
            </span>
            {pullPercent !== null && (
              <span className="text-violet-400 font-mono font-bold">{pullPercent}%</span>
            )}
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-700">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${pullPercent ?? 10}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
        {!status?.model_downloaded ? (
          <button
            onClick={handleDownload}
            disabled={isPulling || !status?.ollama_running}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
          >
            {isPulling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Installing T7 Tutor AI Model ({pullPercent || 0}%)...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Install T7 Tutor AI Model (~4.7 GB)
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Model
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-950/60 border border-red-800 p-2 rounded-xl">
                <span className="text-red-300 text-xs font-medium">Delete model file to free disk space?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Configured as active default model in T7 Tutor</span>
        </div>
      </div>
    </div>
  );
}
