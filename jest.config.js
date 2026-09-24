module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  moduleNameMapper: { "\\.(scss|css)$": "identity-obj-proxy" },
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/index.js", "!src/data/**"],
};
