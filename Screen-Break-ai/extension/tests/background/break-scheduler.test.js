// Mock chrome API before importing the script
import { resetChromeMocks, mockStorage, mockAlarms, mockNotifications, mockMessages } from '../../mocks/chrome';

// Mock other external dependencies
jest.mock('../../utils/storage-manager', () => ({
    StorageManager: {
        saveDailyStats: jest.fn(() => Promise.resolve()),
        resetDailyStats: jest.fn(() => Promise.resolve()),
        incrementBreakCount: jest.fn(() => Promise.resolve()),
    },
}));
jest.mock('../../utils/gamification', () => ({
    Achievements: {
        checkUnlocks: jest.fn(() => Promise.resolve()),
    },
}));

// Mock fetch API
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import the script under test
import '../../background/break-scheduler';
import { StorageManager } from '../../utils/storage-manager';
import { Achievements } from '../../utils/gamification';


describe('Background Service Worker (break-scheduler.js)', () => {
    // Mock Date.now() for consistent testing of time-based logic
    const MOCK_DATE = new Date('2025-01-15T12:00:00.000Z');
    const MOCK_TIMESTAMP = MOCK_DATE.getTime();
    global.Date.now = jest.fn(() => MOCK_TIMESTAMP);

    beforeEach(() => {
        resetChromeMocks();
        jest.clearAllMocks(); // Clear mocks from StorageManager, Achievements, and fetch
        global.fetch.mockClear();
        
        // Default storage values for common scenarios
        mockStorage.breaksLast = { eye: MOCK_TIMESTAMP, stretch: MOCK_TIMESTAMP };
        mockStorage.intervals = { eye: 20, stretch: 60 }; // in minutes
        mockStorage.total_activity = { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0 };
    });

    // --- chrome.runtime.onMessage tests ---
    it('should respond to "ping" message', async () => {
        const sendResponse = jest.fn();
        const result = await chrome.runtime.onMessage.triggerMessage({ type: 'ping' }, {}, sendResponse);
        expect(sendResponse).toHaveBeenCalledWith({ status: 'alive' });
        expect(result).toEqual([true]); // Listener returned true
    });

    it('should handle "UPDATE_INTERVALS" message', async () => {
        const sendResponse = jest.fn();
        const result = await chrome.runtime.onMessage.triggerMessage({ type: 'UPDATE_INTERVALS', data: { eye: 15 } }, {}, sendResponse);
        expect(sendResponse).toHaveBeenCalledWith({ status: 'intervals updated' });
        expect(result).toEqual([true]);
        // Note: The actual update to storage/alarms is handled by the popup, not directly by this message handler.
    });

    it('should handle "SAVE_STATS_NOW" message', async () => {
        const sendResponse = jest.fn();
        await chrome.runtime.onMessage.triggerMessage({ type: 'SAVE_STATS_NOW' }, {}, sendResponse);
        expect(StorageManager.saveDailyStats).toHaveBeenCalledTimes(1);
        expect(sendResponse).toHaveBeenCalledWith({ status: 'stats saved' });
    });

    it('should handle "GET_HISTORY" message', async () => {
        const mockHistory = { '2025-01-14': { score: 70 } };
        mockStorage.history = mockHistory; // Set mock storage for this test

        const sendResponse = jest.fn();
        await chrome.runtime.onMessage.triggerMessage({ type: 'GET_HISTORY' }, {}, sendResponse);
        expect(sendResponse).toHaveBeenCalledWith(mockHistory);
    });

    // --- chrome.runtime.onInstalled tests ---
    it('should set initial storage values and create alarms on install', async () => {
        await chrome.runtime.onInstalled.trigger();

        expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            total_activity: expect.any(Object),
            pendingActivity: {},
            breaks_taken: 0,
            breaksLast: { eye: MOCK_TIMESTAMP, stretch: MOCK_TIMESTAMP },
            intervals: { eye: 20, stretch: 60 },
            notifications: { enabled: true, sound: true, priority: 'high' },
            theme: 'dark'
        });

        expect(chrome.alarms.create).toHaveBeenCalledTimes(4);
        expect(chrome.alarms.create).toHaveBeenCalledWith("checkBreaks", { periodInMinutes: 1 });
        expect(chrome.alarms.create).toHaveBeenCalledWith("saveStats", { periodInMinutes: 5 });
        expect(chrome.alarms.create).toHaveBeenCalledWith("resetStats", { periodInMinutes: 24 * 60 });
        expect(chrome.alarms.create).toHaveBeenCalledWith("checkAchievements", { periodInMinutes: 5 });
    });

    // --- chrome.alarms.onAlarm tests ---
    it('should call StorageManager.saveDailyStats for "saveStats" alarm', async () => {
        await chrome.alarms.onAlarm.trigger({ name: 'saveStats' });
        expect(StorageManager.saveDailyStats).toHaveBeenCalledTimes(1);
    });

    it('should call StorageManager.resetDailyStats for "resetStats" alarm', async () => {
        await chrome.alarms.onAlarm.trigger({ name: 'resetStats' });
        expect(StorageManager.resetDailyStats).toHaveBeenCalledTimes(1);
    });

    it('should call Achievements.checkUnlocks for "checkAchievements" alarm', async () => {
        await chrome.alarms.onAlarm.trigger({ name: 'checkAchievements' });
        expect(Achievements.checkUnlocks).toHaveBeenCalledTimes(1);
    });

    it('should not trigger break if no breaks are due', async () => {
        // breaksLast already set to MOCK_TIMESTAMP in beforeEach, so no breaks due
        await chrome.alarms.onAlarm.trigger({ name: 'checkBreaks' });
        expect(mockFetch).not.toHaveBeenCalled();
        expect(chrome.notifications.create).not.toHaveBeenCalled();
        expect(StorageManager.incrementBreakCount).not.toHaveBeenCalled();
    });

    it('should trigger eye break if eye break is due', async () => {
        // Set eye break due 21 minutes ago (interval is 20 min)
        mockStorage.breaksLast.eye = MOCK_TIMESTAMP - (21 * 60 * 1000);
        mockStorage.total_activity = { clicks: 100, keystrokes: 50, scrollDistance: 200, screenTime: 300 };
        mockStorage.history = { '2025-01-14': { score: 70 } };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                title: "Eye Exercise",
                message: "Look at something 20 feet away for 20 seconds.",
                exercise: { name: "20-20-20 Rule", duration: 20, steps: [] },
                urgency: "medium"
            })
        });

        await chrome.alarms.onAlarm.trigger({ name: 'checkBreaks' });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/analyze", expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
                breakType: "Eye Break",
                activity: mockStorage.total_activity,
                history: mockStorage.history,
            }),
        }));
        expect(chrome.notifications.create).toHaveBeenCalledTimes(1);
        expect(chrome.notifications.create).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            title: "Eye Exercise",
            message: "Look at something 20 feet away for 20 seconds.\n\nClick to view exercise details",
        }));
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            pendingExercise: expect.objectContaining({
                name: "Eye Exercise",
                timestamp: MOCK_TIMESTAMP,
            })
        });
        expect(StorageManager.incrementBreakCount).toHaveBeenCalledTimes(1);
        expect(Achievements.checkUnlocks).toHaveBeenCalledTimes(1);
        expect(mockStorage.breaksLast.eye).toBe(MOCK_TIMESTAMP); // Should be updated
    });

    it('should trigger stretch break if stretch break is due', async () => {
        // Set stretch break due 61 minutes ago (interval is 60 min)
        mockStorage.breaksLast.stretch = MOCK_TIMESTAMP - (61 * 60 * 1000);
        mockStorage.total_activity = { clicks: 100, keystrokes: 50, scrollDistance: 200, screenTime: 300 };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                title: "Stretch Exercise",
                message: "Stand up and stretch.",
                exercise: { name: "Full Body Stretch", duration: 60, steps: [] },
                urgency: "high"
            })
        });

        await chrome.alarms.onAlarm.trigger({ name: 'checkBreaks' });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(chrome.notifications.create).toHaveBeenCalledTimes(1);
        expect(StorageManager.incrementBreakCount).toHaveBeenCalledTimes(1);
        expect(Achievements.checkUnlocks).toHaveBeenCalledTimes(1);
        expect(mockStorage.breaksLast.stretch).toBe(MOCK_TIMESTAMP); // Should be updated
    });

    it('should trigger both eye and stretch breaks if both are due', async () => {
        mockStorage.breaksLast.eye = MOCK_TIMESTAMP - (21 * 60 * 1000);
        mockStorage.breaksLast.stretch = MOCK_TIMESTAMP - (61 * 60 * 1000);
        mockStorage.total_activity = { clicks: 100, keystrokes: 50, scrollDistance: 200, screenTime: 300 };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                title: "Combined Break",
                message: "Time for eye and stretch.",
                exercise: { name: "Full Break", duration: 80, steps: [] },
                urgency: "high"
            })
        });

        await chrome.alarms.onAlarm.trigger({ name: 'checkBreaks' });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/analyze", expect.objectContaining({
            body: JSON.stringify({
                breakType: "Eye Break & Stretch Break",
                activity: mockStorage.total_activity,
                history: {}, // Default history
            }),
        }));
        expect(chrome.notifications.create).toHaveBeenCalledTimes(1);
        expect(mockStorage.breaksLast.eye).toBe(MOCK_TIMESTAMP);
        expect(mockStorage.breaksLast.stretch).toBe(MOCK_TIMESTAMP);
    });

    it('should send default notification if AI analysis fails', async () => {
        mockStorage.breaksLast.eye = MOCK_TIMESTAMP - (21 * 60 * 1000);
        mockFetch.mockRejectedValueOnce(new Error("Network Error"));

        await chrome.alarms.onAlarm.trigger({ name: 'checkBreaks' });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(chrome.notifications.create).toHaveBeenCalledTimes(1);
        expect(chrome.notifications.create).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            title: "Eye Break",
            message: "Take a moment to rest your eyes and stretch your body.\n\nClick to view exercise details",
        }));
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            pendingExercise: expect.objectContaining({
                name: "Eye Break",
                duration: 40,
            })
        });
        expect(StorageManager.incrementBreakCount).toHaveBeenCalledTimes(1);
    });

    // --- chrome.notifications.onClicked tests ---
    it('should clear notification and open popup when notification is clicked', async () => {
        const mockNotificationId = 'test-notification-id';
        await chrome.notifications.onClicked.trigger(mockNotificationId);

        expect(chrome.notifications.clear).toHaveBeenCalledWith(mockNotificationId);
        expect(chrome.tabs.create).toHaveBeenCalledTimes(1);
        expect(chrome.tabs.create).toHaveBeenCalledWith({
            url: "chrome-extension://test-extension-id/popup/dist/index.html",
            active: true
        });
    });

    it('getBreakIntervals should use default intervals if not in storage', async () => {
        // Clear intervals from mockStorage for this test
        delete mockStorage.intervals;

        mockStorage.breaksLast.eye = MOCK_TIMESTAMP - (21 * 60 * 1000); // make a break due

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                title: "Test Break",
                message: "Msg",
                exercise: { name: "Test", duration: 10, steps: [] },
                urgency: "low"
            })
        });

        await chrome.alarms.onAlarm.trigger({ name: 'checkBreaks' });

        // Default intervals are eye: 1 min, stretch: 60 min (from getBreakIntervals function itself)
        expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            body: JSON.stringify({
                breakType: "Eye Break",
                activity: mockStorage.total_activity,
                history: {},
            }),
        }));
        expect(mockStorage.breaksLast.eye).toBe(MOCK_TIMESTAMP); // Should update
    });
});
