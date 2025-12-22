export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx'],
  testMatch: ['**/tests/**/*.(js|jsx)', '**/*.(test|spec).(js|jsx)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^lucide-react$': '<rootDir>/mocks/lucide-react.js',
    '^recharts$': '<rootDir>/mocks/recharts.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!popup/dist/**',
  ],
};