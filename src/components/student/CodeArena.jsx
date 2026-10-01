import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Code2, 
  Loader2, 
  ArrowRight, 
  Trophy, 
  RefreshCw, 
  HelpCircle, 
  Check, 
  X, 
  Sparkles,
  Lightbulb
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { logQuizActivity, fetchQuizActivity } from '../../services/apiService';

export default function CodeArena({ profile, targetRole, matchedSkills, missingSkills }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyScore, setDailyScore] = useState(0);
  const [dailySolved, setDailySolved] = useState(0);

  // Multiple-choice state
  const [selectedOption, setSelectedOption] = useState(null);
  const [mcqSubmitted, setMcqSubmitted] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setFeedback(null);
    setSelectedOption(null);
    setMcqSubmitted(false);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          studentContext: {
            ...(profile || {}),
            targetRole: targetRole || profile?.targetRole || '',
            matchedSkills: matchedSkills || profile?.skills || [],
            missingSkills: missingSkills || [],
          }
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
        fetchQuestions();
      }
    };
    initDailyStatus();
  }, [profile, targetRole]);

  const handleEditorChange = (value) => {
    setUserCode(value);
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setSelectedOption(null);
    setMcqSubmitted(false);

    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setUserCode(questions[nextIdx].startingCode || '');
    } else {
      setDailyCompleted(true);
    }
  };

  // Evaluate coding challenge with AI
  const handleSubmitCode = async () => {
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

  // Evaluate multiple choice option instantly
  const handleMcqSubmit = async () => {
    if (selectedOption === null || mcqSubmitted) return;
    const currentQuestion = questions[currentIdx];
    const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;
    setMcqSubmitted(true);

    if (isCorrect && profile?.id) {
      const newSolved = dailySolved + 1;
      const newScore = dailyScore + 100;
      setDailySolved(newSolved);
      setDailyScore(newScore);

      const todayStr = new Date().toISOString().split('T')[0];
      try {
        await logQuizActivity(profile.id, todayStr, newSolved, newScore);
      } catch (err) {
        console.error('Failed to log quiz activity', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] bg-white rounded-3xl shadow-xl border border-zinc-100 p-8">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-zinc-900">Preparing Your Daily Arena...</h3>
        <p className="text-zinc-500 mt-2 text-center max-w-md text-sm">
          Generating personalized multiple-choice questions & coding challenges for <span className="font-semibold text-zinc-800">{targetRole || 'your target role'}</span>.
        </p>
      </div>
    );
  }

  if (dailyCompleted && !loading && currentIdx >= questions.length - 1 && (!feedback || feedback.isCorrect)) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center border-4 border-emerald-50">
            <Trophy className="w-10 h-10 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-zinc-900 mb-4">Daily Goal Met!</h2>
        <p className="text-zinc-600 text-lg mb-8 max-w-lg mx-auto">
          Outstanding work! You've successfully completed your daily technical challenges. Your learning activity graph is shining green!
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
          className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all shadow-xl shadow-zinc-900/20 hover:-translate-y-0.5 cursor-pointer"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Solve More Questions</span>
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const isMcq = currentQuestion?.type === 'mcq' || (currentQuestion?.options && currentQuestion.options.length > 0);
  const isCode = !isMcq;

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[620px]">
      {/* Left Panel: Problem Statement & Context */}
      <div className="lg:w-5/12 flex flex-col bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden">
        {/* Header Bar */}
        <div className="p-5 border-b border-zinc-100 bg-zinc-50/80 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            {isMcq ? (
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Lightbulb className="w-4 h-4" />
              </span>
            ) : (
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Code2 className="w-4 h-4" />
              </span>
            )}
            <div>
              <h3 className="font-bold text-zinc-900 text-sm">
                {isMcq ? 'Choose Correct Answer' : 'Hands-On Coding Challenge'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium">
                {targetRole || 'Technical Arena'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-zinc-900 text-white text-xs font-bold rounded-full">
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>
        
        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {currentQuestion ? (
            <>
              <div>
                <span className="inline-block px-2.5 py-0.5 bg-zinc-100 text-zinc-700 rounded-md text-[11px] font-semibold uppercase tracking-wider mb-2">
                  {currentQuestion.skill ? `${currentQuestion.skill} • ` : ''}{currentQuestion.language || 'Skill Target'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 leading-snug">
                  {currentQuestion.title}
                </h2>
              </div>

              <div className="prose prose-zinc max-w-none text-zinc-700 text-sm sm:text-base leading-relaxed">
                <p className="whitespace-pre-wrap">{currentQuestion.description}</p>
              </div>

              {/* Code Snippet for MCQ Output or Bug questions */}
              {isMcq && currentQuestion.codeSnippet && (
                <div className="mt-4 bg-[#18181b] rounded-2xl p-4 border border-zinc-800 shadow-inner overflow-x-auto">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] font-mono text-zinc-400">
                    <span>{currentQuestion.language || 'code'}</span>
                    <span className="text-zinc-500">Snippet</span>
                  </div>
                  <pre className="text-xs sm:text-sm font-mono text-zinc-200 leading-relaxed">
                    <code>{currentQuestion.codeSnippet}</code>
                  </pre>
                </div>
              )}
            </>
          ) : (
            <p className="text-zinc-500">No questions generated.</p>
          )}

          {/* Feedback for Code Submissions */}
          {feedback && isCode && (
            <div className={`mt-6 p-5 rounded-2xl border ${feedback.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                {feedback.isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className={`font-bold ${feedback.isCorrect ? 'text-emerald-900' : 'text-red-900'}`}>
                    {feedback.isCorrect ? 'Correct Solution! (+100 pts)' : 'Not Quite Right'}
                  </h4>
                  <p className={`text-sm mt-1 mb-3 ${feedback.isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                    {feedback.feedback}
                  </p>
                  
                  {feedback.optimalSolution && (
                    <div className="mt-4">
                      <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Optimal Solution</h5>
                      <pre className="bg-white/80 p-3 rounded-xl text-xs sm:text-sm overflow-x-auto text-zinc-800 font-mono border border-zinc-200">
                        {feedback.optimalSolution}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {feedback.isCorrect && (
                <button
                  onClick={handleNextQuestion}
                  className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <span>{currentIdx < questions.length - 1 ? 'Next Challenge' : 'Complete Daily Arena'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Interactive MCQ Options OR Monaco Code Editor */}
      <div className="lg:w-7/12 flex flex-col bg-[#18181b] rounded-3xl shadow-2xl overflow-hidden border border-zinc-800">
        {/* Top Window Bar */}
        <div className="flex justify-between items-center p-4 bg-zinc-900/90 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            <span className="text-xs font-semibold text-zinc-400 ml-2">
              {isMcq ? 'Multiple Choice Evaluation' : 'Interactive Code Sandbox'}
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-700">
            {currentQuestion?.language || 'interactive'}
          </span>
        </div>
        
        {/* Interactive MCQ View */}
        {isMcq ? (
          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Select the correct answer:
              </p>

              {(currentQuestion?.options || []).map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrectAnswer = idx === currentQuestion?.correctAnswerIndex;
                
                let cardStyle = "bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800/60";
                let badgeStyle = "bg-zinc-800 text-zinc-400 border-zinc-700";

                if (mcqSubmitted) {
                  if (isCorrectAnswer) {
                    cardStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-200";
                    badgeStyle = "bg-emerald-500 text-white border-emerald-400";
                  } else if (isSelected && !isCorrectAnswer) {
                    cardStyle = "bg-red-500/15 border-red-500 text-red-200";
                    badgeStyle = "bg-red-500 text-white border-red-400";
                  } else {
                    cardStyle = "bg-zinc-900/40 border-zinc-850 text-zinc-500 opacity-60";
                    badgeStyle = "bg-zinc-900 text-zinc-600 border-zinc-800";
                  }
                } else if (isSelected) {
                  cardStyle = "bg-blue-500/15 border-blue-500 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.15)]";
                  badgeStyle = "bg-blue-600 text-white border-blue-400";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={mcqSubmitted}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${cardStyle}`}
                  >
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${badgeStyle}`}>
                      {mcqSubmitted && isCorrectAnswer ? (
                        <Check className="w-4 h-4" />
                      ) : mcqSubmitted && isSelected && !isCorrectAnswer ? (
                        <X className="w-4 h-4" />
                      ) : (
                        optionLetters[idx] || (idx + 1)
                      )}
                    </span>
                    <span className="flex-1 text-sm sm:text-base leading-snug pt-0.5">
                      {option}
                    </span>
                  </button>
                );
              })}

              {/* MCQ Explanation Box (Shown after submission) */}
              {mcqSubmitted && (
                <div className={`mt-5 p-5 rounded-2xl border ${selectedOption === currentQuestion?.correctAnswerIndex ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                  <div className="flex items-start gap-2.5">
                    <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${selectedOption === currentQuestion?.correctAnswerIndex ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <div>
                      <h4 className={`text-sm font-bold ${selectedOption === currentQuestion?.correctAnswerIndex ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {selectedOption === currentQuestion?.correctAnswerIndex ? 'Correct! +100 Points' : 'Insight & Concept Explanation'}
                      </h4>
                      <p className="text-zinc-300 text-xs sm:text-sm mt-1 leading-relaxed">
                        {currentQuestion?.explanation || (selectedOption === currentQuestion?.correctAnswerIndex ? 'Great job! You identified the correct solution.' : 'Review the highlighted option above for the correct approach.')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions for MCQ */}
            <div className="pt-6 mt-4 border-t border-zinc-800/80 flex items-center justify-between gap-4">
              <span className="text-xs text-zinc-500">
                {selectedOption === null ? 'Select an option above to answer' : mcqSubmitted ? 'Response recorded' : 'Option selected'}
              </span>

              {!mcqSubmitted ? (
                <button
                  type="button"
                  onClick={handleMcqSubmit}
                  disabled={selectedOption === null}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Check Answer</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <span>{currentIdx < questions.length - 1 ? 'Next Question' : 'Complete Daily Arena'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Monaco Code Editor View */
          <>
            <div className="flex-1 relative min-h-[400px]">
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

            <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={handleSubmitCode}
                disabled={evaluating || !userCode.trim()}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                {evaluating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{evaluating ? 'Evaluating...' : 'Run Code'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
