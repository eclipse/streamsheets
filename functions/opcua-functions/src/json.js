const { FunctionErrors } = require('@cedalo/error-codes');
const { runFunction, terms: {getCellRangeFromTerm }} = require('@cedalo/functions').utils;


// opcua properties
const PROPERTIES = ['name', 'value', 'dataType', 'typeDefinition', 'type'];

const entry = (cell) => ({ props: {}, level: cell ? cell.level : 0 });

const insert = (props, parent) => {
	if (parent.children == null) {
		parent.children = [];
	}
	parent.children.push(props);
};

const addAt = (index, row, cell) => {
	if (row && cell) {
		const value = cell.value;
		if (value != null) row.props[PROPERTIES[index]] = value;
	}
};

const parentRow = (row, rows) => {
	const level = row.level;
	let idx = rows.length;
	do {
		idx -= 1;
	} while (idx >= 0 && rows[idx].level >= level);
	return rows[idx];
};

const insertRow = (row, rows) => {
	if (row) {
		const parent = parentRow(row, rows);
		insert(row.props, parent.props);
		rows.push(row);
	}
};
const toRows = (range) => {
	let row;
	const rows = [];
	const startcol = range.start.col;
	rows.push({ props: {} });
	range.iterate((cell, index, nextrow) => {
		if(nextrow) {
			insertRow(row, rows);
			row = cell ? entry(cell) : undefined;
		}
		addAt(index.col - startcol, row, cell);
	});
	insertRow(row, rows);
	return rows;
};
const jsonFromRange = (range) => {
	const rows = toRows(range);
	rows.forEach((row) => {
		row.props.type = row.props.type || (row.props.children ? 'folder' : 'variable');
	});
	const root = rows[0].props;
	return (root.children && root.children[0]) || root;
};

const json = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(range => getCellRangeFromTerm(range, sheet))
		.validate((range) => ((range == null || range.width < 2 || range.width > 5) ? FunctionErrors.code.RANGE : null))
		.run(range => jsonFromRange(range));


module.exports = json;