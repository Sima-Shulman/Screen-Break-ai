// // background/break-scheduler.js

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.storage.local.set({
//     activityStats: {
//       clicks: 0,
//       scrolls: 0,
//       keypresses: 0,
//       mouseMoves: 0,
//       sessionStart: Date.now()
//     }
//   });

//   // בדיקה עתידית כל דקה (לשלב הבא)
//   chrome.alarms.create("activityCheck", {
//     periodInMinutes: 1
//   });
// });

// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === "activityCheck") {
//     // בשלב 1 – אין לוגיקה
//     // שלב 2: כאן תיכנס בדיקת הפסקות
//   }
// });
// אתחול נתונים בזיכרון
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ total_activity: { clicks: 0, keystrokes: 0, startTime: Date.now() } });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "UPDATE_STATS") {
        chrome.storage.local.get(['total_activity'], (result) => {
            let stats = result.total_activity || { clicks: 0, keystrokes: 0 };
            
            // עדכון הנתונים המצטברים
            stats.clicks += message.data.clicks;
            stats.keystrokes += message.data.keystrokes;
            
            chrome.storage.local.set({ total_activity: stats }, () => {
                console.log("Stats updated in storage:", stats);
            });
        });
    }
});