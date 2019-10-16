const { Connector } = require('@cedalo/sdk-streams');
const { RESTClient } = require('@cedalo/rest-server-core');

module.exports = class RestClientConnector extends Connector {
	constructor(config) {
		super(config);
		this._restClient = new RESTClient();
	}

	async connect() {
		this.setConnected();
	}

	async dispose() {
		// do nothing
	}
	
};
