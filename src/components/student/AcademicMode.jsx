/**
 * Academic SH — T7 Tutor (DeepTutor) Embedded Experience
 * Embeds the live DeepTutor instance running at localhost:3782
 */

import { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Wifi,
  WifiOff,
  MessageSquare,
  BookOpen,
  Bot,
  PenTool,
  Database,
  Terminal,
  Loader2,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const DEEPTUTOR_URL = import.meta.env.VITE_DEEPTUTOR_URL || 'http://localhost:3782';

const quickLinks = [
  { label: 'Chat', path: '/', icon: MessageSquare, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { label: 'TutorBot', path: '/tutorbot', icon: Bot, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { label: 'Co-Writer', path: '/co-writer', icon: PenTool, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { label: 'Book', path: '/book', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { label: 'Knowledge', path: '/knowledge', icon: Database, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { label: 'Space', path: '/space', icon: Terminal, color: 'text-zinc-600 bg-zinc-50 border-zinc-200' },
];

const AcademicMode = ({ userProfile }) => {
  const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [activePath, setActivePath] = useState('/');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchTimer, setLaunchTimer] = useState(0);
  const iframeRef = useRef(null);

  // Check if DeepTutor is reachable
  const checkStatus = async () => {
    try {
      await fetch(DEEPTUTOR_URL, { mode: 'no-cors', cache: 'no-store' });
      setStatus('online');
      setIsLaunching(false);
      return true;
    } catch {
      if (!isLaunching) {
        setStatus('offline');
      }
      return false;
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, isLaunching ? 2000 : 15000);
    return () => clearInterval(interval);
  }, [isLaunching]);

  // Auto-sync personal Gemini key and model to DeepTutor if user configured one
  useEffect(() => {
    if (status !== 'online' || !userProfile?.geminiApiKey) return;

    const syncTutorCredentials = async () => {
      try {
        const res = await fetch(`${DEEPTUTOR_URL}/api/v1/settings/catalog`);
        if (!res.ok) return;
        const data = await res.json();
        const catalog = data.catalog || {};

        let changed = false;
        let geminiProfile = catalog.services?.llm?.profiles?.find(p => p.id === 'llm-profile-gemini');
        if (geminiProfile && geminiProfile.api_key !== userProfile.geminiApiKey) {
          geminiProfile.api_key = userProfile.geminiApiKey;
          changed = true;
        }

        let geminiEmb = catalog.services?.embedding?.profiles?.find(p => p.id === 'emb-profile-gemini');
        if (geminiEmb && geminiEmb.api_key !== userProfile.geminiApiKey) {
          geminiEmb.api_key = userProfile.geminiApiKey;
          changed = true;
        }

        if (changed) {
          await fetch(`${DEEPTUTOR_URL}/api/v1/settings/catalog`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ catalog })
          });
          await fetch(`${DEEPTUTOR_URL}/api/v1/settings/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ catalog })
          });
        }
      } catch (e) {
        // Silently ignore background sync failures
      }
    };

    syncTutorCredentials();
  }, [status, userProfile?.geminiApiKey, userProfile?.geminiModel]);

  // Handle 1-Click Launch via Custom Protocol (t7tutor://launch)
  const handleStartEngine = () => {
    setIsLaunching(true);
    setLaunchTimer(0);
    
    // Trigger Windows Custom Protocol Handler
    try {
      window.location.href = 't7tutor://launch';
    } catch (e) {
      console.warn('Protocol launch error:', e);
    }

    // Fast poll every 1.5 seconds for 60 seconds
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      setLaunchTimer(attempts * 2);
      const isUp = await checkStatus();
      if (isUp || attempts > 30) {
        clearInterval(poll);
        setIsLaunching(false);
        if (isUp) {
          reload();
        }
      }
    }, 2000);
  };

  const reload = () => {
    setIframeLoaded(false);
    setIframeKey(k => k + 1);
    checkStatus();
  };

  const navigate = (path) => {
    setActivePath(path);
    setIframeLoaded(false);
    setIframeKey(k => k + 1);
  };

  const iframeUrl = `${DEEPTUTOR_URL}${activePath}`;

  return (
    <div className={`flex flex-col gap-4 animate-fade-in ${isFullscreen ? 'fixed inset-0 z-50 bg-zinc-50 p-4' : ''}`}>

      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-5 shadow-xl text-white relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-violet-600/10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
              <GraduationCap className="w-7 h-7 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                T7 Tutor
                <span className="text-xs font-semibold bg-violet-500/30 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
                  DeepTutor v1.3.7
                </span>
              </h2>
              <p className="text-zinc-400 text-sm">Agent-native personalized AI tutoring</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status pill */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              status === 'online'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : isLaunching
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                : status === 'offline'
                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
            }`}>
              {status === 'online' ? <Wifi className="w-3.5 h-3.5" /> : isLaunching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : status === 'offline' ? <WifiOff className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {status === 'online' ? 'Live' : isLaunching ? 'Starting Engine…' : status === 'offline' ? 'Offline' : 'Checking…'}
            </div>

            <button
              onClick={reload}
              title="Reload"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-zinc-300" />
            </button>

            {status === 'online' && (
              <a
                href={DEEPTUTOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new tab"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-zinc-300" />
              </a>
            )}

            {status === 'online' && (
              <button
                onClick={() => setIsFullscreen(f => !f)}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-zinc-300" /> : <Maximize2 className="w-4 h-4 text-zinc-300" />}
              </button>
            )}
          </div>
        </div>

        {/* Quick nav */}
        <div className="relative z-10 flex gap-2 mt-4 flex-wrap">
          {quickLinks.map(link => {
            const LinkIcon = link.icon;
            const isActive = activePath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-white text-zinc-900 border-white shadow-lg'
                    : 'bg-white/10 text-zinc-300 border-white/10 hover:bg-white/20'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                {link.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Offline State with 1-Click Auto Start Button */}
      {status === 'offline' && (
        <div className="bg-gradient-to-br from-white to-zinc-50 border-2 border-zinc-200 rounded-3xl p-8 text-center shadow-lg relative overflow-hidden">
          <div className="w-16 h-16 bg-violet-100 border-2 border-violet-200 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          
          <h3 className="font-black text-zinc-900 text-2xl mb-1">
            T7 Tutor AI Engine is Ready to Start
          </h3>
          <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6">
            Click below to auto-start the local Qwen model engine directly from your browser.
          </p>

          {/* 1-Click Auto Launch Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mb-6">
            <button
              onClick={handleStartEngine}
              disabled={isLaunching}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-70 text-white font-black rounded-2xl shadow-xl shadow-violet-600/30 flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 cursor-pointer text-base"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Starting Engine ({launchTimer}s)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-violet-200" />
                  <span>Start T7 Tutor AI Engine</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              onClick={reload}
              className="w-full sm:w-auto px-5 py-4 bg-white border-2 border-zinc-200 hover:border-zinc-300 text-zinc-700 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>

          {isLaunching && (
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl max-w-lg mx-auto mb-6 text-xs text-violet-900 font-medium flex items-center justify-center gap-2 animate-fade-in">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
              <span>Launching Ollama & DeepTutor server in background. Connecting automatically...</span>
            </div>
          )}

          {/* Help & Fallback Box */}
          <div className="pt-5 border-t border-zinc-200/80 max-w-lg mx-auto text-left">
            <details className="group text-xs text-zinc-500">
              <summary className="font-bold text-zinc-700 hover:text-zinc-900 cursor-pointer flex items-center justify-between p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/60 transition-colors">
                <span>🔧 First time setup or manual start instructions</span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 p-4 bg-zinc-900 text-zinc-200 rounded-xl space-y-2 font-mono">
                <p className="text-zinc-400 text-[11px]"># Run once to register 1-click browser start:</p>
                <p className="text-amber-300">.\register_t7tutor_protocol.bat</p>
                <p className="text-zinc-400 text-[11px] pt-1"># Or manually start in terminal:</p>
                <p className="text-emerald-400">cd T7Tutor</p>
                <p className="text-emerald-400">python scripts/start_web.py</p>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Iframe container */}
      {status !== 'offline' && (
        <div className={`relative bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden ${
          isFullscreen ? 'flex-1' : ''
        }`} style={{ height: isFullscreen ? undefined : '680px' }}>

          {/* Loading overlay */}
          {(!iframeLoaded || status === 'checking') && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-50 rounded-2xl gap-3">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                <Sparkles className="w-8 h-8 text-violet-400" />
              </div>
              <div className="text-center">
                <p className="font-black text-zinc-900">Loading T7 Tutor…</p>
                <p className="text-zinc-400 text-sm">Connecting to DeepTutor at localhost:3782</p>
              </div>
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            </div>
          )}

          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={iframeUrl}
            title="T7 Tutor — DeepTutor"
            className="w-full h-full border-0 rounded-2xl"
            style={{ height: isFullscreen ? '100%' : '680px' }}
            onLoad={() => setIframeLoaded(true)}
            onError={() => setStatus('offline')}
            allow="clipboard-read; clipboard-write; microphone"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          />
        </div>
      )}

      {/* Footer info — only when not fullscreen */}
      {!isFullscreen && status === 'online' && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <AlertCircle className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <span>T7 Tutor runs at <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded font-mono">localhost:3782</code> — keep the Python server running.</span>
          </div>
          <a
            href={DEEPTUTOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-900 transition-colors flex-shrink-0"
          >
            Open full app <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};

export default AcademicMode;
