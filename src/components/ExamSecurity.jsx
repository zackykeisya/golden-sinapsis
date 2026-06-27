// src/components/ExamSecurity.jsx
import React, { useEffect, useRef, useState } from 'react';

const ExamSecurity = ({ 
  children, 
  onSecurityBreach, 
  maxAlerts = 3,
  onMaxAlertsReached 
}) => {
  const [alertCount, setAlertCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [hasFocus, setHasFocus] = useState(true);
  const alertSoundRef = useRef(null);
  const intervalRef = useRef(null);
  const visibilityCheckRef = useRef(null);

  // Create alert sound using Web Audio API
  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 500);
    } catch (e) {
      console.warn('Could not play alert sound:', e);
    }
  };

  const handleSecurityBreach = (reason) => {
    const newCount = alertCount + 1;
    setAlertCount(newCount);
    
    // Play alert sound
    playAlertSound();
    
    // Log breach
    console.warn(`🔒 Security Breach ${newCount}/${maxAlerts}: ${reason}`);
    
    // Call callback
    if (onSecurityBreach) {
      onSecurityBreach({ count: newCount, reason, maxAlerts });
    }
    
    // Check if max alerts reached
    if (newCount >= maxAlerts) {
      console.warn('🚨 MAX ALERTS REACHED! Auto-submitting exam...');
      if (onMaxAlertsReached) {
        onMaxAlertsReached();
      }
    }
  };

  // Check if window is in focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isPageVisible = document.visibilityState === 'visible';
      setIsVisible(isPageVisible);
      setHasFocus(isPageVisible);
      
      if (!isPageVisible) {
        handleSecurityBreach('Tab switched or browser minimized');
      }
    };

    const handleBlur = () => {
      setHasFocus(false);
      handleSecurityBreach('Window lost focus (clicked outside)');
    };

    const handleFocus = () => {
      setHasFocus(true);
      setIsVisible(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [alertCount]);

  // Monitor for right-click (context menu)
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      handleSecurityBreach('Right-click detected (trying to inspect)');
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [alertCount]);

  // Monitor for keyboard shortcuts (DevTools)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        handleSecurityBreach('F12 key pressed (DevTools)');
        return false;
      }
      
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        handleSecurityBreach('DevTools shortcut detected');
        return false;
      }
      
      // Ctrl+U (view source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        handleSecurityBreach('View source shortcut detected');
        return false;
      }
      
      // Ctrl+S (save page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSecurityBreach('Save page shortcut detected');
        return false;
      }
      
      // Ctrl+P (print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        handleSecurityBreach('Print shortcut detected');
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [alertCount]);

  // Prevent copy, cut, paste
  useEffect(() => {
    const handleCopy = (e) => {
      e.preventDefault();
      handleSecurityBreach('Copy attempted');
      return false;
    };

    const handleCut = (e) => {
      e.preventDefault();
      handleSecurityBreach('Cut attempted');
      return false;
    };

    const handlePaste = (e) => {
      e.preventDefault();
      handleSecurityBreach('Paste attempted');
      return false;
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
    };
  }, [alertCount]);

  // Periodic visibility check (every 1 second)
  useEffect(() => {
    visibilityCheckRef.current = setInterval(() => {
      if (!document.hasFocus() || document.hidden) {
        handleSecurityBreach('Page not in focus (periodic check)');
      }
    }, 1000);

    return () => {
      if (visibilityCheckRef.current) {
        clearInterval(visibilityCheckRef.current);
      }
    };
  }, [alertCount]);

  // Alert banner component
  const AlertBanner = () => {
    if (alertCount === 0) return null;
    
    const remaining = maxAlerts - alertCount;
    const isWarning = alertCount >= 2;
    
    return (
      <div className={`fixed top-0 left-0 right-0 z-50 p-4 text-center ${
        isWarning ? 'bg-red-500' : 'bg-yellow-500'
      } text-white animate-pulse`}>
        <div className="flex items-center justify-center gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold">
              SECURITY ALERT {alertCount}/{maxAlerts}
            </p>
            <p className="text-sm">
              {remaining === 0 
                ? 'Exam will be auto-submitted!' 
                : `${remaining} more violation${remaining > 1 ? 's' : ''} before auto-submission`
              }
            </p>
          </div>
          <span className="text-2xl">⚠️</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <AlertBanner />
      {/* Overlay if alert count is critical */}
      {alertCount >= maxAlerts && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-md text-center">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Exam Terminated</h2>
            <p className="text-gray-600 mb-4">
              Too many security violations detected. Your exam has been auto-submitted.
            </p>
            <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      )}
      {/* Children with text selection disabled */}
      <div 
        style={{ 
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onCopy={(e) => {
          e.preventDefault();
          handleSecurityBreach('Copy attempted on content');
          return false;
        }}
      >
        {children}
      </div>
    </>
  );
};

export default ExamSecurity;