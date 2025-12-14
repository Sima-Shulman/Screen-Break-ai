console.log("Background service worker running");


chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        total_activity: {
            clicks: 0,
            keystrokes: 0,
            scrollDistance: 0,
            screenTime: 0
        },
        breaksLast: {                
            eye: Date.now(),          
            stretch: Date.now()      
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "GET_STATS") {
        chrome.storage.local.get(["total_activity"], (result) => {
            sendResponse(result.total_activity || {
                clicks: 0,
                keystrokes: 0,
                scrollDistance: 0,
                screenTime: 0
            });
        });
        return true;
    }

    if (message.type === "UPDATE_STATS") {
        chrome.storage.local.get(["total_activity"], (result) => {
            const stats = result.total_activity || {
                clicks: 0,
                keystrokes: 0,
                scrollDistance: 0,
                screenTime: 0
            };

            stats.clicks += message.data.clicks;
            stats.keystrokes += message.data.keystrokes;
            stats.scrollDistance += message.data.scrollDistance;
            stats.screenTime += message.data.screenTime; // ✏️ שונה (לא +10 קבוע)

            chrome.storage.local.set({ total_activity: stats });
        });
    }

    if (message.type === "TRIGGER_BREAK") {
        sendNotification(
            "Time for a break!",
            "You've earned it! Step away from the screen."
        );
    }
});

const BREAKS = {
    eye: { interval: 20 * 60 * 1000 },
    stretch: { interval: 60 * 60 * 1000 }
};


chrome.alarms.create("checkBreaks", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(() => {
    const now = Date.now();

    chrome.storage.local.get(["breaksLast"], (result) => {
        const breaksLast = result.breaksLast || {   // 🆕 נוסף
            eye: 0,
            stretch: 0
        };

        console.log("Checking for breaks at", new Date(now).toLocaleTimeString());

        if (now - breaksLast.eye >= BREAKS.eye.interval) {
            sendNotification(
                "Eye Break",
                "עצום עיניים 20 שניות והסתכל למרחק"
            );
            breaksLast.eye = now;                   // ✏️ שונה
        }

        if (now - breaksLast.stretch >= BREAKS.stretch.interval) {
            sendNotification(
                "Stretch Break",
                "קום מהכיסא ועשה מתיחות קלות"
            );
            breaksLast.stretch = now;               // ✏️ שונה
        }

        chrome.storage.local.set({ breaksLast });   // 🆕 נוסף – קריטי
    });
});

function sendNotification(title, message) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: title,
        message: message,
        priority: 2
    });
}