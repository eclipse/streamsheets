const httpError = require('http-errors');


module.exports = class TemplateRoute {
	static templates(request, response, next) {
		const { machineRepository } = request.app.locals.RepositoryManager;
		switch (request.method) {
		case 'GET':
			machineRepository
				.getTemplates()
				.then(templates => response.status(200).json(templates))
				.catch(next);
			break;
		default:
			response.set('allow', 'GET');
			next(new httpError.MethodNotAllowed());
			break;
		}
	}
	static template(request, response, next) {
		const templateId = request.params.templateId;
		const {
			machineRepository
		} = request.app.locals.RepositoryManager;
		switch (request.method) {
		case 'GET':
			machineRepository.findTemplate(templateId)
				.then(template => response.status(200).json(template))
				.catch(next);
			break;
		case 'PUT':
			machineRepository.updateTemplate(templateId, request.body)
				.then(() => machineRepository.findTemplate(templateId))
				.then(template => response.status(200).json(template))
				.catch(next);
			break;
		default:
			response.set('allow', 'GET');
			next(new httpError.MethodNotAllowed());
			break;
		}
	}
};
