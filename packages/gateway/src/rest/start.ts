import http from 'http';
import * as config from '../config';
import DefaultApp from './DefaultApp';
import { GlobalContext } from '../..';
// eslint-disable-next-line
const pkg = require('../../../package.json');

process.title = pkg.name;

config.basedir = __dirname;

http.globalAgent.maxSockets = 16384;

export async function start(globalContext: GlobalContext): Promise<http.Server> {
	const app = new DefaultApp(pkg, config, globalContext);
	await app.installMiddlewares();
	return app.start();
}
