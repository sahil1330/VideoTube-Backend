export default {
  testEnvironment: 'node',
  // Removing extensionsToTreatAsEsm: ['.js'] as it's already inferred from package.json type: module
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  verbose: true,
};