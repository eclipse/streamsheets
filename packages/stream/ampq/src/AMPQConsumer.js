const sdk = require('@cedalo/sdk-streams');
const AMPQConnector = require('./AMPQConnector');

module.exports = class AMPQConsumer extends sdk.ConsumerMixin(AMPQConnector) {
	constructor(config) {
		super({ ...config, type: sdk.Connector.TYPE.CONSUMER });
	}

	async initialize() {
		const {
			queue = '',
			noAck = false,
			exclusive = false,
			assertQueue = false
		} = this.config;
		const options = {
			consumerTag: this.id,
			noAck,
			noLocal: false,
			exclusive
			// priority,
			// arguments
		};
		if (this.channel) {
			if (assertQueue) {
				const ok = await this.channel.assertQueue(queue, options);
				if (!ok) {
					this.handleErrorOnce(new Error('Queue not ready'));
				}
			}
			this.channel.consume(queue, (msg) => {
				const {
					content,
					fields = {},
					properties = {}
				} = msg;
				this.logger.info(`ampq msg ${Buffer.from(content)}`);
				this.onMessage(queue, content, {
					...properties,
					fields
				});
			}, options);
		}
	}
};
