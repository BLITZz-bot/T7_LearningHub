/**
 * CompleteProfileOnboarding — Unskippable First-Time Student Onboarding
 * 
 * Displayed when a student signs in directly via Google (or has an incomplete profile)
 * without completing their required student details (College, Branch, Passout Year, Phone).
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branches, passoutYears } from '../../data/industrySkills';
import {
  Sparkles, Building2, GraduationCap, Calendar, Phone,
  User, ArrowRight, Loader2, CheckCircle2, AlertCircle, ChevronDown
} from 'lucide-react';

const CompleteProfileOnboarding = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();

  const [name, setName] = useState(
    userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || ''
  );
  const [college, setCollege] = useState(
    userProfile?.college && userProfile.college !== 'Engineering College' ? userProfile.college : ''
  );
  const [branch, setBranch] = useState(userProfile?.branch || '');
  const [passoutYear, setPassoutYear] = useState(userProfile?.passoutYear || userProfile?.year_of_study || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Please enter your full name.');
    if (!college.trim()) return setError('Please enter your college or university.');
    if (!branch) return setError('Please select your branch / department.');
    if (!passoutYear) return setError('Please select your graduation year.');
    if (!phone.trim()) return setError('Please enter your phone number.');

    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, {
        email: currentUser.email,
        name: name.trim(),
        college: college.trim(),
        branch,
        passoutYear,
        phone: phone.trim(),
      });
    } catch (err) {
      console.error('Failed to complete profile:', err);
      setError(err.message || 'Failed to save student details. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden relative z-10 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 p-8 text-white relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/15">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">First-Time Setup</span>
              <h2 className="text-xl font-black text-white">Welcome to T7 Learning Hub! 👋</h2>
            </div>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed mt-2">
            You signed in with <span className="font-semibold text-white">{currentUser?.email}</span>. Please complete your student details below so our AI can personalize your placement roadmap and skill gap analytics.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-sm font-semibold animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                required
                className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none text-zinc-900 font-medium transition-all"
              />
            </div>
          </div>

          {/* College */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              College / University <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. VIT, JNTU, Anna University, IIT Bombay"
                required
                className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none text-zinc-900 font-medium transition-all"
              />
            </div>
          </div>

          {/* Branch Dropdown */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Branch / Department <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
                className="w-full pl-11 pr-10 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none text-zinc-900 font-medium appearance-none cursor-pointer transition-all"
              >
                <option value="">Select your department / engineering branch</option>
                <optgroup label="Core Engineering">
                  {branches.slice(0, 7).map((b) => <option key={b} value={b}>{b}</option>)}
                </optgroup>
                <optgroup label="Specialised Technology">
                  {branches.slice(7, 13).map((b) => <option key={b} value={b}>{b}</option>)}
                </optgroup>
                <optgroup label="Other Engineering">
                  {branches.slice(13, 26).map((b) => <option key={b} value={b}>{b}</option>)}
                </optgroup>
                <optgroup label="Other">
                  {branches.slice(26).map((b) => <option key={b} value={b}>{b}</option>)}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Passout Year & Phone in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Passout Year <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                <select
                  value={passoutYear}
                  onChange={(e) => setPassoutYear(e.target.value)}
                  required
                  className="w-full pl-11 pr-10 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none text-zinc-900 font-medium appearance-none cursor-pointer transition-all"
                >
                  <option value="">Select Year</option>
                  {passoutYears.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none text-zinc-900 font-medium transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-zinc-900/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving your profile...</>
            ) : (
              <>Complete Registration & Enter Dashboard <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfileOnboarding;
