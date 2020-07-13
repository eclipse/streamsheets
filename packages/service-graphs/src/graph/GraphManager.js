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
const EventEmitter = require('events');
const IdGenerator = require('@cedalo/id-generator');
const { logger } = require('@cedalo/logger');
const GraphWrapper = require('./GraphWrapper');
const JSG = require('@cedalo/jsg-core');

const {
	Expression,
	DeleteSheetNameCommand,
	AddSheetNameCommand,
	SetSheetNameCommand,
	UpdateSheetNamesCommand,
	SheetName
} = require('@cedalo/jsg-core');

const SheetParserContext = require('./SheetParserContext');

JSG.FormulaParser.context = new SheetParserContext();

const findExistingName = (graph, id) =>
	graph
		.getSheetNames()
		.find(
			(name) =>
				name.getName().startsWith('|') && name.getValue().id === id
		);

/**
 * A class representing a graph server that manages different graph instances.
 *
 * @class GraphServer
 * @public
 */
module.exports = class GraphManager {
	constructor() {
		// TODO: replace with persistence repository
		this._graphWrappers = new Map();
		this._emitter = new EventEmitter();
	}

	get graphs() {
		return Array.from(this._graphWrappers.values());
	}

	on(event, callback) {
		this._emitter.on(event, callback);
	}

	off(event, callback) {
		this._emitter.removeListener(event, callback);
	}

	ping() {
		this._emitter.emit('ping', 'pong');
	}

	// returns id under which graph was added or undefined...
	addGraph({ id = IdGenerator.generate(), graph, machineId }) {
		const add = graph && !this._graphWrappers.has(id);
		if (add) {
			graph.setType(id); // <-- TODO: remove this, should not be required!! misuse of type attribute...
			this._graphWrappers.set(id, new GraphWrapper(graph, machineId));
		}
		return add ? id : undefined;
	}

	handleStreamCellsUpdate(machineId, namedCells) {
		const graphWrapper = this.getGraphWrapperByMachineId(machineId);
		if(!graphWrapper){
			return;
		}
		const { graph } = graphWrapper;
		const mergedWithCurrent = Object.entries(namedCells)
			.filter(([name]) => name.startsWith('|'))
			.map(([name, descr]) => ({
				name,
				descr,
				sheetName: findExistingName(graph, descr.value.id)
			}));

		const remainingSheetNames = mergedWithCurrent
			.filter(({ sheetName }) => !!sheetName)
			.map(({ sheetName }) => sheetName.getName());

		const deleteCommands = graph
			.getSheetNames()
			.filter((sheetName) => sheetName.getName().startsWith('|'))
			.filter(
				(sheetName) =>
					!remainingSheetNames.includes(sheetName.getName())
			)
			.map((sheetName) => new DeleteSheetNameCommand(graph, sheetName));

		const createUpdateCommands = mergedWithCurrent
			.map(({ name, descr, sheetName }) => {
				if (!sheetName) {
					return new AddSheetNameCommand(
						graph,
						new SheetName(name, new Expression(descr.value))
					);
				}
				if (sheetName.getName() !== name) {
					return new SetSheetNameCommand(
						graph,
						sheetName,
						name,
						new Expression(descr.value)
					);
				}
				return null;
			})
			.filter((c) => !!c);

		const commands = [...deleteCommands, ...createUpdateCommands];

		if (commands.length > 0) {
			const updateCommand = new UpdateSheetNamesCommand();
			commands.forEach((command) => updateCommand.add(command));
			graphWrapper.executeCommands(updateCommand.toObject());
		}
	}

	removeGraph(id) {
		// TODO: remove all subscribers
		return this._graphWrappers.delete(id);
	}

	removeAllGraphs() {
		// TODO: remove all subscribers
		this._graphWrappers.clear();
	}

	getGraph(graphId) {
		const graphWrapper = this.getGraphWrapper(graphId);
		return graphWrapper ? graphWrapper.graph : undefined;
	}

	getGraphWrapper(graphId) {
		logger.debug(`Getting graph wrapper for '${graphId}'`);
		return this._graphWrappers.get(graphId);
	}

	getGraphByMachineId(machineId) {
		const graphWrapper = this.getGraphWrapperByMachineId(machineId);
		return graphWrapper ? graphWrapper.graph : undefined;
	}

	getGraphWrapperByMachineId(machineId) {
		logger.debug(`Getting graph wrapper for machine id '${machineId}'`);
		return this.graphs.find(
			(graphWrapper) => graphWrapper.machineId === machineId
		);
	}

	unloadGraphForMachineId(machineId) {
		let graphId;
		this._graphWrappers.forEach((graphWrapper, id) => {
			if (graphWrapper.machineId === machineId) graphId = id;
		});
		if (graphId) this.removeGraph(graphId);
	}

	async executeCommands(graphId, command, options) {
		logger.debug(JSON.stringify(command));
		const graphWrapper = this.getGraphWrapper(graphId);
		if (!graphWrapper) {
			throw new Error(`No graph found for id ${graphId}`);
		}
		return graphWrapper.executeCommands(command, options);
	}

	handleMachineDescriptorUpdate(event) {
		logger.info('handle machine descriptor update...', event);
		const { data: descriptor, srcId } = event;
		const graphWrapper = this.getGraphWrapperByMachineId(srcId);
		if (graphWrapper) graphWrapper.updateMachineDescriptor(descriptor);
	}

	handleSelection(graphId, selection) {
		logger.debug('handling selection');
		logger.debug(JSON.stringify(selection));
		const graphWrapper = this.getGraphWrapper(graphId);
		if (!graphWrapper) {
			throw new Error(`No graph found for id ${graphId}`);
		}
		return graphWrapper.handleSelection(selection);
	}

	handleStreamSheetStep(
		machineId,
		streamsheetId,
		cells,
		namedCells,
		graphCells,
		drawings,
		graphItems,
	) {
		this.updateCells(
			machineId,
			streamsheetId,
			cells,
			drawings,
			graphItems,
			graphCells,
			namedCells
		);
	}

	updateCells(
		machineId,
		streamsheetId,
		data,
		drawings,
		graphItems,
		graphCells,
		namedCells
	) {
		const processSheet = this.getStreamSheet(machineId, streamsheetId);
		if (processSheet) {
			const command = new JSG.SetSheetCellsCommand(
				processSheet,
				data,
				drawings,
				graphItems,
				graphCells,
				namedCells
			);
			command.execute();
		}
	}

	getStreamSheet(machineId, streamsheetId) {
		const processSheetContainer = this.getStreamSheetContainer(
			machineId,
			streamsheetId
		);
		return processSheetContainer
			? processSheetContainer.getStreamSheet()
			: null;
	}

	getStreamSheetContainer(machineId, streamsheetId) {
		const graph = this.getGraphByMachineId(machineId);
		return graph
			? graph.getStreamSheetContainerById(streamsheetId)
			: undefined;
	}
};
