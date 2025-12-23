// Mock chrome API before importing the script
import { resetChromeMocks, mockStorage } from '../../mocks/chrome';

// Import the script under test
import { StorageManager } from '../../utils/storage-manager';

describe('StorageManager', () => {
    // Mock Date.now() for consistent testing
    const MOCK_DATE = new Date('2025-01-15T12:00:00.000Z');
    const MOCK_TIMESTAMP = MOCK_DATE.getTime();
    
    beforeAll(() => {
        // Store original Date
        const OriginalDate = global.Date;
        
        // Mock Date.now()
        global.Date.now = jest.fn(() => MOCK_TIMESTAMP);
        
        // Mock new Date() calls
        global.Date = jest.fn((dateString) => {
            if (dateString) {
                return new OriginalDate(dateString);
            }
            return MOCK_DATE;
        });
        
        // Copy static methods
        global.Date.now = jest.fn(() => MOCK_TIMESTAMP);
        global.Date.UTC = OriginalDate.UTC;
        global.Date.parse = OriginalDate.parse;
        
        // Mock prototype methods
        global.Date.prototype = OriginalDate.prototype;
    });

    beforeEach(() => {
        resetChromeMocks();
        jest.clearAllMocks();
    });

    describe('saveDailyStats', () => {
        it('should save daily stats to history and calculate health score', async () => {
            mockStorage.total_activity = { clicks: 1000, keystrokes: 2000, scrollDistance: 5000, screenTime: 3600 * 5 }; // 5 hours
            mockStorage.breaks_taken = 3;

            const savedStats = await StorageManager.saveDailyStats();

            const today = '2025-01-15';
            expect(chrome.storage.local.get).toHaveBeenCalledWith(['history'], expect.any(Function));
            expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                history: {
                    [today]: {
                        clicks: 1000,
                        keystrokes: 2000,
                        scrollDistance: 5000,
                        screenTime: 3600 * 5,
                        breaks: 3,
                        breaks_taken: 3, // Duplicated due to spread and direct assignment
                        health_score: expect.any(Number), // Will be calculated
                        timestamp: MOCK_TIMESTAMP,
                    },
                },
            }, expect.any(Function));
            expect(savedStats.health_score).toBe(36); // Based on calculateHealthScore logic
        });

        it('should handle existing history', async () => {
            const yesterday = '2025-01-14';
            mockStorage.history = {
                [yesterday]: { screenTime: 3600 * 4, breaks: 2, health_score: 85 },
            };
            mockStorage.total_activity = { clicks: 500, keystrokes: 1000, scrollDistance: 2000, screenTime: 3600 * 3 };
            mockStorage.breaks_taken = 2;

            await StorageManager.saveDailyStats();

            const today = '2025-01-15';
            expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.history[yesterday]).toBeDefined();
            expect(mockStorage.history[today]).toBeDefined();
        });
    });

    describe('calculateHealthScore', () => {
        it('should return 100 for ideal stats', () => {
            const stats = { clicks: 100, keystrokes: 200, scrollDistance: 1000, screenTime: 3600 * 3, breaks: 9 }; // 3 hours screen time, 9 required breaks
            expect(StorageManager.calculateHealthScore(stats)).toBe(100);
        });

        it('should penalize for high screen time', () => {
            const stats = { clicks: 100, keystrokes: 200, scrollDistance: 1000, screenTime: 3600 * 9, breaks: 0 }; // 9 hours, no breaks
            expect(StorageManager.calculateHealthScore(stats)).toBe(0); // 100 - 30 - 135 (27*5) = negative, clamped to 0
        });

        it('should bonus for breaks', () => {
            const stats = { clicks: 100, keystrokes: 200, scrollDistance: 1000, screenTime: 3600 * 3, breaks: 10 }; // Max 20 bonus
            expect(StorageManager.calculateHealthScore(stats)).toBe(100);
        });

        it('should penalize for excessive activity', () => {
            const stats = { clicks: 15000, keystrokes: 25000, scrollDistance: 1000, screenTime: 3600 * 3, breaks: 0 };
            expect(StorageManager.calculateHealthScore(stats)).toBe(0); // 100 - 10 - 10 - 45 (9*5) = negative, clamped to 0
        });

        it('should not go below 0 or above 100', () => {
            const badStats = { clicks: 20000, keystrokes: 40000, scrollDistance: 10000, screenTime: 3600 * 10, breaks: 0 };
            expect(StorageManager.calculateHealthScore(badStats)).toBe(0); // 100 - 30 - 10 - 10 - 150 = negative, clamped to 0

            const goodStats = { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0, breaks: 100 };
            expect(StorageManager.calculateHealthScore(goodStats)).toBe(100);
        });
    });

    describe('getTodayStats', () => {
        it('should retrieve total_activity and breaks_taken', async () => {
            mockStorage.total_activity = { clicks: 10, keystrokes: 20, scrollDistance: 30, screenTime: 60 };
            mockStorage.breaks_taken = 1;

            const stats = await StorageManager.getTodayStats();
            expect(stats).toEqual({
                clicks: 10,
                keystrokes: 20,
                scrollDistance: 30,
                screenTime: 60,
                breaks: 1,
            });
        });

        it('should return defaults if no stats exist', async () => {
            const stats = await StorageManager.getTodayStats();
            expect(stats).toEqual({
                clicks: 0,
                keystrokes: 0,
                scrollDistance: 0,
                screenTime: 0,
                breaks: 0,
            });
        });
    });

    describe('getWeeklyData', () => {
        it('should return last 7 days of history sorted and formatted', async () => {
            const history = {
                '2025-01-08': { screenTime: 100, breaks_taken: 1, health_score: 50 },
                '2025-01-09': { screenTime: 200, breaks_taken: 2, health_score: 60 },
                '2025-01-10': { screenTime: 300, breaks_taken: 3, health_score: 70 },
                '2025-01-11': { screenTime: 400, breaks_taken: 4, health_score: 80 },
                '2025-01-12': { screenTime: 500, breaks_taken: 5, health_score: 90 },
                '2025-01-13': { screenTime: 600, breaks_taken: 6, health_score: 95 },
                '2025-01-14': { screenTime: 700, breaks_taken: 7, health_score: 100 },
                '2025-01-15': { screenTime: 800, breaks_taken: 8, health_score: 98 }, // Today
                '2025-01-07': { screenTime: 50, breaks_taken: 0, health_score: 40 }, // Excluded
            };
            mockStorage.history = history;

            const weeklyData = await StorageManager.getWeeklyData();
            expect(weeklyData.length).toBe(7); // Last 7 days only
            expect(weeklyData[0].date).toBe('2025-01-09'); // Sorted ascending
            expect(weeklyData[6].date).toBe('2025-01-15');
            expect(weeklyData[6].screenTime).toBe('0.2'); // 800 / 3600
        });

        it('should handle empty history', async () => {
            const weeklyData = await StorageManager.getWeeklyData();
            expect(weeklyData).toEqual([]);
        });
    });

    describe('calculateStreak', () => {
        it('should calculate streak based on health score >= 70', async () => {
            mockStorage.history = {
                '2025-01-15': { health_score: 80 },
                '2025-01-14': { health_score: 90 },
                '2025-01-13': { health_score: 65 }, // Break in streak
                '2025-01-12': { health_score: 75 },
            };
            const streak = await StorageManager.calculateStreak();
            expect(streak).toBe(2); // 15th and 14th
        });

        it('should return 0 for no streak', async () => {
            mockStorage.history = {
                '2025-01-15': { health_score: 50 },
                '2025-01-14': { health_score: 60 },
            };
            const streak = await StorageManager.calculateStreak();
            expect(streak).toBe(0);
        });

        it('should handle empty history', async () => {
            const streak = await StorageManager.calculateStreak();
            expect(streak).toBe(0);
        });
    });

    describe('incrementBreakCount', () => {
        it('should increment breaks_taken', async () => {
            mockStorage.breaks_taken = 5;
            await StorageManager.incrementBreakCount();
            expect(chrome.storage.local.set).toHaveBeenCalledWith({ breaks_taken: 6 }, expect.any(Function));
        });

        it('should initialize breaks_taken to 1 if not present', async () => {
            await StorageManager.incrementBreakCount();
            expect(chrome.storage.local.set).toHaveBeenCalledWith({ breaks_taken: 1 }, expect.any(Function));
        });
    });

    describe('resetDailyStats', () => {
        it('should save current stats and then reset total_activity and breaks_taken', async () => {
            // Mock saveDailyStats to control its behavior
            const saveDailyStatsSpy = jest.spyOn(StorageManager, 'saveDailyStats').mockResolvedValue();
            
            mockStorage.total_activity = { clicks: 100, keystrokes: 200, screenTime: 3600 };
            mockStorage.breaks_taken = 5;
            
            await StorageManager.resetDailyStats();

            expect(saveDailyStatsSpy).toHaveBeenCalledTimes(1);
            expect(chrome.storage.local.set).toHaveBeenCalledTimes(1); // One for reset
            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                total_activity: { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0 },
                breaks_taken: 0,
            });

            saveDailyStatsSpy.mockRestore();
        });
    });
});
