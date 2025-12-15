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
    eye: { interval: 2 * 60 * 1000 },
    stretch: { interval: 6 * 60 * 1000 }
};


chrome.alarms.create("checkBreaks", { periodInMinutes: 1 });

// chrome.alarms.onAlarm.addListener(() => {
//     const now = Date.now();

//     chrome.storage.local.get(["breaksLast"], (result) => {
//         const breaksLast = result.breaksLast || {   // 🆕 נוסף
//             eye: 0,
//             stretch: 0
//         };

//         console.log("Checking for breaks at", new Date(now).toLocaleTimeString());

//         if (now - breaksLast.eye >= BREAKS.eye.interval) {
//             sendNotification(
//                 "Eye Break",
//                 "עצום עיניים 20 שניות והסתכל למרחק"
//             );
//             breaksLast.eye = now;                   // ✏️ שונה
//         }

//         if (now - breaksLast.stretch >= BREAKS.stretch.interval) {
//             sendNotification(
//                 "Stretch Break",
//                 "קום מהכיסא ועשה מתיחות קלות"
//             );
//             breaksLast.stretch = now;               // ✏️ שונה
//         }

//         chrome.storage.local.set({ breaksLast });   // 🆕 נוסף – קריטי
//     });
// });


chrome.alarms.onAlarm.addListener(() => {
    const now = Date.now();

    chrome.storage.local.get(
        ["breaksLast", "total_activity"],
        async (result) => {
            const breaksLast = result.breaksLast;
            const stats = result.total_activity;

            if (!breaksLast || !stats) return;

            let breakType = "";

            if (now - breaksLast.eye >= BREAKS.eye.interval) {
                breakType += "eye ";
            }
            if (now - breaksLast.stretch >= BREAKS.stretch.interval) {
                breakType += "stretch";
            }

            // ❌ אין צורך בהפסקה → אין AI
            if (!breakType) return;
            let breakTittle = breakType.trim().split(" ").join(" & ").trim();
            console.log("Requesting break recommendation for:", breakTittle);

            // ✅ כן צריך הפסקה → שואלים AI
            const response = await fetch("http://localhost:3001/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    breakTittle,
                    activity: stats
                })
            });

            const recommendation = await response.json();
            console.log("Received recommendation:", recommendation);

            sendNotification(
                recommendation.title,
                recommendation.message
            );

            // עדכון זמן ההפסקה
            breaksLast[breakType] = now;
            chrome.storage.local.set({ breaksLast });
        }
    );
});


async function analyzeWithAI(stats) {
    const res = await fetch("http://localhost:3001/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stats)
    });

    return await res.json();
}


function sendNotification(title, message) {
    console.log("Sending notification:", title, message);
    chrome.notifications.create({
        type: "basic",
        iconUrl: "/icon.png",
        title: title,
        message: message,
        priority: 2
    });
}
