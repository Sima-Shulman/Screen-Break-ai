// __mocks__/chrome.js
// This mock aims to provide a comprehensive, resettable mock for the Chrome API.

let mockStorage = {};
let mockAlarms = {};
let mockNotifications = {};
let mockMessages = [];
let mockTabs = [];

const createMockChrome = () => {
    return {
        storage: {
            local: {
                get: jest.fn((keys, callback) => {
                    let result = {};
                    if (keys === null) {
                        result = { ...mockStorage };
                    } else if (Array.isArray(keys)) {
                        keys.forEach(key => {
                            if (mockStorage.hasOwnProperty(key)) {
                                result[key] = mockStorage[key];
                            }
                        });
                    } else if (typeof keys === 'string') {
                        if (mockStorage.hasOwnProperty(keys)) {
                            result[keys] = mockStorage[keys];
                        }
                    } else if (typeof keys === 'object') { // Handle default values in keys object
                        for (const key in keys) {
                            result[key] = mockStorage.hasOwnProperty(key) ? mockStorage[key] : keys[key];
                        }
                    }
                    callback(result);
                }),
                set: jest.fn((items, callback) => {
                    Object.assign(mockStorage, items);
                    // Simulate onChanged event
                    const changes = {};
                    for (const key in items) {
                        changes[key] = {
                            oldValue: undefined, // Simpler mock, can be improved if needed
                            newValue: items[key]
                        };
                    }
                    if (chrome.storage.onChanged.hasListeners()) {
                        chrome.storage.onChanged._listeners.forEach(listener => listener(changes, 'local'));
                    }
                    if (callback) callback();
                }),
                remove: jest.fn((keys, callback) => {
                    process.nextTick(() => {
                        const keysToRemove = Array.isArray(keys) ? keys : [keys];
                        keysToRemove.forEach(key => {
                            delete mockStorage[key];
                        });
                        if (callback) callback();
                    });
                }),
            },
            onChanged: {
                _listeners: [],
                addListener: jest.fn(listener => {
                    chrome.storage.onChanged._listeners.push(listener);
                }),
                removeListener: jest.fn(listener => {
                    chrome.storage.onChanged._listeners = chrome.storage.onChanged._listeners.filter(l => l !== listener);
                }),
                hasListeners: jest.fn(() => chrome.storage.onChanged._listeners.length > 0),
            },
        },
        runtime: {
            onMessage: {
                _listeners: [],
                addListener: jest.fn(listener => {
                    chrome.runtime.onMessage._listeners.push(listener);
                }),
                removeListener: jest.fn(listener => {
                    chrome.runtime.onMessage._listeners = chrome.runtime.onMessage._listeners.filter(l => l !== listener);
                }),
                hasListeners: jest.fn(() => chrome.runtime.onMessage._listeners.length > 0),
                // Helper to simulate receiving a message
                triggerMessage: async (message, sender = {}, sendResponse = jest.fn()) => {
                    const results = [];
                    for (const listener of chrome.runtime.onMessage._listeners) {
                        const result = listener(message, sender, sendResponse);
                        if (result instanceof Promise) {
                            results.push(await result);
                        } else {
                            results.push(result);
                        }
                    }
                    return results;
                },
            },
            sendMessage: jest.fn(async (message, options) => {
                mockMessages.push(message);
                // Simulate sending a message and potentially getting a response
                // For testing, we might want to manually resolve this promise in some scenarios
                return Promise.resolve({ status: 'mock_response' });
            }),
            onInstalled: {
                _listeners: [],
                addListener: jest.fn(listener => {
                    chrome.runtime.onInstalled._listeners.push(listener);
                }),
                trigger: async () => {
                    for (const listener of chrome.runtime.onInstalled._listeners) {
                        await listener({ reason: 'install' });
                    }
                },
            },
            getURL: jest.fn(path => `chrome-extension://test-extension-id/${path}`),
            lastError: undefined,
        },
        alarms: {
            create: jest.fn((name, info) => {
                mockAlarms[name] = info;
            }),
            onAlarm: {
                _listeners: [],
                addListener: jest.fn(listener => {
                    chrome.alarms.onAlarm._listeners.push(listener);
                }),
                removeListener: jest.fn(listener => {
                    chrome.alarms.onAlarm._listeners = chrome.alarms.onAlarm._listeners.filter(l => l !== listener);
                }),
                hasListeners: jest.fn(() => chrome.alarms.onAlarm._listeners.length > 0),
                trigger: async (alarm) => {
                    for (const listener of chrome.alarms.onAlarm._listeners) {
                        await listener(alarm);
                    }
                },
            },
            clear: jest.fn(),
            getAll: jest.fn(() => Promise.resolve(Object.entries(mockAlarms).map(([name, info]) => ({ name, ...info })))),
        },
        notifications: {
            create: jest.fn((notificationId, options, callback) => {
                mockNotifications[notificationId] = options;
                if (callback) callback(notificationId);
            }),
            clear: jest.fn((notificationId, callback) => {
                delete mockNotifications[notificationId];
                if (callback) callback(true);
            }),
            getAll: jest.fn(() => Promise.resolve(mockNotifications)),
            onClicked: {
                _listeners: [],
                addListener: jest.fn(listener => {
                    chrome.notifications.onClicked._listeners.push(listener);
                }),
                removeListener: jest.fn(listener => {
                    chrome.notifications.onClicked._listeners = chrome.notifications.onClicked._listeners.filter(l => l !== listener);
                }),
                hasListeners: jest.fn(() => chrome.notifications.onClicked._listeners.length > 0),
                trigger: async (notificationId) => {
                    for (const listener of chrome.notifications.onClicked._listeners) {
                        await listener(notificationId);
                    }
                },
            },
        },
        tabs: {
            create: jest.fn((options, callback) => {
                const newTab = { id: mockTabs.length + 1, ...options };
                mockTabs.push(newTab);
                if (callback) callback(newTab);
            }),
            getCurrent: jest.fn(() => Promise.resolve({ id: 1, url: 'http://example.com' })),
            query: jest.fn(() => Promise.resolve(mockTabs)),
        },
        downloads: {
            download: jest.fn((options, callback) => {
                if (callback) callback(1); // Simulate successful download
            }),
        },
        // Add other Chrome APIs as needed
        idle: {
            queryState: jest.fn(() => Promise.resolve('active')),
        },
    };
};

