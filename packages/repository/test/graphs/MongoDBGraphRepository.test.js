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

const mongo = require('mongodb').MongoClient;

const { MongoDBGraphRepository } = require('../..');

const config = () => (
	{
		MONGO_HOST: process.env.MONGO_HOST || 'localhost',
		MONGO_PORT: parseInt(process.env.MONGO_PORT, 10) || 27018,
		MONGO_DATABASE: process.env.MONGO_DATABASE || `random${Math.floor(Math.random() * 10000)}`
	}
)

function dropDatabase(databaseConfig, possibleError) {
	const connectionURL = `mongodb://${databaseConfig.MONGO_HOST}:${databaseConfig.MONGO_PORT}/${databaseConfig.MONGO_DATABASE}`;
	return mongo.connect(connectionURL)
		.then(conn => conn.db().dropDatabase())
		.then((reponse) => {
			if (possibleError) {
				return Promise.reject(possibleError);
			}
			return reponse;
		});
}

// TODO: create real instances of graphs in all unit tests
describe('@cedalo/repository#MongoDBGraphRepository', () => {
	describe('connect()', () => {
		it('should connect successfully when host is available', () => {
			const graphRepository = new MongoDBGraphRepository(config());
			return graphRepository.connect();
		});

		it('should fail connecting when host is not available', () => {
			expect.assertions(1);
			const graphRepository = new MongoDBGraphRepository({
				MONGO_HOST: 'unknown-host'
			});
			return graphRepository
				.connect()
				.catch(error => expect(error).toBeInstanceOf(Error));
		});
	});
	describe('saveGraph()', () => {
		it('should save a graph', () => {
			const databaseConfig = config();
			const graphRepository = new MongoDBGraphRepository(databaseConfig);
			const graph = {
				id: 'example-graph'
			};
			return graphRepository
				.connect()
				.then(() => graphRepository.saveGraph(graph))
				.then(() => dropDatabase(databaseConfig))
				.catch(error => dropDatabase(databaseConfig, error));
		});
	});
	describe('existsGraph()', () => {
		it('should return true if a graph exists', () => {
			const databaseConfig = config();
			const graphRepository = new MongoDBGraphRepository(databaseConfig);
			const graph = {
				id: 'example-graph'
			};
			return graphRepository
				.connect()
				.then(() => graphRepository.saveGraph(graph))
				.then(() => graphRepository.existsGraph('example-graph'))
				.then(exists => expect(exists).toBe(true))
				.then(() => dropDatabase(databaseConfig))
				.catch(error => dropDatabase(databaseConfig, error));
		});
	});
	describe('findGraph()', () => {
		it('should get graph by id', () => {
			const databaseConfig = config();
			const graphRepository = new MongoDBGraphRepository(databaseConfig);
			const newGraph = {
				id: 'example-graph'
			};
			return graphRepository
				.connect()
				.then(() => graphRepository.saveGraph(newGraph))
				.then(() => graphRepository.findGraph('example-graph'))
				.then(graph => expect(graph).toEqual(newGraph))
				.then(() => dropDatabase(databaseConfig))
				.catch(error => dropDatabase(databaseConfig, error));
		});
	});
	describe('updateGraph()', () => {
		it('should update a graph', () => {
			const databaseConfig = config();
			const graphRepository = new MongoDBGraphRepository(databaseConfig);
			const newGraph = {
				id: 'example-graph'
			};
			return graphRepository
				.connect()
				.then(() => graphRepository.saveGraph(newGraph))
				.then(() => graphRepository.findGraph('example-graph'))
				.then(graph => expect(graph).toEqual(newGraph))
				.then(() => {
					newGraph.name = 'example-name-updated';
					return graphRepository.updateGraph('example-graph', newGraph);
				})
				.then(() => graphRepository.findGraph('example-graph'))
				.then((updatedGraph) => {
					expect(updatedGraph.id).toBe('example-graph');
					expect(updatedGraph.name).toBe('example-name-updated');
				})
				.then(() => dropDatabase(databaseConfig))
				.catch(error => dropDatabase(databaseConfig, error));
		});
	});
	describe('getGraphs()', () => {
		it('should get graphs', () => {
			const databaseConfig = config();
			const graphRepository = new MongoDBGraphRepository(databaseConfig);
			const graph = {
				id: 'example-graph'
			};
			return graphRepository
				.connect()
				.then(() => graphRepository.saveGraph(graph))
				.then(() => graphRepository.getGraphs())
				.then(graphs => expect(graphs.length).toBe(1))
				.then(() => dropDatabase(databaseConfig))
				.catch(error => dropDatabase(databaseConfig, error));
		});
	});
	describe('deleteGraph()', () => {
		it('should remove graphs by id', () => {
			expect.assertions(3);
			const databaseConfig = config();
			const graphRepository = new MongoDBGraphRepository(databaseConfig);
			const graph = {
				id: 'example-graph'
			};
			const graph2 = {
				id: 'example-graph-2'
			};
			return graphRepository
				.connect()
				.then(() => graphRepository.saveGraph(graph))
				.then(() => graphRepository.saveGraph(graph2))
				.then(() => graphRepository.getGraphs())
				.then(graphs => expect(graphs.length).toBe(2))
				.then(() => graphRepository.deleteGraph(graph.id))
				.then(() => graphRepository.getGraphs())
				.then(graphs => expect(graphs.length).toBe(1))
				.then(() => graphRepository.deleteGraph(graph2.id))
				.then(() => graphRepository.getGraphs())
				.then(graphs => expect(graphs.length).toBe(0))
				.then(() => dropDatabase(databaseConfig))
				.catch(error => dropDatabase(databaseConfig, error));
		});
	});
	describe('deleteAllGraphs()', () => {
		it('should remove all graphs', () => {
			expect.assertions(2);
			const databaseConfig = config();
			const graphRepository = new MongoDBGraphRepository(databaseConfig);
			const graph = {
				id: 'example-graph'
			};
			const graph2 = {
				id: 'example-graph-2'
			};
			return graphRepository
				.connect()
				.then(() => graphRepository.saveGraph(graph))
				.then(() => graphRepository.saveGraph(graph2))
				.then(() => graphRepository.getGraphs())
				.then(graphs => expect(graphs.length).toBe(2))
				.then(() => graphRepository.deleteAllGraphs())
				.then(() => graphRepository.getGraphs())
				.then(graphs => expect(graphs.length).toBe(0))
				.then(() => dropDatabase(databaseConfig))
				.catch(error => dropDatabase(databaseConfig, error));
		});
	});
});
