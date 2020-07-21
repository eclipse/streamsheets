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
const logger = require('../logger').create({ name: 'RequestHandlerRegistry' });
const {
	cellDescriptor,
	collectMachineStats,
	getCellFromReference,
	getSheetCellsAsList,
	getSheetCellsAsObject,
	updateNamedCellRefs
} = require('./utils');
const Message = require('../machine/Message');
const SheetIndex = require('../machine/SheetIndex');
const SheetRange = require('../machine/SheetRange');
const StreamSheet = require('../machine/StreamSheet');
const Streams = require('../streams/Streams');
const MachineTaskMessagingClient = require('./MachineTaskMessagingClient');
const { SheetParser } = require('../parser/SheetParser');
const FunctionRegistry = require('../FunctionRegistry');
// const { createPropertiesObject } = require('../utils');
const DEF_SHEET_PROPS = require('../../defproperties.json');

let machineLoaded = false;
const currentStreams = new Map();

const disableSheetUpdate = (sheet) => {
	const updateHandler = sheet.onUpdate;
	sheet.onUpdate = undefined;
	return updateHandler;
};
const enableSheetUpdate = (sheet, updateHandler, notify) => {
	sheet.onUpdate = updateHandler;
	if (notify) sheet._notifyUpdate();
};

const addMachineStats = (data) => (machine) => {
	const info = collectMachineStats(machine);
	data.stats = info.stats;
	data.streamsheets = info.streamsheets;
};
const machine2json = (machine) => {
	const json = machine.toJSON();
	json.stats = machine.stats;
	// adjust sheet cells:
	json.streamsheets.forEach((streamsheet) => {
		const _streamsheet = machine.getStreamSheet(streamsheet.id);
		streamsheet.stats = _streamsheet.stats;
		streamsheet.sheet.cells = _streamsheet ? getSheetCellsAsList(_streamsheet.sheet) : [];
		const currmsg = _streamsheet.getMessage();
		streamsheet.inbox.currentMessage = {
			id: currmsg ? currmsg.id : null,
			isProcessed: _streamsheet.isMessageProcessed(currmsg)
		};
		streamsheet.inbox.messages = _streamsheet.inbox.messages.slice(0);
		streamsheet.loop.currentPath = _streamsheet.getCurrentLoopPath();
	});
	return json;
};
const addDrawings = (machinejson, machine) => {
	machinejson.streamsheets.forEach((streamsheet) => {
		const _streamsheet = machine.getStreamSheet(streamsheet.id);
		streamsheet.sheet.drawings = _streamsheet ? _streamsheet.sheet.getDrawings().toJSON() : undefined;
	});
};
const addGraphItems = (machinejson, machine) => {
	machinejson.streamsheets.forEach((streamsheet) => {
		const _streamsheet = machine.getStreamSheet(streamsheet.id);
		streamsheet.sheet.graphItems = _streamsheet ? _streamsheet.sheet.getDrawings().toGraphItemsJSON() : undefined;
	});
};
const getDefinition = (machine) => {
	const def = {};
	def.machine = machine2json(machine);
	def.machine.outbox = {
		messages: machine.outbox.getFirstMessages(),
		totalSize: machine.outbox.size
	};
	// if definition is requested, e.g. on load, we add default properties...
	def.machine.defproperties = DEF_SHEET_PROPS;
	// DL-753: append drawings...
	addDrawings(def.machine, machine);
	addGraphItems(def.machine, machine);
	return def;
};
const applyNamedCell = (descr, name, namedCells, sheet) => {
	const cell = descr.formula != null || descr.value != null ? SheetParser.createCell(descr, sheet) : undefined;
	if (descr.newName) {
		namedCells.update(name, descr.newName, cell);
		updateNamedCellRefs(sheet.machine, name, descr.newName);
	} else {
		namedCells.set(name, cell);
	}
};
const setNamedCells = (sheet, namedCellsDescriptions, oldNamedCells) => {
	const names = namedCellsDescriptions ? Object.keys(namedCellsDescriptions) : [];
	const doIt = names.length;
	if (doIt) {
		names.forEach((name) => {
			const descr = namedCellsDescriptions[name] || {};
			applyNamedCell(descr, name, oldNamedCells, sheet);
		});
	}
	return doIt;
};
const setGlobalNamedCells = (machine, namedCells) => {
	const sheet = machine.streamsheets[0].sheet;
	const oldNamedCells = machine.namedCells;
	return sheet && setNamedCells(sheet, namedCells, oldNamedCells);
};

