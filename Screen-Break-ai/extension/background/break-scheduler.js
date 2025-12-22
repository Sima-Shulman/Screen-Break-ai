import { StorageManager } from '../utils/storage-manager.js';
import { Achievements } from '../utils/gamification.js';

console.log("Background service worker running");

// Keep service worker alive and handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle any messages from popup/content scripts
    if (message.type === 'ping') {
        sendResponse({ status: 'alive' });
        return true;
    }
    
    if (message.type === 'EXERCISE_COMPLETED') {
        // Only increment break count and check achievements when exercise is actually completed
        StorageManager.incrementBreakCount().then(async () => {
            await Achievements.checkUnlocks();
            sendResponse({ status: 'exercise completed, stats updated' });
        });
        return true;
    }
    
    if (message.type === 'UPDATE_INTERVALS') {
        // Update break intervals - alarms will use new values on next check
        sendResponse({ status: 'intervals updated' });
        return true;
    }
    
    if (message.type === 'SAVE_STATS_NOW') {
        StorageManager.saveDailyStats().then(() => {
            sendResponse({ status: 'stats saved' });
        });
        return true;
    }
    
    if (message.type === 'GET_HISTORY') {
        chrome.storage.local.get(['history'], (result) => {
            sendResponse(result.history || {});
        });
        return true;
    }
    
    return true;
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        total_activity: {
            clicks: 0,
            keystrokes: 0,
            scrollDistance: 0,
            screenTime: 0
        },
        pendingActivity: {},
        breaks_taken: 0,
        breaksLast: {
            eye: Date.now(),
            stretch: Date.now()
        },
        intervals: { eye: 20, stretch: 60 },
        notifications: { enabled: true, sound: true, priority: 'high' },
        theme: 'dark'
    });

    chrome.alarms.create("checkBreaks", { periodInMinutes: 1 });
    chrome.alarms.create("saveStats", { periodInMinutes: 5 });
    chrome.alarms.create("resetStats", { periodInMinutes: 24 * 60 });
    chrome.alarms.create("checkAchievements", { periodInMinutes: 5 });
});
chrome.alarms.onAlarm.addListener(async alarm => {

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
    const now = Date.now();
    const { breaksLast, total_activity: stats } = await new Promise(resolve =>
        chrome.storage.local.get(["breaksLast", "total_activity"], resolve)
    );

    if (!breaksLast || !stats) return;

    const BREAKS = await getBreakIntervals();
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

    const history = await new Promise(resolve =>
        chrome.storage.local.get(['history'], result => resolve(result.history || {}))
    );

    try {
        const response = await fetch("http://localhost:3001/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                breakType: breakTitle,
                activity: stats,
                history: history
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const recommendation = await response.json();
        console.log("Received recommendation:", recommendation);

        const exerciseData = {
            name: recommendation.title || breakTitle,
            description: recommendation.message,
            duration: recommendation.duration || 30,
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

    // Break count and achievements will be updated only when user completes the exercise

    await new Promise(resolve => chrome.storage.local.set({ breaksLast }, resolve));
});


function sendNotification(title, message, exerciseData = null) {
    const notificationId = `break-notification-${Date.now()}`;
    console.log("Sending notification:", title, message);

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
    chrome.notifications.clear(notificationId);

    chrome.tabs.create({
        url: chrome.runtime.getURL("popup/dist/index.html"),
        active: true
    });

});


const getBreakIntervals = async () => {
    const result = await new Promise(resolve =>
        chrome.storage.local.get(['intervals'], resolve)
    );
    const intervals = result.intervals || { eye: 1, stretch: 60 };
    return {
        eye: { interval: intervals.eye * 60 * 1000 },
        stretch: { interval: intervals.stretch * 60 * 1000 }
    };
};