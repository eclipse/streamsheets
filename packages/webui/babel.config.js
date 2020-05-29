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
module.exports = (api) => {
	const presets = [
		'@babel/preset-env',
		'@babel/preset-react',
	];
	const plugins = [
		'@babel/plugin-proposal-class-properties',
		'@babel/plugin-transform-instanceof',
	];
	if (api.env('development')) {
		plugins.push(['react-intl', {
			messagesDir: './build/messages/',
		}]);
		plugins.push('@babel/plugin-proposal-object-rest-spread');
	}

	return {
		presets,
		plugins,
	};
};
