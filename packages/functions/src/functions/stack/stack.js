const StackHelper = require('./stackhelper');
const { runFunction, sheet: sheetutils } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

const toBooleanStrict = convert.from().boolean.toBoolean;
const toBoolean = (term, defval) => {
	const value = term ? term.value : undefined;
	return value != null ? toBooleanStrict(value, Error.code.VALUE) : defval;
};

const checkRangeHeight = (ranges) => {
	let error;
	ranges.some((range) => {
		error = Error.isError(range) || (range && range.height < 2 ? Error.code.INVALID_PARAM : undefined);
		return error != null;
	});
	return error || ranges;
};

const getTargetRange = (term, sheet) =>
	((term && term.value != null) ? (sheetutils.getCellRangeFromTerm(term, sheet) || Error.code.VALUE) : undefined);

const add = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.withMaxArgs(4)
		.mapNextArg(stackrange => sheetutils.getCellRangeFromTerm(stackrange, sheet) || Error.code.NAME)
		.mapNextArg(sourcerange => sheetutils.getCellRangeFromTerm(sourcerange, sheet) || Error.code.NAME)
		.mapNextArg(bottomTerm => toBoolean(bottomTerm, true))
		.mapNextArg(targetrange => getTargetRange(targetrange, sheet))
		.reduce((...ranges) => checkRangeHeight(ranges))
		.run((stackrange, sourcerange, atBottom, targetrange) => {
			const dropped = StackHelper.add(stackrange, sourcerange, atBottom);
			if (targetrange) StackHelper.copyRowsToTarget(stackrange, targetrange, dropped);
			return true;
		});

const drop = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg(stackrange => sheetutils.getCellRangeFromTerm(stackrange, sheet) || Error.code.NAME)
		.mapNextArg(position => (position ? convert.toNumber(position.value, 1) : 1))
		.mapNextArg(targetrange => getTargetRange(targetrange, sheet))
		.reduce((...ranges) => checkRangeHeight(ranges))
		.run((stackrange, position, targetrange) => {
			const dropped = StackHelper.drop(stackrange, position);
			if (targetrange) StackHelper.copyRowsToTarget(stackrange, targetrange, dropped);
			return true;
		});

const find = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.withMaxArgs(4)
		.mapNextArg(stackrange => sheetutils.getCellRangeFromTerm(stackrange, sheet) || Error.code.NAME)
		.mapNextArg(criteriarange => sheetutils.getCellRangeFromTerm(criteriarange, sheet) || Error.code.NAME)
		.mapNextArg(targetrange => getTargetRange(targetrange, sheet))
		.mapNextArg(dropRows => toBoolean(dropRows, false))
		.reduce((...ranges) => checkRangeHeight(ranges))
		.run((stackrange, criteriarange, targetrange, dropRows) => {
			const rows = StackHelper.find(stackrange, criteriarange, dropRows);
			if (targetrange) StackHelper.copyRowsToTarget(stackrange, targetrange, rows);
			return !!rows.length;
		});

const rotate = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg(stackrange => sheetutils.getCellRangeFromTerm(stackrange, sheet) || Error.code.NAME)
		.mapNextArg(position => (position ? convert.toNumber(position.value, 1) : 1))
		.mapNextArg(targetrange => getTargetRange(targetrange, sheet))
		.reduce((...ranges) => checkRangeHeight(ranges))
		.run((stackrange, position, targetrange) => {
			const rotated = StackHelper.rotate(stackrange, position);
			if (targetrange) StackHelper.copyRowsToTarget(stackrange, targetrange, [rotated]);
			return true;
		});

const sort = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.mapNextArg(stackrange => sheetutils.getCellRangeFromTerm(stackrange, sheet) || Error.code.NAME)
		.mapNextArg(sortrange => sheetutils.getCellRangeFromTerm(sortrange, sheet) || Error.code.NAME)
		.reduce((...ranges) => checkRangeHeight(ranges))
		.run((stackrange, sortrange) => StackHelper.sort(stackrange, sortrange));

module.exports = {
	STACKADD: add,
	STACKDROP: drop,
	SACKFIND: find,
	STACKROTATE: rotate,
	STACKSORT: sort
};
