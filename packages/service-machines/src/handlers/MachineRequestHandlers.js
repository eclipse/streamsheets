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
 const { RequestHandler } = require('@cedalo/service-core');
 const { MachineServerMessagingProtocol } = require('@cedalo/protocols');
 const { decode } = require('../utils/utils');
 const trycatch = require('../utils/trycatch');
 const logger = require('../utils/logger').create({ name: 'MachineRequestHandlers' });
 const VERSION = require('../../package.json').version;
 const BUILD_NUMBER = require('../../meta.json').buildNumber;
 const ServerCommandsRequestHandlers = require('./ServerCommandsRequestHandlers');

 const addAll = (fromMap, toMap) => {
	 fromMap.forEach((value, key) => toMap.set(key, value));
	 return toMap;
 };
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

 const fixCellRange = (str) => (str && str.indexOf(':') < 0 ? `${str}:${str}` : str);

 const parseExpression = trycatch((expr) => JSON.parse(expr), logger);
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
		 return value != null || formula || (type && type !== 'undefined' && type !== 'null');
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

 const handleRequest = async (handler, machineserver, request, type, props = {}) => {
	 logger.info(`handle request: ${type}...`);
	 const runner = machineserver.getMachineRunner(request.machineId);
	 const userId = getUserId(request);
	 if (runner) {
		 const result = await runner.request(type, userId, props);
		 logger.info(`request: ${type}  -> result: `, result);
		 return handler.confirm(request, result);
	 }
	 // no runner, no machine:
	 logger.error(`handle request failed. no machine with id ${request.machineId}!`);
	 throw handler.reject(request, `No machine found with id '${request.machineId}'!`);
 };

 const loadMachineFromDB = (machineId, repositoryManager, scope) => async () => {
		const machine = await repositoryManager.machineRepository.findMachine(machineId);
		if (machine.isTemplate) machine.scope = scope;
		return machine;
 };
 

 class GetMachineRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.GET_MACHINE_MESSAGE_TYPE);
	 }
	 async handle(request, machineserver) {
		 const runner = machineserver.getMachineRunner(request.machineId);
		 if (runner) {
			 const result = await runner.getDefinition();
			 return this.confirm(request, { machine: result.machine });
		 }
		 // no runner, no machine:
		 logger.error(`handle request failed. no machine with id ${request.machineId}!`);
		 throw this.reject(request, `No machine found with id '${request.machineId}'!`);
	 }
 }

 class UnloadMachineRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.UNLOAD_MACHINE_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 const machineId = request.machineId;
		 const result = { machine: { id: machineId, unloaded: true } };
		 result.warning = (await machineserver.unloadMachine(result))
			 ? undefined
			 : `No machine found for id ${request.machineId}.`;
		 return this.confirm(request, result);
	 }
 }

 class DeleteMachineRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.DELETE_MACHINE_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 const machineId = request.machineId;
		 const result = { machine: { id: machineId, deleted: true } };
		 result.warning = (await machineserver.unloadMachine(result))
			 ? undefined
			 : `No machine found for id ${request.machineId}.`;
		 return this.confirm(request, result);
	 }
 }

 class StartMachineRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.START_MACHINE_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 return handleRequest(this, machineserver, request, 'start', undefined);
	 }
 }

 class PauseMachineRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.PAUSE_MACHINE_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 return handleRequest(this, machineserver, request, 'pause', undefined);
	 }
 }

 class StopMachineRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.STOP_MACHINE_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 return handleRequest(this, machineserver, request, 'stop', undefined);
	 }
 }

 class RenameMachineRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.RENAME_MACHINE_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver, repositoryManager) {
		 const nameInUse = await repositoryManager.machineRepository.machineWithNameExists(
			 request.machineId,
			 request.newName
		 );
		 if (nameInUse) {
			 // machine with same name already exists:
			 throw this.reject(request, `Machine with same name exists: '${request.newName}'!`);
		 }
		 return handleRequest(this, machineserver, request, 'update', {
			 props: { name: request.newName }
		 });
	 }
 }

 class UpdateMachineImageRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.UPDATE_MACHINE_IMAGE_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 const { previewImage, titleImage } = request;
		 return handleRequest(this, machineserver, request, 'update', { props: { previewImage, titleImage } });
	 }
 }

 class UpdateStreamSheetStreamsRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.EVENTS.STREAMSHEET_STREAM_UPDATE_EVENT); // FIXME: in protocols
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
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.STEP_MACHINE_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 return handleRequest(this, machineserver, request, 'step', undefined);
	 }
 }

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
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.SET_MACHINE_UPDATE_INTERVAL_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 const stepUpdateInterval = request.streamsheetStepInterval || -1;
		 return handleRequest(this, machineserver, request, 'updateMachineMonitor', { props: { stepUpdateInterval } });
	 }
 }

 class SetMachineCycleTimeRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 return handleRequest(this, machineserver, request, 'update', {
			 props: { cycletime: request.cycleTime }
		 });
	 }
 }

 class SetMachineLocaleRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.SET_MACHINE_LOCALE_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 return handleRequest(this, machineserver, request, 'update', {
			 props: { locale: request.locale }
		 });
	 }
 }

 class MachineUpdateExtensionSettingsRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.MACHINE_UPDATE_EXTENSION_SETTINGS);
	 }

	 async handle(request, machineserver) {
		 const { extensionId, settings } = request;
		 return handleRequest(this, machineserver, request, 'extensionUpdate', {
			 props: {
				 extensionId,
				 settings
			 }
		 });
	 }
 }

 class MachineUpdateSettingsRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.MACHINE_UPDATE_SETTINGS);
	 }

	 async handle(request, machineserver, repositoryManager) {
		 const { settings = {} } = request;
		 const { cycleTime, isCycleRegulated, isOPCUA, locale, newName, view } = settings;
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
				 isCycleRegulated,
				 isOPCUA,
				 locale,
				 newName,
				 view
			 }
		 });
	 }
 }

 class UnsubscribeMachineRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.UNSUBSCRIBE_MACHINE_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 const { machineId, sender } = request;
		 const clientId = sender ? sender.id : undefined;
		 try {
			 // await or otherwise possible error is not caught, making try/catch senseless here
			 return await handleRequest(this, machineserver, request, 'unsubscribe', { clientId });
		 } catch (err) {
			 logger.info(`Ignore unsubscribe! No open machine found for id ${machineId}.`);
			 return this.confirm(request, { warning: `No open machine found for id ${machineId}.` });
		 }
	 }
 }

 class CreateStreamSheetRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.CREATE_STREAMSHEET_MESSAGE_TYPE);
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
			 result.sheetType = request.sheetType;
			 return this.confirm(request, result);
		 }
		 // no runner, no machine:
		 throw this.reject(request, `No machine found with id '${request.machineId}'!`);
	 }
 }

 class DeleteStreamSheetRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.DELETE_STREAMSHEET_MESSAGE_TYPE);
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
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.STREAMSHEETS_ORDER_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 const { streamsheetIDs } = request;
		 return handleRequest(this, machineserver, request, 'setStreamSheetsOrder', { streamsheetIDs });
	 }
 }

 class OpenMachineRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.OPEN_MACHINE_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver, repositoryManager) {
		 logger.info(`open machine: ${request.machineId}...`);
		 const { machineId, session } = request;
		 try {
			 const result = await machineserver.openMachine(
					machineId,
					session,
					loadMachineFromDB(machineId, repositoryManager, session)
				);
			 logger.info(`open machine ${machineId} successful`);
			 return this.confirm(request, result);
		 } catch (err) {
			 logger.error(`open machine ${machineId} failed:`, err);
			 throw this.reject(request, `Failed to open machine with id '${machineId}'!`);
		 }
	 }
 }

 class LoadMachineRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_MACHINE_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver, repositoryManager) {
		 logger.info(`load machine: ${request.machineId}...`);
		 const { machineId, migrations, scope } = request;
		 try {
			 const result = await machineserver.loadMachine(
					machineId,
					scope,
					loadMachineFromDB(machineId, repositoryManager, scope)
				);
			 if (migrations) {
				 const migrated = await machineserver.applyMigrations(machineId, scope, migrations);
				 result.machine = migrated.machine;
			 }
			 const newMachine = !!result.templateId;
			 if (newMachine) {
				 await repositoryManager.machineRepository.saveMachine(JSON.parse(JSON.stringify(result.machine)));
			 }
			 logger.info(`load machine ${machineId} successful`);
			 return this.confirm(request, result);
		 } catch (err) {
			 logger.error(`load machine ${machineId} failed:`, err);
			 throw this.reject(request, `Failed to load machine with id '${machineId}'!`);
		 }
	 }
 }

 class LoadSubscribeMachineRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE);
	 }

	 createSubscribeRequest(response, loadRequest) {
		 const { machine } = response || {};
		 const { requestId, scope, sender, session } = loadRequest;
		 const machineId = machine ? machine.id : undefined;
		 return { type: 'subscribe', machineId, scope, session, sender, requestId }; // : IdGenerator.generate() };
	 }

	 async send(request, machineserver) {
		 try {
			 const subscribeHandler = new SubscribeMachineRequestHandler();
			 await subscribeHandler.handle(request, machineserver);
		 } catch (err) {
			 /* simply log and ignore */
			 logger.error(`Failed to subscribe to machine ${request.machineId}!\nError:`, err);
		 }
	 }
	 async handle(request, machineserver, repositoryManager) {
		 const result = await new LoadMachineRequestHandler().handle(request, machineserver, repositoryManager);
		 const subscribe = this.createSubscribeRequest(result.response, request);
		 await this.send(subscribe, machineserver);
		 return result;
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
			 const result = await runner.request('updateMachine', getUserId(request), machineDescriptor);
			 logger.info(`LoadSheetCellsRequestHandler update machine: ${runner.name}`);
			 return this.confirm(request, {
				 machineId,
				 command: command.name,
				 machineDescriptor: result
			 });
		 }
		 // no runner, no machine:
		 throw this.reject(request, `No machine found with id '${request.machineId}'!`);
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

 class GetCellRawValueRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.GET_CELL_RAW_VALUE);
	 }

	 async handle(request, machineserver) {
		 const { machineId, reference, streamsheetId } = request;
		 const runner = machineserver.getMachineRunner(machineId);
		 if (runner) {
			 const result = await runner.request('getCellRawValue', getUserId(request), {
				 streamsheetId,
				 index: reference
			 });
			 return this.confirm(request, {
				 machineId,
				 streamsheetId,
				 rawvalue: result.rawvalue
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
			 logger.info('SetNamedCellsRequestHandler set named-cells: ', namedCells);
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
			 const cells = descriptorsToCellDescriptorsObject(filterRequestCellDescriptors(cellDescriptors));
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
		 throw this.reject(request, `No machine found with id '${request.machineId}'!`);
	 }
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
	 adjustCellDescriptors(descriptors) {
		 const deleteCells = descriptors.reduce(this.toReferences, []);
		 const updateCells = filterRequestCellDescriptors(descriptors);
		 const cellDescriptors = descriptorsToCellDescriptorsObject(updateCells);
		 deleteCells.forEach((reference) => {
			 cellDescriptors[reference] = null;
		 });
		 return cellDescriptors;
	 }

	 async handleCommand(command, runner, streamsheetId, userId, undo) {
		 const cellDescriptors = undo ? command.undo.cellDescriptors : command.cells;
		 const cells = this.adjustCellDescriptors(cellDescriptors);
		 return runner.request('setCells', userId, { cells, streamsheetId });
	 }

	 getRequest(command) {
		 return {
			 type: 'setCells',
			 cells: command.cells ? this.adjustCellDescriptors(command.cells) : {},
			 streamsheetId: command.streamsheetId
		 };
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

 class SetGraphItemsCommandRequestHandler {
	 async handleCommand(command, runner, streamsheetId, userId /* , undo */) {
		 const { streamsheetIds, graphItems } = command;
		 return runner.request('replaceGraphItems', userId, { graphItems, streamsheetIds });
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
	 getCellRanges(reference) {
		 let cellranges;
		 if (reference) {
			 const ranges = reference.split(';');
			 // pop last cell, which refers to the active cell...
			 ranges.pop();
			 // range might be a single cell, so...
			 cellranges = ranges.map((range) => fixCellRange(range));
		 }
		 return cellranges;
	 }
	 async handleCommand(command, runner, streamsheetId, userId, undo) {
		 let result;
		 if (undo) {
			 const { cellDescriptors } = command.undo;
			 const cells = descriptorsToCellDescriptorsObject(filterRequestCellDescriptors(cellDescriptors));
			 result = await runner.request('setCells', userId, { cells, streamsheetId });
		 } else if (command.reference && (command.action === 'all' || command.action === 'values')) {
			 // reference might contain several ranges, separated by ';'...
			 const ranges = this.getCellRanges(command.reference);
			 // result contains array of deleted cells...
			 result = await runner.request('deleteCells', userId, { ranges, streamsheetId });
		 }
		 return result || {};
	 }
	 getRequest(command) {
		 return {
			 type: 'deleteCells',
			 ranges: this.getCellRanges(command.reference),
			 streamsheetId: command.streamsheetId
		 };
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
	 getRequest(command) {
		 return {
			 type: 'markRequests',
			 markers: command.markers,
			 streamsheetId: command.streamsheetId
		 };
	 }
 }
 class ZoomChartCommandRequestHandler {
	 constructor(allHandlers) {
		 this.handlers = allHandlers;
		 this.requestReducer = this.requestReducer.bind(this);
	 }

	 sortCommands(cmd1, cmd2) {
		 // command.MarkCellValuesCommand always first
		 if (cmd1.name === 'command.MarkCellValuesCommand') return -1;
		 if (cmd2.name === 'command.MarkCellValuesCommand') return 1;
		 return 0;
	 }
	 requestReducer(all, cmd) {
		 const handler = this.handlers.get(cmd.name);
		 if (handler && handler.getRequest) all.push(handler.getRequest(cmd));
		 return all;
	 }
	 async handleCommand(command, runner, streamsheetId, userId /* , undo */) {
		 const commands = command.commands.sort(this.sortCommands);
		 const requests = commands.reduce(this.requestReducer, []);
		 // combine same requests
		 return requests.length === commands.length
			 ? runner.request('bulkRequests', userId, { requests, streamsheetId })
			 : Promise.resolve({ error: 'ZoomChartCommand contains unsupported commands!' });
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
			 if (mappedCmd) namedCells[mappedCmd.name] = mappedCmd.celldescr || {};
		 });
		 return Object.keys(namedCells).length
			 ? runner.request('setNamedCells', userId, { namedCells, streamsheetId })
			 : { warning: 'Ignore UpdateSheetNamesCommand because it contains no update commands' };
	 }
 }

 class CommandRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.COMMAND_MESSAGE_TYPE);
		 this._commandRequestHandlers = new Map([
			 ['command.DeleteCellContentCommand', new DeleteCellContentCommandRequestHandler()],
			 ['command.DeleteTreeItemCommand', new DeleteTreeItemCommandRequestHandler()],
			 ['command.ExecuteFunctionCommand', new ExecuteFunctionCommandRequestHandler()],
			 ['command.MarkCellValuesCommand', new MarkCellValuesCommandRequestHandler()],
			 ['command.SetCellDataCommand', new SetCellDataCommandRequestHandler()],
			 ['command.SetCellLevelsCommand', new SetCellLevelsCommandRequestHandler()],
			 ['command.SetCellsCommand', new SetCellsCommandRequestHandler()],
			 ['command.SetGraphItemsCommand', new SetGraphItemsCommandRequestHandler()],
			 ['command.UpdateSheetNamesCommand', new UpdateSheetNamesCommandRequestHandler()]
		 ]);
		 addAll(ServerCommandsRequestHandlers, this._commandRequestHandlers);
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
			 const result =
				 (await this.handleCommand(command, runner, streamsheetId, getUserId(request), request.undo)) || {};
			 result.command = command.name;
			 result.machineId = machineId;
			 result.streamsheetId = streamsheetId;
			 return this.confirm(request, result);
		 }
		 // throw this.reject(request, `No machine found with id '${request.machineId}'.`);
		 logger.info(`Ignore command "${command.name}"! No machine found for id ${machineId}.`);
		 return this.confirm(request, { warning: `No machine found for id ${machineId}.` });
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
			 const result = await requestHandler.handleCommand(command, runner, streamsheetId, userId, undo);
			 return result;
		 }
		 logger.info(`Ignore command: ${command.name}`);
		 return { warning: `Unknown command: ${command.name}.` };
	 }
 }

 class MetaInformationRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.META_INFORMATION_MESSAGE_TYPE);
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

 class MachineActionRequestHandler extends RequestHandler {
	 constructor() {
		 super(MachineServerMessagingProtocol.MESSAGE_TYPES.MACHINE_ACTION_MESSAGE_TYPE);
	 }

	 async handle(request, machineserver) {
		 logger.info('MachineActionRequestHandler');
		 const { action, machineId } = request;
		 const runner = machineserver.getMachineRunner(machineId);
		 if (runner) {
			 try {
				 const result = await runner.request('runMachineAction', getUserId(request), action);
				 return this.confirm(request, result);
			 } catch (error) {
				 return this.reject(request, error.message);
			 }
		 }
		 return this.reject(request, `No machine found with id '${request.machineId}'.`);
	 }
 }

 module.exports = {
	 CommandRequestHandler,
	 AddInboxMessageRequestHandler,
	 CreateStreamSheetRequestHandler,
	 DeleteMachineRequestHandler,
	 DeleteStreamSheetRequestHandler,
	 GetMachineRequestHandler,
	 GetCellRawValueRequestHandler,
	 LoadMachineRequestHandler,
	 LoadSubscribeMachineRequestHandler,
	 LoadSheetCellsRequestHandler,
	 MachineActionRequestHandler,
	 MachineUpdateSettingsRequestHandler,
	 MachineUpdateExtensionSettingsRequestHandler,
	 MetaInformationRequestHandler,
	 OpenMachineRequestHandler,
	 PauseMachineRequestHandler,
	 RenameMachineRequestHandler,
	 UpdateStreamSheetStreamsRequestHandler,
	 SetMachineCycleTimeRequestHandler,
	 SetMachineLocaleRequestHandler,
	 SetMachineUpdateIntervalRequestHandler,
	 SetNamedCellsRequestHandler,
	 SetSheetCellsRequestHandler,
	 SetStreamSheetsOrderRequestHandler,
	 StartMachineRequestHandler,
	 StepMachineRequestHandler,
	 StopMachineRequestHandler,
	 SubscribeMachineRequestHandler,
	 UnloadMachineRequestHandler,
	 UnsubscribeMachineRequestHandler,
	 UpdateMachineImageRequestHandler
 };
