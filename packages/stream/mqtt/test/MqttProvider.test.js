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
const streamModule = require('../index');
const { TestHelper } = require('@cedalo/sdk-streams');
const DockerHelper = require('./DockerHelper');
const fs = require('fs');
const path = require('path');

const testTopic = 'cedalo/test';
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

beforeEach(async (done) => {
//	await DockerHelper.startService('mosquitto5');
	done();
});

afterEach(async (done) => {
//	await DockerHelper.stopServices();
	done();
});


describe('MqttProvider', () => {
	it('should create a new MqttProducer and test()', async (done) => {
		await DockerHelper.startService('mosquitto5');

		const connectorConfig = {
			host: 'localhost',
			port: 1883,
			baseTopic: ''
		};
		const producerConfig = {
			name: 'testProducer',
			className: 'ProducerConfiguration',
			connector: connectorConfig,
			topic: testTopic,
			clean: true
		};
		const consumerConfig = {
			name: 'testConsumer',
			className: 'ConsumerConfiguration',
			connector: connectorConfig,
			topics: [testTopic],
			clean: true
		};
		const produceConfig = {
			topic: testTopic,
			message: {
				test: 'testme'
			},
			userProperties: {
				userProp1: 'test1'
			}
		};
		try {
			const { result } = await TestHelper.testPubSub({
				streamModule,
				producerConfig,
				consumerConfig,
				produceConfig
			});
			expect(result).not.toEqual(false);
			if (result) {
				expect(result.origin).toEqual(produceConfig.topic);
				expect(result.message.data).toEqual(produceConfig.message);
			}
			await DockerHelper.stopServices();
		} catch (e) {
			console.error(e);
			await DockerHelper.stopServices();
		}
		done();
	});

	it('should create a new MQTT5 MqttProducer and test() userProperties', async (done) => {
		await DockerHelper.startService('mosquitto5');
		const connectorConfig = {
			host: 'localhost',
			port: 1883,
			baseTopic: ''
		};
		const producerConfig = {
			name: 'testProducer',
			className: 'ProducerConfiguration',
			connector: connectorConfig,
			topic: testTopic,
			clean: true
		};
		const consumerConfig = {
			name: 'testConsumer',
			className: 'ConsumerConfiguration',
			connector: connectorConfig,
			topics: [testTopic],
			clean: true
		};
		const produceConfig = {
			topic: testTopic,
			message: {
				test: 'testme'
			},
			userProperties: {
				userProp1: 'test1'
			}
		};
		try {
			const { result } = await TestHelper.testPubSub({
				streamModule,
				producerConfig,
				consumerConfig,
				produceConfig
			});
			expect(result).not.toEqual(false);
			if (result) {
				expect(result.origin).toEqual(produceConfig.topic);
				expect(result.message.data).toEqual(produceConfig.message);
				expect(result.message.metadata.userProperties).toEqual(produceConfig.userProperties);
			}
			await DockerHelper.stopServices();
		} catch (e) {
			console.error(e);
			await DockerHelper.stopServices();
		}
		done();
	});

	it('should create a new MQTT5 MqttProducer and test() userProperties on connect', async (done) => {
		await DockerHelper.startService('mosquitto5');

		const connectorConfig = {
			host: 'localhost',
			port: 1883,
			baseTopic: '',
			clean: true,
			userPropertiesConnect: {
				userProp1: 'test1'
			}
		};
		const producerConfig = {
			name: 'testProducer',
			className: 'ProducerConfiguration',
			connector: connectorConfig,
			clean: true,
			topic: testTopic
		};
		try {
			const stream = await TestHelper.createConnectorAndConnect(streamModule,producerConfig);
			expect(stream).not.toEqual(false);
			await DockerHelper.stopServices();
		} catch (e) {
			console.error(e);
			await DockerHelper.stopServices();
		}
		done();
	});
	it.skip('should create a new AWS MqttProducer and test()', async (done) => {
		const CLIENT_ID = '477d573e95';
		const cert = file => fs.readFileSync(path.resolve(__dirname, `./certs/${file}`)).toString();
		const testTopic1 = 'test';
		const connectorConfig = {
			protocolVersion: 4,
			host: 'mqtt://a3igl9bnra2ex1.iot.eu-central-1.amazonaws.com',
			clientId: 'dev-test',
			caCert: {
				path: 'aws-ca.pem',
				value: cert('aws-ca.pem')
			},
			certPath: {
				path: `${CLIENT_ID}-certificate.pem.crt`,
				value: cert(`${CLIENT_ID}-certificate.pem.crt`)
			},
			keyPath: {
				path: `${CLIENT_ID}-private.pem.key`,
				value: cert(`${CLIENT_ID}-private.pem.key`)
			},
			baseTopic: 'cedalo/'
		};
		const consumerConfig = {
			name: 'AWS test Consumer',
			className: 'ConsumerConfiguration',
			connector: connectorConfig,
			topics: [testTopic1],
			clean: true
		};
		const producerConfig = {
			name: 'AWS test Producer',
			className: 'ProducerConfiguration',
			connector: connectorConfig,
			topic: testTopic1,
			clean: true
		};
		const produceConfig = {
			topic: 'test',
			message: {
				test: 'testme'
			}
		};
		try {
			const { result } = await TestHelper.testPubSub({
				streamModule,
				producerConfig,
				consumerConfig,
				produceConfig
			});
			expect(result).not.toEqual(false);
			if (result) {
				expect(result.origin).toEqual(connectorConfig.baseTopic + produceConfig.topic);
				expect(result.message.data).toEqual(produceConfig.message);
			}
		} catch (e) {
			console.error(e);
		}
		done();
	});

});
