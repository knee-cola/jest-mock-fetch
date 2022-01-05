module.exports = {
    "testEnvironment": 'jsdom',
    "name": "mock-fetch",
    "verbose": true,
    "testRegex": "/test/.*\\.spec\\.(ts|tsx|js)$",
    "moduleFileExtensions": [
        "ts",
        "tsx",
        "js"
    ],
    "transform": {
        "\\.tsx?$": "ts-jest"
    }
};