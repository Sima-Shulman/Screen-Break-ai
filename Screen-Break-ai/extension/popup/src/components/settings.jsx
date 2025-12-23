import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Download, Share2 } from 'lucide-react';
import { ExportUtils } from '../../../utils/export.js';

function Settings() {
  const [interval, setInterval] = useState(20);
  
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
      ['interval', 'notifications', 'theme'],
      (result) => {
        if (result.interval) setInterval(result.interval);
        if (result.notifications) setNotifications(result.notifications);
        if (result.theme) {
          setTheme(result.theme);
          applyTheme(result.theme);
        }
      }
    );
  }, []); // Remove theme dependency

  // Separate effect for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, [theme]);

  const handleSave = () => {
    chrome.storage.local.set({
      interval,
      notifications,
      theme
    }, () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      
      // Update background script
      try {
        chrome.runtime.sendMessage({
          type: 'UPDATE_INTERVALS',
          data: interval
        });
        
        // Apply theme immediately
        applyTheme(theme);
        
        // Update notification permissions if needed
        if (notifications.enabled) {
          chrome.notifications.getPermissionLevel((level) => {
            if (level !== 'granted') {
              chrome.notifications.requestPermission();
            }
          });
        }
      } catch (error) {
        console.log('Background script not available:', error);
      }
    });
  };

  const applyTheme = (selectedTheme) => {
    let actualTheme = selectedTheme;
    
    if (selectedTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      actualTheme = prefersDark ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', actualTheme);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      const defaults = {
        interval: 20,
        notifications: { enabled: true, sound: true, priority: 'high' },
        theme: 'dark'
      };
      
      setInterval(defaults.interval);
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
    <div className="w-full max-w-2xl mx-auto p-6" style={{ background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)', minHeight: '100vh' }}>
      <div className="rounded-2xl shadow-xl p-6" style={{ backgroundColor: 'var(--bg-card)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <SettingsIcon className="text-blue-400" size={28} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        </div>

        {/* Break Interval */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Break Interval</h2>
          
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>⏰ Break Reminder</span>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>AI will decide between eye breaks and stretches</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={interval}
                  onChange={(e) => {
                    const value = Math.max(5, Math.min(120, +e.target.value));
                    setInterval(value);
                  }}
                  className="w-20 px-3 py-2 rounded-lg text-center font-bold"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>min</span>
              </div>
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Notifications</h2>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Enable Notifications</span>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Show break reminders</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.enabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setNotifications({...notifications, enabled});
                  
                  if (enabled) {
                    chrome.notifications.getPermissionLevel((level) => {
                      if (level !== 'granted') {
                        chrome.notifications.requestPermission((permission) => {
                          if (permission !== 'granted') {
                            setNotifications({...notifications, enabled: false});
                          }
                        });
                      }
                    });
                  }
                }}
                className="w-6 h-6 accent-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Sound Effects</span>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Play sound with notifications</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.sound}
                onChange={(e) => {
                  setNotifications({...notifications, sound: e.target.checked});
                  
                  // Test sound when enabled
                  if (e.target.checked) {
                    try {
                      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
                      audio.volume = 0.3;
                      audio.play().catch(() => {});
                    } catch (error) {
                      console.log('Sound test failed:', error);
                    }
                  }
                }}
                className="w-6 h-6 accent-blue-500"
              />
            </label>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <label className="block">
                <span className="font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Priority Level</span>
                <select
                  value={notifications.priority}
                  onChange={(e) => setNotifications({...notifications, priority: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
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
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
          
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <label className="block">
              <span className="font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Theme</span>
              <select
                value={theme}
                onChange={(e) => {
                  const newTheme = e.target.value;
                  setTheme(newTheme);
                  applyTheme(newTheme);
                  
                  // Auto-save theme change
                  chrome.storage.local.set({ theme: newTheme });
                }}
                className="w-full px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
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
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Data & Sharing</h2>
          
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
            <Save size={20} />
            {isSaved ? 'Saved! ✓' : 'Save Changes'}
          </button>

          <button
            onClick={handleReset}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <RefreshCw size={20} />
            Reset
          </button>
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