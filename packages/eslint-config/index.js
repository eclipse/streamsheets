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
	extends: ['eslint-config-airbnb-base', 'eslint-config-prettier'].map(require.resolve),
	rules: {
		'no-tabs': 0,
		'class-methods-use-this': 0,
		'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
		'no-underscore-dangle': 0,
		'import/no-named-default': 0,
		strict: 0,
		'no-param-reassign': 0,
		'no-prototype-builtins': 0,
		// TODO: Fix the following
		'lines-between-class-members': 0,
		'prefer-destructuring': 0,
		'max-classes-per-file': 0,
		'import/order': 0,
		'no-restricted-globals': 0,
		'prefer-object-spread': 0,
		'spaced-comment': 0,
		'lines-around-directive': 0,
		'no-async-promise-executor': 1,
		'no-else-return': 1,
		'no-case-declarations': 1,
		'prefer-promise-reject-errors': 1,
		'no-buffer-constructor': 1,
		'import/no-cycle': 1,
		'no-useless-catch': 1,
		'getter-return': 1,
		'operator-assignment': 1,
		'no-self-assign': 1,
		'import/no-useless-path-segments': 1,
		'no-unused-vars': 1,
		'no-undef': 1
	},
	env: {
		node: true,
		jest: true
	}
	// compilerOptions: {
	// 	target: 'ES6',
	// 	module: 'commonjs',
	// },
};
