/**
 * Login Page - Sleek Black & Grey Theme
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Loader2, 
  Sparkles,
  ArrowRight,
  Rocket
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const { login, loginWithGoogle, pendingRedirectSignup, clearPendingRedirectSignup } = useAuth();
  const navigate = useNavigate();

  // If a new user tried to log in via Google, redirect them to signup with a message
  useEffect(() => {
    if (pendingRedirectSignup) {
      clearPendingRedirectSignup();
      setError(`No account found for ${pendingRedirectSignup.email}. Please sign up first.`);
    }
  }, [pendingRedirectSignup, clearPendingRedirectSignup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      // loginWithGoogle uses full-page redirect — page will navigate away to Google.
      // On return, getRedirectResult in AuthContext handles routing automatically.
      await loginWithGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Could not start Google Sign-In. Please try again.');
      setGoogleLoading(false);
    }
    // Note: setGoogleLoading(false) NOT called on success — page is redirecting away
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-zinc-800 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">T7 Learning Hub</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
            Welcome back! 👋
            <br />
            <span className="text-zinc-400">Ready to level up?</span>
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-md mb-8">
            Continue your journey to becoming placement-ready with AI-powered insights.
          </p>

          {/* Feature cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop" 
                alt="" 
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <p className="font-semibold text-white">Track Progress</p>
                <p className="text-sm text-zinc-400">See how far you've come</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4">
              <img 
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=100&h=100&fit=crop" 
                alt="" 
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <p className="font-semibold text-white">Learn Smarter</p>
                <p className="text-sm text-zinc-400">AI-curated roadmap awaits</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900">T7 Learning Hub</span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-black text-zinc-900 mb-2">Sign in</h2>
            <p className="text-zinc-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-zinc-900 font-semibold hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3.5 px-4 bg-white border-2 border-zinc-200 hover:border-zinc-900 rounded-xl font-semibold text-zinc-800 hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 mb-6 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-700" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-zinc-200 w-full"></div>
            <span className="bg-white px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              or with email
            </span>
            <div className="border-t border-zinc-200 w-full"></div>
          </div>


          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
            >
              <Rocket className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;