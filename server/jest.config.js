module.exports = {
  testEnvironment: 'node',
  globalSetup: './tests/helpers/globalSetup.js',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  testTimeout: 20000,
  verbose: true
};

