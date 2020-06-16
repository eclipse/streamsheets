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
/* eslint-disable no-unused-vars */
const { decode } = require('../utils/utils');
const trycatch = require('../utils/trycatch');
const logger = require('../utils/logger').create({
	name: 'MachineRequestHandlers'
});
const { RequestHandler } = require('@cedalo/service-core');
const { MachineServerMessagingProtocol } = require('@cedalo/protocols');
const VERSION = require('../../package.json').version;
const BUILD_NUMBER = require('../../meta.json').buildNumber;

const toTypeStr = (t) => {
	switch (t) {
		case 's':
			return 'string';
		case 'n':
			return 'number';
		case 'b':
			return 'bool';
		default:
			return t;
	}
};

const getUserId = (request) => {
	const { session = {} } = request;
	const user = session.user;
	return user && user.userId;
};

const fixCellRange = str => str && str.indexOf(':') < 0 ? `${str}:${str}` : str;

const parseExpression = trycatch(expr => JSON.parse(expr), logger);
const getCellDescriptorFromCommand = (command, undo) => {
	const { json, expr } = undo ? command.undo : command;
	const data = parseExpression(json || expr.json);
	if (data) {
		const descr = data['o-expr'];
		return {
			formula: descr.f ? decode(descr.f) : undefined,
			value: descr.v != null ? decode(descr.v) : descr.v,
			type: toTypeStr(descr.t),
			level: command.level
		};
	}
	return undefined;
};

const filterRequestCellDescriptors = (descriptors = []) =>
	descriptors.filter((descr) => {
		const { value, formula, type } = descr;
		descr.type = type === 'boolean' ? 'bool' : type;
		// filter cells without value, formula or type...
		return (
			value != null ||
			formula ||
			(type && type !== 'undefined' && type !== 'null')
		);
	});

const descriptorsToCellDescriptorsObject = (descriptors = []) => {
	const cells = {};
	descriptors.forEach((descr) => {
		const descrCopy = Object.assign({}, descr);
		delete descrCopy.reference;
		cells[descr.reference] = descrCopy;
	});
	return cells;
};

const getGraphCells = (descriptors = []) =>
	descriptors.reduce((cells, descr) => {
		const { formula, name, type, value } = descr;
		cells[name] = { formula, type, value };
		return cells;
	}, {});

const handleRequest = async (
	handler,
	machineserver,
	request,
	type,
	props = {},
) => {
	logger.info(`handle request: ${type}...`);
	const runner = machineserver.getMachineRunner(request.machineId);
	const userId = getUserId(request);
	if (runner) {
		const result = await runner.request(type, userId, props);
		logger.info(`request: ${type}  -> result: `, result);
		return handler.confirm(request, result);
	}
	// no runner, no machine:
	logger.error(
		`handle request failed. no machine with id ${request.machineId}!`
	);
	throw handler.reject(
		request,
		`No machine found with id '${request.machineId}'!`
	);
};

class GetMachineRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.GET_MACHINE_MESSAGE_TYPE
		);
	}
	async handle(request, machineserver) {
		const runner = machineserver.getMachineRunner(request.machineId);
		if (runner) {
			const result = await runner.getDefinition();
			return this.confirm(request, { machine: result.machine });
		}
		// no runner, no machine:
		logger.error(
			`handle request failed. no machine with id ${request.machineId}!`
		);
		throw this.reject(
			request,
			`No machine found with id '${request.machineId}'!`
		);
	}
}

class UnloadMachineRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.UNLOAD_MACHINE_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		const machineId = request.machineId;
		const result = { machine: { id: machineId, unloaded: true } };
		result.warning = (await machineserver.unloadMachine(machineId))
			? undefined
			: `No machine found for id ${request.machineId}.`;
		return this.confirm(request, result);
	}
}

class DeleteMachineRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.DELETE_MACHINE_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		const machineId = request.machineId;
		const result = { machine: { id: machineId, deleted: true } };
		result.warning = (await machineserver.unloadMachine(machineId))
			? undefined
			: `No machine found for id ${request.machineId}.`;
		return this.confirm(request, result);
	}
}

class StartMachineRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.START_MACHINE_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		return handleRequest(this, machineserver, request, 'start', undefined);
	}
}

class PauseMachineRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.PAUSE_MACHINE_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		return handleRequest(this, machineserver, request, 'pause', undefined);
	}
}

class StopMachineRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.STOP_MACHINE_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		return handleRequest(this, machineserver, request, 'stop', undefined);
	}
}

class RenameMachineRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.RENAME_MACHINE_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver, repositoryManager) {
		const nameInUse = await repositoryManager.machineRepository.machineWithNameExists(request.machineId, request.newName)
		if (nameInUse) {
			// machine with same name already exists:
			throw this.reject(
				request,
				`Machine with same name exists: '${request.newName}'!`
			);
		}
		return handleRequest(this, machineserver, request, 'update', {
			props: { name: request.newName }
		});
	}
}

class UpdateStreamSheetStreamsRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.EVENTS
				.STREAMSHEET_STREAM_UPDATE_EVENT
		); // FIXME: in protocols
	}

	async handle(request, machineserver) {
		// const settings = request.streams; // FIXME: replace and fix in client etc after demo
		const { streamsheetId, streams } = request;
		return handleRequest(this, machineserver, request, 'updateStreamSheet', {
			streamsheetId,
			settings: streams
		});
	}
}

class StepMachineRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.STEP_MACHINE_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		return handleRequest(this, machineserver, request, 'step', undefined);
	}
}

/** @deprecated REVIEW: still makes sense? don't think so... */
class SubscribeMachineRequestHandler extends RequestHandler {
	constructor() {
		super(MachineServerMessagingProtocol.MESSAGE_TYPES.SUBSCRIBE_MACHINE_MESSAGE_TYPE);
	}

	async handle(request, machineserver) {
		const clientId = request.sender ? request.sender.id : undefined;
		return handleRequest(this, machineserver, request, 'subscribe', {
			clientId
		});
	}
}

/** @deprecated REVIEW: is this really good? will affect all clients, even those which can handle fast updates... */
class SetMachineUpdateIntervalRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.SET_MACHINE_UPDATE_INTERVAL_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		const stepUpdateInterval = request.streamsheetStepInterval || -1;
		return handleRequest(
			this,
			machineserver,
			request,
			'updateMachineMonitor',
			{ props: { stepUpdateInterval } }
		);
	}
}

class SetMachineCycleTimeRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		return handleRequest(this, machineserver, request, 'update', {
			props: { cycletime: request.cycleTime }
		});
	}
}

class SetMachineLocaleRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.SET_MACHINE_LOCALE_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		return handleRequest(this, machineserver, request, 'update', {
			props: { locale: request.locale }
		});
	}
}
class MachineUpdateSettingsRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES.MACHINE_UPDATE_SETTINGS
		);
	}

	async handle(request, machineserver, repositoryManager) {
		const { settings = {} } = request;
		const { cycleTime, isOPCUA, locale, newName } = settings;
		if (newName != null) {
			// check if we already have a machine with newName => its not allowed
			const nameInUse = await repositoryManager.machineRepository.machineWithNameExists(
				request.machineId,
				newName
			);
			if (nameInUse) {
				// machine with same name already exists:
				throw this.reject(request, `Machine with same name exists: '${newName}'!`);
			}
		}
		return handleRequest(this, machineserver, request, 'update', {
			props: {
				cycleTime,
				isOPCUA,
				locale,
				newName
			}
		});
	}
}

/** @deprecated REVIEW: still makes sense? don't think so... */
class UnsubscribeMachineRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.UNSUBSCRIBE_MACHINE_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		const clientId = request.sender ? request.sender.id : undefined;
		return handleRequest(this, machineserver, request, 'unsubscribe', {
			clientId
		});
	}
}

class CreateStreamSheetRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.CREATE_STREAMSHEET_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		const { machineId } = request;
		const userId = getUserId(request);
		const runner = machineserver.getMachineRunner(machineId);
		if (runner) {
			const result = await runner.request('createStreamSheet', userId);
			// REVIEW: for what?
			result.position = request.position;
			result.activeItemId = request.activeItemId;
			return this.confirm(request, result);
		}
		// no runner, no machine:
		throw this.reject(
			request,
			`No machine found with id '${request.machineId}'!`
		);
	}
}

class DeleteStreamSheetRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.DELETE_STREAMSHEET_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		const { streamsheetId } = request;
		return handleRequest(this, machineserver, request, 'deleteStreamSheet', {
			streamsheetId
		});
	}
}

class SetStreamSheetsOrderRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.STREAMSHEETS_ORDER_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		const { streamsheetIDs } = request;
		return handleRequest(
			this,
			machineserver,
			request,
			'setStreamSheetsOrder',
			{ streamsheetIDs }
		);
	}
}

class OpenMachineRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.OPEN_MACHINE_MESSAGE_TYPE
		);
	}

	async handle(request, machineserver) {
		logger.info(`open machine: ${request.machineId}...`);
		try {
			// we always need a machine definition in request!
			const result = await machineserver.openMachine(
				request.machineDefinition,
				request.session
			);
			logger.info(`open machine ${request.machineId} successful`);
			return this.confirm(request, result);
		} catch (err) {
			logger.error(`open machine ${request.machineId} failed:`, err);
			throw this.reject(
				request,
				`Failed to open machine with id '${request.machineId}'!`
			);
		}
	}
}

class LoadMachineRequestHandler extends RequestHandler {
	constructor() {
		super(MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_MACHINE_MESSAGE_TYPE);
	}

	async handle(request, machineserver, repositoryManager) {
		logger.info(`load machine: ${request.machineId}...`);
		try {
			const result = await machineserver.loadMachine(request.machineId, request.scope, async () => {
				const machine = await repositoryManager.machineRepository.findMachine(request.machineId);
				if (machine.isTemplate) {
					machine.scope = request.scope;
				}
				return machine;
			});
			const newMachine = !!result.templateId;
			if (newMachine) {
				await repositoryManager.machineRepository.saveMachine(JSON.parse(JSON.stringify(result.machine)));
			}
			logger.info(`load machine ${request.machineId} successful`);
			return this.confirm(request, result);
		} catch (err) {
			logger.error(`load machine ${request.machineId} failed:`, err);
			throw this.reject(request, `Failed to load machine with id '${request.machineId}'!`);
		}
	}
}

class LoadSubscribeMachineRequestHandler extends RequestHandler {
	constructor() {
		super(MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE);
	}

	async handle(request, machineserver, repositoryManager) {
		return new LoadMachineRequestHandler().handle(request, machineserver, repositoryManager);
	}
}

class LoadSheetCellsRequestHandler extends RequestHandler {
	constructor() {
		super(MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_SHEET_CELLS);
	}

	async handle(request, machineserver) {
		logger.info('LoadSheetCellsRequestHandler...');
		const { machineId, machineDescriptor, command } = request;
		const runner = machineserver.getMachineRunner(machineId);
		if (runner) {
			const result = await runner.request(
				'updateMachine',
				getUserId(request),
				machineDescriptor
			);
			logger.info(
				`LoadSheetCellsRequestHandler update machine: ${runner.name}`
			);
			return this.confirm(request, {
				machineId,
				command: command.name,
				machineDescriptor: result
			});
		}
		// no runner, no machine:
		throw this.reject(
			request,
			`No machine found with id '${request.machineId}'!`
		);
	}
}
class AddInboxMessageRequestHandler extends RequestHandler {
	constructor() {
		super(MachineServerMessagingProtocol.MESSAGE_TYPES.ADD_INBOX_MESSAGE);
	}

