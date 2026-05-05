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

const DEEPTUTOR_URL = 'http://localhost:3782';

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
  const iframeRef = useRef(null);

  // Check if DeepTutor is reachable
  useEffect(() => {
    const check = async () => {
      setStatus('checking');
      try {
        const res = await fetch(DEEPTUTOR_URL, { mode: 'no-cors', cache: 'no-store' });
        setStatus('online');
      } catch {
        setStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  const reload = () => {
    setIframeLoaded(false);
    setIframeKey(k => k + 1);
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
                : status === 'offline'
                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
            }`}>
              {status === 'online' ? <Wifi className="w-3.5 h-3.5" /> : status === 'offline' ? <WifiOff className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {status === 'online' ? 'Live' : status === 'offline' ? 'Offline' : 'Checking…'}
            </div>

            <button
              onClick={reload}
              title="Reload"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10"
            >
              <RefreshCw className="w-4 h-4 text-zinc-300" />
            </button>

            <a
              href={DEEPTUTOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10"
            >
              <ExternalLink className="w-4 h-4 text-zinc-300" />
            </a>

            <button
              onClick={() => setIsFullscreen(f => !f)}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-zinc-300" /> : <Maximize2 className="w-4 h-4 text-zinc-300" />}
            </button>
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

      {/* Offline State */}
      {status === 'offline' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
          <WifiOff className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="font-black text-red-800 text-lg mb-2">T7 Tutor is not running</h3>
          <p className="text-red-600 text-sm mb-4">Start the DeepTutor server first, then come back here.</p>
          <div className="bg-red-900 text-red-100 rounded-xl p-4 text-left font-mono text-sm max-w-lg mx-auto space-y-1.5">
            <p className="text-red-400 text-xs mb-2"># In the T7Tutor folder — run once:</p>
            <p><span className="text-red-300">cd</span> T7Tutor</p>
            <p><span className="text-red-300">python</span> scripts/start_web.py</p>
            <p className="text-red-400 text-xs mt-2"># Then open → http://localhost:3782</p>
          </div>
          <button
            onClick={reload}
            className="mt-4 flex items-center gap-2 mx-auto px-5 py-2.5 bg-red-700 text-white font-bold rounded-xl hover:bg-red-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry Connection
          </button>
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
