const path = require('path');

module.exports = {
  entry: './stage-director.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  }
};
