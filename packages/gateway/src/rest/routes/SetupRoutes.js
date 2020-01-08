const fs = require('fs');
const path = require('path');

const httpError = require('http-errors');

const INIT_DIRECTORY = path.join(__dirname, '..', 'config');

const getInitJSON = (initDirectory) => {
	const initJSON = {
		machines: [],
		streams: []
	};
	try {
		const files = fs.readdirSync(initDirectory);
		files.forEach(file => {
			json = JSON.parse(fs.readFileSync(path.join(initDirectory, file)).toString());
			if (json.machines) {
				initJSON.machines = [...initJSON.machines, ...json.machines];
			}
			if (json.streams) {
				initJSON.streams = [...initJSON.streams, ...json.streams];
			}
		});
	} catch (error) {
		/* ignore */
	}
	return initJSON;
}


module.exports = class SetupRoutes {
	static async getSetup(request, response, next) {
		const { configurationRepository } = request.app.locals.RepositoryManager;
		switch (request.method) {
		case 'GET': {
			const setup = await configurationRepository.getSetup();
			response.status(200).json(setup);
			break;
		}
		case 'POST': {
			const setupToSave = request.body;
			try {
				await request.app.locals.RepositoryManager.populateDatabases(getInitJSON(INIT_DIRECTORY));
				await configurationRepository.saveSetup(setupToSave);
				await response.status(201).json(setupToSave);
			} catch(error) {
				await response.status(400).json({
					error: 'Could not save setup configuration.'
				});
			}
			break;
		}
		default:
			response.set('allow', 'GET', 'POST');
			next(new httpError.MethodNotAllowed());
			break;
		}
	}
};
