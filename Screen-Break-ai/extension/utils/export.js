// extension/utils/export.js

import { StorageManager } from './storage-manager.js';
import { Achievements } from './gamification.js';

export const ExportManager = {
  /**
   * Get all data needed for exports
   */
  async getAllData() {
    const weeklyData = await StorageManager.getWeeklyData();
    const achievements = await Achievements.getAchievementsWithStatus();
    const score = await Achievements.calculateTotalScore();
    const streak = await StorageManager.calculateStreak();
    const stats = await Achievements.getUserStats();
    
    return {
      weeklyData,
      achievements,
      score,
      streak,
      stats
    };
  },

  /**
   * Export weekly report
   */
  async exportWeeklyReport() {
    return await this.exportAsTXT();
  },

  /**
   * Export as TXT format
   */
  async exportAsTXT() {
    try {
      const data = await this.getAllData();
      const { weeklyData, achievements, score, streak } = data;
      
      // Calculate summary statistics
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
  Activity:    ${day.clicks} clicks, ${day.keystrokes} keystrokes, ${day.scrollDistance}m scroll
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
      
      // Create file for download
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const filename = `wellness-report-${new Date().toISOString().split('T')[0]}.txt`;
      
      // Chrome extension download API
      if (chrome && chrome.downloads) {
        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: true
        });
      }
      
      console.log('✅ Report exported:', filename);
      return { success: true, format: 'TXT', data: report };
    } catch (error) {
      console.error('❌ Export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export as JSON format
   */
  async exportAsJSON() {
    try {
      const data = await this.getAllData();
      
      const exportData = {
        export_date: new Date().toISOString(),
        weekly_data: data.weeklyData,
        achievements: data.achievements,
        current_stats: data.stats,
        version: '1.0.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const filename = `posture-data-${new Date().toISOString().split('T')[0]}.json`;
      
      if (chrome && chrome.downloads) {
        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: true
        });
      }
      
      console.log('✅ Raw data exported:', filename);
      return { success: true, format: 'JSON', data: exportData };
    } catch (error) {
      console.error('❌ Raw data export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export as CSV format
   */
  async exportAsCSV() {
    try {
      const data = await this.getAllData();
      const { weeklyData } = data;
      
      const headers = 'Date,Day,Screen Time (h),Breaks,Health Score,Clicks,Keystrokes,Scroll Distance (m)\n';
      const rows = weeklyData.map(day => 
        `${day.date},${day.day},${day.screenTime},${day.breaks},${day.score},${day.clicks},${day.keystrokes},${day.scrollDistance}`
      ).join('\n');
      
      const csv = headers + rows;
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const filename = `posture-data-${new Date().toISOString().split('T')[0]}.csv`;
      
      if (chrome && chrome.downloads) {
        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: true
        });
      }
      
      console.log('✅ CSV exported:', filename);
      return { success: true, format: 'CSV', data: csv };
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Share to WhatsApp
   */
  async shareToWhatsApp() {
    const data = await this.getAllData();
    const { streak, stats } = data;
    
    const message = `
🏆 My Posture Guardian Stats:
- ${streak} day streak 🔥
- Health Score: ${stats.health_score}%
- ${stats.total_breaks} breaks taken

Join me in staying healthy! 💪
    `.trim();
    
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  },

  /**
   * Copy to clipboard
   */
  async copyToClipboard() {
    const result = await this.exportAsTXT();
    
    if (result.success && navigator.clipboard) {
      await navigator.clipboard.writeText(result.data);
      console.log('✅ Report copied to clipboard');
      if (typeof alert !== 'undefined') {
        alert('📋 Report copied to clipboard!');
      }
    }
  }
};

// Export alias for backward compatibility
export const ExportUtils = ExportManager;