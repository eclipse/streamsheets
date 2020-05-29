/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
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
