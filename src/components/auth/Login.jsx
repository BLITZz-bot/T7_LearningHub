/**
 * Login Page — Professional Sign In
 * - Existing users: email+password or Google → dashboard
 * - New/unregistered users: clear, professional "Account not found" prompt with quick sign-up
 */

import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Loader2, Sparkles, ArrowRight, UserPlus, AlertCircle, ShieldAlert } from 'lucide-react';

const GOOGLE_ICON = (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [email,             setEmail]             = useState('');
  const [password,          setPassword]          = useState('');
  const [error,             setError]             = useState('');
  const [notFoundInfo,      setNotFoundInfo]      = useState(null); // { email, message }
  const [emailLoading,      setEmailLoading]      = useState(false);
  const [googleLoading,     setGoogleLoading]     = useState(false);

  const { login, loginWithGoogle, currentUser, userProfile } = useAuth();

  // ── If already logged in → go to dashboard (AuthProvider handles loading state)
  if (currentUser && userProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  /* handlers */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setNotFoundInfo(null);
    setEmailLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      const errMsg = err.message || '';
      if (
        err.code === 'auth/user-not-found' ||
        errMsg.toLowerCase().includes('invalid login credentials') ||
        errMsg.toLowerCase().includes('user-not-found') ||
        err.code === 'auth/invalid-credential'
      ) {
        setNotFoundInfo({
          email: email.trim(),
          title: 'Account Not Found or Invalid Password',
          message: `Could not sign in with "${email.trim()}". If you are a new student, please sign up first to set up your profile.`,
        });
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again or reset your password.');
      } else {
        setError(errMsg || 'Failed to sign in. Please check your credentials and try again.');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setNotFoundInfo(null);
    setGoogleLoading(true);
    try {
      localStorage.setItem('t7_oauth_origin', 'login');
    } catch (e) {}

    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google login error:', err);
      if (err.code === 'auth/user-not-found') {
        setNotFoundInfo({
          email: err.userEmail || '',
          title: 'Google Account Not Registered',
          message: `No T7 Learning Hub account is registered with ${err.userEmail || 'this Google account'}. Please create your account first.`,
        });
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User voluntarily closed popup
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setError(err.message || 'Could not sign in with Google. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const goToSignupWithEmail = (targetEmail) => {
    navigate('/signup', { state: { email: targetEmail } });
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 relative overflow-hidden flex-col justify-center px-14 xl:px-20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-zinc-800 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-zinc-800 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">T7 Learning Hub</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-5">
            Welcome back! 👋<br />
            <span className="text-zinc-400">Ready to level up?</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-md mb-8">
            Continue your journey to becoming placement-ready with AI-powered insights.
          </p>
          <div className="space-y-3">
            {[
              { icon: '📈', title: 'Track Progress', sub: 'See how far you\'ve come' },
              { icon: '🧠', title: 'Learn Smarter',  sub: 'AI-curated roadmap awaits' },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-4 bg-zinc-800/60 backdrop-blur-sm rounded-xl p-4">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-zinc-400">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900">T7 Learning Hub</span>
          </div>

          {/* ── New Student Sign-up Guidance Banner ── */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/80 to-zinc-50 border-2 border-blue-100 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
            <div>
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">First time here?</p>
              <p className="text-xs text-zinc-600 mt-0.5">Please sign up first to register your college & branch details.</p>
            </div>
            <Link
              to="/signup"
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
            >
              Sign up <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-zinc-900 mb-1">Sign in</h2>
            <p className="text-zinc-500">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-zinc-900 font-semibold hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>

          {/* ── Professional "Account Not Found" Card ── */}
          {notFoundInfo && (
            <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 border-2 border-amber-200/80 rounded-2xl shadow-sm animate-fade-in">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-700 mt-0.5 border border-amber-300/40">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 text-base">{notFoundInfo.title}</h4>
                  <p className="text-amber-800/90 text-sm mt-1 leading-relaxed">
                    {notFoundInfo.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => goToSignupWithEmail(notFoundInfo.email)}
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-900/15 hover:-translate-y-0.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Free Account →</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Standard Error ── */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border-2 border-red-100 rounded-xl text-red-700 text-sm font-medium flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <span>{error}</span>
                {(error.includes('sign up') || error.includes('new to T7')) && (
                  <button
                    type="button"
                    onClick={() => goToSignupWithEmail(email)}
                    className="block mt-1.5 font-bold text-red-900 underline hover:no-underline"
                  >
                    Sign up for free here →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Google button ── */}
          <button
            type="button"
            id="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={googleLoading || emailLoading}
            className="w-full py-3.5 px-4 bg-white border-2 border-zinc-200 hover:border-zinc-800 rounded-xl font-semibold text-zinc-800 hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 mb-5 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : GOOGLE_ICON}
            <span>{googleLoading ? 'Connecting with Google...' : 'Continue with Google'}</span>
          </button>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 border-t border-zinc-200" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">or with email</span>
            <div className="flex-1 border-t border-zinc-200" />
          </div>

          {/* ── Email form ── */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={emailLoading || googleLoading}
              className="w-full py-3.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {emailLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
              ) : (
                <>Sign in <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/" className="text-zinc-400 hover:text-zinc-700 text-sm font-medium transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;