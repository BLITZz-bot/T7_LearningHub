import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Trophy } from 'lucide-react';
import AcademicMode from './AcademicMode';

const AcademicPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const goBackToResults = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/results');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white/90 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-18 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={goBackToResults}
              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-zinc-900 text-lg">T7 Tutor</p>
                <p className="text-sm text-zinc-500">AI Academic Mentor & DeepTutor</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden md:flex items-center bg-zinc-100/60 backdrop-blur-sm p-1 rounded-2xl border border-zinc-200/70 shadow-inner">
              <button
                type="button"
                onClick={goBackToResults}
                className="px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-zinc-600"
              >
                SKILL LAB
              </button>
              <button
                type="button"
                className="px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-violet-600 text-white shadow-lg shadow-violet-600/25"
              >
                🎓 T7 TUTOR
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AcademicMode userProfile={userProfile} />
      </main>
    </div>
  );
};

export default AcademicPage;
