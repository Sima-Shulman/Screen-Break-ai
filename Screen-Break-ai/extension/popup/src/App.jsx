// extension/src/popup/App.jsx
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

  // Check for pending exercise on component mount
  useEffect(() => {
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

  const handleBreakComplete = () => {
    setShowExercise(false);
    // עדכן מונה הפסקות
    chrome.storage.local.get(['breaks_taken'], (result) => {
      const count = (result.breaks_taken || 0) + 1;
      chrome.storage.local.set({ breaks_taken: count });
    });
  };

  return (
    <div className="app-container">
      {/* Navigation */}
      <div className="flex gap-2 p-4 bg-slate-900">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`px-4 py-2 rounded-lg ${
            currentView === 'dashboard' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setCurrentView('settings')}
          className={`px-4 py-2 rounded-lg ${
            currentView === 'settings' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Views */}
      {currentView === 'dashboard' && <EnhancedDashboard />}
      {currentView === 'settings' && <Settings />}

      {/* Exercise Modal */}
      {showExercise && currentExercise && (
        <ExerciseModal
          exercise={currentExercise}
          onClose={() => setShowExercise(false)}
          onComplete={handleBreakComplete}
        />
      )}
    </div>
  );
}

export default App;