'use strict';

const path = require('path');

module.exports = {
	entry: './src/client/web/WebGatewayClient.js',
	target: 'web',
	output: {
		filename: '@cedalo/gateway-client-1.0.0.js',
		path: path.resolve(__dirname, 'dist'),
		library: '@cedalo/gateway-client',
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
		}]
	}
};
