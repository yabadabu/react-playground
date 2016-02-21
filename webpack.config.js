var path = require('path');
var webpack = require('webpack');
 
module.exports = {
  entry: './index.js',
  output: { path: __dirname, filename: 'bundle.js' },
  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      },
      {
        test: /(\.css|\.scss)$/,
        include: path.join(__dirname, 'src'),
        loaders: ['style', 'css?sourceMap', 'sass?sourceMap']
      }
    ]
  },
};