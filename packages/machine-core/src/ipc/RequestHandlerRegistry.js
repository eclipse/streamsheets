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
const State = require('../State');
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
		const currmsg = _streamsheet.getCurrentMessage();
		streamsheet.inbox.currentMessage = {
			id: currmsg ? currmsg.id : null,
			isProcessed: _streamsheet.isMessageProcessed()
		};
		streamsheet.inbox.messages = _streamsheet.inbox.messages.slice(0);
		streamsheet.loop.currentPath = _streamsheet.getCurrentLoopPath();
	});
	// DL-4847: add machine images for complete definition only
	json.titleImage = machine.titleImage;
	json.previewImage = machine.previewImage;
	return json;
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
		};
		return obj;
	}, {})
});

// include serverside-formats:
const cellDescription = (index, cell) => {
	const descr = { reference: index.toString() };
	if (cell) {
		const { formula, type, value } = cell.description();
		Object.assign(descr, { formula, type, value });
	}
	return descr;
};

const deleteCell = (sheet) => (index) => {
	const cell = sheet.cellAt(index);
	const descr = cellDescription(index, cell);
	sheet.setCellAt(index, undefined);
	return descr;
};

const isEmptyCellDescriptor = (descr) => descr.value === undefined && descr.formula == null;

const fixRangeStr = (str) => (str.includes(':') ? str : `${str}:${str}`);

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

