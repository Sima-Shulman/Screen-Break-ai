import '@testing-library/jest-dom';
import React from 'react';
import { act } from '@testing-library/react';

// Make React available globally for JSX
global.React = React;

// Export act for use in tests
global.act = act;

// Mock chrome API globally
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
  },
};