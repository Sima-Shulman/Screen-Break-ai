// extension/src/utils/storage-manager.js

export const StorageManager = {
  /**
   * שומר את הסטטיסטיקות של היום ב-history
   */
  async saveDailyStats() {
    const today = new Date().toISOString().split('T')[0]; // "2025-01-15"
    const stats = await this.getTodayStats();
    
    return new Promise((resolve) => {
      chrome.storage.local.get(['history'], (result) => {
        const history = result.history || {};
        
        history[today] = {
          ...stats,
          breaks_taken: stats.breaks || 0,
          health_score: this.calculateHealthScore(stats),
          timestamp: Date.now()
        };
        
        chrome.storage.local.set({ history }, () => {
          console.log('✅ Daily stats saved:', history[today]);
          resolve(history[today]);
        });
      });
    });
  },

  /**
   * מחשב ציון בריאות (0-100) לפי הפעילות
   */
  calculateHealthScore(stats) {
    let score = 100;
    
    // קנס על זמן מסך ארוך
    const screenHours = stats.screenTime / 3600;
    if (screenHours > 8) score -= 30;
    else if (screenHours > 6) score -= 15;
    else if (screenHours > 4) score -= 5;
    
    // בונוס על הפסקות
    const breaks = stats.breaks || 0;
    score += Math.min(breaks * 5, 20); // עד 20 נקודות
    
    // קנס על פעילות מופרזת
    if (stats.clicks > 10000) score -= 10;
    if (stats.keystrokes > 20000) score -= 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  },

  /**
   * מביא את הסטטיסטיקות של היום
   */
  async getTodayStats() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['total_activity', 'breaks_taken'], (result) => {
        resolve({
          ...result.total_activity,
          breaks: result.breaks_taken || 0
        });
      });
    });
  },

  /**
   * מביא נתונים של 7 הימים האחרונים
   */
  async getWeeklyData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['history'], (result) => {
        const history = result.history || {};
        const entries = Object.entries(history);
        
        // ממיין לפי תאריך ולוקח את 7 האחרונים
        const last7Days = entries
          .sort((a, b) => new Date(b[0]) - new Date(a[0]))
          .slice(0, 7)
          .reverse()
          .map(([date, data]) => ({
            date,
            day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            screenTime: (data.screenTime / 3600).toFixed(1), // המרה לשעות
            breaks: data.breaks_taken || 0,
            score: data.health_score || 0,
            clicks: data.clicks || 0,
            keystrokes: data.keystrokes || 0
          }));
        
        resolve(last7Days);
      });
    });
  },

  /**
   * מחשב streak - כמה ימים רצופים עם ציון מעל 70
   */
  async calculateStreak() {
    const weeklyData = await this.getWeeklyData();
    let streak = 0;
    
    // מתחיל מהיום האחרון ועובר אחורה
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      if (weeklyData[i].score >= 70) {
        streak++;
      } else {
        break; // עוצר אם היה יום עם ציון נמוך
      }
    }
    
    return streak;
  },

  /**
   * מעדכן מונה הפסקות
   */
  async incrementBreakCount() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['breaks_taken'], (result) => {
        const count = (result.breaks_taken || 0) + 1;
        chrome.storage.local.set({ breaks_taken: count }, () => {
          console.log('✅ Break count updated:', count);
          resolve(count);
        });
      });
    });
  },

  /**
   * מאפס את הנתונים של היום (בחצות)
   */
  async resetDailyStats() {
    // קודם שומר את הנתונים להיסטוריה
    await this.saveDailyStats();
    
    // אז מאפס
    chrome.storage.local.set({
      total_activity: {
        clicks: 0,
        keystrokes: 0,
        scrollDistance: 0,
        screenTime: 0
      },
      breaks_taken: 0
    });
    
    console.log('✅ Daily stats reset');
  }
};
