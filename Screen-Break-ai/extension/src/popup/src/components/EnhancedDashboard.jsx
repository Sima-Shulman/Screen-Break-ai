import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Eye, TrendingUp, Award, Clock, Target } from 'lucide-react';

// const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const EnhancedDashboard = () => {
  const [stats, setStats] = useState({
    clicks: 0,
    keystrokes: 0,
    scrollDistance: 0,
    screenTime: 0
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [nextBreak, setNextBreak] = useState(0);

  useEffect(() => {
    const updateDashboardData = () => {
      chrome.storage.local.get(null, (data) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }

        // Stats - add real-time screen time calculation
        if (data.total_activity) {
          setStats(data.total_activity);
        }

        // Weekly Data & Score & Streak
        if (data.history) {
          const historyEntries = Object.entries(data.history);
          const last7Days = historyEntries
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .slice(0, 7)
            .reverse()
            .map(([date, dailyData]) => ({
              date,
              day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
              screenTime: (dailyData.screenTime / 3600).toFixed(1),
              breaks: dailyData.breaks_taken || 0,
              score: dailyData.health_score || 0,
            }));
          setWeeklyData(last7Days);

          if (last7Days.length > 0) {
            setScore(last7Days[last7Days.length - 1].score);
          }

          let currentStreak = 0;
          for (let i = historyEntries.length - 1; i >= 0; i--) {
            if (historyEntries[i][1].health_score >= 70) {
              currentStreak++;
            } else {
              break;
            }
          }
          setStreak(currentStreak);
        }

        // Achievements
        if (data.achievements) {
          // This part assumes gamification.js has run and stored achievements
          // We need to get the full achievement details. For simplicity, we'll filter the list from gamification logic.
          // This is a bit of a hack, in a real app you might store the whole achievement object.
          const allAchievements = [
            { id: 'first_break', name: 'First Steps', icon: '🎯' },
            { id: 'break_master', name: 'Break Master', icon: '💪' },
            { id: 'week_streak', name: '7-Day Warrior', icon: '🔥' },
            { id: 'eye_guardian', name: 'Eye Guardian', icon: '👁️' },
            { id: 'posture_master', name: 'Posture Master', icon: '⭐' },
            { id: 'wellness_warrior', name: 'Wellness Warrior', icon: '🏆' },
            { id: 'zen_master', name: 'Zen Master', icon: '🧘' },
            { id: 'productivity_pro', name: 'Productivity Pro', icon: '🚀' }
          ];

          const userAchievements = allAchievements.map(ach => ({
            ...ach,
            unlocked: data.achievements.includes(ach.id)
          }));
          setAchievements(userAchievements);
        }
        
        // Next break countdown - use actual user intervals
        if(data.breaksLast && data.intervals) {
            const eyeBreakInterval = data.intervals.eye * 60 * 1000;
            const stretchBreakInterval = data.intervals.stretch * 60 * 1000;
            const now = Date.now();
            
            const nextEyeBreak = (data.breaksLast.eye + eyeBreakInterval - now) / 60000;
            const nextStretchBreak = (data.breaksLast.stretch + stretchBreakInterval - now) / 60000;

            setNextBreak(Math.floor(Math.max(0, Math.min(nextEyeBreak, nextStretchBreak))));
        }

      });
    };

    updateDashboardData(); // Initial fetch

    const listener = (changes, area) => {
      if (area === 'local') {
        updateDashboardData();
      }
    };

    chrome.storage.onChanged.addListener(listener);

    const countdownTimer = setInterval(() => {
        setNextBreak(prev => Math.max(0, prev - 1));
    }, 60000);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
      clearInterval(countdownTimer);
    };
  }, []);



  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  //const activityData = [
  //  { name: 'Clicks', value: stats.clicks },
    //{ name: 'Keystrokes', value: stats.keystrokes },
    //{ name: 'Scrolls', value: stats.scrollDistance },
  //];

  return (
    <div className="w-full p-4 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen overflow-y-auto">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">💪 Posture Guardian AI</h1>
        <p className="text-slate-400 text-sm">Your intelligent wellness companion</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-white" size={24} />
            <span className="text-blue-100 text-sm font-medium">TODAY</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">{formatTime(stats.screenTime)}</div>
          <div className="text-blue-100 text-xs">Screen Time</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <Target className="text-white" size={20} />
            <span className="text-green-100 text-xs font-medium">SCORE</span>
          </div>
          <div className="text-xl font-bold text-white mb-1" style={{ color: getScoreColor(score) }}>{score}%</div>
          <div className="text-green-100 text-xs">Health Score</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <Activity className="text-white" size={20} />
            <span className="text-orange-100 text-xs font-medium">NEXT</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">{nextBreak}m</div>
          <div className="text-orange-100 text-xs">Until Break</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <Award className="text-white" size={20} />
            <span className="text-purple-100 text-xs font-medium">STREAK</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">{streak} 🔥</div>
          <div className="text-purple-100 text-xs">Days Active</div>
        </div>
      </div>

      {/* Compact Chart */}
      <div className="bg-slate-800 rounded-xl p-4 shadow-xl mb-4">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp size={16} />
          Weekly Health Score
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Achievements */}
      <div className="bg-slate-800 rounded-xl p-4 shadow-xl mb-4">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Award size={16} />
          Achievements
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {achievements.slice(0, 8).map((achievement, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg text-center transition-all ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg'
                  : 'bg-slate-700 opacity-50'
              }`}
            >
              <div className="text-2xl mb-1">{achievement.icon}</div>
              <div className="text-white font-medium text-xs">{achievement.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Stats Footer */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">{stats.clicks}</div>
          <div className="text-slate-400 text-xs">Clicks</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400">{stats.keystrokes}</div>
          <div className="text-slate-400 text-xs">Keys</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-400">{Math.floor(stats.scrollDistance)}px</div>
          <div className="text-slate-400 text-xs">Scroll</div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;