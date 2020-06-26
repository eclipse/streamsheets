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
const StreamsManager = require('../src/StreamsManager');
const MongoDBStreamsRepository = require('../src/persistence/MongoDBStreamsRepository');
const CONFIGS = require('./configs');
const sdk = require('@cedalo/sdk-streams');
const { createAndConnect } = require('@cedalo/messaging-client');
const { Topics } = require('@cedalo/protocols');
const BadProvider = require('./helpers/BadProvider');

const TEST_COLLECTION = 'test_consumers';
// eslint-disable-next-line no-undef
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

const connectorConfig1 = {
	id: 'connector1',
	_id: 'connector1',
	name: 'bad connector 1',
	className: 'ConnectorConfiguration',
	provider: {
		id: 'badProvider',
		_id: 'badProvider',
		isRef: true
	}
};
const consumerConfig1 = {
	id: 'bad',
	_id: 'bad',
	name: 'bad',
	className: 'ConsumerConfiguration',
	connector: {
		_id: 'connector1',
		id: 'connector1',
		className: 'ConnectorConfiguration',
		isRef: true
	}
};

const initManager = async () => {
	const streamsManager = new StreamsManager({});
	await streamsManager.init();
	await streamsManager.defineProviders(CONFIGS.providers.map(p => p.id), false);
	CONFIGS.consumers.forEach(c => streamsManager.setConfiguration(c));
	CONFIGS.producers.forEach(c => streamsManager.setConfiguration(c));
	CONFIGS.connectors.forEach(c => streamsManager.setConfiguration(c));
	return streamsManager;
};

process.on('uncaughtException', (err) => {
	console.error(err);
});

describe('@cedalo/service-streams#StreamsManager', () => {
	it('should define providers', async (done) => {
		const streamsManager = await initManager();
		expect(streamsManager.configsManager.providerConfigs.size).toEqual(CONFIGS.providers.length);
		expect(streamsManager.providersList.length).toEqual(CONFIGS.providers.length);
		done();
	});

	it('should define consumers', async (done) => {
		const streamsManager = await initManager();
		await streamsManager.loadConsumers();
		expect(streamsManager.consumersList.length).toEqual(CONFIGS.consumers.length);
		done();
	});

	it('should define producers', async (done) => {
		const streamsManager = await initManager();
		await streamsManager.loadProducers();
		expect(streamsManager.producersList.length)
			.toEqual(CONFIGS.producers.length);
		done();
	});

	it('should never hang', async (done) => {
		const messagingClient = await createAndConnect();
		messagingClient.subscribe(`${Topics.SERVICES_STREAMS_EVENTS}/#`);
		messagingClient.on('message', (topic, message) => {
			try {
				const msg = JSON.parse(message);
				console.log(msg);
			} catch (e) {
				console.error(e);
			}
		});
		process.on('uncaughtException', (err) => {
			console.error(err);
		});

		const repo = new MongoDBStreamsRepository({ collection: TEST_COLLECTION });
		await repo.reset();
		const streamsManager = new StreamsManager(repo);
		await streamsManager.defineProviders([]);
		streamsManager.configsManager.connectorConfigs.clear();
		streamsManager.configsManager.consumerConfigs.clear();
		streamsManager.configsManager.providerConfigs.clear();
		streamsManager.providers.clear();
		const pConfiguration = new sdk.ProviderConfiguration({
			id: 'badProvider',
			name: 'badProvider',
			className: 'ProviderConfiguration',
			definitions: {
				connector: [],
				consumer: []
			}
		});
		const badProvider =  new BadProvider(pConfiguration);
		streamsManager.setConfiguration(pConfiguration);
		streamsManager.providers.set('badProvider', badProvider);
		streamsManager.setConfiguration(connectorConfig1);
		streamsManager.setConfiguration(consumerConfig1);
		await streamsManager.init();
		await streamsManager.loadConsumers();
		setTimeout(() => {
			console.log('end');
			expect(streamsManager.providersList.length).toEqual(1);
			done();
		}, 500);
	});

	it.skip('should defineStreams()', async (done) => {
		const repo = new MongoDBStreamsRepository();
		await repo.reset();
		await repo.init();
		const streamsManager = new StreamsManager(repo);
		await streamsManager.start();
		streamsManager.consumersList.forEach((f) => {
			f.on(sdk.Consumer.EVENTS.TESTED, (res) => {
				console.log(res);
			});
		});
		setTimeout((/* list */) => {
			done();
		}, 4000, streamsManager.consumersList);
	});
});

