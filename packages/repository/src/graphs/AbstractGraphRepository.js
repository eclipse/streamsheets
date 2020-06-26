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
const noopPromise = (reason = { code: 'NOT_IMPLEMENTED' }) => Promise.reject(reason);

/* eslint no-unused-vars: "off" */
/**
 * An abstract class representing a repository to access graphs.
 *
 * @class AbstractGraphRepository
 * @public
 */
module.exports = class AbstractGraphRepository {
	/**
	 * A method to get all the graphs stored in the repository.
	 *
	 * @method getGraphs
	 * @public
	 * @return {Promise} An array of all the graphs.
	 */
	getGraphs() {
		return noopPromise();
	}

	/**
	 * A method to save a new graph into the repository.
	 *
	 * @method saveGraph
	 * @param {Graph} graph - The graph to save.
	 * @public
	 * @return {Promise} An array of all the graphs.
	 */
	saveGraph(graph) {
		return noopPromise();
	}

	/**
	 * A method to find a graph from the repository by its id.
	 *
	 * @method findGraph
	 * @param {String} id - The id of the graph.
	 * @public
	 * @return {Promise} The graph with the given id.
	 */
	findGraph(id) {
		return noopPromise();
	}

	/**
	 * A method to update a graph in the repository.
	 *
	 * @method updateGraph
	 * @param {Graph} graph - The graph to update.
	 * @public
	 * @return {Promise} The updated graph.
	 */
	updateGraph(graph) {
		return noopPromise();
	}

	/**
	 * A method to delete a graph in the repository.
	 *
	 * @method deleteGraph
	 * @param {Graph} graph - The graph to delete.
	 * @public
	 * @return {Promise} The deleted graph.
	 */
	deleteGraph(graphId) {
		return noopPromise();
	}

	/**
	 * A method to delete all graphs in the repository.
	 *
	 * @method deleteAll
	 * @public
	 * @return {Promise}.
	 */
	deleteAll() {
		return noopPromise();
	}
};