const toMapObject = (arr, key = 'name') =>
	arr.reduce((map, val) => {
		map[val[key]] = val;
		return map;
	}, {});

const createMachineDescriptor = (machine) => ({
	names: Object.values(machine.namedCells.getDescriptorsAsList()),
	sheets: machine.streamsheets.reduce((obj, streamsheet) => {
		const sheet = streamsheet.sheet;
		obj[streamsheet.name] = {
			id: streamsheet.id,
			properties: sheet.properties.toJSON(),
			cells: getSheetCellsAsList(sheet),
			names: sheet.namedCells.getDescriptorsAsList(),
			graphs: sheet.graphCells.getDescriptorsAsList()
		};
		return obj;
	}, {})
});

// include editable-web-component:
// const deleteCellsFromRanges = (ranges, action, sheet) => {
// 	const cells = [];
// 	if (ranges) {
// 		ranges.forEach((rangeStr) => {
// 			const sheetRange = SheetRange.fromRangeStr(rangeStr);
// 			sheetRange.sheet = sheet;
// 			sheetRange.iterate((cell, index) => {
// 				if (action(cell, index)) cells.push(cellDescriptor(undefined, index));
// 			});
// 		});
// 	}
// 	return cells;
// };
// const deleteCellsFromList = (indices, action) => {
// 	const cells = [];
// 	const index = SheetIndex.create(1, 0);
// 	if (indices) {
// 		indices.forEach((indexStr) => {
// 			if (index.set(indexStr) && action(undefined, index)) cells.push(cellDescriptor(undefined, index));
// 		});
// 	}
// 	return cells;
// };
// const deleteCellAction = (action = 'all', sheet) => {
// 	if (action === 'formats') {
// 		return (cell, index) => sheet.properties.clearCellProperties(index.row, index.col);
// 	}
// 	if (action === 'values') {
// 		return (cell, index) => sheet.setCellAt(index, undefined);
// 	}
// 	return (cell, index) =>
// 		sheet.setCellAt(index, undefined) || sheet.properties.clearCellProperties(index.row, index.col);
// };
// const adjustProperties = (info) => {
// 	if (info.properties) info.properties = createPropertiesObject(info.properties);
// };
// ~
// delete editable-web-component:
const deleteCellsFromRanges = (ranges, sheet) => {
	const cells = [];
	if (ranges) {
		ranges.forEach((rangeStr) => {
			const sheetRange = SheetRange.fromRangeStr(rangeStr);
			sheetRange.sheet = sheet;
			sheetRange.iterate((cell, index) => {
				if (sheet.setCellAt(index, undefined)) {
					cells.push(cellDescriptor(undefined, index));
				}
			});
		});
	}
	return cells;
};
const deleteCellsFromList = (indices, sheet) => {
	const cells = [];
	const index = SheetIndex.create(1, 0);
	if (indices) {
		indices.forEach((indexStr) => {
			if (index.set(indexStr) && sheet.setCellAt(index, undefined)) {
				cells.push(cellDescriptor(undefined, index));
			}
		});
	}
	return cells;
};
// ~

const updateCurrentStream = (stream) => {
	const existing = currentStreams.get(stream.id);
	if (!existing || existing.timestamp < stream.timestamp) {
		currentStreams.set(stream.id, stream);
		logger.info(`update stream: '${stream.name}'`);
	}
};

// express as typescript abstract class
class ARequestHandler {
	constructor(machine, monitor) {
		this.machine = machine;
		this.monitor = monitor;
	}

