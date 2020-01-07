const { convert } = require('@cedalo/commons');
// TODO: should we use SheetParser for comparison criteria?
// const { SheetParser } = require('@cedalo/machine-core');
const excel = require('./excel');
const { pipe } = require('./common');


const compare = (fn) => pipe(convert.toNumber, (nr) => nr != null && fn(nr));

const greater = (pivot) => compare((nr) => nr > pivot);
const greaterThan = (pivot) => compare((nr) => nr >= pivot);
const less = (pivot) => compare((nr) => nr < pivot);
const lessThan = (pivot) => compare((nr) => nr <= pivot);
const equal = (pivot) => compare((nr) => nr === pivot);
const notEqual = (pivot) => compare((nr) => nr !== pivot);

const match = (pivot) => {
	const regex = excel.toExcelRegEx(pivot);
	return (val) => regex.test(val);
};

const criteria = new Map([
	['!=', notEqual],
	['<>', notEqual],
	['=', equal],
	['==', equal],
	['>', greater],
	['>=', greaterThan],
	['<', less],
	['<=', lessThan]
]);

const getCriterion = (str) => {
	let cutIndex = 2;
	let criterion = criteria.get(str.substring(0, cutIndex));
	cutIndex = criterion ? cutIndex : 1;
	criterion = criteria.get(str.substring(0, cutIndex));
	return criterion ? compare(criterion)(str.substring(cutIndex).trim()) : undefined;
};


const of = (str) => {
	const criterion = getCriterion(str.trim()) || match(str.trim());
	return criterion ? { isFulFilled: (val) => criterion(val) } : undefined;
};

module.exports = {
	of
};