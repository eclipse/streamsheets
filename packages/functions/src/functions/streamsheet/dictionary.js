const ERROR = require('../errors');
const { runFunction, sheet: sheetutils } = require('../../utils');
const { convert } = require('@cedalo/commons');


const createObj = (keys, values) => {
	const obj = {};
	keys.forEach((key, index) => {
		if (key != null) {
			obj[key] = values[index];
		}
	});
	return obj;
};
const createObjects = (keys, values) => values.map(vals => createObj(keys, vals));

const nextRow = (arr) => {
	const row = [];
	arr.push(row);
	return row;
};
const createDictionaries = (range, byrow) => {
	const keys = [];
	const values = [];
	const iterate = byrow ? range.iterate : range.iterateByCol;
	let arr;
	iterate.call(range, (cell, index, next) => {
		// eslint-disable-next-line
		arr = next ? (!keys.length ? keys : nextRow(values)) : (!values.length ? keys : arr);
		arr.push(cell ? cell.value : '');
	});
	return createObjects(keys, values);
};

// cell-range to json object => to use for writejson, execute or publish...
const dictionary = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(cellrange => sheetutils.getCellRangeFromTerm(cellrange, sheet) || ERROR.INVALID_PARAM)
		.mapNextArg(byrow => convert.toBoolean(!!byrow && byrow.value, false))
		.validate((cellrange) => ERROR.ifTrue(cellrange.width < 2 && cellrange.height < 2, ERROR.INVALID_PARAM))
		.run((cellrange, byrow) => {
			const dicts = createDictionaries(cellrange, byrow);
			return dicts.length < 2 ? dicts[0] : dicts;
		});


module.exports = dictionary;
