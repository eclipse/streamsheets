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
const SimpleConsumer = require('./sample/SimpleConsumer');
const SimpleProviderConfiguration = require('./sample/SimpleProviderConfiguration');
const SimpleSource = require('./sample/SimpleSource');

// eslint-disable-next-line no-undef
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

const providerConfig = new SimpleProviderConfiguration({
	name: 'Simple provider'
});
const simpleConfig = {
	name: 'Simple Consumer',
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

describe('Stream API#Consumer', async () => {
	it('should create a Consumer ', async (done) => {
		SimpleSource.start(100);
		const consumer = new SimpleConsumer(simpleConfig);
		const res = await consumer._connect();
		consumer.subscribe(this, (msg) => {
			expect(msg).toBeDefined();
			expect(msg.metadata).toBeDefined();
			expect(msg.data).toBeDefined();
			expect(msg.metadata.consumer).toEqual(simpleConfig.name);
			expect(msg.metadata.connector).toEqual(simpleConfig.connector.name);
			expect(msg.metadata.provider).toEqual(simpleConfig.connector.provider.name);
		});
		await setTimeout(() => {
			expect(consumer).toBeDefined();
			SimpleSource.stop();
			done();
		}, 4000);
	});
	it('should create a Consumer from a ConsumerConfiguration', async (done) => {
		SimpleSource.start(100);
		const consumer = new SimpleConsumer(simpleConfig);
		await consumer.connect();
		consumer.subscribe(this, (msg) => {
			expect(msg).toBeDefined();
			expect(msg.metadata).toBeDefined();
			expect(msg.data).toBeDefined();
			expect(msg.metadata.consumer).toEqual(simpleConfig.name);
			expect(msg.metadata.connector).toEqual(simpleConfig.connector.name);
			expect(msg.metadata.provider).toEqual(simpleConfig.connector.provider.name);
		});
		await setTimeout(() => {
			expect(consumer).toBeDefined();
			SimpleSource.stop();
			done();
		}, 4000);
	});
	it('should emit error', async () => {
		const consumer1 = new SimpleConsumer({
			...simpleConfig,
			name: 'receiver'
		});
		consumer1.on(SimpleConsumer.EVENTS.ERROR, (error) => {
			expect(error).toBeDefined();
		});
		try {
			await consumer1._connect();
		}		catch (e) {
			expect(e).toBeDefined();
		}
	});
	it('should update configuration', async () => {
		const consumer1 = new SimpleConsumer({
			...simpleConfig,
			name: 'receiver'
		});
		consumer1.on(SimpleConsumer.EVENTS.ERROR, (error) => {
			expect(error).toBeDefined();
		});
		let done = false;
		let count = 0;
		consumer1.on(SimpleConsumer.EVENTS.READY, () => {
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
				consumer1.update(confDiff);
			}
		});
		consumer1.connect();
		setTimeout(() => {
			expect(count).toEqual(2);
		}, 4000, count);
	});
});
