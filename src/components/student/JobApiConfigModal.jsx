/**
 * JobApiConfigModal — Configure Real-Time Job APIs (JSearch & Adzuna)
 */

import { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Check, Sparkles, Building2, ShieldCheck, HelpCircle } from 'lucide-react';

const JobApiConfigModal = ({ isOpen, onClose, onSaveKeys, currentKeys = {} }) => {
  const [rapidApiKey, setRapidApiKey] = useState(currentKeys.rapidApiKey || '');
  const [adzunaAppId, setAdzunaAppId] = useState(currentKeys.adzunaAppId || '');
  const [adzunaAppKey, setAdzunaAppKey] = useState(currentKeys.adzunaAppKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRapidApiKey(currentKeys.rapidApiKey || localStorage.getItem('t7_rapidapi_key') || '');
      setAdzunaAppId(currentKeys.adzunaAppId || localStorage.getItem('t7_adzuna_app_id') || '');
      setAdzunaAppKey(currentKeys.adzunaAppKey || localStorage.getItem('t7_adzuna_app_key') || '');
      setSavedSuccess(false);
    }
  }, [isOpen, currentKeys]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('t7_rapidapi_key', rapidApiKey.trim());
    localStorage.setItem('t7_adzuna_app_id', adzunaAppId.trim());
    localStorage.setItem('t7_adzuna_app_key', adzunaAppKey.trim());

    if (onSaveKeys) {
      onSaveKeys({
        rapidApiKey: rapidApiKey.trim(),
        adzunaAppId: adzunaAppId.trim(),
        adzunaAppKey: adzunaAppKey.trim(),
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setRapidApiKey('');
    setAdzunaAppId('');
    setAdzunaAppKey('');
    localStorage.removeItem('t7_rapidapi_key');
    localStorage.removeItem('t7_adzuna_app_id');
    localStorage.removeItem('t7_adzuna_app_key');
    if (onSaveKeys) {
      onSaveKeys({ rapidApiKey: '', adzunaAppId: '', adzunaAppKey: '' });
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-zinc-900 text-lg">Real-Time Job API Settings</h2>
            <p className="text-xs text-zinc-500">Connect JSearch (RapidAPI) or Adzuna API</p>
          </div>
        </div>

        <div className="mb-5 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/80 text-xs text-zinc-600 space-y-1.5">
          <p className="font-semibold text-zinc-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Keys are stored securely in your local browser storage.
          </p>
          <p className="text-zinc-500">
            If no keys are provided, the system automatically uses verified real-time industry listings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* JSearch API */}
          <div className="p-4 bg-white border border-zinc-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                1. JSearch API (RapidAPI)
              </span>
              <a
                href="https://rapidapi.com/letscrape-6bRBa3qguO5/api/jsearch"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Get RapidAPI Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-zinc-500">
              Aggregates real-time listings from LinkedIn, Indeed, Glassdoor, and Google for Jobs.
            </p>
            <input
              type="text"
              value={rapidApiKey}
              onChange={(e) => setRapidApiKey(e.target.value)}
              placeholder="Paste RapidAPI Key (e.g. 948f2...)"
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:bg-white focus:border-zinc-900 outline-none"
            />
          </div>

          {/* Adzuna API */}
          <div className="p-4 bg-white border border-zinc-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                2. Adzuna API (Official Licensed)
              </span>
              <a
                href="https://developer.adzuna.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <span>Get Adzuna App ID</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-zinc-500">
              Official aggregator covering thousands of sources across India and global markets.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={adzunaAppId}
                onChange={(e) => setAdzunaAppId(e.target.value)}
                placeholder="Adzuna App ID"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:bg-white focus:border-zinc-900 outline-none"
              />
              <input
                type="text"
                value={adzunaAppKey}
                onChange={(e) => setAdzunaAppKey(e.target.value)}
                placeholder="Adzuna App Key"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:bg-white focus:border-zinc-900 outline-none"
              />
            </div>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" /> API Settings saved successfully!
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 text-xs font-semibold text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              Reset to Defaults
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApiConfigModal;
