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
// use instead of Converter.js in editable-web-component:
import property from '../utils/propertyjs';


const getGraphSheetid = (graphdef) => graphdef['o-attributes']['o-sheetid'].v;
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
	const currentMessage = streamsheet.currentMessage;
	const { stream, max, messages } = streamsheet.inbox;
	return { producer: stream, currmsg: currentMessage, max, messages };
};
const convertStreamSheetSheet = (sheetdata) => {
	const { cells = [], graphCells, graphItems, namedCells, properties, settings } = sheetdata;
	return { cells,graphCells, graphItems, namedCells, properties, settings };
};
// TODO: different formats for machine definition and steps => adjust when settled on new format...
const convertStreamSheet = (streamsheet) => {
	const { id, name, stats } = streamsheet;
	const sheet = { id, name };
	// TODO: review inbox convert for machine step... currentMessage is important...
	sheet.inbox = convertSheetInbox(streamsheet);
	sheet.loop = streamsheet.loop ? { ...streamsheet.loop } : {};
	sheet.loop.index = streamsheet.loopIndex;
	sheet.loop.currpath = streamsheet.jsonpath;
	sheet.status = stats;
	sheet.trigger = streamsheet.trigger;
	return sheet;
};

const convertMachineSheet = (allSheets, streamsheet) => {
	const sheet = { ...convertStreamSheet(streamsheet), ...convertStreamSheetSheet(streamsheet.sheet) };
	allSheets.set(sheet.id, sheet);
	return allSheets;
};

const convertGraphSheet = (allSheets, sheetdef) => {
	const sheet = allSheets.get(getGraphSheetid(sheetdef));
	if (sheet) {
		const graphInbox = sheetdef['o-inbox'];
		sheet.inbox.split = Number(graphInbox.split);
		sheet.inbox.width = Number(graphInbox.width);
		sheet.inbox.visible = property.get('visible')(graphInbox, true);
		sheet.layout = { position: getSheetPos(sheetdef) };
		sheet.drawings = property.get('o-processsheet', 'o-drawings', 'a-graphitem')(sheetdef, []);
	}
	return allSheets;
};

// within step event data is a bit different not nice!!! => but will change :-)
const convertMachineStepSheet = (allSheets, streamsheet) => {
	const sheet = { ...convertStreamSheet(streamsheet), ...convertStreamSheetSheet(streamsheet) };
	allSheets.push(sheet);
	return allSheets;
};

const convertSheets = (machinesheets, graphsheets) =>
	Array.from(graphsheets.reduce(convertGraphSheet, machinesheets.reduce(convertMachineSheet, new Map())).values());



class Converter {

	static convert(machinedef, graphdef) {
		const {
			id,
			cycletime,
			defproperties,
			isOPCUA,
			lastModified,
			locale,
			metadata = {},
			name,
			namedCells,
			outbox = {},
			owner,
			state
		} = machinedef;
		const converted = { id, defproperties, name, state };
		converted.metadata = { ...metadata, lastModified, owner };
		converted.settings = { locale, cycletime, isOPCUA };
		converted.functions = machinedef.functionDefinitions.map((def) => def.name);
		converted.namedCells = namedCells;
		converted.sheets = convertSheets(machinedef.streamsheets, graphdef['a-graphitem']);
		converted.outbox = { ...convertOutbox(graphdef), ...outbox };
		converted.graphId = graphdef.id;
		return converted;
	}

	static convertStep(step) {
		const { outbox, stats, streamsheets } = step;
		const sheets = streamsheets.reduce(convertMachineStepSheet, []);
		return { outbox, sheets, stats };
	}

	static convertSheetUpdate(data) {
		const { srcId, name, graphCells, graphItems, namedCells, sheetCells, sheetProperties } = data;
		const sheet = {
			id: srcId,
			name,
			cells: sheetCells,
			properties: sheetProperties,
			graphCells,
			graphItems,
			namedCells
		};
		return { sheets: [sheet] };
	}
}
export default Converter;
