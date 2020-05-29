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
