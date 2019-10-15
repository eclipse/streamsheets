const { CODES } = require('@cedalo/error-codes');
const logger = require('../utils/logger').create();

const { JSONReader, MachineGraph } = require('@cedalo/jsg-core');
const { createDefaultGraph } = require('./utils');

function JSONToGraph(json) {
	const graph = new MachineGraph();
	const reader = new JSONReader(json);
	const root = reader.getRoot();
	graph.read(reader, root.graphdef);
	return graph;
}

function createGraph() {
	return new Promise((resolve, reject) => {
		const graph = createDefaultGraph();
		if (graph) {
			resolve(graph);
		} else {
			reject(new Error('Could not create graph.'));
		}
	});
}

async function loadGraphByMachineId(machineId, graphManager, graphRepository) {
	let graph;
	let id;
	try {
		const graphJSON = await graphRepository.findGraphByMachineId(machineId);
		graph = JSONToGraph(JSON.stringify(graphJSON));
		id = graphJSON.id;
	} catch (error) {
		if (error.code === CODES.GRAPH_NOT_FOUND) {
			graph = await createGraph();
		} else {
			logger.error(error);
			throw error;
		}
	}
	if (graph) {
		graphManager.addGraph({
			graph,
			machineId,
			id
		});
	}
}

module.exports = {
	loadGraphByMachineId
};
