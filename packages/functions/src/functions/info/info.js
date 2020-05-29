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
const {	runFunction, values: { isEven } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { isType } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const valueOf = (term, defval) => {
	const val = term.value;
	return val != null ? val : defval;
};

const iferror = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(2)
		.run(() => {
			const value = valueOf(terms[0], '');
			const errvalue = valueOf(terms[1], '');
			return FunctionErrors.isError(value) ? errvalue : value;
		});

const iserr = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.run(() => {
			const value = terms.length ? terms[0].value : null;
			return value !== ERROR.NA && !!FunctionErrors.isError(value);
		});

const iserror = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.run(() => {
			const value = terms.length ? terms[0].value : null;
			return !!FunctionErrors.isError(value);
		});

const isna = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.run(() => {
			const value = terms.length ? terms[0].value : null;
			return value === ERROR.NA;
		});

const iseven = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((term) => (term ? convert.toNumber(term.value, ERROR.VALUE) : ERROR.VALUE))
		.run((value) => isEven(Math.floor(value)));

const isobject = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((term) => isType.object(term.value))
		.run((value) => !isEven(Math.floor(value)));

const isodd = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((term) => (term ? convert.toNumber(term.value, ERROR.VALUE) : ERROR.VALUE))
		.run((value) => !isEven(Math.floor(value)));


const na = (sheet, ...terms) =>	runFunction(sheet, terms).withArgCount(0).run(() => ERROR.NA);

module.exports = {
	IFERROR: iferror,
	ISERR: iserr,
	ISERROR: iserror,
	ISEVEN: iseven,
	ISNA: isna,
	ISOBJECT: isobject,
	ISODD: isodd,
	NA: na
};
