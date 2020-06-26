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
const { memoize } = require('@cedalo/commons');

const replaceRegEx = memoize.func((str) => new RegExp(str, 'g'), (str) => str);
const replaceAllWith = (replace, replacement, str) => {
	if (replace === '.') replace = '\\.';
	return str.replace(replaceRegEx(replace), replacement);
};

const nrChecker = memoize.func(
	(separators) => {
		const decimal = separators.decimal === '.' ? '\\.' : separators.decimal;
		const thousand = separators.thousand === '.' ? '\\.' : separators.thousand;
		return new RegExp(`^[-+]?(\\d{1,3})+(${thousand}\\d{3})*(${decimal}\\d*)?$`);
	},
	(separators) => `${separators.decimal}${separators.thousand}`
);

const isValidNr = (str, separators) => {
	const rx = nrChecker(separators);
	return rx.test(str);
};
const nrString = (str = '', locale) => {
	let nr;
	const separators = locale.separators;
	str = str.trim();
	if (isValidNr(str, separators)) {
		nr = replaceAllWith(separators.thousand, '', str);
		nr = replaceAllWith(separators.decimal, '.', nr);
	}
	return nr;
};

const nrFormatString = (str, locale) => {
	const separators = locale.separators;
	let format = replaceAllWith(separators.decimal, ';', str);
	format = replaceAllWith(separators.thousand, ',', format);
	return replaceAllWith(';', '.', format);
};

module.exports = {
	nrString,
	nrFormatString
};
