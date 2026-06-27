import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ExamProvider } from './context/ExamContext';
import './index.css';

console.log('🚀 Starting application...');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ExamProvider>
      <App />
    </ExamProvider>
  </React.StrictMode>
);