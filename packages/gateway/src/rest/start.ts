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
