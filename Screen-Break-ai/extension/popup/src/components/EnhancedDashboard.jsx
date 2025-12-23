import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Activity, Eye, TrendingUp, Award, Clock, Target, MousePointer, Keyboard, Monitor, BarChart3 } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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

  const activityData = [
    { name: 'Clicks', value: stats.clicks, color: '#3b82f6' },
    { name: 'Keystrokes', value: stats.keystrokes, color: '#10b981' },
    { name: 'Scroll (m)', value: Math.round(stats.scrollDistance / 1000), color: '#8b5cf6' }
  ];

  const formatScrollMeters = (pixels) => {
    return `${(pixels / 3779).toFixed(1)}m`;
  };

  const screenTimeAnalysis = weeklyData.map(day => ({
    ...day,
    screenTimeHours: parseFloat(day.screenTime),
    efficiency: day.breaks > 0 ? Math.min(100, (day.breaks * 20)) : 0
  }));

  const getScreenTimeStatus = (hours) => {
    if (hours < 4) return { status: 'Excellent', color: '#10b981' };
    if (hours < 6) return { status: 'Good', color: '#3b82f6' };
    if (hours < 8) return { status: 'Moderate', color: '#f59e0b' };
    return { status: 'High', color: '#ef4444' };
  };

  const todayScreenTime = stats.screenTime / 3600;
  const screenTimeStatus = getScreenTimeStatus(todayScreenTime);

  return (
    <div className="w-full p-4 min-h-screen overflow-y-auto" style={{ background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' }}>
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>💪 Posture Guardian AI</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your intelligent wellness companion</p>
      </div>

      {/* Enhanced Hero Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-white" size={24} />
            <span className="text-blue-100 text-sm font-medium">TODAY</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">{formatTime(stats.screenTime)}</div>
          <div className="text-blue-100 text-xs flex items-center gap-1">
            Screen Time
            <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: screenTimeStatus.color, color: '#fff' }}>
              {screenTimeStatus.status}
            </span>
          </div>
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

      {/* Activity Breakdown Pie Chart */}
      <div className="rounded-xl p-4 shadow-xl mb-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <MousePointer size={16} />
          Today's Activity Breakdown
        </h3>
        <div className="flex items-center">
          <ResponsiveContainer width="60%" height={120}>
            <PieChart>
              <Pie
                data={activityData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={50}
                dataKey="value"
              >
                {activityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {activityData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.name}: {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Screen Time Trend */}
      <div className="rounded-xl p-4 shadow-xl mb-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Monitor size={16} />
          Weekly Screen Time Trend
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={screenTimeAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'none', borderRadius: '8px', color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-primary)' }}
            />
            <Area 
              type="monotone" 
              dataKey="screenTimeHours" 
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.3}
              name="Screen Time (hrs)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Health Score vs Breaks Correlation */}
      <div className="rounded-xl p-4 shadow-xl mb-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <BarChart3 size={16} />
          Health Score & Break Correlation
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weeklyData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'none', borderRadius: '8px', color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-primary)' }}
            />
            <Bar dataKey="score" fill="#10b981" radius={[2, 2, 0, 0]} name="Health Score" />
            <Bar dataKey="breaks" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Breaks Taken" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Achievements */}
      <div className="rounded-xl p-4 shadow-xl mb-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Award size={16} />
          Achievements
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {achievements && achievements.length > 0 ? achievements.slice(0, 8).map((achievement, idx) => (
            <div
              key={achievement.id || idx}
              className={`p-2 rounded-lg text-center transition-all ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg'
                  : 'opacity-50'
              }`}
              style={{
                backgroundColor: achievement.unlocked ? undefined : 'var(--bg-secondary)'
              }}
            >
              <div className="text-2xl mb-1">{achievement.icon}</div>
              <div className="font-medium text-xs" style={{ color: achievement.unlocked ? '#fff' : 'var(--text-primary)' }}>{achievement.name}</div>
            </div>
          )) : (
            <div className="col-span-4 text-center py-4" style={{ color: 'var(--text-secondary)' }}>
              No achievements yet
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Live Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--bg-card)' }}>
          <MousePointer className="mx-auto mb-2 text-blue-400" size={20} />
          <div className="text-lg font-bold text-blue-400">{stats.clicks.toLocaleString()}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Clicks Today</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--bg-card)' }}>
          <Keyboard className="mx-auto mb-2 text-green-400" size={20} />
          <div className="text-lg font-bold text-green-400">{stats.keystrokes.toLocaleString()}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Keystrokes</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--bg-card)' }}>
          <Activity className="mx-auto mb-2 text-purple-400" size={20} />
          <div className="text-lg font-bold text-purple-400">{formatScrollMeters(stats.scrollDistance)}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Scroll Distance</div>
        </div>
      </div>

      {/* Productivity Insights */}
      <div className="rounded-xl p-4 shadow-xl mb-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Eye size={16} />
          Productivity Insights
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: stats.clicks > 0 ? '#3b82f6' : 'var(--text-secondary)' }}>
              {stats.clicks > 0 ? Math.round(stats.keystrokes / stats.clicks * 10) / 10 : 0}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Keys per Click</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {stats.keystrokes / stats.clicks > 5 ? 'Typing Heavy' : 'Click Heavy'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: todayScreenTime > 0 ? '#10b981' : 'var(--text-secondary)' }}>
              {todayScreenTime > 0 ? Math.round((stats.clicks + stats.keystrokes) / todayScreenTime) : 0}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Actions/Hour</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Activity Rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;