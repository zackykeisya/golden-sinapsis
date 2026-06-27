import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    accessCode,
    studentName,
    studentEmail,
    examTitle,
    durationMinutes,
    timeRemaining,
    isExamStarted,
    isLoading,
    fetchQuestions,
    resetExam,
    getAnsweredCount
  } = useExam();

  const [canStart, setCanStart] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Check if exam can start
  useEffect(() => {
    // Exam can start if timeRemaining > 0 and not started
    if (timeRemaining > 0 && !isExamStarted) {
      setCanStart(true);
    } else {
      setCanStart(false);
    }

    // If exam already started, redirect to exam page
    if (isExamStarted) {
      navigate('/exam');
    }
  }, [timeRemaining, isExamStarted, navigate]);

  // Countdown timer for session start (if not yet live)
  useEffect(() => {
    if (!canStart && timeRemaining > 0) {
      // Calculate time until session start
      // For demo, we'll use a simulated countdown
      // In production, this would come from the server
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null) return 10;
          if (prev <= 1) {
            clearInterval(interval);
            setCanStart(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Initial countdown
      setCountdown(10);

      return () => clearInterval(interval);
    }
  }, [canStart, timeRemaining]);

  const handleStartExam = async () => {
    if (!canStart || isStarting) return;
    
    setIsStarting(true);
    
    try {
      const result = await fetchQuestions();
      if (result.success) {
        navigate('/exam');
      }
    } catch (error) {
      console.error('Failed to start exam:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to leave? You can resume your session later.')) {
      resetExam();
      navigate('/');
    }
  };

  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white-luxury flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold-glow rounded-full opacity-10"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-glow rounded-full opacity-5"></div>
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-gradient text-white shadow-gold mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-display text-charcoal">
            Welcome, <span className="text-gold-gradient">{studentName}</span>
          </h1>
          <p className="text-charcoal-gray/70 text-sm mt-1">
            Your competition session is ready
          </p>
        </div>

        {/* Main Card */}
        <div className="card-gold p-8 md:p-10">
          {/* Exam Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white-luxury rounded-lg p-4 border border-gold-light/30">
              <div className="flex items-center text-charcoal-gray text-sm mb-1">
                <svg className="w-4 h-4 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Access Code
              </div>
              <div className="font-mono font-semibold text-charcoal text-lg tracking-wider">
                {accessCode}
              </div>
            </div>

            <div className="bg-white-luxury rounded-lg p-4 border border-gold-light/30">
              <div className="flex items-center text-charcoal-gray text-sm mb-1">
                <svg className="w-4 h-4 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Duration
              </div>
              <div className="font-semibold text-charcoal text-lg">
                {durationMinutes} minutes
              </div>
            </div>

            <div className="bg-white-luxury rounded-lg p-4 border border-gold-light/30">
              <div className="flex items-center text-charcoal-gray text-sm mb-1">
                <svg className="w-4 h-4 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Participant
              </div>
              <div className="font-semibold text-charcoal text-lg truncate">
                {studentName}
                {studentEmail && (
                  <span className="text-sm font-normal text-charcoal-gray/60 ml-2">
                    ({studentEmail})
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white-luxury rounded-lg p-4 border border-gold-light/30">
              <div className="flex items-center text-charcoal-gray text-sm mb-1">
                <svg className="w-4 h-4 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Status
              </div>
              <div className="font-semibold text-charcoal text-lg flex items-center">
                {canStart ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Ready to Start
                  </>
                ) : countdown !== null && countdown > 0 ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-gold mr-2 animate-pulse"></span>
                    Starting in {countdown}s
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                    Waiting...
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Rules Section */}
          <div className="mb-8">
            <button
              onClick={() => setShowRules(!showRules)}
              className="flex items-center text-gold-dark hover:text-gold transition-colors text-sm font-medium"
            >
              <svg className={`w-4 h-4 mr-2 transform transition-transform ${showRules ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
              {showRules ? 'Hide Rules' : 'Show Competition Rules'}
            </button>
            
            {showRules && (
              <div className="mt-4 p-5 bg-white-luxury rounded-lg border border-gold-light/30 space-y-2 animate-fade-in">
                <div className="flex items-start space-x-3">
                  <span className="text-gold font-bold text-sm">1.</span>
                  <p className="text-charcoal-gray text-sm">You have <span className="font-semibold text-charcoal">{durationMinutes} minutes</span> to complete all questions</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-gold font-bold text-sm">2.</span>
                  <p className="text-charcoal-gray text-sm">All questions must be answered before submitting</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-gold font-bold text-sm">3.</span>
                  <p className="text-charcoal-gray text-sm">Your progress is automatically saved with every selection</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-gold font-bold text-sm">4.</span>
                  <p className="text-charcoal-gray text-sm">You cannot pause the timer once the exam begins</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-gold font-bold text-sm">5.</span>
                  <p className="text-charcoal-gray text-sm">The system will auto-submit when time expires</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleStartExam}
              disabled={!canStart || isStarting || isLoading}
              className={`flex-1 btn-gold py-3.5 rounded-lg font-semibold text-white text-base
                transition-all duration-300 relative overflow-hidden
                ${(!canStart || isStarting || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-gold-lg hover:transform hover:-translate-y-0.5'}
                group`}
            >
              {isStarting || isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Preparing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <span>{canStart ? 'Mulai Lomba' : 'Waiting for Session...'}</span>
                  {canStart && (
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="px-6 py-3.5 btn-gold-outline rounded-lg font-medium text-sm transition-all duration-300 hover:shadow-gold"
            >
              Logout
            </button>
          </div>

          {/* Session Info */}
          <div className="mt-6 pt-6 border-t border-gold-light/30">
            <div className="flex items-center justify-between text-xs text-charcoal-gray/60">
              <span>Session ID: {accessCode}</span>
              <span className="flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                Secure Connection
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;