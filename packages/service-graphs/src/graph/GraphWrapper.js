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
'use strict';

const EventEmitter = require('events');
const { logger } = require('@cedalo/logger');
const {
	AddSheetRowCommand,
	DeleteSheetRowCommand,
	LoadMachineCommand,
	SetSheetCellsCommand,
	SetMachineCommand,
	SheetCommandFactory,
	JSONWriter
} = require('@cedalo/jsg-core');

const Redis = require('ioredis');

const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const REDIS_HOST = process.env.REDIS_HOST || 'internal-redis';

const redisConnection = (machineId) => {
	let stepAvailable = false;
	const redis = new Redis(REDIS_PORT, REDIS_HOST);
	const eventRedis = redis.duplicate();
	const machineStepKey = `machines.${machineId}.step`;

	const subscribe = () =>
		eventRedis.subscribe(`__keyspace@0__:${machineStepKey}`);
	const unsubscribe = () => eventRedis.unsubscribe();

	eventRedis.on('message', () => {
		stepAvailable = true;
		unsubscribe();
	});

	const fetchStep = async () => {
		if (!stepAvailable) {
			return null;
		}
		stepAvailable = false;
		subscribe();
		const stepJsonString = await redis.get(machineStepKey);
		return JSON.parse(stepJsonString);
	};

	subscribe();

	return {
		fetchStep
	};
};

