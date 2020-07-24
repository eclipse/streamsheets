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
const {	functions: { pipe } } = require('@cedalo/commons');

/*
 EXCEL wildcards:
	* one or more character
	? single character 
	~ escape character, i.e. use following character not as wildcard
		~* => * 
		~? => ?
		~~ => ~
*/

// adapted from from MDN
const ESCAPE_REGEX = /[.+\-^${}()|[\]\\]/g; // all but * and ?
const WILDCARDS_REGEX = /~\*|(?<!~)\*|~\?|(?<!~)\?|~~/g;

const MAP = {
	'*': '.*',
	'~*': '\\*',
	'?': '.{1}',
	'~?': '\\?',
	'~~': '~'
};
const mapCharacters = (match) => MAP[match] || match;
const escapeRegExChacraters = (str) => str.replace(ESCAPE_REGEX, '\\$&');
const mapExcelWildCards = (str) => str.replace(WILDCARDS_REGEX, mapCharacters);
const boundRegexStr = (str) => `^${str}$`;
const toRegExStr = pipe(escapeRegExChacraters, mapExcelWildCards);
const toBoundedRegExStr = pipe(toRegExStr, boundRegexStr);
const toRegExp = (str, flags) => new RegExp(toRegExStr(str), flags);
const toBoundedRegExp = (str) => new RegExp(toBoundedRegExStr(str));

module.exports = {
	toBoundedRegExp,
	toBoundedRegExStr,
	toRegExp,
	toRegExStr
};
