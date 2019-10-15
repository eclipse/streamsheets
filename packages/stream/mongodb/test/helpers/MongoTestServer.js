const { MongoMemoryServer } = require('mongodb-memory-server');

class MongoTestServer {
	constructor(opts) {
		this.opts = opts;
	}

	async start() {
		this.server = new MongoMemoryServer({
			autoStart: false,
			debug: true,
			...this.opts
		});
		this.uri = await this.server.getConnectionString();
		this.port = await this.server.getPort();
		this.dbPath = await this.server.getDbPath();
		this.dbName = await this.server.getDbName();
	}

	async stop() {
		return this.server.stop()
	}

	getInfo() {
		return this.server.getInstanceInfo();

	}
}

module.exports = MongoTestServer;
