const sdk = require('@cedalo/sdk-streams');
const AMPQConnector = require('./AMPQConnector');

module.exports = class AMPQProducer extends sdk.ProducerMixin(AMPQConnector) {
	constructor(config) {
		super({ ...config, type: sdk.Connector.TYPE.PRODUCER });
	}

	async produce(config) {
		const {
			message
		} = config;
		const conf = Object.assign({}, config, this.config);
		const {
			exchangeName = '',
			exchangeType = 'topic',
			routingKey = '', // queue when exchange = ''
			properties = {},
			headers = {}
		} = conf;
		let error; // TODO: validate
		error = typeof exchangeName !== 'string';
		error = error && typeof exchangeType !== 'string';
		if (error) {
			this.handleErrorOnce(new Error(error));
			return Promise.reject();
		}
		if (this.connected) {
			const options = {
				...properties,
				headers: {
					...headers
				}
			};
			const content = Buffer.from(message);
			try {
				await this.channel.publish(exchangeName, routingKey, content, options);
			} catch (e) {
				this.handleErrorOnce(e);
			}
		} else {
			this.handleErrorOnce(
				new Error('Cannot publish as client is not connected yet')
			);
			return Promise.reject();
		}
		return Promise.resolve();
	}

	async request(/* config */) {
		// TODO: implement
		return true;
	}

};