const resetChromeMocks = () => {
    mockStorage = {};
    mockAlarms = {};
    mockNotifications = {};
    mockMessages = [];
    mockTabs = [];

    // Reset all jest.fn() mocks
    const chromeMock = createMockChrome();
    for (const api in chromeMock) {
        for (const method in chromeMock[api]) {
            if (typeof chromeMock[api][method] === 'function' && chromeMock[api][method].mock) {
                chromeMock[api][method].mockClear();
            } else if (typeof chromeMock[api][method] === 'object' && chromeMock[api][method] !== null) {
                for (const subMethod in chromeMock[api][method]) {
                    if (typeof chromeMock[api][method][subMethod] === 'function' && chromeMock[api][method][subMethod].mock) {
                        chromeMock[api][method][subMethod].mockClear();
                    }
                }
            }
        }
    }
    // Also clear the listeners arrays manually
    chromeMock.storage.onChanged._listeners = [];
    chromeMock.runtime.onMessage._listeners = [];
    chromeMock.runtime.onInstalled._listeners = [];
    chromeMock.alarms.onAlarm._listeners = [];
    chromeMock.notifications.onClicked._listeners = [];
    
    // Ensure get/set/remove work with the reset mockStorage
    chromeMock.storage.local.get.mockImplementation((keys, callback) => {
        let result = {};
        if (keys === null) {
            result = { ...mockStorage };
        } else if (Array.isArray(keys)) {
            keys.forEach(key => {
                if (mockStorage.hasOwnProperty(key)) {
                    result[key] = mockStorage[key];
                }
            });
        } else if (typeof keys === 'string') {
            if (mockStorage.hasOwnProperty(keys)) {
                result[keys] = mockStorage[keys];
            }
        } else if (typeof keys === 'object') { // Handle default values in keys object
            for (const key in keys) {
                result[key] = mockStorage.hasOwnProperty(key) ? mockStorage[key] : keys[key];
            }
        }
        callback(result);
    });
    chromeMock.storage.local.set.mockImplementation((items, callback) => {
        Object.assign(mockStorage, items);
        // Simulate onChanged event
        const changes = {};
        for (const key in items) {
            changes[key] = {
                oldValue: undefined, // Simpler mock
                newValue: items[key]
            };
        }
        if (chromeMock.storage.onChanged.hasListeners()) {
            chromeMock.storage.onChanged._listeners.forEach(listener => listener(changes, 'local'));
        }
        if (callback) callback();
    });
    chromeMock.storage.local.remove.mockImplementation((keys, callback) => {
        const keysToRemove = Array.isArray(keys) ? keys : [keys];
        keysToRemove.forEach(key => {
            delete mockStorage[key];
        });
        if (callback) callback();
    });
    return chromeMock;
};

// Global chrome object for tests
global.chrome = createMockChrome();

// Export the reset function for use in beforeEach/afterEach
export { resetChromeMocks, mockStorage, mockAlarms, mockNotifications, mockMessages, mockTabs };