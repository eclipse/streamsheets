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
const property = require('../utils/property');
const { DEF_PROPS } = require('@cedalo/machine-core');

const PRE_COLS = ['IF', 'COMMENT'];
const colStr = (nr) => {
	let rest;
	let result = '';
	let number = nr;
	while (number >= 0) {
		rest = number % 26;
		number = Math.floor(number / 26) - 1;
		result = String.fromCharCode(rest + 65) + result;
	}
	return result;
};
const columnAsStr = (colnr) => {
	const precol = Math.abs(colnr) - 1;
	return colnr < 0 ? (PRE_COLS[precol] || `-${colStr(precol)}`) : colStr(colnr);
};

const isEmpty = (obj) => obj == null || Object.keys(obj).length < 1;
const getSheetId = (sheetdef) => property.get('o-attributes','o-sheetid')(sheetdef, {}).v; // sheetdef['o-attributes']['o-sheetid'].v;

const convertAttributes = (attributesdef) => {
	const attributes = {};
	if (attributesdef.size != null) attributes.size = attributesdef.size;
	if (attributesdef.visible != null) attributes.visible = attributesdef.visible;
	return attributes;
};

const decode = (str) => {
	const { length } = str;
	let i;
	let strReplace = '';

	for (i = 0; i < length; i += 1) {
		if (str[i] === '~') {
			i += 1;
			switch (str[i]) {
			case '0':
				strReplace += '\n';
				i += 1;
				break;
			case '2':
				i += 1;
				switch (str[i]) {
				case '2':
					strReplace += '"';
					break;
				case '5':
					strReplace += '~25';
					break;
				case '6':
					strReplace += '&';
					break;
				case '7':
					strReplace += '\'';
					break;
				default:
					break;
				}
				break;
			case '3':
				i += 1;
				switch (str[i]) {
				case 'C':
					strReplace += '<';
					break;
				case 'E':
					strReplace += '>';
					break;
				default:
					break;
				}
				break;
			case '5':
				strReplace += '\\';
				i += 1;
				break;
			default:
				break;
			}
		} else {
			strReplace += str[i];
		}
	}

	try {
		str = decodeURIComponent(strReplace);
	} catch (ex) {
		str = strReplace;
	}

	// percent must be replaced after decode!
	return str.replace(/~25/gi, '%');
};

const addExprValue = (toObj, fromDef) => (name) => {
	const key = `o-${name}`;
	const value = fromDef[key] ? fromDef[key].v : undefined;
	if (value != null) {
		toObj[name] = decode(value);
	}
};
const convertExprValues = (exprdef, names) => {
	const values = exprdef ? {} : undefined;
	if (values) {
		const add = addExprValue(values, exprdef);
		Object.keys(names).forEach(name => add(name));
	}
	return values;
};
const convertSectionProperties = (sectiondef, defproperties) => {
	const props = {};
	const attributes = convertAttributes(sectiondef);
	const text = convertExprValues(sectiondef['o-t'], defproperties.formats.text);
	// const styles = convertExprValues(sectiondef['o-f'], defproperties.formats.styles);
	const styles = {
		// border styles:
		...convertExprValues(sectiondef['o-a'], defproperties.formats.styles),
		...convertExprValues(sectiondef['o-f'], defproperties.formats.styles)
	};
	if (attributes) props.attributes = attributes;
	if (text || styles) {
		props.formats = {};
		if (text) props.formats.text = text;
		if (styles) props.formats.styles = styles;
	}
	return props;
};
const convertCellProperties = (rowdef, all, defproperties) => {
	const rownr = Number(rowdef.n) + 1; // TODO: keep in mind that client maps row 1 to 0
	return property.get('a-c')(rowdef, []).forEach((coldef) => {
		const colnr = Number(coldef.n) - 2; // TODO: keep in mind that client maps col -2 to 0
		const celldef = coldef['o-cell'];
		const props = {};
		const styles = {
			// border styles:
			...convertExprValues(celldef['o-a'], defproperties.formats.styles),
			...convertExprValues(celldef['o-f'], defproperties.formats.styles)
		};
		const text = convertExprValues(celldef['o-t'], defproperties.formats.text)
		const attributes = convertExprValues(celldef['o-a'], defproperties.attributes.cell)
		if (attributes) props.attributes = attributes;
		if (text || styles) {
			props.formats = {};
			if (text) props.formats.text = text;
			if (styles) props.formats.styles = styles;
		}
		if (!isEmpty(props)) all[`${columnAsStr(colnr)}${rownr}`] = props;
	});
};
const convertSheetProperties = (sheetdef, defproperties) => {
	const props = {};
	const rows = property
		.get('o-processsheet', 'o-rows', 'a-section')(sheetdef, [])
		.reduce((all, row) => {
			const converted = convertSectionProperties(row, defproperties);
			if (!isEmpty(converted)) all[Number(row.index) + 1] = converted;
			return all;
		}, {});
	const cols = property
		.get('o-processsheet', 'o-columns', 'a-section')(sheetdef, [])
		.reduce((all, col) => {
			const converted = convertSectionProperties(col, defproperties);
			if (!isEmpty(converted)) all[columnAsStr(Number(col.index) - 2)] = converted;
			return all;
		}, {});
	const cells = property
		.get('o-processsheet', 'o-data', 'a-r')(sheetdef, [])
		.reduce((all, row) => {
			convertCellProperties(row, all, defproperties);
			return all;
		}, {});
	if (!isEmpty(rows)) props.rows = rows;
	if (!isEmpty(cols)) props.cols = cols;
	if (!isEmpty(cells)) props.cells = cells;
	return props;
};


class GraphImporter {
	static propertiesFrom(graphdef) {
		const properties = new Map();
		const graphsheets = graphdef['a-graphitem'];
		graphsheets.forEach((sheetdef) => {
			const sheetId = getSheetId(sheetdef);
			properties.set(sheetId, convertSheetProperties(sheetdef, DEF_PROPS));
		});
		return properties;
	}
}

module.exports = GraphImporter;
