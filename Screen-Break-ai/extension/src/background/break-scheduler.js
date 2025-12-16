import { StorageManager } from '../../utils/storage-manager.js';
import { Achievements } from '../../utils/gamification.js';

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

    // Create alarms
    chrome.alarms.create("checkBreaks", { periodInMinutes: 1 });
    chrome.alarms.create("saveStats", { periodInMinutes: 60 });
    chrome.alarms.create("resetStats", { periodInMinutes: 24 * 60 }); // Daily alarm
    chrome.alarms.create("checkAchievements", { periodInMinutes: 5 });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        if (message.type === "GET_STATS") {
            const result = await new Promise(resolve => chrome.storage.local.get(["total_activity"], resolve));
            sendResponse(result.total_activity || {
                clicks: 0,
                keystrokes: 0,
                scrollDistance: 0,
                screenTime: 0
            });
        } else if (message.type === "UPDATE_STATS") {
            const result = await new Promise(resolve => chrome.storage.local.get(["total_activity"], resolve));
            const stats = result.total_activity || {
                clicks: 0,
                keystrokes: 0,
                scrollDistance: 0,
                screenTime: 0
            };

            stats.clicks += message.data.clicks;
            stats.keystrokes += message.data.keystrokes;
            stats.scrollDistance += message.data.scrollDistance;
            stats.screenTime += message.data.screenTime;

            await new Promise(resolve => chrome.storage.local.set({ total_activity: stats }, resolve));
            sendResponse({ success: true });
        } else if (message.type === "TRIGGER_BREAK") {
            sendNotification(
                "Time for a break!",
                "You've earned it! Step away from the screen."
            );
            sendResponse({ success: true });
        }
    })();

    return true; // Keep the message channel open for async response
});

const BREAKS = {
    eye: { interval: 20 * 60 * 1000 },
    stretch: { interval: 60 * 60 * 1000 }
};

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "saveStats") {
        await StorageManager.saveDailyStats();
        return;
    }
    
    if (alarm.name === "resetStats") {
        await StorageManager.resetDailyStats();
        return;
    }

    if (alarm.name === "checkAchievements") {
        await Achievements.checkUnlocks();
        return;
    }

    if (alarm.name !== "checkBreaks") return;

    const now = Date.now();
    const { breaksLast, total_activity: stats } = await new Promise(resolve => 
        chrome.storage.local.get(["breaksLast", "total_activity"], resolve)
    );

    if (!breaksLast || !stats) return;

    const breakRecommendations = [];

    if (now - breaksLast.eye >= BREAKS.eye.interval) {
        breakRecommendations.push({ type: "eye", title: "Eye Break" });
        breaksLast.eye = now;
    }

    if (now - breaksLast.stretch >= BREAKS.stretch.interval) {
        breakRecommendations.push({ type: "stretch", title: "Stretch Break" });
        breaksLast.stretch = now;
    }

    if (breakRecommendations.length === 0) return;

    const breakTitle = breakRecommendations.map(b => b.title).join(" & ");
    console.log("Requesting break recommendation for:", breakTitle);

    try {
        const response = await fetch("http://localhost:3001/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                breakTitle,
                activity: stats,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const recommendation = await response.json();
        console.log("Received recommendation:", recommendation);

        // Create exercise data structure
        const exerciseData = {
            name: recommendation.title || breakTitle,
            description: recommendation.message,
            duration: recommendation.duration || 30, // Default 30 seconds
            steps: recommendation.steps || [
                "Sit up straight",
                "Take a deep breath",
                "Relax your shoulders",
                "Focus on the exercise"
            ],
            icon: recommendation.icon || "💪"
        };

        sendNotification(recommendation.title, recommendation.message, exerciseData);

    } catch (error) {
        console.error("AI analysis failed, sending default notification:", error);
        // Send a default notification if the AI service fails
        const defaultTitle = breakTitle;
        const defaultMessage = "Take a moment to rest your eyes and stretch your body.";
        const defaultExercise = {
            name: defaultTitle,
            description: defaultMessage,
            duration: 40,
            steps: [
                "Sit up straight",
                "Look away from your screen",
                "Take 3 deep breaths",
                "Gently stretch your neck"
            ],
            icon: "💪"
        };
        sendNotification(defaultTitle, defaultMessage, defaultExercise);
    }

    await StorageManager.incrementBreakCount();
    await Achievements.checkUnlocks();

    await new Promise(resolve => chrome.storage.local.set({ breaksLast }, resolve));
});


function sendNotification(title, message, exerciseData = null) {
    const notificationId = `break-notification-${Date.now()}`;
    console.log("Sending notification:", title, message);
    
    // Store exercise data for the popup to access
    if (exerciseData) {
        chrome.storage.local.set({ 
            pendingExercise: {
                ...exerciseData,
                timestamp: Date.now()
            }
        });
    }
    
    chrome.notifications.create(notificationId, {
        type: "basic",
        iconUrl: "/icon.png",
        title: title,
        message: message + "\n\nClick to view exercise details",
        priority: 2
    });
}

chrome.notifications.onClicked.addListener((notificationId) => {
    // Clear the notification
    chrome.notifications.clear(notificationId);
    
    // Open the extension popup by creating a new tab with the popup URL
    chrome.tabs.create({ 
        url: chrome.runtime.getURL("src/popup/dist/index.html"),
        active: true
    });
});
