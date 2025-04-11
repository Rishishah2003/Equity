const path = require('path');
 
module.exports = {
  // 🔧 Add entry, output etc. if not already present
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/', // ⚠️ Important for React Router
  },
 
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
    extensions: ['.js', '.json'],
  },
 
  devServer: {
    static: path.join(__dirname, 'dist'), // Your output folder
    compress: true,
    port: 3000,
    historyApiFallback: true, // ✅ The key fix for your issue!
  },
};