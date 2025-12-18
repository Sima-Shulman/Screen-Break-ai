// extension/src/utils/gamification.js

export const Achievements = {
  list: [
    {
      id: 'first_break',
      name: 'First Steps',
      icon: '🎯',
      description: 'Take your first break',
      condition: (stats) => stats.total_breaks >= 1
    },
    {
      id: 'break_master',
      name: 'Break Master',
      icon: '💪',
      description: 'Take 10 breaks in one day',
      condition: (stats) => stats.total_breaks >= 10
    },
    {
      id: 'week_streak',
      name: '7-Day Warrior',
      icon: '🔥',
      description: 'Maintain 7 consecutive days with good health score',
      condition: (stats) => stats.streak >= 7
    },
    {
      id: 'eye_guardian',
      name: 'Eye Guardian',
      icon: '👁️',
      description: 'Complete 20 eye breaks',
      condition: (stats) => stats.eye_breaks >= 20
    },
    {
      id: 'posture_master',
      name: 'Posture Master',
      icon: '⭐',
      description: 'Achieve health score of 90+',
      condition: (stats) => stats.health_score >= 90 && stats.total_breaks >= 20 && stats.streak >= 7
    },
    {
      id: 'wellness_warrior',
      name: 'Wellness Warrior',
      icon: '🏆',
      description: 'Complete 50 total breaks',
      condition: (stats) => stats.total_breaks >= 150
    },
    {
      id: 'zen_master',
      name: 'Zen Master',
      icon: '🧘',
      description: 'Maintain 14-day streak',
      condition: (stats) => stats.streak >= 14
    },
    {
      id: 'productivity_pro',
      name: 'Productivity Pro',
      icon: '🚀',
      description: 'Screen time under 4 hours for 7 days',
      condition: (stats) => stats.avg_screen_time < 4 * 3600 && stats.streak >= 7
    }
  ],

  /**
   * בודק אילו achievements בן זכאי
   */
  async checkUnlocks() {
    const stats = await this.getUserStats();
    const unlockedIds = this.list
      .filter(achievement => achievement.condition(stats))
      .map(achievement => achievement.id);
    
    return new Promise((resolve) => {
      chrome.storage.local.get(['achievements'], (result) => {
        const previouslyUnlocked = result.achievements || [];
        
        // מוצא achievements חדשים
        const newAchievements = unlockedIds.filter(
          id => !previouslyUnlocked.includes(id)
        );
        
        // שולח התראה על כל achievement חדש
        newAchievements.forEach(id => {
          const achievement = this.list.find(a => a.id === id);
          this.showAchievementNotification(achievement);
        });
        
        // שומר
        chrome.storage.local.set({ achievements: unlockedIds }, () => {
          resolve(newAchievements);
        });
      });
    });
  },

  /**
   * מציג התראה על achievement חדש
   */
  showAchievementNotification(achievement) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icon.png',
      title: '🎉 Achievement Unlocked!',
      message: `${achievement.icon} ${achievement.name}\n${achievement.description}`,
      priority: 2,
      requireInteraction: true
    });
    
    console.log('🎉 New achievement:', achievement.name);
  },

  /**
   * מביא את כל הסטטיסטיקות הנדרשות לבדיקת achievements
   */
  async getUserStats() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        ['total_activity', 'breaks_taken', 'eye_breaks', 'stretch_breaks', 'history'],
        (result) => {
          const activity = result.total_activity || {};
          const history = result.history || {};
          
          // חישוב streak
          let streak = 0;
          const dates = Object.keys(history).sort().reverse();
          for (const date of dates) {
            if (history[date].health_score >= 70) {
              streak++;
            } else {
              break;
            }
          }
          
          // חישוב ממוצע זמן מסך שבועי
          const last7Days = dates.slice(0, 7);
          const totalScreenTime = last7Days.reduce(
            (sum, date) => sum + (history[date].screenTime || 0),
            0
          );
          const avgScreenTime = last7Days.length > 0
            ? totalScreenTime / last7Days.length
            : 0;
          
          resolve({
            total_breaks: result.breaks_taken || 0,
            eye_breaks: result.eye_breaks || 0,
            stretch_breaks: result.stretch_breaks || 0,
            health_score: history[dates[0]]?.health_score || 0,
            streak,
            avg_screen_time: avgScreenTime,
            clicks: activity.clicks || 0,
            keystrokes: activity.keystrokes || 0
          });
        }
      );
    });
  },

  /**
   * מחזיר רשימה של achievements עם סטטוס (unlocked/locked)
   */
  async getAchievementsWithStatus() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['achievements'], (result) => {
        const unlockedIds = result.achievements || [];
        
        const withStatus = this.list.map(achievement => ({
          ...achievement,
          unlocked: unlockedIds.includes(achievement.id)
        }));
        
        resolve(withStatus);
      });
    });
  },

  /**
   * מחשב ניקוד כולל למשתמש
   */
  async calculateTotalScore() {
    const achievements = await this.getAchievementsWithStatus();
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const stats = await this.getUserStats();
    
    return {
      achievement_points: unlockedCount * 100,
      break_points: stats.total_breaks * 10,
      streak_points: stats.streak * 50,
      health_bonus: stats.health_score,
      total: (unlockedCount * 100) + 
             (stats.total_breaks * 10) + 
             (stats.streak * 50) + 
             stats.health_score
    };
  }
};
