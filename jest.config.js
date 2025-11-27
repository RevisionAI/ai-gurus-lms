/** @type {import('jest').Config} */
const config = {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',

  // Use jsdom environment for React component tests
  testEnvironment: 'jsdom',

  // Setup files to run after Jest is initialized
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // Module path aliases (match tsconfig.json paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],

  // Transform ESM modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(uncrypto|@upstash)/)',
  ],

  // Transform TypeScript and ESM files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
    '^.+\\.mjs$': 'ts-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Coverage configuration
  collectCoverage: false, // Only collect when explicitly requested
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/types.ts',
    '!src/app/layout.tsx',
    '!src/app/providers.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout (10 seconds)
  testTimeout: 10000,
};

module.exports = config;
