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
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	target: 'node',
	mode: 'production',
	entry: {
		app: ['./start.js']
	},
	output: {
		path: path.resolve(__dirname),
		filename: 'start.min.js'
	},
	externals: [
		nodeExternals({
			modulesDir: path.resolve(__dirname, '..', '..', 'node_modules'),
			whitelist: [/^@cedalo/]
		})
	],
	optimization: {
		minimizer: [new TerserPlugin()]
	}
};
