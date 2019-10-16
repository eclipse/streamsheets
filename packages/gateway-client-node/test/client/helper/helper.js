'use strict';

const JSG = require('@cedalo/jsg-core');
const { Graph, JSONReader, JSONWriter } = require('@cedalo/jsg-core');

const graphToJSON = (graph) => {
	const writer = new JSONWriter();
	writer.writeStartDocument();
	graph.save(writer);
	writer.writeEndDocument();
	const result = writer.flush();
	return JSON.parse(result)['o-graphitem'];
};

const JSONToGraph = (json) => {
	const graph = new Graph();
	const reader = new JSONReader(json);
	const root = reader.getRoot();
	graph.read(reader, root);
	return graph;
};

const getStreamSheetContainer = (graphDefinition) =>
	graphDefinition['a-graphitem']['0']['a-graphitem']['0']['a-graphitem']['0'];

const getSheetId = (processSheetContainer) =>
	processSheetContainer['o-al']['a-al'][1]['a-al']['0']['o-vl'].v;

module.exports = {
	getStreamSheetContainer,
	getSheetId,
	graphToJSON,
	JSONToGraph
};
