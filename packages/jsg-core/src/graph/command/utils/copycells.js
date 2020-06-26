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
const Expression = require('../../expr/Expression');

// TODO: move to utils, because it is used by CellAttributesCommand too
const expressionValue = (value) =>
	value instanceof Expression ? value.getValue() : value;
// const formatToMap = format => format ? format.toMap(true) : undefined;

const formatMap = (format) =>
	format ? format.toMap(true).map(expressionValue) : undefined;

const copyProperties = (attributes, formats, textformats) =>
	attributes || formats || textformats
		? { attributes: formatMap(attributes), formats: formatMap(formats),	 textformats: formatMap(textformats) }
		: undefined;

const copySectionProperties = (allprops, section) => (index) => {
	const props = copyProperties(
		section.getSectionAttributes(index),
		section.getSectionFormat(index),
		section.getSectionTextFormat(index)
	);
	if (props) {
		props.index = index;
		allprops.push(props);
	}
};
const copyRowsProperties = (range, sheet) => {
	const properties = [];
	range.enumerateRows(copySectionProperties(properties, sheet.getRows()));
	return properties;
};
const copyColumnsProperties = (range, sheet) => {
	const properties = [];
	range.enumerateColumns(copySectionProperties(properties, sheet.getColumns()));
	return properties;
};

const copyCellProperties = (sheet) => (row, col) =>
	copyProperties(
		sheet.getCellAttributesAtRC(col, row),
		sheet.getFormatAtRC(col, row),
		sheet.getTextFormatAtRC(col, row)
	);

const adjust = (adjustment) => (pos) => {
	if (adjustment) {
		pos.x += adjustment.col;
		pos.y += adjustment.row;
	}
	return pos;
};
// copies cells with formats from given range
const copycells = (range, action, refAdjust) => {
	const sheet = range.getSheet();
	const doCopyCellProps = copyCellProperties(sheet);
	const all = { properties: {} };
	if (action === 'all' || action === 'formats') {
		if (range.isRowRange()) {
			const rows = copyRowsProperties(range, sheet);
			if (rows) all.properties.rows = rows;
		} else if (range.isColumnRange()) {
			const cols = copyColumnsProperties(range, sheet);
			if (cols) all.properties.cols = cols;
		}
	}
	const cells = [];
	const posAdjust = adjust(refAdjust);
	const tmpRange = range.copy();
	const dataProvider = sheet.getDataProvider();
	range.enumerateCells(false, (pos) => {
		const cell = dataProvider.get(pos);
		if (cell) {
			const expr = cell.getExpression();
			const formula =	expr && expr.hasFormula() ? expr.getFormula() : undefined;
			const cellcp = { formula, value: cell.getValue() };
			if (action === 'all' || action === 'formats') {
				cellcp.properties = doCopyCellProps(pos.y, pos.x);
			}
			pos = posAdjust(pos);
			cellcp.reference = tmpRange.set(pos.x, pos.y, pos.x, pos.y).toString();
			cells.push(cellcp);
		}
	});
	if (cells.length) all.cells = cells;
	return all;
};

module.exports = {
	copycells
};
