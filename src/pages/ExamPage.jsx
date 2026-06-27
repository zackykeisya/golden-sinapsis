/**
 * ExamPage.jsx — Student exam UI with security features.
 * 
 * Security features:
 * - Security alert banner with counter
 * - Auto-submit warning when max alerts reached
 * - Disabled text selection
 * - Visual security indicators
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';

const ExamPage = () => {
  const navigate = useNavigate();

  const {
    questions,
    answers,
    currentQuestionIndex,
    timeRemaining,
    examTitle,
    isExamCompleted,
    isSubmitting,
    isLoading,
    selectAnswer,
    handleSubmitExam,
    navigateToQuestion,
    getAnsweredCount,
    pauseTimer,
    resumeTimer,
    resetExam,
    securityAlertCount,
    isSecurityBreached,
    lastAlertReason,
    MAX_ALERTS,
    trackSecurityViolation,
  } = useExam();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isFullscreen,    setIsFullscreen]    = useState(false);
  const [isTimeWarning,   setIsTimeWarning]   = useState(false);
  const [showSecurityBanner, setShowSecurityBanner] = useState(false);

  // Show security banner when alert count > 0
  useEffect(() => {
    if (securityAlertCount > 0) {
      setShowSecurityBanner(true);
      const timer = setTimeout(() => {
        setShowSecurityBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [securityAlertCount]);

  // Redirect away if there are no questions (not yet loaded or exam done)
  useEffect(() => {
    if (!isLoading && questions.length === 0) navigate('/');
  }, [questions, isLoading, navigate]);

  useEffect(() => {
    if (isExamCompleted) navigate('/result');
  }, [isExamCompleted, navigate]);

  // Time warning: last 60 seconds
  useEffect(() => {
    setIsTimeWarning(timeRemaining > 0 && timeRemaining <= 60);
  }, [timeRemaining]);

  // Prevent accidental page close
  useEffect(() => {
    const handler = e => {
      if (!isExamCompleted && timeRemaining > 0) {
        e.preventDefault();
        e.returnValue = 'You have an ongoing exam. Leave?';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isExamCompleted, timeRemaining]);

  // Keyboard nav
  useEffect(() => {
    const handler = e => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'r' || e.key === 'R') e.preventDefault();
        return;
      }
      if (e.key === 'ArrowRight' && currentQuestionIndex < questions.length - 1) {
        navigateToQuestion(currentQuestionIndex + 1);
      }
      if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        navigateToQuestion(currentQuestionIndex - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentQuestionIndex, questions.length, navigateToQuestion]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleOptionSelect = (questionId, optionIndex) => {
    selectAnswer(Number(questionId), Number(optionIndex));
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenSubmitModal = () => {
    const answered = getAnsweredCount();
    const total    = questions.length;

    if (answered < total) {
      const proceed = window.confirm(
        `You have answered ${answered} of ${total} questions.\n` +
        `${total - answered} question(s) are still unanswered.\n\n` +
        'Are you sure you want to submit?'
      );
      if (!proceed) return;
    }

    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowSubmitModal(false);
    const result = await handleSubmitExam();
    if (result?.success) navigate('/result');
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleExit = () => {
    pauseTimer();
    setShowExitWarning(true);
  };

  const handleResume = () => {
    resumeTimer();
    setShowExitWarning(false);
  };

  const handleConfirmExit = () => {
    resetExam();
    navigate('/');
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const formatTime = secs => {
    if (!secs) return '00:00';
    return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  };

  const optionLabel = i => String.fromCharCode(65 + i);

  const getQuestionStatus = index => {
    const q = questions[index];
    if (!q) return 'unanswered';
    const a = answers[Number(q.id)];
    if (a?.selected_option_index !== undefined) {
      return a.is_saved ? 'answered' : 'saving';
    }
    return 'unanswered';
  };

  // ---------------------------------------------------------------------------
  // Guard renders
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white-luxury flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-gold mx-auto mb-4"></div>
          <p className="text-charcoal-gray font-medium">Loading your exam…</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;  // useEffect will redirect

  // If security is breached, show locked screen
  if (isSecurityBreached) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-2xl text-center">
          <div className="text-6xl mb-4">🚨</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Exam Terminated</h2>
          <p className="text-gray-600 mb-4">
            Too many security violations detected ({securityAlertCount}/{MAX_ALERTS}).
            Your exam has been auto-submitted.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Last violation: {lastAlertReason || 'Unknown'}
          </p>
          <div className="flex flex-col gap-3">
            <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-500">Submitting your answers...</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const currentQuestion    = questions[currentQuestionIndex];
  const answeredCount      = getAnsweredCount();
  const totalQuestions     = questions.length;
  const progressPercentage = (answeredCount / totalQuestions) * 100;
  const currentAnswer = answers[Number(currentQuestion?.id)];

  return (
    <div 
      className="min-h-screen bg-white-luxury select-none"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >

      {/* ─── Security Alert Banner ─── */}
      {showSecurityBanner && securityAlertCount > 0 && (
        <div className={`fixed top-0 left-0 right-0 z-50 p-3 text-center ${
          securityAlertCount >= MAX_ALERTS - 1 ? 'bg-red-500' : 'bg-yellow-500'
        } text-white animate-pulse`}>
          <div className="flex items-center justify-center gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold">
                SECURITY ALERT {securityAlertCount}/{MAX_ALERTS}
              </p>
              <p className="text-sm">
                {securityAlertCount >= MAX_ALERTS - 1 
                  ? '⚠️ FINAL WARNING! Auto-submit on next violation!' 
                  : `${MAX_ALERTS - securityAlertCount} more violation${MAX_ALERTS - securityAlertCount > 1 ? 's' : ''} before auto-submission`
                }
              </p>
            </div>
            <span className="text-2xl">⚠️</span>
          </div>
        </div>
      )}

      {/* ─── Security Status Indicator ─── */}
      <div className="fixed top-0 right-0 z-40 m-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          securityAlertCount === 0 ? 'bg-green-100 text-green-700' :
          securityAlertCount < MAX_ALERTS - 1 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700 animate-pulse'
        }`}>
          <span className="w-2 h-2 rounded-full inline-block bg-current"></span>
          {securityAlertCount === 0 ? 'Secure' : `${securityAlertCount}/${MAX_ALERTS}`}
        </div>
      </div>

      {/* ─── Exit Warning Modal ─── */}
      {showExitWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gold-glow flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-display text-charcoal mb-2">Exit Exam?</h3>
              <p className="text-charcoal-gray text-sm">
                Your progress is saved. You can resume if the session is still open.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleResume} className="flex-1 btn-gold py-2.5 rounded-lg font-medium text-white">
                Resume Exam
              </button>
              <button onClick={handleConfirmExit}
                className="flex-1 px-6 py-2.5 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors">
                Exit Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Submit Confirmation Modal ─── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gold-glow flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-display text-charcoal mb-2">Submit Exam?</h3>
              <p className="text-charcoal-gray text-sm">
                You have answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions.
                {totalQuestions - answeredCount > 0 && (
                  <span className="text-gold-dark font-medium block mt-1">
                    {totalQuestions - answeredCount} question(s) unanswered
                  </span>
                )}
              </p>
              {securityAlertCount > 0 && (
                <p className="text-sm text-red-500 mt-2">
                  ⚠️ {securityAlertCount} security violation{securityAlertCount > 1 ? 's' : ''} detected
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className={`flex-1 btn-gold py-2.5 rounded-lg font-medium text-white ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting…
                  </span>
                ) : 'Submit Exam'}
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-6 py-2.5 border border-charcoal-gray/20 text-charcoal-gray rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Layout ─── */}
      <div className="flex flex-col h-screen">

        {/* Top bar */}
        <header className="bg-white border-b border-gold-light/30 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">

            {/* Left */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                  securityAlertCount === 0 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs font-medium text-charcoal-gray hidden sm:inline">
                  {securityAlertCount === 0 ? 'Live' : '⚠️ Alert'}
                </span>
              </div>
              <p className="text-xs text-charcoal-gray/60 truncate max-w-xs hidden md:block">{examTitle}</p>
            </div>

            {/* Center — timer */}
            <div className="flex items-center space-x-3">
              <svg className={`w-5 h-5 ${isTimeWarning ? 'text-red-500' : 'text-gold'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`font-mono font-bold text-lg tabular-nums ${isTimeWarning ? 'text-red-500 animate-pulse' : 'text-gold'}`}>
                {formatTime(timeRemaining)}
              </span>
              <span className="text-xs text-charcoal-gray/50 hidden sm:inline">
                | {answeredCount}/{totalQuestions}
              </span>
            </div>

            {/* Right */}
            <div className="flex items-center space-x-3">
              <button onClick={handleToggleFullscreen}
                className="p-2 text-charcoal-gray/60 hover:text-gold transition-colors rounded-lg hover:bg-gold-glow"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isFullscreen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9l-6 6m0 0h6m-6 0h6m0 0l6-6m0 0l-6-6m0 0v6m0 0h6" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9V6m0 0h3m-3 0l6 6m0 0h3m-3 0V9m0 3h-3m3 0l-6 6m0 0h3m-3 0v3" />
                  }
                </svg>
              </button>
              <button onClick={handleExit}
                className="p-2 text-charcoal-gray/60 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-gold-light">
            <div className="h-full bg-gold-gradient transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }} />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">

          {/* Question area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">

              {/* Question header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-charcoal-gray">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs text-charcoal-gray/50">
                    {currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-display text-charcoal leading-relaxed">
                  {currentQuestion.question_text}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold-light/50 text-gold-dark font-medium">
                    {currentQuestion.category?.replace('_', ' ').toUpperCase()}
                  </span>
                  {securityAlertCount > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                      ⚠️ {securityAlertCount}/{MAX_ALERTS}
                    </span>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = currentAnswer?.selected_option_index === index;
                  const isSaved    = currentAnswer?.is_saved;

                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(currentQuestion.id, index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 group
                        ${isSelected
                          ? isSaved
                            ? 'border-green-400 bg-green-50 shadow-md'
                            : 'border-gold bg-gold-glow shadow-gold transform scale-[1.01]'
                          : 'border-gold-light/50 hover:border-gold hover:bg-gold-glow/30'
                        }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                          text-sm font-semibold transition-all
                          ${isSelected
                            ? isSaved ? 'bg-green-500 text-white' : 'bg-gold-gradient text-white shadow-gold'
                            : 'bg-gold-light/30 text-charcoal-gray group-hover:bg-gold-light/50'
                          }`}>
                          {optionLabel(index)}
                        </span>
                        <span className="flex-1 text-charcoal pt-1">{option}</span>
                        {isSelected && isSaved && (
                          <span className="flex-shrink-0 text-green-500 text-xs font-medium self-center">✓ Saved</span>
                        )}
                        {isSelected && !isSaved && (
                          <span className="flex-shrink-0 text-gold-dark text-xs font-medium self-center animate-pulse">Saving…</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between gap-4">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300
                    ${currentQuestionIndex === 0
                      ? 'opacity-40 cursor-not-allowed bg-gray-100 text-charcoal-gray'
                      : 'btn-gold-outline hover:shadow-gold'}`}
                >
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </span>
                </button>

                <span className="text-sm text-charcoal-gray/60">
                  {answeredCount} / {totalQuestions} answered
                </span>

                {currentQuestionIndex === totalQuestions - 1 ? (
                  <button
                    onClick={handleOpenSubmitModal}
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 btn-gold
                      ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-gold-lg hover:-translate-y-0.5'}`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting…
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Submit
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-lg font-medium btn-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <span className="flex items-center">
                      Next
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar — question navigator */}
          <div className="hidden lg:block w-48 bg-white border-l border-gold-light/30 p-4 overflow-y-auto">
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-charcoal-gray uppercase tracking-wider">Questions</h4>
              <p className="text-xs text-charcoal-gray/50 mt-0.5">{answeredCount} answered</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const status    = getQuestionStatus(idx);
                const isCurrent = idx === currentQuestionIndex;

                const statusColor =
                  isCurrent       ? 'border-gold bg-gold/10 text-gold shadow-gold scale-105' :
                  status === 'answered' ? 'bg-green-100 text-green-700 border-green-300' :
                  status === 'saving'   ? 'bg-gold-light text-gold-dark border-gold' :
                                         'bg-gray-100 text-charcoal-gray border-transparent';

                return (
                  <button
                    key={q.id}
                    onClick={() => navigateToQuestion(idx)}
                    title={`Q${idx + 1} — ${status}`}
                    className={`w-full aspect-square rounded-lg border-2 flex items-center justify-center
                      text-sm font-medium transition-all duration-200 hover:scale-105 ${statusColor}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gold-light/30 space-y-1.5">
              {[
                { color: 'bg-green-100 border-green-300', label: 'Answered' },
                { color: 'bg-gold-light border-gold',     label: 'Saving…' },
                { color: 'bg-gray-100 border-gray-300',   label: 'Unanswered' },
                { color: 'bg-gold/10 border-gold',        label: 'Current' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center space-x-2 text-xs text-charcoal-gray/60">
                  <span className={`w-3 h-3 rounded-full border ${color}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Security Status in Sidebar */}
            <div className="mt-4 pt-4 border-t border-gold-light/30">
              <div className={`text-xs p-2 rounded-lg ${
                securityAlertCount === 0 ? 'bg-green-50 text-green-700' :
                securityAlertCount < MAX_ALERTS - 1 ? 'bg-yellow-50 text-yellow-700' :
                'bg-red-50 text-red-700 animate-pulse'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full inline-block bg-current"></span>
                  <span>
                    {securityAlertCount === 0 ? '🔒 Secure' : `⚠️ ${securityAlertCount}/${MAX_ALERTS}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExamPage;