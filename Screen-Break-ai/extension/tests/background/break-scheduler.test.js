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
        mockStorage.lastBreak = { timestamp: MOCK_TIMESTAMP, type: null };
        mockStorage.interval = 20; // in minutes
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
            breaks_taken: 0,
            lastBreak: { timestamp: MOCK_TIMESTAMP, type: null },
            interval: 20,
            notifications: { enabled: true, sound: true, priority: 'high' },
            theme: 'dark'
        });

        expect(chrome.alarms.create).toHaveBeenCalledTimes(5);
        expect(chrome.alarms.create).toHaveBeenCalledWith("checkBreaks", { periodInMinutes: 1 });
        expect(chrome.alarms.create).toHaveBeenCalledWith("saveStats", { periodInMinutes: 5 });
        expect(chrome.alarms.create).toHaveBeenCalledWith("resetStats", { periodInMinutes: 24 * 60 });
        expect(chrome.alarms.create).toHaveBeenCalledWith("checkAchievements", { periodInMinutes: 5 });
        expect(chrome.alarms.create).toHaveBeenCalledWith("trackScreenTime", { periodInMinutes: 0.083 });
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
        // lastBreak already set to MOCK_TIMESTAMP in beforeEach, so no breaks due
        await chrome.alarms.onAlarm.trigger({ name: 'checkBreaks' });
        expect(mockFetch).not.toHaveBeenCalled();
        expect(chrome.notifications.create).not.toHaveBeenCalled();
    });

    it('should trigger break if break is due', async () => {
        // Set break due 21 minutes ago (interval is 20 min)
        mockStorage.lastBreak = { timestamp: MOCK_TIMESTAMP - (21 * 60 * 1000), type: 'eye' };
        mockStorage.total_activity = { clicks: 100, keystrokes: 50, scrollDistance: 200, screenTime: 300 };
        mockStorage.history = { '2025-01-14': { score: 70 } };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                title: "Break Time",
                message: "Time for a wellness break.",
                exercise: { name: "Wellness Break", duration: 30, steps: [] },
                urgency: "medium",
                breakType: "stretch"
            })
        });

        await chrome.alarms.onAlarm.trigger({ name: 'checkBreaks' });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/analyze", expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
                activity: mockStorage.total_activity,
                history: mockStorage.history,
                lastBreakType: 'eye'
            }),
        }));
        expect(chrome.notifications.create).toHaveBeenCalledTimes(1);
        expect(mockStorage.lastBreak).toEqual({ timestamp: MOCK_TIMESTAMP, type: 'stretch' });
    });



    it('should send default notification if AI analysis fails', async () => {
        mockStorage.lastBreak = { timestamp: MOCK_TIMESTAMP - (21 * 60 * 1000), type: 'stretch' };
        mockFetch.mockRejectedValueOnce(new Error("Network Error"));

        await chrome.alarms.onAlarm.trigger({ name: 'checkBreaks' });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(chrome.notifications.create).toHaveBeenCalledTimes(1);
        expect(mockStorage.lastBreak).toEqual({ timestamp: MOCK_TIMESTAMP, type: 'general' });
    });

    // --- chrome.notifications.onClicked tests ---
    it('should clear notification and open popup when notification is clicked', async () => {
        const mockNotificationId = 'test-notification-id';
        await chrome.notifications.onClicked.trigger(mockNotificationId);

        expect(chrome.notifications.clear).toHaveBeenCalledWith(mockNotificationId);
        expect(chrome.tabs.create).toHaveBeenCalledTimes(1);
        expect(chrome.tabs.create).toHaveBeenCalledWith({
            url: "chrome-extension://test-extension-id/tab.html",
            active: true
        });
    });

    it('should use default interval if not in storage', async () => {
        // Remove interval from storage to test default behavior
        delete mockStorage.interval;
        // Set lastBreak to be more than 20 minutes ago (default interval)
        mockStorage.lastBreak = { timestamp: MOCK_TIMESTAMP - (25 * 60 * 1000), type: null };
        mockStorage.total_activity = { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0 };
        mockStorage.history = {};

        // Mock chrome.storage.local.get to return the storage without interval
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            const result = {};
            if (Array.isArray(keys)) {
                keys.forEach(key => {
                    if (mockStorage.hasOwnProperty(key)) {
                        result[key] = mockStorage[key];
                    }
                });
            }
            callback(result);
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                title: "Test Break",
                message: "Msg",
                exercise: { name: "Test", duration: 10, steps: [] },
                urgency: "low",
                breakType: "eye"
            })
        });

        await chrome.alarms.onAlarm.trigger({ name: 'checkBreaks' });

        expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            body: JSON.stringify({
                activity: mockStorage.total_activity,
                history: {},
                lastBreakType: null
            }),
        }));
        expect(mockStorage.lastBreak).toEqual({ timestamp: MOCK_TIMESTAMP, type: 'eye' });
    });
});
