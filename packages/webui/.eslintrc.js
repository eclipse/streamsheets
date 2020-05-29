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
	extends: ['@cedalo/eslint-config/react'],
	rules: {
		'linebreak-style': 0,
		'no-console': 0,
		'import/no-named-as-default': 0,
		'import/prefer-default-export': 0,
		'jsx-a11y/img-has-alt': 0,
		'jsx-a11y/no-static-element-interactions': 0,
		'react/prefer-stateless-function': 0,
		'no-debugger': 0,
		'spaced-comment': 0,
		'lines-around-directive': 0
	}
};
