// Mock chrome API before importing the script
import { resetChromeMocks, mockStorage, mockNotifications } from '../../mocks/chrome';

// Import the script under test
import { Achievements } from '../../utils/gamification';

describe('Achievements', () => {
    // Mock Date.now() for consistent testing of time-based logic and ISO string creation
    const MOCK_DATE = new Date('2025-01-15T12:00:00.000Z');
    const MOCK_TIMESTAMP = MOCK_DATE.getTime();
    global.Date.now = jest.fn(() => MOCK_TIMESTAMP);

    beforeEach(() => {
        resetChromeMocks();
        jest.clearAllMocks();
    });

    describe('checkUnlocks', () => {
        it('should unlock new achievements and send notifications', async () => {
            mockStorage.total_activity = { clicks: 100, keystrokes: 200, scrollDistance: 500, screenTime: 3600 * 3 }; // 3 hours
            mockStorage.breaks_taken = 1;
            mockStorage.eye_breaks = 0;
            mockStorage.stretch_breaks = 0;
            mockStorage.history = {
                '2025-01-15': { health_score: 80, screenTime: 3600 * 3 },
            };
            mockStorage.achievements = []; // No achievements unlocked yet

            await Achievements.checkUnlocks();

            expect(mockNotifications['break-notification-first_break']).toBeDefined();
            expect(chrome.notifications.create).toHaveBeenCalledTimes(1);
            expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.achievements).toEqual(['first_break']);
        });

        it('should not send notification for already unlocked achievements', async () => {
            mockStorage.total_activity = { clicks: 100, keystrokes: 200, scrollDistance: 500, screenTime: 3600 * 3 };
            mockStorage.breaks_taken = 1;
            mockStorage.history = {
                '2025-01-15': { health_score: 80, screenTime: 3600 * 3 },
            };
            mockStorage.achievements = ['first_break']; // Already unlocked

            await Achievements.checkUnlocks();

            expect(chrome.notifications.create).not.toHaveBeenCalled();
            expect(chrome.storage.local.set).toHaveBeenCalledTimes(1); // Still calls set to ensure state is consistent
            expect(mockStorage.achievements).toEqual(['first_break']);
        });

        it('should unlock multiple achievements if conditions met', async () => {
            mockStorage.total_activity = { clicks: 100, keystrokes: 200, scrollDistance: 500, screenTime: 3600 * 3 };
            mockStorage.breaks_taken = 10; // Unlocks first_break and break_master
            mockStorage.history = {
                '2025-01-15': { health_score: 80, screenTime: 3600 * 3 },
            };
            mockStorage.achievements = [];

            await Achievements.checkUnlocks();

            expect(chrome.notifications.create).toHaveBeenCalledTimes(2);
            expect(mockStorage.achievements).toEqual(['first_break', 'break_master']);
        });
    });

    describe('showAchievementNotification', () => {
        it('should create a chrome notification', () => {
            const achievement = {
                id: 'test_achievement',
                name: 'Test Achievement',
                icon: '🌟',
                description: 'Description for test',
            };
            Achievements.showAchievementNotification(achievement);
            expect(chrome.notifications.create).toHaveBeenCalledTimes(1);
            expect(chrome.notifications.create).toHaveBeenCalledWith(expect.any(String), {
                type: 'basic',
                iconUrl: '/icon.png',
                title: '🎉 Achievement Unlocked!',
                message: '🌟 Test Achievement\nDescription for test',
                priority: 2,
                requireInteraction: true,
            });
        });
    });

    describe('getUserStats', () => {
        it('should retrieve and calculate user stats correctly', async () => {
            mockStorage.total_activity = { clicks: 100, keystrokes: 200, scrollDistance: 500, screenTime: 3600 * 3 };
            mockStorage.breaks_taken = 5;
            mockStorage.eye_breaks = 2;
            mockStorage.stretch_breaks = 3;
            mockStorage.history = {
                '2025-01-15': { health_score: 80, screenTime: 3600 * 3 },
                '2025-01-14': { health_score: 75, screenTime: 3600 * 4 },
                '2025-01-13': { health_score: 60, screenTime: 3600 * 5 }, // Breaks streak
                '2025-01-12': { health_score: 70, screenTime: 3600 * 2 },
            };

            const stats = await Achievements.getUserStats();

            expect(stats.total_breaks).toBe(5);
            expect(stats.eye_breaks).toBe(2);
            expect(stats.stretch_breaks).toBe(3);
            expect(stats.health_score).toBe(80); // Today's score
            expect(stats.streak).toBe(2); // 15th and 14th
            expect(stats.avg_screen_time).toBeCloseTo((3600 * 3 + 3600 * 4 + 3600 * 5 + 3600 * 2) / 4); // Avg of last 4 days
            expect(stats.clicks).toBe(100);
            expect(stats.keystrokes).toBe(200);
        });

        it('should handle empty history for streak and avg_screen_time', async () => {
            mockStorage.total_activity = { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0 };
            mockStorage.breaks_taken = 0;
            mockStorage.history = {};

            const stats = await Achievements.getUserStats();

            expect(stats.streak).toBe(0);
            expect(stats.avg_screen_time).toBe(0);
            expect(stats.health_score).toBe(0);
        });
    });

    describe('getAchievementsWithStatus', () => {
        it('should return achievements with their unlocked status', async () => {
            mockStorage.achievements = ['first_break'];
            const achievementsWithStatus = await Achievements.getAchievementsWithStatus();
            
            const firstBreak = achievementsWithStatus.find(a => a.id === 'first_break');
            expect(firstBreak.unlocked).toBe(true);

            const breakMaster = achievementsWithStatus.find(a => a.id === 'break_master');
            expect(breakMaster.unlocked).toBe(false);
        });
    });

    describe('calculateTotalScore', () => {
        it('should calculate the total score correctly', async () => {
            mockStorage.total_activity = { clicks: 100, keystrokes: 200, scrollDistance: 500, screenTime: 3600 * 3 };
            mockStorage.breaks_taken = 5;
            mockStorage.history = {
                '2025-01-15': { health_score: 80, screenTime: 3600 * 3 },
                '2025-01-14': { health_score: 75, screenTime: 3600 * 4 },
            };
            mockStorage.achievements = ['first_break', 'break_master']; // 2 unlocked

            const score = await Achievements.calculateTotalScore();

            // 2 unlocked achievements * 100 = 200
            // 5 breaks * 10 = 50
            // Streak of 2 * 50 = 100
            // Health bonus = 80
            // Total = 200 + 50 + 100 + 80 = 430
            expect(score.achievement_points).toBe(200);
            expect(score.break_points).toBe(50);
            expect(score.streak_points).toBe(100);
            expect(score.health_bonus).toBe(80);
            expect(score.total).toBe(430);
        });
    });
});
