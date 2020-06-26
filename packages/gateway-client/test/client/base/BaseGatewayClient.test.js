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

'use strict';

const GatewayClient = require('../../../src/client/base/BaseGatewayClient');

describe('BaseGatewayClient', () => {
	describe('_connectSocketServer()', () => {
		it('should be overridden by subclasses', () => {
			const client = new GatewayClient({ name: 'Test machine client' });
			return client._connectSocketServer('URL')
				.catch(error => expect(error).toBeDefined());
		});
	});
});
