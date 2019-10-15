const httpError = require('http-errors');
const Auth = require('../../Auth');
const CONFIG = require('../../config').get('auth');
const logger = require('@cedalo/logger').create({ name: 'AuthRoutes' });

module.exports = class AuthRoutes {
	static async logout(request) {
		request.logout();
		request.session.destroy();
		request.redirect(process.env.STREAMSHEETS_REDIRECT_LOGOUT_URL || CONFIG.redirectLogoutUrl);
	}

	static async login(request, response, next) {
		const { userRepository } = request.app.locals.RepositoryManager;
		const { encryption } = request.app.locals;
		switch (request.method) {
			case 'POST':
				try {
					const { username, password } = request.body;
					const hash = await userRepository.getPassword(username);
					const valid = await encryption.verify(hash, password);
					if (!valid) {
						logger.info('Login failed: Invalid password');
						response.status(403).json({ error: 'LOGIN_FAILED' });
					} else {
						const user = await userRepository.findUserByUsername(username);
						const token = Auth.getToken(user);
						response.status(200).json({ token, user });
					}
				} catch (error) {
					if(error.code === 'USER_NOT_FOUND'){
						logger.info('Login failed: Invalid username');
						response.status(403).json({ error: 'LOGIN_FAILED' });
					} else {
						logger.error(error);
						response.status(500).end();
					}
				}
				break;
			default:
				response.set('allow', 'GET,POST');
				next(new httpError.MethodNotAllowed());
				break;
		}
	}
};
