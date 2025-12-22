import React, { useState, useEffect } from 'react';
import { X, Play, Pause, CheckCircle } from 'lucide-react';

function ExerciseModal({ exercise, onClose, onComplete }) {
  if (!exercise) return null;

  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exercise?.duration || 30);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isPaused || isCompleted) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleComplete();
          return 0;
        }
        
        // Update step every X seconds
        if (exercise.steps && exercise.steps.length > 0) {
          const stepDuration = exercise.duration / exercise.steps.length;
          const newStep = Math.floor((exercise.duration - prev + 1) / stepDuration);
          if (newStep !== currentStep && newStep < exercise.steps.length) {
            setCurrentStep(newStep);
          }
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exercise, isPaused, isCompleted, currentStep]);

  const handleComplete = () => {
    setIsCompleted(true);
    if (onComplete) {
      onComplete?.();
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // const handleSkip = () => {
  //   handleComplete();
  // };
const handleSkip = () => {
  if (onSkip) onSkip();
  onClose();
};

  if (!exercise) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            {exercise.icon || '💪'} {exercise.name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Timer */}
        <div className="p-8 text-center">
          <div className="relative w-48 h-48 mx-auto mb-6">
            {/* Progress Circle */}
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="#1e293b"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="#3b82f6"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - timeLeft / exercise.duration)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            
            {/* Timer Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <div className="text-6xl font-bold text-white mb-1">
                  {timeLeft}
                </div>
                <div className="text-slate-400 text-sm">seconds</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-center mb-6">
            <button
              onClick={togglePause}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
            >
              {isPaused ? [
                <Play key="play" size={20} />,
                ' Resume'
              ] : [
                <Pause key="pause" size={20} />,
                ' Pause'
              ]}
            </button>
            
            <button
              onClick={handleSkip}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold transition-all"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="p-6 bg-slate-900/50 rounded-b-3xl">
          <h3 className="text-lg font-bold text-white mb-4">Instructions:</h3>
          <div className="space-y-3">
            {exercise.steps && exercise.steps.length > 0 ? exercise.steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl transition-all ${
                  idx === currentStep
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : idx < currentStep
                    ? 'bg-green-500/20 text-green-300 line-through'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="font-bold text-lg">
                    {idx < currentStep ? '✓' : idx + 1}.
                  </span>
                  <span className="flex-1">{step}</span>
                </div>
              </div>
            )) : (
              <div className="p-4 rounded-xl bg-slate-800 text-slate-400">
                <p>{exercise.description || 'Follow the exercise instructions'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Completion Message */}
        {isCompleted && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center backdrop-blur-xl">
            <div className="text-center p-8">
              <CheckCircle size={80} className="text-white mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-2">
                Great Job! 🎉
              </h3>
              <p className="text-green-100 mb-6">
                You've completed the exercise!
              </p>
              <button
                onClick={onClose}
                className="bg-white text-green-600 px-8 py-3 rounded-xl font-bold hover:bg-green-50 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExerciseModal;