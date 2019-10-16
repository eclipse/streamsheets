
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
