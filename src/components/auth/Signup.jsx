/**
 * Signup Page - Complete Student Profile Capture
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { branches } from '../../data/industrySkills';
import { 
  Mail, 
  Lock, 
  User, 
  Building2,
  GraduationCap,
  Phone,
  Loader2, 
  Sparkles,
  ArrowRight,
  Rocket
} from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    branch: '',
    phone: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const { signup, signupWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.college.trim()) {
      setError('Please enter your college name');
      return;
    }
    if (!formData.branch) {
      setError('Please select your branch');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);

    try {
      await signup(formData.email, formData.password, {
        name: formData.name.trim(),
        college: formData.college.trim(),
        branch: formData.branch,
        phone: formData.phone.trim(),
        role: formData.role
      });
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try signing in.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    
    if (!formData.college.trim() || !formData.branch || !formData.phone.trim()) {
      setError('Please fill in your College, Branch, and Phone number above before continuing with Google.');
      return;
    }

    setGoogleLoading(true);
    try {
      await signupWithGoogle({
        name: formData.name.trim(),
        college: formData.college.trim(),
        branch: formData.branch,
        phone: formData.phone.trim()
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Google sign up error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
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
            Start your journey 🚀
            <br />
            <span className="text-zinc-400">to placement success!</span>
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-md mb-8">
            Join students who are preparing smarter with AI-powered skill analysis and career roadmaps.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: '🎯', text: 'Personalized skill roadmap' },
              { icon: '🤖', text: 'AI-powered analysis' },
              { icon: '📈', text: 'Track your progress' },
              { icon: '🆓', text: 'Completely free' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 bg-zinc-800/50 backdrop-blur-sm rounded-xl p-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-white font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative image */}
        <img 
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400" 
          alt="" 
          className="absolute bottom-0 right-0 w-72 h-72 object-cover rounded-tl-3xl opacity-20"
        />
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900">T7 Learning Hub</span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-black text-zinc-900 mb-2">Create account</h2>
            <p className="text-zinc-600">
              Already have an account?{' '}
              <Link to="/login" className="text-zinc-900 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400 text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* College Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                College / University
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400 text-sm"
                  placeholder="e.g. IIT Bombay / Anna University"
                  required
                />
              </div>
            </div>

            {/* Branch / Department & Phone Number Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Branch
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium text-sm appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400 text-sm"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400 text-sm"
                  placeholder="Min. 6 characters"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account with Email
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-zinc-200 w-full"></div>
            <span className="bg-white px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              or sign up with
            </span>
            <div className="border-t border-zinc-200 w-full"></div>
          </div>

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full py-3.5 px-4 bg-white border-2 border-zinc-200 hover:border-zinc-900 rounded-xl font-semibold text-zinc-800 hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
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

          <p className="text-xs text-center text-zinc-500 mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>

          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-medium transition-colors text-sm"
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

export default Signup;
