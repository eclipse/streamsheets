const sdk = require('@cedalo/sdk-streams');
const { dropConnection, createConnection } = require('./ConnectionsPool');

module.exports = class AMPQConnector extends sdk.Connector {
	constructor(consumerConfig) {
		super(consumerConfig);
		this.connection = null;
		this.channel = null;
	}

	async connect() {
		const { uri = '' } = this.config.connector;
		// TODO: validate uri
		const socketOptions = undefined;
		try {
			this.connection = await createConnection(uri, socketOptions);
			this.channel = await this.connection.createChannel();
			this.setConnected();
			this.registerDefaultListeners();
		} catch (e) {
			this.handleError(e);
		}
	}

	registerDefaultListeners() {
		this.channel.on('error', async (error) => {
			this.handleError(error);
			this.channel.end(true);
		});
		// this.channel.on('close', this.onClose);
	}

	async dispose() {
		try {
			if (this.channel) {
				await this.channel.close();
				this.channel = null;
			}
			if (this.connection) {
				await dropConnection(this.url);
				this.connection = null;
			}
		} catch (e) {
			this.logger.error(e.message);
		}
	}
};
