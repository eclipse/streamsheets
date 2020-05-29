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
const { createDefaultGraph } = require('../../graph/utils');
const { loadGraphByMachineId } = require('../../graph/loadGraphs');
const { AddItemCommand, DeleteItemCommand, StreamSheetContainer } = require('@cedalo/jsg-core');
const { RequestHandler } = require('@cedalo/service-core');
const { GraphServerMessagingProtocol } = require('@cedalo/protocols');

const logger = require('../../utils/logger').create({
	name: 'GraphRequestHandlers'
});
const VERSION = require('../../../package.json').version;
const BUILD_NUMBER = require('../../../meta.json').buildNumber;

const loadGraphWrapper = async (machineId, graphManager, graphRepository) => {
	let graphWrapper = graphManager.getGraphWrapperByMachineId(machineId);
	// Check if graph is already loaded in graph manager
	if (graphWrapper) {
		logger.debug('Load graph from memory.');
		return graphWrapper;
	}
	try {
		await loadGraphByMachineId(machineId, graphManager, graphRepository);
		logger.info('Graph loaded from persistence layer');
		graphWrapper = graphManager.getGraphWrapperByMachineId(machineId);
		graphWrapper.graph.removeAllSheetSelections();
		return graphWrapper;
	} catch (error) {
		logger.error(error);
		throw error;
	}
};

const createGraphIfMachineLoadedFromTemplate = async (
	machineId,
	templateId,
	streamsheets,
	graphManager,
	options
) => {
	if (templateId) {
		const graphWrapper = await loadGraphWrapper(templateId, graphManager, options);
		const graph = graphWrapper.graph.copy(true, true);
		// TODO: at the moment support only one streamsheet in template
		const streamsheet = streamsheets[0];
		const processSheet = graph
			.getStreamSheetsContainer()
			.getFirstStreamSheetContainer();
		processSheet
			.getStreamSheetContainerAttributes()
			.setSheetId(streamsheet.id);
		// (4) add the graph copy for the machine
		graphManager.addGraph({
			graph,
			machineId
		});
		graph.invalidateTerms();
		graph.evaluate();
	}
};

class PingRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES
				.PING_GRAPHSOCKETSERVER_MESSAGE_TYPE
		);
	}

	handle(request /* , graphManager */) {
		return new Promise((resolve /* , reject */) => {
			resolve(
				this.confirm(request, {
					message: 'pong'
				})
			);
		});
	}
}

class CreateGraphRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES.CREATE_GRAPH_MESSAGE_TYPE
		);
	}

	handle(request, graphManager) {
		return new Promise((resolve, reject) => {
			try {
				const graph = createDefaultGraph();
				const graphId = graphManager.addGraph({
					graph,
					machineId: request.machineId
				});
				if (graphId) {
					const graphWrapper = graphManager.getGraphWrapper(graphId);
					resolve(
						this.confirm(request, {
							graph: {
								id: graphWrapper.id,
								graphdef: graphWrapper.getGraphAsJSON(),
								machineId: graphWrapper.machineId
							}
						})
					);
				} else {
					reject(
						this.reject(request, 'Failed to add new Graph instance')
					);
				}
			} catch (error) {
				const message = `Failed to create new Graph instance! ${error &&
					error.message}`;
				reject(this.reject(request, message));
			}
		});
	}
}

class CreateStreamSheetRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES
				.CREATE_STREAMSHEET_MESSAGE_TYPE
		);
	}

	async handle(request, graphManager) {
		logger.debug('Adding streamsheet');
		const {
			machineId,
			streamsheetId,
			streamsheetName /* , activeItemId */,
			position
		} = request;
		const graphWrapper = graphManager.getGraphWrapperByMachineId(machineId);
		const graph = graphWrapper.graph;
		// const active = graph.getItemById(activeItemId);
		const processContainer = graph.getStreamSheetsContainer();
		const item = new StreamSheetContainer();
		item.evaluate();
		item.setSize(21000, 13000);
		item.setOrigin(position.x + 500, position.y + 500);
		item.getStreamSheetContainerAttributes().setSheetId(streamsheetId);
		item.getStreamSheetContainerAttributes().setStep(0);
		item.getStreamSheet().setName(streamsheetName);
		item.getSheetCaption().setName(`Process Sheet - ${streamsheetName}`);
		const command = new AddItemCommand(item, processContainer);
		const commandString = command.toObject();
		const executed = await graphManager.executeCommands(
			graphWrapper.id,
			commandString
		);
		return this.confirm(request, {
			graph: {
				id: graphWrapper.id,
				graphdef: graphWrapper.getGraphAsJSON(),
				machineId: graphWrapper.machineId
			},
			command: commandString,
			executed
		});
	}
}

class DeleteStreamSheetRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES
				.DELETE_STREAMSHEET_MESSAGE_TYPE
		);
	}

	async handle(request, graphManager) {
		logger.debug('Deleting streamsheet');
		const { machineId, streamsheetId } = request;
		const graphWrapper = graphManager.getGraphWrapperByMachineId(machineId);
		const processContainer = graphWrapper.graph.getStreamSheetContainerById(
			streamsheetId
		);
		if (processContainer) {
			const command = new DeleteItemCommand(processContainer);
			const commandString = command.toObject();
			const executed = await graphManager.executeCommands(
				graphWrapper.id,
				commandString
			);

			return this.confirm(request, {
				graph: {
					id: graphWrapper.id,
					graphdef: graphWrapper.getGraphAsJSON(),
					machineId: graphWrapper.machineId
				},
				command: commandString,
				executed
			});
		}
		throw this.reject(
			request,
			'Failed to delete streamsheet. No process container found.'
		);
	}
}

class DeleteGraphRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES.DELETE_GRAPH_MESSAGE_TYPE
		);
	}

	handle(request, graphManager, monitorManager, options) {
		logger.debug('Handling graph_delete request');
		return new Promise((resolve, reject) => {
			loadGraphWrapper(request.machineId, graphManager, options).then(
				(graphWrapper) => {
					if (graphWrapper) {
						const deleted = graphManager.removeGraph(
							graphWrapper.id
						);
						if (deleted) {
							logger.debug(
								`Deleted graph with id '${graphWrapper.id}'`
							);
							resolve(
								this.confirm(request, {
									graph: {
										id: graphWrapper.id,
										deleted: true
									}
								})
							);
						} else {
							reject(
								this.reject(
									request,
									'Failed to delete to Graph instance.'
								)
							);
						}
					} else {
						reject(
							this.reject(
								request,
								'Failed to delete to Graph instance.'
							)
						);
					}
				}
			);
		});
	}
}

class GetGraphRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES.GET_GRAPH_MESSAGE_TYPE
		);
	}

	handle(request, graphManager) {
		return new Promise((resolve, reject) => {
			try {
				const graphWrapper = graphManager.getGraphWrapperByMachineId(
					request.machineId
				);
				if (graphWrapper) {
					logger.debug('Load graph from memory.');
					resolve(
						this.confirm(request, {
							graph: {
								id: graphWrapper.id,
								graphdef: graphWrapper.getGraphAsJSON()
							}
						})
					);
				} else {
					reject(
						this.reject(request, 'Failed to get Graph instance')
					);
				}
			} catch (error) {
				const message = `Failed to get Graph instance, ${error &&
					error.message}`;
				reject(this.reject(request, message));
			}
		});
	}
}

