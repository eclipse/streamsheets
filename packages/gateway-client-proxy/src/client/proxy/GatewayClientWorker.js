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
const { WebGatewayClient } = require('@cedalo/gateway-client');

const defaultListener = (event) => {
	const eventMessage = {
		type: 'event',
		event
	};
	postMessage(eventMessage);
};
const gatewayClient = new WebGatewayClient({
	name: 'Web Worker Gateway Client',
	defaultListener
});
// eslint-disable-next-line
onmessage = async (event) => {
	const { method, args = [], requestId } = event.data;
	let response = null;
	try {
		const result = await gatewayClient[method](...args);
		response = {
			type: 'response',
			requestId,
			result
		};
	} catch (error) {
		response = {
			type: 'error',
			requestId,
			error
		};
	}
	postMessage(response);
};
