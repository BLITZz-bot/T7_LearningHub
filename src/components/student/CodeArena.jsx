import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, Code2, Loader2, ArrowRight, Trophy, RefreshCw } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { logQuizActivity, fetchQuizActivity } from '../../services/apiService';

export default function CodeArena({ profile }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyScore, setDailyScore] = useState(0);
  const [dailySolved, setDailySolved] = useState(0);

  const fetchQuestions = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          studentContext: profile || {}
        })
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setUserCode(data.questions[0].startingCode || '');
        setCurrentIdx(0);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    }
    setLoading(false);
  };

  // Sync today's activity on mount
  useEffect(() => {
    const initDailyStatus = async () => {
      if (profile?.id) {
        const activities = await fetchQuizActivity(profile.id);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayActivity = activities.find(a => a.date === todayStr);
        if (todayActivity) {
          setDailySolved(todayActivity.questions_solved || 0);
          setDailyScore(todayActivity.total_score || 0);
          if (todayActivity.questions_solved >= 5) {
            setDailyCompleted(true);
          } else {
            fetchQuestions();
          }
        } else {
          fetchQuestions();
        }
      } else {
        // Fallback if no profile ID
        fetchQuestions();
      }
    };
    initDailyStatus();
  }, [profile]);

  const handleEditorChange = (value) => {
    setUserCode(value);
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setUserCode(questions[nextIdx].startingCode || '');
    } else {
      // Reached the end of the batch
      setDailyCompleted(true);
    }
  };

  const handleSubmit = async () => {
    if (!userCode.trim()) return;
    setEvaluating(true);
    setFeedback(null);
    
    try {
      const currentQuestion = questions[currentIdx];
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          submittedCode: userCode,
          question: currentQuestion
        })
      });
      const result = await res.json();
      setFeedback(result);

      if (result.isCorrect && profile?.id) {
        const newSolved = dailySolved + 1;
        const newScore = dailyScore + (result.score || 100);
        setDailySolved(newSolved);
        setDailyScore(newScore);

        const todayStr = new Date().toISOString().split('T')[0];
        await logQuizActivity(profile.id, todayStr, newSolved, newScore);
      }
    } catch (err) {
      console.error('Evaluation failed:', err);
      setFeedback({
        isCorrect: false,
        feedback: 'Failed to connect to the evaluation server. Please try again later.'
      });
    }
    setEvaluating(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl shadow-lg border border-zinc-100 p-8">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-zinc-800">Generating Challenges...</h3>
        <p className="text-zinc-500 mt-2 text-center max-w-md">
          Analyzing your skills and generating custom coding problems via Gemini AI to boost your fundamentals.
        </p>
      </div>
    );
  }

  if (dailyCompleted && !loading && currentIdx >= questions.length - 1 && (!feedback || feedback.isCorrect)) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-zinc-100 p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center border-4 border-emerald-50">
            <Trophy className="w-10 h-10 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-zinc-900 mb-4">Daily Goal Met!</h2>
        <p className="text-zinc-600 text-lg mb-8 max-w-lg mx-auto">
          Outstanding work! You've successfully completed your daily coding exercises. Your learning activity graph is shining green!
        </p>
        <div className="flex justify-center gap-6 mb-10">
          <div className="text-center">
            <p className="text-4xl font-bold text-zinc-900">{dailySolved}</p>
            <p className="text-sm font-medium text-zinc-500 mt-1 uppercase tracking-wider">Solved Today</p>
          </div>
          <div className="w-px bg-zinc-200"></div>
          <div className="text-center">
            <p className="text-4xl font-bold text-emerald-600">{dailyScore}</p>
            <p className="text-sm font-medium text-zinc-500 mt-1 uppercase tracking-wider">Total Score</p>
          </div>
        </div>
        <button
          onClick={() => { setDailyCompleted(false); fetchQuestions(); }}
          className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all shadow-xl shadow-zinc-900/20 hover:-translate-y-1"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Solve More Questions</span>
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
      {/* Left Panel: Problem Statement */}
      <div className="lg:w-1/3 flex flex-col bg-white rounded-2xl shadow-lg border border-zinc-100 overflow-hidden">
        <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-zinc-900">Code Arena</h3>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          {currentQuestion ? (
            <>
              <h2 className="text-2xl font-bold text-zinc-900 mb-4">{currentQuestion.title}</h2>
              <div className="prose prose-zinc max-w-none text-zinc-600">
                <p className="whitespace-pre-wrap">{currentQuestion.description}</p>
              </div>
            </>
          ) : (
            <p>No questions generated.</p>
          )}

          {feedback && (
            <div className={`mt-8 p-5 rounded-xl border ${feedback.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                {feedback.isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className={`font-bold ${feedback.isCorrect ? 'text-emerald-900' : 'text-red-900'}`}>
                    {feedback.isCorrect ? 'Correct Solution!' : 'Not Quite Right'}
                  </h4>
                  <p className={`text-sm mt-1 mb-3 ${feedback.isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                    {feedback.feedback}
                  </p>
                  
                  {feedback.optimalSolution && (
                    <div className="mt-4">
                      <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Optimal Solution</h5>
                      <pre className="bg-white/60 p-3 rounded-lg text-sm overflow-x-auto text-zinc-800 font-mono border border-white">
                        {feedback.optimalSolution}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {feedback.isCorrect && (
                <button
                  onClick={handleNextQuestion}
                  className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                >
                  <span>Next Challenge</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Code Editor */}
      <div className="lg:w-2/3 flex flex-col bg-[#1E1E1E] rounded-2xl shadow-xl overflow-hidden border border-zinc-800">
        <div className="flex justify-between items-center p-4 bg-[#2D2D2D] border-b border-[#404040]">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            {currentQuestion?.language || 'javascript'}
          </div>
        </div>
        
        <div className="flex-1 relative">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            language={currentQuestion?.language?.toLowerCase() || 'javascript'}
            theme="vs-dark"
            value={userCode}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 15,
              padding: { top: 20 },
              scrollBeyondLastLine: false,
              roundedSelection: false,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            }}
          />
        </div>

        <div className="p-4 bg-[#2D2D2D] border-t border-[#404040] flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={evaluating || !userCode.trim()}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg"
          >
            {evaluating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{evaluating ? 'Evaluating...' : 'Run Code'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
