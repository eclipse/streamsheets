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
const fs = require('fs');
const os = require('os');
const mkdirp = require('mkdirp');
const path = require('path');
const util = require('util');
const http = require('http');
const https = require('https');
const compress = require('compression');
const Express = require('express');
const Error = require('./error/Error');
const morgan = require('morgan');
// const bodyParser = require('body-parser');
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'rest-server-core',
	process.env.STREAMSHEETS_LOG_LEVEL
);
const APIRouter = require('./APIRouter');
const WebpageRouter = require('./WebpageRouter');
const ImageRouter = require('./ImageRouter');

module.exports = class DefaultApp {
	constructor(pkg, config) {
		this._server = null;

		const debug = util.debuglog(pkg.name);
		/* ===== Define app ===== */
		const app = new Express();

		/* ===== Define locals ===== */
		app.locals = {
			basedir: config.basedir,
			pkg,
			logger: debug
		};

		app.locals.requestHandler = config.requestHandler;

		/* ===== Define log stream ===== */
		const logdir = path.join(os.homedir(), '.logs');
		try {
			fs.accessSync(logdir);
		} catch (error) {
			debug(error.message);
			debug(`Creating new directory: ${logdir}`);
			mkdirp.sync(logdir);
		}
		const access = fs.createWriteStream(
			path.join(logdir, 'access.log'),
			{ flags: 'a' }
		);
		app.use(morgan('combined', { stream: access }));

		/* ===== Enable CORS ===== */
		app.use((request, response, next) => {
			response.header('Access-Control-Allow-Origin', '*');
			response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
			next();
		});

		/* ===== Compression ===== */
		app.use(compress({ threshold: 32, chunkSize: 16 * 1024 }));

		/* ===== Body parser ===== */
		// app.use(bodyParser());

		/* ===== Routes ===== */
		const apiRouter = new APIRouter();
		app.use('/api', apiRouter);
		app.use('/request', apiRouter);
		const webpageRouter = new WebpageRouter();
		app.use('/webpage', webpageRouter);
		const imageRouter = new ImageRouter();
		app.use('/images', imageRouter);

		/* ===== Error handling ===== */
		app.use(Error.logger);
		app.use(Error.renderer);

		/* ===== Static ===== */
		app.use(Express.static(path.join(__dirname, 'public')));

		/* ===== Class properties ===== */
		this.app = app;
		this.config = config;
	}

	start() {
		return new Promise((resolve, reject) => {
			const ipaddress = this.config.http.ipaddress;
			const port = this.config.http.port;

			if (this.config.http.secure) {
				const keyFile = path.join(this.config.basedir, 'config', 'certs', this.config.http.key);
				const certFile = path.join(this.config.basedir, 'config', 'certs', this.config.http.cert);
				if (!fs.existsSync(keyFile) || !fs.existsSync(certFile)) {
					reject(new Error('HTTP certificate file not found.'));
				}
				const options = {
					key: fs.readFileSync(keyFile),
					cert: fs.readFileSync(certFile)
				};
				this._server = https.createServer(options, this.app);
			} else {
				this._server = http.createServer(this.app);
			}
			this._server.timeout = 10000;
			this._server.listen(port, ipaddress, () => {
				// eslint-disable-next-line
				logger.info(`${this.app.locals.pkg.name} started at ${new Date()}. IP address: ${ipaddress}, port: ${port}`);
				resolve();
			});
		});
	}

	stop() {
		return new Promise((resolve /* , reject */) => {
			this._server.close();
			resolve();
		});
	}
};
