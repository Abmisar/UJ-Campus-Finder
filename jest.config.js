module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'backend/**/*.js',
        'js/validation.js',
        '!backend/server.js'   // entry point only starts the server — skip coverage
    ],
    coverageDirectory: 'coverage',
    testTimeout: 10000
};
