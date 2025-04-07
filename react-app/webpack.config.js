const path = require('path');

module.exports = {
  resolve: {
    fallback: process.browser
      ? {
          "path": require.resolve("path-browserify"),
          "crypto": require.resolve("crypto-browserify"),
          "stream": require.resolve("stream-browserify"),
          "querystring": require.resolve("querystring-es3"),
          "fs": false,
          "http": false,
          "net": false
        }
      : {},
    extensions: ['.js', '.json'], // Ensures JS and JSON files are resolved properly
  },
};