// TODO: change with refactoring of message/communication!! was added to solve DL-4254
const isSlowRunningMachine = (machine) => machine && machine.state === State.RUNNING && machine.cycletime > 1500;
const sendSheetUpdateOnSlowMachine = (streamsheet, cell, index) => {
	if (isSlowRunningMachine(streamsheet.machine)) {
		streamsheet.notifySheetUpdate(cell, index);
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
class BulkRequests extends ARequestHandler {
	constructor(machine, monitor, registry) {
		super(machine, monitor);
		this.registry = registry;
	}

	handle({ requests, streamsheetId }) {
		const handlers = this.registry.handlers;
		const allRequests = requests.filter((request) => {
			const handler = handlers.get(request.type);
			return handler ? handler({ streamsheetId, ...request.properties }) : undefined;
		});
		return Promise.all(allRequests);
	}
}

// ~

class ApplyMigrations extends ARequestHandler {
	// currently only shapes...
	handle({ shapes = [] }) {
		let unknownSheet;
		shapes.forEach((shapesjson) => {
			const { streamsheetId, json } = shapesjson;
			const streamsheet = this.machine.getStreamSheet(streamsheetId);
			const sheet = streamsheet && streamsheet.sheet;
			if (sheet) {
				sheet.getShapes().fromJSON(json);
				sheet.getShapes().evaluate();
				shapes = sheet.getShapes().toJSON();
			}
			else unknownSheet = streamsheetId;
		});
		return unknownSheet == null
			? Promise.resolve(getDefinition(this.machine))
			: Promise.reject(new Error(`Unknown streamsheet id: ${unknownSheet}`));
	}
}
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
// include serverside-formats:
class Delete extends ARequestHandler {
	handle({ type, range, streamsheetId }) {
		let error;
		const streamsheet = this.machine.getStreamSheet(streamsheetId);
		const sheet = streamsheet && streamsheet.sheet;
		if (sheet) {
			try {
				const cellrange = SheetRange.fromRangeStr(range);
				const updateHandler = disableSheetUpdate(sheet);
				switch (type) {
				case 'rows':
					sheet.deleteRowsAt(cellrange.start.row, cellrange.height);
					break;
				case 'columns':
					sheet.deleteColumnsAt(cellrange.start.col, cellrange.width);
					break;
				default:
					// TODO: support cells...
				}
				// return complete machine! => insert might affected multiple sheets, named-cells etc...
				this.machine.notifyUpdate('descriptor', createMachineDescriptor(this.machine));
				enableSheetUpdate(sheet, updateHandler);
				return Promise.resolve();
			} catch (err) {
				error = err;
			}
		}
		error = error || new Error(`Unknown streamsheet id: ${streamsheetId}`);
		return Promise.reject(error);
	}
}
// class DeleteCells extends ARequestHandler {
// 	handle({ info = {}, streamsheetId }) {
// 		const result = {};
// 		const streamsheet = this.machine.getStreamSheet(streamsheetId);
// 		if (streamsheet) {
// 			const sheet = streamsheet.sheet;
// 			const cells = info.cells || [];
// 			const action = deleteCellAction(info.action, sheet);
// 			// TODO: tmp. disable/enable update notification to fix Delete-Paste (ctrl+x, ctrl+v)...
// 			const updateHandler = disableSheetUpdate(sheet);
// 			result.cells = cells.reduce((deleted, cell) => {
// 				const { reference } = cell;
// 				const index = reference && SheetIndex.create(reference);
// 				const delcell = action(index);
// 				if (delcell) deleted.push(delcell);
// 				return deleted;
// 			}, []);
// 			enableSheetUpdate(sheet, updateHandler, true);
// 		}
// 		return Promise.resolve(result);
// 	}
// }
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
class DeleteCells2 extends ARequestHandler {
	handle({ info = {}, streamsheetId }) {
		const result = {};
		const streamsheet = this.machine.getStreamSheet(streamsheetId);
		if (streamsheet) {
			const { cells = [] } = info;
			const sheet = streamsheet.sheet;
			const deleteCellAt = deleteCell(sheet);
			const updateHandler = disableSheetUpdate(sheet);
			result.cellsDeleted = cells.reduce((deleted, ref) => {
				const index = SheetIndex.create(ref);
				const descr = deleteCellAt(index);
				if (descr) deleted.push(descr);
				return deleted;
			}, []);
			enableSheetUpdate(sheet, updateHandler, true);
		}
		return Promise.resolve(result);
	}
}

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
class GetCellRawValue extends ARequestHandler {
	get isModifying() {
		return false;
	}
	async handle({ streamsheetId, index }) {
		const streamsheet = this.machine.getStreamSheet(streamsheetId);
		const sheet = streamsheet && streamsheet.sheet;
		if (sheet) {
			const cellindex = SheetIndex.create(index);
			const cell = sheet.cellAt(cellindex);
			if (cell) {
				const rawvalue = JSON.stringify(cell.value);
				return { rawvalue };
			}
			throw new Error(`No cell found at index: ${cellindex}`);
		}
		throw new Error(`Unknown streamsheet id: ${streamsheetId}`);
	}
}

// include serverside-formats:
class Insert extends ARequestHandler {
	handle({ type, range, streamsheetId, cells = [], headerProperties = []}) {
		let error;
		const streamsheet = this.machine.getStreamSheet(streamsheetId);
		const sheet = streamsheet && streamsheet.sheet;
		if (sheet) {
			try {
				const cellrange = SheetRange.fromRangeStr(range);
				const updateHandler = disableSheetUpdate(sheet);
				const properties = sheet.properties;
				switch (type) {
				case 'rows':
					sheet.insertRowsAt(cellrange.start.row, cellrange.height);
					headerProperties.forEach((props) => {
						properties.setRowProperties(props.index, props);
					});
					break;
				case 'columns':
					sheet.insertColumnsAt(cellrange.start.col, cellrange.width);
					headerProperties.forEach((props) => {
						properties.setColumnProperties(props.index, props);
					});
					break;
				default:
					// TODO support cells...
				}
				// insert passed cells:
				cells.forEach((descr) => {
					const cell = SheetParser.createCell(descr, sheet);
					const index = SheetIndex.create(descr.reference);
					if (cell) {
						sheet.setCellAt(index, cell);
						if (descr.properties) properties.setCellProperties(index.row, index.col, descr.properties);
					}
				});
				// return complete machine! => insert might affected multiple sheets, named-cells etc...
				this.machine.notifyUpdate('descriptor', createMachineDescriptor(this.machine));
				enableSheetUpdate(sheet, updateHandler);
				return Promise.resolve();
			} catch (err) {
				error = err;
			}
		}
		error = error || new Error(`Unknown streamsheet id: ${streamsheetId}`);
		return Promise.reject(error);
	}
}
// ~
class Load extends ARequestHandler {
	get isModifying() {
		return false;
	}
	async handle({ machineDefinition, functionDefinitions }) {
		await this.machine.load(
			machineDefinition,
			functionDefinitions,
			Array.from(currentStreams.values()).filter((stream) => stream.scope && stream.scope.id === machineDefinition.scope.id)
		);
		MachineTaskMessagingClient.register(this.machine);
		machineLoaded = true;
		return getDefinition(this.machine);
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
					if (reqId) cellsheet.removeRequest(reqId);
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
// include serverside-formats:
class SetCellsProperties extends ARequestHandler {
	handle({ info = {}, streamsheetId }) {
		const streamsheet = this.machine.getStreamSheet(streamsheetId);
		const sheet = streamsheet && streamsheet.sheet;
		if (sheet) {
			const pm = sheet.properties;
			const oldProperties = info.clear ? pm.clearProperties(info) : pm.setProperties(info);
			const newProperties = pm.getProperties(oldProperties);
			sheet._notifyUpdate();
			return Promise.resolve({ newProperties, oldProperties });
		}
		return Promise.reject(new Error(`Unknown streamsheet id: ${streamsheetId}`));
	}
}
class PasteCells extends ARequestHandler {
	handle({ info, streamsheetId }) {
		let errmsg;
		const { action, cells, extend, targetrange, sourcesheetId } = info;
		const streamsheet = this.machine.getStreamSheet(sourcesheetId);
		const targetStreamsheet = this.machine.getStreamSheet(streamsheetId);
		const sheet = streamsheet && streamsheet.sheet;
		const trgtsheet = targetStreamsheet && targetStreamsheet.sheet;
		if (sheet && trgtsheet) {
			const trgtrange = SheetRange.fromRangeStr(fixRangeStr(targetrange));
			if (trgtrange) {
				trgtrange.sheet = trgtsheet;
				// action =  'all' || 'values' || 'formulas' || 'formats'
				const result = sheet.pasteCells(cells, trgtrange, { action, extend });
				if (result.cellsCut.length) sheet._notifyUpdate();
				if (result.cellsReplaced.length) trgtsheet._notifyUpdate();
				return Promise.resolve(result);
			}
			errmsg = `Invalid target sheet range: ${targetrange}`
		}
		errmsg =
			errmsg ||
			(sheet
				? `Unknown target streamsheet id: ${streamsheetId}`
				: `Unknown  source streamsheet id: ${sourcesheetId}`);
		return Promise.reject(new Error(errmsg));
	}
}
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
class ReplaceGraphItems extends ARequestHandler {
	handle({ graphItems = [], streamsheetIds = [] }) {
		// TODO: define what to return to client
		const result = { streamsheetIds: [], shapes: [] };
		streamsheetIds.forEach((id , index) => {''
			const streamsheet = this.machine.getStreamSheet(id);
			const sheet = streamsheet && streamsheet.sheet;
			if (sheet) {
				try {
					if (sheet.shapes.fromJSON(graphItems[index])) {
						result.streamsheetIds.push(id);
						sheet.getShapes().evaluate();
						result.shapes.push(sheet.shapes.toJSON());
						sheet._notifyUpdate();
					}
				} catch (err) {
					// ignore error!
					logger.warn(`Failed to set shapes of streamsheet:  ${streamsheet.name}(${id})!`);
				}
			} else {
				// we ignore unknown sheets
				logger.warn(`Unknown streamsheet with id "${id}" !`);
			}
		});
		return Promise.resolve(result);
	}
}
class RunMachineAction extends ARequestHandler {
	async handle({ type, data }) {
		const action = FunctionRegistry.getAction(type);
		if (action) {
			const result = await action(data);
			return { result };
		}
		return Promise.reject(new Error(`Unknown action type: ${type}`));
	}
}
class SetCellAt extends ARequestHandler {
	handle(msg) {
		let error;
		const streamsheet = this.machine.getStreamSheet(msg.streamsheetId);
		const sheet = streamsheet && streamsheet.sheet;
		if (sheet) {
			try {
				const cell = SheetParser.createCell(msg.celldescr, sheet);
				const index = SheetIndex.create(msg.index);

				// postpone update to update shapes before updating
				const sheetOnUpdate = sheet.onUpdate;
				sheet.onUpdate = null;
				const didUpdate = sheet.setCellAt(index, cell);
				sheet.getShapes().evaluate();
				sheet.onUpdate = sheetOnUpdate;
				if (didUpdate) sheet._notifyUpdate();
				sendSheetUpdateOnSlowMachine(streamsheet, cell, index);

				return Promise.resolve({
					cell: cellDescriptor(cell, index),
					// to update all cells in DB
					cells: getSheetCellsAsObject(sheet),
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
			sendSheetUpdateOnSlowMachine(streamsheet);
			return Promise.resolve({ cells: getSheetCellsAsObject(sheet) });
		}
		return Promise.reject(new Error(`Unknown streamsheet id: ${msg.streamsheetId}`));
	}
}
class SetCells2 extends ARequestHandler {
	handle({ info = {}, streamsheetId }) {
		const result = {};
		const streamsheet = this.machine.getStreamSheet(streamsheetId);
		if (streamsheet) {
			const { cells = [] } = info;
			const sheet = streamsheet.sheet;
			const updateHandler = disableSheetUpdate(sheet);
			result.oldcells = cells.reduce((oldcells, descr) => {
				const index = SheetIndex.create(descr.reference);
				const oldcell = cellDescription(index, sheet.cellAt(index));
				const newcell = isEmptyCellDescriptor(descr) ? undefined : SheetParser.createCell(descr, sheet);
				sheet.setCellAt(index, newcell);
				oldcells.push(oldcell);
				return oldcells;
			}, []);
			enableSheetUpdate(sheet, updateHandler, true);
			return Promise.resolve(result);
		}
		return Promise.reject(new Error(`Unknown streamsheet id: ${streamsheetId}`));
	}
}
// class SetCellsContent extends ARequestHandler {
// 	handle({ info, streamsheetId }) {
// 		const streamsheet = this.machine.getStreamSheet(streamsheetId);
// 		const sheet = streamsheet && streamsheet.sheet;
// 		if (sheet) {
// 			const { cells = []} = info;
// 			const updateHandler = disableSheetUpdate(sheet);
// 			cells.forEach((celldescr) => {
// 				const { properties, reference } = celldescr;
// 				const index = SheetIndex.create(reference);
// 				if(index) {
// 					const cell = isEmptyCellDescriptor(celldescr) ? null : SheetParser.createCell(celldescr, sheet);
// 					if (cell) sheet.setCellAt(index, cell);
// 					if (properties) sheet.properties.setCellProperties(index.row, index.col, properties);
// 				}
// 			});
// 			enableSheetUpdate(sheet, updateHandler, true);
// 			// return list sheet cells...
// 			return Promise.resolve({ cells: getSheetCellsAsList(streamsheet.sheet) });
// 		}
// 		return Promise.reject(new Error(`Unknown streamsheet id: ${streamsheetId}`));
// 	}
// }
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
			sendSheetUpdateOnSlowMachine(streamsheet);
			return Promise.resolve({ cells: getSheetCellsAsObject(streamsheet.sheet) });
		}
		return Promise.reject(new Error(`Unknown streamsheet id: ${msg.streamsheetId}`));
	}
}
class SetCellsLevelProperty extends ARequestHandler {
	handle(msg) {
		const streamsheet = this.machine.getStreamSheet(msg.streamsheetId);
		const sheet = streamsheet && streamsheet.sheet;
		const properties = sheet && sheet.properties;
		const cellLevels = msg.levels;
		if (sheet && cellLevels) {
			Object.entries(cellLevels).forEach(([ref, level])=> {
				const index = SheetIndex.create(ref);
				if (index) properties.setCellAttribute(index.row, index.col, 'level', level);
			});
			sendSheetUpdateOnSlowMachine(streamsheet);
			return Promise.resolve({ properties: properties.toJSON() });
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
					const currmsg = streamsheet.getCurrentMessage();
					const streamsheetCopy = streamsheet.toJSON();
					streamsheetCopy.inbox.currentMessage = {
						id: currmsg ? currmsg.id : null,
						isProcessed: streamsheet.isMessageProcessed()
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
		const { cycletime, id, isOPCUA, locale, name, state, view } = this.machine;
		return Promise.resolve({ machine: { cycletime, id, isOPCUA, locale, name, state, view } });
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
		registry.handlers.set('applyMigrations', new ApplyMigrations(machine, monitor));
		registry.handlers.set('bulkRequests', new BulkRequests(machine, monitor, this));
		registry.handlers.set('createStreamSheet', new CreateStreamSheet(machine, monitor));
		registry.handlers.set('executeFunction', new ExecuteFunction(machine, monitor));
		registry.handlers.set('definition', new Definition(machine, monitor));
		registry.handlers.set('delete', new Delete(machine, monitor));
		registry.handlers.set('deleteCells', new DeleteCells(machine, monitor));
		registry.handlers.set('deleteCells2', new DeleteCells2(machine, monitor));
		registry.handlers.set('deleteMessage', new DeleteMessage(machine, monitor));
		registry.handlers.set('deleteStreamSheet', new DeleteStreamSheet(machine, monitor));
		registry.handlers.set('getCellRawValue', new GetCellRawValue(machine, monitor));
		registry.handlers.set('insert', new Insert(machine, monitor));
		registry.handlers.set('load', new Load(machine, monitor));
		registry.handlers.set('loadFunctions', new LoadFunctions(machine, monitor));
		registry.handlers.set('markRequests', new MarkRequests(machine, monitor));
		registry.handlers.set('pasteCells', new PasteCells(machine, monitor));
		registry.handlers.set('pause', new Pause(machine, monitor));
		registry.handlers.set('registerFunctionModules', new RegisterFunctionModules(machine, monitor));
		registry.handlers.set('registerStreams', new RegisterStreams(machine, monitor));
		registry.handlers.set('replaceGraphItems', new ReplaceGraphItems(machine, monitor));
		registry.handlers.set('runMachineAction', new RunMachineAction(machine, monitor));
		registry.handlers.set('setCellAt', new SetCellAt(machine, monitor));
		registry.handlers.set('setCells', new SetCells(machine, monitor));
		registry.handlers.set('setCells2', new SetCells2(machine, monitor));
		registry.handlers.set('setCellsProperties', new SetCellsProperties(machine, monitor));
		// registry.handlers.set('setCellsContent', new SetCellsContent(machine, monitor));
		registry.handlers.set('setCellsLevel', new SetCellsLevel(machine, monitor));
		registry.handlers.set('setCellsLevelProperty', new SetCellsLevelProperty(machine, monitor));
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
