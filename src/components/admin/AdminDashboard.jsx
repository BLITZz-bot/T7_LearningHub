/**
 * Admin Dashboard - Sleek Black & Grey Theme with Images
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCampusAnalytics } from '../../services/apiService';
import { 
  LogOut, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Target,
  Sparkles,
  BarChart3
} from 'lucide-react';

const AdminDashboard = () => {
  const { userProfile, logout } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('skill'); // 'skill' or 'academic'


  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getCampusAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-zinc-400 mx-auto mb-3" />
          <p className="text-zinc-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-zinc-900 text-lg">T7 Learning Hub</span>
              <span className="text-xs text-zinc-500 ml-2 bg-zinc-100 px-2 py-0.5 rounded-full">Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Toggle Switch - green active */}
            <div className="hidden md:flex items-center bg-zinc-100/60 backdrop-blur-sm p-1 rounded-2xl border border-zinc-200/70 shadow-inner">
              <button
                onClick={() => setViewMode('skill')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  viewMode === 'skill'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Skill Lab
              </button>
              <button
                onClick={() => setViewMode('academic')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  viewMode === 'academic'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Academic LH
              </button>
            </div>
            <button
              onClick={fetchAnalytics}
              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-zinc-900">{userProfile?.name}</p>
              <p className="text-xs text-zinc-500">Placement Cell</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 mb-2">Campus Analytics 📊</h1>
            <p className="text-zinc-600 text-lg">Overview of student placement readiness</p>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=120&h=80&fit=crop" 
            alt="" 
            className="w-24 h-16 rounded-xl object-cover hidden md:block"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-4xl font-black text-zinc-900">{analytics?.totalStudents || 0}</p>
            <p className="text-zinc-500 font-medium mt-1">Students analyzed</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                (analytics?.averageReadiness || 0) >= 60 ? 'bg-emerald-100' : 'bg-amber-100'
              }`}>
                <TrendingUp className={`w-6 h-6 ${
                  (analytics?.averageReadiness || 0) >= 60 ? 'text-emerald-600' : 'text-amber-600'
                }`} />
              </div>
            </div>
            <p className={`text-4xl font-black ${getScoreColor(analytics?.averageReadiness || 0)}`}>
              {analytics?.averageReadiness || 0}%
            </p>
            <p className="text-zinc-500 font-medium mt-1">Average readiness</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-4xl font-black text-zinc-900">{analytics?.roleWiseStats?.length || 0}</p>
            <p className="text-zinc-500 font-medium mt-1">Career paths</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-zinc-900 truncate">
              {analytics?.topMissingSkills?.[0]?.skill || 'N/A'}
            </p>
            <p className="text-zinc-500 font-medium mt-1">Top skill gap</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Missing Skills */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-zinc-900 text-lg">Top Missing Skills</h2>
                <p className="text-sm text-zinc-500">Skills students need most</p>
              </div>
            </div>
            
            {analytics?.topMissingSkills?.length > 0 ? (
              <div className="space-y-4">
                {analytics.topMissingSkills.slice(0, 8).map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="w-6 text-sm font-bold text-zinc-400">{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-zinc-900">{item.skill}</span>
                        <span className="text-sm text-zinc-500">{item.count} students</span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, (item.count / (analytics.totalStudents || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No data available</p>
              </div>
            )}
          </div>

          {/* Role-wise Readiness */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-zinc-900 text-lg">Readiness by Role</h2>
                <p className="text-sm text-zinc-500">Career-wise breakdown</p>
              </div>
            </div>
            
            {analytics?.roleWiseStats?.length > 0 ? (
              <div className="space-y-4">
                {analytics.roleWiseStats.map((item, index) => (
                  <div key={index} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-zinc-900">{item.role}</span>
                      <span className={`text-xl font-black ${getScoreColor(item.averageScore)}`}>
                        {item.averageScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                      <span>{item.studentCount} students</span>
                    </div>
                    <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.averageScore >= 70 ? 'bg-emerald-500' : 
                          item.averageScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.averageScore}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Insights */}
        {analytics?.totalStudents > 0 && (
          <div className="mt-6 bg-zinc-900 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Key Insights
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-white mt-2"></div>
                <p className="text-zinc-300">
                  <span className="text-white font-bold">{analytics.totalStudents}</span> students 
                  have completed skill analysis
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-white mt-2"></div>
                <p className="text-zinc-300">
                  Average readiness is <span className="text-white font-bold">{analytics.averageReadiness}%</span>
                  {analytics.averageReadiness >= 60 ? ' — Good progress!' : ' — Room for improvement'}
                </p>
              </div>
              {analytics.topMissingSkills?.[0] && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-white mt-2"></div>
                  <p className="text-zinc-300">
                    <span className="text-white font-bold">{analytics.topMissingSkills[0].skill}</span> is 
                    the most common skill gap
                  </p>
                </div>
              )}
              {analytics.roleWiseStats?.[0] && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-white mt-2"></div>
                  <p className="text-zinc-300">
                    <span className="text-white font-bold">{analytics.roleWiseStats[0].role}</span> is 
                    the most popular career choice
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
