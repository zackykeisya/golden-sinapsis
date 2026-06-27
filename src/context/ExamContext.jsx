/**
 * ExamContext.jsx — Global exam state and API integration layer.
 * 
 * Added security features:
 * - Security breach tracking with alert counter
 * - Auto-submit on max alerts (3 violations)
 * - Tab switch detection
 * - Copy/Paste prevention
 * - Right-click prevention
 * - DevTools shortcut prevention
 */

import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef,
} from 'react';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  cfg => {
    console.debug('[API →]', cfg.method?.toUpperCase(), cfg.url);
    return cfg;
  },
  err => Promise.reject(err),
);

api.interceptors.response.use(
  res => {
    console.debug('[API ←]', res.config.url, res.status);
    return res;
  },
  err => {
    console.error('[API ✗]', err.config?.url, err.response?.status, err.response?.data);
    return Promise.reject(err);
  },
);

// ---------------------------------------------------------------------------
// Context bootstrap
// ---------------------------------------------------------------------------

const ExamContext = createContext(null);

export const useExam = () => {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error('useExam must be used within <ExamProvider>');
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const ExamProvider = ({ children }) => {

  // ---- Core identity ----
  const [accessCode,      setAccessCode]      = useState(null);
  const [participantId,   setParticipantId]   = useState(null);
  const [studentName,     setStudentName]     = useState('');
  const [studentEmail,    setStudentEmail]    = useState('');
  const [examTitle,       setExamTitle]       = useState('');
  const [durationMinutes, setDurationMinutes] = useState(0);

  // ---- Exam progress ----
  const [questions,            setQuestions]            = useState([]);
  const [answers,              setAnswers]              = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isExamStarted,        setIsExamStarted]        = useState(false);
  const [isExamCompleted,      setIsExamCompleted]      = useState(false);
  const [isSubmitting,         setIsSubmitting]         = useState(false);

  // ---- Timer ----
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionStart,  setSessionStart]  = useState(null);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // ---- Security ----
  const [securityAlertCount, setSecurityAlertCount] = useState(0);
  const [isSecurityBreached, setIsSecurityBreached] = useState(false);
  const [lastAlertReason, setLastAlertReason] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);
  const MAX_ALERTS = 3;

  // ---- UI ----
  const [isLoading,        setIsLoading]        = useState(false);
  const [error,            setError]            = useState(null);
  const [validationStatus, setValidationStatus] = useState(null);

  // ---------------------------------------------------------------------------
  // Refs — mutable values accessible inside closures without stale captures
  // ---------------------------------------------------------------------------

  const timerRef          = useRef(null);
  const lastSyncRef       = useRef(Date.now());

  /**
   * FIX #2 & #4: use refs for values that async callbacks need fresh access to.
   * State setters are stable but state values are NOT safe inside long-lived callbacks.
   */
  const participantIdRef  = useRef(null);   // mirrors participantId state
  const answersRef        = useRef({});     // mirrors answers state
  const timeRemainingRef  = useRef(0);      // mirrors timeRemaining state
  const isCompletedRef    = useRef(false);  // mirrors isExamCompleted state
  const securityAlertRef  = useRef(0);      // mirrors securityAlertCount state

  // Keep refs in sync with state on every render (cheap — just assignment)
  useEffect(() => { participantIdRef.current  = participantId;   }, [participantId]);
  useEffect(() => { answersRef.current        = answers;         }, [answers]);
  useEffect(() => { timeRemainingRef.current  = timeRemaining;   }, [timeRemaining]);
  useEffect(() => { isCompletedRef.current    = isExamCompleted; }, [isExamCompleted]);
  useEffect(() => { securityAlertRef.current  = securityAlertCount; }, [securityAlertCount]);

  // Save-queue refs
  const saveQueueRef  = useRef([]);   // [{question_id: int, selected_option_index: int}]
  const isSavingRef   = useRef(false);

  // ---------------------------------------------------------------------------
  // Security Functions
  // ---------------------------------------------------------------------------

  /**
   * Track security violations and auto-submit when max alerts reached
   */
  const trackSecurityViolation = useCallback((reason) => {
    if (isCompletedRef.current) return;

    const newCount = securityAlertRef.current + 1;
    setSecurityAlertCount(newCount);
    securityAlertRef.current = newCount;
    setLastAlertReason(reason);
    
    // Add to history
    setAlertHistory(prev => [...prev, {
      count: newCount,
      reason: reason,
      timestamp: new Date().toISOString()
    }]);

    console.warn(`🔒 SECURITY ALERT ${newCount}/${MAX_ALERTS}: ${reason}`);

    // Play alert sound if available
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      gainNode.gain.value = 0.15;
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 300);
    } catch (e) { /* silent fail */ }

    // Check if max alerts reached
    if (newCount >= MAX_ALERTS) {
      setIsSecurityBreached(true);
      console.warn('🚨 MAX ALERTS REACHED! Auto-submitting exam...');
      
      // Auto-submit after a brief delay to show warning
      setTimeout(() => {
        if (!isCompletedRef.current) {
          handleSubmitExamInternal({ autoSubmit: true, reason: 'Max security violations' });
        }
      }, 2000);
    }
  }, []);

  /**
   * Set up security monitors
   */
  useEffect(() => {
    if (!isExamStarted || isExamCompleted) return;

    // ====== Tab/Window visibility ======
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackSecurityViolation('Tab switched or window minimized');
      }
    };

    // ====== Window blur (click outside) ======
    const handleBlur = () => {
      // Only track if it's not a legitimate action (like clicking on another app)
      if (!document.hidden) {
        trackSecurityViolation('Window lost focus');
      }
    };

    // ====== Right-click prevention ======
    const handleContextMenu = (e) => {
      e.preventDefault();
      trackSecurityViolation('Right-click (inspect attempt)');
      return false;
    };

    // ====== Copy/Cut/Paste prevention ======
    const handleCopy = (e) => {
      e.preventDefault();
      trackSecurityViolation('Copy attempt');
      return false;
    };

    const handleCut = (e) => {
      e.preventDefault();
      trackSecurityViolation('Cut attempt');
      return false;
    };

    const handlePaste = (e) => {
      e.preventDefault();
      trackSecurityViolation('Paste attempt');
      return false;
    };

    // ====== Keyboard shortcuts ======
    const handleKeyDown = (e) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        trackSecurityViolation('F12 (DevTools)');
        return false;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        trackSecurityViolation('DevTools shortcut');
        return false;
      }

      // Ctrl+U (view source)
      if (e.ctrlKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        trackSecurityViolation('View source');
        return false;
      }

      // Ctrl+S (save)
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        trackSecurityViolation('Save page shortcut');
        return false;
      }

      // Ctrl+P (print)
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        trackSecurityViolation('Print shortcut');
        return false;
      }
    };

    // ====== Register event listeners ======
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);

    // ====== Periodic check (every 2 seconds) ======
    const intervalId = setInterval(() => {
      if (!document.hasFocus() && !document.hidden) {
        // Window is visible but not focused - might be clicking outside
        trackSecurityViolation('Focus lost (periodic check)');
      }
    }, 2000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(intervalId);
    };
  }, [isExamStarted, isExamCompleted, trackSecurityViolation]);

  // ---------------------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------------------

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * FIX #4: syncTimeWithServer reads timeRemainingRef.current, not the stale
   * `timeRemaining` captured when this callback was created.
   */
  const syncTimeWithServer = useCallback(async () => {
    const pid = participantIdRef.current;
    if (!pid) return;

    try {
      const { data } = await api.get(`/exam/status/${pid}`);
      if (!data) return;

      const serverTime = data.time_remaining_seconds;
      const localTime  = timeRemainingRef.current;      // fresh via ref
      const drift      = serverTime - localTime;

      if (Math.abs(drift) > 5) {
        console.warn(`[Timer] Drift ${drift}s detected, correcting to ${serverTime}s`);
        setTimeRemaining(serverTime);
      }

      if (data.is_completed) {
        setIsExamCompleted(true);
        stopTimer();
      }
    } catch (err) {
      console.error('[Timer] Sync failed:', err.message);
    }
  }, [stopTimer]);

  const startTimer = useCallback(() => {
    stopTimer();
    setIsTimerPaused(false);

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopTimer();
          if (!isCompletedRef.current) {
            // Trigger auto-submit without re-capturing state
            handleSubmitExamInternal({ autoSubmit: true, reason: 'Time expired' });
          }
          return 0;
        }

        // Sync every 30 s
        if (Date.now() - lastSyncRef.current > 30_000) {
          lastSyncRef.current = Date.now();
          syncTimeWithServer();
        }

        return prev - 1;
      });
    }, 1000);
  }, [stopTimer, syncTimeWithServer]);

  const pauseTimer = useCallback(() => {
    setIsTimerPaused(true);
    stopTimer();
  }, [stopTimer]);

  const resumeTimer = useCallback(() => {
    if (!isCompletedRef.current) {
      startTimer();
    }
  }, [startTimer]);

  // ---------------------------------------------------------------------------
  // Auto-save queue
  // ---------------------------------------------------------------------------

  /**
   * Process the queue in batches.
   *
   * FIX #2: reads participantIdRef.current — always the current value.
   * FIX #6: deduplication happens before pushing (see queueAnswerSave).
   */
  const processSaveQueue = useCallback(async () => {
    if (isSavingRef.current || saveQueueRef.current.length === 0) return;

    const pid = participantIdRef.current;
    if (!pid) {
      // Not logged in yet — retry shortly
      setTimeout(processSaveQueue, 1000);
      return;
    }

    isSavingRef.current = true;
    const batch = [...saveQueueRef.current];
    saveQueueRef.current = [];

    try {
      await Promise.all(
        batch.map(item =>
          api.post('/exam/answer', item, {
            headers: { 'X-Participant-ID': String(pid) },
          })
        )
      );

      // Mark as saved in local state
      setAnswers(prev => {
        const next = { ...prev };
        batch.forEach(({ question_id }) => {
          if (next[question_id]) {
            next[question_id] = {
              ...next[question_id],
              is_saved:  true,
              saved_at:  new Date().toISOString(),
            };
          }
        });
        return next;
      });

    } catch (err) {
      console.error('[AutoSave] Batch failed, requeuing:', err.message);
      // Requeue failed items (prepend so they go next)
      saveQueueRef.current = [...batch, ...saveQueueRef.current];
    } finally {
      isSavingRef.current = false;
      if (saveQueueRef.current.length > 0) {
        setTimeout(processSaveQueue, 1500);
      }
    }
  }, []);

  /**
   * Queue an answer for auto-save.
   *
   * FIX #1: `parseInt()` is called here so only Numbers enter the queue.
   * FIX #6: remove any previous entry for the same question (last-write-wins).
   */
  const queueAnswerSave = useCallback(
    (questionId, selectedOptionIndex) => {
      const qid = parseInt(questionId, 10);
      const idx = parseInt(selectedOptionIndex, 10);

      if (isNaN(qid) || isNaN(idx)) {
        console.error('[Queue] Invalid types:', { questionId, selectedOptionIndex });
        return;
      }

      // Deduplicate: remove earlier entry for same question
      saveQueueRef.current = saveQueueRef.current.filter(
        item => item.question_id !== qid
      );

      saveQueueRef.current.push({
        question_id:           qid,
        selected_option_index: idx,
      });

      if (!isSavingRef.current) {
        setTimeout(processSaveQueue, 400);
      }
    },
    [processSaveQueue]
  );

  // ---------------------------------------------------------------------------
  // Exam actions
  // ---------------------------------------------------------------------------

  /**
   * Validate access code and start a session.
   */
  const validateAccessCode = useCallback(async (code, name, email = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/validate', {
        code:          code.trim(),
        student_name:  name.trim(),
        student_email: email.trim() || null,
      });

      if (!data?.valid) {
        throw new Error('Server returned valid: false without an error');
      }

      const pid            = parseInt(data.participant_id, 10);  // FIX #1
      const timeRemainingSec = parseInt(
        data.time_remaining_seconds ?? (data.duration_minutes * 60),
        10
      );

      setAccessCode(code.trim());
      setParticipantId(pid);
      setStudentName(data.student_name);
      setStudentEmail(email.trim());
      setExamTitle(data.exam_title || `Exam ${code}`);
      setDurationMinutes(data.duration_minutes || 60);
      setTimeRemaining(timeRemainingSec);
      setSessionStart(data.session_start);
      setValidationStatus('valid');
      setSecurityAlertCount(0); // Reset security alerts

      participantIdRef.current = pid;  // keep ref in sync immediately

      startTimer();

      sessionStorage.setItem('exam_session', JSON.stringify({
        accessCode:    code.trim(),
        participantId: pid,
        studentName:   data.student_name,
        examTitle:     data.exam_title || `Exam ${code}`,
        sessionStart:  data.session_start,
        timeRemaining: timeRemainingSec,
      }));

      return { success: true, data };

    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg    = typeof detail === 'object'
        ? (detail.message || detail.error || 'Invalid access code')
        : (detail || 'Invalid access code. Please try again.');

      setError(msg);
      setValidationStatus('invalid');
      return { success: false, error: msg };

    } finally {
      setIsLoading(false);
    }
  }, [startTimer]);

  /**
   * FIX #5: accepts an explicit `id` argument so it can be called during
   * session recovery before the `participantId` state variable has settled.
   */
  const fetchQuestionsForId = useCallback(async (id) => {
    const pid = parseInt(id, 10);
    if (!pid) return { success: false, error: 'No participant ID' };

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.get(`/exam/questions/${pid}`);
      setQuestions(data);
      setIsExamStarted(true);

      // Recover locally-saved answers
      const stored = sessionStorage.getItem(`exam_answers_${pid}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Ensure all indices are Numbers (FIX #1)
          const normalised = {};
          Object.entries(parsed).forEach(([k, v]) => {
            normalised[parseInt(k, 10)] = {
              ...v,
              selected_option_index: parseInt(v.selected_option_index, 10),
            };
          });
          setAnswers(normalised);
        } catch (_) { /* ignore parse errors */ }
      }

      return { success: true, data };

    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load exam questions.';
      setError(msg);
      return { success: false, error: msg };

    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Convenience wrapper that uses current state (for normal post-login calls). */
  const fetchQuestions = useCallback(() => {
    return fetchQuestionsForId(participantIdRef.current);
  }, [fetchQuestionsForId]);

  /**
   * Record a student's answer choice.
   *
   * FIX #1: parseInt at every entry point.
   */
  const selectAnswer = useCallback((questionId, optionIndex) => {
    const qid = parseInt(questionId, 10);
    const idx = parseInt(optionIndex, 10);

    setAnswers(prev => {
      const next = {
        ...prev,
        [qid]: {
          selected_option_index: idx,
          is_saved:              false,
          updated_at:            new Date().toISOString(),
        },
      };

      // Persist to sessionStorage for crash recovery
      const pid = participantIdRef.current;
      if (pid) {
        sessionStorage.setItem(`exam_answers_${pid}`, JSON.stringify(next));
      }

      return next;
    });

    queueAnswerSave(qid, idx);
  }, [queueAnswerSave]);

  /**
   * Internal submit implementation — separated so the timer's interval callback
   * can call it without capturing stale state.
   *
   * FIX #3: reads answersRef.current instead of the captured `answers` snapshot.
   */
  const handleSubmitExamInternal = useCallback(async (options = {}) => {
    const pid = participantIdRef.current;
    if (!pid || isCompletedRef.current) return { success: false };

    setIsSubmitting(true);
    setError(null);

    try {
      // FIX #3: read from ref — always the latest answers
      const currentAnswers = answersRef.current;

      const answerList = Object.entries(currentAnswers)
        .filter(([, v]) => v?.selected_option_index !== undefined)
        .map(([qid, v]) => ({
          question_id:           parseInt(qid, 10),           // FIX #1
          selected_option_index: parseInt(v.selected_option_index, 10), // FIX #1
        }));

      const { data } = await api.post('/exam/submit', {
        participant_id: pid,
        answers:        answerList,
        auto_submit:    options.autoSubmit || false,
        reason:         options.reason || null,
      }, {
        headers: { 'X-Participant-ID': String(pid) },
      });

      setIsExamCompleted(true);
      stopTimer();

      sessionStorage.removeItem(`exam_answers_${pid}`);
      sessionStorage.removeItem('exam_session');
      sessionStorage.setItem('exam_results', JSON.stringify(data));

      return { success: true, data };

    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg    = typeof detail === 'object'
        ? (detail.message || detail.error || 'Server error')
        : (detail || 'Failed to submit exam. Please try again.');
      setError(msg);
      return { success: false, error: msg };

    } finally {
      setIsSubmitting(false);
    }
  }, [stopTimer]);

  /** Public-facing submit (used by UI buttons). */
  const handleSubmitExam = useCallback(
    () => handleSubmitExamInternal({ autoSubmit: false }),
    [handleSubmitExamInternal]
  );

  /**
   * Full state reset.
   */
  const resetExam = useCallback(() => {
    stopTimer();

    const pid = participantIdRef.current;
    if (pid) {
      sessionStorage.removeItem(`exam_answers_${pid}`);
    }
    sessionStorage.removeItem('exam_session');
    sessionStorage.removeItem('exam_results');

    saveQueueRef.current = [];
    isSavingRef.current  = false;

    setAccessCode(null);
    setParticipantId(null);
    setStudentName('');
    setStudentEmail('');
    setExamTitle('');
    setDurationMinutes(0);
    setQuestions([]);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsExamStarted(false);
    setIsExamCompleted(false);
    setTimeRemaining(0);
    setSessionStart(null);
    setValidationStatus(null);
    setError(null);
    setSecurityAlertCount(0);
    setIsSecurityBreached(false);
    setLastAlertReason(null);
    setAlertHistory([]);

    participantIdRef.current = null;
    answersRef.current       = {};
    timeRemainingRef.current = 0;
    isCompletedRef.current   = false;
    securityAlertRef.current = 0;
  }, [stopTimer]);

  const navigateToQuestion = useCallback((index) => {
    setQuestions(qs => {
      if (index >= 0 && index < qs.length) {
        setCurrentQuestionIndex(index);
      }
      return qs;
    });
  }, []);

  const getAnsweredCount = useCallback(() => {
    return Object.values(answersRef.current).filter(
      v => v?.selected_option_index !== undefined
    ).length;
  }, []);

  const getScore = useCallback(() => {
    try {
      const raw = sessionStorage.getItem('exam_results');
      return raw ? (JSON.parse(raw).total_score ?? 0) : 0;
    } catch {
      return 0;
    }
  }, []);

  const getSecurityStatus = useCallback(() => {
    return {
      alertCount: securityAlertCount,
      maxAlerts: MAX_ALERTS,
      isBreached: isSecurityBreached,
      lastAlert: lastAlertReason,
      history: alertHistory,
    };
  }, [securityAlertCount, isSecurityBreached, lastAlertReason, alertHistory]);

  // ---------------------------------------------------------------------------
  // Session recovery on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const recover = async () => {
      const raw = sessionStorage.getItem('exam_session');
      if (!raw) return;

      let session;
      try { session = JSON.parse(raw); } catch { return; }

      try {
        // Validate with server
        const { data } = await api.post('/auth/validate/device', null, {
          params: { participant_id: session.participantId },
        });

        if (!data?.valid) {
          sessionStorage.removeItem('exam_session');
          return;
        }

        const pid = parseInt(session.participantId, 10);  // FIX #1

        // Set refs BEFORE state so any callbacks triggered during setX() calls
        // already have the correct participantId (FIX #5)
        participantIdRef.current = pid;

        setAccessCode(session.accessCode);
        setParticipantId(pid);
        setStudentName(session.studentName);
        setExamTitle(session.examTitle);
        setTimeRemaining(data.time_remaining ?? session.timeRemaining);
        setSessionStart(session.sessionStart);

        // FIX #5: pass pid explicitly — state variable hasn't settled yet
        await fetchQuestionsForId(pid);

        startTimer();

      } catch (err) {
        console.warn('[Recovery] Failed, clearing session:', err.message);
        sessionStorage.removeItem('exam_session');
      }
    };

    recover();

    return () => stopTimer();
  }, []); // intentionally empty — runs once on mount

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value = {
    // Identity
    accessCode, participantId, studentName, studentEmail, examTitle, durationMinutes,

    // Exam state
    questions, answers, currentQuestionIndex,
    isExamStarted, isExamCompleted, isSubmitting,

    // Timer
    timeRemaining, sessionStart, isTimerPaused,

    // Security
    securityAlertCount,
    isSecurityBreached,
    lastAlertReason,
    alertHistory,
    MAX_ALERTS,
    getSecurityStatus,
    trackSecurityViolation,

    // UI
    isLoading, error, validationStatus,

    // Actions
    validateAccessCode,
    fetchQuestions,
    selectAnswer,
    handleSubmitExam,
    resetExam,
    navigateToQuestion,
    getAnsweredCount,
    getScore,

    // Timer controls
    pauseTimer,
    resumeTimer,
    stopTimer,
    syncTimeWithServer,
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};

export default ExamContext;