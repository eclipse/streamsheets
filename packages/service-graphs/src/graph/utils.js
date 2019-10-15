const JSG = require('@cedalo/jsg-core');

const { MachineGraph, JSONWriter } = JSG;

function createDefaultGraph() {
	const graph = new MachineGraph();
	graph.init();
	return graph;
}

function createGraphJSON(graph) {
	const json = {};
	const writer = new JSONWriter();
	writer.writeStartDocument();
	graph.save(writer);
	writer.writeEndDocument();
	json.graphdef = writer.flush(true)['o-graphitem'];
	return json;
}

// }

module.exports = {
	createGraphJSON,
	createDefaultGraph
};
