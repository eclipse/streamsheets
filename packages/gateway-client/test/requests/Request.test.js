
'use strict';

const { Request } = require('../..');

describe('Request', () => {
	describe('send()', () => {
		it('should be overridden by subclasses', () => {
			const request = new Request();
			return request.send()
				.catch(error => expect(error).toBeDefined());
		});
	});
});
