// Mock chrome API before importing the script
import { resetChromeMocks, mockStorage } from '../../mocks/chrome';

// Helper function to simulate synchronous actions
const act = (callback) => {
    callback();
};

// Mock the script under test
// To ensure a clean state and avoid side effects from previous imports in other tests,
// we'll explicitly re-import it within the describe block and manage its listeners.
let activityTracker;

describe('Content Script (activity-tracker.js)', () => {
    let addEventListenerSpy;
    let removeEventListenerSpy;
    let originalSetInterval;
    let originalClearInterval;
    let intervalId;

    beforeEach(() => {
        resetChromeMocks();
        jest.clearAllMocks();

        // Mock window.addEventListener and window.removeEventListener
        addEventListenerSpy = jest.spyOn(window, 'addEventListener').mockImplementation(() => {});
        removeEventListenerSpy = jest.spyOn(window, 'removeEventListener').mockImplementation(() => {});

        // Mock setInterval and clearInterval
        originalSetInterval = global.setInterval;
        originalClearInterval = global.clearInterval;
        global.setInterval = jest.fn(() => 123); // Return a dummy ID
        global.clearInterval = jest.fn();

        // Ensure chrome.runtime.id is set for the content script check
        global.chrome.runtime.id = 'test-extension-id';
        global.chrome.runtime.lastError = undefined;

        // Re-import the script to ensure fresh listeners and intervals for each test
        // This is a common pattern for testing content scripts that attach global listeners
        jest.isolateModules(() => {
            activityTracker = require('../../content/activity-tracker');
        });
        intervalId = global.setInterval.mock.results[0].value; // Capture the interval ID
        
        // Initial setup for chrome.storage.local
        mockStorage.total_activity = { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0 };
    });

    afterEach(() => {
        // Restore original functions
        global.setInterval = originalSetInterval;
        global.clearInterval = originalClearInterval;
        jest.restoreAllMocks();
        // Clean up any listeners that might have been added by the script
        // In a real browser, the script would be re-injected, cleaning up implicitly.
        // Here we rely on the re-import and mock cleanup.
    });

    it('should attach event listeners on load', () => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
        expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), expect.objectContaining({ passive: true }));
        expect(global.setInterval).toHaveBeenCalledTimes(1);
    });

    it('should increment clicks on click event', async () => {
        const clickHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'click')[1];
        
        act(() => {
            clickHandler();
            clickHandler();
        });

        // Simulate interval firing
        const intervalCallback = global.setInterval.mock.calls[0][0];
        
        // The content script calls chrome.storage.local.get with a default value object
        // We need to ensure our mock handles this correctly
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            // The content script passes { total_activity: {} } as default
            if (typeof keys === 'object' && keys.total_activity !== undefined) {
                callback({ total_activity: keys.total_activity }); // Return the default
            } else {
                callback({ total_activity: { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0 } });
            }
        });
        
        await intervalCallback();
        
        expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            total_activity: expect.objectContaining({
                clicks: 2,
                screenTime: 0,
            })
        }, expect.any(Function));
    });

    it('should increment keystrokes on keydown event', async () => {
        const keydownHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'keydown')[1];
        
        act(() => {
            keydownHandler();
            keydownHandler();
            keydownHandler();
        });

        // Simulate interval firing
        const intervalCallback = global.setInterval.mock.calls[0][0];
        
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            if (typeof keys === 'object' && keys.total_activity !== undefined) {
                callback({ total_activity: keys.total_activity });
            } else {
                callback({ total_activity: { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0 } });
            }
        });
        
        await intervalCallback();
        
        expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            total_activity: expect.objectContaining({
                keystrokes: 3,
                screenTime: 0,
            })
        }, expect.any(Function));
    });

    it('should increment scrollDistance on scroll event', async () => {
        const scrollHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'scroll')[1];
        
        // Mock window.scrollY to simulate scrolling
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

        act(() => {
            window.scrollY = 100; // Scroll down
            scrollHandler();
            window.scrollY = 150; // Scroll more
            scrollHandler();
        });
        
        // Simulate interval firing
        const intervalCallback = global.setInterval.mock.calls[0][0];
        
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            if (typeof keys === 'object' && keys.total_activity !== undefined) {
                callback({ total_activity: keys.total_activity });
            } else {
                callback({ total_activity: { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0 } });
            }
        });
        
        await intervalCallback();
        
        expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            total_activity: expect.objectContaining({
                scrollDistance: 150, // 100 + 50
                screenTime: 0,
            })
        }, expect.any(Function));
    });

    it('should reset metrics after saving to storage', async () => {
        const clickHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'click')[1];
        act(() => clickHandler());

        // First interval fire
        const intervalCallback = global.setInterval.mock.calls[0][0];
        
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            if (typeof keys === 'object' && keys.total_activity !== undefined) {
                callback({ total_activity: keys.total_activity });
            } else {
                callback({ total_activity: { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0 } });
            }
        });
        
        await intervalCallback();
        expect(chrome.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({
            total_activity: expect.objectContaining({ clicks: 1 })
        }), expect.any(Function));

        // Trigger another click
        act(() => clickHandler());

        // Second interval fire - mock storage to return updated values
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            if (typeof keys === 'object' && keys.total_activity !== undefined) {
                callback({ total_activity: { clicks: 1, keystrokes: 0, scrollDistance: 0, screenTime: 0 } });
            } else {
                callback({ total_activity: { clicks: 1, keystrokes: 0, scrollDistance: 0, screenTime: 0 } });
            }
        });
        
        await intervalCallback();
        // Total clicks should now be 2, not 1 (from previous interval) + 1 (from current interval)
        // This confirms internal metrics were reset
        expect(chrome.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({
            total_activity: expect.objectContaining({ clicks: 2 })
        }), expect.any(Function));
    });

    it('should correctly accumulate total_activity over time', async () => {
        const clickHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'click')[1];
        const keydownHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'keydown')[1];

        // Initial activity
        act(() => {
            clickHandler();
            keydownHandler();
        });

        // First save
        const intervalCallback = global.setInterval.mock.calls[0][0];
        
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            if (typeof keys === 'object' && keys.total_activity !== undefined) {
                callback({ total_activity: keys.total_activity });
            } else {
                callback({ total_activity: { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0 } });
            }
        });
        
        await intervalCallback();
        expect(chrome.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({
            total_activity: expect.objectContaining({ clicks: 1, keystrokes: 1, screenTime: 0 })
        }), expect.any(Function));

        // More activity
        act(() => {
            clickHandler();
            clickHandler();
            keydownHandler();
        });

        // Second save - mock storage to return updated values
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            if (typeof keys === 'object' && keys.total_activity !== undefined) {
                callback({ total_activity: { clicks: 1, keystrokes: 1, scrollDistance: 0, screenTime: 0 } });
            } else {
                callback({ total_activity: { clicks: 1, keystrokes: 1, scrollDistance: 0, screenTime: 0 } });
            }
        });
        
        await intervalCallback();
        // After second save, total clicks should be 1 (from first) + 2 (from second) = 3
        expect(chrome.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({
            total_activity: expect.objectContaining({ clicks: 3, keystrokes: 2, screenTime: 0 })
        }), expect.any(Function));
    });
});