	get isModifying() {
		return true;
	}
	handle(/* msg */) {
		return Promise.reject(new Error('should be implemented by subclass'));
	}
}
class AddInboxMessage extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle(msg) {
		const { message, streamsheetId } = msg;
		const streamsheet = this.machine.getStreamSheet(streamsheetId);
		if (streamsheet) {
			const newMessage = new Message(message);
			if (msg.metadata) {
				Object.assign(newMessage.metadata, msg.metadata);
			}
			streamsheet.inbox.put(newMessage);
			return Promise.resolve({ message: newMessage });
		}
		return Promise.reject(new Error(`Unknown streamsheet id: ${streamsheetId}`));
	}
}
// include editable-web-component:
// for testing purpose only! To support general CompoundCommand!
// Will be removed as soon as those are replaced by custom commands...
// handlers.set('bulkRequests', ({ streamsheetId, requests }) => {
// 	const allRequests = requests.filter((request) => {
// 		const handler = handlers.get(request.type);
// 		return handler ? handler({ streamsheetId, ...request.properties }) : undefined;
// 	});
// 	return Promise.all(allRequests);
// });
// ~
class CreateStreamSheet extends ARequestHandler {
	handle(/* msg */) {
		const result = {};
		const streamsheet = new StreamSheet();
		this.machine.addStreamSheet(streamsheet);
		result.machine = machine2json(this.machine);
		result.streamsheet = streamsheet.toJSON();
		return Promise.resolve(result);
	}
}
class StreamChanged extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle(msg) {
		if (msg.descriptor.scope) {
			if (machineLoaded && this.machine.scope && msg.descriptor.scope.id === this.machine.scope.id) {
				Streams.registerSource(msg.descriptor, this.machine);
				this.machine.notifyUpdate('namedCells');
			} else {
				updateCurrentStream(msg.descriptor);
			}
		}
		return Promise.resolve();
	}
}
class StreamDeleted extends ARequestHandler {
	handle(msg) {
		Streams.unregisterSource(msg.descriptor, this.machine);
		this.machine.notifyUpdate('namedCells');
		return Promise.resolve();
	}
}
class Definition extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle(/* msg */) {
		try {
			return Promise.resolve(getDefinition(this.machine));
		} catch (err) {
			return Promise.reject(err);
		}
	}
}
// include editable-web-component:
// handlers.set('delete', ({ type, range, streamsheetId }) => {
// 	let error;
// 	const streamsheet = machine.getStreamSheet(streamsheetId);
// 	const sheet = streamsheet && streamsheet.sheet;
// 	if (sheet) {
// 		try {
// 			const cellrange = SheetRange.fromRangeStr(range);
// 			const updateHandler = disableSheetUpdate(sheet);
// 			switch (type) {
// 				case 'rows':
// 					sheet.deleteRowsAt(cellrange.start.row, cellrange.height);
// 					break;
// 				case 'columns':
// 					sheet.deleteColumnsAt(cellrange.start.col, cellrange.width);
// 					break;
// 				default:
// 					// TODO: support cells...
// 			}
// 			// return complete machine! => insert might affected multiple sheets, named-cells etc...
// 			machine.notifyUpdate('descriptor', createMachineDescriptor(machine));
// 			enableSheetUpdate(sheet, updateHandler);
// 			return Promise.resolve();
// 		} catch (err) {
// 			error = err;
// 		}
// 	}
// 	error = error || new Error(`Unknown streamsheet id: ${streamsheetId}`);
// 	return Promise.reject(error);
// });
// handlers.set('deleteCells', (msg) => {
// 	const result = {};
// 	const streamsheet = machine.getStreamSheet(msg.streamsheetId);
// 	if (streamsheet) {
// 		const sheet = streamsheet.sheet;
// 		const action = deleteCellAction(msg.action, sheet);
// 		// TODO: tmp. disable/enable update notification to fix Delete-Paste (ctrl+x, ctrl+v)...
// 		const updateHandler = disableSheetUpdate(sheet);
// 		result.cells = msg.ranges
// 			? deleteCellsFromRanges(msg.ranges, action, sheet)
// 			: deleteCellsFromList(msg.indices, action);
// 		enableSheetUpdate(sheet, updateHandler, true);
// 		result.sheetCells = getSheetCellsAsList(sheet);
// 	}
// 	return Promise.resolve(result);
// });
// ~
// delete editable-web-component:
class DeleteCells extends ARequestHandler {
	handle(msg) {
		const result = {};
		const streamsheet = this.machine.getStreamSheet(msg.streamsheetId);
		if (streamsheet) {
			const sheet = streamsheet.sheet;
			// TODO: tmp. disable/enable update notification to fix Delete-Paste (ctrl+x, ctrl+v)...
			const updateHandler = disableSheetUpdate(sheet);
			if (msg.ranges) deleteCellsFromRanges(msg.ranges, sheet);
			else deleteCellsFromList(msg.indices, sheet);
			// to update all cells in DB
			result.cells = getSheetCellsAsObject(sheet);
			enableSheetUpdate(sheet, updateHandler);
		}
		return Promise.resolve(result);
	}
}
// ~
class DeleteMessage extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle(msg) {
		const streamsheet = this.machine.getStreamSheet(msg.streamsheetId);
		const messageBox = msg.messageBox === 'outbox' ? this.machine.outbox : streamsheet && streamsheet.inbox;
		if (messageBox) {
			if (msg.messageId === -1) {
				messageBox.clear();
			} else {
				messageBox.pop(msg.messageId);
			}
			return Promise.resolve();
		}
		return Promise.reject(new Error(`Unknown message box type: ${msg.messageBox}`));
	}
}
class DeleteStreamSheet extends ARequestHandler {
	handle(msg) {
		const result = {};
		const streamsheet = this.machine.getStreamSheet(msg.streamsheetId);
		if (streamsheet) {
			this.machine.removeStreamSheet(streamsheet);
			result.machine = machine2json(this.machine);
			result.streamsheetId = streamsheet.id;
		}
		return Promise.resolve(result);
	}
}
class ExecuteFunction extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle({ funcstr, streamsheetId }) {
		let err;
		let result;
		const streamsheet = this.machine.getStreamSheet(streamsheetId);
		if (streamsheet) {
			const sheet = streamsheet.sheet;
			try {
				// funcstr may contain multiple functions separated by comma => wrap in noop() to ease parsing
				const fns = SheetParser.parse(`noop(${funcstr})`, sheet).params || [];
				result = sheet.executeFunctions(fns);
			} catch (ex) {
				err = `Failed to execute function(s): '${funcstr}'!!`;
			}
		} else {
			err = `Unknown streamsheet id: ${streamsheetId}`;
		}
		return err == null ? Promise.resolve({ result }) : Promise.reject(new Error(err));
	}
}
// include editable-web-component:
// handlers.set('insert', ({ type, range, streamsheetId, cells = [], headerProperties = []}) => {
// 	let error;
// 	const streamsheet = machine.getStreamSheet(streamsheetId);
// 	const sheet = streamsheet && streamsheet.sheet;
// 	if (sheet) {
// 		try {
// 			const cellrange = SheetRange.fromRangeStr(range);
// 			const updateHandler = disableSheetUpdate(sheet);
// 			const properties = sheet.properties;
// 			switch (type) {
// 				case 'rows':
// 					sheet.insertRowsAt(cellrange.start.row, cellrange.height);
// 					headerProperties.forEach((props) => {
// 						properties.setRowProperties(props.index, props);
// 					});
// 					break;
// 				case 'columns':
// 					sheet.insertColumnsAt(cellrange.start.col, cellrange.width);
// 					headerProperties.forEach((props) => {
// 						properties.setColumnProperties(props.index, props);
// 					});
// 					break;
// 				default:
// 				// TODO support cells...
// 			}
// 			// insert passed cells:
// 			cells.forEach((descr) => {
// 				const cell = SheetParser.createCell(descr, sheet);
// 				const index = SheetIndex.create(descr.reference);
// 				if (cell) {
// 					sheet.setCellAt(index, cell);
// 					if (descr.properties) properties.setCellProperties(index.row, index.col, descr.properties);
// 				}
// 			});
// 			// return complete machine! => insert might affected multiple sheets, named-cells etc...
// 			machine.notifyUpdate('descriptor', createMachineDescriptor(machine));
// 			enableSheetUpdate(sheet, updateHandler);
// 			return Promise.resolve();
// 		} catch (err) {
// 			error = err;
// 		}
// 	}
// 	error = error || new Error(`Unknown streamsheet id: ${streamsheetId}`);
// 	return Promise.reject(error);
// });
// ~
class Load extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle({ machineDefinition, functionDefinitions }) {
		try {
			this.machine.load(
				machineDefinition,
				functionDefinitions,
				Array.from(currentStreams.values()).filter((stream) => stream.scope && stream.scope.id === machineDefinition.scope.id)
			);
			MachineTaskMessagingClient.register(this.machine);
			machineLoaded = true;
			return Promise.resolve(getDefinition(this.machine));
		} catch (err) {
			return Promise.reject(err);
		}
	}
}
class LoadFunctions extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle({ functionDefinitions }) {
		try {
			this.machine.loadFunctions(functionDefinitions);
			return Promise.resolve();
		} catch (err) {
			return Promise.reject(err);
		}
	}
}
class MarkRequests extends ARequestHandler {
	get isModifying() {
		return false;
	}

