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
const http = require('http');
const https = require('https');
const mkdirp = require('mkdirp');
const path = require('path');
const util = require('util');
const compress = require('compression');
const Express = require('express');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GraphQLServer } = require('../graphql/GraphQLServer');
// const swaggerMiddleware = require('swagger-express-middleware');

// const pSwaggerMiddleware = util.promisify(swaggerMiddleware);

const logger = require('../utils/logger').create({ name: 'DefaultApp' });

const APIRouter = require('./APIRouter');
const APIRouterRepositoryServer = require('./APIRouterRepositoryServer');
const Error = require('./error/Error');
const Auth = require('../Auth').default;

module.exports = class DefaultApp {
	constructor(pkg, config, globalContext) {
		const debug = util.debuglog(pkg.name);
		/* ===== Define app ===== */
		const app = new Express();

		/* ===== Define locals ===== */
		app.locals = {
			basedir: config.basedir,
			pkg,
			logger: debug,
			config
		};

		app.locals.gatewayService = globalContext.gatewayService;
		app.locals.RepositoryManager = globalContext.repositories;
		app.locals.encryption = globalContext.encryption;
		app.locals.globalContext = globalContext;

		/* ===== Class properties ===== */
		this.app = app;
		this.config = config;
		this.globalContext = globalContext;
		this.db = null;
	}

	async installMiddlewares() {
		const app = this.app;
		const debug = app.locals.logger;

		/* ===== Define log stream ===== */
		const logdir = path.join(os.homedir(), '.logs');
		try {
			fs.accessSync(logdir);
		} catch (error) {
			debug(error.message);
			debug(`Creating new directory: ${logdir}`);
			mkdirp.sync(logdir);
		}
		const access = fs.createWriteStream(path.join(logdir, 'access.log'), { flags: 'a' });
		app.use(morgan('combined', { stream: access }));

		// const swaggerSpecPath = process.env.SWAGGER_SPEC_PATH || './src/public/swagger-spec/v1.0/gateway.yaml';
		// const middleware = await pSwaggerMiddleware(swaggerSpecPath, app);

		// It is very important to have the body parser with the limit
		// initialized before the other middleware calls, because
		// otherwise the limit for the request body is not recognized.
		/* ===== Body parser ===== */
		// app.use(
		// 	bodyParser.urlencoded({
		// 		limit: 50000000,
		// 		extended: true
		// 	})
		// );
		// app.use(
		// 	bodyParser.json({
		// 		limit: 50000000,
		// 		type: 'application/json'
		// 	})
		// );

		// app.use(
		// 	middleware.metadata(),
		// 	middleware.CORS(),
		// 	middleware.parseRequest(),
		// 	middleware.validateRequest()
		// );

		// TODO: remove in prod
		// fixed delay to not get fooled by loopback / fast connection
		if (!process.env.NODE_ENV === 'PRODUCTION' || !process.env.NODE_ENV === 'PROD') {
			app.use((request, response, next) => {
				setTimeout(next, 200);
			});
		}

		/* ===== Enable CORS ===== */
		app.use((request, response, next) => {
			response.header('Access-Control-Allow-Origin', '*');
			response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
			next();
		});

		/* ===== Compression ===== */
		app.use(compress({ threshold: 32, chunkSize: 16 * 1024 }));

		// Authentication configuration
		app.use(
			session({
				secret: 'keyboard cat',
				resave: false,
				saveUninitialized: true
			})
		);

		/* ===== Authentication ===== */
		app.use(Auth.initialize(this.globalContext));
		app.use(passport.session());

		/* ===== CORS ===== */
		app.use(cors());

		const router = new APIRouter();
		app.use('/api/v1.0/auth', router);
		app.use('/api/v1.0/newsletter', router);
		app.use('/api/v1.0/services', router);
		app.use('/api/v1.0/meta', router);
		app.use('/api/v1.0/config', router);
		Object.values(this.globalContext.middleware).forEach((mw) => app.use(...mw));
		/* ===== Graph QL ===== */
		app.use('/api/v1.0/graphql', (req, res, next) => {
			passport.authenticate('jwt', { session: false }, async (err, user) => {
				if (user) {
					try {
						const actor = await app.locals.globalContext.getActor(app.locals.globalContext, { user });
						if (!actor) {
							res.status(403).json({ error: 'Not authenticated' });
						}
						req.user = actor;
						next();
					} catch (e) {
						res.status(403).json({ error: 'Not authenticated' });
					}
				} else {
					res.status(403).json({ error: 'Not authenticated' });
				}
			})(req, res, next);
		});

		const getSession = (req) => ({ user: req.user });

		GraphQLServer.init(
			app,
			'/api/v1.0/graphql',
			(req) => this.globalContext.getRequestContext(this.globalContext, getSession(req)),
			this.globalContext.graphql
		);

		const routerRepository = new APIRouterRepositoryServer();
		app.use('/api/v1.0', routerRepository);

		/* ===== Body parser ===== */
		app.use(
			bodyParser.urlencoded({
				limit: 50000000,
				extended: true
			})
		);
		app.use(
			bodyParser.json({
				limit: 50000000,
				type: 'application/json'
			})
		);

		/* ===== Error handling ===== */
		app.use(Error.logger);
		app.use(Error.renderer);
		/* ===== Static ===== */
		const publicPath = path.join(__dirname, '..', '..', '..', 'public');
		app.use(Express.static(publicPath));
		const indexHtmlPath = path.join(publicPath, 'index.html')
		app.use((req, res) => res.sendFile(indexHtmlPath));
	}

	async start() {
		this.app.locals.db = this.db;
		const { secure, port, ipaddress } = this.config.get('http');
		let server;
		if (secure) {
			server = https.createServer(
				{
					key: fs.readFileSync('./config/server.key'),
					cert: fs.readFileSync('./config/server.cert')
				},
				this.app
			);
		} else {
			server = http.createServer(this.app);
		}
		server.timeout = 10000;
		return new Promise((resolve) => {
			server.listen(port, ipaddress, () => {
				const name = this.app.locals.pkg.name;
				logger.info(`${name} started at ${new Date()}. IP address: ${ipaddress}, port: ${port}`);
				resolve(server);
			});
		});
	}
};
