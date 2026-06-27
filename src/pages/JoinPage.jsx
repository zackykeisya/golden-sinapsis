import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';

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

  // Redirect if already authenticated
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
      errors.accessCode = 'Access code is required';
    } else if (accessCode.trim().length < 5) {
      errors.accessCode = 'Access code must be at least 5 characters';
    }
    
    if (!studentName.trim()) {
      errors.studentName = 'Student name is required';
    } else if (studentName.trim().length < 2) {
      errors.studentName = 'Name must be at least 2 characters';
    }
    
    if (studentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      errors.studentEmail = 'Please enter a valid email address';
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
    <div className="min-h-screen bg-white-luxury flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center text-charcoal-gray/60 hover:text-gold transition-colors"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Kembali
      </button>

      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-glow rounded-full opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gold-glow rounded-full opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-glow rounded-full opacity-5"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-md">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-1 bg-gold-gradient rounded-full"></div>

        <div className="card-gold p-8 md:p-10 relative">
          {/* Logo/Icon Area */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-gradient text-white mb-4 shadow-gold">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-display text-gold-gradient">
              Masuk Ruang Lomba
            </h1>
            <p className="text-charcoal-gray text-sm mt-2 font-light">
              Masukkan kode akses yang telah diberikan
            </p>
          </div>

          {/* Success Animation */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-float">
              <div className="flex items-center justify-center text-green-700">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Access Granted! Redirecting...</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && !showSuccess && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-pulse">
              <div className="flex items-center text-red-700">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Access Code Field */}
            <div>
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">
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
                  className={`w-full px-4 py-3 input-gold rounded-lg text-charcoal placeholder-charcoal-gray/50
                    ${formErrors.accessCode ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}
                    ${isFocused ? 'border-gold shadow-gold' : ''}
                    transition-all duration-300`}
                  disabled={isLoading || showSuccess}
                  autoFocus
                />
                {isFocused && !formErrors.accessCode && (
                  <div className="absolute inset-0 rounded-lg bg-gold-glow opacity-20 pointer-events-none"></div>
                )}
              </div>
              {formErrors.accessCode && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formErrors.accessCode}
                </p>
              )}
            </div>

            {/* Student Name Field */}
            <div>
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">
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
                className={`w-full px-4 py-3 input-gold rounded-lg text-charcoal placeholder-charcoal-gray/50
                  ${formErrors.studentName ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}
                  transition-all duration-300`}
                disabled={isLoading || showSuccess}
              />
              {formErrors.studentName && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formErrors.studentName}
                </p>
              )}
            </div>

            {/* Student Email Field (Optional) */}
            <div>
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                Email <span className="text-charcoal-gray/50 text-xs font-light">(Opsional)</span>
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
                className={`w-full px-4 py-3 input-gold rounded-lg text-charcoal placeholder-charcoal-gray/50
                  ${formErrors.studentEmail ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}
                  transition-all duration-300`}
                disabled={isLoading || showSuccess}
              />
              {formErrors.studentEmail && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formErrors.studentEmail}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || showSuccess}
              className={`w-full btn-gold py-3.5 rounded-lg font-semibold text-white text-base
                transition-all duration-300 relative overflow-hidden
                ${(isLoading || showSuccess) ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-gold-lg hover:transform hover:-translate-y-0.5'}
                group`}
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
                <span className="flex items-center justify-center text-green-200">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Akses Diberikan!
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <span>Masuk Ruang Lomba</span>
                  <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Footer Information */}
          <div className="mt-6 pt-6 border-t border-gold-light/30">
            <div className="flex items-center justify-center space-x-4 text-xs text-charcoal-gray/60">
              <span className="flex items-center">
                <svg className="w-3.5 h-3.5 mr-1.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Sesi Aman
              </span>
              <span className="w-px h-4 bg-gold-light/30"></span>
              <span className="flex items-center">
                <svg className="w-3.5 h-3.5 mr-1.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Terbatas Waktu
              </span>
              <span className="w-px h-4 bg-gold-light/30"></span>
              <span className="flex items-center">
                <svg className="w-3.5 h-3.5 mr-1.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Auto-Save
              </span>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gold-gradient/30 rounded-full"></div>
      </div>
    </div>
  );
};

export default JoinPage;