	async handle(request, machineserver) {
		logger.info('AddInboxMessageRequestHandler...');
		// messages = [ data1, data2,...]
		const { machineId, streamsheetId, requestId } = request;
		const { metadata = { requestId } } = request;
		let { message } = request;
		try {
			message = JSON.parse(message);
		} catch (error) {
			// Do nothing
		}
		const runner = machineserver.getMachineRunner(machineId);
		if (runner) {
			const result = await runner.request('addInboxMessage', getUserId(request), {
				message,
				metadata,
				streamsheetId
			});
			logger.info('AddInboxMessageRequestHandler add message: ', message);
			return this.confirm(request, {
				machineId,
				streamsheetId,
				message: result.message
			});
		}
		// no runner, no machine:
		throw this.reject(request, `No machine found with id '${machineId}'!`);
	}
}

class SetNamedCellsRequestHandler extends RequestHandler {
	constructor() {
		super(MachineServerMessagingProtocol.MESSAGE_TYPES.SET_NAMED_CELLS);
	}

	async handle(request, machineserver) {
		logger.info('SetNamedCellsRequestHandler...');
		// namedCells = { name: { newName, formula, value, type } }
		const { machineId, namedCells, streamsheetId } = request;
		const runner = machineserver.getMachineRunner(machineId);
		if (runner) {
			const result = await runner.request('setNamedCells', getUserId(request), {
				namedCells,
				streamsheetId
			});
			logger.info(
				'SetNamedCellsRequestHandler set named-cells: ',
				namedCells
			);
			return this.confirm(request, {
				machineId,
				streamsheetId,
				namedCells: result.namedCells
			});
		}
		// no runner, no machine:
		throw this.reject(request, `No machine found with id '${machineId}'!`);
	}
}

// TODO: review, still used??
class SetGraphCellsRequestHandler extends RequestHandler {
	constructor() {
		super(MachineServerMessagingProtocol.MESSAGE_TYPES.SET_GRAPH_CELLS);
	}

	async handle(request, machineserver) {
		logger.info('SetGraphCellsRequestHandler...');
		// namedCells = { name: { newName, formula, value, type } }
		const { machineId, graphCells, streamsheetId } = request;
		const runner = machineserver.getMachineRunner(machineId);
		if (runner) {
			const result = await runner.request('setGraphCells', getUserId(request), {
				graphCells,
				streamsheetId
			});
			logger.info(
				'SetGraphCellsRequestHandler set graph-cells: ',
				graphCells
			);
			return this.confirm(request, {
				machineId,
				streamsheetId,
				graphCells: result.graphCells
			});
		}
		// no runner, no machine:
		throw this.reject(request, `No machine found with id '${machineId}'!`);
	}
}

// deprecated? corresponding message topic seems to be unused...
class SetSheetCellsRequestHandler extends RequestHandler {
	constructor() {
		super(MachineServerMessagingProtocol.MESSAGE_TYPES.SET_SHEET_CELLS);
	}

	// TODO: maybe remove LoadSheetCells and handle that with a clear property within request...
	async handle(request, machineserver) {
		logger.info('SetSheetCellsRequestHandler...');
		const { machineId, streamsheetId, command } = request;
		const runner = machineserver.getMachineRunner(machineId);
		if (runner) {
			// TODO we have to define the format of passed cells => convert appropriately...
			const cellDescriptors = request.cellDescriptors;
			const cells = descriptorsToCellDescriptorsObject(
				filterRequestCellDescriptors(cellDescriptors)
			);
			const result = await runner.request('setCells', getUserId(request), {
				cells,
				streamsheetId
			});
			logger.info('SetSheetCellsRequestHandler set cells: ', cells);
			return this.confirm(request, {
				machineId,
				streamsheetId,
				cells: result.cells,
				cellsObject: descriptorsToCellDescriptorsObject(result.cells),
				command: command.name
			});
		}
		// no runner, no machine:
		throw this.reject(
			request,
			`No machine found with id '${request.machineId}'!`
		);
	}
}

