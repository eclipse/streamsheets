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

const { mix } = require('mixwith');
const { Errors, CODES } = require('@cedalo/error-codes');
const AbstractGraphRepository = require('./AbstractGraphRepository');
const MongoDBMixin = require('../mongoDB/MongoDBMixin');
const logger = require('@cedalo/logger').create({ name: 'GraphRepository'});


/**
 * An graph repository which stores the graphs in a MongoDB.
 *
 * @class MongoDBGraphRepository
 * @extends AbstractGraphRepository
 * @public
 */
module.exports = class MongoDBGraphRepository extends mix(AbstractGraphRepository).with(MongoDBMixin) {
	constructor(config = {}) {
		super(config);
	}

	saveGraph(graph) {
		const graphToSave = Object.assign({}, graph);
		graphToSave._id = graphToSave.id;
		return this.insertDocument(this.COLLECTIONS.GRAPHS, graphToSave)
			.then(() => graph);
	}

	findGraph(id) {
		return this.getDocument(this.COLLECTIONS.GRAPHS, id)
			.then((graph) => {
				if (!graph) {
					return Promise.reject(Errors.createInternal(CODES.GRAPH_NOT_FOUND));
				}
				delete graph._id;
				return graph;
			});
	}

	findGraphByMachineId(machineId) {
		logger.info(`Finding machine for id ${machineId}`);
		return this.getDocuments(this.COLLECTIONS.GRAPHS, { machineId })
			.then((result) => {
				if (!Array.isArray(result) || result.length === 0) {
					return Promise.reject(Errors.createInternal(CODES.GRAPH_NOT_FOUND));
				}
				const graph = result[0];
				delete graph._id;
				return graph;
			});
	}

	updateGraph(id, graph) {
		return this.updateDocument(this.COLLECTIONS.GRAPHS, id, graph);
	}

	saveOrUpdateGraph(id, graph) {
		return this.upsertDocument(
			this.COLLECTIONS.GRAPHS,
			{ _id: id },
			graph
		);
	}

	deleteGraph(id) {
		return this.deleteDocument(this.COLLECTIONS.GRAPHS, id);
	}
	deleteGraphByMachineId(machineId) {
		return this.deleteDocument(this.COLLECTIONS.GRAPHS, { machineId });
	}

	getGraphs() {
		return this.getDocuments(this.COLLECTIONS.GRAPHS, {});
	}

	deleteAllGraphs() {
		return this.db
			.collection(this.COLLECTIONS.GRAPHS)
			.remove({});
	}

	existsGraph(id) {
		return this.exists(this.COLLECTIONS.GRAPHS, id)
			.catch((error) => {
				if (error.isSemantic) {
					Object.assign(error, Errors.createInternal(CODES.GRAPH_NOT_FOUND));
				}
				return Promise.reject(error);
			});
	}

};
