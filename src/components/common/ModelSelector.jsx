/**
 * ModelSelector — Sleek Google Gemini Model Switcher
 * Styled to match the exact dark floating model selector UI
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Info, 
  Zap, 
  Brain, 
  Key, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import { fetchAvailableGeminiModels, DEFAULT_GEMINI_MODELS } from '../../services/geminiService';

const ModelSelector = ({ 
  currentModel = 'auto', 
  onModelChange, 
  apiKey = null, 
  onOpenKeySettings = null,
  variant = 'compact' // 'compact' | 'pill' | 'inline'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState(DEFAULT_GEMINI_MODELS);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live models when opened or when API key changes
  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      setLoading(true);
      try {
        const fetched = await fetchAvailableGeminiModels(apiKey);
        if (isMounted && fetched && fetched.length > 0) {
          setModels(fetched);
        }
      } catch (e) {
        console.warn('Could not load live models:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadModels();
    return () => { isMounted = false; };
  }, [apiKey]);

  const activeModelObj = models.find(m => m.id === currentModel);
  const displayLabel = currentModel === 'auto' 
    ? 'Gemini 3.7 Flash High' 
    : (activeModelObj?.displayName || currentModel);

  const handleSelect = (modelId) => {
    if (onModelChange) {
      onModelChange(modelId);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#0f171c]/90 hover:bg-[#16222a] border border-[#223541] rounded-xl text-xs font-semibold text-zinc-200 shadow-md backdrop-blur-md transition-all cursor-pointer group"
          title="Switch Gemini AI Model"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="truncate max-w-[150px]">{displayLabel}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-300 transition-all cursor-pointer"
          title="Select AI Model"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span className="truncate max-w-[120px]">{displayLabel}</span>
          <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Floating Menu (Matches User Screenshot Exact Aesthetic) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#0c151a] border border-[#1b2b35] rounded-2xl shadow-2xl py-2.5 z-50 animate-fade-in backdrop-blur-xl divide-y divide-[#15232c] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 tracking-wider">Model</span>
            {loading && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
          </div>

          {/* Model Options List */}
          <div className="p-1.5 space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
            {/* Auto Option */}
            <button
              type="button"
              onClick={() => handleSelect('auto')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group ${
                currentModel === 'auto'
                  ? 'bg-[#15232c] text-white border border-cyan-500/30'
                  : 'text-zinc-300 hover:bg-[#111e25] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold leading-tight">Gemini 3.7 Flash</p>
                  <p className="text-[10px] text-zinc-400">High Reasoning & Thinking</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-cyan-950/70 text-cyan-300 border border-cyan-800/40">
                  High
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Live Models */}
            {models.map((model) => {
              const isSelected = currentModel === model.id;
              const isFlash = model.isFlash || model.id.includes('flash');
              const isPro = model.isPro || model.id.includes('pro');

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelect(model.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-[#15232c] text-white border border-cyan-500/30'
                      : 'text-zinc-300 hover:bg-[#111e25] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-cyan-400' : 'bg-zinc-600'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{model.displayName}</p>
                      <p className="text-[10px] text-zinc-500 truncate">
                        {isPro ? 'Deep Placement Reasoning' : (isFlash ? 'Fast Response Time' : 'General Intelligence')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {model.tag && (
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md flex items-center gap-1 ${
                        model.tag === 'High' 
                          ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/40' 
                          : 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/50'
                      }`}>
                        <span>{model.tag}</span>
                        {model.tag === 'Fast' && <Info className="w-2.5 h-2.5 text-zinc-400" />}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Action */}
          {onOpenKeySettings && (
            <div className="p-2 bg-[#091014]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenKeySettings();
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-zinc-400 hover:text-cyan-300 hover:bg-[#111e25] rounded-xl flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configure Gemini API Key</span>
                </span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
