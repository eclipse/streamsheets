const { Connector } = require('@cedalo/sdk-streams');
const smtp = require('./smtp');

module.exports = class SmtpConnector extends Connector {

	constructor(config) {
		super(config);
		this._smtp = null;
		this.currentConfig = null;
	}

	async connect() {
		try {
			if (!this.config.connector.host) {
				throw new Error('No host specified');
			}
			this._smtp = await smtp.create(this.config);
			this.setConnected();
		} catch (e) {
			this.handleError(e);
			await this.dispose();
		}
	}

	async dispose() {
		if (this._smtp) {
			this._smtp.dispose();
			this._smtp = null;
		}
	}

};
