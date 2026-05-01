module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['./jest.setup.js'],
    testPathIgnorePatterns: [
      '/node_modules/',
      '/__tests__/fixtures/',
      String.raw`\.fixtures\.ts$`,
    ],
  };