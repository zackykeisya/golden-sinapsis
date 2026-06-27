import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ExamProvider, useExam } from './context/ExamContext';
// Page Components
import HeroLanding from './pages/HeroLanding';
import JoinPage from './pages/JoinPage';
import Dashboard from './pages/Dashboard';
import ExamPage from './pages/ExamPage';
import AdminPanel from './pages/AdminPanel';

// Protected Route Component - dipindahkan ke dalam agar bisa akses useExam
const ProtectedRoute = ({ children, requireExamStart = false }) => {
  // Gunakan useExam di sini, tapi komponen ini harus berada di dalam ExamProvider
  const { participantId, isExamStarted, isExamCompleted } = useExam();
  
  if (!participantId) {
    return <Navigate to="/" replace />;
  }
  
  if (requireExamStart && !isExamStarted) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (isExamCompleted) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Bungkus ProtectedRoute dengan komponen yang menggunakan ExamProvider
const ProtectedRouteWrapper = ({ children, requireExamStart = false }) => {
  return (
    <ExamProvider>
      <ProtectedRoute requireExamStart={requireExamStart}>
        {children}
      </ProtectedRoute>
    </ExamProvider>
  );
};

function App() {
  return (
    <Router>
      <ExamProvider> {/* ExamProvider di sini untuk seluruh aplikasi */}
        <div className="min-h-screen bg-white-luxury">
          <Routes>
            {/* Public Routes - tidak perlu proteksi */}
            <Route path="/" element={<HeroLanding />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            
            {/* Protected Routes - menggunakan ProtectedRoute */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/exam" 
              element={
                <ProtectedRoute requireExamStart>
                  <ExamPage />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ExamProvider>
    </Router>
  );
}

export default App;