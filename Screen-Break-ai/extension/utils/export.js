// extension/utils/export.js

import { StorageManager } from './storage-manager.js';
import { Achievements } from './gamification.js';

export const ExportUtils = {
  /**
   * יוצא דוח שבועי כקובץ טקסט
   */
  async exportWeeklyReport() {
    try {
      const weeklyData = await StorageManager.getWeeklyData();
      const achievements = await Achievements.getAchievementsWithStatus();
      const score = await Achievements.calculateTotalScore();
      const streak = await StorageManager.calculateStreak();
    
    // חישוב סטטיסטיקות מסכמות
    const totalScreenTime = weeklyData.reduce((sum, day) => sum + parseFloat(day.screenTime), 0);
    const totalBreaks = weeklyData.reduce((sum, day) => sum + day.breaks, 0);
    const avgScore = weeklyData.reduce((sum, day) => sum + day.score, 0) / weeklyData.length;
    
    const report = `
═══════════════════════════════════════════════════
          POSTURE GUARDIAN - WEEKLY REPORT
═══════════════════════════════════════════════════

📊 SUMMARY
──────────────────────────────────────────────────
Total Screen Time:    ${totalScreenTime.toFixed(1)} hours
Average Daily:        ${(totalScreenTime / 7).toFixed(1)} hours
Breaks Taken:         ${totalBreaks}
Average Health Score: ${avgScore.toFixed(0)}%
Current Streak:       ${streak} days 🔥

📈 DAILY BREAKDOWN
──────────────────────────────────────────────────
${weeklyData.map(day => `
${day.day} (${day.date}):
  Screen Time: ${day.screenTime}h
  Breaks:      ${day.breaks}
  Score:       ${day.score}%
  Activity:    ${day.clicks} clicks, ${day.keystrokes} keystrokes
`).join('\n')}

🏆 ACHIEVEMENTS
──────────────────────────────────────────────────
Unlocked: ${achievements.filter(a => a.unlocked).length}/${achievements.length}

${achievements.map(a => 
  `${a.unlocked ? '✅' : '❌'} ${a.icon} ${a.name} - ${a.description}`
).join('\n')}

💯 TOTAL SCORE: ${score.total} points
──────────────────────────────────────────────────
Achievement Points: ${score.achievement_points}
Break Points:       ${score.break_points}
Streak Bonus:       ${score.streak_points}
Health Bonus:       ${score.health_bonus}

═══════════════════════════════════════════════════
Generated on: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════
    `;
    
    // יצירת קובץ להורדה
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const filename = `wellness-report-${new Date().toISOString().split('T')[0]}.txt`;
    
      // Chrome extension download API
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      });
      
      console.log('✅ Report exported:', filename);
      return report;
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert('Export failed. Please try again.');
      throw error;
    }
  },

  /**
   * יוצא נתונים גולמיים כ-JSON
   */
  async exportRawData() {
    try {
      const weeklyData = await StorageManager.getWeeklyData();
      const achievements = await Achievements.getAchievementsWithStatus();
      const stats = await Achievements.getUserStats();
    
    const data = {
      export_date: new Date().toISOString(),
      weekly_data: weeklyData,
      achievements: achievements,
      current_stats: stats,
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const filename = `posture-data-${new Date().toISOString().split('T')[0]}.json`;
    
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      });
      
      console.log('✅ Raw data exported:', filename);
      return data;
    } catch (error) {
      console.error('❌ Raw data export failed:', error);
      alert('Export failed. Please try again.');
      throw error;
    }
  },

  /**
   * יוצא נתונים כ-CSV (לאקסל)
   */
  async exportCSV() {
    try {
      const weeklyData = await StorageManager.getWeeklyData();
    
    const headers = 'Date,Day,Screen Time (h),Breaks,Health Score,Clicks,Keystrokes\n';
    const rows = weeklyData.map(day => 
      `${day.date},${day.day},${day.screenTime},${day.breaks},${day.score},${day.clicks},${day.keystrokes}`
    ).join('\n');
    
    const csv = headers + rows;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const filename = `posture-data-${new Date().toISOString().split('T')[0]}.csv`;
    
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      });
      
      console.log('✅ CSV exported:', filename);
      return csv;
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      alert('Export failed. Please try again.');
      throw error;
    }
  },

  /**
   * שיתוף בוואטסאפ (קישור)
   */
  async shareToWhatsApp() {
    const streak = await StorageManager.calculateStreak();
    const stats = await Achievements.getUserStats();
    
    const message = `
🏆 My Posture Guardian Stats:
- ${streak} day streak 🔥
- Health Score: ${stats.health_score}%
- ${stats.total_breaks} breaks taken

Join me in staying healthy! 💪
    `.trim();
    
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },

  /**
   * העתקה ללוח
   */
  async copyToClipboard() {
    const report = await this.exportWeeklyReport();
    
    navigator.clipboard.writeText(report).then(() => {
      console.log('✅ Report copied to clipboard');
      alert('📋 Report copied to clipboard!');
    });
  }
};