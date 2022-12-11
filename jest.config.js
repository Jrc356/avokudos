module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ["**/*.js"],
  verbose: true,
  coveragePathIgnorePatterns: [
    "node_modules",
    "test",
    "coverage",
    "jest.config.js",
    "index.js",
  ],
};
