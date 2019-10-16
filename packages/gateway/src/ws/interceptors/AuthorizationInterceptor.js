const Interceptor = require('./Interceptor');

const REJECT_ALL = false;

module.exports = class AuthorizationInterceptor extends Interceptor {

	beforeSendToClient(context) {
		return REJECT_ALL ? Promise.reject(new Error('Unknown user')) : Promise.resolve(context);
	}

	beforeSendToServer(context) {
		return this.validateUserRequest(context);
	}

	validateUserRequest(context) {
		return (REJECT_ALL || !context.user) ? Promise.reject(new Error('Unknown user')) : Promise.resolve(context);
	}
};
