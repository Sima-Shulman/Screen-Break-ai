console.log("Background service worker running");

// הגדרות הפסקות
const BREAKS = {
    eye: { interval: 20 * 60 * 1000, last: 0 },      // 20 דקות
    stretch: { interval: 60 * 60 * 1000, last: 0 }   // שעה
};



// כל דקה – בדיקה אם לשלוח הפסקה
chrome.alarms.create("checkBreaks", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(() => {
    chrome.storage.local.get(["total_activity"], (result) => {
        const now = Date.now();
        const stats = result.total_activity || { startTime: now };

        console.log("Checking for breaks at", new Date(now).toLocaleTimeString());


        // Eye Break
        if (now - (BREAKS.eye.last || stats.startTime) > BREAKS.eye.interval) {
            sendNotification("Eye Break", "עצום עיניים 20 שניות והסתכל למרחק 20 רגל");
            BREAKS.eye.last = now;
            console.log("Eye break notification sent");
        }

        // Stretch Break
        if (now - (BREAKS.stretch.last || stats.startTime) > BREAKS.stretch.interval) {
            sendNotification("Stretch Break", "קום מהכיסא ועשה תרגילי מתיחה קלים");
            BREAKS.stretch.last = now;
            console.log("Stretch break notification sent");
        }
    });
});

function sendNotification(title, message) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "/icon.png",  // חייב להיות קובץ PNG תקין בתיקיית root
        title: title,
        message: message,
        priority: 2
    });
}
