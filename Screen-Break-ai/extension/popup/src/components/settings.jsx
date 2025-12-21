import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Download, Share2 } from 'lucide-react';
import { ExportUtils } from '../../../../utils/export.js'

function Settings() {
  const [intervals, setIntervals] = useState({
    eye: 20,
    stretch: 60
  });
  
  const [notifications, setNotifications] = useState({
    enabled: true,
    sound: true,
    priority: 'high'
  });
  
  const [theme, setTheme] = useState('dark');
  const [isSaved, setIsSaved] = useState(false);

  // Load saved settings
  useEffect(() => {
    chrome.storage.local.get(
      ['intervals', 'notifications', 'theme'],
      (result) => {
        if (result.intervals) setIntervals(result.intervals);
        if (result.notifications) setNotifications(result.notifications);
        if (result.theme) setTheme(result.theme);
      }
    );
  }, []);

  const handleSave = () => {
    chrome.storage.local.set({
      intervals,
      notifications,
      theme
    }, () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      
      // עדכן את ה-alarms with error handling
      try {
        chrome.runtime.sendMessage({
          type: 'UPDATE_INTERVALS',
          data: intervals
        });
      } catch (error) {
        console.log('Background script not available:', error);
      }
    });
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      const defaults = {
        intervals: { eye: 20, stretch: 60 },
        notifications: { enabled: true, sound: true, priority: 'high' },
        theme: 'dark'
      };
      
      setIntervals(defaults.intervals);
      setNotifications(defaults.notifications);
      setTheme(defaults.theme);
      
      chrome.storage.local.set(defaults);
    }
  };

  const handleExport = async () => {
    await ExportUtils.exportWeeklyReport();
  };

  const handleShare = async () => {
    await ExportUtils.shareToWhatsApp();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <div className="bg-slate-800 rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
          <SettingsIcon className="text-blue-400" size={28} />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>

        {/* Break Intervals */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Break Intervals</h2>
          
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">👁️ Eye Break</span>
                  <p className="text-slate-400 text-sm">20-20-20 rule reminder</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={intervals.eye}
                    onChange={(e) => {
                      const value = Math.max(5, Math.min(120, +e.target.value));
                      setIntervals({...intervals, eye: value});
                    }}
                    className="w-20 bg-slate-800 text-white px-3 py-2 rounded-lg text-center font-bold"
                  />
                  <span className="text-slate-400">min</span>
                </div>
              </label>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">💪 Stretch Break</span>
                  <p className="text-slate-400 text-sm">Full body movement</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="15"
                    max="240"
                    value={intervals.stretch}
                    onChange={(e) => {
                      const value = Math.max(15, Math.min(240, +e.target.value));
                      setIntervals({...intervals, stretch: value});
                    }}
                    className="w-20 bg-slate-800 text-white px-3 py-2 rounded-lg text-center font-bold"
                  />
                  <span className="text-slate-400">min</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Notifications</h2>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between bg-slate-900 p-4 rounded-xl cursor-pointer">
              <div>
                <span className="text-white font-medium">Enable Notifications</span>
                <p className="text-slate-400 text-sm">Show break reminders</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.enabled}
                onChange={(e) => setNotifications({...notifications, enabled: e.target.checked})}
                className="w-6 h-6 accent-blue-500"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-900 p-4 rounded-xl cursor-pointer">
              <div>
                <span className="text-white font-medium">Sound Effects</span>
                <p className="text-slate-400 text-sm">Play sound with notifications</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.sound}
                onChange={(e) => setNotifications({...notifications, sound: e.target.checked})}
                className="w-6 h-6 accent-blue-500"
              />
            </label>

            <div className="bg-slate-900 p-4 rounded-xl">
              <label className="block">
                <span className="text-white font-medium block mb-2">Priority Level</span>
                <select
                  value={notifications.priority}
                  onChange={(e) => setNotifications({...notifications, priority: e.target.value})}
                  className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (Recommended)</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Appearance</h2>
          
          <div className="bg-slate-900 p-4 rounded-xl">
            <label className="block">
              <span className="text-white font-medium block mb-2">Theme</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg"
              >
                <option value="dark">🌙 Dark (Default)</option>
                <option value="light">☀️ Light</option>
                <option value="auto">🔄 Auto (System)</option>
              </select>
            </label>
          </div>
        </div>

        {/* Export & Share */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Data & Sharing</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Download size={20} />
              Export Report
            </button>

            <button
              onClick={handleShare}
              className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Share2 size={20} />
              Share Stats
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              isSaved
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isSaved ? (
              <>
                <Save size={20} />
                Saved! ✓
              </>
            ) : (
              <>
                <Save size={20} />
                Save Changes
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <RefreshCw size={20} />
            Reset
          </button>
        </div>

        {/* Debug Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-4">🔧 Debug Tools</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={async () => {
                try {
                  const result = await chrome.runtime.sendMessage({ type: 'SAVE_STATS_NOW' });
                  alert('Stats saved! Check console.');
                } catch (error) {
                  alert('Background script not available');
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-bold text-sm transition-all"
            >
              💾 Save Now
            </button>

            <button
              onClick={async () => {
                try {
                  const history = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
                  console.log('Current History:', history);
                  alert(`History has ${Object.keys(history).length} days`);
                } catch (error) {
                  chrome.storage.local.get(['history'], (result) => {
                    const history = result.history || {};
                    alert(`History has ${Object.keys(history).length} days`);
                  });
                }
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-bold text-sm transition-all"
            >
              📈 Check History
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <p className="text-blue-300 text-sm text-center">
            💡 Changes will take effect immediately. Your data is stored locally and never leaves your device.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;