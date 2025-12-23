// extension/popup/App.jsx
import React, { useState, useEffect } from "react";
import EnhancedDashboard from "./components/EnhancedDashboard.jsx";
import ExerciseModal from "./components/ExerciseModal.jsx";
import Settings from "./components/settings.jsx";
// import BreakButton from "./components/BreakButton.jsx";
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'settings'
  const [showExercise, setShowExercise] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [isInTab, setIsInTab] = useState(false);

  // Check for pending exercise on component mount
  useEffect(() => {
    // Check if running in tab (not popup)
    setIsInTab(window.location.protocol === 'chrome-extension:' && !chrome.extension.getViews({type: 'popup'}).includes(window));
    
    // Load and apply saved theme
    chrome.storage.local.get(['theme'], (result) => {
      const savedTheme = result.theme || 'dark';
      applyTheme(savedTheme);
    });
    
    chrome.storage.local.get(['pendingExercise'], (result) => {
      if (result.pendingExercise) {
        // Check if exercise is recent (within 5 minutes)
        const isRecent = Date.now() - result.pendingExercise.timestamp < 5 * 60 * 1000;
        if (isRecent) {
          setCurrentExercise(result.pendingExercise);
          setShowExercise(true);
          // Clear the pending exercise
          chrome.storage.local.remove(['pendingExercise']);
        }
      }
    });
  }, []);

  const applyTheme = (selectedTheme) => {
    let actualTheme = selectedTheme;
    
    if (selectedTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      actualTheme = prefersDark ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', actualTheme);
  };
  const handleBreakComplete = (status) => {
    setShowExercise(false);

    // Only increment break count and trigger achievements if exercise was actually completed
    if (status === 'completed') {
      // Send message to background script to handle the completion
      chrome.runtime.sendMessage({ type: 'EXERCISE_COMPLETED' }, (response) => {
        console.log('Exercise completion processed:', response);
      });
    }

    // Store the result for analytics but don't increment counters for skipped exercises
    chrome.storage.local.set({
      exerciseResult: {
        status,
        timestamp: Date.now()
      }
    });
  };


  return (
    <div className="app-container">
      {/* Navigation */}
      <div className="flex gap-2 p-4 bg-slate-900">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`px-4 py-2 rounded-lg ${currentView === 'dashboard' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setCurrentView('settings')}
          className={`px-4 py-2 rounded-lg ${currentView === 'settings' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}
        >
          ⚙️ Settings
        </button>
        {!isInTab && (
          <button
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('popup/dist/index.html') })}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700"
          >
            🔗 Open in Tab
          </button>
        )}
      </div>

      {/* Views */}
      {currentView === 'dashboard' && <EnhancedDashboard />}
      {currentView === 'settings' && <Settings />}

      {/* Exercise Modal */}
      {showExercise && currentExercise && (
        <ExerciseModal
          exercise={currentExercise}
          //   onClose={() => setShowExercise(false)}
          //   onComplete={handleBreakComplete}
          // 
          onComplete={() => handleBreakComplete('completed')}
          onSkip={() => handleBreakComplete('skipped')}
          onClose={() => handleBreakComplete('closed')}

        />
      )}
    </div>
  );
}

export default App;