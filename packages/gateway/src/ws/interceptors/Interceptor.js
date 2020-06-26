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
// resolves or rejects the request
// in both direction from client and to client...
module.exports = class Interceptor {

	// eslint-disable-next-line
	// beforeSendToClient(context) {
	// 	return Promise.reject(new Error('Cannot call abstract Interceptor#sendToClient()!!'));
	// }

	// // eslint-disable-next-line
	// beforeSendToServer(context) {
	// 	return Promise.reject(new Error('Cannot call abstract Interceptor#sendToServer()!!'));
	// }
};
