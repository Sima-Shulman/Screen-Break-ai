import '@testing-library/jest-dom';
import React from 'react';
import { act } from '@testing-library/react';

// Make React available globally for JSX
global.React = React;

// Export act for use in tests
global.act = act;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock chrome API globally
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    lastError: null,
  },
  notifications: {
    create: jest.fn(),
    clear: jest.fn(),
    getPermissionLevel: jest.fn((callback) => callback('granted')),
    requestPermission: jest.fn((callback) => callback('granted')),
    onClicked: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
};