	handle({ markers, streamsheetId }) {
		const streamsheet = this.machine.getStreamSheet(streamsheetId);
		const sheet = streamsheet && streamsheet.sheet;
		if (sheet) {
			markers.forEach(({ reference, marker }) => {
				const { cell, sheet: cellsheet }  = getCellFromReference(reference, sheet);
				if (cell) {
					const term = cell.term;
					const reqId = term._pendingRequestId;
					if (reqId) cellsheet.getPendingRequests().delete(reqId);
					term._marker = marker;
				}
			});
			return Promise.resolve();
		}
		return Promise.reject(new Error(`Unknown streamsheet id: ${streamsheetId}`));
	}
}

// NOT USED ANYMORE!?
// handlers.set('loadSheet', (msg) => {
// 	const streamsheet = machine.getStreamSheet(msg.streamsheetId);
// 	if (streamsheet) {
// 		streamsheet.sheet.loadCells(msg.cells);
// 		// return the list of parsed sheet cells...
// 		return Promise.resolve({ cells: getSheetCells(streamsheet.sheet) }); // machine.toJSON());
// 	}
// 	return Promise.reject(new Error(`Unknown streamsheet id: ${msg.streamsheetId}`));
// });
// include editable-web-component:
// handlers.set('mergeCellsProperties', (msg) => {
// 	const streamsheet = machine.getStreamSheet(msg.streamsheetId);
// 	const sheet = streamsheet && streamsheet.sheet;
// 	if (sheet) {
// 		let changedProperties;
// 		const info = msg.info;
// 		if (info) {
// 			// tmp. adjust objects:
// 			adjustProperties(info);
// 			info.cols.forEach(adjustProperties);
// 			info.rows.forEach(adjustProperties);
// 			info.cells.forEach(adjustProperties);
// 			changedProperties = sheet.properties.mergeAll(info);
// 		}
// 		sheet._notifyUpdate();
// 		// return list sheet cells...
// 		return Promise.resolve({ cells: getSheetCellsAsList(streamsheet.sheet), changedProperties });
// 	}
// 	return Promise.reject(new Error(`Unknown streamsheet id: ${msg.streamsheetId}`));
// });
// handlers.set('pasteCells', (msg) => {
// 	const streamsheet = machine.getStreamSheet(msg.streamsheetId);
// 	const sheet = streamsheet && streamsheet.sheet;
// 	if (sheet) {
// 		// we might have to cut source cells
// 		// const sourcerange = SheetRange.fromRangeStr(msg.sourcerange);
// 		// const targetrange = SheetRange.fromRangeStr(msg.targetrange);
// 	}
// 	return Promise.resolve({});
// });
// ~
class Pause extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle(/* msg */) {
		return this.machine.pause().then(() => ({
			machine: { id: this.machine.id, state: this.machine.state, name: this.machine.name }
		}));
	}
}
class RegisterFunctionModules extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle({ modules = [] }) {
		// logger.info('registerFunctionModules', modules);
		// first module is always our core-functions module:
		FunctionRegistry.registerCoreFunctionsModule(modules.shift());
		modules.forEach((mod) => FunctionRegistry.registerFunctionModule(mod));
		return Promise.resolve();
	}
}

