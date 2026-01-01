const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  mode: 'production',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, '../webview-dist'),
    filename: 'bundle.js',
    clean: true,
    globalObject: 'self',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [/node_modules/, /\.test\.tsx?$/, /__tests__/],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.ttf$/,
        type: 'asset/resource'
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
    }),
  ],
  externals: {
    vscode: 'commonjs vscode'
  },
};