class InternalCommandRequestHandler {
	handleCommand(command, graphWrapper) {
		return new Promise((resolve /* , reject */) => {
			const processSheetId = this.getProcessSheetId(command);
			const result = {};
			const processSheet = graphWrapper.graph.getStreamSheetById(
				processSheetId
			);
			if (processSheet) {
				const cellDescriptors = processSheet.getCellDescriptors();
				const processSheetContainer = processSheet.getStreamSheetContainer();
				const streamsheetId = processSheetContainer
					.getStreamSheetContainerAttributes()
					.getSheetId()
					.getValue();
				result.streamsheetId = streamsheetId;
				result.cellDescriptors = cellDescriptors;
				result.machineDescriptor = graphWrapper.graph.getMachineDescriptor();
			}
			resolve(result);
		}).then((result) =>
			this.postHandleCommand(result, command, graphWrapper)
		);
	}

	getProcessSheetId() {
		throw new Error('Must be implemented by subclass.');
	}

	postHandleCommand(result) {
		return Promise.resolve(result);
	}
}

class PasteCellsCommandRequestHandler extends InternalCommandRequestHandler {
	getProcessSheetId(command) {
		return command.target.id;
	}
}

class PasteCellsFromClipboardCommandRequestHandler extends InternalCommandRequestHandler {
	getProcessSheetId(command) {
		return command.target.id;
	}
}

class DeleteCellsCommandRequestHandler extends InternalCommandRequestHandler {
	getProcessSheetId(command) {
		return command.range.id;
	}
}

class InsertCellsCommandRequestHandler extends InternalCommandRequestHandler {
	getProcessSheetId(command) {
		return command.range.id;
	}
}

class SetNameCommandRequestHandler extends RequestHandler {
	constructor() {
		super('command.SetNameCommand');
	}
	handleCommand(command, graphWrapper, request) {
		logger.debug('Handling selection request');
		return new Promise((resolve, /* reject */) => {
			// const processSheet = graphWrapper.graph.getStreamSheetById(command.itemId);
			// processSheet.setName(command.itemname);
			resolve(
				this.confirm(request, {
					graph: {
						id: graphWrapper.id,
						graphdef: graphWrapper.getGraphAsJSON(),
						machineId: graphWrapper.machineId
					}
				})
			);
		});
	}
}

// class SetAttributeAtPathCommandRequestHandler extends RequestHandler {
// 	constructor() {
// 		super('command.SetAttributeAtPathCommand');
// 	}
// 	handleCommand(command, graphWrapper, request) {
// 		logger.debug('Handling selection request');
// 		return new Promise((resolve, /* reject */) => {
// 			const item = graphWrapper.graph.getItemById(command.itemId);
// 			item.setAttributeAtPath(command.path, command.newValue);
// 			resolve(
// 				this.confirm(request, {
// 					graph: {
// 						id: graphWrapper.id,
// 						graphdef: graphWrapper.getGraphAsJSON(),
// 						machineId: graphWrapper.machineId
// 					}
// 				})
// 			);
// 		});
// 	}
// }

class CommandRequestHandler extends RequestHandler {
	constructor() {
		super(GraphServerMessagingProtocol.MESSAGE_TYPES.COMMAND_MESSAGE_TYPE);
		this._commandRequestHandlers = new Map([
			// [
			// 	'command.SetAttributeAtPathCommand',
			// 	new SetAttributeAtPathCommandRequestHandler()
			// ],
			['command.SetNameCommand', new SetNameCommandRequestHandler()],
			[
				'command.PasteCellsCommand',
				new PasteCellsCommandRequestHandler()
			],
			[
				'command.PasteCellsFromClipboardCommand',
				new PasteCellsFromClipboardCommandRequestHandler()
			],
			[
				'command.DeleteCellsCommand',
				new DeleteCellsCommandRequestHandler()
			],
			[
				'command.InsertCellsCommand',
				new InsertCellsCommandRequestHandler()
			]
		]);
	}

