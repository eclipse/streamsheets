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
const httpError = require('http-errors');
const Auth = require('../../Auth').default;
const CONFIG = require('../../config').get('auth');
const logger = require('@cedalo/logger').create({ name: 'AuthRoutes' });

const validatePath = async (pathname = '', machineRepository) => {
	const parts = pathname.split('/');
	const path = parts[parts.length - 2];
	// next to last must be shared-machine
	if (path === 'shared-machine') {
		const id = parts[parts.length - 1];
		const link = await machineRepository.getSharedLink({ id });
		return link && link.machineId;
	}
	return false;
};

module.exports = class AuthRoutes {
	static async logout(request) {
		request.logout();
		request.session.destroy();
		request.redirect(process.env.STREAMSHEETS_REDIRECT_LOGOUT_URL || CONFIG.redirectLogoutUrl);
	}

	static async login(request, response, next) {
		const { login } = request.app.locals.globalContext;
		switch (request.method) {
			case 'POST':
				{
					const { username, password } = request.body;
					try {
						const user = await login(request.app.locals.globalContext, username, password);
						const token = Auth.getToken(user);
						response.status(200).json({ token, user });
					} catch (error) {
						if (error.message === 'INVALID_CREDENTIALS') {
							response.status(403).json({ error: 'LOGIN_FAILED' });
						}
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

	static async pathLogin(request, response, next) {
		const { sharedMachineRepo } = request.app.locals.globalContext;
		switch (request.method) {
			case 'POST':
				try {
					const { pathname } = request.body;
					const machineId = await validatePath(pathname, sharedMachineRepo);
					
					if (machineId) {
						const machine = await request.app.locals.globalContext.machineRepo.findMachine(machineId);
						const user = {
							id: 'sharedmachine',
							username: 'sharedmachine',
							scopes: [{ id: machine.scope.id, role: 'viewer' }],
							settings: {
								locale: 'en'
							},
							machineId
						};
						const token = Auth.getToken(user);
						response.status(200).json({ token, user });
					} else {
						response.status(403).json({ error: 'LOGIN_FAILED' });
					}
				} catch (error) {
					if (error.code === 'USER_NOT_FOUND') {
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
