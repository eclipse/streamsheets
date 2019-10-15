const httpError = require('http-errors');

module.exports = class MetaInformationRoutes {
	static getMetaInformation(request, response, next) {
		const { gatewayService } = request.app.locals;
		switch (request.method) {
		case 'GET':
			response.status(200).json(gatewayService.services);
			break;
		default:
			response.set('allow', 'GET');
			next(new httpError.MethodNotAllowed());
			break;
		}
	}
};
