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
  Lightbulb,
  Send,
  AlertCircle
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

  // Code challenge submit confirmation state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [codeSubmitted, setCodeSubmitted] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setFeedback(null);
    setSelectedOption(null);
    setMcqSubmitted(false);
    setCodeSubmitted(false);
    setShowSubmitModal(false);

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

  // Sync today's activity on mount or when skills/role change
  const skillsDep = JSON.stringify(missingSkills) + '_' + JSON.stringify(matchedSkills);
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
  }, [profile?.id, targetRole, skillsDep]);

  const handleEditorChange = (value) => {
    setUserCode(value);
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setSelectedOption(null);
    setMcqSubmitted(false);
    setCodeSubmitted(false);
    setShowSubmitModal(false);

    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setUserCode(questions[nextIdx].startingCode || '');
    } else {
      setDailyCompleted(true);
    }
  };

  // Run code against test cases without locking/submitting
  const handleRunCode = async () => {
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
    } catch (err) {
      console.error('Run evaluation failed:', err);
      setFeedback({
        isCorrect: false,
        feedback: 'Failed to connect to the evaluation server. Please try again later.'
      });
    }
    setEvaluating(false);
  };

  // Final submission of code solution (executed after user confirms in the modal popup)
  const handleConfirmSubmit = async () => {
    setShowSubmitModal(false);
    setEvaluating(true);
    setFeedback(null);
    
    const currentQuestion = questions[currentIdx];
    const isStarterCode = userCode.trim() === (currentQuestion?.startingCode || '').trim();
    const isEmpty = !userCode.trim();

    // If user submitted without implementing (empty or unmodified starter stub)
    if (isEmpty || isStarterCode) {
      setFeedback({
        isCorrect: false,
        score: 0,
        feedback: isEmpty 
          ? 'No code was provided. An empty submission is evaluated as Wrong Answer (0 pts).' 
          : 'The provided code is an empty method stub with unmodified starter scaffold. It lacks required implementation.',
        optimalSolution: currentQuestion?.startingCode 
          ? `// Solution reference:\n${currentQuestion.startingCode}` 
          : undefined
      });
      setCodeSubmitted(true);
      setEvaluating(false);
      return;
    }

    try {
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
      setCodeSubmitted(true);

      if (result.isCorrect && profile?.id) {
        const newSolved = dailySolved + 1;
        const newScore = dailyScore + (result.score || 100);
        setDailySolved(newSolved);
        setDailyScore(newScore);

        const todayStr = new Date().toISOString().split('T')[0];
        await logQuizActivity(profile.id, todayStr, newSolved, newScore);
      }
    } catch (err) {
      console.error('Submission evaluation failed:', err);
      setFeedback({
        isCorrect: false,
        score: 0,
        feedback: 'Failed to connect to the evaluation server. Please try again later.'
      });
      setCodeSubmitted(true);
    }
    setEvaluating(false);
  };

  // Helper to normalize the correct answer index across types/fields safely
  const getCorrectIndex = (q) => {
    if (!q) return 0;
    const raw = q.correctAnswerIndex ?? q.correctAnswer ?? q.answerIndex ?? q.answer;
    if (typeof raw === 'number' && raw >= 0 && raw < (q.options?.length || 4)) {
      return raw;
    }
    if (typeof raw === 'string') {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < (q.options?.length || 4)) {
        return parsed;
      }
      const letterIdx = ['A', 'B', 'C', 'D'].indexOf(raw.trim().toUpperCase());
      if (letterIdx !== -1) return letterIdx;

      const textIdx = (q.options || []).findIndex(
        opt => opt.trim().toLowerCase() === raw.trim().toLowerCase()
      );
      if (textIdx !== -1) return textIdx;
    }
    return 0;
  };

  // Evaluate multiple choice option instantly
  const handleMcqSubmit = async (chosenOption) => {
    const chosenIdx = chosenOption !== undefined ? chosenOption : selectedOption;
    if (chosenIdx === null || chosenIdx === undefined || mcqSubmitted) return;

    setSelectedOption(chosenIdx);
    setMcqSubmitted(true);

    const currentQuestion = questions[currentIdx];
    const correctIdx = getCorrectIndex(currentQuestion);
    const isCorrect = chosenIdx === correctIdx;

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchQuestions}
              disabled={loading}
              title="Generate a completely fresh set of challenges"
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span className="px-3 py-1 bg-zinc-900 text-white text-xs font-bold rounded-full">
              Question {currentIdx + 1} of {questions.length}
            </span>
          </div>
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
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      feedback.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {feedback.isCorrect ? 'Verdict: Accepted' : 'Verdict: Wrong Answer'}
                    </span>
                    <span className={`text-xs font-bold ${feedback.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                      {feedback.isCorrect ? '+100 Points' : '0 Points'}
                    </span>
                  </div>

                  <h4 className={`font-bold text-base ${feedback.isCorrect ? 'text-emerald-950' : 'text-red-950'}`}>
                    {feedback.isCorrect ? 'All Test Cases Passed!' : 'Solution Incorrect or Incomplete'}
                  </h4>
                  <p className={`text-sm mt-1.5 mb-3 leading-relaxed ${feedback.isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                    {feedback.feedback}
                  </p>
                  
                  {feedback.optimalSolution && (
                    <div className="mt-4">
                      <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Optimal Solution</h5>
                      <pre className="bg-white/90 p-3.5 rounded-xl text-xs sm:text-sm overflow-x-auto text-zinc-800 font-mono border border-zinc-200 leading-relaxed">
                        {feedback.optimalSolution}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Actions for Code Challenges */}
              <div className="mt-5 pt-4 border-t border-zinc-200/60 flex items-center gap-3">
                {!feedback.isCorrect && (
                  <button
                    type="button"
                    onClick={() => { setFeedback(null); setCodeSubmitted(false); }}
                    className="flex-1 py-2.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 font-semibold text-sm rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4 text-zinc-500" />
                    <span>Try Again</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className={`flex-1 py-2.5 text-white font-bold text-sm rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer shadow-md ${
                    feedback.isCorrect 
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' 
                      : 'bg-zinc-900 hover:bg-zinc-800 shadow-zinc-900/20'
                  }`}
                >
                  <span>{currentIdx < questions.length - 1 ? 'Next Challenge' : 'Complete Daily Arena'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
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
          (() => {
            const correctIdx = getCorrectIndex(currentQuestion);
            return (
              <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    {mcqSubmitted ? 'Result & Solution:' : 'Select the correct answer:'}
                  </p>

                  {(currentQuestion?.options || []).map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectAnswer = idx === correctIdx;
                    
                    let cardStyle = "bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800/60";
                    let badgeStyle = "bg-zinc-800 text-zinc-400 border-zinc-700";

                    if (mcqSubmitted) {
                      if (isCorrectAnswer) {
                        cardStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
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
                        onClick={() => handleMcqSubmit(idx)}
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
                    <div className={`mt-5 p-5 rounded-2xl border ${selectedOption === correctIdx ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                      <div className="flex items-start gap-2.5">
                        <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${selectedOption === correctIdx ? 'text-emerald-400' : 'text-amber-400'}`} />
                        <div>
                          <h4 className={`text-sm font-bold ${selectedOption === correctIdx ? 'text-emerald-300' : 'text-amber-300'}`}>
                            {selectedOption === correctIdx ? 'Correct! +100 Points' : 'Insight & Concept Explanation'}
                          </h4>
                          <p className="text-zinc-300 text-xs sm:text-sm mt-1 leading-relaxed">
                            {currentQuestion?.explanation || (selectedOption === correctIdx ? 'Great job! You identified the correct solution.' : `The correct answer is: ${currentQuestion?.options?.[correctIdx] || 'Option ' + (optionLetters[correctIdx] || correctIdx + 1)}`)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions for MCQ */}
                <div className="pt-6 mt-4 border-t border-zinc-800/80 flex items-center justify-between gap-4">
                  <span className="text-xs text-zinc-500">
                    {selectedOption === null ? 'Click an option above to answer' : mcqSubmitted ? (selectedOption === correctIdx ? 'Correct answer selected!' : 'Incorrect — correct answer shown in green') : 'Option selected'}
                  </span>

                  {!mcqSubmitted ? (
                    <button
                      type="button"
                      onClick={() => handleMcqSubmit()}
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
            );
          })()
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

            <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {codeSubmitted && feedback ? (
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border ${
                    feedback.isCorrect 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                      : 'bg-red-500/15 border-red-500/30 text-red-400'
                  }`}>
                    {feedback.isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>{feedback.isCorrect ? 'Accepted (+100 pts)' : 'Wrong Answer (0 pts)'}</span>
                  </span>
                ) : (
                  <span className="text-xs text-zinc-500 font-mono hidden sm:inline-block">
                    {userCode.split('\n').length} lines • {currentQuestion?.language || 'code'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 ml-auto">
                {codeSubmitted ? (
                  <>
                    {!feedback?.isCorrect && (
                      <button
                        type="button"
                        onClick={() => { setFeedback(null); setCodeSubmitted(false); }}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-zinc-700"
                      >
                        <RefreshCw className="w-4 h-4 text-zinc-400" />
                        <span>Try Again</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/40 hover:-translate-y-0.5 cursor-pointer"
                    >
                      <span>{currentIdx < questions.length - 1 ? 'Next Challenge' : 'Complete Daily Arena'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    {/* Run Code Button (Test without final lock) */}
                    <button
                      type="button"
                      onClick={handleRunCode}
                      disabled={evaluating || !userCode.trim()}
                      className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-850 disabled:text-zinc-600 text-zinc-200 border border-zinc-700/80 font-semibold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md hover:border-zinc-600"
                      title="Test and run your code against test cases"
                    >
                      {evaluating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                      ) : (
                        <Play className="w-4 h-4 fill-current text-zinc-400" />
                      )}
                      <span>{evaluating ? 'Running...' : 'Run Code'}</span>
                    </button>

                    {/* Submit Solution Button (Opens Confirmation Modal) */}
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      disabled={evaluating}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/40 hover:-translate-y-0.5 cursor-pointer"
                      title="Submit your solution for official evaluation"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {currentIdx < questions.length - 1 ? 'Submit Solution' : 'Submit & Finish Arena'}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Professional Confirmation Modal for Code Submission */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Confirm Final Submission?
                </h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  Question {currentIdx + 1} of {questions.length} • {currentQuestion?.skill || 'Technical Challenge'}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="bg-zinc-950/70 rounded-2xl p-4 border border-zinc-800 space-y-3">
              <p className="text-sm text-zinc-300 leading-relaxed">
                Are you sure you want to submit your code solution for official evaluation?
              </p>
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-2 border-t border-zinc-800/80">
                <span>Language: <strong className="text-zinc-200 capitalize">{currentQuestion?.language || 'JavaScript'}</strong></span>
                <span>Code Size: <strong className="text-zinc-200">{userCode.trim().split('\n').length} lines</strong></span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Your submission will be evaluated by the AI technical reviewer for correctness, efficiency, and edge case handling.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-sm rounded-xl transition-all cursor-pointer border border-zinc-700/60"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30 hover:-translate-y-0.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
