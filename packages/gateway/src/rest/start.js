const http = require('http');
const config = require('../config');
const DefaultApp = require('./DefaultApp');
// eslint-disable-next-line
const pkg = require('../../../package.json');

process.title = pkg.name;

config.basedir = __dirname;

http.globalAgent.maxSockets = 16384;
http.globalAgent.options.agent = false;

async function start(globalContext) {
	const app = new DefaultApp(pkg, config, globalContext);
	await app.installMiddlewares();
	return app.start();
}

module.exports = start;