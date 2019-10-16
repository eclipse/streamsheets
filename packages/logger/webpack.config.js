'use strict';

const path = require('path');

module.exports = {
	entry: './src/Logger.js',
	target: 'web',
	output: {
		filename: '@cedalo/logger-1.0.0.js',
		path: path.resolve(__dirname, 'dist'),
		library: '@cedalo/logger',
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	module: {
		loaders: [{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader',
			query: {
				presets: ['env']
			}
		}],
		noParse: [/dtrace-provider$/, /safe-json-stringify$/, /mv/]
	}
};
