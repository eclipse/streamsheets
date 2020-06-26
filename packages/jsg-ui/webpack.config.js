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
	entry: './index.js',
	target: 'web',
	output: {
		filename: 'jsg-3.0.0.nolibs.js',
		path: path.resolve(__dirname, 'dist'),
		library: 'JSG',
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				include: [
					path.join(__dirname, 'index.js'),
					path.join(__dirname, 'src'),
					path.join(__dirname, '..', 'parser'),
					path.join(__dirname, '..', 'jsg-core'),
					path.join(__dirname, 'node_modules', 'parser'),
					path.join(__dirname, 'node_modules', 'jsg-core')
				],
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['env']
					}
				}
			}
		]
	}
};
