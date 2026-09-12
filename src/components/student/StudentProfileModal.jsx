/**
 * StudentProfileModal — Professional Student Profile Viewer & Editor
 * 
 * Allows students to view all signup & academic data (Name, College, Branch, 
 * Passout Year, Phone, Email, T7 ID, Skills, Readiness Score) and edit their 
 * profile (Name, Passout Year, Branch, College, Phone) with live Firestore synchronization.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branches, passoutYears } from '../../data/industrySkills';
import { verifyGeminiApiKey, fetchAvailableGeminiModels, DEFAULT_GEMINI_MODELS } from '../../services/geminiService';
import {
  X, User, Mail, Phone, Building2, GraduationCap, Calendar, 
  Sparkles, CheckCircle2, ShieldCheck, Edit3, Save, RotateCcw, 
  Copy, Check, Target, Briefcase, Award, Loader2, AlertCircle,
  Key, Eye, EyeOff, ExternalLink, Zap, Brain
} from 'lucide-react';

const StudentProfileModal = ({ isOpen, onClose, lastAnalysis, initialEditMode = false }) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    branch: '',
    passoutYear: '',
    phone: '',
    geminiApiKey: '',
    geminiModel: 'auto',
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [keyVerificationResult, setKeyVerificationResult] = useState(null);
  const [availableModels, setAvailableModels] = useState(DEFAULT_GEMINI_MODELS);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedT7Id, setCopiedT7Id] = useState(false);

  // Sync profile data when opened or updated
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        college: userProfile.college || '',
        branch: userProfile.branch || '',
        passoutYear: userProfile.passoutYear || userProfile.year || '',
        phone: userProfile.phone || '',
        geminiApiKey: userProfile.geminiApiKey || '',
        geminiModel: userProfile.geminiModel || 'auto',
      });
      if (userProfile.geminiApiKey) {
        fetchAvailableGeminiModels(userProfile.geminiApiKey).then(setAvailableModels);
      }
    }
  }, [userProfile, isOpen]);

  // Reset states and handle initial edit mode when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setIsEditing(initialEditMode);
      setSaveSuccess(false);
      setErrorMessage('');
      setKeyVerificationResult(null);
    } else {
      setIsEditing(false);
      setSaveSuccess(false);
      setErrorMessage('');
      setKeyVerificationResult(null);
    }
  }, [isOpen, initialEditMode]);

  const handleVerifyApiKey = async () => {
    if (!formData.geminiApiKey || !formData.geminiApiKey.trim()) {
      setKeyVerificationResult({ valid: false, error: 'Please enter a Gemini API key to verify' });
      return;
    }

    setVerifyingKey(true);
    setKeyVerificationResult(null);
    try {
      const result = await verifyGeminiApiKey(formData.geminiApiKey.trim());
      setKeyVerificationResult(result);
      if (result.valid && result.models) {
        setAvailableModels(result.models);
      }
    } catch (e) {
      setKeyVerificationResult({ valid: false, error: e.message || 'Verification failed' });
    } finally {
      setVerifyingKey(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyT7Id = () => {
    if (userProfile?.t7Id) {
      navigator.clipboard.writeText(userProfile.t7Id);
      setCopiedT7Id(true);
      setTimeout(() => setCopiedT7Id(false), 2000);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (saveSuccess) setSaveSuccess(false);
    if (errorMessage) setErrorMessage('');
    if (field === 'geminiApiKey') setKeyVerificationResult(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!formData.college.trim()) {
      setErrorMessage('College name is required.');
      return;
    }
    if (!formData.branch) {
      setErrorMessage('Branch is required.');
      return;
    }
    if (!formData.passoutYear) {
      setErrorMessage('Graduation / Passout year is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      await updateUserProfile(currentUser.uid, {
        email: currentUser.email,
        name: formData.name.trim(),
        college: formData.college.trim(),
        branch: formData.branch,
        passoutYear: formData.passoutYear,
        phone: formData.phone.trim(),
        geminiApiKey: formData.geminiApiKey.trim(),
        geminiModel: formData.geminiModel,
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setErrorMessage('Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        college: userProfile.college || '',
        branch: userProfile.branch || '',
        passoutYear: userProfile.passoutYear || userProfile.year || '',
        phone: userProfile.phone || '',
        geminiApiKey: userProfile.geminiApiKey || '',
        geminiModel: userProfile.geminiModel || 'auto',
      });
    }
    setIsEditing(false);
    setErrorMessage('');
    setKeyVerificationResult(null);
  };

  const memberSince = userProfile?.createdAt?.toDate
    ? userProfile.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Active Member';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden z-10 my-8 animate-fade-in">
        
        {/* Header Hero Banner */}
        <div className="relative bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-800 p-6 sm:p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar with Initials & Badge */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 p-0.5 shadow-xl flex items-center justify-center">
                <div className="w-full h-full bg-zinc-900 rounded-[14px] flex items-center justify-center">
                  <span className="text-3xl font-black text-white">
                    {userProfile?.name?.charAt(0)?.toUpperCase() || 'S'}
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-zinc-900 shadow" title="Verified Account">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h2 className="text-2xl font-black text-white">{userProfile?.name || 'Student Profile'}</h2>
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 text-zinc-200 rounded-full border border-white/10">
                  Student
                </span>
              </div>
              <p className="text-sm text-zinc-400 mb-3">{userProfile?.email}</p>

              {/* T7 ID Badge */}
              {userProfile?.t7Id && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl border border-white/10 text-xs font-mono text-zinc-200 transition-colors">
                  <span className="text-zinc-400 font-sans font-medium">T7 ID:</span>
                  <span className="font-bold text-amber-300">{userProfile.t7Id}</span>
                  <button 
                    onClick={handleCopyT7Id} 
                    className="p-1 hover:text-white transition-colors"
                    title="Copy T7 ID"
                  >
                    {copiedT7Id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Edit / Mode Toggle */}
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="self-start sm:self-center px-4 py-2.5 bg-white text-zinc-900 hover:bg-zinc-100 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2 hover:-translate-y-0.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
          {/* Notification Banners */}
          {(!userProfile?.college || !userProfile?.branch || userProfile?.college === 'Engineering College') && (
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-950">Welcome to T7 Learning Hub! 🎉</h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Please complete your required student details (College, Branch, Passout Year, Phone) below so our AI can personalize your placement roadmaps and job market tracking.
                </p>
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Your profile details have been updated successfully!</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm font-semibold animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isEditing ? (
            /* ──────────────── EDIT MODE FORM ──────────────── */
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-zinc-500" />
                  Edit Profile Details
                </h3>
                <span className="text-xs text-zinc-400 font-medium">All fields sync to your account</span>
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Full Name / User Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none text-zinc-900 font-medium text-sm transition-all"
                  />
                </div>
              </div>

              {/* College */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  College / University
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={formData.college}
                    onChange={handleInputChange('college')}
                    required
                    placeholder="e.g. IIT Bombay, NIT Trichy, VIT..."
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none text-zinc-900 font-medium text-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Branch */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Branch / Department
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <select
                      value={formData.branch}
                      onChange={handleInputChange('branch')}
                      required
                      className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none text-zinc-900 font-medium text-sm transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Passout Year */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Passout / Graduation Year
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <select
                      value={formData.passoutYear}
                      onChange={handleInputChange('passoutYear')}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none text-zinc-900 font-medium text-sm transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Passout Year</option>
                      {passoutYears.map(yr => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    placeholder="+91 9876543210"
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none text-zinc-900 font-medium text-sm transition-all"
                  />
                </div>
              </div>

              {/* ──────────────── GOOGLE GEMINI AI CONFIGURATION ──────────────── */}
              <div className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 text-white space-y-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Google Gemini AI Engine
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                          Live API
                        </span>
                      </h4>
                      <p className="text-[11px] text-zinc-400">Power your Roadmaps, T7 Tutor, and Chatbot with your personal Google key</p>
                    </div>
                  </div>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all"
                  >
                    <span>Get Free Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Gemini API Key Input */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Personal Gemini API Key (Optional)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={formData.geminiApiKey}
                        onChange={handleInputChange('geminiApiKey')}
                        placeholder="AIzaSy..."
                        className="w-full pl-10 pr-10 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl focus:border-cyan-400 outline-none text-white text-xs font-mono transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        title={showApiKey ? "Hide key" : "Show key"}
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyApiKey}
                      disabled={verifyingKey || !formData.geminiApiKey}
                      className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 flex-shrink-0"
                    >
                      {verifyingKey ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing...</>
                      ) : (
                        <><Zap className="w-3.5 h-3.5" /> Verify Key</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Verification Feedback Banner */}
                {keyVerificationResult && (
                  <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
                    keyVerificationResult.valid
                      ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                      : 'bg-red-950/70 border border-red-800 text-red-300'
                  }`}>
                    {keyVerificationResult.valid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Connected! Google detected {keyVerificationResult.models?.length || 0} active Gemini models.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span>{keyVerificationResult.error}</span>
                      </>
                    )}
                  </div>
                )}

                {/* Preferred Model Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Preferred Live Model
                  </label>
                  <select
                    value={formData.geminiModel}
                    onChange={handleInputChange('geminiModel')}
                    className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl focus:border-cyan-400 outline-none text-white text-xs font-medium cursor-pointer"
                  >
                    <option value="auto">✨ Auto (Selects fastest & smartest model automatically)</option>
                    {availableModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.displayName} {m.tag ? `(${m.tag})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Readonly Email Note */}
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500 flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span>Email ({userProfile?.email}) is linked to your authentication provider.</span>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-5 py-2.5 border-2 border-zinc-200 hover:border-zinc-300 text-zinc-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving changes...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Profile</>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ──────────────── VIEW MODE ──────────────── */
            <div className="space-y-6">
              {/* Academic & Contact Details Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                    Academic & Registration Credentials
                  </h3>
                  
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Full Name */}
                  <div className="p-4 bg-zinc-50 hover:bg-zinc-100/80 rounded-2xl border border-zinc-200/80 transition-colors">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <User className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Full Name</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900">{userProfile?.name || '—'}</p>
                  </div>

                  {/* Passout Year */}
                  <div className="p-4 bg-gradient-to-br from-violet-50/50 to-indigo-50/50 rounded-2xl border border-violet-100 transition-colors">
                    <div className="flex items-center gap-2 text-violet-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Passout Year</span>
                    </div>
                    <p className="text-sm font-black text-violet-950">
                      {userProfile?.passoutYear ? userProfile.passoutYear : (userProfile?.year ? `Year ${userProfile.year}` : 'Not Specified')}
                    </p>
                  </div>

                  {/* College */}
                  <div className="p-4 bg-zinc-50 hover:bg-zinc-100/80 rounded-2xl border border-zinc-200/80 transition-colors sm:col-span-2">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <Building2 className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">College / University</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900">{userProfile?.college || '—'}</p>
                  </div>

                  {/* Branch */}
                  <div className="p-4 bg-zinc-50 hover:bg-zinc-100/80 rounded-2xl border border-zinc-200/80 transition-colors sm:col-span-2">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Branch / Department</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900">{userProfile?.branch || '—'}</p>
                  </div>

                  {/* Phone */}
                  <div className="p-4 bg-zinc-50 hover:bg-zinc-100/80 rounded-2xl border border-zinc-200/80 transition-colors">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <Phone className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Phone Number</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900">{userProfile?.phone || '—'}</p>
                  </div>

                  {/* Email */}
                  <div className="p-4 bg-zinc-50 hover:bg-zinc-100/80 rounded-2xl border border-zinc-200/80 transition-colors">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Email Address</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 truncate">{userProfile?.email || '—'}</p>
                  </div>
                </div>
              </div>

              {/* ──────────────── GOOGLE GEMINI AI ENGINE STATUS (VIEW MODE) ──────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                    Google Gemini AI Connection
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" />
                    <span>{userProfile?.geminiApiKey ? 'Change Key' : 'Connect Personal Key'}</span>
                  </button>
                </div>

                <div className="p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {userProfile?.geminiApiKey ? 'Personal Key Connected' : 'Default System Key'}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          userProfile?.geminiApiKey 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {userProfile?.geminiApiKey ? 'Unlimited Quota' : 'Shared Quota'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Active Model: <strong className="text-cyan-300">{userProfile?.geminiModel === 'auto' || !userProfile?.geminiModel ? 'Gemini 3.7 Flash (Auto)' : userProfile.geminiModel}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="self-start sm:self-center px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-all border border-white/10"
                  >
                    {userProfile?.geminiApiKey ? 'Manage Key' : '⚡ Connect Free Key'}
                  </button>
                </div>
              </div>

              {/* Placement & Skills Overview */}
              <div>
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">
                  Placement & Career Target
                </h3>
                <div className="p-5 bg-zinc-900 text-white rounded-2xl border border-zinc-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Career Interest</span>
                      <p className="text-base font-bold text-white mt-0.5">
                        {userProfile?.career_interest ? userProfile.career_interest.replace(/-/g, ' ').toUpperCase() : 'None Selected Yet'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Readiness Score</span>
                      <p className="text-xl font-black text-emerald-400 mt-0.5">
                        {lastAnalysis?.readiness_score ? `${lastAnalysis.readiness_score}%` : 'Pending Analysis'}
                      </p>
                    </div>
                  </div>

                  {/* Skills Tags */}
                  {userProfile?.skills?.length > 0 && (
                    <div className="pt-3 border-t border-zinc-800">
                      <span className="text-xs font-medium text-zinc-400 block mb-2">
                        Active Skills ({userProfile.skills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {userProfile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Meta */}
              <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-100">
                <span>Account Status: <strong className="text-emerald-600 font-semibold">Active & Verified</strong></span>
                <span>Joined {memberSince}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
