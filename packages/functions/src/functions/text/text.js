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
const logger = require('../../logger').create({ name: 'TEXT()' });
const { getCodePage } = require('../../codepages');
const { runFunction, terms: onTerms } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { locale: Locales } = require('@cedalo/machine-core');
const { NumberFormatter } = require('@cedalo/number-format');
const { wildcards } = require('../../utils');

const ERROR = FunctionErrors.code;

const getMachineLocale = (sheet) => {
	const machine = sheet.machine;
	const locale = machine ? Locales.get(machine.locale) : undefined;
	return locale || Locales.get('en');
};

const getValueLocale = (localeStr) => {
	localeStr = localeStr && localeStr.toLowerCase();
	return localeStr ? Locales.get(localeStr) || ERROR.VALUE : undefined;
};

const formatString = (term) => {
	const value = term.value;
	return typeof value === 'string' && value.length > 0 ? value : null;
};

// TODO rename and move to utilities, it mght be is usefull for others too...
const getValue = (value) => {
	if (value != null && value.start && value.cellAt) {
		const cell = value.cellAt(value.start);
		return cell != null ? getValue(cell.value) : null;
	}
	return value;
};

const toMinInteger = (term, min, defVal) => {
	const nr = term ? Math.round(convert.toNumber(term.value, defVal)) : defVal;
	return nr >= min ? nr : ERROR.VALUE;
};

// array splice for string:
const splice = (str, index, deleteCount, element) =>
	str.slice(0, index) + element + str.slice(index + deleteCount);

// DL-1313: do not want to encode any possible RegEx characters...
const subInStr = (str, replacestr, replacement, occurrence) => {
	if (occurrence !== 0) {
		const parts = str.split(replacestr);
		str = parts.reduce((res, curr, index) =>
			res != null
				? `${res}${
						occurrence < 0 || index === occurrence
							? replacement
							: replacestr
				  }${curr}`
				: curr
		);
	}
	return str;
};

const getSearchRegExFromContext = (context, str) => {
	let regex = context.regex;
	if (!regex) {
		regex = wildcards.toRegExp(str, 'g');
		context.regex = regex;
	}
	return regex;
}
const doFind = (regex, instr, atpos) => {
	if (atpos > 0) {
		regex.lastIndex = atpos - 1;
		const matches = regex.exec(instr);
		const index =  matches != null ? matches.index : -1;
		return index < 0 ? ERROR.VALUE : index + 1;
	}
	return ERROR.VALUE;
};

// printable ASCII characters are in range 32-126 (space - ~) )
// const CLEAN_REGEX = /[^\x20-\x7E]+/g;
// eslint-disable-next-line no-control-regex
const CLEAN_REGEX = /[\x00-\x1F]+/g; // <-- excel only strips characters between 0-31
// eslint-disable-next-line no-control-regex
const CLEAN_REGEX_EXTENDED = /[\x00-\x1F|\x7F|\x81|\x8D|\x8F|\x90|\x9D]+/g


const char = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((nr) => convert.toNumber(nr.value, ERROR.VALUE))
		.mapNextArg((codepage) => codepage ? convert.toString(codepage.value, 'ansi') : 'ansi')
		.run((nr, codepage) => {
			nr = Math.floor(nr);
			codepage = getCodePage(codepage);
			if (!codepage) return ERROR.INVALID_PARAM;
			return (nr > 0 && nr < 256) ? String.fromCharCode(codepage.toUniCode(nr)) : ERROR.VALUE;
		});

const clean = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((str) => convert.toString(str.value, ''))
		.mapNextArg((extended) => convert.toBoolean(extended && extended.value, false))
		.run((str, extended) => {
			const regex = extended ? CLEAN_REGEX_EXTENDED : CLEAN_REGEX;
			return str.replace(regex, '');
		});


const code = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((str) => convert.toString(str.value, ERROR.VALUE))
		.mapNextArg((codepage) => codepage ? convert.toString(codepage.value, 'ansi') : 'ansi')
		.run((str, codepage) => {
			if (str.length > 0) {
				codepage = getCodePage(codepage);
				if (!codepage) return ERROR.INVALID_PARAM;
				const chcode = codepage.fromUniCode(str.charCodeAt(0));
				return chcode != null ? Number(chcode) : undefined;
			}
			return ERROR.VALUE;
		});

const concat = (sheet, ...terms) =>
	runFunction(sheet, terms).run(() => {
		let error;
		let result = '';
		onTerms.iterateAllTermsValues(sheet, terms, (value, err) => {
			error = error || err || (Number.isNaN(value) ? ERROR.VALUE : null);
			if (!error) result += value != null ? value : '';
		});
		return error || result;
	});

