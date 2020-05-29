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
const config = {
	mongodb: {
		MONGO_HOST: process.env.MONGO_HOST || 'localhost',
		MONGO_PORT: parseInt(process.env.MONGO_PORT, 10) || 27017,
		MONGO_DATABASE: process.env.MONGO_DATABASE || 'test'
	}
};
const {
    RepositoryManager,
    MongoDBGraphRepository,
    MongoDBMachineRepository,
} = require('../index');

const graphRepository = new MongoDBGraphRepository(config.mongodb);
const machineRepository = new MongoDBMachineRepository(config.mongodb);

describe('RepositoryManager', () => {
	it('should start all repositories', () => {
		expect.assertions(1);
		RepositoryManager.init({
			graphRepository,
			machineRepository
		});
		return RepositoryManager.connectAll().then(() => RepositoryManager.setupAllIndicies())
            .then((r, err) => {
	expect(err).toBe(undefined);
});
	});
});