module.exports = class GraphWrapper {
	constructor(graph, machineId) {
		this.id = graph.getType().getValue(); // <-- remove! should not be required! misuse of type attribute...
		this._graph = graph;
		this._emitter = new EventEmitter();
		this._machineId = machineId;
		this._redisConnection = redisConnection(machineId);
	}

	on(event, callback) {
		this._emitter.on(event, callback);
	}

	off(event, callback) {
		this._emitter.removeListener(event, callback);
	}

	get graph() {
		return this._graph;
	}

	get machineId() {
		return this._machineId;
	}

	// TODO: use utility methods
	getInbox(/* inboxId */) {
		// TODO: get inbox container by id
		// const inbox = this.getGraph().getItemById(inboxId);
		return this.graph
			.getMachineContainer() // MachineContainer
			.getStreamSheetsContainer() // StreamSheetsContainer
			.getItemAt(0) // ContentPane
			.getItemAt(0) // StreamSheetContainer
			.getItemAt(1); // InboxContainer
	}

	getOutbox() {
		return this.graph
			.getMachineContainer() // MachineContainer
			.getOutboxContainer(); // OutboxContainer
	}

	getTreeItemsNode(streamsheetId) {
		const processSheetContainer = this.graph.getStreamSheetContainerById(
			streamsheetId
		);
		return processSheetContainer
			.getItemAt(1) // InboxContainer
			.getItemAt(4) // TreeNode
			.getItemAt(0) // ContentPane
			.getItemAt(0); // TreeItemsNode
	}

	_getMessageBox(type, messageBoxId) {
		let messageBox = null;
		if (type === 'inbox') {
			messageBox = this.getInbox(messageBoxId);
		} else if (type === 'outbox') {
			messageBox = this.getOutbox();
		}
		return messageBox;
	}

	_getProcessSheet(streamsheetId) {
		const processSheetContainer = this.graph.getStreamSheetContainerById(
			streamsheetId
		);
		if (processSheetContainer) {
			return processSheetContainer.getStreamSheet();
		}
		return null;
	}

	updateMachine(machineDescriptor) {
		const command = new SetMachineCommand(this.graph, machineDescriptor);
		command.execute();
		return command;
	}

	updateMachineDescriptor(descriptor) {
		const command = this.updateNachine(descriptor);
		this._emitUpdate({ graphId: this.id, command: command.toObject() });
	}

	updateMachineLoadSubscribe(machine) {
		const command = new LoadMachineCommand(this.graph, machine);
		command.execute();
	}

	updateProcessSheets(streamsheets) {
		if (streamsheets && streamsheets[0]) {
			streamsheets.forEach((streamsheet) => {
				const processSheet = this._getProcessSheet(streamsheet.id);
				if (processSheet) {
					const command = new SetSheetCellsCommand(
						processSheet,
						streamsheet.sheet.cells,
						streamsheet.sheet.drawings,
						streamsheet.sheet.graphItems,
						streamsheet.sheet.graphCells,
						streamsheet.sheet.namedCells
					);
					command.execute();
				} else {
					logger.warn(
						`No process sheet found for streamsheet ${streamsheet.id}`
					);
				}
			});
		}
	}

	addMessage(type, messageBoxId, message) {
		const messageBox = this._getMessageBox(type, messageBoxId);
		if (messageBox) {
			const inboxSheet = messageBox.getMessageListItems();
			if (inboxSheet.containsRow(message.id, 1)) {
				const command = new AddSheetRowCommand(inboxSheet, [
					{
						value: 'Type',
						json: JSON.stringify(message.data)
					},
					{
						value: message.id
					},
					{
						value: message.time
					}
				]);
				command.execute();
				const commandObject = command.toObject();
				this._emitUpdate({ graphId: this.id, command: commandObject });
			}
		}
		return !!messageBox;
	}

	removeMessage(type, messageBoxId, messageId) {
		const messageBox = this._getMessageBox(type, messageBoxId);
		if (messageBox) {
			const inboxSheet = messageBox.getMessageListItems();
			const command = new DeleteSheetRowCommand(inboxSheet, messageId, 1);
			command.execute();
			const commandObject = command.toObject();
			this._emitUpdate({ graphId: this.id, command: commandObject });
		}
	}

	async applyLatestMachineStep() {
		const stepEventMessage = await this._redisConnection.fetchStep();
		if (stepEventMessage !== null) {
			const { event } = stepEventMessage;
			this.updateProcessSheets(
				event.streamsheets.map((streamsheet) => ({
					...streamsheet,
					sheet: { ...streamsheet }
				}))
			);
		}
	}

	async executeCommands(command, options) {
		await this.applyLatestMachineStep();
		let executed = false;
		// if (command.commands) {
		// 	logger.debug(`Executing compound command ${command.name}`);
		// 	executed = command.commands.every((subcommand) =>
		// 		this.executeCommands(subcommand, options)
		// 	);
		// } else {
		logger.debug(`Executing command ${command.name}`);
		const cmd = SheetCommandFactory.createCommand(this.graph, command);
		if (cmd === undefined) {
			logger.debug(`unknown command received: ${command.name}`);
		} else {
			if (options && options.undo) {
				try {
					cmd.undo();
				} catch (error) {
					logger.error('Error handling undo');
					logger.error(error);
				}
			} else if (options && options.redo) {
				try {
					cmd.redo();
				} catch (error) {
					logger.error('Error handling redo');
					logger.error(error);
				}
			} else {
				cmd.execute();
			}
			executed = true;
			const commandObject = cmd.toObject();
			this._emitUpdate({
				graphId: this.id,
				command: commandObject,
				options
			});
		}
		logger.debug(`Executed command: ${executed}`);
		return executed;
	}

	handleSelection(selection, options) {
		let executed = false;
		if (typeof selection === 'object') {
			logger.debug(`Handling selection from client ${selection.client}`);
			this._emitSelection({ graphId: this.id, selection, options });
			executed = true;
		}
		return executed;
	}

	getGraphAsJSON() {
		const writer = new JSONWriter();
		writer.writeStartDocument();
		writer.setMode('machineserver');
		this.graph.save(writer);
		writer.writeEndDocument();
		return writer.flush(true)['o-graphitem'];
	}

	copy() {
		const graph = this._graph.copy();
		const copy = new GraphWrapper(graph, this._machineId);
		return copy;
	}

	// TODO: deprecated
	// selectLoopElement(streamsheetId, jsonPath) {
	// 	const treeNode = this.getTreeItemsNode(streamsheetId);
	// 	// TODO: json path should already be returned by machine server in a format
	// 	// that can be interpreted by the graph server
	// 	const newPath = jsonPath.replace(/(\[)(\d)(\])/g, '.$2');
	// 	const item = treeNode.getItemByPath(newPath);
	// 	if (item === undefined || item.id === undefined) {
	// 		return;
	// 	}
	// 	const command = new SetSelectionCommand(treeNode, 'global', item.id.toString());
	// 	const commandObject = command.toObject();
	// 	this._emitter.emit('update', { graphId: this.id, command: commandObject });
	// 	command.execute();
	// }

	_emitUpdate(message) {
		this._emitEvent('update', message);
	}

	_emitSelection(message) {
		this._emitEvent('selection', message);
	}

	_emitEvent(type, message) {
		message.graph = {
			id: this.id,
			graphdef: this.getGraphAsJSON(),
			machineId: this.machineId
		};
		this._emitter.emit(type, message);
	}
};
