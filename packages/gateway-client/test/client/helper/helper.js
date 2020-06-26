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

const {
	Graph,
	JSONReader,
	JSONWriter
} = require('@cedalo/jsg-core');

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

module.exports = {
	graphToJSON,
	JSONToGraph
};
