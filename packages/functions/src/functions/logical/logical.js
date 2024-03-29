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
const { runFunction, terms: onTerms, values: { isEven } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors, ErrorInfo } = require('@cedalo/error-codes');
const { isType } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const runWith = (sheet, terms, logic) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.run(() => {
			let error;
			let res;
			onTerms.iterateValues(sheet, terms, (value, err) => {
				error = error || err;
				const bool = convert.toBoolean(value);
				// ignore values which could not be converted
				if (bool != null) res = logic(res, bool);
			});
			return error || (res == null ? ERROR.VALUE : res);
		});

// boolean values: strings always true!! and 0 always false 
const and = (sheet, ...terms) => runWith(sheet, terms, (res, currbool) => (res == null ? currbool : res && currbool));

const or = (sheet, ...terms) => runWith(sheet, terms, (res, currbool) => res || currbool);

const termValue = (term) => term ? term.value : null;

const getCondition = (term) => {
	const value = term.value;
	return FunctionErrors.isError(value) || (isType.object(value) ? ERROR.VALUE : !!value);
};
const condition = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((cond) => getCondition(cond))
		.addNextTerm()
		.addNextTerm()
		.run((cond, truthyTerm, falsyTerm) => (cond ? termValue(truthyTerm) : termValue(falsyTerm)));

const not = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.run(() => {
			const val = convert.toBoolean(terms[0].value, ERROR.VALUE);
			const error = FunctionErrors.isError(val);
			return error || !val;
		});


const _switch = (sheet, ...terms) => {
	const error = !sheet || terms.length < 3 ? ErrorInfo.create(ERROR.ARGS) : undefined;
	if (!error) {
		let matchIndex = -1;
		const value = terms.shift().value;
		const defval = isEven(terms.length) ? ErrorInfo.create(ERROR.NA) : terms[terms.length - 1].value;
		terms.some((term, index) => {
			// index must be even
			matchIndex = (term.value === value && isEven(index)) ? index : -1;
			return matchIndex > -1;
		});
		return matchIndex > -1 ? terms[matchIndex + 1].value : defval;
	}
	return error;
};


module.exports = {
	AND: and,
	IF: condition,
	NOT: not,
	OR: or,
	SWITCH: _switch
};
