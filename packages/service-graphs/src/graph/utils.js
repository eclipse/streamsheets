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
