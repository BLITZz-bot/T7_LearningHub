/**
 * Landing Page - Sleek Black & Grey Theme with Images
 */

import { Link } from 'react-router-dom';
import { 
  ArrowRight,
  CheckCircle,
  Zap,
  Users,
  TrendingUp,
  BookOpen,
  Target,
  Sparkles,
  Rocket,
  Star
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-blue-900 text-xl">T7 Learning Hub</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Sign in
            </Link>
            <Link 
              to="/signup" 
              className="px-5 py-2.5 text-sm font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-50"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-full text-sm font-semibold mb-8">
                <Zap className="w-4 h-4 text-amber-500" />
                AI-Powered Career Analysis
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-blue-900 leading-[1.1] mb-8">
                From uncertainty to clarity
                <br />
                <span className="text-blue-400">craft your personalized tech career path</span>
              </h1>
              
              <p className="text-xl text-blue-700 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                Assess your abilities, close gaps with AI-backed coaching, and enter campus placements with confidence.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/signup" 
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20 hover:-translate-y-0.5"
                >
                  Begin onboarding
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                  <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                  <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-600">Loved by <span className="font-bold text-zinc-900">500+</span> students</p>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative z-10 bg-gradient-to-r from-zinc-100 to-white rounded-2xl p-8 shadow-2xl shadow-zinc-900/10">
                <div className="w-full h-96 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 overflow-hidden relative">
                  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,_white_0%,_transparent_50%)]"></div>
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_80%_80%,_white_0%,_transparent_45%)]"></div>
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="bg-white/15 border border-white/30 rounded-3xl p-6 shadow-xl text-center">
                      <p className="text-white text-xl font-bold mb-2">AI-guided learning plans</p>
                      <p className="text-white/90 text-sm">Your next 90 days of growth, mapped to placement-ready skills.</p>
                    </div>
                  </div>
                </div>
                
                {/* Floating cards */}
                <div className="absolute -left-6 top-1/4 bg-white rounded-xl shadow-xl p-4 border border-zinc-100 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Readiness</p>
                      <p className="font-bold text-emerald-600">+28%</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-6 bottom-1/4 bg-white rounded-xl shadow-xl p-4 border border-zinc-100 animate-float animation-delay-2000">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-zinc-700" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Skills matched</p>
                      <p className="font-bold text-zinc-900">12/15</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute inset-0 bg-zinc-900 rounded-2xl transform rotate-3 scale-105 -z-10 opacity-5"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200')] opacity-5 bg-cover bg-center"></div>
        <div className="max-w-6xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform">8+</div>
              <div className="text-zinc-400 font-medium">Career paths</div>
            </div>
            <div className="group">
              <div className="text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform">60+</div>
              <div className="text-zinc-400 font-medium">Skills tracked</div>
            </div>
            <div className="group">
              <div className="text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform flex items-center justify-center gap-2">
                <Sparkles className="w-8 h-8" />AI
              </div>
              <div className="text-zinc-400 font-medium">Powered insights</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-8 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-5 py-2 bg-blue-100 text-blue-800 rounded-full text-base font-semibold mb-5">Career Engine</span>
            <h2 className="text-4xl sm:text-5xl font-black text-blue-900 mb-5">Transform how you learn</h2>
            <p className="text-blue-700 max-w-xl mx-auto text-xl">
              A guided journey that syncs your profile with market demand, skill gaps, and practice plans.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Add your skills',
                description: 'Select from 60+ technical and soft skills that you\'ve acquired',
                icon: CheckCircle,
                image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop'
              },
              {
                step: '02',
                title: 'Choose a career',
                description: 'Pick your target role like Frontend Developer or Data Analyst',
                icon: Target,
                image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop'
              },
              {
                step: '03',
                title: 'Get your roadmap',
                description: 'Receive AI-generated insights and a personalized learning path',
                icon: TrendingUp,
                image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop'
              }
            ].map((item, index) => (
              <div key={index} className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border border-zinc-100">
                <div className="absolute -top-4 -right-4 w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {item.step}
                </div>
                <div className="mb-5 rounded-xl overflow-hidden">
                  <img src={item.image} alt={item.title} className="w-full h-36 object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="w-14 h-14 bg-zinc-100 rounded-xl flex items-center justify-center mb-5">
                  <item.icon className="w-7 h-7 text-zinc-700" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-3">{item.title}</h3>
                <p className="text-zinc-600 leading-relaxed text-lg">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-5 py-2 bg-zinc-100 text-zinc-700 rounded-full text-base font-semibold mb-5">Why Choose Us</span>
              <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 mb-6">
                Built for students who want to 
                <span className="text-zinc-400"> stand out</span>
              </h2>
              <p className="text-zinc-600 mb-8 leading-relaxed text-xl">
                Stop guessing what skills you need. Our AI analyzes your profile against 
                real industry requirements and creates a clear path to success.
              </p>
              
              <div className="space-y-4">
                {[
                  'Personalized skill gap analysis',
                  'Industry-aligned recommendations',
                  'Month-by-month learning roadmap',
                  'Track your placement readiness'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-4 group">
                    <div className="w-6 h-6 bg-zinc-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-zinc-700 font-medium text-lg">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-zinc-900 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-zinc-400 font-medium">Readiness Score</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +12% this month
                  </span>
                </div>
                <div className="text-6xl font-black text-white mb-2">72%</div>
                <div className="h-3 bg-zinc-700 rounded-full overflow-hidden mb-6">
                  <div className="h-full w-[72%] bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-800 rounded-xl">
                    <div className="text-zinc-400 text-sm">Matched</div>
                    <div className="font-bold text-white text-2xl">8 skills</div>
                  </div>
                  <div className="p-4 bg-zinc-800 rounded-xl">
                    <div className="text-zinc-400 text-sm">To learn</div>
                    <div className="font-bold text-white text-2xl">4 skills</div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full bg-zinc-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* For whom */}
      <section className="py-24 px-8 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-5 py-2 bg-zinc-200 text-zinc-700 rounded-full text-base font-semibold mb-5">For Everyone</span>
            <h2 className="text-4xl sm:text-5xl font-black text-zinc-900">Who is this for?</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Students */}
            <div className="group p-8 bg-white border-2 border-zinc-100 rounded-2xl hover:border-zinc-300 hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="flex items-start gap-4 mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&h=200&fit=crop" 
                  alt="Student" 
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-1">For Students</h3>
                  <p className="text-zinc-500 font-medium">Prepare smarter, not harder</p>
                </div>
              </div>
              <p className="text-zinc-600 mb-6 leading-relaxed text-lg">
                Understand exactly which skills you need for your dream role and how to acquire them efficiently.
              </p>
              <ul className="space-y-3">
                {[
                  'Skill gap identification',
                  'Personalized roadmap',
                  'Readiness tracking'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-zinc-700">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Admins */}
            <div className="group p-8 bg-zinc-900 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="flex items-start gap-4 mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop" 
                  alt="Admin" 
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">For Placement Cells</h3>
                  <p className="text-zinc-400 font-medium">Data-driven decisions</p>
                </div>
              </div>
              <p className="text-zinc-400 mb-6 leading-relaxed text-lg">
                Get campus-wide insights on student readiness and identify common skill gaps across batches.
              </p>
              <ul className="space-y-3">
                {[
                  'Campus analytics dashboard',
                  'Skill gap trends',
                  'Role-wise insights'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-white">
                    <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-zinc-800 rounded-full filter blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-zinc-800 rounded-full filter blur-3xl opacity-50"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-full text-sm font-medium mb-8">
            <Rocket className="w-4 h-4" />
            Launch your career today
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-8">
            Ready to analyze your skills?
          </h2>
          <p className="text-zinc-400 mb-10 max-w-xl mx-auto text-xl">
            Join <span className="text-white font-semibold">500+ students</span> who are preparing smarter for campus placements 
            with data-driven insights.
          </p>
          <Link 
            to="/signup" 
            className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-zinc-900 font-bold rounded-xl hover:bg-zinc-100 transition-all shadow-2xl hover:-translate-y-1"
          >
            Get started for free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-zinc-900">T7 Learning Hub</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