const find = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.withMaxArgs(3)
		.mapNextArg((str) => convert.toString(str.value, ''))
		.mapNextArg((instr) => convert.toString(instr.value, ''))
		.mapNextArg((startAt) => (startAt ? convert.toNumber(startAt.value, 1) : 1))
		.run((str, instr, startAt) => {
			const regex = getSearchRegExFromContext(find.context, str);
			return doFind(regex, instr, startAt);
		});

const left = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((str) => convert.toString(str.value, ''))
		.mapNextArg((length) => toMinInteger(length, 0, 1))
		.run((str, length) => str.substr(0, length));

const len = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((str) => convert.toString(str.value, ''))
		.run((str) => str.length);

const mid = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(3)
		.mapNextArg((str) => convert.toString(str.value, ''))
		.mapNextArg((start) => toMinInteger(start, 1, 1))
		.mapNextArg((length) => toMinInteger(length, 0, 0))
		.run((str, start, length) => str.substr(start - 1, length));

const replace = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(4)
		.mapNextArg((str) => convert.toString(str.value, ''))
		.mapNextArg((start) => toMinInteger(start, 1, 1))
		.mapNextArg((length) => toMinInteger(length, 0, 0))
		.mapNextArg((replacement) => convert.toString(replacement.value, ''))
		.run((str, start, length, replacement) =>
			splice(str, start - 1, length, replacement)
		);

const rept = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(2)
		.mapNextArg((str) => convert.toString(str.value, ''))
		.mapNextArg((times) => toMinInteger(times, 0, 0))
		.run((str, times) => str.repeat(times));

const right = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((str) => convert.toString(str.value, ''))
		.mapNextArg((length) => toMinInteger(length, 0, 1))
		.run((str, length) => str.substr(-length, length));

const search = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.withMaxArgs(3)
		.mapNextArg((str) => convert.toString(str.value, '').toLowerCase())
		.mapNextArg((instr) => convert.toString(instr.value, '').toLowerCase())
		.mapNextArg((startAt) => toMinInteger(startAt, 0, 1))
		.run((str, instr, startAt) => {
			const regex = getSearchRegExFromContext(search.context, str);
			return doFind(regex, instr, startAt);
		});

const substitute = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.withMaxArgs(4)
		.mapNextArg((str) => convert.toString(str.value, ''))
		.mapNextArg((replacestr) => convert.toString(replacestr.value, ERROR.VALUE))
		.mapNextArg((replacement) => convert.toString(replacement.value, ERROR.VALUE))
		.mapNextArg((occurrence) => toMinInteger(occurrence, -1, -1))
		.run((str, replacestr, replacement, occurrence) =>
			subInStr(str, replacestr, replacement, occurrence)
		);

const text = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.withMaxArgs(3)
		// number can be anything, i.e. integer, float, date or string...
		.mapNextArg((number) => {
			const value = getValue(number.value);
			return value != null ? value : 0;
		})
		.mapNextArg((format) => formatString(format) || ERROR.INVALID_PARAM)
		.mapNextArg(
			(locale) => getValueLocale(locale && convert.toString(locale.value)) || getMachineLocale(sheet) || ERROR.VALUE
		)
		.run((number, format, locale) => {
			let res = ERROR.INVALID_PARAM;
			try {
				// const locale = getMachineLocale(sheet);
				format = Locales.convert.nrFormatString(format, locale);
				res = NumberFormatter.formatNumber(format, number, null, locale.code.short).formattedValue;
			} catch (ex) {
				/* ignore, will return error code */
				logger.error(ex.message); // tmp. print out error message, we might change return error code too
			}
			return res;
		});

const unichar = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((nr) => convert.toNumber(nr.value, ERROR.VALUE))
		.run((nr) => {
			nr = Math.floor(nr);
			return nr > 0 && nr < 65536 ? String.fromCharCode(nr) : ERROR.VALUE;
		});

const unicode = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((str) => convert.toString(str.value, ERROR.VALUE))
		.run((str) => {
			const chcode = str.length > 0 ? str.charCodeAt(0) : NaN;
			return isNaN(chcode) ? ERROR.VALUE : chcode;
		});
	
const value = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((number) => number.value)
		.mapNextArg((locale) =>	getValueLocale(locale && convert.toString(locale.value)))
		.run((number, locale) => {
			let nr = typeof number === 'number' ? number : null;
			if (nr == null) {
				nr = convert.toString(number);
				if (nr != null) nr = convert.toNumber(Locales.convert.nrString(nr, locale || getMachineLocale(sheet)));
			}
			return nr != null ? nr : ERROR.VALUE;
		});

module.exports = {
	CHAR: char,
	CLEAN: clean,
	CODE: code,
	CONCAT: concat,
	FIND: find,
	LEFT: left,
	LEN: len,
	MID: mid,
	REPLACE: replace,
	REPT: rept,
	RIGHT: right,
	SEARCH: search,
	SUBSTITUTE: substitute,
	TEXT: text,
	UNICHAR: unichar,
	UNICODE: unicode,
	VALUE: value
};
