module.exports = class TestHelper {
	static async provideStream(streamModule, config) {
		const provider = new streamModule.Provider();
		return provider.provide(config);
	}

	static async testPubSub(config) {
		return new Promise(async (res) => {
			const {
				streamModule,
				consumerConfig = {},
				producerConfig = {},
				timeout = 6000,
				produceConfig = {
					topic: 'testTopic',
					message: {
						test: 'testme'
					}
				}
			} = config;
			let timer = null;
			try {
				const consumer = await TestHelper.createConnectorAndConnect(
					streamModule,
					{
						...consumerConfig,
						className: 'ConsumerConfiguration'
					}
				);
				const producer = await TestHelper.createConnectorAndConnect(
					streamModule,
					{
						...producerConfig,
						className: 'ProducerConfiguration'
					}
				);
				consumer.on('message', (origin, message, meta) => {
					clearTimeout(timer);
					const result = { origin, message, meta };
					res({ result, consumer, producer });
				});
				await producer._produce(produceConfig);
				timer = setTimeout(() => {
					res({ result: false, consumer, producer });
				}, timeout);
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(e);
				res({ result: false });
			}
		});
	}

	static async createConnectorAndConnect(streamModule, config) {
		const provider = new streamModule.Provider();
		return new Promise(async (res, rej) => {
			const connector = await provider.provide(config);
			if (!connector) throw Error('CONNECTOR_NOT_CONNECTED');
			connector.on('ready', () => res(connector));
			connector.on('error', () => rej(connector));
			return connector._connect();
		});
	}
};
