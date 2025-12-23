import { StorageManager } from '../utils/storage-manager.js';
import { Achievements } from '../utils/gamification.js';

function scheduleNextMidnightReset() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const minutesUntilMidnight = Math.ceil((midnight - now) / (1000 * 60));
    console.log(`Scheduling reset in ${minutesUntilMidnight} minutes (at ${midnight.toLocaleString()})`);
    chrome.alarms.create("resetStats", { delayInMinutes: minutesUntilMidnight });
}

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
            // Immediately save daily stats to update score and streak
            await StorageManager.saveDailyStats();
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
        breaks_taken: 0,
        lastBreak: { timestamp: Date.now(), type: null },
        interval: 20,
        notifications: { enabled: true, sound: true, priority: 'high' },
        theme: 'dark'
    });

    chrome.alarms.create("checkBreaks", { periodInMinutes: 1 });
    chrome.alarms.create("saveStats", { periodInMinutes: 5 });
    scheduleNextMidnightReset();
    chrome.alarms.create("checkAchievements", { periodInMinutes: 5 });
    chrome.alarms.create("trackScreenTime", { periodInMinutes: 0.083 });
});

chrome.runtime.onStartup.addListener(() => {
    scheduleNextMidnightReset();
});
chrome.alarms.onAlarm.addListener(async alarm => {
    if (alarm.name === "trackScreenTime") {
        try {
            const result = await new Promise(resolve => 
                chrome.storage.local.get({ total_activity: {} }, resolve)
            );
            const activity = result.total_activity;
            await new Promise(resolve => {
                chrome.storage.local.set({
                    total_activity: {
                        ...activity,
                        screenTime: (activity.screenTime || 0) + 5
                    }
                }, resolve);
            });
        } catch (error) {
            console.error('Screen time tracking error:', error);
        }
        return;
    }

    if (alarm.name === "saveStats") {
        await StorageManager.saveDailyStats();
        return;
    }

    if (alarm.name === "resetStats") {
        console.log('Resetting stats at midnight:', new Date().toLocaleString());
        await StorageManager.resetDailyStats();
        scheduleNextMidnightReset();
        return;
    }

    if (alarm.name === "checkAchievements") {
        await Achievements.checkUnlocks();
        return;
    }
    if (alarm.name !== "checkBreaks") return;

    const now = Date.now();
    const { lastBreak, total_activity: stats, interval } = await new Promise(resolve =>
        chrome.storage.local.get(["lastBreak", "total_activity", "interval"], resolve)
    );

    if (!lastBreak || !stats) return;

    const intervalMs = (interval || 20) * 60 * 1000; // Default to 20 minutes if no interval set
    
    if (now - lastBreak.timestamp < intervalMs) return;

    console.log("Requesting AI break recommendation");

    // Update timestamp immediately to prevent multiple notifications
    await new Promise(resolve => chrome.storage.local.set({ 
        lastBreak: { timestamp: now, type: lastBreak.type }
    }, resolve));

    const history = await new Promise(resolve =>
        chrome.storage.local.get(['history'], result => resolve(result.history || {}))
    );

    let breakType = 'general';

    try {
        const response = await fetch("http://localhost:3001/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                activity: stats,
                history: history,
                lastBreakType: lastBreak.type
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const recommendation = await response.json();
        console.log("Received recommendation:", recommendation);

        breakType = recommendation.breakType || 'general';

        const exerciseData = {
            name: recommendation.title || "Break Time",
            description: recommendation.message,
            duration: recommendation.exercise?.duration || 30,
            steps: recommendation.exercise?.steps || [
                "Sit up straight",
                "Look away from your screen",
                "Take 3 deep breaths",
                "Gently stretch your neck"
            ],
            icon: recommendation.icon || "💪"
        };

        sendNotification(recommendation.title, recommendation.message, exerciseData);

    } catch (error) {
        console.error("AI analysis failed, sending default notification:", error);
        const defaultTitle = "Break Time";
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

    // Update break type after notification is sent
    await new Promise(resolve => chrome.storage.local.set({ 
        lastBreak: { timestamp: now, type: breakType }
    }, resolve));
});


function sendNotification(title, message, exerciseData = null) {
    // Check if notifications are enabled
    chrome.storage.local.get(['notifications'], (result) => {
        const notificationSettings = result.notifications || { enabled: true, sound: true, priority: 'high' };
        
        if (!notificationSettings.enabled) {
            console.log('Notifications disabled, skipping notification');
            return;
        }
        
        const notificationId = `break-notification-${Date.now()}`;
        console.log('Sending notification:', title, message);

        if (exerciseData) {
            chrome.storage.local.set({
                pendingExercise: {
                    ...exerciseData,
                    timestamp: Date.now()
                }
            });
        }

        const priorityMap = {
            'low': 0,
            'medium': 1,
            'high': 2
        };

        chrome.notifications.create(notificationId, {
            type: "basic",
            iconUrl: "/icon.png",
            title: title,
            message: message + "\n\nClick to view exercise details",
            priority: priorityMap[notificationSettings.priority] || 2,
            requireInteraction: notificationSettings.priority === 'high',
            silent: !notificationSettings.sound
        });
    });
}

chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.notifications.clear(notificationId);

    chrome.tabs.create({
        url: chrome.runtime.getURL("tab.html"),
        active: true
    });

});


