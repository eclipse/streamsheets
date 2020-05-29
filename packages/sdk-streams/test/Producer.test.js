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
const SimpleProducer = require('./sample/SimpleProducer');
const SimpleConsumer = require('./sample/SimpleConsumer');
const SimpleProviderConfiguration = require('./sample/SimpleProviderConfiguration');
const SimpleSource = require('./sample/SimpleSource');

// eslint-disable-next-line no-undef
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

const providerConfig = new SimpleProviderConfiguration({
	name: 'Simple provider'
});
const simpleConfig = {
	name: 'Simple Producer',
	baseTopic: 'topic',
	topics: ['1', '2'],
	connector: {
		name: 'Simple Connector',
		duration: 4000,
		provider: providerConfig.toJSON()
	}
};
process.on('unhandledRejection', (error) => {
	// Won't execute
	console.log('unhandledRejection', error);
});

describe('producerAPI#Producer', async () => {
	it('should create a Producer ', async (done) => {
		SimpleSource.start(100);
		const producer = new SimpleProducer(simpleConfig);
		const res = await producer._connect();
		producer.subscribe(this, (msg) => {
			expect(msg).toBeDefined();
			expect(msg.metadata).toBeDefined();
			expect(msg.data).toBeDefined();
			expect(msg.metadata.producer).toEqual(simpleConfig.name);
			expect(msg.metadata.connector).toEqual(simpleConfig.connector.name);
			expect(msg.metadata.provider).toEqual(simpleConfig.connector.provider.name);
		});
		await setTimeout(() => {
			expect(producer).toBeDefined();
			SimpleSource.stop();
			done();
		}, 4000);
	});
	it('should create a Producer from a ProducerConfiguration', async (done) => {
		SimpleSource.start(100);
		const producer = new SimpleProducer(simpleConfig);
		await producer.connect();
		producer.subscribe(this, (msg) => {
			expect(msg).toBeDefined();
			expect(msg.metadata).toBeDefined();
			expect(msg.data).toBeDefined();
			expect(msg.metadata.producer).toEqual(simpleConfig.name);
			expect(msg.metadata.connector).toEqual(simpleConfig.connector.name);
			expect(msg.metadata.provider).toEqual(simpleConfig.connector.provider.name);
		});
		await setTimeout(() => {
			expect(producer).toBeDefined();
			SimpleSource.stop();
			done();
		}, 4000);
	});
	it('should produce() from a Producer ', async (done) => {
		SimpleSource.start(1000);
		const producer = new SimpleProducer(simpleConfig);
		await producer._connect();
		producer.subscribe(this, (msg) => {
			expect(msg).toBeDefined();
			expect(msg.metadata).toBeDefined();
			expect(msg.data).toBeDefined();
			expect(msg.metadata.producer).toEqual(simpleConfig.name);
			expect(msg.metadata.connector).toEqual(simpleConfig.connector.name);
			expect(msg.metadata.provider).toEqual(simpleConfig.connector.provider.name);
			expect(msg.data.hello).toEqual('world');
		});
		await producer._produce({
			message: {
				hello: 'world'
			}
		});

		await setTimeout(() => {
			expect(producer).toBeDefined();
			SimpleSource.stop();
			done();
		}, 10);
	});
	it.skip('should request() from a Producer ', async (done) => { // revisit request spec
		SimpleSource.start(5000);
		const producer = new SimpleProducer({
			...simpleConfig,
			name: 'sender'
		});
		const producer1 = new SimpleProducer({
			...simpleConfig,
			name: 'receiver'
		});
		const received = [];
		producer1.subscribe(this, (msg) => {
			received.push(msg);
			if (msg.data.requestId === 0) {
				expect(msg.data.requestId).toEqual(0);
				SimpleSource.stop();
				done();
			}
			expect(msg).toBeDefined();
			expect(msg.metadata).toBeDefined();
			expect(msg.data).toBeDefined();
			expect(msg.metadata.producer).toEqual('receiver');
			expect(msg.metadata.connector).toEqual(simpleConfig.connector.name);
			expect(msg.metadata.provider).toEqual(simpleConfig.connector.provider.name);
		});

		producer1.on(SimpleProducer.EVENTS.READY, async () => {
			await producer._request({
				metadata: {
					method: 'POST',
					topic: 'topic1'
				},
				data: {
				}
			});
		});
		const p1 = await producer._connect();
		const p2 = await producer1._connect();
	});
	it('should emit error', async () => {
		const producer1 = new SimpleProducer({
			...simpleConfig,
			name: 'receiver'
		});
		producer1.on(SimpleProducer.EVENTS.ERROR, (error) => {
			expect(error).toBeDefined();
		});
		try {
			await producer1.connect();
		}		catch (e) {
			expect(e).toBeDefined();
		}
	});
	it('should update configuration', async () => {
		const producer1 = new SimpleProducer({
			...simpleConfig,
			name: 'receiver'
		});
		producer1.on(SimpleProducer.EVENTS.ERROR, (error) => {
			expect(error).toBeDefined();
		});
		let done = false;
		let count = 0;
		producer1.on(SimpleProducer.EVENTS.READY, () => {
			count++;
			if (!done) {
				const confDiff = {
					$set: {
						connector: {
							baseTopic: 'cedalo/base/'
						}
					}
				};
				done = true;
				producer1.update(confDiff);
			}
		});
		producer1.connect();
		setTimeout(() => {
			expect(count).toEqual(2);
		}, 4000, count);
	});
});
