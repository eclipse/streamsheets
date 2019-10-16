const httpError = require('http-errors');

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
