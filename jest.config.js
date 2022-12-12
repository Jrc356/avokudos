module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['**/*.js'],
  verbose: true,
  coveragePathIgnorePatterns: [
    'node_modules',
    'test',
    'coverage',
    'jest.config.js',
    'index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
}
