const StackHelper = require('./stackhelper');
const { runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const toBooleanStrict = convert.from().boolean.toBoolean;
const toBoolean = (term, defval) => {
	const value = term ? term.value : undefined;
	return value != null ? toBooleanStrict(value, ERROR.VALUE) : defval;
};

const checkRangeHeight = (ranges) => {
	let error;
	ranges.some((range) => {
		error = FunctionErrors.isError(range) || (range && range.height < 2 ? ERROR.INVALID_PARAM : undefined);
		return error != null;
	});
	return error || ranges;
};

const getTargetRange = (term, sheet) =>
	((term && term.value != null) ? (getCellRangeFromTerm(term, sheet) || ERROR.VALUE) : undefined);

const add = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(4)
		.mapNextArg(stackrange => getCellRangeFromTerm(stackrange, sheet) || ERROR.NAME)
		.mapNextArg(sourcerange => getCellRangeFromTerm(sourcerange, sheet) || ERROR.NAME)
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
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg(stackrange => getCellRangeFromTerm(stackrange, sheet) || ERROR.NAME)
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
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(5)
		.mapNextArg(stackrange => getCellRangeFromTerm(stackrange, sheet) || ERROR.NAME)
		.mapNextArg(criteriarange => getCellRangeFromTerm(criteriarange, sheet) || ERROR.NAME)
		.mapNextArg(targetrange => getTargetRange(targetrange, sheet))
		.mapNextArg(dropRows => toBoolean(dropRows, false))
		.mapNextArg(unique => toBoolean(unique, false))
		.reduce((...ranges) => checkRangeHeight(ranges))
		.run((stackrange, criteriarange, targetrange, dropRows, unique) => {
			const rows = StackHelper.find(stackrange, criteriarange, dropRows, unique);
			if (targetrange) StackHelper.copyRowsToTarget(stackrange, targetrange, rows);
			return !!rows.length;
		});

const rotate = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg(stackrange => getCellRangeFromTerm(stackrange, sheet) || ERROR.NAME)
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
		.onSheetCalculation()
		.withMinArgs(2)
		.mapNextArg(stackrange => getCellRangeFromTerm(stackrange, sheet) || ERROR.NAME)
		.mapNextArg(sortrange => getCellRangeFromTerm(sortrange, sheet) || ERROR.NAME)
		.reduce((...ranges) => checkRangeHeight(ranges))
		.run((stackrange, sortrange) => StackHelper.sort(stackrange, sortrange));

module.exports = {
	STACKADD: add,
	STACKDROP: drop,
	STACKFIND: find,
	STACKROTATE: rotate,
	STACKSORT: sort
};