// TODO: remove undo handling or check it with persistence
class DeleteCellsCommandRequestHandler {
	async handleCommand(command, runner, streamsheetId, userId, undo) {
		const cmd = undo ? 'insert' : 'delete';
		const info = command.msrvrinfo || {};
		info.streamsheetId = streamsheetId;
		return info.range ? runner.request(cmd, userId, info) : {};
	}
}
// TODO: remove undo handling or check it with persistence
class InsertCellsCommandRequestHandler {
	async handleCommand(command, runner, streamsheetId, userId, undo) {
		const cmd = undo ? 'delete' : 'insert';
		const info = command.msrvrinfo || {};
		info.streamsheetId = streamsheetId;
		return info.range ? runner.request(cmd, userId, info) : {};
	}
}
// TODO: remove undo handling or check it with persistence
class PasteCellsCommandRequestHandler {
	async handleCommand(command, runner, streamsheetId, userId /* , undo */) {
		// const { sourceref, targetref, action, fill } = command;
		const { sourcecells, targetcells, action, fill } = command;
		// fix target and source ranges
		// const sourcerange = fixCellRange(sourceref);
		// const targetrange = fixCellRange(targetref);
		return runner.request('pasteCells', userId, { streamsheetId, sourcecells, targetcells, action, fill });
	}
}

class AbstractCellsPropertiesCommandHandler {
	getInfo({info}) {
		if (info) {
			// adjust cell references/ranges...
			info.cells.forEach((cell) => {
				if (cell.range) cell.range = fixCellRange(cell.range);
			});
		}
		return info;
	}

	async handleCommand(command, runner, streamsheetId, userId ) {
		const info = this.getInfo(command);
		return info ? runner.request('mergeCellsProperties', { streamsheetId, userId, info }) : {};
	}
}
class FormatCellsCommandRequestHandler extends AbstractCellsPropertiesCommandHandler {
}
class TextFormatCellsCommandRequestHandler extends AbstractCellsPropertiesCommandHandler {
}
class CellAttributesCommandRequestHandler extends AbstractCellsPropertiesCommandHandler {
}

// DL-1668
class SetCellsCommandRequestHandler {

	toReferences(all, descr) {
		// DL-1668 delete cell if it has no value, formula or level...
		if (descr.value == null && !descr.formula && !descr.level) {
			all.push(descr.reference);
		}
		return all;
	}

	async deleteCells(descriptors = [], runner, streamsheetId, userId) {
		const deleteCells = descriptors.reduce(this.toReferences, []);
		if (deleteCells.length) {
			try {
				return runner.request('deleteCells', userId, { indices: deleteCells, streamsheetId });
			} catch (ex) {	/* ignore any failure on delete */	}
		}
		return undefined;
	}

	async updateCells(descriptors, runner, streamsheetId, userId) {
		const updateCells = filterRequestCellDescriptors(descriptors);
		const cells = descriptorsToCellDescriptorsObject(updateCells);
		return runner.request('setCells', userId, { cells, streamsheetId });
	}

	async handleCommand(command, runner, streamsheetId, userId, undo) {
		const cellDescriptors = undo ? command.undo.cellDescriptors : command.cells;
		await this.deleteCells(cellDescriptors, runner, streamsheetId, userId);
		return this.updateCells(cellDescriptors, runner, streamsheetId, userId);
	}
}

class SetCellDataCommandRequestHandler {
	async handleCommand(command, runner, streamsheetId, userId, undo) {
		let result = {};
		const { json, expr } = command.undo;
		if (undo && !json && !expr) {
			// undo command but cell was empty before
			if (command.reference) {
				const ranges = command.reference.split(';');
				const cellranges = ranges.map((range) => fixCellRange(range));
				result = await runner.request('deleteCells', userId, {
					ranges: cellranges,
					streamsheetId
				});
			}
		} else {
			const descr = getCellDescriptorFromCommand(command, undo);
			result = await runner.request('setCellAt', userId, {
				index: command.reference,
				celldescr: descr,
				streamsheetId
			});
		}
		return result;
	}
}

