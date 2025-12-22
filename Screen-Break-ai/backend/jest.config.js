export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@google/genai$': '<rootDir>/__mocks__/@google/genai.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  globals: {
    'process.env': {
      NODE_ENV: 'test'
    }
  }
};