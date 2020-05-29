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
module.exports = {
	// parser: '@typescript-eslint/parser', // Specifies the ESLint parser
	extends: [
		'cedalo', 'prettier'
	],
	parserOptions: {
		ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
		sourceType: 'module' // Allows for the use of imports
	},
	env: {
		browser: true,
		node: true
	},
	rules: {
		// Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
		'global-require': 1,
		'no-undef': 1,
		'no-unused-vars': 1
	}
};
