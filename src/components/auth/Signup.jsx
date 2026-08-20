/**
 * Signup Page — Professional Student Registration
 * - Collects Name, College, Branch (full dropdown), Phone, Email, Password
 * - Google sign-up: enter College/Branch/Phone first, then click Google
 * - Existing users via Google: updates empty fields and goes to dashboard
 */

import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { branches } from '../../data/industrySkills';
import {
  Mail, Lock, User, Building2, GraduationCap, Phone,
  Loader2, Sparkles, ArrowRight, ChevronDown
} from 'lucide-react';

const GOOGLE_ICON = (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const InputField = ({ id, label, icon: Icon, type = 'text', value, onChange, placeholder, required = true }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-zinc-700 mb-1.5">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400"
      />
    </div>
  </div>
);

const Signup = () => {
  const [form, setForm] = useState({
    name: '', college: '', branch: '', phone: '', email: '', password: '',
  });
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signup, signupWithGoogle, currentUser, userProfile } = useAuth();

  // Auto-redirect if already logged in (catches Google redirect return)
  if (currentUser && userProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  /* ── Email/Password signup ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim())    return setError('Please enter your full name.');
    if (!form.college.trim()) return setError('Please enter your college name.');
    if (!form.branch)         return setError('Please select your branch.');
    if (!form.phone.trim())   return setError('Please enter your phone number.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      await signup(form.email, form.password, {
        name: form.name.trim(), college: form.college.trim(),
        branch: form.branch,    phone: form.phone.trim(),
      });
      // Navigate guard above handles redirect once userProfile is set
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Google signup ── */
  const handleGoogleSignup = async () => {
    setError('');
    if (!form.college.trim() || !form.branch || !form.phone.trim()) {
      setError('Please fill in College, Branch, and Phone before continuing with Google.');
      return;
    }
    setGoogleLoading(true);
    try {
      await signupWithGoogle({
        name: form.name.trim(), college: form.college.trim(),
        branch: form.branch,   phone: form.phone.trim(),
      });
    } catch (err) {
      console.error('Google signup error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed popup
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setError(err.message || 'Failed to sign up with Google. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-zinc-900 relative overflow-hidden flex-col justify-center px-14 xl:px-20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-zinc-800 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-zinc-800 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">T7 Learning Hub</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-5">
            Start your journey 🚀<br />
            <span className="text-zinc-400">Placement-ready in days.</span>
          </h1>
          <p className="text-zinc-400 text-base max-w-sm mb-8">
            Join thousands of students who are tracking their skills, analyzing gaps, and landing internships.
          </p>
          <div className="space-y-3">
            {[
              { icon: '✅', text: '100% Free — No hidden fees' },
              { icon: '🤖', text: 'AI-powered skill analysis' },
              { icon: '📊', text: 'Real-time placement readiness score' },
              { icon: '🎥', text: 'YouTube learning tracker' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-zinc-300 text-sm font-medium">
                <span className="text-base">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-7/12 flex items-start justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-lg py-4">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900">T7 Learning Hub</span>
          </div>

          <div className="mb-7">
            <h2 className="text-3xl font-black text-zinc-900 mb-1">Create account</h2>
            <p className="text-zinc-500">
              Already have an account?{' '}
              <Link to="/login" className="text-zinc-900 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border-2 border-red-100 rounded-xl text-red-700 text-sm font-medium">
              {error}
              {error.includes('already registered') && (
                <span className="block mt-1">
                  <Link to="/login" className="font-bold underline">Sign in instead →</Link>
                </span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Name */}
            <InputField id="name" label="Full Name" icon={User}
              value={form.name} onChange={set('name')} placeholder="Rahul Sharma" />

            {/* Row 2: College */}
            <InputField id="college" label="College / University" icon={Building2}
              value={form.college} onChange={set('college')} placeholder="JNTU, VIT, Anna University…" />

            {/* Row 3: Branch dropdown */}
            <div>
              <label htmlFor="branch" className="block text-sm font-semibold text-zinc-700 mb-1.5">Branch / Department</label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <select
                  id="branch"
                  value={form.branch}
                  onChange={set('branch')}
                  required
                  className="w-full pl-11 pr-10 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium appearance-none cursor-pointer"
                >
                  <option value="">Select your branch</option>
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

            {/* Row 4: Phone */}
            <InputField id="phone" label="Phone Number" icon={Phone} type="tel"
              value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />

            {/* Divider */}
            <div className="border-t border-zinc-100 pt-2">
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wide mb-3">Account credentials</p>
            </div>

            {/* Row 5: Email */}
            <InputField id="email" label="Email address" icon={Mail} type="email"
              value={form.email} onChange={set('email')} placeholder="you@example.com" />

            {/* Row 6: Password */}
            <InputField id="password" label="Password (min 6 chars)" icon={Lock} type="password"
              value={form.password} onChange={set('password')} placeholder="••••••••" />

            {/* Submit */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</>
              ) : (
                <>Create account <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-zinc-200" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">or</span>
            <div className="flex-1 border-t border-zinc-200" />
          </div>

          {/* Google signup note */}
          <p className="text-xs text-zinc-400 mb-3 text-center">
            Fill College, Branch & Phone above first, then:
          </p>

          {/* Google button */}
          <button
            type="button"
            id="google-signup-btn"
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full py-3.5 px-4 bg-white border-2 border-zinc-200 hover:border-zinc-800 rounded-xl font-semibold text-zinc-800 hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : GOOGLE_ICON}
            <span>{googleLoading ? 'Connecting with Google...' : 'Sign up with Google'}</span>
          </button>

          <div className="mt-6 text-center">
            <Link to="/" className="text-zinc-400 hover:text-zinc-700 text-sm font-medium transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
