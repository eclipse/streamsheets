'use strict';

module.exports = {
	entry: './index.js',
	target: 'web',
	output: {
		filename: 'jsg-core.js',
		library: 'JSG',
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	module: {
		loaders: [{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader',
			query: {
				presets: ['es2015']
			}
		}]
	}
};
