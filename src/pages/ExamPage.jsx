import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faClock,
  faExpand,
  faCompress,
  faSignOutAlt,
  faCheckCircle,
  faExclamationTriangle,
  faShieldAlt,
  faSave,
  faQuestionCircle,
  faList,
  faCircle,
  faCheck,
  faTimes,
  faSpinner,
  faAward
} from '@fortawesome/free-solid-svg-icons';

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
  } = useExam();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTimeWarning, setIsTimeWarning] = useState(false);
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

  useEffect(() => {
    if (!isLoading && questions.length === 0) navigate('/');
  }, [questions, isLoading, navigate]);

  useEffect(() => {
    if (isExamCompleted) navigate('/result');
  }, [isExamCompleted, navigate]);

  useEffect(() => {
    setIsTimeWarning(timeRemaining > 0 && timeRemaining <= 60);
  }, [timeRemaining]);

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
    const total = questions.length;

    if (answered < total) {
      const proceed = window.confirm(
        `Anda telah menjawab ${answered} dari ${total} soal.\n` +
        `${total - answered} soal belum dijawab.\n\n` +
        'Apakah Anda yakin ingin mengumpulkan?'
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xl shadow-amber-500/25 animate-pulse mb-4">
            <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin" />
          </div>
          <p className="text-slate-600 font-medium">Memuat ujian Anda...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  if (isSecurityBreached) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/30 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl max-w-md w-full p-8 border border-red-200/50 shadow-2xl shadow-red-500/10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-100 text-red-600 mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-display font-bold text-red-600 mb-2">Ujian Dihentikan</h2>
          <p className="text-slate-600 mb-4">
            Terlalu banyak pelanggaran keamanan ({securityAlertCount}/{MAX_ALERTS}).
            Ujian Anda telah dikumpulkan otomatis.
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Pelanggaran terakhir: {lastAlertReason || 'Tidak diketahui'}
          </p>
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-600 mx-auto">
              <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin" />
            </div>
            <p className="text-sm text-slate-500">Mengumpulkan jawaban Anda...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = getAnsweredCount();
  const totalQuestions = questions.length;
  const progressPercentage = (answeredCount / totalQuestions) * 100;
  const currentAnswer = answers[Number(currentQuestion?.id)];

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 select-none"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      {/* Security Alert Banner */}
      {showSecurityBanner && securityAlertCount > 0 && (
        <div className={`fixed top-0 left-0 right-0 z-50 p-3 text-center ${
          securityAlertCount >= MAX_ALERTS - 1 
            ? 'bg-gradient-to-r from-red-500 to-red-600' 
            : 'bg-gradient-to-r from-amber-500 to-amber-600'
        } text-white animate-pulse shadow-lg`}>
          <div className="flex items-center justify-center gap-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" />
            <div>
              <p className="font-bold">
                PERINGATAN KEAMANAN {securityAlertCount}/{MAX_ALERTS}
              </p>
              <p className="text-sm opacity-90">
                {securityAlertCount >= MAX_ALERTS - 1 
                  ? '⚠️ PERINGATAN TERAKHIR! Pengumpulan otomatis pada pelanggaran berikutnya!' 
                  : `${MAX_ALERTS - securityAlertCount} pelanggaran lagi sebelum pengumpulan otomatis`
                }
              </p>
            </div>
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Security Status Indicator */}
      <div className="fixed top-0 right-0 z-40 m-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${
          securityAlertCount === 0 
            ? 'bg-emerald-100/90 text-emerald-700 border border-emerald-200' 
            : securityAlertCount < MAX_ALERTS - 1 
              ? 'bg-amber-100/90 text-amber-700 border border-amber-200' 
              : 'bg-red-100/90 text-red-700 border border-red-200 animate-pulse'
        }`}>
          <FontAwesomeIcon icon={faShieldAlt} className="w-3 h-3" />
          <span>{securityAlertCount === 0 ? 'Aman' : `${securityAlertCount}/${MAX_ALERTS}`}</span>
        </div>
      </div>

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-md w-full p-6 border border-slate-200/50 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mb-4">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-800 mb-2">Keluar Ujian?</h3>
              <p className="text-slate-500 text-sm">
                Progress Anda tersimpan. Anda dapat melanjutkan jika sesi masih terbuka.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleResume} 
                className="flex-1 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25 transition-all duration-300"
              >
                Lanjut Ujian
              </button>
              <button 
                onClick={handleConfirmExit}
                className="flex-1 px-6 py-2.5 border-2 border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors duration-300"
              >
                Keluar Saja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-md w-full p-6 border border-slate-200/50 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
                <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-800 mb-2">Kumpulkan Ujian?</h3>
              <p className="text-slate-500 text-sm">
                Anda telah menjawab <strong className="text-slate-700">{answeredCount}</strong> dari <strong className="text-slate-700">{totalQuestions}</strong> soal.
                {totalQuestions - answeredCount > 0 && (
                  <span className="text-amber-600 font-medium block mt-1">
                    {totalQuestions - answeredCount} soal belum dijawab
                  </span>
                )}
              </p>
              {securityAlertCount > 0 && (
                <p className="text-sm text-red-500 mt-2">
                  ⚠️ {securityAlertCount} pelanggaran keamanan terdeteksi
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25 transition-all duration-300 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 mr-2 animate-spin" />
                    Mengumpulkan...
                  </span>
                ) : 'Kumpulkan Ujian'}
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-6 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors duration-300"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-col h-screen">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-amber-200/30 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            {/* Left */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                  securityAlertCount === 0 ? 'bg-emerald-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                  {securityAlertCount === 0 ? 'Live' : '⚠️ Peringatan'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xs hidden md:block">{examTitle}</p>
            </div>

            {/* Center — timer */}
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faClock} className={`w-5 h-5 ${isTimeWarning ? 'text-red-500' : 'text-amber-500'}`} />
              <span className={`font-mono font-bold text-lg tabular-nums ${isTimeWarning ? 'text-red-500 animate-pulse' : 'text-amber-600'}`}>
                {formatTime(timeRemaining)}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                | {answeredCount}/{totalQuestions}
              </span>
            </div>

            {/* Right */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleToggleFullscreen}
                className="p-2 text-slate-400 hover:text-amber-600 transition-colors rounded-xl hover:bg-amber-50"
                title={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}>
                <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="w-5 h-5" />
              </button>
              <button 
                onClick={handleExit}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50">
                <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-amber-100">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }} 
            />
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
                  <span className="text-sm font-medium text-slate-500">
                    Soal {currentQuestionIndex + 1} dari {totalQuestions}
                  </span>
                  <span className="text-xs text-slate-400">
                    {currentQuestion.points} poin
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-display font-bold text-slate-800 leading-relaxed">
                  {currentQuestion.question_text}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100/80 text-amber-700 font-medium border border-amber-200">
                    {currentQuestion.category?.replace('_', ' ').toUpperCase()}
                  </span>
                  {securityAlertCount > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium border border-red-200">
                      ⚠️ {securityAlertCount}/{MAX_ALERTS}
                    </span>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = currentAnswer?.selected_option_index === index;
                  const isSaved = currentAnswer?.is_saved;

                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(currentQuestion.id, index)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group
                        ${isSelected
                          ? isSaved
                            ? 'border-emerald-400 bg-emerald-50/80 shadow-lg shadow-emerald-500/10'
                            : 'border-amber-400 bg-amber-50/80 shadow-lg shadow-amber-500/10 transform scale-[1.01]'
                          : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
                        }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                          text-sm font-semibold transition-all
                          ${isSelected
                            ? isSaved 
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-amber-100'
                          }`}>
                          {optionLabel(index)}
                        </span>
                        <span className="flex-1 text-slate-700 pt-0.5">{option}</span>
                        {isSelected && isSaved && (
                          <span className="flex-shrink-0 text-emerald-500 text-xs font-medium self-center">
                            <FontAwesomeIcon icon={faCheck} className="w-3 h-3 mr-1" />
                            Tersimpan
                          </span>
                        )}
                        {isSelected && !isSaved && (
                          <span className="flex-shrink-0 text-amber-600 text-xs font-medium self-center animate-pulse">
                            <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 mr-1 animate-spin" />
                            Menyimpan...
                          </span>
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
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300
                    ${currentQuestionIndex === 0
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                      : 'border-2 border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10'
                    }`}
                >
                  <span className="flex items-center">
                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                    Sebelumnya
                  </span>
                </button>

                <span className="text-sm text-slate-400">
                  {answeredCount} / {totalQuestions} terjawab
                </span>

                {currentQuestionIndex === totalQuestions - 1 ? (
                  <button
                    onClick={handleOpenSubmitModal}
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300
                      bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700
                      text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50
                      ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 mr-2 animate-spin" />
                        Mengumpulkan...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Kumpulkan
                        <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 ml-2" />
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-xl font-medium transition-all duration-300
                      bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700
                      text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5"
                  >
                    <span className="flex items-center">
                      Selanjutnya
                      <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-2" />
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar — question navigator */}
          <div className="hidden lg:block w-48 bg-white/50 backdrop-blur-sm border-l border-amber-200/30 p-4 overflow-y-auto">
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                <FontAwesomeIcon icon={faList} className="w-3 h-3 mr-2 text-amber-500" />
                Soal
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">{answeredCount} terjawab</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(idx);
                const isCurrent = idx === currentQuestionIndex;

                const statusColor =
                  isCurrent ? 'border-amber-400 bg-amber-100/80 text-amber-700 shadow-lg shadow-amber-500/20 scale-105' :
                  status === 'answered' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                  status === 'saving' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                  'bg-slate-100 text-slate-400 border-transparent';

                return (
                  <button
                    key={q.id}
                    onClick={() => navigateToQuestion(idx)}
                    title={`Soal ${idx + 1} — ${status}`}
                    className={`w-full aspect-square rounded-xl border-2 flex items-center justify-center
                      text-sm font-medium transition-all duration-200 hover:scale-105 ${statusColor}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-slate-200/50 space-y-1.5">
              {[
                { color: 'bg-emerald-100 border-emerald-300', label: 'Terjawab' },
                { color: 'bg-amber-100 border-amber-300', label: 'Menyimpan...' },
                { color: 'bg-slate-100 border-slate-200', label: 'Belum Dijawab' },
                { color: 'bg-amber-100/80 border-amber-400', label: 'Saat Ini' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center space-x-2 text-xs text-slate-400">
                  <span className={`w-3 h-3 rounded-full border ${color}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Security Status in Sidebar */}
            <div className="mt-4 pt-4 border-t border-slate-200/50">
              <div className={`text-xs p-2.5 rounded-xl ${
                securityAlertCount === 0 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : securityAlertCount < MAX_ALERTS - 1 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                    : 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
              }`}>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faShieldAlt} className="w-3 h-3" />
                  <span className="font-medium">
                    {securityAlertCount === 0 ? '🔒 Aman' : `⚠️ ${securityAlertCount}/${MAX_ALERTS}`}
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