class RegisterStreams extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle(msg) {
		// logger.info('registerStreams', msg.descriptors);
		const descriptors = msg.descriptors || [];
		descriptors.forEach((stream) => {
			updateCurrentStream(stream);
		});
		return Promise.resolve();
	}
}
class ReplaceGraphCells extends ARequestHandler {
	handle({ graphCells, streamsheetIds = [] }) {
		const appliedCells = new Map();
		streamsheetIds.forEach((id, index) => {
			const streamsheet = this.machine.getStreamSheet(id);
			const sheet = streamsheet && streamsheet.sheet;
			if (sheet) {
				try {
					sheet.getDrawings().removeAll();
					const cells = graphCells[index];
					const currentGraphCells = sheet.graphCells;
					const notify = currentGraphCells.clear();
					appliedCells.set(id, cells);
					if (setNamedCells(sheet, cells, currentGraphCells) || notify) {
						sheet._notifyUpdate();
					}
				} catch (err) {
					// ignore error!
					logger.warn(`Failed to set graph-cells of streamsheet:  ${streamsheet.name}(${id})!`);
				}
			} else {
				// we ignore unknown sheets
				logger.warn(`Unknown streamsheet with id "${id}" !`);
			}
		});
		const result = { streamsheetIds: [], graphCells: [] };
		Array.from(appliedCells.entries()).reduce((res, [id, cells]) => {
			res.streamsheetIds.push(id);
			res.graphCells.push(cells);
			return res;
		}, result);
		return Promise.resolve(result);
	}
}
// DL-1156 not used anymore
// handlers.set('selectMessage', (msg) => {
// 	const streamsheet = machine.getStreamSheet(msg.streamsheetId);
// 	const message = streamsheet ? streamsheet.getMessage(msg.messageId) : null;
// 	if (message) {
// 		streamsheet.select(message, msg.path);
// 		return Promise.resolve({
// 			sheetCells: getSheetCells(streamsheet.sheet),
// 			drawings: streamsheet.sheet.getDrawings().toJSON()
// 		});
// 	}
// 	const errormsg = streamsheet
// 		? `Unknown message id: ${msg.messageId}`
// 		: `Unknown streamsheet id: ${msg.streamsheetId}`;
// 	return Promise.reject(new Error(errormsg));
// });
class SetCellAt extends ARequestHandler {
	handle(msg) {
		let error;
		const streamsheet = this.machine.getStreamSheet(msg.streamsheetId);
		const sheet = streamsheet && streamsheet.sheet;
		if (sheet) {
			try {
				const cell = SheetParser.createCell(msg.celldescr, sheet);
				const index = SheetIndex.create(msg.index);
				sheet.setCellAt(index, cell);
				return Promise.resolve({
					cell: cellDescriptor(cell, index),
					// to update all cells in DB
					cells: getSheetCellsAsObject(sheet),
					drawings: sheet.getDrawings().toJSON(),
					graphItems: sheet.getDrawings().toGraphItemsJSON()
				});
			} catch (err) {
				error = err;
			}
		}
		error = error || new Error(`Unknown streamsheet id: ${msg.streamsheetId}`);
		return Promise.reject(error);
	}
}
class SetCells extends ARequestHandler {
	handle(msg) {
		const { cells, streamsheetId } = msg;
		const streamsheet = this.machine.getStreamSheet(streamsheetId);
		const sheet = streamsheet && streamsheet.sheet;
		if (sheet) {
			sheet.setCells(cells);
			return Promise.resolve({ cells: getSheetCellsAsObject(sheet) });
		}
		return Promise.reject(new Error(`Unknown streamsheet id: ${msg.streamsheetId}`));
	}
}
class SetCellsLevel extends ARequestHandler {
	handle(msg) {
		const streamsheet = this.machine.getStreamSheet(msg.streamsheetId);
		const sheet = streamsheet && streamsheet.sheet;
		const cellLevels = msg.levels;
		if (sheet && cellLevels) {
			Object.keys(cellLevels).forEach((ref) => {
				const index = SheetIndex.create(ref);
				const cell = sheet.cellAt(index, true);
				cell.level = cellLevels[ref];
			});
			return Promise.resolve({ cells: getSheetCellsAsObject(streamsheet.sheet) });
		}
		return Promise.reject(new Error(`Unknown streamsheet id: ${msg.streamsheetId}`));
	}
}
class SetNamedCells extends ARequestHandler {
	handle(msg) {
		let error;
		const { namedCells, streamsheetId } = msg;
		const streamsheet = streamsheetId ? this.machine.getStreamSheet(streamsheetId) : this.machine.streamsheets[0];
		const sheet = streamsheet && streamsheet.sheet;
		if (sheet) {
			try {
				const oldNamedCells = streamsheetId ? sheet.namedCells : this.machine.namedCells;
				if (setNamedCells(sheet, namedCells, oldNamedCells)) {
					if (streamsheetId) sheet._notifyUpdate();
					else this.machine.notifyUpdate('namedCells');
				}
				return Promise.resolve({ namedCells: oldNamedCells.getDescriptors() });
			} catch (err) {
				error = err;
			}
		}
		error = error || new Error(`Unknown streamsheet id: ${streamsheetId}`);
		return Promise.reject(error);
	}
}
class SetGraphCells extends ARequestHandler {
	handle(msg) {
		let error;
		const { graphCells, streamsheetId, clear } = msg;
		const streamsheet = streamsheetId ? this.machine.getStreamSheet(streamsheetId) : this.machine.streamsheets[0];
		const sheet = streamsheet && streamsheet.sheet;
		if (sheet) {
			try {
				sheet.getDrawings().removeAll();
				const currentGraphCells = streamsheetId ? sheet.graphCells : this.machine.graphCells;
				const notify = clear && currentGraphCells.clear();
				if (setNamedCells(sheet, graphCells, currentGraphCells) || notify) {
					if (streamsheetId) sheet._notifyUpdate();
					else this.machine.notifyUpdate('graphCells');
				}
				return Promise.resolve({ graphCells: currentGraphCells.getDescriptors() });
			} catch (err) {
				error = err;
			}
		}
		error = error || new Error(`Unknown streamsheet id: ${streamsheetId}`);
		return Promise.reject(error);
	}
}
class SetStreamSheetsOrder extends ARequestHandler {
	handle(msg) {
		this.machine.setStreamSheetsOrder(msg.streamsheetIDs);
		return Promise.resolve({ machine: machine2json(this.machine) });
	}
}
class Start extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle(/* msg */) {
		return this.machine
			.start()
			.then(() => ({ machine: { id: this.machine.id, state: this.machine.state, name: this.machine.name } }));
	}
}
class Step extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle(/* msg */) {
		return this.machine
			.step()
			.then(() => ({ machine: { id: this.machine.id, state: this.machine.state, name: this.machine.name } }));
	}
}
class Stop extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle(/* msg */) {
		// DL-1258: send required stats with response.
		// Note that stats are cleared on stop, so we have to get them before:
		const data = {};
		const onWillStop = addMachineStats(data);
		this.machine.on('willStop', onWillStop);
		return this.machine.stop().then(() => {
			this.machine.off('willStop', onWillStop);
			data.id = this.machine.id;
			data.name = this.machine.name;
			data.state = this.machine.state;
			return { machine: data };
		});
	}
}
class Subscribe extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle(/* msg */) {
		return Promise.resolve({
			machine: {
				// TODO remove it!! convert json to legacy info...
				id: this.machine.id,
				name: this.machine.name,
				state: this.machine.state,
				stats: this.machine.stats,
				cycletime: this.machine.cycletime,
				subscribed: false,
				outbox: {
					messages: this.machine.outbox.getFirstMessages(),
					totalSize: this.machine.outbox.size
				},
				// tmp. add inbox messages...
				streamsheets: this.machine.streamsheets.map((streamsheet) => {
					const currmsg = streamsheet.getMessage();
					const streamsheetCopy = streamsheet.toJSON();
					streamsheetCopy.inbox.currentMessage = {
						id: currmsg ? currmsg.id : null,
						isProcessed: streamsheet.isMessageProcessed(currmsg)
					};
					streamsheetCopy.inbox.messages = streamsheet.inbox.messages.slice(0);
					streamsheetCopy.loop.currentPath = streamsheet.getCurrentLoopPath();
					streamsheetCopy.stats = streamsheet.stats;
					return streamsheetCopy;
				}),
				machineDescriptor: createMachineDescriptor(this.machine)
			}
		});
	}
}
class Unsubscribe extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle(/* msg */) {
		return Promise.resolve({
			// REVIEW: is this really wanted??
			TODO: 'Unsubscribe from machine.',
			machine: {
				id: this.machine.id,
				state: this.machine.state,
				name: this.machine.name,
				subscribed: true
			}
		});
	}
}
class Update extends ARequestHandler {
	handle(msg) {
		this.machine.update(msg.props);
		const { cycletime, id, isOPCUA, locale, name, state } = this.machine;
		return Promise.resolve({ machine: { cycletime, id, isOPCUA, locale, name, state } });
	}
}
class UpdateMachine extends ARequestHandler {
	handle(msg) {
		setGlobalNamedCells(this.machine, toMapObject(msg.names.filter(({ name }) => !name.startsWith('|'))));
		Object.entries(msg.sheets).forEach(([name, sheetdescr]) => {
			const streamsheet = this.machine.getStreamSheetByName(name);
			const sheet = streamsheet && streamsheet.sheet;
			if (sheet) {
				// DL-1668 tmp. remove update-handler to prevent sheet-update events during evaluation
				// => caused e.g. by read() which writes to cell!!
				const updateHandler = disableSheetUpdate(sheet);
				sheet.loadCells(toMapObject(sheetdescr.cells, 'reference'));
				if (sheetdescr.names) sheet.namedCells.load(sheet, toMapObject(sheetdescr.names));
				if (sheetdescr.graphs) sheet.graphCells.load(sheet, toMapObject(sheetdescr.graphs));
				// it seems that GraphService needs one sheet-update event to synchronize clients!!
				enableSheetUpdate(sheet, updateHandler, true);
			} else {
				logger.warn(`Unknown streamsheet "${name}" !`);
			}
		});
		return Promise.resolve(createMachineDescriptor(this.machine));
	}
}
class UpdateMachineMonitor extends ARequestHandler {
	get isModifying() {
		return false;
	}
	handle(msg) {
		return new Promise((resolve /* , reject */) => {
			this.monitor.update(msg.props);
			resolve({ machine: { id: this.machine.id, state: this.machine.state, name: this.machine.name } });
		});
	}
}
class UpdateStreamSheet extends ARequestHandler {
	handle(msg) {
		return new Promise((resolve, reject) => {
			const streamsheetId = msg.streamsheetId;
			const streamsheet = this.machine.getStreamSheet(streamsheetId);
			if (streamsheet) {
				streamsheet.updateSettings(msg.settings);
				resolve({ streamsheetId, machine: machine2json(this.machine) });
			} else {
				reject(new Error(`Unknown streamsheet id: ${msg.streamsheetId}`));
			}
		});
	}
}

