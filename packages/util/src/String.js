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
const UNWRAP_REGEX = /^["'`´”“]+|["'`´”“]+$/g;

const capitalize = (s) => {
	if (typeof s === 'string' && s.length > 0) {
		return `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
	}
	return '';
};

const isEmpty = (s) => !s || s.length === 0;

// removes any quotes from beginning and end of given string
const unwrap = (s) => s ? s.replace(UNWRAP_REGEX, '') : s;

module.exports = {
	capitalize,
	isEmpty,
	unwrap
};
