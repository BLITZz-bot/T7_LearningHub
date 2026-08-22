/**
 * YouTubeTrackerModal — Full-Screen YouTube Learning & Extension Sync Hub
 * 
 * Provides a dedicated, full-screen experience for tracking video learning,
 * viewing extracted skills, analyzing video summaries, and managing
 * Chrome Extension pairing and account sync.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Youtube,
  Sparkles,
  ExternalLink,
  Copy,
  CheckCircle,
  Download,
  RefreshCw,
  Search,
  Star,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Cpu,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  Check,
  ArrowLeft
} from 'lucide-react';

const YouTubeTrackerModal = ({
  isOpen,
  onClose,
  videoLearning = [],
  ytSkills = [],
  loadingVideos = false,
  refreshVideoLearning,
  t7Id = '',
  userProfile = {}
}) => {
  const [activeTab, setActiveTab] = useState('videos'); // 'videos' | 'skills' | 'extension'
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState('all');
  const [copiedId, setCopiedId] = useState(false);
  const [expandedVideoId, setExpandedVideoId] = useState(null);

  // Handle ESC key to exit back to dashboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyId = () => {
    if (t7Id) {
      navigator.clipboard.writeText(t7Id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Calculate average rating
  const avgRating = useMemo(() => {
    if (!videoLearning || videoLearning.length === 0) return 0;
    const total = videoLearning.reduce((acc, v) => {
      const r = typeof v.rating === 'number' ? v.rating : parseFloat(v.rating) || 0;
      return acc + r;
    }, 0);
    return (total / videoLearning.length).toFixed(1);
  }, [videoLearning]);

  // Filtered videos based on search and rating
  const filteredVideos = useMemo(() => {
    return videoLearning.filter(video => {
      const matchesSearch =
        !searchQuery ||
        video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.topSkills && video.topSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

      const numRating = typeof video.rating === 'number' ? video.rating : parseFloat(video.rating) || 0;
      const matchesRating =
        minRating === 'all' ? true :
        minRating === '4.5' ? numRating >= 4.5 :
        minRating === '4.0' ? numRating >= 4.0 : true;

      return matchesSearch && matchesRating;
    });
  }, [videoLearning, searchQuery, minRating]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Banner */}
      <div className="relative bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950 text-white px-6 sm:px-10 py-5 overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Prominent Go Back Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs sm:text-sm transition-all border border-white/15 hover:-translate-x-0.5 shadow-sm cursor-pointer flex-shrink-0"
              title="Go back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>

            <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/40 flex-shrink-0 border border-red-400/30">
              <Youtube className="w-6 h-6 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">YouTube Learning Tracker</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AI Video Analytics
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Real-time synchronization with the T7 Chrome Extension to extract skills, ratings & knowledge summaries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
            <button
              onClick={refreshVideoLearning}
              disabled={loadingVideos}
              className="p-2.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              title="Sync & Refresh Learning Data"
            >
              <RefreshCw className={`w-5 h-5 ${loadingVideos ? 'animate-spin text-red-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              title="Close & Back to Dashboard (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
              <span>Videos Analyzed</span>
              <Youtube className="w-3.5 h-3.5 text-red-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{videoLearning.length}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
              <span>Skills Mastered</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{ytSkills.length}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
              <span>Avg. Content Rating</span>
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{avgRating > 0 ? `${avgRating} / 5.0` : '—'}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
              <span>Your T7 Account ID</span>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono font-bold text-white text-xs sm:text-sm truncate">
                {t7Id || 'Not Generated'}
              </span>
              {t7Id && (
                <button
                  onClick={handleCopyId}
                  className="p-1 hover:bg-white/20 text-zinc-300 hover:text-white rounded transition-colors cursor-pointer"
                  title="Copy Account ID"
                >
                  {copiedId ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-6 sm:px-10 border-b border-zinc-200 bg-zinc-50 flex-shrink-0">
        <div className="flex space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('videos')}
            className={`py-3.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'videos'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Youtube className="w-4 h-4" />
            <span>Analyzed Videos</span>
            <span className="bg-zinc-200 text-zinc-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {videoLearning.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`py-3.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'skills'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Extracted Skills</span>
            <span className="bg-zinc-200 text-zinc-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {ytSkills.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('extension')}
            className={`py-3.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'extension'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Extension Setup & Sync</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/t7-extension.zip"
            download="t7-extension.zip"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .zip</span>
          </a>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="overflow-y-auto flex-1 bg-white p-6 sm:p-10">
        {/* TAB 1: VIDEOS LIST */}
        {activeTab === 'videos' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Search & Filter Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
              <div className="relative w-full sm:w-80 md:w-96">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by title, summary, or skill..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
                </span>
                <select
                  value={minRating}
                  onChange={e => setMinRating(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
                >
                  <option value="all">All Ratings</option>
                  <option value="4.5">⭐ 4.5+ Stars</option>
                  <option value="4.0">⭐ 4.0+ Stars</option>
                </select>
              </div>
            </div>

            {/* Video List Items */}
            {loadingVideos ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-red-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-zinc-800">Synchronizing with YouTube Extension...</p>
                <p className="text-xs text-zinc-400 mt-1">Fetching your latest video analyses from cloud storage</p>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-12 sm:py-16 px-6 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600 shadow-inner">
                  <Youtube className="w-8 h-8" />
                </div>
                {videoLearning.length === 0 ? (
                  <>
                    <h3 className="text-lg font-bold text-zinc-900">No YouTube Videos Synced Yet</h3>
                    <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
                      Install the T7 Chrome Extension and enter your Account ID (<span className="font-mono font-bold text-zinc-900">{t7Id}</span>). As you watch programming tutorials on YouTube, key skills and insights will automatically stream here!
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <a
                        href="/t7-extension.zip"
                        download="t7-extension.zip"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-red-600/30"
                      >
                        <Download className="w-4 h-4" />
                        Download Chrome Extension (.zip)
                      </a>
                      <button
                        onClick={() => setActiveTab('extension')}
                        className="px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer"
                      >
                        View Setup Guide
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-bold text-zinc-900">No matching videos found</h3>
                    <p className="text-xs text-zinc-500 mt-1">Try modifying your search keywords or rating filter.</p>
                    <button
                      onClick={() => { setSearchQuery(''); setMinRating('all'); }}
                      className="mt-3 text-xs font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredVideos.map((video) => {
                  const isExpanded = expandedVideoId === video.id;
                  const ratingNum = typeof video.rating === 'number' ? video.rating : parseFloat(video.rating) || 0;
                  
                  return (
                    <div
                      key={video.id}
                      className="p-4 sm:p-5 bg-zinc-50 hover:bg-zinc-100/80 rounded-2xl border border-zinc-200/90 transition-all shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-red-600/10 border border-red-200 flex items-center justify-center flex-shrink-0 text-red-600 mt-0.5">
                              <Youtube className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  {ratingNum.toFixed(1)} / 5.0
                                </span>
                                {video.relevance && (
                                  <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                                    Relevance: {video.relevance}%
                                  </span>
                                )}
                                {video.date && (
                                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {typeof video.date === 'string' ? video.date : new Date(video.date?.toDate ? video.date.toDate() : video.date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              <h4 className="font-bold text-zinc-900 text-sm sm:text-base leading-snug">
                                {video.title}
                              </h4>

                              {/* Skills chips */}
                              {video.topSkills && video.topSkills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                  {video.topSkills.map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold shadow-2xs"
                                    >
                                      <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-start flex-shrink-0 pt-1">
                            {video.videoId && (
                              <a
                                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                title="Open video in YouTube"
                              >
                                <span>Watch</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {video.summary && (
                              <button
                                onClick={() => setExpandedVideoId(isExpanded ? null : video.id)}
                                className="px-3 py-1.5 bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <span>{isExpanded ? 'Hide' : 'Summary'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable AI Summary */}
                      {isExpanded && video.summary && (
                        <div className="mt-3.5 pt-3.5 border-t border-zinc-200 bg-white/80 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-700 leading-relaxed border border-zinc-100 animate-in fade-in duration-150">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wider mb-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            AI Key Concepts & Takeaways
                          </div>
                          <p className="whitespace-pre-line text-zinc-700">{video.summary}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXTRACTED SKILLS MATRIX */}
        {activeTab === 'skills' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-amber-900">
                <p className="font-bold">Automated Skill Portfolio Integration</p>
                <p className="text-amber-800/90 mt-0.5">
                  Skills detected from your YouTube learning sessions are automatically synchronized and merged into your active skill profile, boosting your placement readiness evaluation.
                </p>
              </div>
            </div>

            {ytSkills.length === 0 ? (
              <div className="text-center py-16 px-4 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 max-w-xl mx-auto">
                <Sparkles className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <h4 className="font-bold text-zinc-700 text-base">No YouTube Skills Detected Yet</h4>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto mt-1">
                  Watch tech tutorials with the T7 Extension active. We'll automatically identify frameworks, languages, and tools!
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Mastered Technical Skills ({ytSkills.length})
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {ytSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="p-3.5 bg-zinc-50 hover:bg-red-50/50 border border-zinc-200 hover:border-red-200 rounded-2xl transition flex items-center gap-2.5 group shadow-2xs"
                    >
                      <div className="w-7 h-7 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs sm:text-sm text-zinc-900 truncate">{skill}</p>
                        <p className="text-[10px] text-zinc-400">YouTube Verified</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXTENSION SETUP & SYNC */}
        {activeTab === 'extension' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Account ID Showcase Card */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-900 rounded-3xl text-white border border-zinc-800 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">Your Permanent Account ID</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-300">
                      {t7Id || 'N/A'}
                    </span>
                    <button
                      onClick={handleCopyId}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                        copiedId
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                      }`}
                    >
                      {copiedId ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy ID</>}
                    </button>
                  </div>
                </div>

                <a
                  href="/t7-extension.zip"
                  download="t7-extension.zip"
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 hover:-translate-y-0.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Extension (.zip)</span>
                </a>
              </div>
            </div>

            {/* 3-Step Setup Instructions */}
            <div>
              <h3 className="text-base font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                3-Step Extension Installation Walkthrough
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center mb-3 shadow-md shadow-red-600/20">
                      1
                    </div>
                    <h4 className="font-bold text-zinc-900 text-sm mb-1">Download & Extract</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Download the <code className="bg-zinc-200 text-zinc-800 px-1 py-0.5 rounded text-[11px]">t7-extension.zip</code> file and unzip it into a folder on your computer.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-200 text-[11px] text-zinc-400">
                    Files include <span className="font-mono">manifest.json</span> & scripts.
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white font-black text-sm flex items-center justify-center mb-3 shadow-md">
                      2
                    </div>
                    <h4 className="font-bold text-zinc-900 text-sm mb-1">Load in Chrome</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Open <code className="bg-zinc-200 text-zinc-800 px-1 py-0.5 rounded text-[11px]">chrome://extensions</code>, turn on <strong>Developer mode</strong> (top-right), and click <strong>Load unpacked</strong>. Select the unzipped folder.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-200 text-[11px] text-zinc-400">
                    Works on Chrome, Brave, Edge & Opera.
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-3 shadow-md shadow-emerald-600/20">
                      3
                    </div>
                    <h4 className="font-bold text-zinc-900 text-sm mb-1">Paste Your Account ID</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Click the T7 extension icon in your browser toolbar, open <strong>Settings</strong>, and paste your ID: <strong className="text-zinc-900 font-mono">{t7Id}</strong>.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-200 text-[11px] text-zinc-400">
                    Watch YouTube tutorials & watch skills sync!
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Note */}
            <div className="p-4 bg-zinc-100 rounded-2xl flex items-center gap-3 text-xs text-zinc-600">
              <Info className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              <span>
                All video analyses are processed locally and securely stored in your personal T7 Learning Hub cloud profile.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer */}
      <div className="py-3.5 px-6 sm:px-10 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>T7 YouTube Sync: Active</span>
        </div>

        
      </div>
    </div>
  );
};

export default YouTubeTrackerModal;
