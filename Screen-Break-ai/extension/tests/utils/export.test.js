// Mock chrome API before importing the script
import { resetChromeMocks, mockStorage } from '../../mocks/chrome';

// Mock dependencies
jest.mock('../../utils/storage-manager', () => ({
    StorageManager: {
        getWeeklyData: jest.fn(),
        calculateStreak: jest.fn(),
    },
}));
jest.mock('../../utils/gamification', () => ({
    Achievements: {
        getAchievementsWithStatus: jest.fn(),
        calculateTotalScore: jest.fn(),
        getUserStats: jest.fn(),
    },
}));

// Mock URL and Blob APIs for file downloads
const mockBlob = jest.fn((content, options) => ({ content, options }));
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = jest.fn();
global.Blob = mockBlob;
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock window.open and navigator.clipboard
global.open = jest.fn();
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: jest.fn(() => Promise.resolve()),
    },
    writable: true,
});

// Import the script under test
import { ExportManager } from '../../utils/export';
import { StorageManager } from '../../utils/storage-manager';
import { Achievements } from '../../utils/gamification';

// Mock document.createElement and appendChild for file downloads
const mockAnchor = {
    href: '',
    download: '',
    click: jest.fn(),
};
Object.defineProperty(document, 'createElement', {
    value: jest.fn(() => mockAnchor),
    writable: true,
});
Object.defineProperty(document.body, 'appendChild', {
    value: jest.fn(),
    writable: true,
});
Object.defineProperty(document.body, 'removeChild', {
    value: jest.fn(),
    writable: true,
});

describe('ExportManager', () => {
    // Mock Date.now() for consistent testing of time-based logic and ISO string creation
    const MOCK_DATE = new Date('2025-01-15T12:00:00.000Z');
    const MOCK_TIMESTAMP = MOCK_DATE.getTime();
    global.Date.now = jest.fn(() => MOCK_TIMESTAMP);

    beforeEach(() => {
        resetChromeMocks();
        jest.clearAllMocks();

        // Default mock data for dependencies
        StorageManager.getWeeklyData.mockResolvedValue([
            { date: '2025-01-14', day: 'Tue', screenTime: '4.0', breaks: 5, score: 90, clicks: 1000, keystrokes: 2000 },
            { date: '2025-01-15', day: 'Wed', screenTime: '5.0', breaks: 6, score: 95, clicks: 1200, keystrokes: 2500 },
        ]);
        StorageManager.calculateStreak.mockResolvedValue(2);
        Achievements.getAchievementsWithStatus.mockResolvedValue([
            { id: 'first_break', name: 'First Steps', icon: '🎯', description: 'Take your first break', unlocked: true },
            { id: 'break_master', name: 'Break Master', icon: '💪', description: 'Take 10 breaks in one day', unlocked: false },
        ]);
        Achievements.calculateTotalScore.mockResolvedValue({
            achievement_points: 100, break_points: 60, streak_points: 100, health_bonus: 95, total: 355
        });
        Achievements.getUserStats.mockResolvedValue({
            streak: 2, health_score: 95, total_breaks: 11
        });
        jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    describe('exportAsTXT', () => {
        it('should generate a formatted weekly report and trigger download', async () => {
            const result = await ExportManager.exportAsTXT();

            expect(result.success).toBe(true);
            expect(result.format).toBe('TXT');
        });

        it('should handle export failure', async () => {
            jest.spyOn(ExportManager, 'getAllData').mockRejectedValueOnce(new Error('Failed to get data'));
            const result = await ExportManager.exportAsTXT();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to get data');
        });
    });

    describe('exportAsJSON', () => {
        it('should generate raw JSON data and trigger download', async () => {
            const result = await ExportManager.exportAsJSON();

            expect(result.success).toBe(true);
            expect(result.format).toBe('JSON');
        });
    });

    describe('exportAsCSV', () => {
        it('should generate CSV data and trigger download', async () => {
            const result = await ExportManager.exportAsCSV();

            expect(result.success).toBe(true);
            expect(result.format).toBe('CSV');
        });
    });
});
