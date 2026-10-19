const fs = require('node:fs');
const webpack = require('webpack');

module.exports = function (config) {
  // Chrome instalado; CHROME_BIN permite indicar otra ubicación en el laboratorio.
  if (!process.env.CHROME_BIN && process.platform === 'win32') {
    const candidates = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]
      .filter(Boolean).map(root => `${root}/Google/Chrome/Application/chrome.exe`);
    const executable = candidates.find(file => fs.existsSync(file));
    if (executable) process.env.CHROME_BIN = executable;
  }
  config.set({
    frameworks: ['jasmine', 'webpack'],
    files: ['tests/entry.js', { pattern: 'public/images/skins/*.png', included: false, watched: false }],
    proxies: { '/images/': '/base/public/images/' },
    preprocessors: { 'tests/entry.js': ['webpack'] },
    webpack: {
      mode: 'development',
      devtool: 'inline-source-map',
      resolve: { extensions: ['.js', '.jsx', '.json'] },
      module: {
        rules: [{
          test: /\.[jt]sx?$/, exclude: /node_modules/,
          type: 'javascript/auto',
          resolve: { fullySpecified: false },
          use: { loader: 'babel-loader', options: {
            presets: [['@babel/preset-react', { runtime: 'automatic' }]],
            plugins: [['babel-plugin-istanbul', {
              include: ['src/**/*.{js,jsx}'], exclude: ['src/main.jsx', 'src/data/**'],
            }]],
          } },
        }, { test: /\.css$/, type: 'asset/source' }],
      },
      plugins: [new webpack.DefinePlugin({ 'import.meta.env.BASE_URL': JSON.stringify('/') })],
      stats: 'errors-warnings',
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      dir: 'coverage', subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }, { type: 'json-summary' }],
      check: { global: { statements: 60, branches: 60, functions: 60, lines: 60 } },
    },
    client: { jasmine: { random: false, timeoutInterval: 20000 } },
    browsers: ['ChromeHeadless'],
    singleRun: true,
    browserNoActivityTimeout: 60000,
    browserConsoleLogOptions: { level: 'error', terminal: true },
  });
};
