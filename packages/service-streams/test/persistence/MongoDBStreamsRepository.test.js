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

const MongoDBStreamsRepository = require('../../src/persistence/MongoDBStreamsRepository');

const TEST_COLLECTION = 'test_consumers';
const REPO = new MongoDBStreamsRepository({ collection: TEST_COLLECTION });

const dummyConnector = {
	id: 'AWS_CE 1',
	name: 'AWS Central Europe 1',
	host: 'amazoneaws.com',
	port: '8883',
	clientId: 'Raspberry_Pi_Kristian',
	CACertificate: 'root-CA.crt',
	CACertificatePayload: '-----BEGIN RSA PRIVATE KEY-----\njlQvt9WdR9Vpg3WQT5+C3HU17' +
	'bUOwvhp/r0+viMcBUCRW85UqI2BJJKTi1IwQQ4c\ntyTrhYJYOP+A6JXt5BzDzZy/B7tjEMDBosPiwH2' +
	'm4MaP+6wTbi1qR1pFDL3fXYDr\n',
	clientCertificate: '5a6e5b4e7bcertificate.pem.crt',
	privateKey: '5a6e5b4e7bcertificate.pem.key',
	privateKeyPayload: '-----BEGIN RSA PRIVATE KEY-----\njlQvt9WdR9Vpg3WQT5+C3HU17bUOwvhp/r0+viMcB' +
	'UCRW85UqI2BJJKTi1IwQQ4c\ntyTrhYJYOP+A6JXt5BzDzZy/B7tjEMDBosPiwH2m4MaP+6wTbi1qR1pFDL3fXYDr\n',
	className: 'ConnectorConfiguration',
	providerConfig: {
		id: 'AWSIOT',
		name: 'AWS IoT (MQTT)',
		fields: ['provider', 'host', 'port', 'clientId', 'CACertificate', 'clientCertificate', 'privateKey']
	}
};

// jest will wait for returned promise!!
beforeAll(() => REPO.connect());
// create TEST_COLLECTION...
beforeEach(() => REPO.db.createCollection(TEST_COLLECTION));
// drop TEST_COLLECTION...
afterEach(() => REPO.db
    .dropCollection(TEST_COLLECTION)
    .catch(err => console.log('Ignore drop collection error! Usually it occurs if collection does not exist.', err)));

describe('MongoDBStreamsRepository', () => {
	it('should save a configuration', () => {
		expect.assertions(1);
		const conf1 = Object.assign({}, dummyConnector, { id: '1' });
		return REPO.saveConfiguration(conf1)
            .then(result => expect(result.upsertedCount).toBe(1));
	});

	it('should find all configurations', () => {
		expect.assertions(1);
		const conf1 = Object.assign({}, dummyConnector, { id: undefined });
		return REPO.saveConfiguration(conf1)
			.then(() => {
				REPO.findAllConfigurations().then(confs => expect(confs.length).toBe(1));
			});
	});

	it('should find configuration by id', (done) => {
		expect.assertions(1);
		const conf1 = Object.assign({}, dummyConnector, { id: 'test111' });
		REPO.saveConfiguration(conf1)
			.then(() => {
				REPO.findConfigurationById(conf1.id)
					.then((conf) => {
						expect(conf.id).toEqual(conf1.id);
						done();
					});
			});
	});

	it('should find configurations by type', () => {
		expect.assertions(1);
		const conf1 = Object.assign({}, dummyConnector, { id: 'test2222', className: 'testClass' });
		return REPO.saveConfiguration(conf1)
			.then(() => REPO.findConfigurationsByType('testClass')
					.then((confs) => {
						expect(confs.length).toEqual(1);
					}));
	});

	it('should delete a configuration by id', () => {
		expect.assertions(1);
		const conf1 = Object.assign({}, dummyConnector, { id: 'test3333', className: 'testClass' });
		return REPO.saveConfiguration(conf1)
			.then(() => REPO.deleteConfiguration('test3333')
				.then((result) => {
					expect(result).toEqual(1);
				}));
	});

	it('should delete all configurations', () => {
		expect.assertions(1);
		const conf1 = Object.assign({}, dummyConnector, { id: 'test3333', className: 'testClass' });
		return REPO.saveConfiguration(conf1)
			.then(() => REPO.deleteAllConfigurations()
				.then((result) => {
					expect(result).toEqual(1);
				}));
	});
});
