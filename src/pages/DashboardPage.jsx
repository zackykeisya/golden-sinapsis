// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { 
    participantId, 
    studentName, 
    examTitle, 
    getScore,
    resetExam 
  } = useExam();
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek apakah ada hasil exam
    const storedResults = localStorage.getItem('exam_results');
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
      } catch (e) {
        console.error('Failed to parse results:', e);
      }
    }
    setLoading(false);
  }, []);

  const handleBackToHome = () => {
    resetExam();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner-gold mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🏆 Exam Complete!</h1>
          <p className="text-gray-600 mt-2">Thank you for completing the exam</p>
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Your Results</h2>
              <p className="text-sm text-gray-500">{examTitle || 'Exam'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Student</p>
              <p className="font-medium text-gray-800">{studentName || 'Anonymous'}</p>
            </div>
          </div>

          {results ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Score</p>
                <p className="text-2xl font-bold text-amber-600">{results.total_score || 0}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Correct</p>
                <p className="text-2xl font-bold text-green-600">
                  {results.correct_answers || 0}/{results.total_questions || 0}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Percentage</p>
                <p className="text-2xl font-bold text-blue-600">
                  {results.total_questions > 0 
                    ? Math.round((results.correct_answers / results.total_questions) * 100) 
                    : 0}%
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Rank</p>
                <p className="text-2xl font-bold text-purple-600">
                  #{results.rank || '-'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No results found. Please complete an exam first.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleBackToHome}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            ← Back to Home
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;