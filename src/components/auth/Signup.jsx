/**
 * Signup Page - Sleek Black & Grey Theme
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  Sparkles,
  ArrowRight,
  Rocket,
  GraduationCap,
  Building2,
  CheckCircle
} from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // DEMO: Allow admin/admin as a dummy admin account
    if (formData.email.toLowerCase() === 'admin' && formData.password === 'admin') {
      setLoading(true);
      try {
        await signup('admin@demo.local', 'admin123456', 'Admin Demo', 'admin');
        navigate('/dashboard');
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          // Already created, just redirect
          navigate('/login');
        } else {
          setError('Failed to create demo admin account.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);

    try {
      await signup(formData.email, formData.password, formData.name, formData.role);
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
            Join 500+ students who are preparing smarter with AI-powered skill analysis.
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900">T7 Learning Hub</span>
          </div>

          <div className="mb-8">
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400"
                  placeholder="Min. 6 characters"
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    formData.role === 'student'
                      ? 'border-zinc-900 bg-zinc-50 shadow-lg'
                      : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.role === 'student' ? 'bg-zinc-900' : 'bg-zinc-100'
                    }`}>
                      <GraduationCap className={`w-5 h-5 ${
                        formData.role === 'student' ? 'text-white' : 'text-zinc-500'
                      }`} />
                    </div>
                    <div>
                      <p className={`font-bold ${
                        formData.role === 'student' ? 'text-zinc-900' : 'text-zinc-700'
                      }`}>Student</p>
                      <p className="text-xs text-zinc-500">Analyze my skills</p>
                    </div>
                  </div>
                  {formData.role === 'student' && (
                    <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-zinc-900" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    formData.role === 'admin'
                      ? 'border-zinc-900 bg-zinc-50 shadow-lg'
                      : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.role === 'admin' ? 'bg-zinc-900' : 'bg-zinc-100'
                    }`}>
                      <Building2 className={`w-5 h-5 ${
                        formData.role === 'admin' ? 'text-white' : 'text-zinc-500'
                      }`} />
                    </div>
                    <div>
                      <p className={`font-bold ${
                        formData.role === 'admin' ? 'text-zinc-900' : 'text-zinc-700'
                      }`}>Admin</p>
                      <p className="text-xs text-zinc-500">Placement cell</p>
                    </div>
                  </div>
                  {formData.role === 'admin' && (
                    <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-zinc-900" />
                  )}
                </button>
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
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-center text-zinc-500">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
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

export default Signup;