class RequestHandlerRegistry {
	static of(monitor) {
		const machine = monitor.machine;
		const registry = new RequestHandlerRegistry();
		registry.handlers.set('addInboxMessage', new AddInboxMessage(machine, monitor));
		registry.handlers.set('createStreamSheet', new CreateStreamSheet(machine, monitor));
		registry.handlers.set('executeFunction', new ExecuteFunction(machine, monitor));
		registry.handlers.set('definition', new Definition(machine, monitor));
		registry.handlers.set('deleteCells', new DeleteCells(machine, monitor));
		registry.handlers.set('deleteMessage', new DeleteMessage(machine, monitor));
		registry.handlers.set('deleteStreamSheet', new DeleteStreamSheet(machine, monitor));
		registry.handlers.set('load', new Load(machine, monitor));
		registry.handlers.set('loadFunctions', new LoadFunctions(machine, monitor));
		registry.handlers.set('markRequests', new MarkRequests(machine, monitor));
		registry.handlers.set('pause', new Pause(machine, monitor));
		registry.handlers.set('registerFunctionModules', new RegisterFunctionModules(machine, monitor));
		registry.handlers.set('registerStreams', new RegisterStreams(machine, monitor));
		registry.handlers.set('replaceGraphCells', new ReplaceGraphCells(machine, monitor));
		registry.handlers.set('setCellAt', new SetCellAt(machine, monitor));
		registry.handlers.set('setCells', new SetCells(machine, monitor));
		registry.handlers.set('setCellsLevel', new SetCellsLevel(machine, monitor));
		registry.handlers.set('setGraphCells', new SetGraphCells(machine, monitor));
		registry.handlers.set('setNamedCells', new SetNamedCells(machine, monitor));
		registry.handlers.set('setStreamSheetsOrder', new SetStreamSheetsOrder(machine, monitor));
		registry.handlers.set('start', new Start(machine, monitor));
		registry.handlers.set('step', new Step(machine, monitor));
		registry.handlers.set('stop', new Stop(machine, monitor));
		registry.handlers.set('streamChanged', new StreamChanged(machine, monitor));
		registry.handlers.set('streamDeleted', new StreamDeleted(machine, monitor));
		registry.handlers.set('subscribe', new Subscribe(machine, monitor));
		registry.handlers.set('unsubscribe', new Unsubscribe(machine, monitor));
		registry.handlers.set('update', new Update(machine, monitor));
		registry.handlers.set('updateMachine', new UpdateMachine(machine, monitor));
		registry.handlers.set('updateMachineMonitor', new UpdateMachineMonitor(machine, monitor));
		registry.handlers.set('updateStreamSheet', new UpdateStreamSheet(machine, monitor));
		return registry;
	}

	constructor() {
		this.handlers = new Map();
	}

	get(key) {
		return this.handlers.get(key);
	}
}

module.exports = RequestHandlerRegistry;
