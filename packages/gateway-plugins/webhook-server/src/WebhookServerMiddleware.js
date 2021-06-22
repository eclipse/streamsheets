const Express = require('express');
const IdGenerator = require('@cedalo/id-generator');
const { Utils } = require('@cedalo/sdk-streams');
const httpError = require('http-errors');
const { PLUGIN_ID, getWebhookServer, BASE_PATH } = require('./WebhookServer');


const buildMessage = (request, response, next) => {
	request.message = {};
	switch (request.method) {
		case 'GET':
			if (request.query.json) {
				request.query.json = JSON.parse(decodeURIComponent(request.query.json));
			}
			request.message = request.query;
			break;
		case 'POST':
		case 'PUT':
		case 'PATCH':
			request.message = Utils.transformToJSONObject(request.body, request.get('Content-Type'));
			break;
		case 'DELETE':
		case 'HEAD':
		case 'OPTIONS':
		case 'TRACE':
			break;
		default:
			response.set('allow', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, TRACE');
			next(new httpError.MethodNotAllowed());
			break;
	}
	next();
};

const init = (globalContext) => {
	const loadMachine = async (request, response, next) => {
		const [machine] = await globalContext.machineRepo.findMachines({
			[`extensionSettings.${PLUGIN_ID}.id`]: request.params.id
		});
		const webhookServer = getWebhookServer(machine, false);
		if (!machine || !webhookServer || !webhookServer.enabled) {
			return response.status(400).json({ type: 'error', message: 'Invalid ID' });
		}
		if (machine.state === 'stopped') {
			return response.status(503).json({ type: 'error', message: 'App is not running' });
		}
		request.target = { id: machine.id, webhookServer };
		return next();
	};
	const handleRequest = async (request, response) => {
		try {
			const requestId = IdGenerator.generate();
			const metadata = {
				requestId,
				method: request.method,
				transportDetails: {
					clientIP: request.ip,
					headers: request.headers
				}
			};
			globalContext.machineServiceProxy.addInboxMessage(
				request.target.id,
				request.target.webhookServer.streamsheetId,
				request.message,
				metadata
			);
			const result = {
				body: {
					message: 'Request handled'
				},
				headers: {},
				statusCode: 200
			};

			response
				.set(result.headers)
				.status(result.statusCode)
				.json(result.body);
		} catch (error) {
			response.status(400).send(error.message);
		}
	};
	const app = new Express();
	app.all(
		`${BASE_PATH}/:id`,
		loadMachine,
		Express.urlencoded({ extended: true, limit: '1mb' }),
		Express.json({ extended: true, limit: '1mb' }),
		Express.raw({ type: '*/*', limit: '1mb' }),
		buildMessage,
		handleRequest
	);

	return app;
};

module.exports = {
	init
};