	async handle(request, graphManager, monitorManager, options) {
		logger.debug('Handling command request');
		const graphWrapper = await loadGraphWrapper(
			request.machineId,
			graphManager,
			options
		);

		const executed = await graphManager.executeCommands(
			request.graphId,
			request.command,
			{
				originalSender: request.sender,
				undo: request.undo
			}
		);
		const response = {
			graph: {
				id: graphWrapper.id,
				graphdef: graphWrapper.getGraphAsJSON(),
				machineId: graphWrapper.machineId
			},
			command: request.command,
			executed,
			originalSender: request.sender,
			undo: request.undo || false,
			redo: request.redo || false
		};
		if (request.command.name === 'command.SetSelectionCommand') {
			delete response.graph.graphdef;
		}
		const result = await this.handleCommand(
			request.command,
			graphWrapper,
			request
		);
		const finalResponse = Object.assign(response, result);
		return this.confirm(request, finalResponse);
	}

	async handleCommand(command, graphWrapper, request) {
		const requestHandler = this._commandRequestHandlers.get(command.name);
		if (requestHandler) {
			const result = await requestHandler.handleCommand(
				command,
				graphWrapper,
				request
			);
			return Promise.resolve(result);
		}
		if (command.name === 'command.CompoundCommand') {
			return Promise.all(
				command.commands.map(async (com) =>
					this.handleCommand(com, graphWrapper, request)
				)
			);
		}
		return Promise.resolve({});
	}
}

class SelectionRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES.SELECTION_MESSAGE_TYPE
		);
	}

	handle(request, graphManager) {
		logger.debug('Handling selection request');
		return new Promise((resolve, reject) => {
			const handled = graphManager.handleSelection(
				request.graphId,
				request.selection
			);
			if (handled) {
				resolve(this.confirm(request));
			} else {
				reject(this.reject(request, 'Selection could not be handled'));
			}
		});
	}
}

class LoadGraphRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES.LOAD_GRAPH_MESSAGE_TYPE
		);
	}

	async handle(request, graphManager, monitorManager, options) {
		logger.debug('Handling graph_load request');
		try {
			await createGraphIfMachineLoadedFromTemplate(
				request.machineId,
				request.templateId,
				request.streamsheets,
				graphManager,
				options
			);
			const graphWrapper = await loadGraphWrapper(
				request.machineId,
				graphManager,
				options
			);
			graphWrapper.updateProcessSheets(request.streamsheets);
			return this.confirm(request, {
				graph: {
					id: graphWrapper.id,
					graphdef: graphWrapper.getGraphAsJSON(),
					machineId: graphWrapper.machineId
				},
				templateId: request.templateId
			});
		} catch (error) {
			logger.error(error);
			throw this.reject(request);
		}
	}
}

class SubscribeGraphRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES
				.SUBSCRIBE_GRAPH_MESSAGE_TYPE
		);
	}

	handle(request, graphManager, monitorManager, options) {
		logger.debug('Handling graph_subscribe request');
		return new Promise((resolve, reject) => {
			loadGraphWrapper(request.machineId, graphManager, options).then(
				(graphWrapper) => {
					if (graphWrapper) {
						logger.debug(
							`Client subscribed to graph with id '${
								graphWrapper.id
							}'`
						);
						graphWrapper.updateMachine(
							request.machine.machineDescriptor
						);
						monitorManager.subscribe(graphWrapper);
						resolve(
							this.confirm(request, {
								graph: {
									id: graphWrapper.id,
									subscribed: false
								}
							})
						);
					} else {
						reject(
							this.reject(
								request,
								'Failed to subscribe to Graph instance'
							)
						);
					}
				}
			);
		});
	}
}

class LoadSubscribeGraphRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES
				.LOAD_SUBSCRIBE_GRAPH_MESSAGE_TYPE
		);
	}

	async handle(request, graphManager, monitorManager, options) {
		logger.debug('Handling graph_load_subscribe request');
		try {
			await createGraphIfMachineLoadedFromTemplate(
				request.machineId,
				request.templateId,
				request.machine.streamsheets,
				graphManager,
				options
			);
			const graphWrapper = await loadGraphWrapper(
				request.machineId,
				graphManager,
				options
			);
			graphWrapper.updateProcessSheets(request.machine.streamsheets);
			graphWrapper.updateMachineLoadSubscribe(request.machine);
			monitorManager.subscribe(graphWrapper);
			return this.confirm(request, {
				graph: {
					id: graphWrapper.id,
					graphdef: graphWrapper.getGraphAsJSON(),
					machineId: graphWrapper.machineId
				},
				templateId: request.templateId
			});
		} catch (error) {
			logger.error(error);
			throw this.reject(request);
		}
	}
}

class UnsubscribeGraphRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES
				.UNSUBSCRIBE_GRAPH_MESSAGE_TYPE
		);
	}

	handle(request, graphManager, monitorManager) {
		logger.debug('Handling graph_unsubscribe request');
		return new Promise((resolve, reject) => {
			try {
				const graphWrapper = graphManager.getGraphWrapperByMachineId(
					request.machineId
				);
				if (graphWrapper) {
					monitorManager.unsubscribe(graphWrapper);
					resolve(
						this.confirm(request, {
							TODO: 'Unsubscribe from graph wrapper.',
							graph: {
								id: graphWrapper.id,
								subscribed: true
							}
						})
					);
				} else {
					reject(
						this.reject(
							request,
							'Failed to subscribe to Graph instance'
						)
					);
				}
			} catch (error) {
				const message = `Failed to subscribe to Graph instance, ${error &&
					error.message}`;
				reject(this.reject(request, message));
			}
		});
	}
}

class UpdateProcessSheetRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES
				.UPDATE_PROCESS_SHEET_MESSAGE_TYPE
		);
	}

	handle(request, graphManager, monitorManager, options) {
		logger.debug('Handling update_process_sheet request');
		return new Promise((resolve, reject) => {
			loadGraphWrapper(request.machineId, graphManager, options).then(
				(graphWrapper) => {
					if (graphWrapper) {
						logger.debug(
							`Update process sheets '${graphWrapper.id}'`
						);
						graphWrapper.updateProcessSheets([request.streamsheet]);
						resolve(
							this.confirm(request, {
								graph: {
									id: graphWrapper.id
								}
							})
						);
					} else {
						reject(
							this.reject(
								request,
								'Failed to update process sheets'
							)
						);
					}
				}
			);
		});
	}
}


class PutMessageRequestHandler extends RequestHandler {
	constructor() {
		super(GraphServerMessagingProtocol.MESSAGE_TYPES.MESSAGE_PUT);
	}

	handle(request, graphManager, monitorManager, options) {
		return new Promise((resolve, reject) => {
			try {
				loadGraphWrapper(request.machineId, graphManager, options).then(
					(graphWrapper) => {
						const type = request.src;
						const messageBoxId = request.srcId;
						const message = request.message;
						graphWrapper.addMessage(type, messageBoxId, message);
						resolve(this.confirm(request, {}));
					}
				);
			} catch (error) {
				const message = `Failed to create new Graph instance! ${error &&
					error.message}`;
				reject(this.reject(request, message));
			}
		});
	}
}

class MetaInformationRequestHandler extends RequestHandler {
	constructor() {
		super(
			GraphServerMessagingProtocol.MESSAGE_TYPES
				.META_INFORMATION_MESSAGE_TYPE
		);
	}

	handle(request) {
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
	CreateGraphRequestHandler,
	CreateStreamSheetRequestHandler,
	DeleteGraphRequestHandler,
	DeleteStreamSheetRequestHandler,
	GetGraphRequestHandler,
	LoadGraphRequestHandler,
	LoadSubscribeGraphRequestHandler,
	MetaInformationRequestHandler,
	PutMessageRequestHandler,
	SubscribeGraphRequestHandler,
	UnsubscribeGraphRequestHandler,
	UpdateProcessSheetRequestHandler,
	PingRequestHandler,
	SelectionRequestHandler
};
