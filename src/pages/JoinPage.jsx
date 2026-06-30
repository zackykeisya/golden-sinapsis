import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faGraduationCap, 
  faLock, 
  faClock, 
  faSave,
  faCheckCircle,
  faExclamationCircle,
  faArrowRight,
  faUser,
  faEnvelope,
  faKey
} from '@fortawesome/free-solid-svg-icons';

const JoinPage = () => {
  const navigate = useNavigate();
  const { 
    validateAccessCode, 
    isLoading, 
    error, 
    validationStatus,
    participantId,
    isExamStarted 
  } = useExam();

  const [accessCode, setAccessCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isFocused, setIsFocused] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (participantId && !isExamStarted) {
      navigate('/dashboard');
    } else if (participantId && isExamStarted) {
      navigate('/exam');
    }
  }, [participantId, isExamStarted, navigate]);

  const validateForm = () => {
    const errors = {};
    
    if (!accessCode.trim()) {
      errors.accessCode = 'Kode akses wajib diisi';
    } else if (accessCode.trim().length < 5) {
      errors.accessCode = 'Kode akses minimal 5 karakter';
    }
    
    if (!studentName.trim()) {
      errors.studentName = 'Nama lengkap wajib diisi';
    } else if (studentName.trim().length < 2) {
      errors.studentName = 'Nama minimal 2 karakter';
    }
    
    if (studentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      errors.studentEmail = 'Masukkan alamat email yang valid';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const result = await validateAccessCode(accessCode, studentName, studentEmail);
    
    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center text-slate-400 hover:text-amber-600 transition-colors duration-200 group"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Kembali</span>
      </button>

      {/* Background Decorative Elements */}
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

      {/* Main Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-slate-200/50 shadow-2xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-all duration-500">
          {/* Logo/Icon Area */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xl shadow-amber-500/25 mb-5 transform hover:scale-110 transition-transform duration-300">
              <FontAwesomeIcon icon={faGraduationCap} className="w-10 h-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
              Masuk Ruang Lomba
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-light">
              Masukkan kode akses yang telah diberikan
            </p>
          </div>

          {/* Success Animation */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-float">
              <div className="flex items-center justify-center text-emerald-700">
                <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 mr-2" />
                <span className="font-medium">Akses Diberikan! Mengalihkan...</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && !showSuccess && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-pulse">
              <div className="flex items-center text-red-700">
                <FontAwesomeIcon icon={faExclamationCircle} className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Access Code Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <FontAwesomeIcon icon={faKey} className="w-4 h-4 mr-2 text-amber-500" />
                Kode Akses
              </label>
              <div className={`relative transition-all duration-300 ${
                isFocused ? 'transform scale-[1.02]' : ''
              }`}>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value.toUpperCase());
                    setFormErrors({ ...formErrors, accessCode: '' });
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyPress={handleKeyPress}
                  placeholder="Contoh: LOMBA-MAT-XYZ7"
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-slate-800 placeholder-slate-400/60
                    ${formErrors.accessCode ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-amber-400 focus:ring-amber-200'}
                    ${isFocused ? 'border-amber-400 shadow-lg shadow-amber-500/10' : ''}
                    transition-all duration-300 outline-none focus:ring-4`}
                  disabled={isLoading || showSuccess}
                  autoFocus
                />
              </div>
              {formErrors.accessCode && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center">
                  <FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4 mr-1" />
                  {formErrors.accessCode}
                </p>
              )}
            </div>

            {/* Student Name Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-2 text-amber-500" />
                Nama Lengkap
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  setFormErrors({ ...formErrors, studentName: '' });
                }}
                onKeyPress={handleKeyPress}
                placeholder="Masukkan nama lengkap Anda"
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-slate-800 placeholder-slate-400/60
                  ${formErrors.studentName ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-amber-400 focus:ring-amber-200'}
                  transition-all duration-300 outline-none focus:ring-4`}
                disabled={isLoading || showSuccess}
              />
              {formErrors.studentName && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center">
                  <FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4 mr-1" />
                  {formErrors.studentName}
                </p>
              )}
            </div>

            {/* Student Email Field (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 mr-2 text-amber-500" />
                Email <span className="text-slate-400 text-xs font-light">(Opsional)</span>
              </label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => {
                  setStudentEmail(e.target.value);
                  setFormErrors({ ...formErrors, studentEmail: '' });
                }}
                onKeyPress={handleKeyPress}
                placeholder="email@anda.com"
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-slate-800 placeholder-slate-400/60
                  ${formErrors.studentEmail ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-amber-400 focus:ring-amber-200'}
                  transition-all duration-300 outline-none focus:ring-4`}
                disabled={isLoading || showSuccess}
              />
              {formErrors.studentEmail && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center">
                  <FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4 mr-1" />
                  {formErrors.studentEmail}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || showSuccess}
              className={`w-full py-3.5 rounded-xl font-semibold text-white text-base
                bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700
                shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50
                transition-all duration-300 transform hover:-translate-y-0.5
                ${(isLoading || showSuccess) ? 'opacity-70 cursor-not-allowed hover:transform-none' : ''}
                group relative overflow-hidden`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memvalidasi...
                </span>
              ) : showSuccess ? (
                <span className="flex items-center justify-center text-emerald-200">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 mr-2" />
                  Akses Diberikan!
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <span>Masuk Ruang Lomba</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          {/* Footer Information */}
          <div className="mt-6 pt-6 border-t border-slate-200/50">
            <div className="flex items-center justify-center space-x-4 text-xs text-slate-400">
              <span className="flex items-center">
                <FontAwesomeIcon icon={faLock} className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Sesi Aman
              </span>
              <span className="w-px h-4 bg-slate-200"></span>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Terbatas Waktu
              </span>
              <span className="w-px h-4 bg-slate-200"></span>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faSave} className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Auto-Save
              </span>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-amber-400/30 to-amber-600/30 rounded-full"></div>
      </div>
    </div>
  );
};

export default JoinPage;