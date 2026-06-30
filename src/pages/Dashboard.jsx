import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faGraduationCap,
  faClock,
  faUser,
  faEnvelope,
  faKey,
  faPlay,
  faSignOutAlt,
  faChevronDown,
  faChevronUp,
  faCheckCircle,
  faSpinner,
  faShieldAlt,
  faList,
  faFileAlt,
  faUsers,
  faAward,
  faCalendarAlt,
  faHourglassHalf
} from '@fortawesome/free-solid-svg-icons';

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

  useEffect(() => {
    if (timeRemaining > 0 && !isExamStarted) {
      setCanStart(true);
    } else {
      setCanStart(false);
    }

    if (isExamStarted) {
      navigate('/exam');
    }
  }, [timeRemaining, isExamStarted, navigate]);

  useEffect(() => {
    if (!canStart && timeRemaining > 0) {
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
    if (window.confirm('Apakah Anda yakin ingin keluar? Anda dapat melanjutkan sesi nanti.')) {
      resetExam();
      navigate('/');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-r from-amber-300/20 to-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-l from-amber-300/20 to-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-200/5 to-transparent rounded-full blur-3xl"></div>
        
        {/* Geometric Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-20 right-20">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <path d="M60 0L72 45L120 60L72 75L60 120L48 75L0 60L48 45L60 0Z" fill="#D4AF37" />
            </svg>
          </div>
          <div className="absolute bottom-20 left-20">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <path d="M40 0L48 30L80 40L48 50L40 80L32 50L0 40L32 30L40 0Z" fill="#D4AF37" />
            </svg>
          </div>
        </div>

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
        }}></div>
      </div>

      <div className="relative w-full max-w-2xl z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xl shadow-amber-500/25 mb-5 transform hover:scale-110 transition-transform duration-300">
            <FontAwesomeIcon icon={faGraduationCap} className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-800">
            Selamat Datang, <span className="bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">{studentName}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sesi kompetisi Anda sudah siap
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-slate-200/50 shadow-2xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-all duration-500">
          {/* Exam Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/50">
              <div className="flex items-center text-slate-500 text-sm mb-1">
                <FontAwesomeIcon icon={faKey} className="w-4 h-4 mr-2 text-amber-500" />
                Kode Akses
              </div>
              <div className="font-mono font-semibold text-slate-800 text-lg tracking-wider">
                {accessCode}
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/50">
              <div className="flex items-center text-slate-500 text-sm mb-1">
                <FontAwesomeIcon icon={faClock} className="w-4 h-4 mr-2 text-amber-500" />
                Durasi
              </div>
              <div className="font-semibold text-slate-800 text-lg">
                {durationMinutes} menit
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/50">
              <div className="flex items-center text-slate-500 text-sm mb-1">
                <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-2 text-amber-500" />
                Peserta
              </div>
              <div className="font-semibold text-slate-800 text-lg truncate">
                {studentName}
                {studentEmail && (
                  <span className="text-sm font-normal text-slate-400 ml-2">
                    ({studentEmail})
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/50">
              <div className="flex items-center text-slate-500 text-sm mb-1">
                <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4 mr-2 text-amber-500" />
                Status
              </div>
              <div className="font-semibold text-slate-800 text-lg flex items-center">
                {canStart ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                    Siap Mulai
                  </>
                ) : countdown !== null && countdown > 0 ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                    Mulai dalam {countdown}s
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-2"></span>
                    Menunggu...
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Rules Section */}
          <div className="mb-8">
            <button
              onClick={() => setShowRules(!showRules)}
              className="flex items-center text-amber-600 hover:text-amber-700 transition-colors text-sm font-medium"
            >
              <FontAwesomeIcon icon={showRules ? faChevronUp : faChevronDown} className="w-4 h-4 mr-2" />
              {showRules ? 'Sembunyikan Aturan' : 'Tampilkan Aturan Kompetisi'}
            </button>
            
            {showRules && (
              <div className="mt-4 p-5 bg-slate-50/80 rounded-xl border border-slate-200/50 space-y-3 animate-fade-in">
                <div className="flex items-start space-x-3">
                  <span className="text-amber-500 font-bold text-sm">1.</span>
                  <p className="text-slate-600 text-sm">Anda memiliki <span className="font-semibold text-slate-800">{durationMinutes} menit</span> untuk menyelesaikan semua soal</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-amber-500 font-bold text-sm">2.</span>
                  <p className="text-slate-600 text-sm">Semua soal harus dijawab sebelum mengumpulkan</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-amber-500 font-bold text-sm">3.</span>
                  <p className="text-slate-600 text-sm">Progress Anda otomatis tersimpan dengan setiap pilihan</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-amber-500 font-bold text-sm">4.</span>
                  <p className="text-slate-600 text-sm">Timer tidak dapat dijeda setelah ujian dimulai</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-amber-500 font-bold text-sm">5.</span>
                  <p className="text-slate-600 text-sm">Sistem akan mengumpulkan otomatis saat waktu habis</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleStartExam}
              disabled={!canStart || isStarting || isLoading}
              className={`flex-1 py-3.5 rounded-xl font-semibold text-white text-base
                bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700
                shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50
                transition-all duration-300 transform hover:-translate-y-0.5
                ${(!canStart || isStarting || isLoading) ? 'opacity-50 cursor-not-allowed hover:transform-none' : ''}
                group`}
            >
              {isStarting || isLoading ? (
                <span className="flex items-center justify-center">
                  <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 mr-3 animate-spin" />
                  Mempersiapkan...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <span>{canStart ? 'Mulai Lomba' : 'Menunggu Sesi...'}</span>
                  {canStart && (
                    <FontAwesomeIcon icon={faPlay} className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                  )}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="px-6 py-3.5 rounded-xl font-medium text-slate-600 border-2 border-slate-200 hover:border-amber-400 hover:text-amber-600 hover:shadow-lg transition-all duration-300"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4 mr-2" />
              Keluar
            </button>
          </div>

          {/* Session Info */}
          <div className="mt-6 pt-6 border-t border-slate-200/50">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center">
                <FontAwesomeIcon icon={faKey} className="w-3 h-3 mr-1.5 text-amber-400" />
                Sesi: {accessCode}
              </span>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faShieldAlt} className="w-3 h-3 mr-1.5 text-emerald-400" />
                Koneksi Aman
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;