class SetGraphCellsCommandRequestHandler {
	async handleCommand(command, runner, streamsheetId, userId /* , undo */) {
		const { streamsheetIds, cellDescriptors } = command;
		const graphCells = cellDescriptors.map((descriptor) => getGraphCells(descriptor));
		return runner.request('replaceGraphCells', userId, { graphCells, streamsheetIds });
	}
}

class SetCellLevelsCommandRequestHandler {
	async handleCommand(command, runner, streamsheetId, userId) {
		return command.levels
			? runner.request('setCellsLevel', userId, { levels: command.levels, streamsheetId })
			: { warning: 'No levels object within SetCellLevelsCommand!' };
	}
}

class DeleteCellContentCommandRequestHandler {
	async handleCommand(command, runner, streamsheetId, userId, undo) {
		let result;
		if (undo) {
			const { cellDescriptors } = command.undo;
			const cells = descriptorsToCellDescriptorsObject(filterRequestCellDescriptors(cellDescriptors));
			result = await runner.request('setCells', userId, { cells, streamsheetId });
		} else if (command.reference && (command.action === 'all' || command.action === 'values')) {
			// reference might contain several ranges, separated by ';'...
			const ranges = command.reference.split(';');
			// pop last cell, which refers to the active cell...
			ranges.pop();
			// range might be a single cell, so...
			const cellranges = ranges.map((range) => fixCellRange(range));
			// result contains array of deleted cells...
			result = await runner.request('deleteCells', userId, { ranges: cellranges, streamsheetId });
		}
		return result || {};
	}
}

class ExecuteFunctionCommandRequestHandler {
	async handleCommand(command, runner, streamsheetId, userId) {
		return runner.request('executeFunction', userId, {
			funcstr: command.function,
			streamsheetId
		});
	}
}

class DeleteTreeItemCommandRequestHandler {
	async handleCommand(command, runner, streamsheetId, userId) {
		const cmdinfo = command.custom || {};
		const messageId = command.level === -1 ? -1 : cmdinfo.messageId;
		return runner.request('deleteMessage', userId, {
			messageId,
			messageBox: cmdinfo.messageBox,
			streamsheetId
		});
	}
}

class MarkCellValuesCommandRequestHandler {
	async handleCommand(command, runner, streamsheetId, userId) {
		return runner.request('markRequests', userId, {
			markers: command.markers,
			streamsheetId
		});
	}
}
class ZoomChartCommandRequestHandler {
	constructor(allHandlers) {
		this.handlers = allHandlers;
	}
	sortCommands(cmd1, cmd2) {
		// command.MarkCellValuesCommand always first
		if (cmd1.name === 'command.MarkCellValuesCommand') return -1;
		if (cmd2.name === 'command.MarkCellValuesCommand') return 1;
		return 0;
	}

	async runCommand(cmd, runner, streamsheetId, userId) {
		try {
			const handler = this.handlers.get(cmd.name);
			if (handler) return await handler.handleCommand(cmd, runner, streamsheetId, userId);
			throw new Error(`No handler for command: ${cmd.name}`);
		} catch (err) {
			return err;
		}
	}
	async handleCommand(command, runner, streamsheetId, userId /* , undo */) {
		command.commands.sort(this.sortCommands);
		const results = await Promise.all(
			command.commands.map((cmd) => this.runCommand(cmd, runner, streamsheetId, userId))
		);
		return results;
	}
}


class UpdateSheetNamesCommandRequestHandler {
	mapCommand(command) {
		let cmd = {};
		cmd.name = command.sheetname;
		switch (command.name) {
			case 'command.AddSheetNameCommand':
			case 'command.SetSheetNameCommand':
				cmd.celldescr = getCellDescriptorFromCommand(command);
				cmd.celldescr.newName = command.newName;
				break;
			case 'command.DeleteSheetNameCommand':
				break;
			default:
				cmd = undefined;
		}
		return cmd;
	}

