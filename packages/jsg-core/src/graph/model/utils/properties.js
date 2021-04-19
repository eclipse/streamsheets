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
const JSG = require('../../../JSG');
const { toValuesMap } = require('./map');
const CellRange = require('../CellRange');

const fillProps = (obj, fromObj, old) => {
	Object.entries(fromObj).forEach(([key, value]) => {
		if (value != null) obj[key] = old ? value[old] : value;
	});
	return obj;
};
const toServerProperties = ({ attributes, formats, textFormats } = {}) => {
	const props = attributes || formats || textFormats ? {} : undefined;
	if (props) {
		props.attributes = fillProps({}, attributes);
		props.formats = formats ? fillProps({}, formats) : undefined;
		props.textFormats = textFormats ? fillProps({}, textFormats) : undefined;
	}
	return props;
};
const toMap = (list) => (list ? toValuesMap(list.toMap()).getMap() : undefined);
const getCellProperties = (cell) => ({
	attributes: toMap(cell.getAttributes()),
	formats: toMap(cell.getFormat()),
	textFormats: toMap(cell.getTextFormat())
});

const setClientProperties = (props, getClientProperties) => {
	const clientprops = getClientProperties();
	clientprops.reset();
	if (props) Object.entries(props).forEach(([key, value]) => clientprops.setAttribute(key, value));
};

const applyProperties = (cellOrSection, properties = {}) => {
	if (properties.cleared) {
		cellOrSection.clearFormat();
	} else {
		const { attributes, formats, textFormats } = properties;
		setClientProperties(attributes, () => cellOrSection.getOrCreateAttributes());
		setClientProperties(formats, () => cellOrSection.getOrCreateFormat());
		setClientProperties(textFormats, () => cellOrSection.getOrCreateTextFormat());
	}
};

const cellProvider = (dataprovider) => (ref) => {
	const row = ref.row - 1;
	const column = CellRange.getColumnFromString(ref.col) + 1;
	return dataprovider.create({ x: column, y: row });
};
const columnProvider = (sheet) => (ref) => {
	const index = CellRange.getColumnFromString(ref.col) + 1;
	return sheet.getColumns().getOrCreateSectionAt(index);
};
const rowProvider = (sheet) => (ref) => {
	return sheet.getRows().getOrCreateSectionAt(ref.row - 1);
};
const setCellOrSectionProperties = (cellOrSectionProps, provider, sharedprops, clear) => {
	cellOrSectionProps.forEach(({ ref, properties = sharedprops }) => {
		const cellOrSection = provider(ref);
		if (clear) cellOrSection.clearFormat();
		else applyProperties(cellOrSection, properties);
	});
};
const applyPropertiesDefinitions = (sheet, propsdef, sharedprops, clear) => {
	// SERVER_COMMANDS:
	// const { cells, cols, rows } = propsdef;
	// if (rows && rows.length) setCellOrSectionProperties(rows, rowProvider(sheet), sharedprops, clear);
	// if (cols && cols.length) setCellOrSectionProperties(cols, columnProvider(sheet), sharedprops, clear);
	// if (cells && cells.length) setCellOrSectionProperties(cells, cellProvider(sheet.getDataProvider()), sharedprops, clear);
	// ~
};
module.exports = {
	// applyProperties,
	applyPropertiesDefinitions,
	// TODO: review - only used in cells.js
	getCellProperties,
	toServerProperties
};
