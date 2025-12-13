// background/break-scheduler.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    activityStats: {
      clicks: 0,
      scrolls: 0,
      keypresses: 0,
      mouseMoves: 0,
      sessionStart: Date.now()
    }
  });

  // בדיקה עתידית כל דקה (לשלב הבא)
  chrome.alarms.create("activityCheck", {
    periodInMinutes: 1
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "activityCheck") {
    // בשלב 1 – אין לוגיקה
    // שלב 2: כאן תיכנס בדיקת הפסקות
  }
});
