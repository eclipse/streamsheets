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
import property from '../utils/propertyjs';

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
const getGraphSheetId = (sheetdef) => property.get('o-attributes','o-sheetid')(sheetdef, {}).v; // sheetdef['o-attributes']['o-sheetid'].v;

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

const getSheetPos = (graphdef) => {
	const pin = graphdef['o-pin']['o-p'];
	const localpin = graphdef['o-pin']['o-lp'];
	const size = graphdef['o-size'];
	const top = Number(pin['o-y'].v) - Number(localpin['o-y'].v);
	const left = Number(pin['o-x'].v) - Number(localpin['o-x'].v);
	return { top, left, bottom: top + Number(size['o-h'].v), right: left + Number(size['o-w'].v) };
};

const convertOutbox = (graphdef) => {
	const graphOutbox = graphdef['o-outbox'];
	return {
		split: Number(graphOutbox.split),
		width: Number(graphOutbox.width),
		visible: property.get('visible')(graphOutbox, true)
	};
};
const convertSheetInbox = (streamsheet) => {
	const { currentMessage, stream, max, messages } = streamsheet.inbox;
	return { currentMessage, max, messages, producer: stream };
};
const convertStreamSheetSheet = (sheetdata) => {
	const { cells = [], graphCells, graphItems, namedCells, settings } = sheetdata;
	return { cells, graphCells, graphItems, namedCells, /* properties, */ settings };
};
// TODO: different formats for machine definition and steps => adjust when settled on new format...
const convertStreamSheet = (streamsheet) => {
	const { id, name, stats } = streamsheet;
	const sheet = { id, name, stats };
	// TODO: review inbox convert for machine step... currentMessage is important...
	sheet.inbox = convertSheetInbox(streamsheet);
	sheet.loop = streamsheet.loop ? { ...streamsheet.loop } : {};
	sheet.loop.index = streamsheet.loopIndex;
	sheet.loop.currpath = streamsheet.currentPath;
	sheet.trigger = streamsheet.trigger;
	return sheet;
};

const convertMachineSheet = (allSheets, streamsheet) => {
	const convertedStreamsheet = { ...convertStreamSheet(streamsheet) };
	convertedStreamsheet.sheet = streamsheet.sheet || convertStreamSheetSheet(streamsheet);
	allSheets.set(convertedStreamsheet.id, convertedStreamsheet);
	return allSheets;
	// const sheet = { ...convertStreamSheet(streamsheet), ...convertStreamSheetSheet(streamsheet.sheet) };
	// allSheets.set(sheet.id, sheet);
	// return allSheets;
};


const convertGraphSheet = (defproperties) => (allSheets, sheetdef) => {
	const sheet = allSheets.get(getGraphSheetId(sheetdef));
	if (sheet) {
		const graphInbox = sheetdef['o-inbox'];
		sheet.inbox.split = Number(graphInbox.split);
		sheet.inbox.width = Number(graphInbox.width);
		sheet.inbox.visible = property.get('visible')(graphInbox, true);
		sheet.layout = { position: getSheetPos(sheetdef) };
		sheet.drawings = property.get('o-processsheet', 'o-drawings', 'a-graphitem')(sheetdef, []);
		// properties:
		sheet.properties = convertSheetProperties(sheetdef, defproperties);
	}
	return allSheets;
};

// within step event data is a bit different not nice!!! => but will change :-)
const convertMachineStepSheet = (allSheets, streamsheet) => {
	const sheet = { ...convertStreamSheet(streamsheet), ...convertStreamSheetSheet(streamsheet) };
	allSheets.push(sheet);
	return allSheets;
};

const convertSheets = (machinesheets, graphsheets, defproperties) => {
	const convertSheet = convertGraphSheet(defproperties);
	return Array.from(graphsheets.reduce(convertSheet, machinesheets.reduce(convertMachineSheet, new Map())).values());
	// Array.from(graphsheets.reduce(convertGraphSheet, machinesheets.reduce(convertMachineSheet, new Map())).values());
};


class Converter {

	static convert(machinedef, graphdef) {
		const { id, defproperties, metadata = {}, name, outbox = {}, settings = {}, state } = machinedef;
		const converted = { id, defproperties, name, state };
		converted.metadata = { ...metadata };
		converted.settings = { ...settings };
		converted.functions = machinedef.functionDefinitions.map((def) => def.name);
		converted.namedCells = machinedef.namedCells;
		converted.streamsheets = convertSheets(machinedef.streamsheets, graphdef['a-graphitem'], defproperties);
		converted.outbox = { ...convertOutbox(graphdef), ...outbox };
		return converted;
	}

	static convertStep(step) {
		const { outbox, stats, streamsheets } = step;
		const sheets = streamsheets.reduce(convertMachineStepSheet, []);
		return { outbox, streamsheets: sheets, stats };
	}

	static convertSheetUpdate(data) {
		const { srcId, name, sheet } = data;
		const streamsheet = { id: srcId, name, sheet };
		return { streamsheets: [streamsheet] };
		// const { srcId, name, graphCells, graphItems, namedCells, sheetCells } = data;
		// const sheet = {
		// 	id: srcId,
		// 	name,
		// 	cells: sheetCells,
		// 	graphCells,
		// 	graphItems,
		// 	namedCells
		// };
		// return { streamsheets: [sheet] };
	}
}
export default Converter;
