const {	runFunction, values: { isEven } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

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
			return Error.isError(value) ? errvalue : value;
		});

const iserr = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.run(() => {
			const value = terms.length ? terms[0].value : null;
			return value !== Error.code.NA && !!Error.isError(value);
		});

const iserror = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.run(() => {
			const value = terms.length ? terms[0].value : null;
			return !!Error.isError(value);
		});

const isna = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.run(() => {
			const value = terms.length ? terms[0].value : null;
			return value === Error.code.NA;
		});

const iseven = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.mapNextArg((term) => (term ? convert.toNumber(term.value, Error.code.VALUE) : Error.code.VALUE))
		.run((value) => isEven(Math.floor(value)));

const isodd = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.mapNextArg((term) => (term ? convert.toNumber(term.value, Error.code.VALUE) : Error.code.VALUE))
		.run((value) => !isEven(Math.floor(value)));

module.exports = {
	IFERROR: iferror,
	ISERR: iserr,
	ISERROR: iserror,
	ISEVEN: iseven,
	ISNA: isna,
	ISODD: isodd
};
