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
const { GatewayMessagingProtocol } = require('@cedalo/protocols');

const INTERSTING = [
	GatewayMessagingProtocol.MESSAGE_TYPES.USER_GET_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.USER_SAVE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.USER_SETTINGS_GET_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.USER_SETTINGS_SAVE_MESSAGE_TYPE
];

class UserPersistence {
	constructor(userRepo) {
		this._userRepo = userRepo;
	}

	async handleRequest(message, context) {
		switch (message.type) {
		case GatewayMessagingProtocol.MESSAGE_TYPES.USER_GET_MESSAGE_TYPE:
			context.result = await this._userRepo.getUserByUserId(message.userId);
			break;
		case GatewayMessagingProtocol.MESSAGE_TYPES.USER_SAVE_MESSAGE_TYPE:
			context.result = await this._userRepo.saveUser(message.user);
			break;
		case GatewayMessagingProtocol.MESSAGE_TYPES.USER_SETTINGS_GET_MESSAGE_TYPE:
			context.result = await this._userRepo.getUserSettings(message.userId);
			break;
		case GatewayMessagingProtocol.MESSAGE_TYPES.USER_SETTINGS_SAVE_MESSAGE_TYPE:
			context.result = await this._userRepo.saveUserSettings(message.userId, message.settings);
			break;
		default:
			return Promise.resolve(context);
		}
		return Promise.resolve(context);
	}

	handleServerResponse(response, context /* , err */) {
		return Promise.resolve(context);
	}

	hasInterestOn(message) {
		return INTERSTING.includes(message.type);
	}
}

module.exports = UserPersistence;