	async handleCommand(command, runner, streamsheetId, userId) {
		const namedCells = {};
		command.commands.forEach((cmd) => {
			const mappedCmd = this.mapCommand(cmd);
			if (mappedCmd)
				namedCells[mappedCmd.name] = mappedCmd.celldescr || {};
		});
		return Object.keys(namedCells).length
			? runner.request('setNamedCells', userId, { namedCells, streamsheetId })
			: { warning: 'Ignore UpdateSheetNamesCommand because it contains no update commands' };
	}
}

class UpdateGraphCellsCommandRequestHandler {
	mapCommand(command) {
		let cmd = {};
		cmd.name = command.sheetname;
		switch (command.name) {
			case 'command.AddGraphCellCommand':
			case 'command.SetGraphCellCommand':
				cmd.celldescr = getCellDescriptorFromCommand(command);
				cmd.celldescr.newName = command.newName;
				break;
			case 'command.DeleteGraphCellCommand':
				break;
			default:
				cmd = undefined;
		}
		return cmd;
	}

	async handleCommand(command, runner, streamsheetId, userId) {
		const graphCells = {};

		command.commands.forEach((cmd) => {
			const mappedCmd = this.mapCommand(cmd);
			if (mappedCmd)
				graphCells[mappedCmd.name] = mappedCmd.celldescr || {};
		});

		return Object.keys(graphCells).length
			? runner.request('setGraphCells', userId, { graphCells, streamsheetId })
			: { warning: 'Ignore UpdateGraphCellsCommand because it contains no update commands' };
	}
}

// TODO: for testing purpose only. Should be removed!!!
// replace each CompoundCommand we deal with by a custom one...
class CompoundCommandRequestHandler {
	constructor(handlers) {
		this.handlers = handlers;
	}

	async handleCommand(command, runner, streamsheetId, userId) {
		const requests = [];
		command.commands.forEach((cmd) => {
			const handler = this.handlers.get(cmd.name);
			if (handler && handler.f) {
				requests.push(handler.toRequest(cmd));
			}
		});
		return requests.length ? runner.request('bulkRequests', userId, { streamsheetId, requests }) : {};
	}
}

class CommandRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES.COMMAND_MESSAGE_TYPE
		);
		this._commandRequestHandlers = new Map([
			// include editable-web-component:
			// [
			// 	'command.CellAttributesCommand',
			// 	new CellAttributesCommandRequestHandler()
			// ],
			// [
			// 	'command.DeleteCellsCommand',
			// 	new DeleteCellsCommandRequestHandler()
			// ],
			// ~

			[
				'command.DeleteCellContentCommand',
				new DeleteCellContentCommandRequestHandler()
			],
			[
				'command.DeleteTreeItemCommand',
				new DeleteTreeItemCommandRequestHandler()
			],
			[
				'command.ExecuteFunctionCommand',
				new ExecuteFunctionCommandRequestHandler()
			],

			// include editable-web-component:
			// [
			// 	'command.FormatCellsCommandWC',
			// 	new FormatCellsCommandRequestHandler()
			// ],
			// [
			// 	'command.InsertCellsCommand',
			// 	new InsertCellsCommandRequestHandler()
			// ],
			// [
			// 	'command.PasteCellsFromClipboardCommand',
			// 	new PasteCellsCommandRequestHandler()
			// ],
			// ~
			[
				'command.MarkCellValuesCommand',
				new MarkCellValuesCommandRequestHandler()
			],
			[
				'command.SetCellDataCommand',
				new SetCellDataCommandRequestHandler()
			],
			[
				'command.SetCellLevelsCommand',
				new SetCellLevelsCommandRequestHandler()
			],
			[
				'command.SetCellsCommand',
				new SetCellsCommandRequestHandler()
			],
			[
				'command.SetGraphCellsCommand',
				new SetGraphCellsCommandRequestHandler()
			],

			// include editable-web-component:
			// [
			// 	'command.TextFormatCellsCommand',
			// 	new TextFormatCellsCommandRequestHandler()
			// ],
			// ~

			[
				'command.UpdateGraphCellsCommand',
				new UpdateGraphCellsCommandRequestHandler()
			],
			[
				'command.UpdateSheetNamesCommand',
				new UpdateSheetNamesCommandRequestHandler()
			]
		]);
		// compound commands:
		this._commandRequestHandlers.set(
			'command.ZoomChartCommand',
			new ZoomChartCommandRequestHandler(this._commandRequestHandlers)
		);
		// include editable-web-component:
		// this.compoundCommandHandler = new CompoundCommandRequestHandler(this._commandRequestHandlers);
	}

	async handle(request, machineserver) {
		const { command, machineId } = request;
		const streamsheetId = request.streamsheetId || command.streamsheetId;
		const runner = machineserver.getMachineRunner(machineId);
		// logger.info('handle command request: ', command);
		logger.info(`handle request for command: ${command.name}`);
		if (runner) {
			const result = await this.handleCommand(
				command,
				runner,
				streamsheetId,
				getUserId(request),
				request.undo
			) || {};
			result.command = command.name;
			result.machineId = machineId;
			result.streamsheetId = streamsheetId;
			return this.confirm(request, result);
		}
		throw this.reject(request, `No machine found with id '${request.machineId}'.`);
	}

	async handleCommand(command, runner, streamsheetId, userId, undo) {
		// include editable-web-component:
		// const requestHandler = command.name === 'command.CompoundCommand'
		// 		? this.compoundCommandHandler
		// 		: this._commandRequestHandlers.get(command.name);
		// ~

		// delete editable-web-component:
		const requestHandler = this._commandRequestHandlers.get(command.name);
		// ~

		if (requestHandler) {
			const result = await requestHandler.handleCommand(
				command,
				runner,
				streamsheetId,
				userId,
				undo
			);
			return result;
		}
		logger.info(`Ignore command: ${command.name}`);
		return { warning: `Unknown command: ${command.name}.` };
	}
}

class MetaInformationRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.META_INFORMATION_MESSAGE_TYPE
		);
	}

	handle(request /* , machineserver */) {
		logger.info('MetaInformationRequestHandler');
		return new Promise((resolve /* , reject */) => {
			const meta = {
				version: VERSION,
				buildNumber: BUILD_NUMBER
			};
			resolve(this.confirm(request, meta));
		});
	}
}

module.exports = {
	CommandRequestHandler,
	AddInboxMessageRequestHandler,
	CreateStreamSheetRequestHandler,
	DeleteMachineRequestHandler,
	DeleteStreamSheetRequestHandler,
	GetMachineRequestHandler,
	LoadMachineRequestHandler,
	LoadSubscribeMachineRequestHandler,
	LoadSheetCellsRequestHandler,
	MachineUpdateSettingsRequestHandler,
	MetaInformationRequestHandler,
	OpenMachineRequestHandler,
	PauseMachineRequestHandler,
	RenameMachineRequestHandler,
	UpdateStreamSheetStreamsRequestHandler,
	SetMachineCycleTimeRequestHandler,
	SetMachineLocaleRequestHandler,
	SetMachineUpdateIntervalRequestHandler,
	SetNamedCellsRequestHandler,
	SetGraphCellsRequestHandler,
	SetSheetCellsRequestHandler,
	SetStreamSheetsOrderRequestHandler,
	StartMachineRequestHandler,
	StepMachineRequestHandler,
	StopMachineRequestHandler,
	SubscribeMachineRequestHandler,
	UnloadMachineRequestHandler,
	UnsubscribeMachineRequestHandler
};
